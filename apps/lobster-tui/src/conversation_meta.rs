use chat_core::{Conversation, ConversationId, ConversationKind, ConversationScope};
use chat_storage::TimelineStore;

use super::{
    LaunchSurface, direct_conversation, launch_companion_conversations, launch_conversation,
    launch_identity, message_projection::timeline_entry_preview, timestamp_label,
};

fn builder_dm_id() -> ConversationId {
    direct_conversation("rsaga", "builder")
}

fn guide_dm_id() -> ConversationId {
    direct_conversation("tiyan", "guide")
}

pub(crate) fn conversation_title(conversation: &Conversation) -> String {
    let builder_dm = builder_dm_id();
    let guide_dm = guide_dm_id();
    match conversation.conversation_id.0.as_str() {
        "room:city:core-harbor:lobby" => "第一城大厅".into(),
        "room:city:aurora-hub:announcements" => "城主告示".into(),
        "room:world:lobby" => "世界广场".into(),
        value if value == builder_dm.0.as_str() => "居所 · builder".into(),
        value if value == guide_dm.0.as_str() => "居所 · guide".into(),
        value if value.starts_with("dm:") => format!("居所 · {}", value.trim_start_matches("dm:")),
        value if value.starts_with("room:city:") => format!("城邦门牌 · {}", value),
        value if value.starts_with("room:world:") => format!("世界门牌 · {}", value),
        value => value.into(),
    }
}

pub(crate) fn conversation_sidebar_title(
    mode: LaunchSurface,
    conversation: &Conversation,
) -> String {
    let builder_dm = builder_dm_id();
    let guide_dm = guide_dm_id();
    match (mode, conversation.conversation_id.0.as_str()) {
        (LaunchSurface::Admin, "room:city:aurora-hub:announcements") => "城主公告".into(),
        (LaunchSurface::Admin, "room:world:lobby") => "世界回响".into(),
        (LaunchSurface::Admin, value) if value == builder_dm.0.as_str() => "builder 追问".into(),
        (_, "room:city:core-harbor:lobby") => "第一城大厅".into(),
        (_, "room:city:aurora-hub:announcements") => "城主告示".into(),
        (_, "room:world:lobby") => "世界广场".into(),
        (_, value) if value == builder_dm.0.as_str() => "居所 · builder".into(),
        (_, value) if value == guide_dm.0.as_str() => "居所 · guide".into(),
        _ => conversation_title(conversation),
    }
}

pub(crate) fn conversation_kind_label(conversation: &Conversation) -> &'static str {
    match conversation.conversation_id.0.as_str() {
        "room:city:aurora-hub:announcements" => "城主告示",
        "room:world:lobby" => "世界广场",
        "room:city:core-harbor:lobby" => "城邦大厅",
        value if value.starts_with("dm:") => "居所",
        value if value.starts_with("room:") => "门牌",
        _ => match conversation.kind {
            ConversationKind::Direct => "居所",
            ConversationKind::Room => "门牌",
        },
    }
}

pub(crate) fn conversation_participant_label(conversation: &Conversation) -> String {
    let builder_dm = builder_dm_id();
    let guide_dm = guide_dm_id();
    match conversation.conversation_id.0.as_str() {
        value if value == builder_dm.0.as_str() => "你与 builder".into(),
        value if value == guide_dm.0.as_str() => "你与 guide".into(),
        "room:world:lobby" => "跨城共响回廊".into(),
        "room:city:core-harbor:lobby" => "核心港回声大厅".into(),
        "room:city:aurora-hub:announcements" => "城务与告示".into(),
        value if value.starts_with("dm:") => {
            format!("{} 人居所", conversation.participants.len().max(2))
        }
        _ => format!("{} 人同席", conversation.participants.len().max(1)),
    }
}

pub(crate) fn conversation_route_label(conversation: &Conversation) -> String {
    match conversation.scope {
        ConversationScope::Private => "居所直达".into(),
        ConversationScope::CityPublic => "城内回响线".into(),
        ConversationScope::CityPrivate => "城务告示线".into(),
        ConversationScope::CrossCityShared => "跨城共响线".into(),
    }
}

pub(crate) fn conversation_scene_banner(conversation: &Conversation) -> Option<String> {
    if let Some(scene) = &conversation.scene {
        if let Some(banner) = &scene.title_banner {
            return Some(banner.clone());
        }
    }
    let builder_dm = builder_dm_id();
    let guide_dm = guide_dm_id();
    match conversation.conversation_id.0.as_str() {
        value if value == builder_dm.0.as_str() => Some("夜航居所".into()),
        value if value == guide_dm.0.as_str() => Some("新手居所".into()),
        "room:world:lobby" => Some("世界广场".into()),
        "room:city:core-harbor:lobby" => Some("城邦大厅".into()),
        "room:city:aurora-hub:announcements" => Some("城主告示".into()),
        _ => None,
    }
}

pub(crate) fn conversation_scene_summary(conversation: &Conversation) -> String {
    if let Some(scene) = &conversation.scene {
        return scene.ambiance.clone();
    }
    let builder_dm = builder_dm_id();
    let guide_dm = guide_dm_id();
    match conversation.conversation_id.0.as_str() {
        value if value == builder_dm.0.as_str() => "适合贴耳对句、补一笔居所回声。".into(),
        value if value == guide_dm.0.as_str() => "适合新手问路、补一点上下文、慢慢跟上。".into(),
        "room:world:lobby" => "先把广场回声跑顺，再慢慢展开世界门牌与护阵簿。".into(),
        "room:city:core-harbor:lobby" => {
            "先把公共频道聊顺，城主府、居民区和传送阵都要贴在一起。".into()
        }
        "room:city:aurora-hub:announcements" => "城主动作挂在旁边，主屏仍守住城内回声。".into(),
        _ => "直接落字即可续上当前回声。".into(),
    }
}

fn latest_message_snapshot(
    store: &impl TimelineStore,
    conversation: &Conversation,
    now_ms: i64,
) -> Option<(String, String, String)> {
    store
        .recent_messages(&conversation.conversation_id, 1)
        .into_iter()
        .last()
        .map(|entry| {
            let preview = timeline_entry_preview(&entry);
            (
                entry.envelope.sender.0,
                preview,
                timestamp_label(entry.envelope.timestamp_ms, now_ms),
            )
        })
}

pub(crate) fn conversation_list_kicker(mode: LaunchSurface, conversation: &Conversation) -> String {
    match mode {
        LaunchSurface::Admin => match conversation.scope {
            ConversationScope::Private => "待回帖居所 · 沿线追问".into(),
            ConversationScope::CityPrivate => "城主告示 · 准入过目".into(),
            ConversationScope::CrossCityShared => "世界回廊 · 跨城望风".into(),
            ConversationScope::CityPublic => "大厅常亮 · 城里守夜".into(),
        },
        LaunchSurface::User => match conversation.scope {
            ConversationScope::Private => "一对一居所 · 直接回声".into(),
            ConversationScope::CityPrivate => "城主告示 · 暂作背景".into(),
            ConversationScope::CrossCityShared => "世界广场 · 共响回廊".into(),
            ConversationScope::CityPublic => "城内大厅 · 回声常亮".into(),
        },
        LaunchSurface::Direct => match conversation.scope {
            ConversationScope::Private => "居所单线 · 低打扰".into(),
            _ => "备用门牌 · 随时切换".into(),
        },
        LaunchSurface::World => match conversation.scope {
            ConversationScope::Private => "居所门牌 · 备用".into(),
            ConversationScope::CityPrivate => "城主告示 · 次级可见".into(),
            ConversationScope::CrossCityShared => "广场回廊 · 世界共响".into(),
            ConversationScope::CityPublic => "城邦大厅 · 本地常亮".into(),
        },
    }
}

pub(crate) fn conversation_list_summary(
    mode: LaunchSurface,
    store: &impl TimelineStore,
    conversation: &Conversation,
    now_ms: i64,
) -> String {
    let kicker = conversation_list_kicker(mode, conversation);
    let latest = latest_message_snapshot(store, conversation, now_ms)
        .map(|(sender, preview, at)| {
            let sender_label = if sender == launch_identity(mode) {
                "我".to_string()
            } else if sender == "system" {
                "守夜灯".to_string()
            } else {
                sender
            };
            format!("{at} · {sender_label}：{preview}")
        })
        .unwrap_or_else(|| "还没有回声，等你开口。".into());
    format!("{kicker}\n{latest}")
}

pub(crate) fn selectable_conversations(
    store: &impl TimelineStore,
    mode: LaunchSurface,
    active_conversation_id: &ConversationId,
) -> Vec<Conversation> {
    let mut conversations = store.active_conversations();
    let mut seeded = vec![launch_conversation(mode)];
    seeded.extend(launch_companion_conversations(mode));
    for conversation in seeded {
        if conversations
            .iter()
            .all(|item| item.conversation_id != conversation.conversation_id)
        {
            conversations.push(conversation);
        }
    }
    conversations.sort_by(|left, right| {
        let left_rank = usize::from(left.conversation_id != *active_conversation_id);
        let right_rank = usize::from(right.conversation_id != *active_conversation_id);
        left_rank
            .cmp(&right_rank)
            .then_with(|| conversation_title(left).cmp(&conversation_title(right)))
    });
    conversations
}

pub(crate) fn conversation_marker(title: &str) -> &'static str {
    if title.contains("居所") || title.contains("私帖") {
        "@"
    } else if title.contains("管理") || title.contains("城主") || title.contains("告示") {
        "!"
    } else if title.contains("世界") || title.contains("广场") {
        "#"
    } else if title.contains("城市") || title.contains("城") {
        "*"
    } else {
        "•"
    }
}
