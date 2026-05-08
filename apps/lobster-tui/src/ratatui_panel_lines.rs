use ratatui::{
    style::{Color, Modifier, Style},
    text::{Line, Span},
};

use super::{
    INPUT_PANEL_WIDTH, LaunchContext, input_composer_line, input_panel_semantics,
    input_target_line, ratatui_input_state_badge, ratatui_scene_chip_line, scene_panel_semantics,
    transcript_panel_focused, truncate_to_width,
};

fn ratatui_scene_summary_line(context: &LaunchContext) -> Line<'static> {
    let semantics = scene_panel_semantics(context);
    Line::from(vec![
        Span::styled("场记", Style::default().fg(Color::Yellow)),
        Span::raw(" "),
        Span::styled(
            truncate_to_width(&semantics.summary, 52),
            Style::default().fg(Color::DarkGray),
        ),
    ])
}

pub(crate) fn ratatui_scene_lines(context: &LaunchContext) -> Vec<Line<'static>> {
    let mut lines = vec![ratatui_scene_chip_line(context)];
    lines.extend(super::ratatui_scene_tile_rows(context));
    lines.push(ratatui_scene_summary_line(context));
    lines
}

pub(crate) fn ratatui_transcript_focus_badge(context: &LaunchContext) -> Option<&'static str> {
    if transcript_panel_focused(context) {
        Some("↑/↓·滚动")
    } else {
        None
    }
}

pub(crate) fn ratatui_input_lines(context: &LaunchContext) -> Vec<Line<'static>> {
    let target_width = INPUT_PANEL_WIDTH.saturating_sub(48).max(12);
    let composer_width = INPUT_PANEL_WIDTH.saturating_sub(6);
    let semantics = input_panel_semantics(context, target_width);
    let tip_color = Color::DarkGray;
    let target_color = Color::DarkGray;
    let composer_style = if semantics.is_input_focused {
        Style::default()
            .fg(Color::Black)
            .bg(Color::Green)
            .add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::DarkGray)
    };
    vec![
        Line::from(vec![
            Span::styled(
                semantics.prompt_state.to_string(),
                Style::default().fg(Color::DarkGray),
            ),
            Span::raw(" "),
            ratatui_input_state_badge(&semantics),
            Span::raw(" "),
            Span::styled(
                semantics.panel_title.to_string(),
                Style::default().fg(Color::DarkGray),
            ),
            Span::raw(" "),
            Span::styled(semantics.tip.to_string(), Style::default().fg(tip_color)),
            Span::raw(" "),
            Span::styled(
                input_target_line(&semantics, target_width),
                Style::default().fg(target_color),
            ),
        ]),
        Line::from(vec![Span::styled(
            format!("▚{}▞", input_composer_line(&semantics, composer_width)),
            composer_style,
        )]),
    ]
}
