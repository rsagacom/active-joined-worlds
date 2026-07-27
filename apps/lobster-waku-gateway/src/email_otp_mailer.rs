use std::time::Duration;

use serde::Serialize;

const MAILER_URL_ENV: &str = "LOBSTER_EMAIL_OTP_MAILER_URL";
const MAILER_TOKEN_ENV: &str = "LOBSTER_EMAIL_OTP_MAILER_BEARER_TOKEN";
const MAILER_FROM_ENV: &str = "LOBSTER_EMAIL_OTP_FROM";

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct EmailOtpMailerConfig {
    url: String,
    bearer_token: String,
    from: Option<String>,
}

impl EmailOtpMailerConfig {
    pub(crate) fn new(
        url: String,
        bearer_token: String,
        from: Option<String>,
    ) -> Result<Self, String> {
        let url = url.trim().trim_end_matches('/').to_string();
        if url.is_empty() {
            return Err(format!("{MAILER_URL_ENV} is required"));
        }
        if !url.starts_with("https://") && !is_local_http_url(&url) {
            return Err(format!(
                "{MAILER_URL_ENV} must use https (localhost http is test-only)"
            ));
        }
        let bearer_token = bearer_token.trim().to_string();
        if bearer_token.is_empty() {
            return Err(format!("{MAILER_TOKEN_ENV} is required"));
        }
        let from = from.and_then(|value| {
            let value = value.trim().to_string();
            (!value.is_empty()).then_some(value)
        });
        Ok(Self {
            url,
            bearer_token,
            from,
        })
    }

    pub(crate) fn from_env() -> Result<Self, String> {
        Self::new(
            std::env::var(MAILER_URL_ENV).unwrap_or_default(),
            std::env::var(MAILER_TOKEN_ENV).unwrap_or_default(),
            std::env::var(MAILER_FROM_ENV).ok(),
        )
    }
}

fn is_local_http_url(url: &str) -> bool {
    [
        "http://127.0.0.1:",
        "http://127.0.0.1/",
        "http://localhost:",
        "http://localhost/",
        "http://[::1]:",
        "http://[::1]/",
    ]
    .iter()
    .any(|prefix| url.starts_with(prefix))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct EmailOtpDelivery {
    pub(crate) to: String,
    pub(crate) code: String,
    pub(crate) challenge_id: String,
    pub(crate) expires_at_ms: i64,
}

#[derive(Debug, Serialize)]
struct EmailOtpWebhookRequest<'a> {
    kind: &'static str,
    to: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    from: Option<&'a str>,
    subject: &'static str,
    text: String,
    code: &'a str,
    challenge_id: &'a str,
    expires_at_ms: i64,
}

pub(crate) fn deliver_email_otp_from_env(delivery: &EmailOtpDelivery) -> Result<(), String> {
    let config = EmailOtpMailerConfig::from_env()?;
    deliver_email_otp(&config, delivery)
}

pub(crate) fn deliver_email_otp(
    config: &EmailOtpMailerConfig,
    delivery: &EmailOtpDelivery,
) -> Result<(), String> {
    let payload = EmailOtpWebhookRequest {
        kind: "lobster-email-otp",
        to: &delivery.to,
        from: config.from.as_deref(),
        subject: "Lobster Chat 登录验证码",
        text: format!(
            "你的 Lobster Chat 验证码是 {}。验证码 10 分钟内有效，请勿转发。",
            delivery.code
        ),
        code: &delivery.code,
        challenge_id: &delivery.challenge_id,
        expires_at_ms: delivery.expires_at_ms,
    };
    let authorization = format!("Bearer {}", config.bearer_token);
    let response = ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(5))
        .timeout_read(Duration::from_secs(10))
        .timeout_write(Duration::from_secs(10))
        .build()
        .post(&config.url)
        .set("Authorization", &authorization)
        .set("Content-Type", "application/json")
        .set("User-Agent", "lobster-waku-gateway/email-otp")
        .send_json(
            serde_json::to_value(payload)
                .map_err(|error| format!("serialize email otp delivery failed: {error}"))?,
        )
        .map_err(|error| format!("email otp delivery failed: {error}"))?;

    if (200..300).contains(&response.status()) {
        Ok(())
    } else {
        Err(format!(
            "email otp delivery returned unexpected status {}",
            response.status()
        ))
    }
}
