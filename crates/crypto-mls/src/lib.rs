use std::collections::HashMap;

use chat_core::{
    ConversationId, ConversationScope, DeviceId, IdentityId, MessageEnvelope, PayloadType,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MlsGroupKind {
    Direct,
    Room,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MlsMember {
    pub identity_id: IdentityId,
    pub device_id: Option<DeviceId>,
}

impl MlsMember {
    pub fn device(identity_id: impl Into<String>, device_id: impl Into<String>) -> Self {
        Self {
            identity_id: IdentityId(identity_id.into()),
            device_id: Some(DeviceId(device_id.into())),
        }
    }

    pub fn identity(identity_id: impl Into<String>) -> Self {
        Self {
            identity_id: IdentityId(identity_id.into()),
            device_id: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MlsGroupState {
    pub group_id: String,
    pub conversation_id: ConversationId,
    pub kind: MlsGroupKind,
    pub scope: ConversationScope,
    pub epoch: u64,
    pub members: Vec<MlsMember>,
    pub pending_rekey: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MlsWireFormat {
    /// Skeleton-only wire shape: a postcard blob that still contains the original plaintext
    /// message envelope. This keeps MLS routing/epoch plumbing testable without claiming secrecy.
    SkeletonPostcard,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MlsCiphertextEnvelope {
    pub group_id: String,
    pub conversation_id: ConversationId,
    pub epoch: u64,
    pub sender: IdentityId,
    pub sender_device: DeviceId,
    pub payload_type: PayloadType,
    pub wire_format: MlsWireFormat,
    /// Skeleton placeholder bytes only.
    ///
    /// `SkeletonPostcard` currently stores a postcard-serialized `MessageEnvelope`, so this field
    /// remains plaintext-shaped data despite the historical `ciphertext` name.
    pub ciphertext: Vec<u8>,
}

pub trait SecureSessionManager {
    fn bootstrap_direct(
        &mut self,
        conversation_id: &ConversationId,
        members: Vec<MlsMember>,
    ) -> Result<MlsGroupState, String>;
    fn bootstrap_room(
        &mut self,
        conversation_id: &ConversationId,
        scope: ConversationScope,
        members: Vec<MlsMember>,
    ) -> Result<MlsGroupState, String>;
    fn group_state(&self, conversation_id: &ConversationId) -> Option<&MlsGroupState>;
    fn current_epoch(&self, conversation_id: &ConversationId) -> Result<u64, String>;
    fn rotate_epoch(&mut self, conversation_id: &ConversationId) -> Result<u64, String>;
    fn add_member(
        &mut self,
        conversation_id: &ConversationId,
        member: MlsMember,
    ) -> Result<(), String>;
    fn remove_member(
        &mut self,
        conversation_id: &ConversationId,
        identity_id: &IdentityId,
    ) -> Result<(), String>;
    fn seal(&self, message: &MessageEnvelope) -> Result<MlsCiphertextEnvelope, String>;
    fn open(&self, envelope: &MlsCiphertextEnvelope) -> Result<MessageEnvelope, String>;
}

/// Placeholder session manager until real MLS key schedule / encryption lands.
///
/// This type keeps membership and epoch state, but `seal/open` only wrap plaintext envelopes in a
/// postcard blob so transport and storage contracts can advance before MLS secrecy is implemented.
#[derive(Debug, Default, Clone)]
pub struct SkeletonSecureSessionManager {
    groups: HashMap<ConversationId, MlsGroupState>,
}

impl SkeletonSecureSessionManager {
    pub fn new() -> Self {
        Self {
            groups: HashMap::new(),
        }
    }

    pub fn snapshot(&self) -> Vec<MlsGroupState> {
        let mut groups = self.groups.values().cloned().collect::<Vec<_>>();
        groups.sort_by_key(|group| group.conversation_id.0.clone());
        groups
    }

    pub fn restore(&mut self, groups: Vec<MlsGroupState>) {
        self.groups = groups
            .into_iter()
            .map(|group| (group.conversation_id.clone(), group))
            .collect();
    }

    fn build_group(
        &self,
        conversation_id: &ConversationId,
        kind: MlsGroupKind,
        scope: ConversationScope,
        members: Vec<MlsMember>,
    ) -> Result<MlsGroupState, String> {
        if members.is_empty() {
            return Err("mls group must have at least one member".into());
        }

        if kind == MlsGroupKind::Direct && members.len() != 2 {
            return Err("direct MLS groups must start with exactly two members".into());
        }

        Ok(MlsGroupState {
            group_id: format!("mls:{}", conversation_id.0),
            conversation_id: conversation_id.clone(),
            kind,
            scope,
            epoch: 1,
            members,
            pending_rekey: false,
        })
    }

    fn group_mut(
        &mut self,
        conversation_id: &ConversationId,
    ) -> Result<&mut MlsGroupState, String> {
        self.groups
            .get_mut(conversation_id)
            .ok_or_else(|| format!("MLS group not found for conversation {}", conversation_id.0))
    }

    fn group(&self, conversation_id: &ConversationId) -> Result<&MlsGroupState, String> {
        self.groups
            .get(conversation_id)
            .ok_or_else(|| format!("MLS group not found for conversation {}", conversation_id.0))
    }
}

impl SecureSessionManager for SkeletonSecureSessionManager {
    fn bootstrap_direct(
        &mut self,
        conversation_id: &ConversationId,
        members: Vec<MlsMember>,
    ) -> Result<MlsGroupState, String> {
        let group = self.build_group(
            conversation_id,
            MlsGroupKind::Direct,
            ConversationScope::Private,
            members,
        )?;
        self.groups.insert(conversation_id.clone(), group.clone());
        Ok(group)
    }

    fn bootstrap_room(
        &mut self,
        conversation_id: &ConversationId,
        scope: ConversationScope,
        members: Vec<MlsMember>,
    ) -> Result<MlsGroupState, String> {
        if scope == ConversationScope::Private {
            return Err("room bootstrap must use a non-private scope".into());
        }

        let group = self.build_group(conversation_id, MlsGroupKind::Room, scope, members)?;
        self.groups.insert(conversation_id.clone(), group.clone());
        Ok(group)
    }

    fn group_state(&self, conversation_id: &ConversationId) -> Option<&MlsGroupState> {
        self.groups.get(conversation_id)
    }

    fn current_epoch(&self, conversation_id: &ConversationId) -> Result<u64, String> {
        Ok(self.group(conversation_id)?.epoch)
    }

    fn rotate_epoch(&mut self, conversation_id: &ConversationId) -> Result<u64, String> {
        let group = self.group_mut(conversation_id)?;
        group.epoch += 1;
        group.pending_rekey = false;
        Ok(group.epoch)
    }

    fn add_member(
        &mut self,
        conversation_id: &ConversationId,
        member: MlsMember,
    ) -> Result<(), String> {
        let group = self.group_mut(conversation_id)?;
        if group
            .members
            .iter()
            .any(|existing| existing.identity_id == member.identity_id)
        {
            return Err(format!(
                "member {} already exists in MLS group",
                member.identity_id.0
            ));
        }
        group.members.push(member);
        group.pending_rekey = true;
        Ok(())
    }

    fn remove_member(
        &mut self,
        conversation_id: &ConversationId,
        identity_id: &IdentityId,
    ) -> Result<(), String> {
        let group = self.group_mut(conversation_id)?;
        let before = group.members.len();
        group
            .members
            .retain(|member| &member.identity_id != identity_id);
        if group.members.len() == before {
            return Err(format!("member {} not found in MLS group", identity_id.0));
        }
        group.pending_rekey = true;
        Ok(())
    }

    fn seal(&self, message: &MessageEnvelope) -> Result<MlsCiphertextEnvelope, String> {
        let group = self.group(&message.conversation_id)?;
        let sender_allowed = group.members.iter().any(|member| {
            member.identity_id == message.sender
                && member
                    .device_id
                    .as_ref()
                    .map(|device| device == &message.sender_device)
                    .unwrap_or(true)
        });
        if !sender_allowed {
            return Err(format!(
                "sender {} is not part of MLS group {}",
                message.sender.0, group.group_id
            ));
        }

        // Skeleton boundary: this is only a transport-shaped placeholder. The serialized bytes
        // still contain the original plaintext `MessageEnvelope`, so confidentiality is not yet
        // provided here even though the field is named `ciphertext`.
        let ciphertext = postcard::to_allocvec(message)
            .map_err(|error| format!("encode MLS skeleton envelope failed: {error}"))?;

        Ok(MlsCiphertextEnvelope {
            group_id: group.group_id.clone(),
            conversation_id: message.conversation_id.clone(),
            epoch: group.epoch,
            sender: message.sender.clone(),
            sender_device: message.sender_device.clone(),
            payload_type: message.payload_type.clone(),
            wire_format: MlsWireFormat::SkeletonPostcard,
            ciphertext,
        })
    }

    fn open(&self, envelope: &MlsCiphertextEnvelope) -> Result<MessageEnvelope, String> {
        let group = self.group(&envelope.conversation_id)?;
        if group.group_id != envelope.group_id {
            return Err("MLS envelope group_id does not match local session".into());
        }
        if envelope.epoch > group.epoch {
            return Err(format!(
                "MLS envelope epoch {} is newer than local epoch {}",
                envelope.epoch, group.epoch
            ));
        }

        let message: MessageEnvelope = postcard::from_bytes(&envelope.ciphertext)
            .map_err(|error| format!("decode MLS skeleton envelope failed: {error}"))?;
        if message.conversation_id != envelope.conversation_id {
            return Err("MLS envelope conversation does not match payload".into());
        }
        Ok(message)
    }
}

#[allow(deprecated)]
#[deprecated(
    note = "use SkeletonSecureSessionManager; this implementation is transport-shaped only"
)]
pub type InMemorySecureSessionManager = SkeletonSecureSessionManager;

#[cfg(test)]
mod tests {
    use super::*;
    use chat_core::{ClientProfile, MessageBody, MessageId};

    fn direct_members() -> Vec<MlsMember> {
        vec![
            MlsMember::device("rsaga", "desktop-1"),
            MlsMember::device("builder", "builder-device"),
        ]
    }

    fn sample_message() -> MessageEnvelope {
        MessageEnvelope {
            message_id: MessageId("msg-1".into()),
            conversation_id: ConversationId("dm:builder:rsaga".into()),
            sender: IdentityId("rsaga".into()),
            reply_to_message_id: None,
            sender_device: DeviceId("desktop-1".into()),
            sender_profile: ClientProfile::desktop_terminal(),
            payload_type: PayloadType::Text,
            body: MessageBody {
                preview: "hello".into(),
                plain_text: "hello from MLS".into(),
                language_tag: "en".into(),
            },
            ciphertext: vec![],
            timestamp_ms: 1_763_560_000_000,
            ephemeral: false,
        }
    }

    #[test]
    fn bootstraps_direct_session_with_two_members() {
        let mut manager = SkeletonSecureSessionManager::new();
        let group = manager
            .bootstrap_direct(&ConversationId("dm:builder:rsaga".into()), direct_members())
            .expect("direct group should bootstrap");
        assert_eq!(group.kind, MlsGroupKind::Direct);
        assert_eq!(group.scope, ConversationScope::Private);
        assert_eq!(group.epoch, 1);
        assert_eq!(group.members.len(), 2);
    }

    #[test]
    fn room_epoch_rotates_after_membership_change() {
        let mut manager = SkeletonSecureSessionManager::new();
        let conversation_id = ConversationId("room:city-alpha:ops".into());
        manager
            .bootstrap_room(
                &conversation_id,
                ConversationScope::CityPublic,
                vec![
                    MlsMember::identity("rsaga"),
                    MlsMember::identity("builder"),
                    MlsMember::identity("steward"),
                ],
            )
            .expect("room group should bootstrap");
        manager
            .add_member(&conversation_id, MlsMember::identity("guest"))
            .expect("add member should succeed");
        assert!(
            manager
                .group_state(&conversation_id)
                .expect("group state should exist")
                .pending_rekey
        );
        let epoch = manager
            .rotate_epoch(&conversation_id)
            .expect("rotate epoch should succeed");
        assert_eq!(epoch, 2);
        assert!(
            !manager
                .group_state(&conversation_id)
                .expect("group state should exist")
                .pending_rekey
        );
    }

    #[test]
    fn seal_and_open_roundtrip_message() {
        let mut manager = SkeletonSecureSessionManager::new();
        let conversation_id = ConversationId("dm:builder:rsaga".into());
        manager
            .bootstrap_direct(&conversation_id, direct_members())
            .expect("direct group should bootstrap");
        let message = sample_message();
        let sealed = manager.seal(&message).expect("message should seal");
        let opened = manager.open(&sealed).expect("message should open");
        assert_eq!(opened, message);
        assert_eq!(sealed.epoch, 1);
    }

    #[test]
    fn rejects_sender_outside_group() {
        let mut manager = SkeletonSecureSessionManager::new();
        manager
            .bootstrap_direct(&ConversationId("dm:builder:rsaga".into()), direct_members())
            .expect("direct group should bootstrap");
        let mut message = sample_message();
        message.sender = IdentityId("intruder".into());
        assert!(manager.seal(&message).is_err());
    }

    #[test]
    fn snapshot_roundtrip_preserves_groups() {
        let mut manager = SkeletonSecureSessionManager::new();
        manager
            .bootstrap_direct(&ConversationId("dm:builder:rsaga".into()), direct_members())
            .expect("direct group should bootstrap");
        let snapshot = manager.snapshot();

        let mut restored = SkeletonSecureSessionManager::new();
        restored.restore(snapshot);

        let group = restored
            .group_state(&ConversationId("dm:builder:rsaga".into()))
            .expect("restored group should exist");
        assert_eq!(group.kind, MlsGroupKind::Direct);
        assert_eq!(group.members.len(), 2);
    }

    #[test]
    fn skeleton_manager_serializes_plaintext_into_skeleton_ciphertext() {
        let mut manager = SkeletonSecureSessionManager::new();
        let conversation_id = ConversationId("dm:builder:rsaga".into());
        manager
            .bootstrap_direct(&conversation_id, direct_members())
            .expect("direct group should bootstrap");

        let message = sample_message();
        let sealed = manager.seal(&message).expect("message should seal");
        let decoded: MessageEnvelope =
            postcard::from_bytes(&sealed.ciphertext).expect("skeleton envelope should decode");

        assert_eq!(sealed.wire_format, MlsWireFormat::SkeletonPostcard);
        assert_eq!(decoded.body.plain_text, message.body.plain_text);
        assert_eq!(decoded, message);
    }
}
