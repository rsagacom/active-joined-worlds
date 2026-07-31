import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMailerServer, validateDelivery } from '../src/mailer.mjs';

const VALID_BODY = {
  kind: 'lobster-email-otp',
  to: 'resident@example.com',
  subject: '我和狗蛋儿的家登录验证码',
  text: '你在我和狗蛋儿的家的验证码是 123456。验证码 10 分钟内有效，请勿转发。',
  code: '123456',
  challenge_id: 'ch-1',
  expires_at_ms: 1780000000000,
};

async function withServer(options, run) {
  const server = createMailerServer({
    bearerToken: 'test-secret',
    mailFrom: '我和狗蛋儿的家 <otp@example.com>',
    sendEmail: async () => {},
    ...options,
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function postOtp(base, { token = 'test-secret', body = VALID_BODY } = {}) {
  return fetch(`${base}/lobster/email-otp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

test('validateDelivery 接受合法 OTP 投递', () => {
  assert.equal(validateDelivery(VALID_BODY), null);
});

test('validateDelivery 拒绝错误 kind、非法邮箱与非法验证码', () => {
  assert.equal(validateDelivery({ ...VALID_BODY, kind: 'other' }), 'unexpected kind');
  assert.equal(validateDelivery({ ...VALID_BODY, to: 'not-an-email' }), 'invalid to');
  assert.equal(validateDelivery({ ...VALID_BODY, code: 'abcdef' }), 'invalid code');
  assert.equal(validateDelivery(null), 'invalid json body');
});

test('无 Bearer 或 Bearer 错误返回 401', async () => {
  await withServer({}, async (base) => {
    const noAuth = await fetch(`${base}/lobster/email-otp`, { method: 'POST', body: '{}' });
    assert.equal(noAuth.status, 401);
    const wrongAuth = await postOtp(base, { token: 'wrong' });
    assert.equal(wrongAuth.status, 401);
  });
});

test('合法投递调用 sendEmail 并返回 200,不泄露上游细节', async () => {
  const sent = [];
  await withServer(
    { sendEmail: async (mail) => sent.push(mail) },
    async (base) => {
      const res = await postOtp(base);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { ok: true });
    }
  );
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'resident@example.com');
  assert.equal(sent[0].from, '我和狗蛋儿的家 <otp@example.com>');
  assert.match(sent[0].text, /123456/);
});

test('非法载荷返回 400,上游失败返回 502', async () => {
  await withServer(
    {
      sendEmail: async () => {
        throw new Error('resend responded 403: secret-api-key-detail');
      },
    },
    async (base) => {
      const bad = await postOtp(base, { body: { ...VALID_BODY, code: 'x' } });
      assert.equal(bad.status, 400);
      const upstream = await postOtp(base);
      assert.equal(upstream.status, 502);
      const payload = await upstream.json();
      assert.equal(payload.error, 'upstream delivery failed');
      assert.ok(!JSON.stringify(payload).includes('secret-api-key-detail'));
    }
  );
});

test('health 与未知路由', async () => {
  await withServer({}, async (base) => {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    const missing = await fetch(`${base}/nope`, { method: 'POST' });
    assert.equal(missing.status, 404);
  });
});
