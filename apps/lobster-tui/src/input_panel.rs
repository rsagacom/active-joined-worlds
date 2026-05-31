use super::{
    FocusArea, LaunchContext, LaunchSurface, SurfacePage, input_cursor_glyph, truncate_to_width,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct InputPanelSemantics {
    pub(crate) prompt_state: &'static str,
    pub(crate) state_label: &'static str,
    pub(crate) panel_title: &'static str,
    pub(crate) tip: &'static str,
    pub(crate) target: String,
    pub(crate) composer: String,
    pub(crate) cursor_glyph: &'static str,
    pub(crate) is_input_focused: bool,
}

pub(crate) fn active_input_panel_title(context: &LaunchContext) -> &'static str {
    match context.active_surface_page {
        SurfacePage::World => "世界落字栏",
        SurfacePage::ResidenceDirect => "居所落字栏",
        SurfacePage::CityPublic => "城内落字栏",
    }
}

pub(crate) fn active_prompt_state(context: &LaunchContext) -> &'static str {
    match context.active_surface_page {
        SurfacePage::World => "【世界】",
        SurfacePage::ResidenceDirect => "【居所】",
        SurfacePage::CityPublic => match context.mode {
            LaunchSurface::Admin => "【城务】",
            _ => "【城内】",
        },
    }
}

pub(crate) fn active_input_tip(context: &LaunchContext) -> &'static str {
    match context.active_surface_page {
        SurfacePage::World => "回车过广场",
        SurfacePage::ResidenceDirect => "回车入居所",
        SurfacePage::CityPublic => "回车入城内",
    }
}

pub(crate) fn input_panel_semantics(
    context: &LaunchContext,
    _target_width: usize,
) -> InputPanelSemantics {
    InputPanelSemantics {
        prompt_state: active_prompt_state(context),
        state_label: input_state_label(context.focus_area == FocusArea::Input),
        panel_title: active_input_panel_title(context),
        tip: active_input_tip(context),
        target: context.active_conversation.clone(),
        composer: if context.input_buffer.is_empty() {
            "在此落字".to_string()
        } else {
            context.input_buffer.clone()
        },
        cursor_glyph: input_cursor_glyph(context),
        is_input_focused: context.focus_area == FocusArea::Input,
    }
}

pub(crate) fn input_target_line(semantics: &InputPanelSemantics, width: usize) -> String {
    format!("投向 {}", truncate_to_width(&semantics.target, width))
}

pub(crate) fn input_composer_line(semantics: &InputPanelSemantics, width: usize) -> String {
    format!(
        "{} {}",
        semantics.cursor_glyph,
        truncate_to_width(&semantics.composer, width)
    )
}

pub(crate) fn input_state_label(is_input_focused: bool) -> &'static str {
    if is_input_focused {
        "落字中"
    } else {
        "待落"
    }
}
