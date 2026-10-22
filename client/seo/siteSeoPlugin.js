import { buildRobotsTxt, normalizeSiteUrl } from '../src/utils/seo.js';

export const SITE_URL_PLACEHOLDER = '__SITE_URL__';

/** Replace the build-time site URL placeholder in index.html. */
export const injectSiteUrl = (html, siteUrl) =>
  html.split(SITE_URL_PLACEHOLDER).join(normalizeSiteUrl(siteUrl));

/**
 * Vite plugin: fills __SITE_URL__ in index.html and serves/emits robots.txt for the canonical
 * site URL, so the static defaults, robots.txt and the SEO component all use one origin.
 */
export const siteSeoPlugin = (siteUrlInput) => {
  const siteUrl = normalizeSiteUrl(siteUrlInput);
  return {
    name: 'site-seo',
    transformIndexHtml: (html) => injectSiteUrl(html, siteUrl),
    configureServer(server) {
      server.middlewares.use('/robots.txt', (req, res) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(buildRobotsTxt(siteUrl));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobotsTxt(siteUrl) });
    },
  };
};
