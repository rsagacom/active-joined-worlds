import http from 'node:http';

const LISTEN_HOST = process.env.LOBSTER_MAILER_HOST ?? '127.0.0.1';
const LISTEN_PORT = Number(process.env.LOBSTER_MAILER_PORT ?? '8791');
const BEARER_TOKEN = (process.env.LOBSTER_MAILER_BEARER_TOKEN ?? '').trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY ?? '').trim();
const MAIL_FROM = (process.env.LOBSTER_MAILER_FROM ?? '').trim();
const OTP_PATH = '/lobster/email-otp';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDelivery(body) {
  if (!body || typeof body !== 'object') return 'invalid json body';
  if (body.kind !== 'lobster-email-otp') return 'unexpected kind';
  if (typeof body.to !== 'string' || !EMAIL_RE.test(body.to)) return 'invalid to';
  if (typeof body.subject !== 'string' || body.subject.length === 0) return 'invalid subject';
  if (typeof body.text !== 'string' || body.text.length === 0) return 'invalid text';
  if (typeof body.code !== 'string' || !/^\d{4,8}$/.test(body.code)) return 'invalid code';
  return null;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createMailerServer(options = {}) {
  const bearerToken = options.bearerToken ?? BEARER_TOKEN;
  const resendApiKey = options.resendApiKey ?? RESEND_API_KEY;
  const mailFrom = options.mailFrom ?? MAIL_FROM;
  const sendEmail =
    options.sendEmail ??
    (async ({ from, to, subject, text }) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`resend responded ${response.status}: ${detail.slice(0, 200)}`);
      }
    });

  return http.createServer(async (req, res) => {
    const reply = (status, payload) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    if (req.method === 'GET' && req.url === '/health') {
      return reply(200, { ok: true, service: 'lobster-mailer' });
    }
    if (req.method !== 'POST' || req.url !== OTP_PATH) {
      return reply(404, { ok: false, error: 'not found' });
    }
    if (!bearerToken || req.headers.authorization !== `Bearer ${bearerToken}`) {
      return reply(401, { ok: false, error: 'unauthorized' });
    }
    if (!mailFrom) {
      return reply(500, { ok: false, error: 'LOBSTER_MAILER_FROM is not configured' });
    }

    let body;
    try {
      body = await readJson(req);
    } catch {
      return reply(400, { ok: false, error: 'invalid json body' });
    }
    const invalid = validateDelivery(body);
    if (invalid) {
      return reply(400, { ok: false, error: invalid });
    }

    try {
      await sendEmail({
        from: mailFrom,
        to: body.to,
        subject: body.subject,
        text: body.text,
      });
      return reply(200, { ok: true });
    } catch (error) {
      console.error('[lobster-mailer] resend delivery failed:', error.message);
      return reply(502, { ok: false, error: 'upstream delivery failed' });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!BEARER_TOKEN || !RESEND_API_KEY || !MAIL_FROM) {
    console.error(
      '[lobster-mailer] LOBSTER_MAILER_BEARER_TOKEN / RESEND_API_KEY / LOBSTER_MAILER_FROM are required'
    );
    process.exit(1);
  }
  createMailerServer().listen(LISTEN_PORT, LISTEN_HOST, () => {
    console.log(`[lobster-mailer] listening on http://${LISTEN_HOST}:${LISTEN_PORT}${OTP_PATH}`);
  });
}
