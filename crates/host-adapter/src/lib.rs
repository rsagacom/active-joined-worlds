use chat_core::{ClientClass, ClientProfile, SurfaceMode};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WebShellStorageMode {
    IndexedDbPreferred,
    MemoryOnlyFallback,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WebShellConfig {
    pub route_prefix: String,
    pub supports_offline_shell: bool,
    pub storage_mode: WebShellStorageMode,
    pub stream_incremental_updates: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HostCapabilities {
    pub client_profile: ClientProfile,
    pub preferred_surface: SurfaceMode,
    pub max_inline_chars: usize,
    pub supports_push_notifications: bool,
    pub supports_voice_input: bool,
    pub supports_camera_ingest: bool,
    pub supports_background_sync: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WebInitialSurface {
    RoomList,
    DirectMessages,
    ConversationView,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WebShellBootstrap {
    pub host: HostCapabilities,
    pub shell: WebShellConfig,
    pub initial_surface: WebInitialSurface,
    pub offline_cache_budget_mb: u32,
    pub supports_background_resync: bool,
    pub gateway_base_url: Option<String>,
    pub refresh_interval_ms: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TerminalColorSupport {
    Monochrome,
    Ansi16,
    Ansi256,
    TrueColor,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TerminalGlyphSupport {
    AsciiOnly,
    UnicodeBasic,
    UnicodeBlocks,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TerminalArtDirection {
    FamicomSymbolic,
    SuperFamicomAmbient,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TerminalRenderProfile {
    pub art_direction: TerminalArtDirection,
    pub color_support: TerminalColorSupport,
    pub glyph_support: TerminalGlyphSupport,
    pub prefer_partial_refresh: bool,
    pub prefer_double_buffer: bool,
    pub allow_portrait_cards: bool,
    pub soft_shading: bool,
    pub max_map_columns: usize,
}

impl TerminalRenderProfile {
    pub fn desktop_default() -> Self {
        Self {
            art_direction: TerminalArtDirection::SuperFamicomAmbient,
            color_support: TerminalColorSupport::TrueColor,
            glyph_support: TerminalGlyphSupport::UnicodeBlocks,
            prefer_partial_refresh: true,
            prefer_double_buffer: true,
            allow_portrait_cards: true,
            soft_shading: true,
            max_map_columns: 120,
        }
    }

    pub fn low_resource_default() -> Self {
        Self {
            art_direction: TerminalArtDirection::FamicomSymbolic,
            color_support: TerminalColorSupport::Ansi16,
            glyph_support: TerminalGlyphSupport::AsciiOnly,
            prefer_partial_refresh: true,
            prefer_double_buffer: false,
            allow_portrait_cards: false,
            soft_shading: false,
            max_map_columns: 64,
        }
    }

    pub fn degrade_to(
        mut self,
        color_support: TerminalColorSupport,
        glyph_support: TerminalGlyphSupport,
    ) -> Self {
        self.color_support = color_support;
        self.glyph_support = glyph_support;

        if matches!(
            color_support,
            TerminalColorSupport::Monochrome | TerminalColorSupport::Ansi16
        ) || matches!(glyph_support, TerminalGlyphSupport::AsciiOnly)
        {
            self.art_direction = TerminalArtDirection::FamicomSymbolic;
            self.soft_shading = false;
            self.allow_portrait_cards = false;
        }

        if matches!(color_support, TerminalColorSupport::Monochrome) {
            self.prefer_double_buffer = false;
        }

        if matches!(glyph_support, TerminalGlyphSupport::AsciiOnly) {
            self.max_map_columns = self.max_map_columns.min(72);
        }

        self
    }
}

impl HostCapabilities {
    pub fn lobster_embedded() -> Self {
        Self {
            client_profile: ClientProfile::lobster_embedded(),
            preferred_surface: SurfaceMode::EmbeddedHeadless,
            max_inline_chars: 256,
            supports_push_notifications: false,
            supports_voice_input: false,
            supports_camera_ingest: false,
            supports_background_sync: true,
        }
    }

    pub fn desktop_terminal() -> Self {
        Self {
            client_profile: ClientProfile::desktop_terminal(),
            preferred_surface: SurfaceMode::FullTerminal,
            max_inline_chars: 4_096,
            supports_push_notifications: true,
            supports_voice_input: true,
            supports_camera_ingest: false,
            supports_background_sync: true,
        }
    }

    pub fn wearable_glasses() -> Self {
        Self {
            client_profile: ClientProfile::wearable_glasses(),
            preferred_surface: SurfaceMode::WearableGlance,
            max_inline_chars: 160,
            supports_push_notifications: true,
            supports_voice_input: true,
            supports_camera_ingest: true,
            supports_background_sync: false,
        }
    }

    pub fn mobile_web() -> Self {
        Self {
            client_profile: ClientProfile::mobile_web(),
            preferred_surface: SurfaceMode::CompactTerminal,
            max_inline_chars: 512,
            supports_push_notifications: true,
            supports_voice_input: true,
            supports_camera_ingest: false,
            supports_background_sync: false,
        }
    }

    pub fn is_low_resource(&self) -> bool {
        matches!(
            self.client_profile.class,
            ClientClass::Embedded | ClientClass::MobileWeb | ClientClass::Wearable
        )
    }

    pub fn recommended_terminal_render_profile(&self) -> TerminalRenderProfile {
        match self.client_profile.class {
            ClientClass::Desktop => TerminalRenderProfile::desktop_default(),
            ClientClass::Embedded | ClientClass::MobileWeb | ClientClass::Wearable => {
                TerminalRenderProfile::low_resource_default()
            }
            ClientClass::Service => TerminalRenderProfile::low_resource_default().degrade_to(
                TerminalColorSupport::Monochrome,
                TerminalGlyphSupport::AsciiOnly,
            ),
        }
    }
}

pub trait HostBridge {
    fn host_name(&self) -> &str;
    fn capabilities(&self) -> HostCapabilities;
    fn emit_status(&self, message: &str);
}

pub trait CommandSurface {
    fn open_room(&self, room_id: &str);
    fn open_dm(&self, peer_id: &str);
}

pub trait EmbeddedBridge {
    fn low_power_mode(&self) -> bool;
    fn memory_budget_kib(&self) -> u32;
}

pub trait WearableBridge {
    fn supports_glance_cards(&self) -> bool;
    fn supports_voice_reply(&self) -> bool;
    fn max_glance_chars(&self) -> usize;
}

pub trait MobileWebBridge {
    fn supports_pwa_shell(&self) -> bool;
    fn storage_quota_mb(&self) -> u32;
    fn prefers_streaming_updates(&self) -> bool;
}

pub fn default_mobile_web_shell() -> WebShellConfig {
    WebShellConfig {
        route_prefix: "/app".into(),
        supports_offline_shell: true,
        storage_mode: WebShellStorageMode::IndexedDbPreferred,
        stream_incremental_updates: true,
    }
}

pub fn default_mobile_web_bootstrap() -> WebShellBootstrap {
    WebShellBootstrap {
        host: HostCapabilities::mobile_web(),
        shell: default_mobile_web_shell(),
        initial_surface: WebInitialSurface::RoomList,
        offline_cache_budget_mb: 64,
        supports_background_resync: false,
        gateway_base_url: None,
        refresh_interval_ms: 4_000,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn desktop_prefers_sfc_style() {
        let profile = HostCapabilities::desktop_terminal().recommended_terminal_render_profile();
        assert_eq!(
            profile.art_direction,
            TerminalArtDirection::SuperFamicomAmbient
        );
        assert_eq!(profile.color_support, TerminalColorSupport::TrueColor);
        assert_eq!(profile.glyph_support, TerminalGlyphSupport::UnicodeBlocks);
    }

    #[test]
    fn embedded_downgrades_to_symbolic_profile() {
        let profile = HostCapabilities::lobster_embedded().recommended_terminal_render_profile();
        assert_eq!(profile.art_direction, TerminalArtDirection::FamicomSymbolic);
        assert_eq!(profile.color_support, TerminalColorSupport::Ansi16);
        assert_eq!(profile.glyph_support, TerminalGlyphSupport::AsciiOnly);
        assert!(!profile.allow_portrait_cards);
    }

    #[test]
    fn degrade_to_ascii_turns_off_portraits() {
        let profile = TerminalRenderProfile::desktop_default().degrade_to(
            TerminalColorSupport::Ansi16,
            TerminalGlyphSupport::AsciiOnly,
        );
        assert_eq!(profile.art_direction, TerminalArtDirection::FamicomSymbolic);
        assert!(!profile.allow_portrait_cards);
        assert!(!profile.soft_shading);
    }
}
