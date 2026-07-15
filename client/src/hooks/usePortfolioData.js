import { useState, useEffect, useMemo } from 'react';
import { profileData, caseStudies, articles, prds, aboutData } from '../data/mockData.js';

export const usePortfolioData = ({ type = 'all', delayMs = 350 } = {}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, delayMs);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [delayMs]);

  const data = useMemo(() => {
    return {
      profile: profileData,
      caseStudies: caseStudies.filter((item) => item.status === 'published'),
      articles: articles.filter((item) => item.status === 'published'),
      prds: prds.filter((item) => item.visibility === 'public'),
      about: aboutData,
    };
  }, []);

  if (type === 'caseStudies') return { data: data.caseStudies, loading };
  if (type === 'articles') return { data: data.articles, loading };
  if (type === 'prds') return { data: data.prds, loading };
  if (type === 'profile') return { data: data.profile, loading };
  if (type === 'about') return { data: data.about, loading };

  return { data, loading };
};
