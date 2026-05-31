use crate::app_bootstrap::bootstrap_app;
use crate::terminal_app_loop::run_terminal_app;
use crate::terminal_smoke_script::{
    run_smoke_submission_script_once, smoke_submission_script_requested,
};
use crate::terminal_snapshot::{dump_terminal_shell_once, smoke_dump_requested};
use crate::ui_types::LaunchSurface;

pub fn run() -> Result<(), String> {
    let launch_mode = LaunchSurface::from_args();
    if smoke_submission_script_requested() {
        run_smoke_submission_script_once(launch_mode)?;
        return Ok(());
    }
    if smoke_dump_requested() {
        println!("{}", dump_terminal_shell_once(launch_mode)?);
        return Ok(());
    }
    let bootstrap = bootstrap_app(launch_mode)?;
    run_terminal_app(launch_mode, bootstrap)
}
