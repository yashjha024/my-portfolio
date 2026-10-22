import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';

/**
 * Public sitemap and RSS feed.
 * - Only content the public API shows: published case studies and articles, and PRDs that are
 *   published AND public (the same contract as the public list endpoints and RLS policies).
 * - All links are absolute on SITE_URL.
 * - Dates come only from stored timestamps; nothing is stamped with "now".
 * - If any source cannot be read the feed returns 503 instead of silently dropping URLs.
 */

const SITE_DESCRIPTION =
  'Product Professional & AI/ML Engineer Portfolio featuring production LMS workflows, industrial commerce journeys, and CVPR AI research pipelines.';
const SITE_TITLE = 'Yash Jha — Product Professional & AI/ML Engineer Portfolio';
const RSS_ITEM_LIMIT = 50;
const FEED_CACHE_CONTROL = 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600';

const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/work', changefreq: 'weekly', priority: '0.9' },
  { path: '/thinking', changefreq: 'weekly', priority: '0.9' },
  { path: '/prds', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/resume', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
];

// XML 1.0 forbids most control characters even when escaped
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

export const escapeXml = (value) =>
  String(value ?? '')
    .replace(INVALID_XML_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** A stored timestamp as a Date, or null when missing or unparseable. */
export const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const absolute = (path) => `${env.SITE_URL}${path}`;
const detailUrl = (section, slug) => absolute(`/${section}/${encodeURIComponent(slug)}`);

export class FeedSourceError extends Error {}

/** Read every publicly indexable item; throws FeedSourceError if a source fails. */
export const loadPublicContent = async () => {
  const [caseStudies, articles, prds] = await Promise.all([
    supabase
      .from('case_studies')
      .select('slug, title, summary, domain, featured, published_at, updated_at')
      .eq('status', 'published'),
    supabase
      .from('thinking_articles')
      .select('slug, title, excerpt, published_at, updated_at')
      .eq('status', 'published'),
    supabase
      .from('prds')
      .select('slug, title, context, updated_at')
      .eq('status', 'published')
      .eq('visibility', 'public'),
  ]);

  const failed = [
    ['case_studies', caseStudies],
    ['thinking_articles', articles],
    ['prds', prds],
  ].filter(([, result]) => result.error);
  if (failed.length > 0) {
    throw new FeedSourceError(
      `Feed sources unavailable: ${failed.map(([name, r]) => `${name} (${r.error.message})`).join(', ')}`
    );
  }

  const withSlug = (rows) => (rows || []).filter((row) => typeof row.slug === 'string' && row.slug);
  return {
    caseStudies: withSlug(caseStudies.data),
    articles: withSlug(articles.data),
    prds: withSlug(prds.data),
  };
};

const sendFeedError = (res, next, error) => {
  if (error instanceof FeedSourceError) {
    console.error('[SEO]', error.message);
    res.set('Retry-After', '300');
    return res.status(503).type('text/plain').send('Feed temporarily unavailable.');
  }
  return next(error);
};

export const buildSitemapXml = ({ caseStudies, articles, prds }) => {
  const entries = STATIC_ROUTES.map((route) => ({
    loc: absolute(route.path === '/' ? '/' : route.path),
    changefreq: route.changefreq,
    priority: route.priority,
    lastmod: null,
  }));

  const addDetail = (section, rows, priorityFor) => {
    for (const row of rows) {
      const lastmod = validDate(row.updated_at) || validDate(row.published_at);
      entries.push({
        loc: detailUrl(section, row.slug),
        changefreq: 'monthly',
        priority: priorityFor(row),
        lastmod: lastmod ? lastmod.toISOString().slice(0, 10) : null,
      });
    }
  };
  addDetail('work', caseStudies, (row) => (row.featured ? '0.9' : '0.8'));
  addDetail('thinking', articles, () => '0.8');
  addDetail('prds', prds, () => '0.7');

  const seen = new Set();
  const urls = entries
    .filter((entry) => !seen.has(entry.loc) && seen.add(entry.loc))
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n` +
        (entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : '') +
        `    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    );

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls.join('\n')}\n` +
    '</urlset>\n'
  );
};

export const buildRssXml = ({ caseStudies, articles, prds }) => {
  const items = [
    ...caseStudies.map((row) => ({
      title: row.title,
      link: detailUrl('work', row.slug),
      category: row.domain || 'Case Study',
      description: row.summary || '',
      // Only a real publication timestamp; drafts published before published_at existed get none
      pubDate: validDate(row.published_at),
    })),
    ...articles.map((row) => ({
      title: row.title,
      link: detailUrl('thinking', row.slug),
      category: 'Product Thinking & Strategy',
      description: row.excerpt || '',
      pubDate: validDate(row.published_at),
    })),
    // PRDs have no publication timestamp column, so their items carry no pubDate
    ...prds.map((row) => ({
      title: row.title,
      link: detailUrl('prds', row.slug),
      category: 'Product Requirements Document',
      description: (row.context || '').slice(0, 250),
      pubDate: null,
    })),
  ]
    .sort((a, b) => (b.pubDate?.getTime() ?? -Infinity) - (a.pubDate?.getTime() ?? -Infinity))
    .slice(0, RSS_ITEM_LIMIT);

  const newest = items.find((item) => item.pubDate)?.pubDate;
  const itemXml = items.map(
    (item) =>
      '    <item>\n' +
      `      <title>${escapeXml(item.title || 'Untitled')}</title>\n` +
      `      <link>${escapeXml(item.link)}</link>\n` +
      `      <guid isPermaLink="true">${escapeXml(item.link)}</guid>\n` +
      (item.pubDate ? `      <pubDate>${item.pubDate.toUTCString()}</pubDate>\n` : '') +
      `      <category>${escapeXml(item.category)}</category>\n` +
      `      <description>${escapeXml(item.description)}</description>\n` +
      '    </item>'
  );

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    '  <channel>\n' +
    `    <title>${escapeXml(SITE_TITLE)}</title>\n` +
    `    <link>${escapeXml(absolute('/'))}</link>\n` +
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>\n` +
    '    <language>en-us</language>\n' +
    (newest ? `    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>\n` : '') +
    `    <atom:link href="${escapeXml(absolute('/rss.xml'))}" rel="self" type="application/rss+xml"/>\n` +
    (itemXml.length ? `${itemXml.join('\n')}\n` : '') +
    '  </channel>\n' +
    '</rss>\n'
  );
};

/** Dynamic XML sitemap of public content. */
export const getDynamicSitemap = async (req, res, next) => {
  try {
    const xml = buildSitemapXml(await loadPublicContent());
    res.set('Cache-Control', FEED_CACHE_CONTROL);
    res.type('application/xml; charset=utf-8').status(200).send(xml);
  } catch (error) {
    sendFeedError(res, next, error);
  }
};

/** RSS 2.0 feed of public case studies, articles and PRDs. */
export const getDynamicRssFeed = async (req, res, next) => {
  try {
    const xml = buildRssXml(await loadPublicContent());
    res.set('Cache-Control', FEED_CACHE_CONTROL);
    res.type('application/rss+xml; charset=utf-8').status(200).send(xml);
  } catch (error) {
    sendFeedError(res, next, error);
  }
};
