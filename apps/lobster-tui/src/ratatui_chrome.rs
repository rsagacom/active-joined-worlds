use ratatui::{
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, BorderType, Borders},
};

use super::{
    InputPanelSemantics, LaunchContext, PanelTone, SurfacePage, TerminalRenderProfile,
    active_input_panel_title, display_conversation, display_message_count,
    display_participant_count, display_scene_banner, display_surface_page, previewing_selection,
    scene_panel_semantics, surface_page_title, surface_role_chip, surface_scene_chip,
    surface_scene_panel_title_for_page, surface_transcript_panel_title_for_page, truncate_to_width,
};

pub(crate) fn ratatui_input_state_badge(semantics: &InputPanelSemantics) -> Span<'static> {
    if semantics.is_input_focused {
        ratatui_tag_chip(semantics.state_label, Color::Green)
    } else {
        ratatui_tag_chip(semantics.state_label, Color::DarkGray)
    }
}

pub(crate) fn ratatui_solid_chip(label: impl Into<String>, fg: Color, bg: Color) -> Span<'static> {
    Span::styled(
        format!("▛{}▜", label.into()),
        Style::default().fg(fg).bg(bg).add_modifier(Modifier::BOLD),
    )
}

pub(crate) fn ratatui_tag_chip(label: impl Into<String>, fg: Color) -> Span<'static> {
    Span::styled(
        format!("▚{}▞", label.into()),
        Style::default().fg(fg).add_modifier(Modifier::BOLD),
    )
}

fn ratatui_transport_state_chip(context: &LaunchContext) -> String {
    context
        .transport_state
        .split('·')
        .next()
        .unwrap_or(context.transport_state.as_str())
        .trim()
        .to_string()
}

pub(crate) fn ratatui_header_line(context: &LaunchContext) -> Line<'static> {
    Line::from(vec![
        ratatui_solid_chip("城邦像素终端", Color::Black, Color::Yellow),
        Span::raw(" "),
        ratatui_solid_chip(
            truncate_to_width(&context.world_title, 14),
            Color::Black,
            Color::Cyan,
        ),
        Span::raw(" "),
        ratatui_solid_chip(surface_page_title(context.mode), Color::Black, Color::Green),
        Span::raw("  "),
        ratatui_tag_chip("A 地图", Color::DarkGray),
        Span::raw(" "),
        ratatui_tag_chip("B 委托", Color::DarkGray),
        Span::raw(" "),
        ratatui_solid_chip(surface_role_chip(context.mode), Color::Black, Color::Blue),
    ])
}

pub(crate) fn ratatui_status_line(context: &LaunchContext) -> Line<'static> {
    let mut spans = vec![
        ratatui_solid_chip(surface_role_chip(context.mode), Color::Black, Color::Blue),
        Span::raw(" "),
        ratatui_solid_chip(
            surface_scene_chip(context.mode),
            Color::Black,
            Color::Yellow,
        ),
        Span::raw(" "),
    ];

    if previewing_selection(context) {
        spans.push(ratatui_solid_chip(
            format!(
                "已入 {}",
                truncate_to_width(&context.active_conversation, 18)
            ),
            Color::Black,
            Color::Green,
        ));
        spans.push(Span::raw(" "));
        spans.push(ratatui_solid_chip(
            format!(
                "预览 {}",
                truncate_to_width(display_conversation(context), 18)
            ),
            Color::Black,
            Color::Cyan,
        ));
    } else {
        spans.push(ratatui_solid_chip(
            format!(
                "已入 {}",
                truncate_to_width(&context.active_conversation, 18)
            ),
            Color::Black,
            Color::Green,
        ));
    }

    spans.extend([
        Span::raw(" "),
        ratatui_solid_chip(
            format!("住客 {}", display_participant_count(context)),
            Color::White,
            Color::DarkGray,
        ),
        Span::raw(" "),
        ratatui_solid_chip(
            format!("回声 {}", display_message_count(context)),
            Color::White,
            Color::DarkGray,
        ),
        Span::raw(" "),
        ratatui_solid_chip(
            ratatui_transport_state_chip(context),
            Color::Black,
            Color::Green,
        ),
    ]);

    Line::from(spans)
}

pub(crate) fn ratatui_block_frame_title(
    title: &str,
    focused: bool,
    focus_badge: Option<&str>,
) -> String {
    if focused {
        if let Some(badge) = focus_badge {
            return format!("{title} · {}", ratatui_outline_badge(badge));
        }
    }
    title.to_string()
}

pub(crate) fn ratatui_scene_block_title(context: &LaunchContext) -> String {
    let state_badge = if previewing_selection(context) {
        ratatui_outline_badge("预览")
    } else {
        ratatui_outline_badge("已入")
    };
    let page = display_surface_page(context);
    let scene_title =
        display_scene_banner(context).unwrap_or_else(|| display_conversation(context));
    format!(
        "{} · {} · {}",
        ratatui_title_badge(surface_scene_panel_title_for_page(page)),
        state_badge,
        ratatui_title_badge(&truncate_to_width(scene_title, 18))
    )
}

pub(crate) fn ratatui_title_badge(text: &str) -> String {
    format!("▛{}▜", text)
}

fn ratatui_outline_badge(text: &str) -> String {
    format!("▚{}▞", text)
}

pub(crate) fn ratatui_transcript_block_title(context: &LaunchContext) -> String {
    let state_badge = if previewing_selection(context) {
        ratatui_outline_badge("预览")
    } else {
        ratatui_outline_badge("已入")
    };
    let page = display_surface_page(context);
    format!(
        "{} · {} · {}",
        ratatui_title_badge(surface_transcript_panel_title_for_page(page)),
        state_badge,
        ratatui_title_badge(&truncate_to_width(display_conversation(context), 18)),
    )
}

pub(crate) fn ratatui_input_block_title(context: &LaunchContext) -> String {
    format!(
        "{} · {} · {}",
        ratatui_title_badge(active_input_panel_title(context)),
        ratatui_outline_badge("已入"),
        ratatui_title_badge(&truncate_to_width(&context.active_conversation, 18)),
    )
}

pub(crate) fn ratatui_scene_chip_line(context: &LaunchContext) -> Line<'static> {
    let page = display_surface_page(context);
    let semantics = scene_panel_semantics(context);
    let mut chips = match page {
        SurfacePage::World => vec![
            (semantics.legend[0], Color::Cyan),
            (semantics.legend[1], Color::Yellow),
            (semantics.legend[2], Color::Magenta),
            ("河道", Color::Green),
        ],
        SurfacePage::ResidenceDirect => vec![
            (semantics.legend[0], Color::Magenta),
            (semantics.legend[1], Color::Yellow),
            (semantics.legend[2], Color::Cyan),
            ("回响纹", Color::Green),
        ],
        SurfacePage::CityPublic => vec![
            (semantics.legend[0], Color::Yellow),
            (semantics.legend[1], Color::Green),
            (semantics.legend[2], Color::Magenta),
            ("钟塔", Color::Cyan),
        ],
    };

    let mut spans = Vec::new();
    for (index, (label, color)) in chips.drain(..).enumerate() {
        if index > 0 {
            spans.push(Span::raw(" "));
        }
        let chip = if index == 0 {
            ratatui_solid_chip(label, Color::Black, color)
        } else {
            ratatui_tag_chip(label, color)
        };
        spans.push(chip);
    }
    Line::from(spans)
}

fn ratatui_border_style(tone: PanelTone, focused: bool) -> Style {
    let color = match tone {
        PanelTone::Sidebar => Color::Cyan,
        PanelTone::Thread => Color::Yellow,
        PanelTone::Composer => Color::Green,
    };
    if focused {
        Style::default().fg(color).add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::DarkGray)
    }
}

pub(crate) fn ratatui_border_type(focused: bool) -> BorderType {
    if focused {
        BorderType::QuadrantOutside
    } else {
        BorderType::QuadrantInside
    }
}

pub(crate) fn ratatui_nav_highlight_style(focused: bool) -> Style {
    let _ = focused;
    Style::default()
}

pub(crate) fn ratatui_block(
    _render_profile: TerminalRenderProfile,
    title: &str,
    focused: bool,
    tone: PanelTone,
    focus_badge: Option<&str>,
) -> Block<'static> {
    Block::default()
        .borders(Borders::ALL)
        .title(ratatui_block_frame_title(title, focused, focus_badge))
        .border_type(ratatui_border_type(focused))
        .border_style(ratatui_border_style(tone, focused))
}
