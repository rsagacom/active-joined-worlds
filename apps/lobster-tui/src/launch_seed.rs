use std::time::{Duration, SystemTime, UNIX_EPOCH};

use super::{
    AgentSceneSlot, AgentScope, AgentUseCase, ClientProfile, Conversation, ConversationId,
    ConversationKind, ConversationScope, LaunchSurface, PixelAvatarProfile, SceneLandmark,
    SceneMetadata, SceneRenderStyle, SceneScope,
};
use chat_core::IdentityId;
use chat_core::canonical_direct_conversation_id;
use transport_waku::WakuFrameCodec;

pub(crate) fn current_time_ms() -> Result<i64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("read system time failed: {error}"))
        .map(|duration| duration.as_millis() as i64)
}

fn user_launch_identity() -> String {
    std::env::var("LOBSTER_TUI_RESIDENT_ID")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "tiyan".into())
}

pub(crate) fn launch_identity(mode: LaunchSurface) -> String {
    match mode {
        LaunchSurface::Admin | LaunchSurface::World => "rsaga".into(),
        LaunchSurface::Direct => user_launch_identity(),
        LaunchSurface::User => user_launch_identity(),
    }
}

pub(crate) fn direct_conversation(a: &str, b: &str) -> ConversationId {
    canonical_direct_conversation_id(&IdentityId(a.into()), &IdentityId(b.into()))
}

fn direct_topic(a: &str, b: &str) -> String {
    WakuFrameCodec::content_topic_for(&direct_conversation(a, b))
}

pub(crate) fn launch_conversation(mode: LaunchSurface) -> Conversation {
    match mode {
        LaunchSurface::User => {
            let resident_id = user_launch_identity();
            Conversation {
                conversation_id: ConversationId("room:city:core-harbor:lobby".into()),
                kind: ConversationKind::Room,
                scope: ConversationScope::CityPublic,
                scene: None,
                content_topic: "/lobster-chat/1/conversation/room:city:core-harbor:lobby".into(),
                participants: vec![
                    IdentityId(resident_id),
                    IdentityId("rsaga".into()),
                    IdentityId("builder".into()),
                ],
                created_at_ms: 1_000,
                last_active_at_ms: 1_000,
            }
        }
        LaunchSurface::Admin => Conversation {
            conversation_id: ConversationId("room:city:aurora-hub:announcements".into()),
            kind: ConversationKind::Room,
            scope: ConversationScope::CityPrivate,
            scene: None,
            content_topic: "/lobster-chat/1/conversation/room:city:aurora-hub:announcements".into(),
            participants: vec![
                IdentityId("rsaga".into()),
                IdentityId("builder".into()),
                IdentityId("system".into()),
            ],
            created_at_ms: 1_000,
            last_active_at_ms: 1_000,
        },
        LaunchSurface::World => Conversation {
            conversation_id: ConversationId("room:world:lobby".into()),
            kind: ConversationKind::Room,
            scope: ConversationScope::CrossCityShared,
            scene: None,
            content_topic: "/lobster-chat/1/conversation/room:world:lobby".into(),
            participants: vec![
                IdentityId("rsaga".into()),
                IdentityId("builder".into()),
                IdentityId("system".into()),
            ],
            created_at_ms: 1_000,
            last_active_at_ms: 1_000,
        },
        LaunchSurface::Direct => {
            let resident_id = user_launch_identity();
            Conversation {
                conversation_id: direct_conversation(&resident_id, "guide"),
                kind: ConversationKind::Direct,
                scope: ConversationScope::Private,
                scene: Some(SceneMetadata {
                    scope: SceneScope::DirectRoom,
                    render_style: SceneRenderStyle::SfcPixel,
                    title_banner: Some("夜航居所".into()),
                    background_preset: "cozy-terminal-loft".into(),
                    ambiance: "木地板、沙发与暖灯的居所直连".into(),
                    owner_editable: true,
                    avatar_editable: true,
                    primary_avatar: Some(PixelAvatarProfile {
                        avatar_id: format!("avatar:{resident_id}"),
                        display_name: "居所领航者".into(),
                        archetype: "pixel-resident".into(),
                        palette_hint: "amber-night".into(),
                        accessory_hint: Some("围巾".into()),
                    }),
                    assistant_slots: vec![
                        AgentSceneSlot {
                            slot_id: "room-caretaker".into(),
                            display_name: "居所助手".into(),
                            scope: AgentScope::Room,
                            use_cases: vec![AgentUseCase::Caretaking],
                            appearance_hint: "pixel-room-caretaker".into(),
                            can_leave_messages: true,
                            can_edit_scene: false,
                            can_trade_goods: false,
                        },
                        AgentSceneSlot {
                            slot_id: "room-decorator".into(),
                            display_name: "居所整理助手".into(),
                            scope: AgentScope::Room,
                            use_cases: vec![AgentUseCase::Decoration],
                            appearance_hint: "pixel-room-decorator".into(),
                            can_leave_messages: true,
                            can_edit_scene: true,
                            can_trade_goods: false,
                        },
                    ],
                    landmarks: vec![
                        SceneLandmark {
                            slot_id: "desk".into(),
                            label: "居所会客桌".into(),
                            sprite_hint: "desk-crt".into(),
                            interaction_hint: "查看直连任务与草稿".into(),
                        },
                        SceneLandmark {
                            slot_id: "sofa".into(),
                            label: "居所沙发".into(),
                            sprite_hint: "cozy-sofa".into(),
                            interaction_hint: "进入居所氛围区".into(),
                        },
                    ],
                }),
                content_topic: direct_topic(&resident_id, "guide"),
                participants: vec![IdentityId(resident_id), IdentityId("guide".into())],
                created_at_ms: 1_000,
                last_active_at_ms: 1_000,
            }
        }
    }
}

pub(crate) fn launch_companion_conversations(mode: LaunchSurface) -> Vec<Conversation> {
    match mode {
        LaunchSurface::User => {
            let resident_id = user_launch_identity();
            vec![
                Conversation {
                    conversation_id: direct_conversation(&resident_id, "guide"),
                    kind: ConversationKind::Direct,
                    scope: ConversationScope::Private,
                    scene: None,
                    content_topic: direct_topic(&resident_id, "guide"),
                    participants: vec![IdentityId(resident_id.clone()), IdentityId("guide".into())],
                    created_at_ms: 1_000,
                    last_active_at_ms: 1_000,
                },
                Conversation {
                    conversation_id: ConversationId("room:world:lobby".into()),
                    kind: ConversationKind::Room,
                    scope: ConversationScope::CrossCityShared,
                    scene: None,
                    content_topic: "/lobster-chat/1/conversation/room:world:lobby".into(),
                    participants: vec![
                        IdentityId(resident_id),
                        IdentityId("builder".into()),
                        IdentityId("system".into()),
                    ],
                    created_at_ms: 1_000,
                    last_active_at_ms: 1_000,
                },
            ]
        }
        LaunchSurface::Admin => vec![
            Conversation {
                conversation_id: direct_conversation("rsaga", "builder"),
                kind: ConversationKind::Direct,
                scope: ConversationScope::Private,
                scene: None,
                content_topic: direct_topic("rsaga", "builder"),
                participants: vec![
                    IdentityId(user_launch_identity()),
                    IdentityId("builder".into()),
                ],
                created_at_ms: 1_000,
                last_active_at_ms: 1_000,
            },
            Conversation {
                conversation_id: ConversationId("room:world:lobby".into()),
                kind: ConversationKind::Room,
                scope: ConversationScope::CrossCityShared,
                scene: None,
                content_topic: "/lobster-chat/1/conversation/room:world:lobby".into(),
                participants: vec![
                    IdentityId("rsaga".into()),
                    IdentityId("builder".into()),
                    IdentityId("system".into()),
                ],
                created_at_ms: 1_000,
                last_active_at_ms: 1_000,
            },
        ],
        LaunchSurface::World => vec![
            Conversation {
                conversation_id: ConversationId("room:city:core-harbor:lobby".into()),
                kind: ConversationKind::Room,
                scope: ConversationScope::CityPublic,
                scene: None,
                content_topic: "/lobster-chat/1/conversation/room:city:core-harbor:lobby".into(),
                participants: vec![
                    IdentityId("rsaga".into()),
                    IdentityId("builder".into()),
                    IdentityId("system".into()),
                ],
                created_at_ms: 1_000,
                last_active_at_ms: 1_000,
            },
            Conversation {
                conversation_id: direct_conversation("rsaga", "builder"),
                kind: ConversationKind::Direct,
                scope: ConversationScope::Private,
                scene: None,
                content_topic: direct_topic("rsaga", "builder"),
                participants: vec![IdentityId("rsaga".into()), IdentityId("builder".into())],
                created_at_ms: 1_000,
                last_active_at_ms: 1_000,
            },
        ],
        LaunchSurface::Direct => vec![
            Conversation {
                conversation_id: ConversationId("room:city:core-harbor:lobby".into()),
                kind: ConversationKind::Room,
                scope: ConversationScope::CityPublic,
                scene: None,
                content_topic: "/lobster-chat/1/conversation/room:city:core-harbor:lobby".into(),
                participants: vec![
                    IdentityId("rsaga".into()),
                    IdentityId("builder".into()),
                    IdentityId("system".into()),
                ],
                created_at_ms: 1_000,
                last_active_at_ms: 1_000,
            },
            Conversation {
                conversation_id: ConversationId("room:world:lobby".into()),
                kind: ConversationKind::Room,
                scope: ConversationScope::CrossCityShared,
                scene: None,
                content_topic: "/lobster-chat/1/conversation/room:world:lobby".into(),
                participants: vec![
                    IdentityId("rsaga".into()),
                    IdentityId("builder".into()),
                    IdentityId("system".into()),
                ],
                created_at_ms: 1_000,
                last_active_at_ms: 1_000,
            },
        ],
    }
}

pub(crate) fn seed_messages_for_conversation(
    conversation_id: &ConversationId,
    now_ms: i64,
) -> Vec<(String, ClientProfile, String, i64)> {
    match conversation_id.0.as_str() {
        "room:city:core-harbor:lobby" => vec![
            (
                "system".into(),
                ClientProfile::desktop_terminal(),
                "欢迎来到第一城大厅，先把公共频道聊顺，再慢慢补齐城主府和居民区动静。".into(),
                now_ms - Duration::from_secs(48 * 60 * 60).as_millis() as i64,
            ),
            (
                "builder".into(),
                ClientProfile::lobster_embedded(),
                "先把城主府、居民区和传送阵摆顺，世界词再往后放。".into(),
                now_ms - Duration::from_secs(65 * 60).as_millis() as i64,
            ),
        ],
        "room:city:aurora-hub:announcements" => vec![
            (
                "system".into(),
                ClientProfile::desktop_terminal(),
                "城主告示先守回声，城务动作挂在侧边就好。".into(),
                now_ms - Duration::from_secs(24 * 60 * 60).as_millis() as i64,
            ),
            (
                "builder".into(),
                ClientProfile::desktop_terminal(),
                "后面再补护阵、镜像和裁牌簿，首屏先守住城内回声。".into(),
                now_ms - Duration::from_secs(50 * 60).as_millis() as i64,
            ),
        ],
        "room:world:lobby" => vec![
            (
                "system".into(),
                ClientProfile::desktop_terminal(),
                "回声壳在线，先把门牌走顺，再展开世界目录。".into(),
                now_ms - Duration::from_secs(48 * 60 * 60).as_millis() as i64,
            ),
            (
                "builder".into(),
                ClientProfile::lobster_embedded(),
                "本地航路已连上，回声可以先顺着流转。".into(),
                now_ms - Duration::from_secs(60 * 60).as_millis() as i64,
            ),
        ],
        value
            if value
                == direct_conversation(&user_launch_identity(), "builder")
                    .0
                    .as_str() =>
        {
            let resident_id = user_launch_identity();
            vec![
                (
                    resident_id.clone(),
                    ClientProfile::desktop_terminal(),
                    "把居所落字入口做成先看门牌，再看旁侧动作。".into(),
                    now_ms - Duration::from_secs(48 * 60 * 60).as_millis() as i64,
                ),
                (
                    "builder".into(),
                    ClientProfile::lobster_embedded(),
                    "终端优先，先保证居所回声好投、好读、好找。".into(),
                    now_ms - Duration::from_secs(60 * 60).as_millis() as i64,
                ),
                (
                    "builder".into(),
                    ClientProfile::mobile_web(),
                    "网页壳继续做轻壳，真正的居所感由 TUI 承担。".into(),
                    now_ms - Duration::from_secs(10 * 60).as_millis() as i64,
                ),
            ]
        }
        value
            if value
                == direct_conversation(&user_launch_identity(), "guide")
                    .0
                    .as_str() =>
        {
            vec![
                (
                    "guide".into(),
                    ClientProfile::desktop_terminal(),
                    "先从左侧挑一块城内门牌，再把回声顺着往下读。".into(),
                    now_ms - Duration::from_secs(90 * 60).as_millis() as i64,
                ),
                (
                    "guide".into(),
                    ClientProfile::mobile_web(),
                    "看到 /open 序号了吗？那就是终端里的换居所手势。".into(),
                    now_ms - Duration::from_secs(12 * 60).as_millis() as i64,
                ),
            ]
        }
        _ => Vec::new(),
    }
}

#[cfg(test)]
mod tests {
    use std::sync::{Mutex, OnceLock};

    use super::*;

    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    #[test]
    fn user_launch_identity_prefers_resident_override() {
        let _guard = env_lock().lock().unwrap();
        let previous = std::env::var_os("LOBSTER_TUI_RESIDENT_ID");
        unsafe {
            std::env::set_var("LOBSTER_TUI_RESIDENT_ID", "novel-reader");
        }

        let identity = launch_identity(LaunchSurface::User);

        match previous {
            Some(value) => unsafe { std::env::set_var("LOBSTER_TUI_RESIDENT_ID", value) },
            None => unsafe { std::env::remove_var("LOBSTER_TUI_RESIDENT_ID") },
        }

        assert_eq!(identity, "novel-reader");
    }

    #[test]
    fn user_launch_conversation_uses_resident_override_participants() {
        let _guard = env_lock().lock().unwrap();
        let previous = std::env::var_os("LOBSTER_TUI_RESIDENT_ID");
        unsafe {
            std::env::set_var("LOBSTER_TUI_RESIDENT_ID", "novel-reader");
        }

        let conversation = launch_conversation(LaunchSurface::User);

        match previous {
            Some(value) => unsafe { std::env::set_var("LOBSTER_TUI_RESIDENT_ID", value) },
            None => unsafe { std::env::remove_var("LOBSTER_TUI_RESIDENT_ID") },
        }

        assert!(
            conversation
                .participants
                .iter()
                .any(|participant| participant.0 == "novel-reader")
        );
        assert!(
            !conversation
                .participants
                .iter()
                .any(|participant| participant.0 == "tiyan")
        );
    }
}
