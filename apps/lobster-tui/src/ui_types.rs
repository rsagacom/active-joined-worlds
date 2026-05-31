use std::env;

#[derive(Debug, Clone, Copy)]
pub(crate) enum LaunchSurface {
    User,
    Admin,
    World,
    Direct,
}

impl LaunchSurface {
    pub(crate) fn from_args() -> Self {
        let mut args = env::args().skip(1);
        while let Some(arg) = args.next() {
            if arg == "--mode" {
                return Self::from_str(args.next().as_deref());
            }
            if let Some(value) = arg.strip_prefix("--mode=") {
                return Self::from_str(Some(value));
            }
        }
        Self::User
    }

    pub(crate) fn from_str(value: Option<&str>) -> Self {
        match value.unwrap_or("user").to_ascii_lowercase().as_str() {
            "user" | "chat" => Self::User,
            "admin" | "governance" => Self::Admin,
            "world" | "square" => Self::World,
            "direct" | "dm" => Self::Direct,
            "workbench" => Self::User,
            _ => Self::User,
        }
    }

    #[cfg(test)]
    pub(crate) fn label(self) -> &'static str {
        match self {
            Self::User => "居民位",
            Self::Admin => "城主位",
            Self::World => "世界位",
            Self::Direct => "私帖位",
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum PanelTone {
    Sidebar,
    Thread,
    Composer,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FocusArea {
    Nav,
    Transcript,
    Input,
}

impl FocusArea {
    pub(crate) fn next(self) -> Self {
        match self {
            Self::Nav => Self::Transcript,
            Self::Transcript => Self::Input,
            Self::Input => Self::Nav,
        }
    }

    pub(crate) fn previous(self) -> Self {
        match self {
            Self::Nav => Self::Input,
            Self::Transcript => Self::Nav,
            Self::Input => Self::Transcript,
        }
    }
}
