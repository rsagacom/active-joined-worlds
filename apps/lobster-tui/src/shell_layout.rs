use std::{env, process::Command};

use crossterm::terminal::size as terminal_size;

use super::{
    INPUT_PANEL_WIDTH, MIN_RATATUI_STACKED_HEIGHT, MIN_RATATUI_STACKED_WIDTH,
    MIN_RATATUI_WIDE_HEIGHT,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ShellLayoutMode {
    PlainCompact,
    RatatuiStacked,
    RatatuiWide,
}

pub(crate) fn terminal_width_hint() -> Option<usize> {
    if let Ok((columns, _rows)) = terminal_size()
        && columns > 0
    {
        return Some(columns as usize);
    }

    if let Ok(value) = env::var("COLUMNS")
        && let Ok(columns) = value.trim().parse::<usize>()
        && columns > 0
    {
        return Some(columns);
    }

    if let Ok(output) = Command::new("tput").arg("cols").output()
        && output.status.success()
        && let Ok(value) = String::from_utf8(output.stdout)
        && let Ok(columns) = value.trim().parse::<usize>()
        && columns > 0
    {
        return Some(columns);
    }

    None
}

pub(crate) fn terminal_height_hint() -> Option<usize> {
    if let Ok((_columns, rows)) = terminal_size()
        && rows > 0
    {
        return Some(rows as usize);
    }

    if let Ok(value) = env::var("LINES")
        && let Ok(rows) = value.trim().parse::<usize>()
        && rows > 0
    {
        return Some(rows);
    }

    if let Ok(output) = Command::new("tput").arg("lines").output()
        && output.status.success()
        && let Ok(value) = String::from_utf8(output.stdout)
        && let Ok(rows) = value.trim().parse::<usize>()
        && rows > 0
    {
        return Some(rows);
    }

    None
}

pub(crate) fn shell_layout_mode_for_size(width: usize, height: usize) -> ShellLayoutMode {
    if width >= INPUT_PANEL_WIDTH + 8 && height >= MIN_RATATUI_WIDE_HEIGHT {
        return ShellLayoutMode::RatatuiWide;
    }
    if width >= MIN_RATATUI_STACKED_WIDTH && height >= MIN_RATATUI_STACKED_HEIGHT {
        return ShellLayoutMode::RatatuiStacked;
    }
    ShellLayoutMode::PlainCompact
}
