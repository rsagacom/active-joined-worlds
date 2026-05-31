use std::io;

#[cfg(test)]
use ratatui::backend::TestBackend;
use ratatui::{Terminal, backend::CrosstermBackend};

use crate::{
    LaunchContext, ShellLayoutMode, render_compact_terminal_shell, render_ratatui_frame,
    shell_layout_mode_for_size, terminal_height_hint, terminal_width_hint,
};

pub(crate) fn draw_ratatui_shell(
    context: &LaunchContext,
    layout_mode: ShellLayoutMode,
) -> Result<(), String> {
    let backend = CrosstermBackend::new(io::stdout());
    let mut terminal = Terminal::new(backend)
        .map_err(|error| format!("create ratatui terminal failed: {error}"))?;
    terminal
        .draw(|frame| render_ratatui_frame(frame, context, layout_mode))
        .map_err(|error| format!("draw ratatui frame failed: {error}"))?;
    Ok(())
}

pub(crate) fn print_terminal_shell(context: &LaunchContext) {
    let terminal_width = terminal_width_hint().unwrap_or(crate::INPUT_PANEL_WIDTH);
    let terminal_height = terminal_height_hint().unwrap_or(24);
    let layout_mode = shell_layout_mode_for_size(terminal_width, terminal_height);
    match layout_mode {
        ShellLayoutMode::PlainCompact => {
            render_compact_terminal_shell(context, terminal_width, terminal_height);
        }
        ShellLayoutMode::RatatuiStacked | ShellLayoutMode::RatatuiWide => {
            let _ = draw_ratatui_shell(context, layout_mode);
        }
    }
}

#[cfg(test)]
pub(crate) fn render_ratatui_frame_lines(
    context: &LaunchContext,
    width: u16,
    height: u16,
) -> Vec<String> {
    let backend = TestBackend::new(width, height);
    let mut terminal = Terminal::new(backend).unwrap();
    let layout_mode = shell_layout_mode_for_size(width as usize, height as usize);
    terminal
        .draw(|frame| render_ratatui_frame(frame, context, layout_mode))
        .unwrap();
    let buffer = terminal.backend().buffer().clone();
    (0..height)
        .map(|y| {
            (0..width)
                .map(|x| buffer[(x, y)].symbol())
                .collect::<String>()
        })
        .collect()
}
