use std::io::{self, IsTerminal, Write};

use super::{
    ConversationRow, FocusArea, LaunchContext, LaunchSurface, PanelTone, RatatuiTranscriptTone,
    TerminalRenderProfile, colorize, display_conversation, display_message_count,
    display_participant_count, display_scene_banner, display_surface_page, focused_panel_title,
    input_composer_line, input_panel_semantics, input_target_line, ratatui_scene_block_title,
    scene_legend_summary, scene_panel_focused, scene_panel_semantics, scene_tile_projection_rows,
    surface_nav_panel_title, surface_page_title_for_page, surface_private_section_label,
    surface_role_chip, surface_room_section_label, transcript_panel_focused, transcript_window,
    truncate_to_width, wrap_text,
};

pub(crate) fn sidebar_nav_row(mode: LaunchSurface) -> &'static str {
    match mode {
        LaunchSurface::Admin => "▶ 门/告/务/场",
        LaunchSurface::User => "▶ 城/墙/塔/井",
        LaunchSurface::World => "▶ 城/场/志/阵",
        LaunchSurface::Direct => "▶ 居/墙/托/灯",
    }
}

pub(crate) fn append_conversation_section(
    lines: &mut Vec<String>,
    _label: &str,
    rows: &[ConversationRow],
    context: &LaunchContext,
    preview_width: usize,
    include_active_summary: bool,
) {
    if rows.is_empty() {
        return;
    }

    for (position, row) in rows.iter().enumerate() {
        let badge = if row.is_active {
            colorize(
                context.render_profile,
                "warm",
                if super::use_ascii_borders(context.render_profile) {
                    ">"
                } else {
                    "▶"
                },
            )
        } else if row.is_selected {
            colorize(
                context.render_profile,
                "accent",
                if super::use_ascii_borders(context.render_profile) {
                    ">"
                } else {
                    "▷"
                },
            )
        } else {
            colorize(
                context.render_profile,
                "muted",
                if row.is_private {
                    "@"
                } else {
                    super::conversation_marker(&row.title)
                },
            )
        };
        let slot = colorize(
            context.render_profile,
            if row.is_active {
                "success"
            } else if row.is_selected {
                "accent"
            } else {
                "muted"
            },
            &format!("{:>2}", row.slot),
        );
        let title_line = format!(
            "{} {} {}",
            badge,
            slot,
            truncate_to_width(&row.title, preview_width.saturating_sub(5))
        );
        let styled_title = if row.is_active {
            colorize(context.render_profile, "warm", &title_line)
        } else if row.is_selected {
            colorize(context.render_profile, "accent", &title_line)
        } else {
            title_line
        };
        lines.push(styled_title);
        let show_summary = include_active_summary
            && ((row.is_active && !super::previewing_selection(context))
                || (row.is_selected && super::previewing_selection(context)));
        if show_summary {
            let summary =
                if row.is_selected && super::previewing_selection(context) && !row.is_active {
                    format!("回车入城内 · {}", row.summary)
                } else {
                    row.summary.clone()
                };
            for preview in wrap_text(&summary, preview_width).into_iter().take(1) {
                let preview_text = colorize(context.render_profile, "accent", &preview);
                lines.push(preview_text);
            }
        }
        if position + 1 < rows.len() && rows.len() <= 2 {
            lines.push(String::new());
        }
    }
}

fn compact_section_lines(
    title: &str,
    lines: &[String],
    width: usize,
    render_profile: TerminalRenderProfile,
    tone: PanelTone,
) -> Vec<String> {
    let title_kind = match tone {
        PanelTone::Sidebar => "accent",
        PanelTone::Thread => "warm",
        PanelTone::Composer => "success",
    };
    let divider = if super::use_ascii_borders(render_profile) {
        "-".repeat(width.max(1))
    } else {
        "─".repeat(width.max(1))
    };
    let mut out = Vec::new();
    out.push(colorize(render_profile, title_kind, title));
    out.push(colorize(render_profile, "muted", &divider));
    for line in lines {
        out.push(truncate_to_width(line, width));
    }
    out
}

fn tail_preserving_panel_header(lines: Vec<String>, budget: usize) -> Vec<String> {
    if lines.len() <= budget {
        return lines;
    }
    if budget <= 2 {
        return lines.into_iter().take(budget).collect();
    }

    let tail_budget = budget.saturating_sub(2);
    let split_at = lines.len().saturating_sub(tail_budget);
    let mut kept = lines[..2].to_vec();
    kept.extend_from_slice(&lines[split_at..]);
    kept
}

pub(crate) fn compact_shell_banner(context: &LaunchContext, width: usize) -> (String, String) {
    let page = display_surface_page(context);
    let semantics = scene_panel_semantics(context);
    let scene_title =
        display_scene_banner(context).unwrap_or_else(|| display_conversation(context));
    let legend = scene_legend_summary(semantics.legend);
    let header = format!(
        "城邦像素终端 · {} · {} · {}",
        surface_page_title_for_page(page),
        surface_role_chip(context.mode),
        truncate_to_width(scene_title, width.saturating_sub(34).max(18))
    );
    let subtitle = format!(
        "{} | {} | {} 住客/{} 回声 | {}",
        legend,
        truncate_to_width(&context.transport_state, width.saturating_sub(44).max(12)),
        display_participant_count(context),
        display_message_count(context),
        truncate_to_width(&semantics.summary, width.saturating_sub(50).max(16))
    );
    (header, subtitle)
}

pub(crate) fn compact_scene_tile_rows(context: &LaunchContext) -> Vec<String> {
    scene_tile_projection_rows(context)
        .into_iter()
        .map(|row| {
            row.into_iter()
                .map(|projection| projection.plain_text)
                .collect::<Vec<_>>()
                .join("")
        })
        .collect()
}

pub(crate) fn render_compact_conversation_panel(
    context: &LaunchContext,
    width: usize,
) -> Vec<String> {
    let preview_width = width.saturating_sub(8).max(24);
    let mut lines = Vec::new();
    lines.push(colorize(
        context.render_profile,
        "accent",
        sidebar_nav_row(context.mode),
    ));
    let rows = context
        .conversation_rows
        .iter()
        .cloned()
        .collect::<Vec<_>>();
    let (private_rows, room_rows): (Vec<_>, Vec<_>) =
        rows.into_iter().partition(|row| row.is_private);
    let body_limit = 12usize;
    let static_line_count = 1usize;
    let reserved_private_rows = usize::from(!private_rows.is_empty());
    let room_budget = body_limit.saturating_sub(static_line_count + reserved_private_rows);
    let room_rows = room_rows.into_iter().take(room_budget).collect::<Vec<_>>();
    let private_budget = body_limit.saturating_sub(static_line_count + room_rows.len());
    let private_rows = private_rows
        .into_iter()
        .take(private_budget)
        .collect::<Vec<_>>();

    append_conversation_section(
        &mut lines,
        surface_room_section_label(context.mode),
        &room_rows,
        context,
        preview_width,
        false,
    );
    append_conversation_section(
        &mut lines,
        surface_private_section_label(context.mode),
        &private_rows,
        context,
        preview_width,
        false,
    );

    if lines.is_empty() {
        lines.push("暂无房间".into());
    }

    lines.truncate(body_limit);
    compact_section_lines(
        surface_nav_panel_title(context.mode),
        &lines,
        width,
        context.render_profile,
        PanelTone::Sidebar,
    )
}

pub(crate) fn render_compact_scene_panel(context: &LaunchContext, width: usize) -> Vec<String> {
    let body_width = width.saturating_sub(8).max(24);
    let semantics = scene_panel_semantics(context);
    let mut lines = vec![colorize(
        context.render_profile,
        "muted",
        &scene_legend_summary(semantics.legend),
    )];
    lines.extend(
        compact_scene_tile_rows(context)
            .into_iter()
            .map(|row| truncate_to_width(&row, body_width))
            .collect::<Vec<_>>(),
    );
    lines.push(colorize(
        context.render_profile,
        "muted",
        &format!(
            "场记 {}",
            truncate_to_width(&semantics.summary, body_width.saturating_sub(3).max(8))
        ),
    ));
    compact_section_lines(
        &focused_panel_title(
            context.render_profile,
            &ratatui_scene_block_title(context),
            scene_panel_focused(context),
        ),
        &lines,
        width,
        context.render_profile,
        PanelTone::Thread,
    )
}

pub(crate) fn render_compact_transcript_panel(
    context: &LaunchContext,
    width: usize,
) -> Vec<String> {
    let body_width = width.saturating_sub(8).max(24);
    let mut lines = Vec::new();
    for row in super::ratatui_transcript_rows(context) {
        let content = if row.is_header {
            let badge = match row.tone {
                RatatuiTranscriptTone::SelfEcho => "我",
                RatatuiTranscriptTone::OtherEcho => "他",
                RatatuiTranscriptTone::SystemEcho => "系",
                RatatuiTranscriptTone::Neutral => "续",
            };
            format!("{badge} {}", row.text)
        } else {
            format!("· {}", row.text)
        };
        lines.extend(wrap_text(&content, body_width));
    }
    lines = transcript_window(&lines, 12usize, context.transcript_scroll);
    if context.focus_area == FocusArea::Input {
        lines = lines
            .into_iter()
            .map(|line| colorize(context.render_profile, "muted", &line))
            .collect();
    }
    compact_section_lines(
        &focused_panel_title(
            context.render_profile,
            &super::ratatui_transcript_block_title(context),
            transcript_panel_focused(context),
        ),
        &lines,
        width,
        context.render_profile,
        PanelTone::Thread,
    )
}

pub(crate) fn render_compact_input_panel(context: &LaunchContext, width: usize) -> Vec<String> {
    let line_width = width.saturating_sub(4);
    let target_width = line_width.saturating_sub(3);
    let composer_width = line_width.saturating_sub(2);
    let semantics = input_panel_semantics(context, target_width);
    let mut lines = Vec::new();
    lines.push(format!(
        "{} {} {} {}",
        colorize(
            context.render_profile,
            "muted",
            &format!("{} >", semantics.prompt_state),
        ),
        colorize(
            context.render_profile,
            if semantics.is_input_focused {
                "success"
            } else {
                "muted"
            },
            semantics.state_label,
        ),
        colorize(
            context.render_profile,
            "muted",
            &format!("{} ·", semantics.panel_title),
        ),
        colorize(context.render_profile, "muted", semantics.tip),
    ));
    lines.push(colorize(
        context.render_profile,
        if semantics.is_input_focused {
            "accent"
        } else {
            "muted"
        },
        &input_composer_line(&semantics, composer_width),
    ));
    lines.push(colorize(
        context.render_profile,
        "muted",
        &input_target_line(&semantics, target_width),
    ));
    lines.truncate(8);
    let title = focused_panel_title(
        context.render_profile,
        semantics.panel_title,
        semantics.is_input_focused,
    );
    compact_section_lines(
        &title,
        &lines,
        width,
        context.render_profile,
        PanelTone::Composer,
    )
}

pub(crate) fn compact_terminal_shell_lines(
    context: &LaunchContext,
    terminal_width: usize,
    terminal_height: usize,
) -> Vec<String> {
    let width = terminal_width.saturating_sub(2).max(24);
    let (header_line, subtitle_line) = compact_shell_banner(context, width);
    let available_height = terminal_height.max(12);
    let section_budget = available_height.saturating_sub(10);

    let conversation_budget = section_budget.clamp(3, 6);
    let scene_budget = section_budget
        .saturating_sub(conversation_budget)
        .clamp(3, 6);
    let transcript_budget = section_budget
        .saturating_sub(conversation_budget + scene_budget)
        .clamp(3, 7);
    let input_budget = 3usize;

    let mut lines = Vec::new();
    lines.push(truncate_to_width(&header_line, width));
    lines.push(truncate_to_width(&subtitle_line, width));
    lines.push(String::new());
    lines.extend(
        render_compact_conversation_panel(context, width)
            .into_iter()
            .take(conversation_budget),
    );
    lines.push(String::new());
    lines.extend(
        render_compact_scene_panel(context, width)
            .into_iter()
            .take(scene_budget),
    );
    lines.push(String::new());
    lines.extend(tail_preserving_panel_header(
        render_compact_transcript_panel(context, width),
        transcript_budget,
    ));
    lines.push(String::new());
    lines.extend(
        render_compact_input_panel(context, width)
            .into_iter()
            .take(input_budget),
    );
    lines.push(String::new());
    lines
}

pub(crate) fn render_compact_terminal_shell(
    context: &LaunchContext,
    terminal_width: usize,
    terminal_height: usize,
) {
    if io::stdout().is_terminal() {
        let _ = write!(io::stdout(), "\x1b[2J\x1b[H");
        let _ = io::stdout().flush();
    }
    println!(
        "{}",
        compact_terminal_shell_lines(context, terminal_width, terminal_height).join("\n")
    );
}
