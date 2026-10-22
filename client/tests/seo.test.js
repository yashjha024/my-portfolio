import test from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_SITE_URL,
  SITE_TITLE,
  absoluteUrl,
  buildRobotsTxt,
  buildSeoTags,
  canonicalPath,
  formatTitle,
  isNoIndexRoute,
  normalizeSiteUrl,
  toIsoDate,
} from '../src/utils/seo.js';

const SITE = 'https://yashjha.vercel.app';
const meta = (tags, key) => tags.metas.find((m) => m.key === key)?.content;

test('site URL normalization yields a bare origin and safe default', () => {
  assert.strictEqual(DEFAULT_SITE_URL, SITE);
  assert.strictEqual(normalizeSiteUrl(undefined), SITE);
  assert.strictEqual(normalizeSiteUrl(''), SITE);
  assert.strictEqual(normalizeSiteUrl('https://Example.com/'), 'https://example.com');
  assert.strictEqual(normalizeSiteUrl('https://example.com/some/path?x=1'), 'https://example.com');
  assert.strictEqual(normalizeSiteUrl('not a url'), SITE);
  assert.strictEqual(normalizeSiteUrl('ftp://example.com'), SITE);
});

test('canonical paths drop query, hash and trailing slashes', () => {
  assert.strictEqual(canonicalPath('/'), '/');
  assert.strictEqual(canonicalPath(''), '/');
  assert.strictEqual(canonicalPath('/work/'), '/work');
  assert.strictEqual(canonicalPath('/work/slug?preview_token=abc#top'), '/work/slug');
  assert.strictEqual(absoluteUrl(SITE, '/og.png'), `${SITE}/og.png`);
  assert.strictEqual(absoluteUrl(SITE, 'og.png'), `${SITE}/og.png`);
  assert.strictEqual(absoluteUrl(SITE, 'https://cdn.example/x.png'), 'https://cdn.example/x.png');
  assert.strictEqual(absoluteUrl(SITE, '//cdn.example/x.png'), 'https://cdn.example/x.png');
  assert.strictEqual(absoluteUrl(SITE, null), null);
});

test('titles carry exactly one brand suffix', () => {
  assert.strictEqual(formatTitle(undefined), SITE_TITLE);
  assert.strictEqual(formatTitle('Case Studies'), 'Case Studies | Yash Jha');
  // The homepage passes a title that already names the brand
  const home = formatTitle('Yash Jha | Product & AI/ML Engineering Portfolio');
  assert.strictEqual(home, 'Yash Jha | Product & AI/ML Engineering Portfolio');
  assert.strictEqual(home.match(/Yash Jha/g).length, 1);
  assert.strictEqual(
    buildSeoTags({ title: 'Yash Jha | Portfolio' }).title.match(/Yash Jha/g).length,
    1
  );
});

test('only real ISO timestamps are accepted as dates', () => {
  assert.strictEqual(toIsoDate('2026-03-01T10:00:00Z'), '2026-03-01T10:00:00.000Z');
  assert.strictEqual(toIsoDate('2026-03-01'), '2026-03-01T00:00:00.000Z');
  for (const label of [
    'Q3 2025 - 4 Months',
    '2024',
    'Jan 2025',
    '',
    null,
    undefined,
    'not-a-date',
    '2026-13-45',
  ]) {
    assert.strictEqual(toIsoDate(label), null, String(label));
  }
});

test('canonical, og:url, JSON-LD and breadcrumbs agree on absolute canonical URLs', () => {
  const tags = buildSeoTags({
    siteUrl: `${SITE}/`,
    pathname: '/thinking/launch-notes/',
    search: '?utm_source=x',
    title: 'Launch notes',
    image: '/api/media/download/123_cover.png',
    type: 'article',
    publishedTime: '2026-05-05T08:30:00Z',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Thinking', url: '/thinking' },
    ],
  });
  const url = `${SITE}/thinking/launch-notes`;
  assert.strictEqual(tags.canonical, url);
  assert.strictEqual(meta(tags, 'og:url'), url);
  assert.strictEqual(meta(tags, 'og:type'), 'article');
  assert.strictEqual(meta(tags, 'og:image'), `${SITE}/api/media/download/123_cover.png`);
  assert.strictEqual(meta(tags, 'twitter:image'), meta(tags, 'og:image'));

  const article = tags.jsonLd.find((j) => j.id === 'structured-data-jsonld').data;
  assert.strictEqual(article.mainEntityOfPage['@id'], url);
  assert.strictEqual(article.url, url);
  assert.strictEqual(article.author.url, `${SITE}/`);
  assert.strictEqual(article.datePublished, '2026-05-05T08:30:00.000Z');
  const crumbs = tags.jsonLd.find((j) => j.id === 'breadcrumb-jsonld').data.itemListElement;
  assert.deepStrictEqual(
    crumbs.map((c) => c.item),
    [`${SITE}/`, `${SITE}/thinking`]
  );

  // Every URL-valued field is absolute on the canonical origin (or an absolute external URL)
  const json = JSON.stringify(tags);
  assert.ok(!/"\/(?!\/)/.test(json.replace(/"@[a-z]+"/gi, '')), 'no relative URLs');
  assert.ok(!/yashjha024\.com|yashjhai\.com/.test(json), 'no stale domains');
});

test('no invented publication dates and correct defaults for social sharing', () => {
  const tags = buildSeoTags({
    pathname: '/work/a',
    title: 'Case',
    type: 'case_study',
    publishedTime: 'Q3 2025 - 4 Months',
  });
  assert.strictEqual(meta(tags, 'article:published_time'), undefined);
  const article = tags.jsonLd[0].data;
  assert.ok(!('datePublished' in article));
  assert.ok(!('dateModified' in article));
  assert.strictEqual(article['@type'], 'TechArticle');

  assert.strictEqual(meta(tags, 'og:image'), `${SITE}/og-default.png`);
  assert.strictEqual(meta(tags, 'og:image:width'), '1200');
  assert.strictEqual(meta(tags, 'og:image:height'), '630');
  assert.strictEqual(meta(tags, 'twitter:card'), 'summary_large_image');
  assert.ok(!JSON.stringify(tags).includes('unsplash'), 'no stock default image');

  const website = buildSeoTags({ pathname: '/', type: 'website' });
  assert.strictEqual(meta(website, 'og:type'), 'website');
  assert.strictEqual(meta(website, 'article:published_time'), undefined);
});

test('admin, login, auth and preview routes are noindex without canonical or social tags', () => {
  for (const [pathname, search] of [
    ['/admin', ''],
    ['/admin/work/edit/1', ''],
    ['/login', ''],
    ['/auth/callback', '?code=x'],
    ['/work/draft-case', '?preview_token=abc'],
  ]) {
    assert.strictEqual(isNoIndexRoute(pathname, search), true, pathname);
    const tags = buildSeoTags({ pathname, search, title: 'x' });
    assert.strictEqual(meta(tags, 'robots'), 'noindex, nofollow', pathname);
    assert.strictEqual(tags.canonical, null);
    assert.ok(!tags.metas.some((m) => m.key.startsWith('og:') || m.key.startsWith('twitter:')));
    assert.deepStrictEqual(tags.jsonLd, []);
  }
  for (const pathname of ['/', '/work', '/administer-not-admin', '/thinking/login-flow']) {
    assert.strictEqual(isNoIndexRoute(pathname, ''), false, pathname);
  }
  assert.strictEqual(
    meta(buildSeoTags({ pathname: '/404', noindex: true }), 'robots'),
    'noindex, nofollow'
  );
  assert.match(meta(buildSeoTags({ pathname: '/' }), 'robots'), /^index, follow/);
});

test('robots.txt references the canonical sitemap and blocks only private areas', () => {
  const robots = buildRobotsTxt('https://example.test/');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Sitemap: https:\/\/example\.test\/sitemap\.xml$/m);
  for (const rule of [
    'Disallow: /admin',
    'Disallow: /login',
    'Disallow: /auth/',
    'Disallow: /api/',
  ]) {
    assert.ok(robots.split('\n').includes(rule), rule);
  }
  for (const publicPath of ['/work', '/thinking', '/prds', '/sitemap.xml', '/rss.xml']) {
    assert.ok(!robots.split('\n').some((line) => line === `Disallow: ${publicPath}`), publicPath);
  }
  assert.match(buildRobotsTxt(undefined), /Sitemap: https:\/\/yashjha\.vercel\.app\/sitemap\.xml/);
});
