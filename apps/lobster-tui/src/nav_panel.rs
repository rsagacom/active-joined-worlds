use ratatui::{
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::ListItem,
};

use super::{
    LaunchContext, SESSION_PANEL_WIDTH, display_surface_page, previewing_selection,
    ratatui_solid_chip, ratatui_tag_chip, surface_role_chip, truncate_to_width,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RatatuiNavTone {
    Active,
    Selected,
    Idle,
    Private,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RatatuiNavRow {
    pub(crate) marker: &'static str,
    pub(crate) slot: usize,
    pub(crate) title: String,
    pub(crate) summary: String,
    pub(crate) show_summary: bool,
    pub(crate) show_enter_hint: bool,
    pub(crate) tone: RatatuiNavTone,
}

pub(crate) fn ratatui_nav_rows(context: &LaunchContext) -> (Vec<RatatuiNavRow>, usize) {
    let previewing = previewing_selection(context);
    let rows = context
        .conversation_rows
        .iter()
        .map(|row| {
            let tone = if row.is_active {
                RatatuiNavTone::Active
            } else if row.is_selected {
                RatatuiNavTone::Selected
            } else if row.is_private {
                RatatuiNavTone::Private
            } else {
                RatatuiNavTone::Idle
            };
            let marker = match tone {
                RatatuiNavTone::Active => "▶",
                RatatuiNavTone::Selected => "▷",
                RatatuiNavTone::Private => "@",
                RatatuiNavTone::Idle => "·",
            };
            RatatuiNavRow {
                marker,
                slot: row.slot,
                title: row.title.clone(),
                summary: row.summary.clone(),
                show_summary: if previewing {
                    row.is_selected
                } else {
                    row.is_active
                },
                show_enter_hint: previewing && row.is_selected && !row.is_active,
                tone,
            }
        })
        .collect::<Vec<_>>();
    let selected_index = context
        .conversation_rows
        .iter()
        .position(|row| row.is_selected)
        .or_else(|| {
            context
                .conversation_rows
                .iter()
                .position(|row| row.is_active)
        })
        .unwrap_or(0);
    (rows, selected_index)
}

pub(crate) fn ratatui_nav_item_lines(row: &RatatuiNavRow, selected: bool) -> Vec<Line<'static>> {
    let card_style = match row.tone {
        RatatuiNavTone::Active => Some(
            Style::default()
                .fg(Color::Black)
                .bg(Color::Yellow)
                .add_modifier(Modifier::BOLD),
        ),
        RatatuiNavTone::Selected if selected => Some(
            Style::default()
                .fg(Color::Black)
                .bg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        ),
        _ => None,
    };
    let marker_style = match row.tone {
        RatatuiNavTone::Active => Style::default()
            .fg(Color::Yellow)
            .add_modifier(Modifier::BOLD),
        RatatuiNavTone::Selected => {
            if selected {
                Style::default()
                    .fg(Color::Black)
                    .bg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            }
        }
        RatatuiNavTone::Private => Style::default().fg(Color::LightMagenta),
        RatatuiNavTone::Idle => Style::default().fg(Color::Gray),
    };
    let slot_style = match row.tone {
        RatatuiNavTone::Active => Style::default()
            .fg(Color::Black)
            .bg(Color::Yellow)
            .add_modifier(Modifier::BOLD),
        RatatuiNavTone::Selected => {
            if selected {
                Style::default()
                    .fg(Color::Black)
                    .bg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            }
        }
        RatatuiNavTone::Private => Style::default()
            .fg(Color::Black)
            .bg(Color::LightMagenta)
            .add_modifier(Modifier::BOLD),
        RatatuiNavTone::Idle => Style::default().fg(Color::Gray),
    };
    let title_style = match row.tone {
        RatatuiNavTone::Active => Style::default()
            .fg(Color::Black)
            .bg(Color::Yellow)
            .add_modifier(Modifier::BOLD),
        RatatuiNavTone::Selected => {
            if selected {
                Style::default()
                    .fg(Color::Black)
                    .bg(Color::Cyan)
                    .add_modifier(Modifier::BOLD)
            } else {
                Style::default()
                    .fg(Color::White)
                    .add_modifier(Modifier::BOLD)
            }
        }
        RatatuiNavTone::Private => Style::default().fg(Color::LightMagenta),
        RatatuiNavTone::Idle => Style::default().fg(Color::Gray),
    };
    let gutter_style = match row.tone {
        RatatuiNavTone::Private => Style::default().fg(Color::LightMagenta),
        RatatuiNavTone::Idle => Style::default().fg(Color::Gray),
        RatatuiNavTone::Selected => Style::default().fg(Color::Cyan),
        RatatuiNavTone::Active => Style::default().fg(Color::Yellow),
    };

    let mut top_spans = Vec::new();
    if let Some(style) = card_style {
        top_spans.push(Span::styled("▐", style));
        top_spans.push(Span::raw(" "));
    } else {
        top_spans.push(Span::styled("▏", gutter_style));
        top_spans.push(Span::raw(" "));
    }
    top_spans.push(Span::styled(format!("{} ", row.marker), marker_style));
    top_spans.push(Span::styled(format!("{:>2}", row.slot), slot_style));
    top_spans.push(Span::raw(" "));
    top_spans.push(Span::styled(row.title.clone(), title_style));
    if let Some(style) = card_style {
        top_spans.push(Span::raw(" "));
        top_spans.push(Span::styled("▌", style));
    }

    let mut lines = vec![Line::from(top_spans)];

    if row.show_summary {
        let summary_style = match row.tone {
            RatatuiNavTone::Active => Style::default().fg(Color::Yellow),
            RatatuiNavTone::Selected => {
                if selected {
                    Style::default().fg(Color::Black).bg(Color::Cyan)
                } else {
                    Style::default().fg(Color::Cyan)
                }
            }
            RatatuiNavTone::Private => Style::default().fg(Color::LightMagenta),
            RatatuiNavTone::Idle => Style::default().fg(Color::Gray),
        }
        .add_modifier(if selected {
            Modifier::BOLD
        } else {
            Modifier::ITALIC
        });
        let mut summary_spans = Vec::new();
        if let Some(style) = card_style {
            summary_spans.push(Span::raw(" "));
            summary_spans.push(Span::styled("▐", style));
            summary_spans.push(Span::raw(" "));
        } else {
            summary_spans.push(Span::styled("▏", gutter_style));
            summary_spans.push(Span::raw("   "));
        }
        if row.show_enter_hint {
            summary_spans.push(ratatui_tag_chip("回车入城内", Color::Green));
            summary_spans.push(Span::raw(" "));
            summary_spans.push(Span::styled(
                truncate_to_width(&row.summary, SESSION_PANEL_WIDTH.saturating_sub(16)),
                summary_style,
            ));
        } else {
            summary_spans.push(Span::styled(
                truncate_to_width(&row.summary, SESSION_PANEL_WIDTH.saturating_sub(9)),
                summary_style,
            ));
        }
        if let Some(style) = card_style {
            summary_spans.push(Span::raw(" "));
            summary_spans.push(Span::styled("▌", style));
        }
        lines.push(Line::from(summary_spans));
    }

    lines
}

pub(crate) fn ratatui_nav_items(
    rows: &[RatatuiNavRow],
    selected_index: usize,
) -> Vec<ListItem<'static>> {
    rows.iter()
        .enumerate()
        .map(|(index, row)| ListItem::new(ratatui_nav_item_lines(row, index == selected_index)))
        .collect()
}

pub(crate) fn session_info_detail_rows(context: &LaunchContext) -> Vec<String> {
    fn profile_card_rows(title: String, body: Vec<String>, footer: String) -> Vec<String> {
        let line_width = SESSION_PANEL_WIDTH.saturating_sub(4).max(12);
        let mut rows = Vec::with_capacity(body.len() + 2);
        rows.push(format!("┌{}┐", truncate_to_width(&title, line_width)));
        rows.extend(
            body.into_iter()
                .map(|row| format!("│{}│", truncate_to_width(&row, line_width))),
        );
        rows.push(format!("└{}┘", truncate_to_width(&footer, line_width)));
        rows
    }

    match display_surface_page(context) {
        super::SurfacePage::CityPublic => {
            let action = if matches!(context.mode, super::LaunchSurface::Admin) {
                "动作 /world"
            } else {
                "动作 /dm guide"
            };
            let title = if matches!(context.mode, super::LaunchSurface::Admin) {
                "城主档案 · 角色卡".to_string()
            } else {
                "城市向导 · 角色卡".to_string()
            };
            let subtitle = if matches!(context.mode, super::LaunchSurface::Admin) {
                "称号 城内告示主理".to_string()
            } else {
                "称号 公共频道引路".to_string()
            };
            let role_line = if matches!(context.mode, super::LaunchSurface::Admin) {
                "角色 城主档案".to_string()
            } else {
                "角色 城市向导".to_string()
            };
            profile_card_rows(
                title,
                vec![
                    if matches!(context.mode, super::LaunchSurface::Admin) {
                        "立绘 城主档案".to_string()
                    } else {
                        "立绘 城市向导".to_string()
                    },
                    if matches!(context.mode, super::LaunchSurface::Admin) {
                        "定位 城内主理".to_string()
                    } else {
                        "定位 公共引路".to_string()
                    },
                    role_line,
                    subtitle,
                    format!(
                        "当前 {}",
                        truncate_to_width(
                            &context.active_conversation,
                            SESSION_PANEL_WIDTH.saturating_sub(10)
                        )
                    ),
                    "状态 公共频道".into(),
                    action.into(),
                    "[私聊] [委托]".into(),
                ],
                "联结 ▰▰▰▰ 100%".into(),
            )
        }
        super::SurfacePage::World => vec![
            format!(
                "当前 {}",
                truncate_to_width(
                    &context.active_conversation,
                    SESSION_PANEL_WIDTH.saturating_sub(8)
                )
            ),
            "状态 跨城共响".into(),
            "动作 /open 1".into(),
        ],
        super::SurfacePage::ResidenceDirect => {
            let companion = context
                .active_participant_label
                .strip_prefix("你与 ")
                .unwrap_or("guide");
            profile_card_rows(
                format!(
                    "住户卡 · {}",
                    truncate_to_width(&context.identity, SESSION_PANEL_WIDTH.saturating_sub(10))
                ),
                vec![
                    "立绘 住户档案".into(),
                    format!(
                        "同住 {}",
                        truncate_to_width(companion, SESSION_PANEL_WIDTH.saturating_sub(9))
                    ),
                    format!(
                        "住户 {}",
                        truncate_to_width(&context.identity, SESSION_PANEL_WIDTH.saturating_sub(7))
                    ),
                    format!(
                        "同住AI {}",
                        truncate_to_width(companion, SESSION_PANEL_WIDTH.saturating_sub(9))
                    ),
                    "私线 房内续聊".into(),
                    "状态 房内连线".into(),
                    "动作 Enter 续聊".into(),
                    "[续聊] [整理]".into(),
                ],
                "亲和 ▰▰▰▰ 100%".into(),
            )
        }
    }
}

pub(crate) fn ratatui_session_info_lines(context: &LaunchContext) -> Vec<Line<'static>> {
    let mut lines = vec![Line::from(vec![
        ratatui_solid_chip(
            format!("门牌印#{}", context.active_conversation_index),
            Color::Black,
            Color::Yellow,
        ),
        Span::raw(" "),
        ratatui_solid_chip(
            truncate_to_width(&context.identity, 10),
            Color::Black,
            Color::Cyan,
        ),
        Span::raw(" "),
        ratatui_solid_chip(surface_role_chip(context.mode), Color::Black, Color::Blue),
    ])];

    lines.extend(
        session_info_detail_rows(context)
            .into_iter()
            .map(|row| Line::from(vec![Span::styled(row, Style::default().fg(Color::Gray))])),
    );

    lines
}
