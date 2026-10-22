import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { siteSeoPlugin } from './seo/siteSeoPlugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
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
}));
