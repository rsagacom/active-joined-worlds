use std::{env, process::Command};

use host_adapter::{TerminalColorSupport, TerminalGlyphSupport, TerminalRenderProfile};

pub(crate) fn detect_terminal_color_support() -> TerminalColorSupport {
    let color_term = env::var("COLORTERM")
        .unwrap_or_default()
        .to_ascii_lowercase();
    if color_term.contains("truecolor") || color_term.contains("24bit") {
        return TerminalColorSupport::TrueColor;
    }

    let term = env::var("TERM").unwrap_or_default().to_ascii_lowercase();
    if term.contains("256color") {
        return TerminalColorSupport::Ansi256;
    }
    if term == "dumb" {
        return TerminalColorSupport::Monochrome;
    }

    if let Ok(output) = Command::new("tput").arg("colors").output()
        && output.status.success()
        && let Ok(value) = String::from_utf8(output.stdout)
        && let Ok(colors) = value.trim().parse::<u32>()
    {
        return match colors {
            0..=1 => TerminalColorSupport::Monochrome,
            2..=16 => TerminalColorSupport::Ansi16,
            17..=255 => TerminalColorSupport::Ansi256,
            _ => TerminalColorSupport::TrueColor,
        };
    }

    TerminalColorSupport::Ansi16
}

pub(crate) fn detect_terminal_glyph_support() -> TerminalGlyphSupport {
    let term = env::var("TERM").unwrap_or_default().to_ascii_lowercase();
    if term == "dumb" {
        return TerminalGlyphSupport::AsciiOnly;
    }

    let locale = env::var("LC_ALL")
        .or_else(|_| env::var("LC_CTYPE"))
        .or_else(|_| env::var("LANG"))
        .unwrap_or_default()
        .to_ascii_lowercase();

    if locale.contains("utf-8") || locale.contains("utf8") {
        return TerminalGlyphSupport::UnicodeBlocks;
    }

    TerminalGlyphSupport::AsciiOnly
}

pub(crate) fn resolve_runtime_render_profile(base: TerminalRenderProfile) -> TerminalRenderProfile {
    base.degrade_to(
        detect_terminal_color_support(),
        detect_terminal_glyph_support(),
    )
}

pub(crate) fn use_ascii_borders(render_profile: TerminalRenderProfile) -> bool {
    matches!(
        render_profile.glyph_support,
        TerminalGlyphSupport::AsciiOnly
    )
}

pub(crate) fn use_block_sprite_glyphs(render_profile: TerminalRenderProfile) -> bool {
    matches!(
        render_profile.glyph_support,
        TerminalGlyphSupport::UnicodeBlocks
    )
}
