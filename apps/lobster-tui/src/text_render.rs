fn display_width_char(ch: char) -> usize {
    if ch.is_ascii() { 1 } else { 2 }
}

pub(crate) fn strip_ansi_sgr(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut chars = text.chars().peekable();

    while let Some(ch) = chars.next() {
        if ch == '\u{1b}' && chars.peek() == Some(&'[') {
            let _ = chars.next();
            for next in chars.by_ref() {
                if next == 'm' {
                    break;
                }
            }
            continue;
        }
        out.push(ch);
    }

    out
}

pub(crate) fn char_width(text: &str) -> usize {
    strip_ansi_sgr(text).chars().map(display_width_char).sum()
}

pub(crate) fn truncate_to_width(text: &str, width: usize) -> String {
    let mut result = String::new();
    for ch in text.chars() {
        if char_width(&result) + display_width_char(ch) > width {
            break;
        }
        result.push(ch);
    }
    result
}

#[cfg(test)]
pub(crate) fn pad(text: &str, width: usize) -> String {
    let truncated = truncate_to_width(text, width);
    let current = char_width(&truncated);
    if current >= width {
        truncated
    } else {
        format!("{truncated}{}", " ".repeat(width - current))
    }
}

pub(crate) fn wrap_text(text: &str, width: usize) -> Vec<String> {
    let width = width.max(1);
    let mut lines = Vec::new();
    let mut current = String::new();
    let mut current_width = 0;

    for ch in text.chars() {
        if ch == '\n' {
            lines.push(std::mem::take(&mut current));
            current_width = 0;
            continue;
        }

        let glyph_width = display_width_char(ch);
        if current_width + glyph_width > width && !current.is_empty() {
            lines.push(std::mem::take(&mut current));
            current_width = 0;
            if ch.is_whitespace() {
                continue;
            }
        }

        current.push(ch);
        current_width += glyph_width;
    }

    if !current.is_empty() {
        lines.push(current);
    }

    if lines.is_empty() {
        lines.push(String::new());
    }

    lines
}
