use std::{
    io::{self, IsTerminal},
    time::Duration,
};

use crossterm::{
    ExecutableCommand, event,
    terminal::{EnterAlternateScreen, LeaveAlternateScreen, disable_raw_mode, enable_raw_mode},
};

pub(crate) struct RawModeGuard;

impl RawModeGuard {
    pub(crate) fn new() -> Result<Self, String> {
        enable_raw_mode().map_err(|error| format!("enable raw mode failed: {error}"))?;
        if io::stdout().is_terminal() {
            io::stdout()
                .execute(EnterAlternateScreen)
                .map_err(|error| format!("enter alternate screen failed: {error}"))?;
        }
        Ok(Self)
    }
}

impl Drop for RawModeGuard {
    fn drop(&mut self) {
        if io::stdout().is_terminal() {
            let _ = io::stdout().execute(LeaveAlternateScreen);
        }
        let _ = disable_raw_mode();
    }
}

pub(crate) fn warm_up_terminal_input_reader_with<F>(mut poll_fn: F) -> Result<(), String>
where
    F: FnMut(Duration) -> io::Result<bool>,
{
    poll_fn(Duration::from_millis(0))
        .map_err(|error| format!("initialize terminal input reader failed: {error}"))?;
    Ok(())
}

pub(crate) fn warm_up_terminal_input_reader() -> Result<(), String> {
    warm_up_terminal_input_reader_with(event::poll)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn warm_up_terminal_input_reader_uses_zero_timeout() {
        let mut seen = None;

        warm_up_terminal_input_reader_with(|duration| {
            seen = Some(duration);
            Ok(false)
        })
        .unwrap();

        assert_eq!(seen, Some(Duration::from_millis(0)));
    }

    #[test]
    fn warm_up_terminal_input_reader_surfaces_poll_error() {
        let error =
            warm_up_terminal_input_reader_with(|_| Err(io::Error::other("input reader offline")))
                .unwrap_err();

        assert!(error.contains("initialize terminal input reader failed"));
        assert!(error.contains("input reader offline"));
    }
}
