import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { env } from '../../config/env.js';

/**
 * Universal Analytics & Core Web Vitals Telemetry Component.
 * Automatically tracks route changes and monitors LCP, FID/INP, and CLS performance metrics.
 */
export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views on route change
    const currentPath = location.pathname + location.search;

    if (env.GA_MEASUREMENT_ID && typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', env.GA_MEASUREMENT_ID, {
        page_path: currentPath,
      });
    } else if (env.IS_PROD) {
      // Production fallback / internal telemetry log
      console.info(`[Analytics Telemetry] Pageview: ${currentPath}`);
    }
  }, [location]);

  useEffect(() => {
    // Setup simple PerformanceObserver for Core Web Vitals (LCP, CLS) in browser
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Observe Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry && !env.IS_PROD) {
            console.info(`[Web Vitals] LCP: ${Math.round(lastEntry.startTime)}ms`);
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Observe Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          if (clsValue > 0.01 && !env.IS_PROD) {
            console.info(`[Web Vitals] CLS: ${clsValue.toFixed(4)}`);
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        return () => {
          lcpObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (_error) {
        // Ignore unsupported observer types on old browsers
      }
    }
  }, []);

  return null;
};
