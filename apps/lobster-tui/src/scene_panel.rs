use ratatui::{
    style::{Color, Modifier, Style},
    text::{Line, Span},
};

use super::{
    LaunchContext, SceneMetadata, SurfacePage, TerminalRenderProfile, display_scene_metadata,
    display_scene_summary, display_surface_page, use_block_sprite_glyphs,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SceneTileKind {
    Wall,
    Floor,
    Window,
    Desk,
    Sofa,
    Cabinet,
    Door,
    Avatar,
    Lamp,
    Gate,
    Bridge,
    Water,
    Portal,
    Tower,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct SceneTileGrid {
    pub(crate) rows: Vec<Vec<SceneTileKind>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ScenePanelSemantics {
    pub(crate) tile_grid: SceneTileGrid,
    pub(crate) legend: &'static [&'static str],
    pub(crate) summary: String,
}

pub(crate) fn scene_legend_labels_for_page(page: SurfacePage) -> &'static [&'static str] {
    match page {
        SurfacePage::World => &["城门牌", "石桥", "传送阵"],
        SurfacePage::ResidenceDirect => &["居所牌", "会客桌", "暖灯窗"],
        SurfacePage::CityPublic => &["城主府", "居民区", "传送阵", "钟塔"],
    }
}

pub(crate) fn scene_legend_summary(labels: &[&str]) -> String {
    labels.join(" / ")
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct SceneSpriteCell {
    upper: Color,
    lower: Color,
    modifier: Modifier,
}

fn scene_rgb(red: u8, green: u8, blue: u8) -> Color {
    Color::Rgb(red, green, blue)
}

fn scene_sprite_cell(upper: Color, lower: Color) -> SceneSpriteCell {
    SceneSpriteCell {
        upper,
        lower,
        modifier: Modifier::empty(),
    }
}

fn scene_sprite_cell_with_modifier(
    upper: Color,
    lower: Color,
    modifier: Modifier,
) -> SceneSpriteCell {
    SceneSpriteCell {
        upper,
        lower,
        modifier,
    }
}

fn base_room_scene_tile_grid() -> SceneTileGrid {
    SceneTileGrid {
        rows: vec![
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Window,
                SceneTileKind::Window,
                SceneTileKind::Wall,
                SceneTileKind::Lamp,
                SceneTileKind::Wall,
                SceneTileKind::Cabinet,
                SceneTileKind::Cabinet,
                SceneTileKind::Wall,
                SceneTileKind::Wall,
            ],
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Desk,
                SceneTileKind::Desk,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Wall,
            ],
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Floor,
                SceneTileKind::Sofa,
                SceneTileKind::Sofa,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Door,
                SceneTileKind::Floor,
                SceneTileKind::Wall,
            ],
        ],
    }
}

fn base_world_scene_tile_grid() -> SceneTileGrid {
    SceneTileGrid {
        rows: vec![
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Gate,
                SceneTileKind::Gate,
                SceneTileKind::Wall,
                SceneTileKind::Tower,
                SceneTileKind::Wall,
                SceneTileKind::Portal,
                SceneTileKind::Wall,
                SceneTileKind::Tower,
                SceneTileKind::Wall,
            ],
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Bridge,
                SceneTileKind::Bridge,
                SceneTileKind::Bridge,
                SceneTileKind::Water,
                SceneTileKind::Water,
                SceneTileKind::Water,
                SceneTileKind::Water,
                SceneTileKind::Wall,
                SceneTileKind::Wall,
            ],
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Gate,
                SceneTileKind::Wall,
            ],
        ],
    }
}

fn base_city_scene_tile_grid() -> SceneTileGrid {
    SceneTileGrid {
        rows: vec![
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Tower,
                SceneTileKind::Gate,
                SceneTileKind::Gate,
                SceneTileKind::Gate,
                SceneTileKind::Gate,
                SceneTileKind::Tower,
                SceneTileKind::Portal,
                SceneTileKind::Wall,
                SceneTileKind::Wall,
            ],
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Window,
                SceneTileKind::Window,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Floor,
                SceneTileKind::Window,
                SceneTileKind::Window,
                SceneTileKind::Floor,
                SceneTileKind::Wall,
            ],
            vec![
                SceneTileKind::Wall,
                SceneTileKind::Bridge,
                SceneTileKind::Bridge,
                SceneTileKind::Bridge,
                SceneTileKind::Floor,
                SceneTileKind::Door,
                SceneTileKind::Door,
                SceneTileKind::Bridge,
                SceneTileKind::Floor,
                SceneTileKind::Wall,
            ],
        ],
    }
}

fn apply_room_scene_metadata(grid: &mut SceneTileGrid, scene: Option<&SceneMetadata>) {
    if let Some(room) = scene {
        if room.primary_avatar.is_some() {
            grid.rows[1][6] = SceneTileKind::Avatar;
        }

        for landmark in &room.landmarks {
            let slot = landmark.slot_id.to_ascii_lowercase();
            let sprite = landmark.sprite_hint.to_ascii_lowercase();
            if slot.contains("desk") || sprite.contains("desk") {
                grid.rows[1][3] = SceneTileKind::Desk;
                grid.rows[1][4] = SceneTileKind::Desk;
            } else if slot.contains("sofa") || sprite.contains("sofa") {
                grid.rows[2][2] = SceneTileKind::Sofa;
                grid.rows[2][3] = SceneTileKind::Sofa;
            } else if slot.contains("cabinet") || sprite.contains("cabinet") {
                grid.rows[0][6] = SceneTileKind::Cabinet;
                grid.rows[0][7] = SceneTileKind::Cabinet;
            }
        }
    }
}

pub(crate) fn ratatui_scene_tile_grid(context: &LaunchContext) -> SceneTileGrid {
    let mut grid = match display_surface_page(context) {
        SurfacePage::World => base_world_scene_tile_grid(),
        SurfacePage::CityPublic => base_city_scene_tile_grid(),
        SurfacePage::ResidenceDirect => base_room_scene_tile_grid(),
    };

    if matches!(display_surface_page(context), SurfacePage::ResidenceDirect) {
        apply_room_scene_metadata(&mut grid, display_scene_metadata(context));
    }

    grid
}

pub(crate) fn scene_panel_semantics(context: &LaunchContext) -> ScenePanelSemantics {
    let page = display_surface_page(context);
    ScenePanelSemantics {
        tile_grid: ratatui_scene_tile_grid(context),
        legend: scene_legend_labels_for_page(page),
        summary: display_scene_summary(context).to_string(),
    }
}

fn ratatui_scene_tile_text(
    tile: SceneTileKind,
    render_profile: TerminalRenderProfile,
) -> &'static str {
    if !use_block_sprite_glyphs(render_profile) {
        return match tile {
            SceneTileKind::Wall => "##",
            SceneTileKind::Floor => "..",
            SceneTileKind::Window => "[]",
            SceneTileKind::Desk => "D ",
            SceneTileKind::Sofa => "S ",
            SceneTileKind::Cabinet => "C ",
            SceneTileKind::Door => "| ",
            SceneTileKind::Avatar => "@ ",
            SceneTileKind::Lamp => "* ",
            SceneTileKind::Gate => "H ",
            SceneTileKind::Bridge => "= ",
            SceneTileKind::Water => "~ ",
            SceneTileKind::Portal => "O ",
            SceneTileKind::Tower => "^ ",
        };
    }

    match tile {
        SceneTileKind::Wall => "  ",
        SceneTileKind::Floor => "  ",
        SceneTileKind::Window => "▣ ",
        SceneTileKind::Desk => "▤ ",
        SceneTileKind::Sofa => "▥ ",
        SceneTileKind::Cabinet => "▦ ",
        SceneTileKind::Door => "╵ ",
        SceneTileKind::Avatar => "◉ ",
        SceneTileKind::Lamp => "✦ ",
        SceneTileKind::Gate => "◫ ",
        SceneTileKind::Bridge => "╬ ",
        SceneTileKind::Water => "≈ ",
        SceneTileKind::Portal => "◎ ",
        SceneTileKind::Tower => "▲ ",
    }
}

#[derive(Debug, Clone)]
pub(crate) struct SceneTileProjection {
    pub(crate) plain_text: String,
    pub(crate) spans: Vec<Span<'static>>,
}

fn ratatui_scene_tile_style(tile: SceneTileKind, render_profile: TerminalRenderProfile) -> Style {
    let ascii = !use_block_sprite_glyphs(render_profile);
    match tile {
        SceneTileKind::Wall => {
            Style::default()
                .fg(Color::White)
                .bg(if ascii { Color::Reset } else { Color::DarkGray })
        }
        SceneTileKind::Floor => Style::default().fg(Color::Black).bg(if ascii {
            Color::Reset
        } else {
            Color::Rgb(110, 82, 48)
        }),
        SceneTileKind::Window => {
            Style::default()
                .fg(Color::Black)
                .bg(if ascii { Color::Reset } else { Color::Cyan })
        }
        SceneTileKind::Desk => {
            Style::default()
                .fg(Color::Black)
                .bg(if ascii { Color::Reset } else { Color::Green })
        }
        SceneTileKind::Sofa => {
            Style::default()
                .fg(Color::Black)
                .bg(if ascii { Color::Reset } else { Color::Magenta })
        }
        SceneTileKind::Cabinet => {
            Style::default()
                .fg(Color::White)
                .bg(if ascii { Color::Reset } else { Color::DarkGray })
        }
        SceneTileKind::Door => {
            Style::default()
                .fg(Color::Black)
                .bg(if ascii { Color::Reset } else { Color::Yellow })
        }
        SceneTileKind::Avatar => Style::default()
            .fg(Color::Black)
            .bg(if ascii { Color::Reset } else { Color::Yellow })
            .add_modifier(Modifier::BOLD),
        SceneTileKind::Lamp => {
            Style::default()
                .fg(Color::Black)
                .bg(if ascii { Color::Reset } else { Color::Yellow })
        }
        SceneTileKind::Gate => {
            Style::default()
                .fg(Color::Black)
                .bg(if ascii { Color::Reset } else { Color::Yellow })
        }
        SceneTileKind::Bridge => {
            Style::default()
                .fg(Color::Black)
                .bg(if ascii { Color::Reset } else { Color::Green })
        }
        SceneTileKind::Water => {
            Style::default()
                .fg(Color::White)
                .bg(if ascii { Color::Reset } else { Color::Blue })
        }
        SceneTileKind::Portal => {
            Style::default()
                .fg(Color::Black)
                .bg(if ascii { Color::Reset } else { Color::Magenta })
        }
        SceneTileKind::Tower => {
            Style::default()
                .fg(Color::White)
                .bg(if ascii { Color::Reset } else { Color::DarkGray })
        }
    }
}

fn ratatui_scene_tile_sprite_cells(tile: SceneTileKind) -> [SceneSpriteCell; 2] {
    match tile {
        SceneTileKind::Wall => [
            scene_sprite_cell(scene_rgb(138, 142, 150), scene_rgb(66, 68, 74)),
            scene_sprite_cell(scene_rgb(122, 126, 134), scene_rgb(52, 54, 60)),
        ],
        SceneTileKind::Floor => [
            scene_sprite_cell(scene_rgb(176, 133, 80), scene_rgb(112, 80, 48)),
            scene_sprite_cell(scene_rgb(160, 119, 70), scene_rgb(100, 72, 42)),
        ],
        SceneTileKind::Window => [
            scene_sprite_cell(scene_rgb(218, 246, 255), scene_rgb(78, 150, 194)),
            scene_sprite_cell(scene_rgb(236, 250, 255), scene_rgb(96, 168, 212)),
        ],
        SceneTileKind::Desk => [
            scene_sprite_cell(scene_rgb(194, 142, 88), scene_rgb(126, 82, 46)),
            scene_sprite_cell(scene_rgb(174, 122, 72), scene_rgb(108, 68, 38)),
        ],
        SceneTileKind::Sofa => [
            scene_sprite_cell(scene_rgb(204, 126, 162), scene_rgb(116, 56, 92)),
            scene_sprite_cell(scene_rgb(186, 108, 148), scene_rgb(98, 44, 78)),
        ],
        SceneTileKind::Cabinet => [
            scene_sprite_cell(scene_rgb(146, 112, 74), scene_rgb(82, 62, 40)),
            scene_sprite_cell(scene_rgb(132, 98, 64), scene_rgb(70, 52, 34)),
        ],
        SceneTileKind::Door => [
            scene_sprite_cell(scene_rgb(170, 126, 76), scene_rgb(96, 66, 34)),
            scene_sprite_cell(scene_rgb(154, 112, 66), scene_rgb(82, 56, 28)),
        ],
        SceneTileKind::Avatar => [
            scene_sprite_cell_with_modifier(
                scene_rgb(250, 220, 172),
                scene_rgb(74, 118, 194),
                Modifier::BOLD,
            ),
            scene_sprite_cell_with_modifier(
                scene_rgb(236, 198, 150),
                scene_rgb(56, 92, 164),
                Modifier::BOLD,
            ),
        ],
        SceneTileKind::Lamp => [
            scene_sprite_cell(scene_rgb(255, 240, 166), scene_rgb(224, 154, 56)),
            scene_sprite_cell(scene_rgb(255, 228, 122), scene_rgb(192, 124, 34)),
        ],
        SceneTileKind::Gate => [
            scene_sprite_cell(scene_rgb(192, 172, 122), scene_rgb(112, 90, 42)),
            scene_sprite_cell(scene_rgb(174, 154, 106), scene_rgb(96, 78, 36)),
        ],
        SceneTileKind::Bridge => [
            scene_sprite_cell(scene_rgb(170, 140, 92), scene_rgb(108, 78, 46)),
            scene_sprite_cell(scene_rgb(156, 128, 82), scene_rgb(96, 68, 38)),
        ],
        SceneTileKind::Water => [
            scene_sprite_cell(scene_rgb(116, 206, 236), scene_rgb(26, 88, 166)),
            scene_sprite_cell(scene_rgb(96, 184, 224), scene_rgb(18, 72, 146)),
        ],
        SceneTileKind::Portal => [
            scene_sprite_cell(scene_rgb(226, 174, 255), scene_rgb(96, 42, 166)),
            scene_sprite_cell(scene_rgb(188, 214, 255), scene_rgb(68, 74, 182)),
        ],
        SceneTileKind::Tower => [
            scene_sprite_cell(scene_rgb(166, 170, 184), scene_rgb(80, 84, 102)),
            scene_sprite_cell(scene_rgb(150, 154, 168), scene_rgb(66, 70, 88)),
        ],
    }
}

fn ratatui_scene_tile_sprite_glyphs(tile: SceneTileKind) -> [char; 2] {
    match tile {
        SceneTileKind::Floor | SceneTileKind::Bridge => ['▄', '▄'],
        SceneTileKind::Window | SceneTileKind::Door | SceneTileKind::Gate => ['▐', '▌'],
        SceneTileKind::Lamp | SceneTileKind::Portal => ['█', '█'],
        _ => ['▀', '▀'],
    }
}

fn ratatui_scene_sprite_cell_span(cell: SceneSpriteCell, glyph: char) -> Span<'static> {
    let style = match glyph {
        '▄' => Style::default()
            .fg(cell.lower)
            .bg(cell.upper)
            .add_modifier(cell.modifier),
        '█' => Style::default()
            .fg(cell.upper)
            .bg(cell.lower)
            .add_modifier(cell.modifier),
        _ => Style::default()
            .fg(cell.upper)
            .bg(cell.lower)
            .add_modifier(cell.modifier),
    };
    Span::styled(glyph.to_string(), style)
}

fn scene_tile_projection(
    tile: SceneTileKind,
    render_profile: TerminalRenderProfile,
) -> SceneTileProjection {
    if !use_block_sprite_glyphs(render_profile) {
        let plain_text = ratatui_scene_tile_text(tile, render_profile).to_string();
        return SceneTileProjection {
            plain_text: plain_text.clone(),
            spans: vec![Span::styled(
                plain_text,
                ratatui_scene_tile_style(tile, render_profile),
            )],
        };
    }

    let glyphs = ratatui_scene_tile_sprite_glyphs(tile);
    let plain_text = glyphs.iter().collect::<String>();
    let spans = ratatui_scene_tile_sprite_cells(tile)
        .into_iter()
        .zip(glyphs)
        .map(|(cell, glyph)| ratatui_scene_sprite_cell_span(cell, glyph))
        .collect();
    SceneTileProjection { plain_text, spans }
}

pub(crate) fn scene_tile_projection_rows(context: &LaunchContext) -> Vec<Vec<SceneTileProjection>> {
    scene_panel_semantics(context)
        .tile_grid
        .rows
        .into_iter()
        .map(|row| {
            row.into_iter()
                .map(|tile| scene_tile_projection(tile, context.render_profile))
                .collect()
        })
        .collect()
}

pub(crate) fn ratatui_scene_tile_rows(context: &LaunchContext) -> Vec<Line<'static>> {
    scene_tile_projection_rows(context)
        .into_iter()
        .map(|row| {
            let spans = row
                .into_iter()
                .flat_map(|projection| projection.spans)
                .collect::<Vec<_>>();
            Line::from(spans)
        })
        .collect()
}
