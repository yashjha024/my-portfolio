/**
 * Pure SEO helpers shared by the SEO component, the Vite build plugin and tests.
 * Nothing here reads `import.meta.env` or the DOM; callers pass the resolved site URL.
 */

// Verified live hostname. Override with VITE_SITE_URL (client) / SITE_URL (server) once a custom
// domain is confirmed; both must point at the same origin.
export const DEFAULT_SITE_URL = 'https://yashjha.vercel.app';

export const SITE_NAME = 'Yash Jha';
export const SITE_TITLE = 'Yash Jha — Product Professional & AI/ML Engineer Portfolio';
export const SITE_DESCRIPTION =
  'Product Professional & AI/ML Engineer Portfolio featuring production LMS workflows at Istockly, industrial commerce journeys at Diptech Technologies, and CVPR AI research pipelines.';
export const DEFAULT_KEYWORDS =
  'Product Professional, AI/ML Engineer, BIT Mesra, Workflow Design, LMS, Industrial Commerce, CVPR Research, LangChain, RAG, Python, MERN Stack';

export const DEFAULT_OG_IMAGE = {
  path: '/og-default.png',
  width: 1200,
  height: 630,
  alt: 'Yash Jha — Product Professional & AI/ML Engineer portfolio',
};
export const BRAND_ICON_PATH = '/icon-512.png';
export const SAME_AS = ['https://linkedin.com/in/yashjha024', 'https://github.com/yashjha024'];

const INDEXABLE_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, nofollow';

/** Any URL-ish input -> `https://host[:port]` with no trailing slash; invalid input -> fallback. */
export const normalizeSiteUrl = (value, fallback = DEFAULT_SITE_URL) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
};

/** Pathname -> canonical path: no query/hash, no trailing slash (except the root). */
export const canonicalPath = (pathname = '/') => {
  const clean = String(pathname || '/').split(/[?#]/)[0] || '/';
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') || '/' : '/';
};

/** Absolute URL on the canonical site for relative paths; absolute http(s) URLs pass through. */
export const absoluteUrl = (siteUrl, pathOrUrl) => {
  if (!pathOrUrl) return null;
  const value = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
};

/** Page title with a single brand suffix; titles that already name the brand are left alone. */
export const formatTitle = (title) => {
  const clean = typeof title === 'string' ? title.trim() : '';
  if (!clean) return SITE_TITLE;
  if (clean.toLowerCase().includes(SITE_NAME.toLowerCase())) return clean;
  return `${clean} | ${SITE_NAME}`;
};

/**
 * Real timestamps only. Accepts Date objects and ISO-8601 date strings (YYYY-MM-DD...);
 * free-form labels such as "Q3 2025 - 4 Months" or bare years return null instead of a guess.
 */
export const toIsoDate = (value) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value.trim())) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const PRIVATE_PATH = /^\/(admin|login|auth)(\/|$)/;

/** Admin console and login/auth flows (pages that render no public <SEO>). */
export const isPrivatePath = (pathname = '/') => PRIVATE_PATH.test(canonicalPath(pathname));

/** Routes that must never be indexed: private paths and draft previews of public pages. */
export const isNoIndexRoute = (pathname = '/', search = '') =>
  isPrivatePath(pathname) || new URLSearchParams(search || '').has('preview_token');

const ARTICLE_TYPES = new Set(['article', 'case_study', 'prd']);

/**
 * Compute the complete set of document metadata for a page. The result is declarative: anything
 * not listed must be removed from the document (see applySeoToDocument).
 *
 * @returns {{ title: string, canonical: string|null, metas: Array<{attr: 'name'|'property', key: string, content: string}>, jsonLd: Array<{id: string, data: object}> }}
 */
export const buildSeoTags = ({
  siteUrl = DEFAULT_SITE_URL,
  pathname = '/',
  search = '',
  title,
  description,
  keywords,
  image,
  imageAlt,
  type = 'website',
  author = SITE_NAME,
  publishedTime,
  modifiedTime,
  breadcrumbs = null,
  structuredData = null,
  noindex = false,
} = {}) => {
  const site = normalizeSiteUrl(siteUrl);
  const finalTitle = formatTitle(title);
  const finalDescription =
    (typeof description === 'string' && description.trim()) || SITE_DESCRIPTION;
  const pageUrl = `${site}${canonicalPath(pathname)}`;
  const robotsNoindex = noindex || isNoIndexRoute(pathname, search);

  const customImage = absoluteUrl(site, image);
  const ogImage = customImage || absoluteUrl(site, DEFAULT_OG_IMAGE.path);
  const ogImageAlt =
    (customImage ? imageAlt : null) || (customImage ? finalTitle : DEFAULT_OG_IMAGE.alt);
  const isArticle = ARTICLE_TYPES.has(type);
  const published = toIsoDate(publishedTime);
  const modified = toIsoDate(modifiedTime);

  const metas = [
    { attr: 'name', key: 'description', content: finalDescription },
    { attr: 'name', key: 'keywords', content: keywords || DEFAULT_KEYWORDS },
    { attr: 'name', key: 'author', content: author },
    { attr: 'name', key: 'robots', content: robotsNoindex ? NOINDEX_ROBOTS : INDEXABLE_ROBOTS },
    { attr: 'property', key: 'og:site_name', content: SITE_NAME },
    { attr: 'property', key: 'og:locale', content: 'en_US' },
    { attr: 'property', key: 'og:type', content: isArticle ? 'article' : 'website' },
    { attr: 'property', key: 'og:title', content: finalTitle },
    { attr: 'property', key: 'og:description', content: finalDescription },
    { attr: 'property', key: 'og:url', content: pageUrl },
    { attr: 'property', key: 'og:image', content: ogImage },
    { attr: 'property', key: 'og:image:alt', content: ogImageAlt },
    { attr: 'name', key: 'twitter:card', content: 'summary_large_image' },
    { attr: 'name', key: 'twitter:title', content: finalTitle },
    { attr: 'name', key: 'twitter:description', content: finalDescription },
    { attr: 'name', key: 'twitter:image', content: ogImage },
    { attr: 'name', key: 'twitter:image:alt', content: ogImageAlt },
  ];
  if (!customImage) {
    metas.push(
      { attr: 'property', key: 'og:image:width', content: String(DEFAULT_OG_IMAGE.width) },
      { attr: 'property', key: 'og:image:height', content: String(DEFAULT_OG_IMAGE.height) }
    );
  }
  if (isArticle && published) {
    metas.push({ attr: 'property', key: 'article:published_time', content: published });
  }
  if (isArticle && modified) {
    metas.push({ attr: 'property', key: 'article:modified_time', content: modified });
  }

  const person = {
    '@type': 'Person',
    '@id': `${site}/#person`,
    name: SITE_NAME,
    jobTitle: 'Product Professional & AI/ML Engineer',
    url: `${site}/`,
    sameAs: SAME_AS,
  };

  let primary;
  if (structuredData) {
    primary = structuredData;
  } else if (isArticle) {
    primary = {
      '@context': 'https://schema.org',
      '@type': type === 'case_study' ? 'TechArticle' : 'Article',
      headline: (typeof title === 'string' && title.trim()) || finalTitle,
      description: finalDescription,
      image: [ogImage],
      ...(published ? { datePublished: published } : {}),
      ...(modified || published ? { dateModified: modified || published } : {}),
      author: person,
      publisher: {
        '@type': 'Person',
        '@id': `${site}/#person`,
        name: SITE_NAME,
        image: absoluteUrl(site, BRAND_ICON_PATH),
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
      url: pageUrl,
    };
  } else {
    primary = {
      '@context': 'https://schema.org',
      '@graph': [
        person,
        {
          '@type': 'WebSite',
          '@id': `${site}/#website`,
          url: `${site}/`,
          name: SITE_TITLE,
          description: SITE_DESCRIPTION,
          publisher: { '@id': `${site}/#person` },
        },
      ],
    };
  }

  const jsonLd = robotsNoindex ? [] : [{ id: 'structured-data-jsonld', data: primary }];
  if (!robotsNoindex && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    jsonLd.push({
      id: 'breadcrumb-jsonld',
      data: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: absoluteUrl(site, item.url || '/'),
        })),
      },
    });
  }

  return {
    title: finalTitle,
    // Private and preview pages get no canonical: they must not be consolidated into public URLs
    canonical: robotsNoindex ? null : pageUrl,
    metas: robotsNoindex
      ? metas.filter(
          (m) =>
            !m.key.startsWith('og:') &&
            !m.key.startsWith('twitter:') &&
            !m.key.startsWith('article:')
        )
      : metas,
    jsonLd,
  };
};

/** robots.txt for the canonical site (emitted by the Vite build). */
export const buildRobotsTxt = (siteUrl) => {
  const site = normalizeSiteUrl(siteUrl);
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /login',
    'Disallow: /auth/',
    'Disallow: /api/',
    '',
    `Sitemap: ${site}/sitemap.xml`,
    '',
  ].join('\n');
};
