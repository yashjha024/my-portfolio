import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_URL } from '../../config/site.js';
import { buildSeoTags, isPrivatePath } from '../../utils/seo.js';
import { applySeoToDocument } from '../../utils/seoDom.js';

/**
 * Per-page metadata manager: title, description, canonical, Open Graph, Twitter card, robots and
 * JSON-LD. Each render replaces the whole managed set, so nothing from the previous route survives.
 *
 * Note: this runs in the browser. Crawlers that do not execute JavaScript (most link-preview bots)
 * only see the static defaults in index.html.
 */
export const SEO = ({
  title,
  description,
  keywords,
  image,
  imageAlt,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  breadcrumbs = null,
  structuredData = null,
  noindex = false,
}) => {
  const { pathname, search } = useLocation();
  const breadcrumbKey = breadcrumbs ? JSON.stringify(breadcrumbs) : '';
  const structuredKey = structuredData ? JSON.stringify(structuredData) : '';

  useEffect(() => {
    applySeoToDocument(
      document,
      buildSeoTags({
        siteUrl: SITE_URL,
        pathname,
        search,
        title,
        description,
        keywords,
        image,
        imageAlt,
        type,
        author,
        publishedTime,
        modifiedTime,
        breadcrumbs: breadcrumbKey ? JSON.parse(breadcrumbKey) : null,
        structuredData: structuredKey ? JSON.parse(structuredKey) : null,
        noindex,
      })
    );
  }, [
    pathname,
    search,
    title,
    description,
    keywords,
    image,
    imageAlt,
    type,
    author,
    publishedTime,
    modifiedTime,
    breadcrumbKey,
    structuredKey,
    noindex,
  ]);

  return null;
};

/**
 * Router-level guard for pages that render no <SEO>: admin console, login and auth callback.
 * Marks them noindex and clears public metadata left by the previously visited page.
 * (Draft previews are public routes; their own <SEO> applies noindex from the preview_token.)
 */
export const PrivateRouteSeo = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!isPrivatePath(pathname)) return;
    const section = pathname.startsWith('/admin') ? 'Admin' : 'Sign in';
    applySeoToDocument(
      document,
      buildSeoTags({ siteUrl: SITE_URL, pathname, search, title: section, noindex: true })
    );
  }, [pathname, search]);

  return null;
};
