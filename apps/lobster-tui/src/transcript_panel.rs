use ratatui::{
    style::{Color, Modifier, Style},
    text::{Line, Span},
};

use super::{LaunchContext, strip_ansi_sgr, transcript_body_lines};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RatatuiTranscriptTone {
    SelfEcho,
    OtherEcho,
    SystemEcho,
    Neutral,
}

fn ratatui_transcript_tone(line: &str) -> RatatuiTranscriptTone {
    if line.starts_with("▌ ") || line.starts_with("> ") {
        RatatuiTranscriptTone::SelfEcho
    } else if line.starts_with("◇ ") || line.starts_with("# ") {
        RatatuiTranscriptTone::SystemEcho
    } else if line.starts_with("• ") || line.starts_with("* ") {
        RatatuiTranscriptTone::OtherEcho
    } else {
        RatatuiTranscriptTone::Neutral
    }
}

fn ratatui_transcript_header_style(tone: RatatuiTranscriptTone) -> Style {
    match tone {
        RatatuiTranscriptTone::SelfEcho => Style::default()
            .fg(Color::Yellow)
            .add_modifier(Modifier::BOLD),
        RatatuiTranscriptTone::OtherEcho => Style::default()
            .fg(Color::Cyan)
            .add_modifier(Modifier::BOLD),
        RatatuiTranscriptTone::SystemEcho => Style::default()
            .fg(Color::Green)
            .add_modifier(Modifier::BOLD),
        RatatuiTranscriptTone::Neutral => Style::default().fg(Color::Gray),
    }
}

fn ratatui_transcript_body_style(tone: RatatuiTranscriptTone) -> Style {
    match tone {
        RatatuiTranscriptTone::SelfEcho => Style::default().fg(Color::Yellow),
        RatatuiTranscriptTone::OtherEcho => Style::default().fg(Color::Cyan),
        RatatuiTranscriptTone::SystemEcho => Style::default().fg(Color::Green),
        RatatuiTranscriptTone::Neutral => Style::default().fg(Color::Gray),
    }
}

fn ratatui_transcript_badge(tone: RatatuiTranscriptTone) -> Span<'static> {
    match tone {
        RatatuiTranscriptTone::SelfEcho => Span::styled("我", Style::default().fg(Color::Yellow)),
        RatatuiTranscriptTone::OtherEcho => Span::styled("他", Style::default().fg(Color::Cyan)),
        RatatuiTranscriptTone::SystemEcho => Span::styled("系", Style::default().fg(Color::Green)),
        RatatuiTranscriptTone::Neutral => Span::styled("续", Style::default().fg(Color::DarkGray)),
    }
}

fn ratatui_transcript_header_text(plain: &str, tone: RatatuiTranscriptTone) -> String {
    let stripped = match tone {
        RatatuiTranscriptTone::SelfEcho => plain
            .strip_prefix("▌ ")
            .or_else(|| plain.strip_prefix("> ")),
        RatatuiTranscriptTone::OtherEcho => plain
            .strip_prefix("• ")
            .or_else(|| plain.strip_prefix("* ")),
        RatatuiTranscriptTone::SystemEcho => plain
            .strip_prefix("◇ ")
            .or_else(|| plain.strip_prefix("# ")),
        RatatuiTranscriptTone::Neutral => None,
    };

    stripped.unwrap_or(plain).trim_start().to_string()
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RatatuiTranscriptRow {
    pub(crate) tone: RatatuiTranscriptTone,
    pub(crate) is_header: bool,
    pub(crate) text: String,
}

pub(crate) fn ratatui_transcript_rows(context: &LaunchContext) -> Vec<RatatuiTranscriptRow> {
    let mut current_tone = RatatuiTranscriptTone::Neutral;
    transcript_body_lines(context)
        .iter()
        .filter_map(|line| {
            let plain = strip_ansi_sgr(line);
            if plain.trim().is_empty() {
                return None;
            }

            let tone = ratatui_transcript_tone(&plain);
            if tone != RatatuiTranscriptTone::Neutral {
                current_tone = tone;
                Some(RatatuiTranscriptRow {
                    tone,
                    is_header: true,
                    text: ratatui_transcript_header_text(&plain, tone),
                })
            } else {
                Some(RatatuiTranscriptRow {
                    tone: current_tone,
                    is_header: false,
                    text: plain.trim_start().to_string(),
                })
            }
        })
        .collect()
}

pub(crate) fn ratatui_transcript_line(row: &RatatuiTranscriptRow) -> Line<'static> {
    if row.is_header {
        let style = ratatui_transcript_header_style(row.tone);
        let bracket_style = Style::default().fg(Color::DarkGray);
        Line::from(vec![
            ratatui_transcript_badge(row.tone),
            Span::raw(" "),
            Span::styled("▐", bracket_style),
            Span::raw(" "),
            Span::styled(row.text.clone(), style),
            Span::raw(" "),
            Span::styled("▌", bracket_style),
        ])
    } else {
        let gutter_style = ratatui_transcript_body_style(row.tone);
        let text_style = Style::default().fg(Color::DarkGray);
        Line::from(vec![
            Span::raw("  "),
            Span::styled("▏", gutter_style),
            Span::raw(" "),
            Span::styled(row.text.clone(), text_style),
        ])
    }
}

pub(crate) fn ratatui_transcript_lines(context: &LaunchContext) -> Vec<Line<'static>> {
    ratatui_transcript_rows(context)
        .iter()
        .map(ratatui_transcript_line)
        .collect()
}
