import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { siteSeoPlugin } from './seo/siteSeoPlugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// A production build must never ship React's development bundle (and import.meta.env.PROD=false),
// even if the hosting environment exports NODE_ENV=development. This was observed on Vercel.
const forceProductionNodeEnv = (command, mode) => {
  if (command === 'build' && mode === 'production' && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[vite] Ignoring NODE_ENV=${process.env.NODE_ENV} for the production build; using production.`
    );
    process.env.NODE_ENV = 'production';
  }
};

export default defineConfig(
  ({ command, mode }) => (
    forceProductionNodeEnv(command, mode),
    {
      // VITE_SITE_URL: canonical public origin (defaults to the verified Vercel hostname)
      plugins: [react(), siteSeoPlugin(loadEnv(mode, __dirname, 'VITE_').VITE_SITE_URL)],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
      server: {
        port: 5173,
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
          },
        },
      },
      // Vitest runs only the DOM/component tests; pure-module tests use `node --test tests/*.test.js`
      test: {
        include: ['tests/dom/**/*.test.{js,jsx}'],
        environment: 'jsdom',
      },
      build: {
        target: 'es2022',
        sourcemap: false,
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-motion': ['framer-motion'],
              'vendor-lucide': ['lucide-react'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            },
          },
        },
      },
    }
  )
);
