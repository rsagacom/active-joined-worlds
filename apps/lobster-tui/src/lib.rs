use chat_core::{
    AgentSceneSlot, AgentScope, AgentUseCase, ClientProfile, Conversation, ConversationId,
    ConversationKind, ConversationScope, PixelAvatarProfile, SceneLandmark, SceneMetadata,
    SceneRenderStyle, SceneScope,
};
#[cfg(test)]
use host_adapter::TerminalGlyphSupport;
use host_adapter::{TerminalColorSupport, TerminalRenderProfile};
#[cfg(test)]
use ratatui::style::Color;
mod app_bootstrap;
mod app_entry;
mod bootstrap_paths;
mod compact_shell;
mod conversation_bootstrap;
mod conversation_meta;
mod display_context;
mod input_panel;
mod launch_context_builder;
mod launch_seed;
mod layout_constants;
mod local_message;
mod message_projection;
mod nav_panel;
#[cfg(test)]
mod plain_panel_render;
mod plain_transcript;
mod ratatui_chrome;
mod ratatui_frame;
mod ratatui_panel_lines;
mod render_profile;
mod scene_panel;
mod seed_bootstrap;
mod selection_state;
mod shell_layout;
mod surface_meta;
mod surface_projection;
mod terminal_app_loop;
mod terminal_key_dispatch;
mod terminal_runtime;
mod terminal_shell_dispatch;
mod terminal_smoke_script;
mod terminal_snapshot;
mod terminal_submission;
#[cfg(test)]
mod test_support;
mod text_render;
mod transcript_panel;
mod transport_bootstrap;
mod transport_sync;
mod ui_helpers;
mod ui_types;
mod web_shell_export;

use compact_shell::render_compact_terminal_shell;
#[cfg(test)]
use compact_shell::{
    compact_scene_tile_rows, compact_shell_banner, render_compact_conversation_panel,
    render_compact_input_panel, render_compact_scene_panel, render_compact_transcript_panel,
};
#[cfg(test)]
use conversation_meta::conversation_list_kicker;
use conversation_meta::{
    conversation_kind_label, conversation_list_summary, conversation_marker,
    conversation_participant_label, conversation_route_label, conversation_scene_banner,
    conversation_scene_summary, conversation_sidebar_title, conversation_title,
    selectable_conversations,
};
use display_context::{
    display_conversation, display_message_count, display_participant_count, display_scene_banner,
    display_scene_metadata, display_scene_summary, display_surface_page, previewing_selection,
    timestamp_label, transcript_body_lines, transcript_scroll_start, transcript_window,
};
#[cfg(test)]
use display_context::{
    display_latest_message_hint, display_participant_label, display_route_label,
};
use input_panel::{
    InputPanelSemantics, active_input_panel_title, input_composer_line, input_panel_semantics,
    input_target_line,
};
#[cfg(test)]
use input_panel::{active_input_tip, active_prompt_state};
use launch_context_builder::{ConversationRow, LaunchContext, build_launch_context};
use launch_seed::{
    current_time_ms, direct_conversation, launch_companion_conversations, launch_conversation,
    launch_identity, seed_messages_for_conversation,
};
#[cfg(test)]
use layout_constants::CHAT_HEADER_HEIGHT;
#[cfg(test)]
use layout_constants::{CHAT_BODY_HEIGHT, INPUT_PANEL_HEIGHT, SESSION_LIST_HEIGHT};
use layout_constants::{
    CHAT_PANEL_WIDTH, INPUT_PANEL_WIDTH, MIN_RATATUI_STACKED_HEIGHT, MIN_RATATUI_STACKED_WIDTH,
    MIN_RATATUI_WIDE_HEIGHT, SESSION_PANEL_WIDTH,
};
use local_message::append_local_message;
#[cfg(test)]
use nav_panel::ratatui_nav_item_lines;
use nav_panel::{ratatui_nav_items, ratatui_nav_rows, ratatui_session_info_lines};
#[cfg(test)]
use plain_panel_render::{
    render_chat_header_panel, render_conversation_panel, render_header, render_input_panel,
    render_session_info_panel, render_status_strip, render_transcript_panel,
};
use plain_transcript::transcript_lines;
use ratatui_chrome::{
    ratatui_block, ratatui_header_line, ratatui_input_block_title, ratatui_input_state_badge,
    ratatui_nav_highlight_style, ratatui_scene_block_title, ratatui_scene_chip_line,
    ratatui_solid_chip, ratatui_status_line, ratatui_tag_chip, ratatui_transcript_block_title,
};
#[cfg(test)]
use ratatui_chrome::{ratatui_block_frame_title, ratatui_border_type, ratatui_title_badge};
use ratatui_frame::render_ratatui_frame;
#[cfg(test)]
use ratatui_frame::wide_frame_regions;
use ratatui_panel_lines::{
    ratatui_input_lines, ratatui_scene_lines, ratatui_transcript_focus_badge,
};
use render_profile::{resolve_runtime_render_profile, use_ascii_borders, use_block_sprite_glyphs};
#[cfg(test)]
use scene_panel::{SceneTileKind, ratatui_scene_tile_grid, scene_legend_labels_for_page};
use scene_panel::{
    ratatui_scene_tile_rows, scene_legend_summary, scene_panel_semantics,
    scene_tile_projection_rows,
};
use selection_state::{
    enter_selected_conversation, focus_input_area, leave_input_area, move_selection,
};
use shell_layout::{
    ShellLayoutMode, shell_layout_mode_for_size, terminal_height_hint, terminal_width_hint,
};
#[cfg(test)]
use surface_meta::{
    mode_accent_kind, mode_callout, mode_input_tip, mode_panel_meta, room_nav_entries,
    surface_page, surface_scene_panel_title, surface_transcript_panel_title,
};
use surface_meta::{
    surface_nav_panel_title, surface_page_title, surface_page_title_for_page,
    surface_private_section_label, surface_role_chip, surface_room_section_label,
    surface_scene_chip, surface_scene_panel_title_for_page, surface_status_panel_title,
    surface_transcript_panel_title_for_page,
};
use surface_projection::{SurfacePage, conversation_surface_page};
use terminal_key_dispatch::{handle_input_focus_key, handle_navigation_key};
use terminal_shell_dispatch::print_terminal_shell;
#[cfg(test)]
use terminal_shell_dispatch::render_ratatui_frame_lines;
use terminal_submission::{SubmissionAction, handle_terminal_submission};
#[cfg(test)]
use text_render::char_width;
#[cfg(test)]
use text_render::pad;
use text_render::{strip_ansi_sgr, truncate_to_width, wrap_text};
#[cfg(test)]
use transcript_panel::{RatatuiTranscriptRow, ratatui_transcript_line};
use transcript_panel::{RatatuiTranscriptTone, ratatui_transcript_lines, ratatui_transcript_rows};
use transport_bootstrap::{TransportAdapter, friendly_connection_label};
use ui_helpers::{
    colorize, focused_panel_title, input_cursor_glyph, ratatui_transcript_text_style,
    scene_panel_focused, transcript_panel_focused,
};
#[cfg(test)]
use ui_helpers::{input_focus_hint, nav_focus_hint};
use ui_types::{FocusArea, LaunchSurface, PanelTone};
use web_shell_export::export_web_shell_data;

pub use app_entry::run;

#[cfg(test)]
mod tests;
