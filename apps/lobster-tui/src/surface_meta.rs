use super::{LaunchSurface, SurfacePage};

pub fn surface_page(mode: LaunchSurface) -> SurfacePage {
    match mode {
        LaunchSurface::World => SurfacePage::World,
        LaunchSurface::Direct => SurfacePage::ResidenceDirect,
        LaunchSurface::User | LaunchSurface::Admin => SurfacePage::CityPublic,
    }
}

pub fn surface_page_title(mode: LaunchSurface) -> &'static str {
    surface_page_title_for_page(surface_page(mode))
}

pub fn surface_page_title_for_page(page: SurfacePage) -> &'static str {
    match page {
        SurfacePage::CityPublic => "城市 / 公共频道",
        SurfacePage::World => "城外 / 城门牌",
        SurfacePage::ResidenceDirect => "住宅 / 私聊",
    }
}

pub fn surface_scene_chip(mode: LaunchSurface) -> &'static str {
    match surface_page(mode) {
        SurfacePage::CityPublic => "城内",
        SurfacePage::World => "城外",
        SurfacePage::ResidenceDirect => "居所",
    }
}

#[cfg_attr(not(test), allow(dead_code))]
pub fn surface_scene_panel_title(mode: LaunchSurface) -> &'static str {
    surface_scene_panel_title_for_page(surface_page(mode))
}

pub fn surface_scene_panel_title_for_page(page: SurfacePage) -> &'static str {
    match page {
        SurfacePage::World => "城邦外景",
        SurfacePage::CityPublic => "城市外景",
        SurfacePage::ResidenceDirect => "住宅主景",
    }
}

#[cfg_attr(not(test), allow(dead_code))]
pub fn surface_transcript_panel_title(mode: LaunchSurface) -> &'static str {
    surface_transcript_panel_title_for_page(surface_page(mode))
}

pub fn surface_transcript_panel_title_for_page(page: SurfacePage) -> &'static str {
    match page {
        SurfacePage::World => "城邦回声墙",
        SurfacePage::CityPublic => "公共频道",
        SurfacePage::ResidenceDirect => "私聊记录",
    }
}

pub fn surface_nav_panel_title(mode: LaunchSurface) -> &'static str {
    match surface_page(mode) {
        SurfacePage::World => "世界门牌",
        SurfacePage::ResidenceDirect => "居所动作",
        SurfacePage::CityPublic => "城内门牌",
    }
}

pub fn surface_status_panel_title(mode: LaunchSurface) -> &'static str {
    match surface_page(mode) {
        SurfacePage::World => "城门刻",
        SurfacePage::ResidenceDirect => "房内状态",
        SurfacePage::CityPublic => "角色资料 / 状态",
    }
}

pub fn surface_role_chip(mode: LaunchSurface) -> &'static str {
    match mode {
        LaunchSurface::Admin => "城主位",
        LaunchSurface::User => "居民位",
        LaunchSurface::World => "世界位",
        LaunchSurface::Direct => "居所位",
    }
}

pub fn surface_room_section_label(mode: LaunchSurface) -> &'static str {
    match mode {
        LaunchSurface::Admin => "城内房间",
        LaunchSurface::World => "城邦入口",
        LaunchSurface::Direct => "居所动作",
        LaunchSurface::User => "城内门牌",
    }
}

pub fn surface_private_section_label(mode: LaunchSurface) -> &'static str {
    match mode {
        LaunchSurface::Admin => "城主私线",
        LaunchSurface::World => "世界角落",
        LaunchSurface::Direct => "当前居所",
        LaunchSurface::User => "城内私线",
    }
}

#[cfg(test)]
pub fn mode_callout(mode: LaunchSurface) -> &'static str {
    match mode {
        LaunchSurface::User => "城内同窗 · 门牌在左 · 落字在下",
        LaunchSurface::Admin => "城内同窗 · 城主增权 · 告示挂侧",
        LaunchSurface::World => "城外同路 · 先认城门 · 再过广场",
        LaunchSurface::Direct => "居所单线 · 低打扰来回",
    }
}

#[cfg(test)]
pub fn mode_accent_kind(mode: LaunchSurface) -> &'static str {
    match mode {
        LaunchSurface::Admin => "warm",
        LaunchSurface::User => "success",
        LaunchSurface::World => "accent",
        LaunchSurface::Direct => "muted",
    }
}

#[cfg(test)]
pub fn mode_panel_meta(mode: LaunchSurface) -> &'static str {
    match mode {
        LaunchSurface::User => "先认城门，再听城内回声",
        LaunchSurface::Admin => "与居民同窗，告示只挂侧栏",
        LaunchSurface::World => "城门先行，广场随后",
        LaunchSurface::Direct => "居所单线，左栏退后",
    }
}

#[cfg(test)]
pub fn mode_input_tip(mode: LaunchSurface) -> &'static str {
    match mode {
        LaunchSurface::Admin => "回车入城内",
        LaunchSurface::User => "回车入城内",
        LaunchSurface::World => "回车过广场",
        LaunchSurface::Direct => "回车入居所",
    }
}

#[cfg(test)]
pub fn room_nav_entries(mode: LaunchSurface) -> [(&'static str, &'static str); 4] {
    match mode {
        LaunchSurface::Admin => [
            ("城内簿", "先认城门，再看告示"),
            ("告示栏", "城里发话，栏上贴告示"),
            ("城务簿", "处置只放边侧，不抢回声"),
            ("广场门", "出门就能接上外部回声"),
        ],
        LaunchSurface::User => [
            ("城内簿", "找城里，也找旧回声"),
            ("回声墙", "贴着当前城里聊"),
            ("钟塔", "守夜还亮，提醒还在"),
            ("许愿井", "把念头留在井口"),
        ],
        LaunchSurface::World => [
            ("城门牌", "先认城门，再过广场"),
            ("广场门", "围着眼前这页继续聊"),
            ("城邦志", "翻看城邦和居民区"),
            ("传送阵", "远路回声都从这里进"),
        ],
        LaunchSurface::Direct => [
            ("居所动作", "只守这一条居所"),
            ("回声墙", "一来一回，贴线说"),
            ("委托牌", "把打扰压到最少"),
            ("状态灯", "合线和回响都看灯"),
        ],
    }
}
