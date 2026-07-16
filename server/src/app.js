import './config/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.middleware.js';

import authRoutes from './routes/auth.routes.js';
import workRoutes from './routes/work.routes.js';
import thinkingRoutes from './routes/thinking.routes.js';
import prdRoutes from './routes/prd.routes.js';
import mediaRoutes from './routes/media.routes.js';
import contactRoutes from './routes/contact.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import adminRoutes from './routes/admin.routes.js';
import seoRoutes from './routes/seo.routes.js';

const app = express();

// Security and middleware setup
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'https:', 'data:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        connectSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.path !== '/api/contact') {
    const origin = req.get('origin');
    const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
    if (origin && origin !== allowedOrigin)
      return res.status(403).json({ success: false, error: 'Invalid request origin.' });
  }
  next();
});
app.use(morgan('dev'));
app.use(requestLogger);

// Global API Rate Limiter
app.use('/api', apiLimiter);

// SEO Dynamic Feeds & Sitemaps
app.use(['/api/seo', '/sitemap.xml', '/rss.xml'], seoRoutes);

// Sensitive & Submission Route Rate Limits
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contact', authLimiter, contactRoutes);

// Public & Modular API Routes
app.use('/api/work', workRoutes);
app.use('/api/thinking', thinkingRoutes);
app.use('/api/prds', prdRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);

// Protected Admin CMS Command Center Routes (`/api/admin/*`)
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'Production API Server is healthy and running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// 404 & Global Error Handling
app.use('*', notFoundHandler);
app.use(errorHandler);

export default app;
