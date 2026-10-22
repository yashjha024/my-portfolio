// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PrivateRouteSeo, SEO } from '../../src/components/shared/SEO.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SITE = 'https://yashjha.vercel.app';

let navigateTo;
const NavigationProbe = () => {
  navigateTo = useNavigate();
  return null;
};

const ArticlePage = () => (
  <SEO
    title="Launch notes"
    description="Article description"
    type="article"
    image="https://cdn.example.test/cover.png"
    publishedTime="2026-05-05T08:30:00Z"
    breadcrumbs={[
      { name: 'Home', url: '/' },
      { name: 'Launch notes', url: '/thinking/launch-notes' },
    ]}
  />
);
const HomePage = () => <SEO title="Yash Jha | Product & AI/ML Engineering Portfolio" />;
const AdminPage = () => null; // admin pages render no <SEO>

let container;
let root;

const mount = (initialPath) =>
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <NavigationProbe />
        <PrivateRouteSeo />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/thinking/:slug" element={<ArticlePage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/login" element={<AdminPage />} />
        </Routes>
      </MemoryRouter>
    );
  });
const go = (path) => act(() => navigateTo(path));

const head = () => document.head;
const metaContent = (selector) => head().querySelector(selector)?.getAttribute('content') ?? null;
const count = (selector) => head().querySelectorAll(selector).length;

beforeEach(() => {
  // Simulate the static defaults shipped in index.html
  document.head.innerHTML = `
    <title>Static title</title>
    <meta name="description" content="static description">
    <meta property="og:image" content="${SITE}/og-default.png">
    <meta name="twitter:card" content="summary_large_image">`;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('SEO metadata lifecycle', () => {
  it('adopts static index.html tags instead of duplicating them', () => {
    mount('/');
    expect(count('meta[name="description"]')).toBe(1);
    expect(count('meta[property="og:image"]')).toBe(1);
    expect(count('meta[name="twitter:card"]')).toBe(1);
    expect(document.title).toBe('Yash Jha | Product & AI/ML Engineering Portfolio');
    expect(head().querySelector('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE}/`);
  });

  it('removes article metadata when navigating to a non-article page', () => {
    mount('/thinking/launch-notes');
    expect(document.title).toBe('Launch notes | Yash Jha');
    expect(metaContent('meta[property="article:published_time"]')).toBe('2026-05-05T08:30:00.000Z');
    expect(metaContent('meta[property="og:type"]')).toBe('article');
    expect(metaContent('meta[property="og:image"]')).toBe('https://cdn.example.test/cover.png');
    expect(document.getElementById('breadcrumb-jsonld')).not.toBeNull();
    expect(head().querySelector('link[rel="canonical"]').getAttribute('href')).toBe(
      `${SITE}/thinking/launch-notes`
    );

    go('/');
    expect(document.title).toBe('Yash Jha | Product & AI/ML Engineering Portfolio');
    expect(head().querySelector('meta[property="article:published_time"]')).toBeNull();
    expect(document.getElementById('breadcrumb-jsonld')).toBeNull();
    expect(metaContent('meta[property="og:type"]')).toBe('website');
    expect(metaContent('meta[property="og:image"]')).toBe(`${SITE}/og-default.png`);
    expect(metaContent('meta[property="og:url"]')).toBe(`${SITE}/`);
    expect(count('link[rel="canonical"]')).toBe(1);
    expect(head().querySelector('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE}/`);
    const jsonLd = JSON.parse(document.getElementById('structured-data-jsonld').textContent);
    expect(jsonLd['@graph'][0]['@type']).toBe('Person');
  });

  it('marks admin and login pages noindex and clears public metadata left behind', () => {
    mount('/thinking/launch-notes');
    go('/admin/work');
    expect(metaContent('meta[name="robots"]')).toBe('noindex, nofollow');
    expect(head().querySelector('link[rel="canonical"]')).toBeNull();
    expect(head().querySelector('meta[property="og:url"]')).toBeNull();
    expect(head().querySelector('meta[property="article:published_time"]')).toBeNull();
    expect(document.getElementById('structured-data-jsonld')).toBeNull();
    expect(document.title).toBe('Admin | Yash Jha');

    go('/login');
    expect(metaContent('meta[name="robots"]')).toBe('noindex, nofollow');
    expect(document.title).toBe('Sign in | Yash Jha');

    go('/');
    expect(metaContent('meta[name="robots"]')).toMatch(/^index, follow/);
  });

  it('marks draft previews noindex on public routes', () => {
    mount('/thinking/launch-notes?preview_token=abc');
    expect(metaContent('meta[name="robots"]')).toBe('noindex, nofollow');
    expect(head().querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.title).toBe('Launch notes | Yash Jha');
  });
});
