use super::{
    CHAT_BODY_HEIGHT, CHAT_HEADER_HEIGHT, CHAT_PANEL_WIDTH, INPUT_PANEL_HEIGHT, INPUT_PANEL_WIDTH,
    LaunchContext, PanelTone, SESSION_LIST_HEIGHT, SESSION_PANEL_WIDTH, TerminalRenderProfile,
    char_width, colorize, display_conversation, display_latest_message_hint, display_message_count,
    display_participant_count, display_participant_label, display_route_label,
    display_scene_banner, focused_panel_title, input_composer_line, input_focus_hint,
    input_panel_semantics, input_target_line, mode_accent_kind, nav_focus_hint,
    ratatui_title_badge, scene_panel_focused, surface_nav_panel_title,
    surface_private_section_label, surface_role_chip, surface_room_section_label,
    surface_scene_chip, surface_scene_panel_title, surface_status_panel_title,
    surface_transcript_panel_title, transcript_body_lines, transcript_panel_focused,
    transcript_window, truncate_to_width, use_ascii_borders,
};
use crate::compact_shell::{append_conversation_section, sidebar_nav_row};
use crate::nav_panel::session_info_detail_rows;

#[derive(Debug, Clone, Copy)]
struct BorderSet {
    tl: char,
    tr: char,
    bl: char,
    br: char,
    h: char,
    v: char,
    ml: char,
    mr: char,
}

fn panel_borders(render_profile: TerminalRenderProfile, tone: PanelTone) -> BorderSet {
    if use_ascii_borders(render_profile) {
        BorderSet {
            tl: '+',
            tr: '+',
            bl: '+',
            br: '+',
            h: '-',
            v: '|',
            ml: '+',
            mr: '+',
        }
    } else {
        match tone {
            PanelTone::Sidebar => BorderSet {
                tl: '╭',
                tr: '╮',
                bl: '╰',
                br: '╯',
                h: '─',
                v: '│',
                ml: '├',
                mr: '┤',
            },
            PanelTone::Thread => BorderSet {
                tl: '┌',
                tr: '┐',
                bl: '└',
                br: '┘',
                h: '─',
                v: '│',
                ml: '├',
                mr: '┤',
            },
            PanelTone::Composer => BorderSet {
                tl: '╭',
                tr: '╮',
                bl: '╰',
                br: '╯',
                h: '─',
                v: '│',
                ml: '├',
                mr: '┤',
            },
        }
    }
}

fn panel_lines(
    title: &str,
    meta: Option<&str>,
    lines: &[String],
    width: usize,
    render_profile: TerminalRenderProfile,
    tone: PanelTone,
) -> Vec<String> {
    let b = panel_borders(render_profile, tone);
    let inner = width.saturating_sub(2);
    let mut out = Vec::new();
    let title_kind = match tone {
        PanelTone::Sidebar => "accent",
        PanelTone::Thread => "warm",
        PanelTone::Composer => "success",
    };
    out.push(format!("{}{}{}", b.tl, b.h.to_string().repeat(inner), b.tr));
    out.push(format!(
        "{}{}{}",
        b.v,
        super::pad(&colorize(render_profile, title_kind, title), inner),
        b.v
    ));
    if let Some(meta_line) = meta.filter(|line| !line.trim().is_empty()) {
        out.push(format!("{}{}{}", b.v, super::pad(meta_line, inner), b.v));
    }
    out.push(format!("{}{}{}", b.ml, b.h.to_string().repeat(inner), b.mr));
    for line in lines {
        out.push(format!("{}{}{}", b.v, super::pad(line, inner), b.v));
    }
    out.push(format!("{}{}{}", b.bl, b.h.to_string().repeat(inner), b.br));
    out
}

pub(crate) fn render_chip(render_profile: TerminalRenderProfile, kind: &str, text: &str) -> String {
    colorize(
        render_profile,
        kind,
        &format!("[{}]", truncate_to_width(text, 28)),
    )
}

pub(crate) fn render_header(context: &LaunchContext) -> String {
    let left = colorize(context.render_profile, "warm", "城邦像素终端");
    let center = colorize(
        context.render_profile,
        "accent",
        &format!(
            "[{}] · {}",
            truncate_to_width(&context.world_title, 18),
            truncate_to_width(super::surface_page_title(context.mode), 18)
        ),
    );
    let right = colorize(
        context.render_profile,
        "muted",
        &format!(
            "{} {} {}",
            render_chip(context.render_profile, "accent", "A 地图"),
            render_chip(context.render_profile, "warm", "B 委托"),
            render_chip(
                context.render_profile,
                mode_accent_kind(context.mode),
                context.mode.label()
            )
        ),
    );
    format!("{}   {}   {}", left, center, right)
}

pub(crate) fn render_status_strip(context: &LaunchContext) -> String {
    let focus_prefix = match super::surface_page(context.mode) {
        super::SurfacePage::World => "城门",
        super::SurfacePage::ResidenceDirect => "居所",
        super::SurfacePage::CityPublic => "城内",
    };
    [
        render_chip(
            context.render_profile,
            mode_accent_kind(context.mode),
            surface_role_chip(context.mode),
        ),
        render_chip(
            context.render_profile,
            mode_accent_kind(context.mode),
            surface_scene_chip(context.mode),
        ),
        render_chip(
            context.render_profile,
            "success",
            &format!(
                "{} {}",
                focus_prefix,
                truncate_to_width(display_conversation(context), 18)
            ),
        ),
        render_chip(
            context.render_profile,
            "success",
            &format!(
                "住客 {} · 回声 {}",
                display_participant_count(context),
                display_message_count(context)
            ),
        ),
        render_chip(
            context.render_profile,
            "accent",
            &format!("连线 {}", truncate_to_width(&context.transport_state, 14)),
        ),
    ]
    .join(" ")
}

fn build_room_scene_lines(context: &LaunchContext) -> Vec<String> {
    let mut lines = Vec::new();
    let room_name = display_scene_banner(context).unwrap_or_else(|| display_conversation(context));
    if matches!(context.mode, super::LaunchSurface::World) {
        lines.push(colorize(
            context.render_profile,
            "accent",
            &format!(
                "◎ {} · 城外场景 · {} · 石桥 · 河道 · 铜灯柱 · 瞭望塔 · 传送阵",
                truncate_to_width(&context.city_title, CHAT_PANEL_WIDTH.saturating_sub(18)),
                truncate_to_width(room_name, CHAT_PANEL_WIDTH.saturating_sub(28))
            ),
        ));
        lines.push("┌────── 石桥 / 河道 ──────┐   ┌────── 城门 / 瞭望塔 ──────┐".into());
        lines.push(format!(
            "│ 城门牌：{} │   │ 回响潮：{} │",
            super::pad(&truncate_to_width(display_conversation(context), 32), 32),
            super::pad(&truncate_to_width(&context.transport_state, 18), 18)
        ));
        lines.push(format!(
            "│ 行人影：{} │   │ 路签：{} │",
            super::pad(
                &truncate_to_width(display_participant_label(context), 32),
                32
            ),
            super::pad(&truncate_to_width(display_route_label(context), 18), 18)
        ));
        lines.push("└────────────────────────┘   └────────────────────────┘".into());
    } else if matches!(
        super::display_surface_page(context),
        super::SurfacePage::CityPublic
    ) {
        lines.push(colorize(
            context.render_profile,
            "warm",
            &format!(
                "◎ {} · 城市外景 · {} · 城主府 · 居民区 · 街桥 · 钟塔 · 传送阵",
                context.city_title,
                truncate_to_width(room_name, CHAT_PANEL_WIDTH.saturating_sub(30))
            ),
        ));
        lines.push("┌──── 居民区 ────┬──── 城主府 / 钟塔 ────┬──── 传送阵 ────┐".into());
        lines.push(format!(
            "│ 在城居民：{} │ 公共频道：{} │ 城市脉冲：{} │",
            super::pad(
                &truncate_to_width(display_participant_label(context), 12),
                12
            ),
            super::pad(&truncate_to_width(display_conversation(context), 16), 16),
            super::pad(&truncate_to_width(&context.transport_state, 12), 12)
        ));
        lines.push(format!(
            "└──── 街桥 / 路签：{} ─────────────────────────────────────────┘",
            truncate_to_width(display_route_label(context), 20)
        ));
    } else {
        lines.push(colorize(
            context.render_profile,
            "warm",
            &format!(
                "◈ {}  ·  住宅内景 · {} · 居所牌 · 会客桌 · 沙发角 · 暖灯窗 · 木地板 · 状态灯",
                context.city_title,
                truncate_to_width(room_name, CHAT_PANEL_WIDTH.saturating_sub(28))
            ),
        ));
        lines.push("┌────── 书桌 / 暖灯窗 ──────┐   ┌────── 沙发角 / 木地板 ──────┐".into());
        lines.push(format!(
            "│ 居所牌：{} │   │ 回响纹：{} │",
            super::pad(&truncate_to_width(display_conversation(context), 34), 34),
            super::pad(&truncate_to_width(&context.transport_state, 20), 20)
        ));
        lines.push(format!(
            "│ 住客影：{} │   │ 路签：{} │",
            super::pad(
                &truncate_to_width(display_participant_label(context), 34),
                34
            ),
            super::pad(&truncate_to_width(display_route_label(context), 20), 20)
        ));
        lines.push("└──────────────────────────────┘   └──────────────────────────┘".into());
    }
    lines.push(colorize(
        context.render_profile,
        "muted",
        &format!(
            "近响：{}",
            truncate_to_width(
                display_latest_message_hint(context),
                CHAT_PANEL_WIDTH.saturating_sub(4)
            )
        ),
    ));
    lines
}

pub(crate) fn render_conversation_panel(context: &LaunchContext) -> Vec<String> {
    let preview_width = SESSION_PANEL_WIDTH.saturating_sub(4);
    let mut lines = Vec::new();
    lines.push(colorize(
        context.render_profile,
        "accent",
        sidebar_nav_row(context.mode),
    ));
    let (private_rows, room_rows): (Vec<_>, Vec<_>) = context
        .conversation_rows
        .iter()
        .cloned()
        .partition(|row| row.is_private);

    append_conversation_section(
        &mut lines,
        surface_room_section_label(context.mode),
        &room_rows,
        context,
        preview_width,
        true,
    );
    append_conversation_section(
        &mut lines,
        surface_private_section_label(context.mode),
        &private_rows,
        context,
        preview_width,
        true,
    );

    if lines.is_empty() {
        lines.push("暂无房间".into());
    }

    lines.truncate(SESSION_LIST_HEIGHT.saturating_sub(1));
    let title = focused_panel_title(
        context.render_profile,
        &format!(
            "{}{}",
            surface_nav_panel_title(context.mode),
            nav_focus_hint(context)
        ),
        context.focus_area == super::FocusArea::Nav,
    );
    panel_lines(
        &title,
        None,
        &lines,
        SESSION_PANEL_WIDTH,
        context.render_profile,
        PanelTone::Sidebar,
    )
}

pub(crate) fn render_session_info_panel(context: &LaunchContext) -> Vec<String> {
    let line_width = SESSION_PANEL_WIDTH.saturating_sub(4);
    let mut lines = Vec::new();
    let role_stamp = surface_role_chip(context.mode);
    let prefix = format!("门牌印#{}·", context.active_conversation_index);
    let suffix = format!("·{role_stamp}");
    let identity_width = line_width
        .saturating_sub(char_width(&prefix) + char_width(&suffix))
        .max(1);
    let identity_stamp = truncate_to_width(&context.identity, identity_width);
    lines.push(format!("{prefix}{identity_stamp}{suffix}"));
    lines.extend(session_info_detail_rows(context));

    panel_lines(
        surface_status_panel_title(context.mode),
        None,
        &lines,
        SESSION_PANEL_WIDTH,
        context.render_profile,
        PanelTone::Sidebar,
    )
}

pub(crate) fn render_chat_header_panel(context: &LaunchContext) -> Vec<String> {
    let mut lines = build_room_scene_lines(context);
    lines.truncate(CHAT_HEADER_HEIGHT.saturating_sub(2).max(5));
    let title = focused_panel_title(
        context.render_profile,
        surface_scene_panel_title(context.mode),
        scene_panel_focused(context),
    );
    panel_lines(
        &title,
        None,
        &lines,
        CHAT_PANEL_WIDTH,
        context.render_profile,
        PanelTone::Thread,
    )
}

pub(crate) fn render_transcript_panel(context: &LaunchContext) -> Vec<String> {
    let lines = transcript_window(
        &transcript_body_lines(context),
        CHAT_BODY_HEIGHT,
        context.transcript_scroll,
    );
    let title = focused_panel_title(
        context.render_profile,
        surface_transcript_panel_title(context.mode),
        transcript_panel_focused(context),
    );
    panel_lines(
        &title,
        None,
        &lines,
        CHAT_PANEL_WIDTH,
        context.render_profile,
        PanelTone::Thread,
    )
}

pub(crate) fn render_input_panel(context: &LaunchContext) -> Vec<String> {
    let target_width = INPUT_PANEL_WIDTH.saturating_sub(42);
    let composer_width = INPUT_PANEL_WIDTH.saturating_sub(6);
    let semantics = input_panel_semantics(context, target_width);
    let mut lines = Vec::new();
    lines.push(format!(
        "{} {} {} {} {}",
        colorize(
            context.render_profile,
            "muted",
            &ratatui_title_badge(semantics.prompt_state),
        ),
        colorize(
            context.render_profile,
            if semantics.is_input_focused {
                "success"
            } else {
                "muted"
            },
            &ratatui_title_badge(semantics.state_label),
        ),
        colorize(
            context.render_profile,
            "muted",
            &ratatui_title_badge(semantics.panel_title),
        ),
        colorize(
            context.render_profile,
            "muted",
            &ratatui_title_badge(semantics.tip),
        ),
        colorize(
            context.render_profile,
            "muted",
            &input_target_line(&semantics, target_width),
        ),
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
    lines.truncate(INPUT_PANEL_HEIGHT.saturating_sub(2));
    let title = focused_panel_title(
        context.render_profile,
        &format!("{}{}", semantics.panel_title, input_focus_hint(context)),
        semantics.is_input_focused,
    );
    panel_lines(
        &title,
        None,
        &lines,
        INPUT_PANEL_WIDTH,
        context.render_profile,
        PanelTone::Composer,
    )
}
