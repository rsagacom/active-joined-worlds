#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AssistMode {
    Translate,
    Summarize,
    SemanticHint,
}

pub trait AiAssist {
    fn enabled(&self) -> bool;
    fn assist(&self, mode: AssistMode, input: &str) -> Result<String, String>;
}
