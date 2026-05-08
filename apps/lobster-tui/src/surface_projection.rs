use crate::{Conversation, ConversationKind, ConversationScope};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SurfacePage {
    CityPublic,
    World,
    ResidenceDirect,
}

pub(crate) fn conversation_surface_page(conversation: &Conversation) -> SurfacePage {
    if matches!(conversation.kind, ConversationKind::Direct) {
        SurfacePage::ResidenceDirect
    } else if matches!(conversation.scope, ConversationScope::CrossCityShared) {
        SurfacePage::World
    } else {
        SurfacePage::CityPublic
    }
}
