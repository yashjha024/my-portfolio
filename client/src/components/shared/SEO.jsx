import React, { useEffect } from 'react';

const DEFAULT_DOMAIN = 'https://portfolio.yashjha024.com';
const DEFAULT_TITLE = 'Yash Jha — Product Professional & AI/ML Engineer Portfolio';
const DEFAULT_DESC =
  'Product Professional & AI/ML Engineer Portfolio featuring production LMS workflows at Istockly, industrial commerce journeys at Diptech Technologies, and CVPR AI research pipelines.';
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

/**
 * Universal SEO & Meta Tag Manager Component.
 * Dynamically updates document.title, OpenGraph, Twitter Cards, Canonical URLs, and JSON-LD Structured Data.
 */
export const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  canonical,
  type = 'website',
  author = 'Yash Jha',
  publishedTime,
  modifiedTime,
  breadcrumbs = null,
  structuredData = null,
}) => {
  useEffect(() => {
    // 1. Dynamic Title
    const finalTitle = title ? `${title} | Yash Jha` : DEFAULT_TITLE;
    document.title = finalTitle;
    document.documentElement.lang = 'en';

    // 2. Resolve Canonical & OpenGraph URL
    const pathname = window.location.pathname;
    const resolvedUrl = url || `${DEFAULT_DOMAIN}${pathname}`;
    const resolvedCanonical = canonical || resolvedUrl;
    const finalImage = image || DEFAULT_IMAGE;
    const finalDesc = description || DEFAULT_DESC;
    const finalKeywords =
      keywords ||
      'Product Professional, AI/ML Engineer, BIT Mesra, Workflow Design, LMS, Industrial Commerce, CVPR Research, LangChain, RAG, Python, MERN Stack';

    // Helper to set or update meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };

    // Helper to set or update link tags
    const setLinkTag = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Basic SEO Meta Tags
    setMetaTag('name', 'description', finalDesc);
    setMetaTag('name', 'keywords', finalKeywords);
    setMetaTag('name', 'author', author);
    setMetaTag(
      'name',
      'robots',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // Canonical URL
    setLinkTag('canonical', resolvedCanonical);

    // Performance Optimization Hints (Preconnect for Fonts / CDN)
    setLinkTag('preconnect', 'https://fonts.googleapis.com');
    setLinkTag('dns-prefetch', 'https://fonts.gstatic.com');

    // OpenGraph Meta Tags
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDesc);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', resolvedUrl);
    setMetaTag('property', 'og:image', finalImage);
    setMetaTag('property', 'og:site_name', 'Yash Jha — Product Portfolio');
    setMetaTag('property', 'og:locale', 'en_US');

    if (publishedTime) setMetaTag('property', 'article:published_time', publishedTime);
    if (modifiedTime) setMetaTag('property', 'article:modified_time', modifiedTime);

    // Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDesc);
    setMetaTag('name', 'twitter:image', finalImage);
    setMetaTag('name', 'twitter:creator', '@yashjha024');

    // 3. Construct and Inject Structured Data (JSON-LD)
    let jsonLdPayload = {};

    if (structuredData) {
      jsonLdPayload = structuredData;
    } else if (type === 'article' || type === 'case_study' || type === 'prd') {
      jsonLdPayload = {
        '@context': 'https://schema.org',
        '@type': type === 'case_study' ? 'TechArticle' : 'Article',
        headline: title || DEFAULT_TITLE,
        description: finalDesc,
        image: [finalImage],
        datePublished: publishedTime || new Date().toISOString(),
        dateModified: modifiedTime || publishedTime || new Date().toISOString(),
        author: {
          '@type': 'Person',
          name: author,
          url: `${DEFAULT_DOMAIN}/about`,
          jobTitle: 'Product Professional & AI/ML Engineer',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Yash Jha Product Portfolio',
          logo: {
            '@type': 'ImageObject',
            url: `${DEFAULT_DOMAIN}/favicon.ico`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': resolvedUrl,
        },
      };
    } else {
      // Default WebSite + Person Schema
      jsonLdPayload = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Person',
            '@id': `${DEFAULT_DOMAIN}/#person`,
            name: author,
            jobTitle: 'Product Professional & AI/ML Engineer',
            url: DEFAULT_DOMAIN,
            sameAs: ['https://linkedin.com/in/yashjha024', 'https://github.com/yashjha024'],
          },
          {
            '@type': 'WebSite',
            '@id': `${DEFAULT_DOMAIN}/#website`,
            url: DEFAULT_DOMAIN,
            name: 'Yash Jha Product Portfolio',
            description: DEFAULT_DESC,
            publisher: {
              '@id': `${DEFAULT_DOMAIN}/#person`,
            },
          },
        ],
      };
    }

    // If Breadcrumbs exist, append BreadcrumbList schema
    let breadcrumbJsonLd = null;
    if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
      breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: item.url?.startsWith('http') ? item.url : `${DEFAULT_DOMAIN}${item.url || ''}`,
        })),
      };
    }

    // Inject Script Tags into DOM Head
    const injectOrUpdateScript = (id, data) => {
      let scriptEl = document.getElementById(id);
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = id;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(data);
    };

    injectOrUpdateScript('structured-data-jsonld', jsonLdPayload);
    if (breadcrumbJsonLd) {
      injectOrUpdateScript('breadcrumb-jsonld', breadcrumbJsonLd);
    }

    return () => {
      // Clean up dynamic scripts if component unmounts on SPA navigation
    };
  }, [
    title,
    description,
    keywords,
    image,
    url,
    canonical,
    type,
    author,
    publishedTime,
    modifiedTime,
    breadcrumbs,
    structuredData,
  ]);

  return null;
};
