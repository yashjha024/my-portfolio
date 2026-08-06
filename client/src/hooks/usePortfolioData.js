import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import {
  aboutData,
  articles as mockArticles,
  caseStudies as mockCaseStudies,
  prds as mockPrds,
  profileData,
} from '../data/mockData.js';

let cachePromise = null;
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000;
const demoEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

const array = (value) => (Array.isArray(value) ? value : []);
const object = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const toCaseStudyDto = (item) => ({
  ...item,
  coverImage: item.cover_image ?? item.coverImage ?? null,
  liveUrl: item.live_url ?? item.liveUrl ?? null,
  repoUrl: item.repo_url ?? item.repoUrl ?? null,
  prototypeUrl: item.prototype_url ?? item.prototypeUrl ?? null,
  prdUrl: item.prd_url ?? item.prdUrl ?? null,
  publishedAt: item.published_at ?? item.publishedAt ?? null,
  seoTitle: item.seo_title ?? item.seoTitle ?? null,
  seoDescription: item.seo_description ?? item.seoDescription ?? null,
  ogImage: item.og_image ?? item.ogImage ?? null,
  gallery: array(item.gallery),
  metrics: array(item.metrics),
  tools: array(item.tools),
  tags: array(item.tags),
  skills: array(item.skills),
  prdSnapshot: object(item.prd_snapshot ?? item.prdSnapshot),
  researchInputs: item.research_inputs ?? item.researchInputs ?? null,
  roleConstraints: item.role_constraints ?? item.roleConstraints ?? null,
  problemFraming: item.problem_framing ?? item.problemFraming ?? null,
  optionsDecision: item.options_decision ?? item.options_tradeoffs ?? item.optionsDecision ?? null,
  optionsTradeoffs:
    item.options_tradeoffs ?? item.options_decision ?? item.optionsTradeoffs ?? null,
  delivery: item.delivery ?? null,
  outcomeLearning: item.outcome_learning ?? item.outcomeLearning ?? null,
  year: item.year ? Number(item.year) : null,
  relatedWork: array(item.related_work ?? item.relatedWork),
});

export const toArticleDto = (item) => ({
  ...item,
  coverImage: item.cover_image ?? item.coverImage ?? null,
  readingTime: item.reading_time ?? item.readingTime ?? null,
  publishedAt: item.published_at ?? item.publishedAt ?? null,
  relatedWork: array(item.related_work ?? item.relatedWork),
  tags: array(item.tags),
});

export const toPrdDto = (item) => ({
  ...item,
  pdfUrl: item.pdf_url ?? item.pdfUrl ?? null,
  relatedCaseStudyId: item.related_case_study_id ?? item.relatedCaseStudyId ?? null,
  sections: object(item.sections),
});

const defaultProfileDto = {
  ...profileData,
  resumeUrl: '/resume',
  location: profileData.location || 'Delhi, IN',
  copyright: `© ${new Date().getFullYear()} Yash Jha. Built with MERN Stack, React 19 & Tailwind CSS.`,
  navLabels: {
    work: 'Work',
    thinking: 'Product Thinking',
    prds: 'PRDs',
    about: 'About',
  },
};

const emptyData = {
  profile: defaultProfileDto,
  caseStudies: [],
  articles: [],
  prds: [],
  about: aboutData,
  unavailable: false,
};
const demoData = {
  profile: defaultProfileDto,
  caseStudies: mockCaseStudies.filter((item) => item.status === 'published'),
  articles: mockArticles.filter((item) => item.status === 'published'),
  prds: mockPrds.filter((item) => item.visibility === 'public'),
  about: aboutData,
  unavailable: false,
};

const fetchAllData = async () => {
  if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL) return cachedData;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    const [workRes, thinkingRes, prdsRes, settingsRes] = await Promise.allSettled([
      api.get('/work?limit=100'),
      api.get('/thinking?limit=100'),
      api.get('/prds?limit=100'),
      api.get('/settings'),
    ]);
    const responses = [workRes, thinkingRes, prdsRes, settingsRes];
    const unavailable = responses.some((result) => result.status === 'rejected');
    if (unavailable && demoEnabled) return demoData;

    const settings =
      settingsRes.status === 'fulfilled' && settingsRes.value.data?.success
        ? settingsRes.value.data.data
        : null;
    const result = {
      profile: settings
        ? {
            name: settings.headline?.split(' | ')[0] || 'Yash Jha',
            role: settings.headline || 'Product Manager & Architecture Specialist',
            bio:
              settings.biography ||
              'A product portfolio with case studies, product thinking, and delivery evidence.',
            email: settings.email || 'yashjha024@gmail.com',
            resumeUrl: settings.resume_url || '/resume',
            linkedin: settings.social_links?.linkedin || 'https://linkedin.com/in/yashjha024',
            github: settings.social_links?.github || 'https://github.com/yashjha024',
            twitter: settings.social_links?.twitter || '',
            substack: settings.social_links?.substack || '',
            location: settings.footer_details?.location || 'Delhi, IN',
            copyright:
              settings.footer_details?.copyright ||
              `© ${new Date().getFullYear()} Yash Jha. Built with MERN Stack, React 19 & Tailwind CSS.`,
            navLabels: settings.navigation_labels || {
              work: 'Work',
              thinking: 'Product Thinking',
              prds: 'PRDs',
              about: 'About',
            },
          }
        : {
            ...profileData,
            resumeUrl: '/resume',
            location: profileData.location || 'Delhi, IN',
            copyright: `© ${new Date().getFullYear()} Yash Jha. Built with MERN Stack, React 19 & Tailwind CSS.`,
            navLabels: {
              work: 'Work',
              thinking: 'Product Thinking',
              prds: 'PRDs',
              about: 'About',
            },
          },
      caseStudies:
        workRes.status === 'fulfilled' && workRes.value.data?.success
          ? array(workRes.value.data.data).map(toCaseStudyDto)
          : [],
      articles:
        thinkingRes.status === 'fulfilled' && thinkingRes.value.data?.success
          ? array(thinkingRes.value.data.data).map(toArticleDto)
          : [],
      prds:
        prdsRes.status === 'fulfilled' && prdsRes.value.data?.success
          ? array(prdsRes.value.data.data).map(toPrdDto)
          : [],
      about: aboutData,
      unavailable,
    };
    cachedData = result;
    cacheTimestamp = Date.now();
    return result;
  })();

  try {
    return await cachePromise;
  } finally {
    cachePromise = null;
  }
};

export const invalidatePortfolioCache = () => {
  cachedData = null;
  cacheTimestamp = 0;
  cachePromise = null;
};

export const usePortfolioData = ({ type = 'all' } = {}) => {
  const [dataState, setDataState] = useState(cachedData || (demoEnabled ? demoData : emptyData));
  const [loading, setLoading] = useState(!cachedData);
  useEffect(() => {
    let mounted = true;
    fetchAllData()
      .then((data) => {
        if (mounted) setDataState(data);
      })
      .catch(() => {
        if (mounted) setDataState({ ...emptyData, unavailable: true });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const data = useMemo(() => {
    if (type === 'caseStudies') return dataState.caseStudies;
    if (type === 'articles') return dataState.articles;
    if (type === 'prds') return dataState.prds;
    if (type === 'profile') return dataState.profile;
    if (type === 'about') return dataState.about;
    return dataState;
  }, [dataState, type]);
  return { data, loading, unavailable: dataState.unavailable };
};
