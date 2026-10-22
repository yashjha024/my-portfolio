import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// ---------------------------------------------------------------------------
// Local doubles: a Supabase stub (PostgREST + auth) and a fetch interceptor for Resend.
// No real database is contacted and no email is sent.
// ---------------------------------------------------------------------------
const OWNER_EMAIL = 'owner@example.test';
const CLIENT_URL = 'https://portfolio.example.test';

const state = {
  lookup: 'empty', // 'empty' | 'duplicate' | 'error'
  insert: 'ok', // 'ok' | 'error'
  resend: 'ok', // 'ok' | 'error' | 'network'
  inserts: [],
  emails: [],
  otpRequests: [],
  signOutRequests: [],
};
const resetState = () => {
  Object.assign(state, { lookup: 'empty', insert: 'ok', resend: 'ok' });
  state.inserts.length = 0;
  state.emails.length = 0;
  state.otpRequests.length = 0;
  state.signOutRequests.length = 0;
};

const stub = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    const url = new URL(req.url, 'http://stub');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(body === undefined ? '' : JSON.stringify(body));
    };

    if (url.pathname === '/auth/v1/otp') {
      state.otpRequests.push({
        query: Object.fromEntries(url.searchParams),
        body: JSON.parse(raw || '{}'),
      });
      return send(200, {});
    }
    if (url.pathname === '/auth/v1/logout') {
      state.signOutRequests.push(req.headers.authorization);
      return req.headers.authorization === 'Bearer valid-access-token'
        ? send(204)
        : send(401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT: token is expired' });
    }
    if (url.pathname === '/auth/v1/user') return send(401, { msg: 'invalid JWT' });

    if (url.pathname === '/rest/v1/contact_messages' && req.method === 'GET') {
      // 500 rather than 503: postgrest-js retries 503s with backoff, which only slows the test
      if (state.lookup === 'error')
        return send(500, { code: 'XX000', message: 'Connection refused' });
      return send(200, state.lookup === 'duplicate' ? [{ id: 'existing-id' }] : []);
    }
    if (url.pathname === '/rest/v1/contact_messages' && req.method === 'POST') {
      if (state.insert === 'error') {
        return send(500, {
          code: '57P01',
          message: 'terminating connection due to administrator command',
        });
      }
      const [row] = JSON.parse(raw);
      state.inserts.push(row);
      return send(201, { id: `msg-${state.inserts.length}` });
    }
    return send(404, { code: 'PGRST205', message: 'not found' });
  });
});
await new Promise((resolve) => stub.listen(0, '127.0.0.1', resolve));

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('https://api.resend.com/')) {
    state.emails.push({ headers: init.headers, body: JSON.parse(init.body) });
    if (state.resend === 'network') throw new TypeError('fetch failed');
    return state.resend === 'ok'
      ? new Response(JSON.stringify({ id: 'email-1' }), { status: 200 })
      : new Response(JSON.stringify({ message: 'Domain not verified' }), { status: 403 });
  }
  return realFetch(input, init);
};

Object.assign(process.env, {
  NODE_ENV: 'test',
  CLIENT_URL,
  TRUST_PROXY_HOPS: '1',
  JWT_SECRET: 'test-only-preview-secret-0123456789abcdef',
  SUPABASE_URL: `http://127.0.0.1:${stub.address().port}`,
  SUPABASE_SERVICE_ROLE_KEY: 'stub-service-role-key',
  OWNER_EMAIL,
  CONTACT_EMAIL: OWNER_EMAIL,
  RESEND_API_KEY: 're_test_1234567890abcdef',
});

const { default: app } = await import('../src/app.js');
const { resetContactSubmissionCache, CONTACT_LIMITS, isEmailDeliveryConfigured } =
  await import('../src/controllers/contact.controller.js');

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const API = `http://127.0.0.1:${server.address().port}`;

test.after(() => {
  server.close();
  stub.close();
  globalThis.fetch = realFetch;
});
test.beforeEach(() => {
  resetState();
  resetContactSubmissionCache();
});

// Each request gets its own client address so the contact rate limit never interferes
let clientCounter = 0;
const nextClient = () => {
  clientCounter += 1;
  return `198.51.${Math.floor(clientCounter / 250)}.${(clientCounter % 250) + 1}`;
};

const validMessage = (overrides = {}) => ({
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  subject: 'Product role',
  purpose: 'Hiring / Role Discussion',
  message: 'I would like to talk about a product role.',
  ...overrides,
});

const postContact = async (body, { raw, client = nextClient(), headers = {} } = {}) => {
  const res = await fetch(`${API}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': client, ...headers },
    body: raw ?? JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
};

/* eslint-disable no-console -- the helper swaps console methods to assert on server logs */
const captureConsole = (method) => {
  const calls = [];
  const original = console[method];
  console[method] = (...args) =>
    calls.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  return { calls, restore: () => (console[method] = original) };
};
/* eslint-enable no-console */

// ---------------------------------------------------------------------------
// Contact: persistence x delivery matrix
// ---------------------------------------------------------------------------
test('stored and emailed: success with notified=true', async () => {
  const client = nextClient();
  const { status, body } = await postContact(validMessage({ name: '  Ada Lovelace  ' }), {
    client,
  });
  assert.strictEqual(status, 200);
  assert.deepStrictEqual(
    { success: body.success, persisted: body.persisted, notified: body.notified },
    { success: true, persisted: true, notified: true }
  );
  assert.strictEqual(state.inserts.length, 1);
  assert.strictEqual(state.inserts[0].name, 'Ada Lovelace', 'trimmed');
  assert.strictEqual(state.inserts[0].subject, '[Hiring / Role Discussion] Product role');
  assert.strictEqual(state.inserts[0].ip_address, client, 'real client IP behind the proxy');
  assert.strictEqual(state.emails.length, 1);
  assert.deepStrictEqual(state.emails[0].body.to, [OWNER_EMAIL]);
});

test('stored but email failed: inquiry received, notification failure logged', async () => {
  for (const failure of ['error', 'network']) {
    resetState();
    resetContactSubmissionCache();
    state.resend = failure;
    const warn = captureConsole('warn');
    const { status, body } = await postContact(validMessage());
    warn.restore();
    assert.strictEqual(status, 200, failure);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.persisted, true);
    assert.strictEqual(body.notified, false, 'response does not claim the email was sent');
    assert.strictEqual(state.inserts.length, 1);
    assert.ok(warn.calls.some((line) => line.includes('Owner notification not sent')));
  }
});

test('not stored but emailed: 202, never claims the message was saved', async () => {
  state.insert = 'error';
  const error = captureConsole('error');
  const { status, body } = await postContact(validMessage());
  error.restore();
  assert.strictEqual(status, 202);
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.persisted, false);
  assert.strictEqual(body.notified, true);
  assert.strictEqual(body.code, 'CONTACT_NOT_STORED');
  assert.match(body.message, /could not be saved/);
  assert.ok(error.calls.some((line) => line.includes('Failed to store contact message')));
});

test('neither stored nor emailed: 503 with an honest error', async () => {
  state.insert = 'error';
  state.resend = 'error';
  const error = captureConsole('error');
  const { status, body } = await postContact(validMessage());
  error.restore();
  assert.strictEqual(status, 503);
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.persisted, false);
  assert.strictEqual(body.notified, false);
  assert.strictEqual(body.code, 'CONTACT_UNAVAILABLE');
});

test('missing or invalid production email configuration is never treated as delivered', async () => {
  const saved = { key: process.env.RESEND_API_KEY, env: process.env.NODE_ENV };
  try {
    for (const key of ['', 'your_resend_api_key', 'placeholder']) {
      resetState();
      resetContactSubmissionCache();
      process.env.RESEND_API_KEY = key;
      process.env.NODE_ENV = 'production';
      assert.strictEqual(isEmailDeliveryConfigured(), false, `"${key}" is not a usable key`);

      const error = captureConsole('error');
      const { status, body } = await postContact(validMessage());
      error.restore();
      assert.strictEqual(status, 200);
      assert.strictEqual(body.persisted, true);
      assert.strictEqual(body.notified, false);
      assert.strictEqual(state.emails.length, 0, 'no simulated send');
      assert.ok(
        error.calls.some((line) => line.includes('not_configured')),
        'logged as an error'
      );

      // And when storage also fails, the visitor gets a 503 rather than a fake success
      resetContactSubmissionCache();
      state.insert = 'error';
      const silenced = captureConsole('error');
      const failed = await postContact(validMessage({ message: 'A different message body.' }));
      silenced.restore();
      assert.strictEqual(failed.status, 503);
    }
  } finally {
    process.env.RESEND_API_KEY = saved.key;
    process.env.NODE_ENV = saved.env;
  }
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------
test('a duplicate found in the database is acknowledged without storing or emailing again', async () => {
  state.lookup = 'duplicate';
  const { status, body } = await postContact(validMessage());
  assert.strictEqual(status, 200);
  assert.strictEqual(body.deduplicated, true);
  assert.strictEqual(state.inserts.length, 0);
  assert.strictEqual(state.emails.length, 0);
});

test('duplicate-lookup failure is logged, not treated as "no duplicate", and retries stay idempotent', async () => {
  state.lookup = 'error';
  const error = captureConsole('error');
  const first = await postContact(validMessage());
  error.restore();
  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.body.persisted, true);
  assert.ok(error.calls.some((line) => line.includes('Duplicate lookup failed')));

  // Retry while the lookup is still failing: recognised by the in-process record
  const silenced = captureConsole('error');
  const retry = await postContact(validMessage());
  silenced.restore();
  assert.strictEqual(retry.status, 200);
  assert.strictEqual(retry.body.deduplicated, true);
  assert.strictEqual(state.inserts.length, 1, 'stored once');
  assert.strictEqual(state.emails.length, 1, 'emailed once');
});

test('a failed submission is not remembered, so the visitor can retry', async () => {
  state.insert = 'error';
  state.resend = 'error';
  const error = captureConsole('error');
  const failed = await postContact(validMessage());
  assert.strictEqual(failed.status, 503);

  state.insert = 'ok';
  state.resend = 'ok';
  const retry = await postContact(validMessage());
  error.restore();
  assert.strictEqual(retry.status, 200);
  assert.strictEqual(retry.body.deduplicated, undefined);
  assert.strictEqual(state.inserts.length, 1);
});

// ---------------------------------------------------------------------------
// HTML injection and validation
// ---------------------------------------------------------------------------
test('user-controlled values are escaped in the notification email', async () => {
  const { status } = await postContact(
    validMessage({
      name: '<img src=x onerror=alert(1)>\r\nBcc: victim@example.test',
      subject: '<script>alert("s")</script>',
      purpose: '<b>Hiring</b>',
      message: '</p><a href="javascript:alert(1)">click</a> & "quotes" \'single\'',
    })
  );
  assert.strictEqual(status, 200);
  const { html, subject } = state.emails[0].body;
  for (const raw of ['<img', '<script>', '<b>', '<a href="javascript', '</p><a']) {
    assert.ok(!html.includes(raw), `raw markup must not appear: ${raw}`);
  }
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;s&quot;)&lt;/script&gt;'));
  assert.ok(html.includes('&amp; &quot;quotes&quot; &#39;single&#39;'));
  assert.ok(!/[\r\n]/.test(subject), 'no line breaks in the email subject');
  assert.ok(!state.inserts[0].name.includes('\n'), 'single-line name stored');
});

test('input length boundaries are enforced', async () => {
  const atLimit = validMessage({
    name: 'n'.repeat(CONTACT_LIMITS.name),
    subject: 's'.repeat(CONTACT_LIMITS.subject),
    purpose: 'p'.repeat(CONTACT_LIMITS.purpose),
    message: 'm'.repeat(CONTACT_LIMITS.message),
  });
  assert.strictEqual((await postContact(atLimit)).status, 200);

  const overLimit = [
    { name: 'n'.repeat(CONTACT_LIMITS.name + 1) },
    { subject: 's'.repeat(CONTACT_LIMITS.subject + 1) },
    { purpose: 'p'.repeat(CONTACT_LIMITS.purpose + 1) },
    { message: 'm'.repeat(CONTACT_LIMITS.message + 1) },
    { email: `${'a'.repeat(250)}@example.test` },
    { name: 'A' },
    { subject: 'ab' },
    { message: 'too short' },
    { message: '          padded          ' },
  ];
  for (const overrides of overLimit) {
    const { status, body } = await postContact(validMessage(overrides));
    assert.strictEqual(status, 400, JSON.stringify(Object.keys(overrides)));
    assert.strictEqual(body.success, false);
    assert.ok(body.error);
  }
  assert.strictEqual(state.inserts.length, 1, 'only the at-limit submission was stored');
});

test('malformed and oversized bodies are rejected without storing anything', async () => {
  const cases = [
    { raw: '{"name": "Ada", ' },
    { raw: '"just a string"' },
    { raw: '[1,2,3]' },
    { body: {} },
    { body: validMessage({ email: 'not-an-email' }) },
    { body: validMessage({ name: 42 }) },
    { body: validMessage({ message: ['array', 'message'] }) },
  ];
  for (const { raw, body } of cases) {
    const result = await postContact(body, { raw });
    assert.strictEqual(result.status, 400, raw || JSON.stringify(body));
  }

  const huge = await postContact(validMessage({ message: 'x'.repeat(20 * 1024) }));
  assert.strictEqual(huge.status, 413, 'contact bodies over 16 KB are rejected by the parser');
  assert.strictEqual(state.inserts.length, 0);
  assert.strictEqual(state.emails.length, 0);
});

test('honeypot submissions are acknowledged but neither stored nor emailed', async () => {
  const { status } = await postContact(validMessage({ honeypot: 'http://spam.example' }));
  assert.strictEqual(status, 200);
  assert.strictEqual(state.inserts.length, 0);
  assert.strictEqual(state.emails.length, 0);
});

test('CMS routes still accept JSON bodies larger than the contact limit', async () => {
  // 100 KB article body: rejected for auth (401), not by the body parser (413)
  const res = await fetch(`${API}/api/admin/thinking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': nextClient() },
    body: JSON.stringify({ title: 'Long', body: 'x'.repeat(100 * 1024) }),
  });
  assert.strictEqual(res.status, 401);
});

// ---------------------------------------------------------------------------
// Authentication redirects and logout
// ---------------------------------------------------------------------------
test('magic link uses emailRedirectTo with the trusted CLIENT_URL', async () => {
  const res = await fetch(`${API}/api/auth/magic-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://evil.vercel.app',
      'X-Forwarded-For': nextClient(),
    },
    body: JSON.stringify({ email: OWNER_EMAIL }),
  });
  // Mutations from a non-allowlisted Origin are refused outright (Phase 1 guard)
  assert.strictEqual(res.status, 403);

  const ok = await fetch(`${API}/api/auth/magic-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: CLIENT_URL,
      'X-Forwarded-For': nextClient(),
    },
    body: JSON.stringify({ email: OWNER_EMAIL }),
  });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(state.otpRequests.length, 1);
  assert.strictEqual(state.otpRequests[0].query.redirect_to, `${CLIENT_URL}/auth/callback`);
  assert.strictEqual(state.otpRequests[0].body.email, OWNER_EMAIL);

  const notOwner = await fetch(`${API}/api/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': nextClient() },
    body: JSON.stringify({ email: 'someone@example.test' }),
  });
  assert.strictEqual(notOwner.status, 403, 'owner restriction intact');
  assert.strictEqual(state.otpRequests.length, 1);
});

test('Google OAuth redirect comes from CLIENT_URL, not the Origin header', async () => {
  for (const origin of ['https://evil.vercel.app', 'http://localhost:9999', undefined]) {
    const res = await fetch(`${API}/api/auth/google`, {
      headers: { ...(origin ? { Origin: origin } : {}), 'X-Forwarded-For': nextClient() },
    });
    assert.strictEqual(res.status, 200);
    const { url } = await res.json();
    assert.strictEqual(new URL(url).searchParams.get('redirect_to'), `${CLIENT_URL}/auth/callback`);
  }
});

const clearedCookies = (res) => {
  const cookies = res.headers.getSetCookie();
  const cleared = (name) =>
    cookies.find(
      (c) =>
        c.startsWith(`${name}=;`) &&
        /Expires=Thu, 01 Jan 1970/.test(c) &&
        /SameSite=Lax/i.test(c) &&
        /HttpOnly/i.test(c)
    );
  return { access: cleared('sb-access-token'), refresh: cleared('sb-refresh-token') };
};

test('logout clears cookies even when the session is expired or invalid', async () => {
  const res = await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie:
        'sb-access-token=expired-access-token; sb-refresh-token=stale-refresh; csrf-token=tok',
      'X-CSRF-Token': 'tok',
      'X-Forwarded-For': nextClient(),
    },
  });
  assert.strictEqual(res.status, 200, 'not blocked by an auth check');
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.revoked, false);
  const { access, refresh } = clearedCookies(res);
  assert.ok(access, 'sb-access-token cleared');
  assert.ok(refresh, 'sb-refresh-token cleared');
  assert.deepStrictEqual(state.signOutRequests, ['Bearer expired-access-token']);
});

test('logout revokes a valid session and works without any session', async () => {
  const valid = await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie: 'sb-access-token=valid-access-token; csrf-token=tok',
      'X-CSRF-Token': 'tok',
      'X-Forwarded-For': nextClient(),
    },
  });
  assert.strictEqual(valid.status, 200);
  assert.strictEqual((await valid.json()).revoked, true);
  assert.ok(clearedCookies(valid).access);

  const anonymous = await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    headers: { 'X-Forwarded-For': nextClient() },
  });
  assert.strictEqual(anonymous.status, 200);
});

test('logout with session cookies still requires the CSRF token (Phase 1 guard intact)', async () => {
  const res = await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie: 'sb-refresh-token=stale-refresh; csrf-token=tok',
      'X-Forwarded-For': nextClient(),
    },
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(state.signOutRequests.length, 0);
});
