/**
 * Applies a declarative tag set from buildSeoTags() to the document head.
 * Every element this module touches is marked `data-seo-managed`; on each call, managed elements
 * that are not part of the new tag set are removed, so metadata from a previous route (e.g.
 * article:published_time, breadcrumbs, a canonical link) never leaks into the next page.
 * Matching static tags from index.html are adopted and updated rather than duplicated.
 */
const MANAGED = 'data-seo-managed';

const escapeAttr = (value) => String(value).replace(/["\\]/g, '\\$&');

export const applySeoToDocument = (doc, tags) => {
  const head = doc.head;
  const keep = new Set();

  doc.title = tags.title;

  for (const { attr, key, content } of tags.metas) {
    const matches = head.querySelectorAll(`meta[${attr}="${escapeAttr(key)}"]`);
    let element = matches[0];
    // Remove accidental duplicates left by older code
    for (let i = 1; i < matches.length; i += 1) matches[i].remove();
    if (!element) {
      element = doc.createElement('meta');
      element.setAttribute(attr, key);
      head.appendChild(element);
    }
    element.setAttribute('content', content);
    element.setAttribute(MANAGED, '');
    keep.add(element);
  }

  const canonicals = head.querySelectorAll('link[rel="canonical"]');
  for (let i = tags.canonical ? 1 : 0; i < canonicals.length; i += 1) canonicals[i].remove();
  if (tags.canonical) {
    let link = canonicals[0];
    if (!link) {
      link = doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', tags.canonical);
    link.setAttribute(MANAGED, '');
    keep.add(link);
  }

  for (const { id, data } of tags.jsonLd) {
    let script = doc.getElementById(id);
    if (!script) {
      script = doc.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
    script.setAttribute(MANAGED, '');
    keep.add(script);
  }

  for (const element of head.querySelectorAll(`[${MANAGED}]`)) {
    if (!keep.has(element)) element.remove();
  }
};
