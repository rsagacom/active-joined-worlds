use std::{
    collections::HashMap,
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use chat_core::{
    ArchivePolicy, Conversation, ConversationId, ConversationKind, ConversationScope,
    DeliveryState, IdentityId, MessageEnvelope, MessageId, TimelineEntry,
};
use serde::{Deserialize, Serialize};

pub type StorageResult<T> = Result<T, String>;

fn atomic_write(path: &Path, bytes: &[u8]) -> StorageResult<()> {
    let temp_path = match path.extension().and_then(|value| value.to_str()) {
        Some(extension) if !extension.is_empty() => path.with_extension(format!("{extension}.tmp")),
        _ => path.with_extension("tmp"),
    };

    let write_result = (|| -> StorageResult<()> {
        let mut file = File::create(&temp_path)
            .map_err(|error| format!("create temp snapshot failed: {error}"))?;
        file.write_all(bytes)
            .map_err(|error| format!("write temp snapshot failed: {error}"))?;
        file.sync_all()
            .map_err(|error| format!("sync temp snapshot failed: {error}"))?;
        Ok(())
    })();

    if let Err(error) = write_result {
        let _ = fs::remove_file(&temp_path);
        return Err(error);
    }

    fs::rename(&temp_path, path).map_err(|error| {
        let _ = fs::remove_file(&temp_path);
        format!("replace snapshot failed: {error}")
    })?;

    Ok(())
}

pub fn atomic_write_file(path: &Path, bytes: &[u8]) -> StorageResult<()> {
    atomic_write(path, bytes)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyConversationV1 {
    conversation_id: ConversationId,
    kind: ConversationKind,
    content_topic: String,
    participants: Vec<IdentityId>,
    created_at_ms: i64,
    last_active_at_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyConversationV2 {
    conversation_id: ConversationId,
    kind: ConversationKind,
    scope: ConversationScope,
    content_topic: String,
    participants: Vec<IdentityId>,
    created_at_ms: i64,
    last_active_at_ms: i64,
}

impl From<LegacyConversationV1> for Conversation {
    fn from(value: LegacyConversationV1) -> Self {
        Self {
            conversation_id: value.conversation_id,
            kind: value.kind,
            scope: ConversationScope::Private,
            scene: None,
            content_topic: value.content_topic,
            participants: value.participants,
            created_at_ms: value.created_at_ms,
            last_active_at_ms: value.last_active_at_ms,
        }
    }
}

impl From<LegacyConversationV2> for Conversation {
    fn from(value: LegacyConversationV2) -> Self {
        Self {
            conversation_id: value.conversation_id,
            kind: value.kind,
            scope: value.scope,
            scene: None,
            content_topic: value.content_topic,
            participants: value.participants,
            created_at_ms: value.created_at_ms,
            last_active_at_ms: value.last_active_at_ms,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyTimelineEntryV1 {
    envelope: MessageEnvelope,
    delivery_state: DeliveryState,
    archived_at_ms: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyTimelineEntryV2 {
    envelope: MessageEnvelope,
    delivery_state: DeliveryState,
    archived_at_ms: Option<i64>,
    pinned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LegacyTimelineEntryV3 {
    envelope: MessageEnvelope,
    delivery_state: DeliveryState,
    archived_at_ms: Option<i64>,
    pinned: bool,
    recalled_at_ms: Option<i64>,
    recalled_by: Option<IdentityId>,
}

impl From<LegacyTimelineEntryV1> for TimelineEntry {
    fn from(value: LegacyTimelineEntryV1) -> Self {
        Self {
            envelope: value.envelope,
            delivery_state: value.delivery_state,
            archived_at_ms: value.archived_at_ms,
            pinned: false,
            recalled_at_ms: None,
            recalled_by: None,
            edited_at_ms: None,
            edited_by: None,
        }
    }
}

impl From<LegacyTimelineEntryV2> for TimelineEntry {
    fn from(value: LegacyTimelineEntryV2) -> Self {
        Self {
            envelope: value.envelope,
            delivery_state: value.delivery_state,
            archived_at_ms: value.archived_at_ms,
            pinned: value.pinned,
            recalled_at_ms: None,
            recalled_by: None,
            edited_at_ms: None,
            edited_by: None,
        }
    }
}

impl From<LegacyTimelineEntryV3> for TimelineEntry {
    fn from(value: LegacyTimelineEntryV3) -> Self {
        Self {
            envelope: value.envelope,
            delivery_state: value.delivery_state,
            archived_at_ms: value.archived_at_ms,
            pinned: value.pinned,
            recalled_at_ms: value.recalled_at_ms,
            recalled_by: value.recalled_by,
            edited_at_ms: None,
            edited_by: None,
        }
    }
}

pub trait TimelineStore {
    fn upsert_conversation(&mut self, conversation: Conversation) -> StorageResult<()>;
    fn append_message(&mut self, message: MessageEnvelope) -> StorageResult<()>;
    fn recent_messages(&self, conversation_id: &ConversationId, limit: usize)
    -> Vec<TimelineEntry>;
    fn active_conversations(&self) -> Vec<Conversation>;
}

pub trait ArchiveStore {
    fn archive_policy(&self) -> ArchivePolicy;
    fn archive_expired_messages(&mut self, now_ms: i64) -> StorageResult<usize>;
}

#[derive(Debug, Clone)]
pub struct InMemoryTimelineStore {
    archive_policy: ArchivePolicy,
    conversations: HashMap<ConversationId, Conversation>,
    timelines: HashMap<ConversationId, Vec<TimelineEntry>>,
}

impl InMemoryTimelineStore {
    pub fn new(archive_policy: ArchivePolicy) -> Self {
        Self {
            archive_policy,
            conversations: HashMap::new(),
            timelines: HashMap::new(),
        }
    }

    pub fn archived_count(&self, conversation_id: &ConversationId) -> usize {
        self.timelines
            .get(conversation_id)
            .map(|entries| {
                entries
                    .iter()
                    .filter(|entry| entry.archived_at_ms.is_some())
                    .count()
            })
            .unwrap_or(0)
    }
}

impl TimelineStore for InMemoryTimelineStore {
    fn upsert_conversation(&mut self, conversation: Conversation) -> StorageResult<()> {
        self.conversations
            .insert(conversation.conversation_id.clone(), conversation);
        Ok(())
    }

    fn append_message(&mut self, message: MessageEnvelope) -> StorageResult<()> {
        if let Some(conversation) = self.conversations.get_mut(&message.conversation_id) {
            conversation.touch(message.timestamp_ms);
        }
        self.timelines
            .entry(message.conversation_id.clone())
            .or_default()
            .push(TimelineEntry {
                envelope: message,
                delivery_state: DeliveryState::LocalOnly,
                archived_at_ms: None,
                pinned: false,
                recalled_at_ms: None,
                recalled_by: None,
                edited_at_ms: None,
                edited_by: None,
            });
        Ok(())
    }

    fn recent_messages(
        &self,
        conversation_id: &ConversationId,
        limit: usize,
    ) -> Vec<TimelineEntry> {
        self.timelines
            .get(conversation_id)
            .map(|entries| {
                entries
                    .iter()
                    .filter(|entry| entry.archived_at_ms.is_none())
                    .rev()
                    .take(limit)
                    .cloned()
                    .collect::<Vec<_>>()
                    .into_iter()
                    .rev()
                    .collect()
            })
            .unwrap_or_default()
    }

    fn active_conversations(&self) -> Vec<Conversation> {
        let mut items = self.conversations.values().cloned().collect::<Vec<_>>();
        items.sort_by_key(|conversation| conversation.last_active_at_ms);
        items.reverse();
        items
    }
}

impl ArchiveStore for InMemoryTimelineStore {
    fn archive_policy(&self) -> ArchivePolicy {
        self.archive_policy.clone()
    }

    fn archive_expired_messages(&mut self, now_ms: i64) -> StorageResult<usize> {
        let policy = self.archive_policy.clone();
        let mut count = 0;
        for entries in self.timelines.values_mut() {
            for entry in entries.iter_mut() {
                if entry.is_active_at(now_ms, &policy) {
                    continue;
                }
                if entry.archived_at_ms.is_none() {
                    entry.archived_at_ms = Some(now_ms);
                    entry.delivery_state = DeliveryState::ArchivedLocal;
                    count += 1;
                }
            }
        }
        Ok(count)
    }
}

#[derive(Debug, Clone)]
pub struct FileTimelineStore {
    root_dir: PathBuf,
    inner: InMemoryTimelineStore,
}

impl FileTimelineStore {
    pub fn open(
        root_dir: impl Into<PathBuf>,
        archive_policy: ArchivePolicy,
    ) -> StorageResult<Self> {
        let root_dir = root_dir.into();
        fs::create_dir_all(root_dir.join("timelines"))
            .map_err(|error| format!("create storage directories failed: {error}"))?;

        let mut store = Self {
            root_dir,
            inner: InMemoryTimelineStore::new(archive_policy),
        };
        store.load_from_disk()?;
        Ok(store)
    }

    pub fn root_dir(&self) -> &Path {
        &self.root_dir
    }

    pub fn archived_count(&self, conversation_id: &ConversationId) -> usize {
        self.inner.archived_count(conversation_id)
    }

    pub fn export_messages(&self, conversation_id: &ConversationId) -> Vec<TimelineEntry> {
        self.inner
            .timelines
            .get(conversation_id)
            .cloned()
            .unwrap_or_default()
    }

    pub fn merge_message(
        &mut self,
        message: MessageEnvelope,
        delivery_state: DeliveryState,
    ) -> StorageResult<bool> {
        if let Some(conversation) = self.inner.conversations.get_mut(&message.conversation_id) {
            conversation.touch(message.timestamp_ms);
        }

        let entries = self
            .inner
            .timelines
            .entry(message.conversation_id.clone())
            .or_default();

        if let Some(index) = entries
            .iter()
            .position(|entry| entry.envelope.message_id == message.message_id)
        {
            let mut changed = false;
            if entries[index].delivery_state != delivery_state {
                entries[index].delivery_state = delivery_state;
                changed = true;
            }
            if entries[index].envelope != message {
                entries[index].envelope = message;
                changed = true;
            }
            if changed {
                let conversation_id = entries[index].envelope.conversation_id.clone();
                self.persist_timeline(&conversation_id)?;
            }
            return Ok(false);
        }

        entries.push(TimelineEntry {
            envelope: message.clone(),
            delivery_state,
            archived_at_ms: None,
            pinned: false,
            recalled_at_ms: None,
            recalled_by: None,
            edited_at_ms: None,
            edited_by: None,
        });
        self.persist_timeline(&message.conversation_id)?;
        Ok(true)
    }

    pub fn recall_message(
        &mut self,
        conversation_id: &ConversationId,
        message_id: &MessageId,
        actor: IdentityId,
        recalled_at_ms: i64,
    ) -> StorageResult<Option<TimelineEntry>> {
        let Some(entries) = self.inner.timelines.get_mut(conversation_id) else {
            return Ok(None);
        };
        let Some(entry) = entries
            .iter_mut()
            .find(|entry| entry.envelope.message_id == *message_id)
        else {
            return Ok(None);
        };
        if entry.envelope.sender != actor {
            return Err("only the original sender can recall this message".into());
        }
        entry.recalled_at_ms = Some(recalled_at_ms);
        entry.recalled_by = Some(actor);
        let recalled = entry.clone();
        self.persist_timeline(conversation_id)?;
        Ok(Some(recalled))
    }

    pub fn edit_message(
        &mut self,
        conversation_id: &ConversationId,
        message_id: &MessageId,
        actor: IdentityId,
        text: String,
        edited_at_ms: i64,
    ) -> StorageResult<Option<TimelineEntry>> {
        let Some(entries) = self.inner.timelines.get_mut(conversation_id) else {
            return Ok(None);
        };
        let Some(entry) = entries
            .iter_mut()
            .find(|entry| entry.envelope.message_id == *message_id)
        else {
            return Ok(None);
        };
        if entry.envelope.sender != actor {
            return Err("only the original sender can edit this message".into());
        }
        if entry.recalled_at_ms.is_some() {
            return Err("recalled messages cannot be edited".into());
        }
        entry.envelope.body.preview = text.clone();
        entry.envelope.body.plain_text = text;
        entry.edited_at_ms = Some(edited_at_ms);
        entry.edited_by = Some(actor);
        let edited = entry.clone();
        self.persist_timeline(conversation_id)?;
        Ok(Some(edited))
    }

    fn load_from_disk(&mut self) -> StorageResult<()> {
        let conversations = self.load_conversations()?;
        for conversation in conversations {
            let conversation_id = conversation.conversation_id.clone();
            self.inner
                .conversations
                .insert(conversation_id.clone(), conversation);
            let entries = self.load_timeline(&conversation_id)?;
            if !entries.is_empty() {
                self.inner.timelines.insert(conversation_id, entries);
            }
        }
        Ok(())
    }

    fn conversations_path(&self) -> PathBuf {
        self.root_dir.join("conversations.postcard")
    }

    fn timeline_path(&self, conversation_id: &ConversationId) -> PathBuf {
        let key = conversation_id
            .0
            .as_bytes()
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect::<String>();
        self.root_dir
            .join("timelines")
            .join(format!("{key}.postcard"))
    }

    fn quarantine_corrupt_snapshot(
        &self,
        path: &Path,
        label: &str,
        decode_error: &str,
    ) -> StorageResult<()> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();
        let file_name = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or(label);
        let quarantine_path = path.with_file_name(format!("{file_name}.corrupt-{timestamp}"));
        fs::rename(path, &quarantine_path).map_err(|error| {
            format!("quarantine {label} failed after decode error ({decode_error}): {error}")
        })?;
        eprintln!(
            "chat-storage: quarantined unreadable {label}: {} -> {} ({decode_error})",
            path.display(),
            quarantine_path.display()
        );
        Ok(())
    }

    fn load_conversations(&self) -> StorageResult<Vec<Conversation>> {
        let path = self.conversations_path();
        if !path.exists() {
            return Ok(Vec::new());
        }
        let bytes = fs::read(&path)
            .map_err(|error| format!("read conversations snapshot failed: {error}"))?;
        if bytes.is_empty() {
            return Ok(Vec::new());
        }
        match postcard::from_bytes(&bytes) {
            Ok(conversations) => Ok(conversations),
            Err(current_error) => {
                if let Ok(legacy) = postcard::from_bytes::<Vec<LegacyConversationV2>>(&bytes) {
                    return Ok(legacy.into_iter().map(Conversation::from).collect());
                }
                if let Ok(legacy) = postcard::from_bytes::<Vec<LegacyConversationV1>>(&bytes) {
                    return Ok(legacy.into_iter().map(Conversation::from).collect());
                }
                let decode_error = current_error.to_string();
                self.quarantine_corrupt_snapshot(&path, "conversations snapshot", &decode_error)?;
                Ok(Vec::new())
            }
        }
    }

    fn load_timeline(&self, conversation_id: &ConversationId) -> StorageResult<Vec<TimelineEntry>> {
        let path = self.timeline_path(conversation_id);
        if !path.exists() {
            return Ok(Vec::new());
        }
        let bytes =
            fs::read(&path).map_err(|error| format!("read timeline snapshot failed: {error}"))?;
        if bytes.is_empty() {
            return Ok(Vec::new());
        }
        match postcard::from_bytes(&bytes) {
            Ok(entries) => Ok(entries),
            Err(current_error) => {
                if let Ok(legacy) = postcard::from_bytes::<Vec<LegacyTimelineEntryV3>>(&bytes) {
                    return Ok(legacy.into_iter().map(TimelineEntry::from).collect());
                }
                if let Ok(legacy) = postcard::from_bytes::<Vec<LegacyTimelineEntryV2>>(&bytes) {
                    return Ok(legacy.into_iter().map(TimelineEntry::from).collect());
                }
                if let Ok(legacy) = postcard::from_bytes::<Vec<LegacyTimelineEntryV1>>(&bytes) {
                    return Ok(legacy.into_iter().map(TimelineEntry::from).collect());
                }
                let decode_error = current_error.to_string();
                self.quarantine_corrupt_snapshot(&path, "timeline snapshot", &decode_error)?;
                Ok(Vec::new())
            }
        }
    }

    fn persist_conversations(&self) -> StorageResult<()> {
        let conversations = self.inner.active_conversations();
        let bytes = postcard::to_allocvec(&conversations)
            .map_err(|error| format!("encode conversations snapshot failed: {error}"))?;
        atomic_write(&self.conversations_path(), &bytes)
            .map_err(|error| format!("write conversations snapshot failed: {error}"))?;
        Ok(())
    }

    fn persist_timeline(&self, conversation_id: &ConversationId) -> StorageResult<()> {
        let entries = self
            .inner
            .timelines
            .get(conversation_id)
            .cloned()
            .unwrap_or_default();
        let bytes = postcard::to_allocvec(&entries)
            .map_err(|error| format!("encode timeline snapshot failed: {error}"))?;
        atomic_write(&self.timeline_path(conversation_id), &bytes)
            .map_err(|error| format!("write timeline snapshot failed: {error}"))?;
        Ok(())
    }

    fn persist_all_timelines(&self) -> StorageResult<()> {
        for conversation_id in self.inner.conversations.keys() {
            self.persist_timeline(conversation_id)?;
        }
        Ok(())
    }
}

impl TimelineStore for FileTimelineStore {
    fn upsert_conversation(&mut self, conversation: Conversation) -> StorageResult<()> {
        self.inner.upsert_conversation(conversation)?;
        self.persist_conversations()
    }

    fn append_message(&mut self, message: MessageEnvelope) -> StorageResult<()> {
        let conversation_id = message.conversation_id.clone();
        self.inner.append_message(message)?;
        self.persist_conversations()?;
        self.persist_timeline(&conversation_id)
    }

    fn recent_messages(
        &self,
        conversation_id: &ConversationId,
        limit: usize,
    ) -> Vec<TimelineEntry> {
        self.inner.recent_messages(conversation_id, limit)
    }

    fn active_conversations(&self) -> Vec<Conversation> {
        self.inner.active_conversations()
    }
}

impl ArchiveStore for FileTimelineStore {
    fn archive_policy(&self) -> ArchivePolicy {
        self.inner.archive_policy()
    }

    fn archive_expired_messages(&mut self, now_ms: i64) -> StorageResult<usize> {
        let archived = self.inner.archive_expired_messages(now_ms)?;
        self.persist_conversations()?;
        self.persist_all_timelines()?;
        Ok(archived)
    }
}

#[cfg(test)]
mod tests {
    use chat_core::{
        ClientProfile, ConversationKind, ConversationScope, DeviceId, IdentityId, MessageBody,
        MessageId, PayloadType,
    };
    use tempfile::tempdir;

    use super::*;

    fn sample_conversation() -> Conversation {
        Conversation {
            conversation_id: ConversationId("dm:alice:bob".into()),
            kind: ConversationKind::Direct,
            scope: ConversationScope::Private,
            scene: None,
            content_topic: "/lobster-chat/dm/alice-bob/1".into(),
            participants: vec![IdentityId("alice".into()), IdentityId("bob".into())],
            created_at_ms: 1_000,
            last_active_at_ms: 1_000,
        }
    }

    fn sample_message(timestamp_ms: i64) -> MessageEnvelope {
        MessageEnvelope {
            message_id: MessageId(format!("m-{timestamp_ms}")),
            conversation_id: ConversationId("dm:alice:bob".into()),
            sender: IdentityId("alice".into()),
            reply_to_message_id: None,
            sender_device: DeviceId("alice-desktop".into()),
            sender_profile: ClientProfile::desktop_terminal(),
            payload_type: PayloadType::Text,
            body: MessageBody {
                preview: "hello".into(),
                plain_text: "hello".into(),
                language_tag: "en".into(),
            },
            ciphertext: vec![1, 2, 3],
            timestamp_ms,
            ephemeral: false,
        }
    }

    fn archive_policy() -> ArchivePolicy {
        ArchivePolicy {
            active_window_hours: 1,
            local_retention_days: Some(7),
            allow_user_pinned_archive: true,
            archive_when_idle_hours: 1,
        }
    }

    #[test]
    fn archives_messages_outside_window() {
        let mut store = InMemoryTimelineStore::new(archive_policy());
        store.upsert_conversation(sample_conversation()).unwrap();
        store.append_message(sample_message(0)).unwrap();
        let archived = store.archive_expired_messages(4_000_000).unwrap();
        assert_eq!(archived, 1);
        assert_eq!(
            store.archived_count(&ConversationId("dm:alice:bob".into())),
            1
        );
    }

    #[test]
    fn file_store_restores_conversations_and_messages() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");

        {
            let mut store = FileTimelineStore::open(&root, archive_policy()).expect("open store");
            store.upsert_conversation(sample_conversation()).unwrap();
            store.append_message(sample_message(10)).unwrap();
            store.append_message(sample_message(20)).unwrap();
            assert_eq!(
                store
                    .recent_messages(&ConversationId("dm:alice:bob".into()), 10)
                    .len(),
                2
            );
        }

        let restored = FileTimelineStore::open(&root, archive_policy()).expect("restore store");
        assert_eq!(restored.active_conversations().len(), 1);
        assert_eq!(
            restored
                .recent_messages(&ConversationId("dm:alice:bob".into()), 10)
                .len(),
            2
        );
    }

    #[test]
    fn file_store_merge_message_deduplicates_existing_message_id_and_upgrades_delivery_state() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        let conversation_id = ConversationId("dm:alice:bob".into());
        let message = sample_message(10);

        let mut store = FileTimelineStore::open(&root, archive_policy()).expect("open store");
        store.upsert_conversation(sample_conversation()).unwrap();
        store.append_message(message.clone()).unwrap();

        let merged = store
            .merge_message(message.clone(), DeliveryState::Delivered)
            .expect("merge message");
        assert!(!merged, "existing message id should not append a duplicate");

        let entries = store.recent_messages(&conversation_id, 10);
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].envelope.message_id, message.message_id);
        assert_eq!(entries[0].delivery_state, DeliveryState::Delivered);
    }

    #[test]
    fn file_store_merge_message_appends_remote_message_as_delivered() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        let conversation_id = ConversationId("dm:alice:bob".into());
        let message = sample_message(42);

        let mut store = FileTimelineStore::open(&root, archive_policy()).expect("open store");
        store.upsert_conversation(sample_conversation()).unwrap();

        let merged = store
            .merge_message(message.clone(), DeliveryState::Delivered)
            .expect("merge remote message");
        assert!(merged, "new remote message should be appended");

        let entries = store.recent_messages(&conversation_id, 10);
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].envelope.message_id, message.message_id);
        assert_eq!(entries[0].delivery_state, DeliveryState::Delivered);
    }

    #[test]
    fn file_store_persists_archive_state() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        let conversation_id = ConversationId("dm:alice:bob".into());

        {
            let mut store = FileTimelineStore::open(&root, archive_policy()).expect("open store");
            store.upsert_conversation(sample_conversation()).unwrap();
            store.append_message(sample_message(0)).unwrap();
            let archived = store.archive_expired_messages(4_000_000).unwrap();
            assert_eq!(archived, 1);
            assert_eq!(store.archived_count(&conversation_id), 1);
        }

        let restored = FileTimelineStore::open(&root, archive_policy()).expect("restore store");
        assert_eq!(restored.archived_count(&conversation_id), 1);
    }

    #[test]
    fn export_messages_keeps_archived_entries() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        let conversation_id = ConversationId("dm:alice:bob".into());

        let exported = {
            let mut store = FileTimelineStore::open(&root, archive_policy()).expect("open store");
            store.upsert_conversation(sample_conversation()).unwrap();
            store.append_message(sample_message(0)).unwrap();
            store.archive_expired_messages(4_000_000).unwrap();
            store.export_messages(&conversation_id)
        };

        assert_eq!(exported.len(), 1);
        assert!(exported[0].archived_at_ms.is_some());
    }

    #[test]
    fn file_store_restores_scope_only_legacy_conversations() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        fs::create_dir_all(root.join("timelines")).expect("create timelines");
        let legacy = vec![LegacyConversationV2 {
            conversation_id: ConversationId("room:city:core-harbor:lobby".into()),
            kind: ConversationKind::Room,
            scope: ConversationScope::CityPublic,
            content_topic: "/lobster-chat/1/conversation/room:city:core-harbor:lobby".into(),
            participants: vec![IdentityId("rsaga".into()), IdentityId("builder".into())],
            created_at_ms: 1_000,
            last_active_at_ms: 2_000,
        }];
        let bytes = postcard::to_allocvec(&legacy).expect("encode legacy conversations");
        fs::write(root.join("conversations.postcard"), bytes).expect("write legacy conversations");

        let restored = FileTimelineStore::open(&root, archive_policy()).expect("restore store");
        let conversations = restored.active_conversations();
        assert_eq!(conversations.len(), 1);
        assert_eq!(conversations[0].scope, ConversationScope::CityPublic);
        assert!(conversations[0].scene.is_none());
    }

    #[test]
    fn file_store_restores_legacy_timelines_without_pinned() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        let conversation = sample_conversation();
        let conversation_id = conversation.conversation_id.clone();
        fs::create_dir_all(root.join("timelines")).expect("create timelines");
        let conversations =
            postcard::to_allocvec(&vec![conversation.clone()]).expect("encode conversations");
        fs::write(root.join("conversations.postcard"), conversations).expect("write conversations");
        let legacy_entries = vec![LegacyTimelineEntryV1 {
            envelope: sample_message(42),
            delivery_state: DeliveryState::Delivered,
            archived_at_ms: None,
        }];
        let bytes = postcard::to_allocvec(&legacy_entries).expect("encode legacy timeline");
        let timeline_path = root
            .join("timelines")
            .join("646d3a616c6963653a626f62.postcard");
        fs::write(timeline_path, bytes).expect("write legacy timeline");

        let restored = FileTimelineStore::open(&root, archive_policy()).expect("restore store");
        let entries = restored.recent_messages(&conversation_id, 10);
        assert_eq!(entries.len(), 1);
        assert!(!entries[0].pinned);
        assert_eq!(entries[0].delivery_state, DeliveryState::Delivered);
    }

    #[test]
    fn file_store_restores_legacy_timelines_with_pinned_before_recall_fields() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        let conversation = sample_conversation();
        let conversation_id = conversation.conversation_id.clone();
        fs::create_dir_all(root.join("timelines")).expect("create timelines");
        let conversations =
            postcard::to_allocvec(&vec![conversation.clone()]).expect("encode conversations");
        fs::write(root.join("conversations.postcard"), conversations).expect("write conversations");
        let legacy_entries = vec![LegacyTimelineEntryV2 {
            envelope: sample_message(42),
            delivery_state: DeliveryState::Delivered,
            archived_at_ms: None,
            pinned: true,
        }];
        let bytes = postcard::to_allocvec(&legacy_entries).expect("encode legacy timeline");
        let timeline_path = root
            .join("timelines")
            .join("646d3a616c6963653a626f62.postcard");
        fs::write(timeline_path, bytes).expect("write legacy timeline");

        let restored = FileTimelineStore::open(&root, archive_policy()).expect("restore store");
        let entries = restored.recent_messages(&conversation_id, 10);
        assert_eq!(entries.len(), 1);
        assert!(entries[0].pinned);
        assert_eq!(entries[0].recalled_at_ms, None);
        assert_eq!(entries[0].recalled_by, None);
    }

    #[test]
    fn file_store_restores_legacy_timelines_with_recall_before_edit_fields() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        let conversation = sample_conversation();
        let conversation_id = conversation.conversation_id.clone();
        fs::create_dir_all(root.join("timelines")).expect("create timelines");
        let conversations =
            postcard::to_allocvec(&vec![conversation.clone()]).expect("encode conversations");
        fs::write(root.join("conversations.postcard"), conversations).expect("write conversations");
        let legacy_entries = vec![LegacyTimelineEntryV3 {
            envelope: sample_message(42),
            delivery_state: DeliveryState::Delivered,
            archived_at_ms: None,
            pinned: true,
            recalled_at_ms: Some(99),
            recalled_by: Some(IdentityId("alice".into())),
        }];
        let bytes = postcard::to_allocvec(&legacy_entries).expect("encode legacy timeline");
        let timeline_path = root
            .join("timelines")
            .join("646d3a616c6963653a626f62.postcard");
        fs::write(timeline_path, bytes).expect("write legacy timeline");

        let restored = FileTimelineStore::open(&root, archive_policy()).expect("restore store");
        let entries = restored.recent_messages(&conversation_id, 10);
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].recalled_at_ms, Some(99));
        assert_eq!(entries[0].recalled_by, Some(IdentityId("alice".into())));
        assert_eq!(entries[0].edited_at_ms, None);
        assert_eq!(entries[0].edited_by, None);
    }

    #[test]
    fn file_store_quarantines_unreadable_conversations_snapshot() {
        let temp = tempdir().expect("temp dir");
        let root = temp.path().join("storage");
        fs::create_dir_all(root.join("timelines")).expect("create timelines");
        fs::write(root.join("conversations.postcard"), b"not postcard bytes")
            .expect("write bad conversations");

        let restored = FileTimelineStore::open(&root, archive_policy()).expect("restore store");
        assert!(restored.active_conversations().is_empty());
        assert!(!root.join("conversations.postcard").exists());
        let quarantined = fs::read_dir(&root)
            .expect("read root")
            .filter_map(Result::ok)
            .any(|entry| {
                entry
                    .file_name()
                    .to_string_lossy()
                    .starts_with("conversations.postcard.corrupt-")
            });
        assert!(quarantined);
    }

    #[test]
    fn atomic_write_replaces_existing_file_without_leaving_tmp_artifact() {
        let temp = tempdir().expect("temp dir");
        let path = temp.path().join("snapshot.postcard");

        fs::write(&path, b"old").expect("seed snapshot");
        atomic_write(&path, b"new").expect("atomic write");

        assert_eq!(fs::read(&path).expect("read snapshot"), b"new");
        assert!(
            !path.with_extension("postcard.tmp").exists(),
            "temp artifact should be removed after atomic replace"
        );
    }
}
