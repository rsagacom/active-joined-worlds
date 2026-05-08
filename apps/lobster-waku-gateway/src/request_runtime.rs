use super::*;

impl GatewayRuntime {
    pub(crate) fn handle(&mut self, request: WakuGatewayRequest) -> WakuGatewayResponse {
        use transport_waku::WakuGatewayClient;

        match request {
            WakuGatewayRequest::Connect { endpoint } => {
                let local_connect = self.node.connect_gateway(&endpoint);
                let upstream_connect = if let Some(upstream) = self.upstream_gateway.as_mut() {
                    upstream.connect_gateway(&endpoint)
                } else {
                    Ok(())
                };

                match local_connect.and(upstream_connect) {
                    Ok(()) => {
                        self.endpoint = Some(endpoint);
                        self.connection_state = WakuConnectionState::Connected;
                        WakuGatewayResponse::Connected
                    }
                    Err(message) => WakuGatewayResponse::Error { message },
                }
            }
            WakuGatewayRequest::Subscribe { subscriptions } => {
                self.set_subscriptions(subscriptions);
                WakuGatewayResponse::Subscribed
            }
            WakuGatewayRequest::Publish { frame } => match self.publish_frame_to_transport(frame) {
                Ok(()) => WakuGatewayResponse::Published,
                Err(message) => WakuGatewayResponse::Error { message },
            },
            WakuGatewayRequest::Recover {
                content_topic,
                cursor,
                limit,
            } => {
                let local_frames = self.node.recover_frames(&content_topic, &cursor, limit);
                let upstream_frames = if let Some(upstream) = self.upstream_gateway.as_ref() {
                    upstream.recover_frames(&content_topic, &cursor, limit)
                } else {
                    Ok(Vec::new())
                };
                match local_frames.and_then(|local| {
                    upstream_frames.map(|remote| Self::merge_frames(local, remote))
                }) {
                    Ok(frames) => WakuGatewayResponse::Frames { frames },
                    Err(message) => WakuGatewayResponse::Error { message },
                }
            }
            WakuGatewayRequest::Poll {
                subscriptions,
                limit,
            } => {
                if !subscriptions.is_empty() {
                    self.set_subscriptions(subscriptions);
                }

                let topics = self.subscriptions.clone();
                let mut all_frames = Vec::new();

                for subscription in topics {
                    let cursor = self
                        .cursors
                        .get(&subscription.content_topic)
                        .cloned()
                        .unwrap_or_default();
                    let local_frames = self.node.recover_frames(
                        &subscription.content_topic,
                        &cursor,
                        limit.min(self.history_limit),
                    );
                    let upstream_frames = if let Some(upstream) = self.upstream_gateway.as_ref() {
                        upstream.recover_frames(
                            &subscription.content_topic,
                            &cursor,
                            limit.min(self.history_limit),
                        )
                    } else {
                        Ok(Vec::new())
                    };
                    match local_frames.and_then(|local| {
                        upstream_frames.map(|remote| Self::merge_frames(local, remote))
                    }) {
                        Ok(frames) => {
                            self.update_cursor(&subscription.content_topic, &frames);
                            all_frames.extend(frames);
                        }
                        Err(message) => return WakuGatewayResponse::Error { message },
                    }
                }

                WakuGatewayResponse::Frames { frames: all_frames }
            }
        }
    }
}
