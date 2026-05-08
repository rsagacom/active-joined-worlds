use ratatui::{
    Frame,
    layout::{Constraint, Direction, Layout, Rect},
    widgets::{List, ListState, Paragraph, Wrap},
};

use crate::{
    CHAT_PANEL_WIDTH, FocusArea, LaunchContext, PanelTone, SESSION_PANEL_WIDTH, ShellLayoutMode,
    display_surface_page, ratatui_block, ratatui_header_line, ratatui_input_block_title,
    ratatui_input_lines, ratatui_nav_highlight_style, ratatui_nav_items, ratatui_nav_rows,
    ratatui_scene_block_title, ratatui_scene_lines, ratatui_session_info_lines,
    ratatui_status_line, ratatui_transcript_block_title, ratatui_transcript_focus_badge,
    ratatui_transcript_lines, ratatui_transcript_text_style, scene_panel_focused,
    surface_nav_panel_title, surface_status_panel_title, transcript_panel_focused,
    transcript_scroll_start,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct WideFrameRegions {
    pub header: Rect,
    pub status: Rect,
    pub switcher: Option<Rect>,
    pub actions: Option<Rect>,
    pub scene: Rect,
    pub profile: Option<Rect>,
    pub transcript: Rect,
    pub input: Rect,
}

fn clamp_length(value: u16, min: u16, max: u16) -> u16 {
    value.max(min).min(max)
}

pub(crate) fn wide_frame_regions(area: Rect, page: crate::SurfacePage) -> WideFrameRegions {
    let header_height = 1;
    let status_height = 1;
    let input_height = 4;

    match page {
        crate::SurfacePage::CityPublic | crate::SurfacePage::World => {
            let available = area
                .height
                .saturating_sub(header_height + status_height + input_height);
            let mut switcher_height = clamp_length(available / 5, 4, 6);
            let mut transcript_height = clamp_length(available / 4, 7, 10);
            let minimum_main = 8;
            while switcher_height + transcript_height + minimum_main > available {
                if transcript_height > 5 {
                    transcript_height -= 1;
                } else if switcher_height > 3 {
                    switcher_height -= 1;
                } else {
                    break;
                }
            }

            let outer = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Length(header_height),
                    Constraint::Length(status_height),
                    Constraint::Length(switcher_height),
                    Constraint::Min(minimum_main),
                    Constraint::Length(transcript_height),
                    Constraint::Length(input_height),
                ])
                .split(area);

            if matches!(page, crate::SurfacePage::CityPublic) {
                let scene_row = Layout::default()
                    .direction(Direction::Horizontal)
                    .constraints([
                        Constraint::Min(CHAT_PANEL_WIDTH as u16),
                        Constraint::Length(SESSION_PANEL_WIDTH as u16),
                    ])
                    .split(outer[3]);
                WideFrameRegions {
                    header: outer[0],
                    status: outer[1],
                    switcher: Some(outer[2]),
                    actions: None,
                    scene: scene_row[0],
                    profile: Some(scene_row[1]),
                    transcript: outer[4],
                    input: outer[5],
                }
            } else {
                WideFrameRegions {
                    header: outer[0],
                    status: outer[1],
                    switcher: Some(outer[2]),
                    actions: None,
                    scene: outer[3],
                    profile: None,
                    transcript: outer[4],
                    input: outer[5],
                }
            }
        }
        crate::SurfacePage::ResidenceDirect => {
            let available = area
                .height
                .saturating_sub(header_height + status_height + input_height);
            let mut transcript_height = clamp_length(available / 3, 8, 12);
            let minimum_scene = 8;
            while transcript_height + minimum_scene > available && transcript_height > 5 {
                transcript_height -= 1;
            }

            let outer = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Length(header_height),
                    Constraint::Length(status_height),
                    Constraint::Min(minimum_scene + transcript_height),
                    Constraint::Length(input_height),
                ])
                .split(area);
            let main = Layout::default()
                .direction(Direction::Horizontal)
                .constraints([
                    Constraint::Length(SESSION_PANEL_WIDTH as u16),
                    Constraint::Min(CHAT_PANEL_WIDTH as u16),
                ])
                .split(outer[2]);
            let right = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Min(minimum_scene),
                    Constraint::Length(transcript_height),
                ])
                .split(main[1]);

            WideFrameRegions {
                header: outer[0],
                status: outer[1],
                switcher: None,
                actions: Some(main[0]),
                scene: right[0],
                profile: None,
                transcript: right[1],
                input: outer[3],
            }
        }
    }
}

pub(crate) fn render_ratatui_wide_frame(frame: &mut Frame, context: &LaunchContext) {
    let area = frame.area();
    let page = display_surface_page(context);
    let regions = wide_frame_regions(area, page);

    let header_line = ratatui_header_line(context);
    let status_line = ratatui_status_line(context);

    frame.render_widget(Paragraph::new(header_line), regions.header);
    frame.render_widget(Paragraph::new(status_line), regions.status);

    let (nav_rows, selected_index) = ratatui_nav_rows(context);
    let nav = List::new(ratatui_nav_items(&nav_rows, selected_index))
        .highlight_style(ratatui_nav_highlight_style(
            context.focus_area == FocusArea::Nav,
        ))
        .highlight_symbol("")
        .repeat_highlight_symbol(true)
        .block(ratatui_block(
            context.render_profile,
            surface_nav_panel_title(context.mode),
            context.focus_area == FocusArea::Nav,
            PanelTone::Sidebar,
            Some("j/k·入房"),
        ));
    let mut nav_state = ListState::default();
    nav_state.select(Some(selected_index));

    let transcript_lines = ratatui_transcript_lines(context);
    if let Some(switcher) = regions.switcher {
        frame.render_stateful_widget(nav, switcher, &mut nav_state);
    } else if let Some(actions) = regions.actions {
        frame.render_stateful_widget(nav, actions, &mut nav_state);
    }

    frame.render_widget(
        Paragraph::new(ratatui_scene_lines(context))
            .wrap(Wrap { trim: false })
            .block(ratatui_block(
                context.render_profile,
                &ratatui_scene_block_title(context),
                scene_panel_focused(context),
                PanelTone::Thread,
                None,
            )),
        regions.scene,
    );

    if let Some(profile) = regions.profile {
        frame.render_widget(
            Paragraph::new(ratatui_session_info_lines(context))
                .wrap(Wrap { trim: false })
                .block(ratatui_block(
                    context.render_profile,
                    surface_status_panel_title(context.mode),
                    false,
                    PanelTone::Sidebar,
                    None,
                )),
            profile,
        );
    }

    let transcript_viewport_height = regions.transcript.height.saturating_sub(2) as usize;
    let transcript_start = transcript_scroll_start(
        transcript_lines.len(),
        transcript_viewport_height,
        context.transcript_scroll,
    );
    frame.render_widget(
        Paragraph::new(transcript_lines)
            .style(ratatui_transcript_text_style(context))
            .scroll((transcript_start as u16, 0))
            .wrap(Wrap { trim: false })
            .block(ratatui_block(
                context.render_profile,
                &ratatui_transcript_block_title(context),
                transcript_panel_focused(context),
                PanelTone::Thread,
                ratatui_transcript_focus_badge(context),
            )),
        regions.transcript,
    );
    frame.render_widget(
        Paragraph::new(ratatui_input_lines(context))
            .wrap(Wrap { trim: false })
            .block(ratatui_block(
                context.render_profile,
                &ratatui_input_block_title(context),
                context.focus_area == FocusArea::Input,
                PanelTone::Composer,
                Some("Esc·收笔"),
            )),
        regions.input,
    );
}

pub(crate) fn render_ratatui_stacked_frame(frame: &mut Frame, context: &LaunchContext) {
    let area = frame.area();
    let outer = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Min(0),
        ])
        .split(area);

    frame.render_widget(Paragraph::new(ratatui_header_line(context)), outer[0]);
    frame.render_widget(Paragraph::new(ratatui_status_line(context)), outer[1]);

    let body_height = outer[2].height;
    let input_height = if body_height >= 16 { 4 } else { 3 };
    let remaining_height = body_height.saturating_sub(input_height);
    let nav_height = remaining_height.clamp(5, 8);
    let scene_height = remaining_height.saturating_sub(nav_height).clamp(5, 8);
    let transcript_height = body_height.saturating_sub(input_height + nav_height + scene_height);

    let body = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(nav_height),
            Constraint::Length(scene_height),
            Constraint::Min(transcript_height.max(4)),
            Constraint::Length(input_height),
        ])
        .split(outer[2]);

    let (nav_rows, selected_index) = ratatui_nav_rows(context);
    let nav = List::new(ratatui_nav_items(&nav_rows, selected_index))
        .highlight_style(ratatui_nav_highlight_style(
            context.focus_area == FocusArea::Nav,
        ))
        .highlight_symbol("")
        .repeat_highlight_symbol(true)
        .block(ratatui_block(
            context.render_profile,
            surface_nav_panel_title(context.mode),
            context.focus_area == FocusArea::Nav,
            PanelTone::Sidebar,
            Some("j/k·入房"),
        ));
    let mut nav_state = ListState::default();
    nav_state.select(Some(selected_index));
    frame.render_stateful_widget(nav, body[0], &mut nav_state);

    frame.render_widget(
        Paragraph::new(ratatui_scene_lines(context))
            .wrap(Wrap { trim: false })
            .block(ratatui_block(
                context.render_profile,
                &ratatui_scene_block_title(context),
                scene_panel_focused(context),
                PanelTone::Thread,
                None,
            )),
        body[1],
    );

    let transcript_lines = ratatui_transcript_lines(context);
    let transcript_viewport_height = body[2].height.saturating_sub(2) as usize;
    let transcript_start = transcript_scroll_start(
        transcript_lines.len(),
        transcript_viewport_height,
        context.transcript_scroll,
    );
    frame.render_widget(
        Paragraph::new(transcript_lines)
            .style(ratatui_transcript_text_style(context))
            .scroll((transcript_start as u16, 0))
            .wrap(Wrap { trim: false })
            .block(ratatui_block(
                context.render_profile,
                &ratatui_transcript_block_title(context),
                transcript_panel_focused(context),
                PanelTone::Thread,
                ratatui_transcript_focus_badge(context),
            )),
        body[2],
    );

    frame.render_widget(
        Paragraph::new(ratatui_input_lines(context))
            .wrap(Wrap { trim: false })
            .block(ratatui_block(
                context.render_profile,
                &ratatui_input_block_title(context),
                context.focus_area == FocusArea::Input,
                PanelTone::Composer,
                Some("Esc·收笔"),
            )),
        body[3],
    );
}

pub(crate) fn render_ratatui_frame(
    frame: &mut Frame,
    context: &LaunchContext,
    layout_mode: ShellLayoutMode,
) {
    match layout_mode {
        ShellLayoutMode::RatatuiWide => render_ratatui_wide_frame(frame, context),
        ShellLayoutMode::RatatuiStacked | ShellLayoutMode::PlainCompact => {
            render_ratatui_stacked_frame(frame, context)
        }
    }
}
