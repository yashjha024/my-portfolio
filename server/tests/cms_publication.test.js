import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// Local Supabase stub with an in-memory table store, so controller writes can be inspected
// without contacting a real project.
const OWNER_EMAIL = 'owner@example.test';
const OWNER_TOKEN = 'owner-access-token';
const OWNER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: OWNER_EMAIL,
  email_confirmed_at: '2026-01-01T00:00:00Z',
};
const EXISTING_PUBLISHED_AT = '2026-01-15T09:30:00.000Z';
const IDS = {
  draft: '11111111-1111-4111-8111-111111111111',
  published: '22222222-2222-4222-8222-222222222222',
  archivedWithDate: '33333333-3333-4333-8333-333333333333',
};

const seedRows = () => ({
  [IDS.draft]: { id: IDS.draft, status: 'draft', published_at: null },
  [IDS.published]: { id: IDS.published, status: 'published', published_at: EXISTING_PUBLISHED_AT },
  [IDS.archivedWithDate]: {
    id: IDS.archivedWithDate,
    status: 'archived',
    published_at: EXISTING_PUBLISHED_AT,
  },
});
const tables = { case_studies: seedRows(), thinking_articles: seedRows() };
const writes = [];

const stub = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    const url = new URL(req.url, 'http://stub');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === '/auth/v1/user') {
      return req.headers.authorization === `Bearer ${OWNER_TOKEN}`
        ? send(200, { ...OWNER, aud: 'authenticated', role: 'authenticated' })
        : send(401, { msg: 'invalid JWT' });
    }
    const table = url.pathname.replace('/rest/v1/', '');
    if (table === 'users') return send(200, { id: OWNER.id, email: OWNER_EMAIL, role: 'owner' });
    if (!tables[table]) return send(201, []);

    const id = (url.searchParams.get('id') || '').replace('eq.', '');
    const body = raw ? JSON.parse(raw) : null;
    if (req.method === 'GET') {
      const row = tables[table][id];
      return row ? send(200, row) : send(406, { code: 'PGRST116' });
    }
    if (req.method === 'PATCH') {
      writes.push({ table, method: 'PATCH', id, body });
      tables[table][id] = { ...tables[table][id], ...body };
      return send(200, tables[table][id]);
    }
    if (req.method === 'POST') {
      const row = Array.isArray(body) ? body[0] : body;
      writes.push({ table, method: 'POST', body: row });
      return send(201, { id: '99999999-9999-4999-8999-999999999999', ...row });
    }
    return send(405, {});
  });
});
await new Promise((resolve) => stub.listen(0, '127.0.0.1', resolve));

Object.assign(process.env, {
  NODE_ENV: 'test',
  CLIENT_URL: 'https://portfolio.example.test',
  JWT_SECRET: 'test-only-preview-secret-0123456789abcdef',
  SUPABASE_URL: `http://127.0.0.1:${stub.address().port}`,
  SUPABASE_SERVICE_ROLE_KEY: 'stub-service-role-key',
  OWNER_EMAIL,
  RESEND_API_KEY: '',
});

const { default: app } = await import('../src/app.js');
const { resolvePublishedAt } = await import('../src/utils/publication.utils.js');

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const API = `http://127.0.0.1:${server.address().port}`;
test.after(() => {
  server.close();
  stub.close();
});

const call = (method, path, body) =>
  fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OWNER_TOKEN}` },
    body: JSON.stringify(body),
  });
const lastWrite = () => writes[writes.length - 1];

test('resolvePublishedAt only stamps creation-as-published and transitions into published', () => {
  const now = new Date('2026-10-22T12:00:00.000Z');
  const stamp = now.toISOString();
  assert.strictEqual(resolvePublishedAt(null, 'published', now), stamp);
  assert.strictEqual(resolvePublishedAt(null, 'draft', now), undefined);
  assert.strictEqual(resolvePublishedAt(null, undefined, now), undefined);
  assert.strictEqual(
    resolvePublishedAt({ status: 'draft', published_at: null }, 'published', now),
    stamp
  );
  assert.strictEqual(
    resolvePublishedAt(
      { status: 'archived', published_at: EXISTING_PUBLISHED_AT },
      'published',
      now
    ),
    stamp
  );
  assert.strictEqual(
    resolvePublishedAt(
      { status: 'published', published_at: EXISTING_PUBLISHED_AT },
      'published',
      now
    ),
    undefined
  );
  assert.strictEqual(
    resolvePublishedAt({ status: 'published', published_at: null }, 'published', now),
    stamp,
    'a published row missing its date is repaired'
  );
  assert.strictEqual(
    resolvePublishedAt(
      { status: 'published', published_at: EXISTING_PUBLISHED_AT },
      undefined,
      now
    ),
    undefined
  );
});

for (const [resource, table] of [
  ['work', 'case_studies'],
  ['thinking', 'thinking_articles'],
]) {
  test(`${resource}: editing an already-published item preserves published_at`, async () => {
    const res = await call('PUT', `/api/admin/${resource}/${IDS.published}`, {
      title: 'Edited title',
      status: 'published',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(lastWrite().table, table);
    assert.ok(!('published_at' in lastWrite().body), 'update must not rewrite published_at');
    assert.strictEqual((await res.json()).data.published_at, EXISTING_PUBLISHED_AT);
  });

  test(`${resource}: a status-less normal save never touches status or published_at`, async () => {
    const res = await call('PUT', `/api/admin/${resource}/${IDS.published}`, {
      title: 'Normal save',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(!('status' in lastWrite().body));
    assert.ok(!('published_at' in lastWrite().body));
  });

  test(`${resource}: draft-to-published and archived-to-published transitions stamp published_at`, async () => {
    for (const id of [IDS.draft, IDS.archivedWithDate]) {
      const before = Date.now();
      const res = await call('PUT', `/api/admin/${resource}/${id}`, { status: 'published' });
      assert.strictEqual(res.status, 200);
      const stamped = Date.parse(lastWrite().body.published_at);
      assert.ok(stamped >= before - 1000 && stamped <= Date.now() + 1000, 'stamped with now');
    }
  });

  test(`${resource}: creating directly as published sets published_at; drafts do not`, async () => {
    const base =
      resource === 'work'
        ? {
            title: 'New case study',
            summary: 'A sufficiently long summary.',
            type: 'shipped_project',
          }
        : {
            title: 'New article',
            excerpt: 'A sufficiently long excerpt.',
            type: 'essay',
            body: 'Body',
          };

    const published = await call('POST', `/api/admin/${resource}`, {
      ...base,
      status: 'published',
    });
    assert.strictEqual(published.status, 201);
    assert.ok(Date.parse(lastWrite().body.published_at) > 0);

    const draft = await call('POST', `/api/admin/${resource}`, { ...base, status: 'draft' });
    assert.strictEqual(draft.status, 201);
    assert.ok(!('published_at' in lastWrite().body));
  });

  test(`${resource}: publishing a missing id returns 404 without writing`, async () => {
    const count = writes.length;
    const res = await call('PUT', `/api/admin/${resource}/44444444-4444-4444-8444-444444444444`, {
      status: 'published',
    });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(writes.length, count);
  });
}
