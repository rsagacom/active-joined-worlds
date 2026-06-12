use serde::{Deserialize, Serialize};
use std::time::Duration;

fn http_agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(10))
        .timeout_read(Duration::from_secs(30))
        .timeout_write(Duration::from_secs(10))
        .build()
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AssistMode {
    Translate,
    Summarize,
    SemanticHint,
}

/// Configuration for AI assist, suitable for Gateway storage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub enabled: bool,
}

impl Default for AiConfig {
    fn default() -> Self {
        Self {
            base_url: String::new(),
            api_key: String::new(),
            model: "deepseek-v4-pro".into(),
            enabled: false,
        }
    }
}

pub trait AiAssist: Send + Sync {
    fn enabled(&self) -> bool;
    fn assist(&self, mode: AssistMode, input: &str) -> Result<String, String>;
    /// Stream response chunks. Default implementation falls back to non-streaming.
    fn assist_stream(&self, mode: AssistMode, input: &str) -> Result<Vec<String>, String> {
        self.assist(mode, input).map(|s| vec![s])
    }
}

/// HTTP-based AI assistant.
#[derive(Debug, Clone)]
pub struct HttpAiAssist {
    config: AiConfig,
}

impl HttpAiAssist {
    pub fn from_config(config: AiConfig) -> Self {
        Self { config }
    }

    pub fn new(
        base_url: impl Into<String>,
        api_key: impl Into<String>,
        model: impl Into<String>,
    ) -> Self {
        Self {
            config: AiConfig {
                base_url: base_url.into(),
                api_key: api_key.into(),
                model: model.into(),
                enabled: true,
            },
        }
    }

    pub fn disabled() -> Self {
        Self {
            config: AiConfig::default(),
        }
    }

    pub fn config(&self) -> &AiConfig {
        &self.config
    }

    fn build_body(&self, system_prompt: &str, user_input: &str, stream: bool) -> serde_json::Value {
        serde_json::json!({
            "model": self.config.model,
            "max_tokens": 1024,
            "stream": stream,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_input}]
        })
    }

    fn call_api(&self, system_prompt: &str, user_input: &str) -> Result<String, String> {
        let url = format!("{}/v1/messages", self.config.base_url.trim_end_matches('/'));
        let body = self.build_body(system_prompt, user_input, false);
        let resp = http_agent()
            .post(&url)
            .set("x-api-key", &self.config.api_key)
            .set("anthropic-version", "2023-06-01")
            .set("content-type", "application/json")
            .send_string(&body.to_string())
            .map_err(|e| format!("API request: {e}"))?;
        let json: serde_json::Value = resp.into_json().map_err(|e| format!("parse: {e}"))?;
        extract_text(&json)
    }

    fn call_api_stream(
        &self,
        system_prompt: &str,
        user_input: &str,
    ) -> Result<Vec<String>, String> {
        let url = format!("{}/v1/messages", self.config.base_url.trim_end_matches('/'));
        let body = self.build_body(system_prompt, user_input, true);
        let resp = http_agent()
            .post(&url)
            .set("x-api-key", &self.config.api_key)
            .set("anthropic-version", "2023-06-01")
            .set("content-type", "application/json")
            .send_string(&body.to_string())
            .map_err(|e| format!("stream request: {e}"))?;
        let text = resp.into_string().map_err(|e| format!("read: {e}"))?;
        // Parse SSE stream: "data: {...}\n\n"
        let mut chunks = Vec::new();
        for line in text.lines() {
            if let Some(data) = line.strip_prefix("data: ") {
                if data == "[DONE]" {
                    break;
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data)
                    && let Ok(t) = extract_text(&json)
                {
                    chunks.push(t);
                }
            }
        }
        if chunks.is_empty() {
            // Fallback: non-streaming response
            return self.call_api(system_prompt, user_input).map(|s| vec![s]);
        }
        Ok(chunks)
    }
}

fn extract_text(json: &serde_json::Value) -> Result<String, String> {
    json["content"][0]["text"]
        .as_str()
        .or_else(|| json["choices"][0]["message"]["content"].as_str())
        .or_else(|| json["choices"][0]["delta"]["content"].as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "empty response".to_string())
}

impl AiAssist for HttpAiAssist {
    fn enabled(&self) -> bool {
        self.config.enabled
    }
    fn assist(&self, mode: AssistMode, input: &str) -> Result<String, String> {
        if !self.config.enabled {
            return Err("disabled".into());
        }
        let sys = match mode {
            AssistMode::Translate => "Translate to Chinese. Output only translation.",
            AssistMode::Summarize => "Summarize in 1-2 Chinese sentences. Output only summary.",
            AssistMode::SemanticHint => {
                "Give a short (≤5 words) Chinese topic hint. Output only the hint."
            }
        };
        self.call_api(sys, input)
    }
    fn assist_stream(&self, mode: AssistMode, input: &str) -> Result<Vec<String>, String> {
        if !self.config.enabled {
            return Err("disabled".into());
        }
        let sys = match mode {
            AssistMode::Translate => "Translate to Chinese.",
            AssistMode::Summarize => "Summarize in Chinese.",
            AssistMode::SemanticHint => "Give a Chinese topic hint.",
        };
        self.call_api_stream(sys, input)
    }
}

impl AiAssist for () {
    fn enabled(&self) -> bool {
        false
    }
    fn assist(&self, _: AssistMode, _: &str) -> Result<String, String> {
        Err("not configured".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disabled_by_default() {
        assert!(!HttpAiAssist::disabled().enabled());
        assert!(
            HttpAiAssist::disabled()
                .assist(AssistMode::Summarize, "hi")
                .is_err()
        );
    }

    #[test]
    fn enabled_with_creds() {
        let a = HttpAiAssist::new("https://api.example.com", "sk-test", "m");
        assert!(a.enabled());
    }

    #[test]
    fn config_roundtrip() {
        let cfg = AiConfig {
            base_url: "url".into(),
            api_key: "key".into(),
            model: "m".into(),
            enabled: true,
        };
        let a = HttpAiAssist::from_config(cfg.clone());
        assert_eq!(a.config().base_url, cfg.base_url);
        assert_eq!(a.config().model, cfg.model);
    }

    #[test]
    fn stream_fallback_to_non_streaming() {
        let a = HttpAiAssist::disabled();
        assert!(a.assist_stream(AssistMode::Summarize, "test").is_err());
    }

    #[test]
    fn unit_stub_disabled() {
        let s: &dyn AiAssist = &();
        assert!(!s.enabled());
    }
    #[test]
    fn config_builder_pattern() {
        let a = HttpAiAssist::from_config(AiConfig {
            base_url: "u".into(),
            api_key: "k".into(),
            model: "m".into(),
            enabled: true,
        });
        assert!(a.enabled());
        let a2 = HttpAiAssist::from_config(AiConfig::default());
        assert!(!a2.enabled());
    }
    #[test]
    fn assist_modes_are_distinct() {
        assert_ne!(AssistMode::Translate, AssistMode::Summarize);
        assert_ne!(AssistMode::Summarize, AssistMode::SemanticHint);
    }
}
