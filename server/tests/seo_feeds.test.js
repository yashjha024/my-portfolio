import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// ---------------------------------------------------------------------------
// Local Supabase stub applying PostgREST `eq` filters, so publication rules are exercised for real.
// ---------------------------------------------------------------------------
const SITE = 'https://portfolio-canonical.example.test';
const tables = {
  case_studies: [
    {
      slug: 'live-case-study',
      title: 'Pricing & <Packaging> "Revamp"',
      summary: 'Summary with <b>markup</b> & ampersands',
      domain: 'Fintech & Payments',
      featured: true,
      status: 'published',
      published_at: '2026-03-01T10:00:00.000Z',
      updated_at: '2026-04-02T12:00:00.000Z',
    },
    {
      slug: 'legacy-published-no-date',
      title: 'Legacy case study',
      summary: 'Published before published_at existed',
      domain: null,
      featured: false,
      status: 'published',
      published_at: null,
      updated_at: null,
    },
    {
      slug: 'secret-draft',
      title: 'Draft',
      summary: 'x',
      status: 'draft',
      published_at: null,
      updated_at: null,
    },
    {
      slug: 'old-archived',
      title: 'Archived',
      summary: 'x',
      status: 'archived',
      published_at: '2025-01-01T00:00:00Z',
      updated_at: null,
    },
  ],
  thinking_articles: [
    {
      slug: 'live-article',
      title: "Product teardown: what's next",
      excerpt: 'Control\u0001chars are stripped',
      status: 'published',
      published_at: '2026-05-05T08:30:00.000Z',
      updated_at: 'not-a-date',
    },
    {
      slug: 'draft-article',
      title: 'Draft article',
      excerpt: 'x',
      status: 'draft',
      published_at: null,
      updated_at: null,
    },
  ],
  prds: [
    {
      slug: 'public-prd',
      title: 'Public PRD',
      context: 'C'.repeat(400),
      status: 'published',
      visibility: 'public',
      updated_at: '2026-06-01T00:00:00.000Z',
    },
    {
      slug: 'unlisted-prd',
      title: 'Unlisted',
      context: 'x',
      status: 'published',
      visibility: 'unlisted',
      updated_at: null,
    },
    {
      slug: 'private-prd',
      title: 'Private',
      context: 'x',
      status: 'published',
      visibility: 'private',
      updated_at: null,
    },
    {
      slug: 'draft-public-prd',
      title: 'Draft',
      context: 'x',
      status: 'draft',
      visibility: 'public',
      updated_at: null,
    },
  ],
};
const faults = { failTable: null };

const stub = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://stub');
  const table = url.pathname.replace('/rest/v1/', '');
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  if (faults.failTable === table)
    return send(500, { code: 'XX000', message: 'database unavailable' });
  if (!tables[table]) return send(404, { code: 'PGRST205', message: 'unknown table' });
  const rows = tables[table].filter((row) =>
    [...url.searchParams.entries()].every(([key, value]) =>
      value.startsWith('eq.') ? String(row[key]) === value.slice(3) : true
    )
  );
  return send(200, rows);
});
await new Promise((resolve) => stub.listen(0, '127.0.0.1', resolve));

Object.assign(process.env, {
  NODE_ENV: 'test',
  CLIENT_URL: 'https://portfolio.example.test',
  SITE_URL: `${SITE}/`, // trailing slash must be normalized away
  JWT_SECRET: 'test-only-preview-secret-0123456789abcdef',
  SUPABASE_URL: `http://127.0.0.1:${stub.address().port}`,
  SUPABASE_SERVICE_ROLE_KEY: 'stub-service-role-key',
  OWNER_EMAIL: 'owner@example.test',
  RESEND_API_KEY: '',
});

const { default: app } = await import('../src/app.js');
const { validateEnv } = await import('../src/config/env.js');
const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const API = `http://127.0.0.1:${server.address().port}`;
test.after(() => {
  server.close();
  stub.close();
});
test.afterEach(() => {
  faults.failTable = null;
});

// ---------------------------------------------------------------------------
// Minimal XML well-formedness check (tags balance, attributes quoted, only known entities)
// ---------------------------------------------------------------------------
const assertWellFormedXml = (xml) => {
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'XML declaration first');
  const body = xml.replace(/^<\?xml[^?]*\?>/, '');
  assert.ok(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(xml), 'no invalid control characters');
  const stack = [];
  const tokens = body.match(/<[^>]*>|[^<]+/g) || [];
  for (const token of tokens) {
    if (!token.startsWith('<')) {
      const bad = token.replace(/&(amp|lt|gt|quot|apos);/g, '');
      assert.ok(!bad.includes('&'), `unescaped & in text: ${token.slice(0, 60)}`);
      assert.ok(!bad.includes('>'), `unescaped > in text: ${token.slice(0, 60)}`);
      continue;
    }
    const tag = token.match(/^<(\/?)([A-Za-z_][\w:.-]*)([^>]*?)(\/?)>$/);
    assert.ok(tag, `malformed tag: ${token}`);
    const [, closing, name, attrs, selfClosing] = tag;
    const attrText = attrs.replace(
      /\s+[\w:.-]+="[^"<&]*(?:&(?:amp|lt|gt|quot|apos);[^"<&]*)*"/g,
      ''
    );
    assert.strictEqual(attrText.trim(), '', `bad attributes in ${token}`);
    if (closing) assert.strictEqual(stack.pop(), name, `mismatched </${name}>`);
    else if (!selfClosing) stack.push(name);
  }
  assert.deepStrictEqual(stack, [], 'all elements closed');
};

const get = async (path) => {
  const res = await fetch(`${API}${path}`);
  return {
    status: res.status,
    type: res.headers.get('content-type'),
    cache: res.headers.get('cache-control'),
    body: await res.text(),
  };
};

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------
for (const path of ['/sitemap.xml', '/api/seo/sitemap.xml']) {
  test(`${path}: valid XML, correct type and public cache headers`, async () => {
    const { status, type, cache, body } = await get(path);
    assert.strictEqual(status, 200);
    assert.match(type, /^application\/xml; charset=utf-8/);
    assert.match(cache, /public/);
    assertWellFormedXml(body);
  });
}

test('sitemap lists only public content with canonical absolute URLs', async () => {
  const { body } = await get('/sitemap.xml');
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) assert.ok(loc.startsWith(`${SITE}/`), `canonical origin: ${loc}`);
  assert.ok(!locs.some((loc) => loc.includes('//', 'https://'.length)), 'no double slashes');

  for (const expected of [
    '/',
    '/work',
    '/work/live-case-study',
    '/work/legacy-published-no-date',
    '/thinking/live-article',
    '/prds/public-prd',
  ]) {
    assert.ok(locs.includes(`${SITE}${expected}`), `includes ${expected}`);
  }
  for (const excluded of [
    'secret-draft',
    'old-archived',
    'draft-article',
    'unlisted-prd',
    'private-prd',
    'draft-public-prd',
  ]) {
    assert.ok(!body.includes(excluded), `excludes ${excluded}`);
  }
  // The old static sitemap's mock slugs must never appear
  for (const mock of ['kubernetes-cost-governance-platform', 'enterprise-api-gateway-migration']) {
    assert.ok(!body.includes(mock));
  }
  assert.strictEqual(new Set(locs).size, locs.length, 'no duplicate URLs');
});

test('sitemap lastmod comes only from stored timestamps', async () => {
  const { body } = await get('/sitemap.xml');
  const today = new Date().toISOString().slice(0, 10);
  const urlBlock = (loc) =>
    body.split('<url>').find((block) => block.includes(`<loc>${SITE}${loc}</loc>`));

  assert.ok(!urlBlock('/').includes('<lastmod>'), 'static pages have no invented lastmod');
  assert.match(urlBlock('/work/live-case-study'), /<lastmod>2026-04-02<\/lastmod>/);
  assert.ok(!urlBlock('/work/legacy-published-no-date').includes('<lastmod>'));
  assert.match(
    urlBlock('/thinking/live-article'),
    /<lastmod>2026-05-05<\/lastmod>/,
    'falls back to published_at when updated_at is invalid'
  );
  assert.ok(
    !body.includes(`<lastmod>${today}</lastmod>`) || today === '2026-04-02',
    'never stamped with today'
  );
});

// ---------------------------------------------------------------------------
// RSS
// ---------------------------------------------------------------------------
for (const path of ['/rss.xml', '/api/seo/rss.xml']) {
  test(`${path}: valid RSS XML with the RSS content type`, async () => {
    const { status, type, body } = await get(path);
    assert.strictEqual(status, 200);
    assert.match(type, /^application\/rss\+xml; charset=utf-8/);
    assertWellFormedXml(body);
    assert.match(body, /<rss version="2.0"/);
  });
}

test('RSS escapes titles, categories and descriptions', async () => {
  const { body } = await get('/rss.xml');
  assert.ok(body.includes('<title>Pricing &amp; &lt;Packaging&gt; &quot;Revamp&quot;</title>'));
  assert.ok(body.includes('<category>Fintech &amp; Payments</category>'));
  assert.ok(body.includes('Summary with &lt;b&gt;markup&lt;/b&gt; &amp; ampersands'));
  assert.ok(body.includes('Product teardown: what&apos;s next'));
  assert.ok(body.includes('Controlchars are stripped'));
});

test('RSS uses canonical links and never invents publication dates', async () => {
  const { body } = await get('/rss.xml');
  const item = (slug) => body.split('<item>').find((block) => block.includes(`/${slug}</link>`));

  assert.match(body, new RegExp(`<atom:link href="${SITE}/rss.xml"`));
  assert.match(body, new RegExp(`<link>${SITE}/</link>`));
  assert.match(
    item('live-case-study'),
    new RegExp(`<guid isPermaLink="true">${SITE}/work/live-case-study</guid>`)
  );
  assert.match(item('live-case-study'), /<pubDate>Sun, 01 Mar 2026 10:00:00 GMT<\/pubDate>/);
  assert.ok(
    !item('legacy-published-no-date').includes('<pubDate>'),
    'no pubDate without published_at'
  );
  assert.ok(!item('public-prd').includes('<pubDate>'), 'PRDs have no publication timestamp');
  assert.match(
    body,
    /<lastBuildDate>Tue, 05 May 2026 08:30:00 GMT<\/lastBuildDate>/,
    'newest real pubDate'
  );

  // Dated items first, newest first
  const order = [...body.matchAll(/<link>[^<]+\/(work|thinking|prds)\/([^<]+)<\/link>/g)].map(
    (m) => m[2]
  );
  assert.deepStrictEqual(order.slice(0, 2), ['live-article', 'live-case-study']);
  for (const excluded of ['secret-draft', 'draft-article', 'unlisted-prd', 'private-prd']) {
    assert.ok(!body.includes(excluded));
  }
});

test('feeds return 503 instead of silently dropping content when a source fails', async () => {
  faults.failTable = 'thinking_articles';
  const error = console.error;
  console.error = () => {};
  try {
    for (const path of ['/sitemap.xml', '/rss.xml']) {
      const res = await fetch(`${API}${path}`);
      assert.strictEqual(res.status, 503, path);
      assert.strictEqual(res.headers.get('retry-after'), '300');
    }
  } finally {
    console.error = error;
  }
});

test('SITE_URL is validated and defaults to the verified Vercel hostname', () => {
  const base = {
    SUPABASE_URL: 'http://127.0.0.1:1',
    SUPABASE_SERVICE_ROLE_KEY: 'stub',
    OWNER_EMAIL: 'o@example.test',
  };
  assert.strictEqual(validateEnv(base).SITE_URL, 'https://yashjha.vercel.app');
  assert.strictEqual(
    validateEnv({ ...base, SITE_URL: 'https://Example.test/' }).SITE_URL,
    'https://example.test'
  );
  assert.throws(() => validateEnv({ ...base, SITE_URL: 'https://example.test/blog' }), /SITE_URL/);
  assert.throws(
    () =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        CLIENT_URL: 'https://example.test',
        JWT_SECRET: 'k'.repeat(40),
        SITE_URL: 'http://example.test',
      }),
    /SITE_URL/
  );
});
