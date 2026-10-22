import { normalizeSiteUrl } from '../utils/seo.js';

/**
 * Canonical public origin of the portfolio (no trailing slash). Set VITE_SITE_URL at build time;
 * it must match the server's SITE_URL so canonical links, sitemap and RSS agree.
 */
export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
