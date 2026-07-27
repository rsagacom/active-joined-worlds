# lobster-mailer

Lobster Chat 邮件 OTP webhook 适配器。Gateway(`email_otp_mailer.rs`)在
production 模式下把 OTP 以 JSON POST 到 `LOBSTER_EMAIL_OTP_MAILER_URL`,
本服务接收该请求并通过 [Resend](https://resend.com) API 发出真实邮件。

## 合同

- `POST /lobster/email-otp`
  - 头:`Authorization: Bearer <LOBSTER_MAILER_BEARER_TOKEN>`
  - 体:`{kind:"lobster-email-otp", to, from?, subject, text, code, challenge_id, expires_at_ms}`
  - 响应:`200 {ok:true}`;`401` 鉴权失败;`400` 载荷非法;`502` 上游投递失败(不回显上游细节)
- `GET /health` → `200 {ok:true, service:"lobster-mailer"}`

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `LOBSTER_MAILER_BEARER_TOKEN` | 与 Gateway `LOBSTER_EMAIL_OTP_MAILER_BEARER_TOKEN` 一致 |
| `RESEND_API_KEY` | Resend API Key(`re_...`) |
| `LOBSTER_MAILER_FROM` | 发件人,如 `Lobster <otp@chat.example.com>`,域名需在 Resend 完成验证 |
| `LOBSTER_MAILER_HOST` | 监听地址,默认 `127.0.0.1` |
| `LOBSTER_MAILER_PORT` | 监听端口,默认 `8791` |

## 运行

```bash
node --version  # 需要 >= 22,无第三方依赖
npm test        # 单元测试
npm start       # 前台运行;生产用 deploy/lobster-mailer.service
```

## 与 Gateway 对接

Gateway 的 `gateway.env`:

```bash
LOBSTER_EMAIL_OTP_MAILER_URL=http://127.0.0.1:8791/lobster/email-otp
LOBSTER_EMAIL_OTP_MAILER_BEARER_TOKEN=<同上>
LOBSTER_EMAIL_OTP_FROM=Lobster <otp@chat.example.com>
```

本服务与 Gateway 同机部署时走 loopback http;跨机部署必须在前面套 https
反代(Gateway 端强制 https,仅放行 loopback http)。
