use std::time::Duration;

use chat_storage::ArchiveStore;
use crossterm::event::{self, Event, KeyEventKind};

use crate::app_bootstrap::AppBootstrap;
use crate::terminal_key_dispatch::LoopAction;
use crate::terminal_runtime::{RawModeGuard, warm_up_terminal_input_reader};
use crate::transport_sync::{merge_polled_messages, republish_pending_messages};
use crate::{
    FocusArea, LaunchSurface, build_launch_context, current_time_ms, export_web_shell_data,
    friendly_connection_label, handle_input_focus_key, handle_navigation_key, print_terminal_shell,
    selectable_conversations,
};

pub(crate) fn run_terminal_app(
    launch_mode: LaunchSurface,
    bootstrap: AppBootstrap,
) -> Result<(), String> {
    let AppBootstrap {
        desktop_render,
        mobile_bootstrap,
        web_generated_dir,
        mut store,
        mut transport,
        mut active_conversation_id,
        mut selected_conversation_id,
        mut transcript_scroll,
        mut focus_area,
        mut input_buffer,
    } = bootstrap;

    let _raw_mode = RawModeGuard::new()?;
    warm_up_terminal_input_reader()?;

    loop {
        let transport_state_summary = match transport.poll() {
            Ok(synced) => {
                let _inserted = merge_polled_messages(&mut store, synced.clone())?;
                let republished = republish_pending_messages(&mut store, transport.as_mut())?;
                let connection_state = transport.connection_state();
                if republished > 0 {
                    format!(
                        "{} · 今轮合流 {} 拍 · 补发 {} 条",
                        friendly_connection_label(connection_state),
                        synced.len(),
                        republished
                    )
                } else {
                    format!(
                        "{} · 今轮合流 {} 拍",
                        friendly_connection_label(connection_state),
                        synced.len()
                    )
                }
            }
            Err(error) => format!(
                "{} · 合流失败：{error}",
                friendly_connection_label(transport.connection_state())
            ),
        };
        let now_ms = current_time_ms()?;
        let shell_conversations =
            selectable_conversations(&store, launch_mode, &active_conversation_id);
        export_web_shell_data(
            &web_generated_dir,
            &mobile_bootstrap,
            &store,
            &shell_conversations,
            now_ms,
        )?;
        let _archived = store.archive_expired_messages(now_ms)?;
        let context = build_launch_context(
            launch_mode,
            &store,
            &active_conversation_id,
            &selected_conversation_id,
            transport_state_summary,
            desktop_render,
            transcript_scroll,
            focus_area,
            &input_buffer,
        )?;
        print_terminal_shell(&context);

        if !event::poll(Duration::from_millis(250))
            .map_err(|error| format!("poll terminal event failed: {error}"))?
        {
            continue;
        }
        let Event::Key(key) =
            event::read().map_err(|error| format!("read terminal event failed: {error}"))?
        else {
            continue;
        };
        if key.kind != KeyEventKind::Press {
            continue;
        }

        if focus_area == FocusArea::Input {
            if matches!(
                handle_input_focus_key(
                    &key,
                    &mut focus_area,
                    &mut input_buffer,
                    &mut transcript_scroll,
                    &mut store,
                    transport.as_mut(),
                    launch_mode,
                    &mut active_conversation_id,
                    &mut selected_conversation_id,
                )?,
                LoopAction::Quit
            ) {
                break;
            }
            continue;
        }

        if matches!(
            handle_navigation_key(
                &key,
                &mut focus_area,
                &store,
                launch_mode,
                &mut active_conversation_id,
                &mut selected_conversation_id,
                &mut transcript_scroll,
            ),
            LoopAction::Quit
        ) {
            break;
        }
    }

    Ok(())
}
