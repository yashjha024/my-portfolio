import { supabase } from '../config/supabase.js';

const BASE_URL = process.env.CLIENT_URL || 'https://portfolio.yashjha024.com';

/**
 * Generate Dynamic XML Sitemap based on active Case Studies, Thinking Articles, and PRDs.
 */
export const getDynamicSitemap = async (req, res, next) => {
  try {
    const [csRes, thRes, prdRes] = await Promise.all([
      supabase
        .from('case_studies')
        .select('slug, updated_at, status, featured')
        .eq('status', 'published'),
      supabase
        .from('thinking_articles')
        .select('slug, updated_at, status')
        .eq('status', 'published'),
      supabase
        .from('prds')
        .select('slug, updated_at, status, visibility')
        .eq('status', 'published')
        .eq('visibility', 'public'),
    ]);

    const caseStudies = csRes.data || [];
    const thinkingArticles = thRes.data || [];
    const prdDocs = prdRes.data || [];

    const now = new Date().toISOString().split('T')[0];

    const staticRoutes = [
      { loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '1.0', lastmod: now },
      { loc: `${BASE_URL}/work`, changefreq: 'weekly', priority: '0.9', lastmod: now },
      { loc: `${BASE_URL}/thinking`, changefreq: 'weekly', priority: '0.9', lastmod: now },
      { loc: `${BASE_URL}/prds`, changefreq: 'weekly', priority: '0.8', lastmod: now },
      { loc: `${BASE_URL}/about`, changefreq: 'monthly', priority: '0.8', lastmod: now },
      { loc: `${BASE_URL}/resume`, changefreq: 'monthly', priority: '0.8', lastmod: now },
      { loc: `${BASE_URL}/contact`, changefreq: 'monthly', priority: '0.8', lastmod: now },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

    // Add static routes
    staticRoutes.forEach((r) => {
      xml += `  <url>
    <loc>${r.loc}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>\n`;
    });

    // Add case study routes
    caseStudies.forEach((cs) => {
      xml += `  <url>
    <loc>${BASE_URL}/work/${cs.slug}</loc>
    <lastmod>${(cs.updated_at || now).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${cs.featured ? '0.9' : '0.8'}</priority>
  </url>\n`;
    });

    // Add thinking article routes
    thinkingArticles.forEach((art) => {
      xml += `  <url>
    <loc>${BASE_URL}/thinking/${art.slug}</loc>
    <lastmod>${(art.updated_at || now).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    // Add PRD routes
    prdDocs.forEach((prd) => {
      xml += `  <url>
    <loc>${BASE_URL}/prds/${prd.slug}</loc>
    <lastmod>${(prd.updated_at || now).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Dynamic RSS Feed based on active Case Studies, Thinking Articles, and PRDs per PRD Section 6
 */
export const getDynamicRssFeed = async (req, res, next) => {
  try {
    const [csRes, thRes, prdRes] = await Promise.all([
      supabase
        .from('case_studies')
        .select('title, slug, summary, updated_at, created_at, domain, cover_image')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('thinking_articles')
        .select('title, slug, excerpt, updated_at, created_at, cover_image')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('prds')
        .select('title, slug, context, updated_at, created_at, visibility')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const caseStudies = (csRes.data || []).map((item) => ({
      ...item,
      url: `${BASE_URL}/work/${item.slug}`,
      category: item.domain || 'Case Study',
      pubDate: new Date(item.created_at || item.updated_at || Date.now()).toUTCString(),
      description: item.summary || 'Deep-dive product management case study & strategy.',
    }));

    const thinkingArticles = (thRes.data || []).map((item) => ({
      ...item,
      url: `${BASE_URL}/thinking/${item.slug}`,
      category: 'Product Thinking & Strategy',
      pubDate: new Date(item.created_at || item.updated_at || Date.now()).toUTCString(),
      description: item.excerpt || 'Product leadership, frameworks, and architectural decisions.',
    }));

    const prdSpecs = (prdRes.data || []).map((item) => ({
      ...item,
      url: `${BASE_URL}/prds/${item.slug}`,
      category: 'Technical PRD Specification',
      pubDate: new Date(item.created_at || item.updated_at || Date.now()).toUTCString(),
      description: item.context?.substring(0, 250) || 'Detailed product requirements document.',
    }));

    // Merge and sort all items chronologically by date
    const allItems = [...caseStudies, ...thinkingArticles, ...prdSpecs].sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Yash Jha — Product Professional & Strategic Architecture Portfolio</title>
    <link>${BASE_URL}</link>
    <description>Product Professional & AI/ML Engineer Portfolio featuring production LMS workflows, industrial commerce journeys, and CVPR AI research pipelines.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>\n`;

    allItems.forEach((item) => {
      const cleanDesc = (item.description || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      const cleanTitle = (item.title || 'Untitled')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      rss += `    <item>
      <title>${cleanTitle}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <category>${item.category}</category>
      <description>${cleanDesc}</description>
    </item>\n`;
    });

    rss += `  </channel>
</rss>`;

    res.header('Content-Type', 'application/rss+xml');
    res.status(200).send(rss);
  } catch (error) {
    next(error);
  }
};
