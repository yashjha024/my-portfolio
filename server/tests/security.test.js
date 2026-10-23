import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';

// ---------------------------------------------------------------------------
// Local Supabase stub (auth, PostgREST, storage) so requests exercise the real
// routes and middleware without ever contacting a real Supabase project.
// ---------------------------------------------------------------------------
const OWNER_EMAIL = 'owner@example.test';
const AUTH_USERS = {
  'owner-access-token': {
    id: '00000000-0000-4000-8000-000000000001',
    email: OWNER_EMAIL,
    email_confirmed_at: '2026-01-01T00:00:00Z',
  },
  // A non-owner whose public.users row claims role 'owner' must still be treated as a visitor
  'visitor-access-token': {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'visitor@example.test',
    email_confirmed_at: '2026-01-01T00:00:00Z',
  },
  // Owner email address but never confirmed
  'unconfirmed-owner-token': {
    id: '00000000-0000-4000-8000-000000000003',
    email: OWNER_EMAIL,
    email_confirmed_at: null,
  },
};
const PROFILES = Object.fromEntries(
  Object.values(AUTH_USERS).map((user) => [
    user.id,
    { id: user.id, email: user.email, full_name: 'Test User', role: 'owner' },
  ])
);
const CASE_STUDY = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'demo-case-study',
  title: 'Demo Case Study',
  status: 'draft',
};
const PRIVATE_MEDIA = {
  id: '22222222-2222-4222-8222-222222222222',
  filename: 'private.pdf',
  storage_path: 'assets/private/private.pdf',
  is_public: false,
  folder: 'private',
};

const stubRequests = [];
const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
  });

const stubServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://stub');
  const body = await readBody(req);
  stubRequests.push({ method: req.method, path: url.pathname });
  const wantsObject = (req.headers.accept || '').includes('vnd.pgrst.object');
  const send = (status, payload, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify(payload));
  };

  if (url.pathname === '/auth/v1/user') {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user = AUTH_USERS[token];
    return user
      ? send(200, { ...user, aud: 'authenticated', role: 'authenticated', app_metadata: {} })
      : send(401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' });
  }
  if (url.pathname === '/auth/v1/token') {
    return send(400, {
      error: 'invalid_grant',
      error_code: 'refresh_token_not_found',
      error_description: 'Invalid Refresh Token: Refresh Token Not Found',
    });
  }
  if (url.pathname.startsWith('/storage/v1/object/sign/')) {
    return send(200, { signedURL: `/object/sign/${url.pathname.split('/sign/')[1]}?token=stub` });
  }

  const table = url.pathname.replace('/rest/v1/', '');
  const idFilter = (url.searchParams.get('id') || '').replace('eq.', '');
  const rowsByTable = {
    users: PROFILES[idFilter] ? [PROFILES[idFilter]] : [],
    case_studies: [CASE_STUDY],
    media: [PRIVATE_MEDIA],
    site_settings: [{ id: 1, ...(body ? JSON.parse(body) : {}) }],
  };
  const rows = rowsByTable[table] || [];
  if (wantsObject) {
    return rows.length
      ? send(200, rows[0])
      : send(406, {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
        });
  }
  return send(200, rows, { 'Content-Range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
});
await new Promise((resolve) => stubServer.listen(0, '127.0.0.1', resolve));

// Configure an isolated environment before the app (and its dotenv loading) is imported.
const CLIENT_URL = 'https://portfolio.example.test';
const EXTRA_ORIGIN = 'https://admin-preview.example.test';
Object.assign(process.env, {
  NODE_ENV: 'test',
  CLIENT_URL,
  ALLOWED_ORIGINS: `${EXTRA_ORIGIN}/`,
  TRUST_PROXY_HOPS: '2',
  JWT_SECRET: 'test-only-preview-secret-0123456789abcdef',
  SUPABASE_URL: `http://127.0.0.1:${stubServer.address().port}`,
  SUPABASE_SERVICE_ROLE_KEY: 'stub-service-role-key',
  OWNER_EMAIL,
  CONTACT_EMAIL: OWNER_EMAIL,
  RESEND_API_KEY: '',
});

const { default: app } = await import('../src/app.js');
const { validateEnv } = await import('../src/config/env.js');
const { default: settingsRoutes } = await import('../src/routes/settings.routes.js');
const { generatePreviewToken } = await import('../src/utils/validation.utils.js');
const { setTokenCookies, clearTokenCookies } = await import('../src/utils/token.utils.js');

const appServer = http.createServer(app);
await new Promise((resolve) => appServer.listen(0, '127.0.0.1', resolve));
const API = `http://127.0.0.1:${appServer.address().port}`;

test.after(() => {
  appServer.close();
  stubServer.close();
});

const bearer = (token) => ({ Authorization: `Bearer ${token}` });
// Each test uses its own forwarded client address so rate-limit counters never interfere
const forwardedFor = (clientIp) => ({ 'X-Forwarded-For': `${clientIp}, 198.51.100.250` });

// ---------------------------------------------------------------------------
// 1. CORS and origins
// ---------------------------------------------------------------------------
test('Arbitrary *.vercel.app origins receive no credentialed CORS response', async () => {
  for (const origin of [
    'https://evil.vercel.app',
    'https://portfolio.example.test.evil.vercel.app',
  ]) {
    const res = await fetch(`${API}/api/health`, { headers: { Origin: origin } });
    assert.strictEqual(res.headers.get('access-control-allow-origin'), null, origin);
    assert.strictEqual(res.headers.get('access-control-allow-credentials'), null, origin);

    const preflight = await fetch(`${API}/api/admin/messages`, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
    });
    assert.strictEqual(preflight.headers.get('access-control-allow-origin'), null, origin);
  }
});

test('The configured public site origin and listed extra origins are allowed exactly', async () => {
  for (const origin of [CLIENT_URL, EXTRA_ORIGIN]) {
    const res = await fetch(`${API}/api/health`, { headers: { Origin: origin } });
    assert.strictEqual(res.headers.get('access-control-allow-origin'), origin);
    assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
    assert.match(res.headers.get('vary') || '', /Origin/i);
  }
});

test('Mutations from a non-allowlisted origin are rejected by the same allowlist', async () => {
  const res = await fetch(`${API}/api/settings`, {
    method: 'PUT',
    headers: { Origin: 'https://evil.vercel.app', 'Content-Type': 'application/json' },
    body: JSON.stringify({ biography: 'hacked' }),
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual((await res.json()).error, 'Invalid request origin.');
});

test('Origin configuration is validated: no wildcards, paths, or insecure production origins', () => {
  const base = {
    SUPABASE_URL: 'http://127.0.0.1:1',
    SUPABASE_SERVICE_ROLE_KEY: 'stub',
    OWNER_EMAIL,
  };
  assert.throws(
    () => validateEnv({ ...base, ALLOWED_ORIGINS: 'https://*.vercel.app' }),
    /wildcard/
  );
  assert.throws(() => validateEnv({ ...base, ALLOWED_ORIGINS: 'https://a.test/path' }), /path/);
  assert.throws(() => validateEnv({ ...base, CLIENT_URL: 'not a url' }), /invalid origin/);

  const prod = { ...base, NODE_ENV: 'production', JWT_SECRET: 'p'.repeat(40) };
  assert.throws(() => validateEnv(prod), /CLIENT_URL/);
  assert.throws(() => validateEnv({ ...prod, CLIENT_URL: 'http://site.test' }), /https/);
  assert.throws(
    () =>
      validateEnv({
        ...prod,
        CLIENT_URL: 'https://site.test',
        ALLOWED_ORIGINS: 'http://localhost:5173',
      }),
    /https/
  );
  assert.deepStrictEqual(
    validateEnv({ ...prod, CLIENT_URL: 'https://Site.test/' }).ALLOWED_ORIGINS,
    ['https://site.test']
  );
  // Local development keeps working without configuration
  assert.deepStrictEqual(validateEnv(base).ALLOWED_ORIGINS, ['http://localhost:5173']);
});

// ---------------------------------------------------------------------------
// 2. Cookies and CSRF
// ---------------------------------------------------------------------------
test('CSRF target PUT /api/settings is a real owner-protected mutation route', async () => {
  const putRoot = settingsRoutes.stack.find(
    (layer) => layer.route?.path === '/' && layer.route.methods.put
  );
  assert.ok(putRoot, 'settings router must define PUT /');
  assert.deepStrictEqual(
    putRoot.route.stack.map((layer) => layer.name),
    ['verifyAuth', 'verifyOwner', 'updateSettings']
  );

  // Without credentials the route itself answers (401 from verifyAuth), proving it exists (not 404)
  const anonymous = await fetch(`${API}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...forwardedFor('203.0.113.20') },
    body: JSON.stringify({ biography: 'x' }),
  });
  assert.strictEqual(anonymous.status, 401);

  // An owner Bearer request (no cookies, so no CSRF requirement) reaches the controller
  const owner = await fetch(`${API}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...bearer('owner-access-token'),
      ...forwardedFor('203.0.113.20'),
    },
    body: JSON.stringify({ biography: 'Updated by owner' }),
  });
  assert.strictEqual(owner.status, 200);
  assert.strictEqual((await owner.json()).data.biography, 'Updated by owner');
});

test('Refresh-token-only mutation without a valid CSRF token is rejected before auth or controller', async () => {
  const cases = [
    { Cookie: 'sb-refresh-token=stale-refresh; csrf-token=known-token' },
    {
      Cookie: 'sb-refresh-token=stale-refresh; csrf-token=known-token',
      'X-CSRF-Token': 'wrong-token',
    },
    { Cookie: 'sb-refresh-token=stale-refresh', 'X-CSRF-Token': 'known-token' },
  ];
  for (const headers of cases) {
    const before = stubRequests.length;
    const res = await fetch(`${API}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...forwardedFor('203.0.113.21'), ...headers },
      body: JSON.stringify({ biography: 'csrf attack' }),
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual((await res.json()).error, 'CSRF token mismatch or missing.');
    // (Fire-and-forget audit inserts from earlier tests may still arrive, so check endpoints, not counts)
    const during = stubRequests.slice(before).map((r) => r.path);
    assert.ok(!during.includes('/auth/v1/token'), 'no session refresh may be attempted');
    assert.ok(!during.includes('/auth/v1/user'), 'no token verification may be attempted');
    assert.ok(!during.includes('/rest/v1/site_settings'), 'the settings controller must not run');
  }

  // With a matching double-submit token the request proceeds to verifyAuth, which tries the refresh
  const before = stubRequests.length;
  const matching = await fetch(`${API}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...forwardedFor('203.0.113.21'),
      Cookie: 'sb-refresh-token=stale-refresh; csrf-token=known-token',
      'X-CSRF-Token': 'known-token',
    },
    body: JSON.stringify({ biography: 'legit' }),
  });
  assert.strictEqual(matching.status, 401);
  assert.ok(stubRequests.slice(before).some((r) => r.path === '/auth/v1/token'));
  assert.ok(!stubRequests.slice(before).some((r) => r.path === '/rest/v1/site_settings'));
});

test('Public contact submissions stay exempt from CSRF even with stale session cookies', async () => {
  const res = await fetch(`${API}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: 'sb-refresh-token=stale-refresh',
      ...forwardedFor('203.0.113.22'),
    },
    body: JSON.stringify({ name: 'x' }),
  });
  // Reaches the controller's validation (400), not the CSRF guard (403)
  assert.strictEqual(res.status, 400);
});

test('Session cookies are set and cleared with identical SameSite=Lax attributes', () => {
  const calls = [];
  const fakeRes = {
    cookie: (name, value, options) => calls.push({ kind: 'set', name, options }),
    clearCookie: (name, options) => calls.push({ kind: 'clear', name, options }),
  };
  setTokenCookies(fakeRes, 'access', 'refresh');
  clearTokenCookies(fakeRes);

  const strip = ({ maxAge: _maxAge, ...rest }) => rest;
  for (const name of ['sb-access-token', 'sb-refresh-token']) {
    const set = calls.find((c) => c.kind === 'set' && c.name === name);
    const clear = calls.find((c) => c.kind === 'clear' && c.name === name);
    assert.strictEqual(set.options.sameSite, 'lax');
    assert.strictEqual(set.options.httpOnly, true);
    assert.deepStrictEqual(
      strip(set.options),
      clear.options,
      `${name} set/clear options must match`
    );
  }
});

// ---------------------------------------------------------------------------
// 3. Proxy trust and rate limiting
// ---------------------------------------------------------------------------
const remaining = (res) => Number(res.headers.get('ratelimit-remaining'));

test('With TRUST_PROXY_HOPS=2 the limiter keys on the real client, ignoring spoofed entries', async () => {
  assert.strictEqual(app.get('trust proxy'), 2);
  const hit = (xff) => fetch(`${API}/api/health`, { headers: { 'X-Forwarded-For': xff } });

  // Expected production chain: "<client>, <vercel egress>" with the Railway edge as socket peer
  const first = await hit('203.0.113.30, 198.51.100.7');
  const spoofed = await hit('6.6.6.6, 203.0.113.30, 198.51.100.7');
  const spoofedAgain = await hit('1.2.3.4, 9.9.9.9, 203.0.113.30, 198.51.100.7');
  assert.strictEqual(
    remaining(spoofed),
    remaining(first) - 1,
    'spoofed prefix must not create a new bucket'
  );
  assert.strictEqual(remaining(spoofedAgain), remaining(first) - 2);

  const otherClient = await hit('203.0.113.31, 198.51.100.7');
  assert.strictEqual(
    remaining(otherClient),
    remaining(first),
    'distinct clients get distinct buckets'
  );
});

test('TRUST_PROXY_HOPS is validated and 0 never trusts client-supplied X-Forwarded-For', async () => {
  const base = {
    SUPABASE_URL: 'http://127.0.0.1:1',
    SUPABASE_SERVICE_ROLE_KEY: 'stub',
    OWNER_EMAIL,
  };
  assert.strictEqual(validateEnv(base).TRUST_PROXY_HOPS, 0);
  assert.strictEqual(validateEnv({ ...base, TRUST_PROXY_HOPS: '2' }).TRUST_PROXY_HOPS, 2);
  for (const bad of ['true', '-1', '1.5', 'abc', '99', 'loopback']) {
    assert.throws(() => validateEnv({ ...base, TRUST_PROXY_HOPS: bad }), /TRUST_PROXY_HOPS/, bad);
  }

  const probe = express();
  probe.set('trust proxy', validateEnv(base).TRUST_PROXY_HOPS);
  probe.get('/ip', (req, res) => res.json({ ip: req.ip }));
  const server = http.createServer(probe);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/ip`, {
      headers: { 'X-Forwarded-For': '6.6.6.6' },
    });
    assert.match((await res.json()).ip, /127\.0\.0\.1$/);
  } finally {
    server.close();
  }
});

test('Login and contact limits use separate stores; /auth/me is not login-limited', async () => {
  const client = forwardedFor('203.0.113.40');
  const contact = await fetch(`${API}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...client },
    body: JSON.stringify({}),
  });
  const login = await fetch(`${API}/api/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...client },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  assert.strictEqual(Number(contact.headers.get('ratelimit-limit')), 15);
  assert.strictEqual(Number(login.headers.get('ratelimit-limit')), 15);
  assert.strictEqual(remaining(contact), 14);
  assert.strictEqual(remaining(login), 14, 'a contact submission must not consume a login attempt');

  const me = await fetch(`${API}/api/auth/me`, { headers: client });
  assert.strictEqual(me.status, 401);
  assert.strictEqual(Number(me.headers.get('ratelimit-limit')), 120);
});

test('Only public published-content GETs are CDN-cacheable; private responses are no-store', async () => {
  const headers = forwardedFor('203.0.113.50');
  const publicList = await fetch(`${API}/api/work`, { headers });
  assert.strictEqual(publicList.status, 200);
  assert.match(publicList.headers.get('cache-control'), /public.*s-maxage=60/);

  const preview = await fetch(`${API}/api/work/slug/demo-case-study?preview_token=x`, { headers });
  assert.strictEqual(preview.headers.get('cache-control'), 'no-store');

  const admin = await fetch(`${API}/api/admin/messages`, {
    headers: { ...headers, ...bearer('owner-access-token') },
  });
  assert.strictEqual(admin.status, 200);
  assert.strictEqual(admin.headers.get('cache-control'), 'no-store');

  const me = await fetch(`${API}/api/auth/me`, {
    headers: { ...headers, ...bearer('owner-access-token') },
  });
  assert.strictEqual(me.headers.get('cache-control'), 'no-store');
});

// ---------------------------------------------------------------------------
// 4. Preview JWT secret
// ---------------------------------------------------------------------------
test('Production refuses to start without a strong, non-placeholder JWT_SECRET', () => {
  const base = {
    NODE_ENV: 'production',
    CLIENT_URL: 'https://site.test',
    SUPABASE_URL: 'http://127.0.0.1:1',
    SUPABASE_SERVICE_ROLE_KEY: 'stub',
    OWNER_EMAIL,
  };
  assert.throws(() => validateEnv(base), /JWT_SECRET/);
  assert.throws(() => validateEnv({ ...base, JWT_SECRET: 'too-short' }), /JWT_SECRET/);
  assert.throws(
    () => validateEnv({ ...base, JWT_SECRET: 'generate_a_random_value_of_at_least_32_characters' }),
    /JWT_SECRET/
  );
  assert.doesNotThrow(() => validateEnv({ ...base, JWT_SECRET: 'k'.repeat(48) }));
});

// ---------------------------------------------------------------------------
// 5. Owner vs non-owner authorization (required and optional paths)
// ---------------------------------------------------------------------------
test('Admin routes admit only the confirmed owner account', async () => {
  const headers = forwardedFor('203.0.113.60');
  const statusFor = async (extra) =>
    (await fetch(`${API}/api/admin/messages`, { headers: { ...headers, ...extra } })).status;

  assert.strictEqual(await statusFor({}), 401);
  assert.strictEqual(await statusFor(bearer('forged-token')), 401);
  assert.strictEqual(
    await statusFor(bearer('visitor-access-token')),
    403,
    'DB role must not grant owner'
  );
  assert.strictEqual(await statusFor(bearer('unconfirmed-owner-token')), 403);
  assert.strictEqual(await statusFor(bearer('owner-access-token')), 200);
});

test('Optional-auth paths (draft preview, private media) apply the same owner rule', async () => {
  const headers = forwardedFor('203.0.113.61');
  const token = generatePreviewToken(CASE_STUDY, 'work');
  const previewUrl = `${API}/api/work/slug/${CASE_STUDY.slug}?preview_token=${token}`;

  assert.strictEqual((await fetch(previewUrl, { headers })).status, 403);
  assert.strictEqual(
    (await fetch(previewUrl, { headers: { ...headers, ...bearer('visitor-access-token') } }))
      .status,
    403
  );
  const ownerPreview = await fetch(previewUrl, {
    headers: { ...headers, ...bearer('owner-access-token') },
  });
  assert.strictEqual(ownerPreview.status, 200);
  assert.strictEqual(ownerPreview.headers.get('cache-control'), 'no-store');

  const mediaUrl = `${API}/api/media/download/${PRIVATE_MEDIA.id}`;
  const visitorMedia = await fetch(mediaUrl, {
    headers: { ...headers, ...bearer('visitor-access-token') },
    redirect: 'manual',
  });
  assert.strictEqual(visitorMedia.status, 403);
  const ownerMedia = await fetch(mediaUrl, {
    headers: { ...headers, ...bearer('owner-access-token') },
    redirect: 'manual',
  });
  assert.strictEqual(ownerMedia.status, 302);
});

test('CSRF cookie is never issued on publicly cacheable responses or feeds', async () => {
  const headers = forwardedFor('203.0.113.51');
  for (const path of [
    '/api/work',
    '/api/settings',
    '/api/work/slug/demo-case-study',
    '/sitemap.xml',
  ]) {
    const res = await fetch(`${API}${path}`, { headers });
    assert.strictEqual(res.headers.get('set-cookie'), null, `${path} must not set a cookie`);
  }

  // Non-cacheable API responses still issue it, so the admin console can send the CSRF header
  const me = await fetch(`${API}/api/auth/me`, { headers });
  assert.strictEqual(me.headers.get('cache-control'), 'no-store');
  assert.match(me.headers.get('set-cookie') || '', /^csrf-token=/);

  const csrf = await fetch(`${API}/api/csrf-token`, { headers });
  assert.strictEqual(csrf.status, 200);
  assert.strictEqual(csrf.headers.get('cache-control'), 'no-store');
  assert.match(csrf.headers.get('set-cookie') || '', /^csrf-token=/);
});

test('Supabase server key: SUPABASE_SECRET_KEY preferred, legacy name as fallback, publishable rejected', () => {
  const base = { SUPABASE_URL: 'http://127.0.0.1:1', OWNER_EMAIL: 'o@example.test' };
  const both = validateEnv({
    ...base,
    SUPABASE_SECRET_KEY: 'sb_secret_new',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_old',
  });
  assert.strictEqual(both.SUPABASE_SERVICE_ROLE_KEY, 'sb_secret_new');
  assert.strictEqual(both.SUPABASE_KEY_SOURCE, 'SUPABASE_SECRET_KEY');

  const legacy = validateEnv({ ...base, SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_old' });
  assert.strictEqual(legacy.SUPABASE_SERVICE_ROLE_KEY, 'sb_secret_old');
  assert.strictEqual(legacy.SUPABASE_KEY_SOURCE, 'SUPABASE_SERVICE_ROLE_KEY');

  assert.throws(() => validateEnv(base), /SUPABASE_SECRET_KEY/);
  assert.throws(
    () => validateEnv({ ...base, SUPABASE_SECRET_KEY: 'sb_publishable_abc' }),
    /publishable/
  );
});
