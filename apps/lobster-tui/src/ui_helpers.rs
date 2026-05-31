use ratatui::style::{Color, Style};

use super::{
    FocusArea, LaunchContext, TerminalColorSupport, TerminalRenderProfile, use_ascii_borders,
};

pub(crate) fn colorize(render_profile: TerminalRenderProfile, kind: &str, text: &str) -> String {
    let code = match render_profile.color_support {
        TerminalColorSupport::Monochrome => return text.to_string(),
        TerminalColorSupport::Ansi16 | TerminalColorSupport::Ansi256 => match kind {
            "accent" => "36",
            "warm" => "33",
            "success" => "32",
            "muted" => "90",
            _ => "37",
        },
        TerminalColorSupport::TrueColor => match kind {
            "accent" => "38;2;118;220;255",
            "warm" => "38;2;255;190;118",
            "success" => "38;2;142;210;130",
            "muted" => "38;2;185;185;185",
            _ => "38;2;240;239;236",
        },
    };
    format!("\x1b[{code}m{text}\x1b[0m")
}

pub(crate) fn focused_panel_title(
    render_profile: TerminalRenderProfile,
    title: &str,
    focused: bool,
) -> String {
    if !focused {
        return title.to_string();
    }
    let marker = if use_ascii_borders(render_profile) {
        "*"
    } else {
        "◉"
    };
    format!("{title} {marker}")
}

pub(crate) fn scene_panel_focused(context: &LaunchContext) -> bool {
    context.focus_area == FocusArea::Nav
}

pub(crate) fn transcript_panel_focused(context: &LaunchContext) -> bool {
    context.focus_area == FocusArea::Transcript
}

#[cfg(test)]
pub(crate) fn nav_focus_hint(context: &LaunchContext) -> &'static str {
    if context.focus_area == FocusArea::Nav {
        " · j/k 选门牌 · Enter 入房"
    } else {
        ""
    }
}

#[cfg(test)]
pub(crate) fn input_focus_hint(context: &LaunchContext) -> &'static str {
    if context.focus_area == FocusArea::Input {
        " · Esc 收笔"
    } else {
        ""
    }
}

pub(crate) fn input_cursor_glyph(context: &LaunchContext) -> &'static str {
    if context.focus_area == FocusArea::Input && !use_ascii_borders(context.render_profile) {
        "█"
    } else {
        ">"
    }
}

pub(crate) fn ratatui_transcript_text_style(context: &LaunchContext) -> Style {
    if context.focus_area == FocusArea::Input {
        Style::default().fg(Color::DarkGray)
    } else {
        Style::default()
    }
}
