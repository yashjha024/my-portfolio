import './config/env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'crypto';
import { supabase } from './config/supabase.js';
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
import experienceRoutes from './routes/experience.routes.js';
import educationRoutes from './routes/education.routes.js';
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
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const configured = process.env.CLIENT_URL || 'http://localhost:5173';
  if (origin === configured) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// CSRF Initialization and Double-Submit Cookie Protection
app.use((req, res, next) => {
  if (!req.cookies['csrf-token']) {
    const token = crypto.randomBytes(24).toString('hex');
    res.cookie('csrf-token', token, {
      httpOnly: false, // Must be readable by client JS/Axios for Double-Submit Cookie pattern
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    req.cookies['csrf-token'] = token;
  }
  next();
});

app.get('/api/csrf-token', (req, res) => {
  const token = req.cookies['csrf-token'] || crypto.randomBytes(24).toString('hex');
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  res.status(200).json({ success: true, csrfToken: token });
});

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.path !== '/api/contact') {
    const origin = req.get('origin');
    if (origin && !isAllowedOrigin(origin)) {
      return res.status(403).json({ success: false, error: 'Invalid request origin.' });
    }

    // Double-Submit Cookie CSRF verification when cookie authentication is present
    if (req.cookies && req.cookies['sb-access-token']) {
      const cookieCsrf = req.cookies['csrf-token'];
      const headerCsrf = req.headers['x-csrf-token'];
      if (!cookieCsrf || !headerCsrf || cookieCsrf !== headerCsrf) {
        return res.status(403).json({ success: false, error: 'CSRF token mismatch or missing.' });
      }
    }
  }
  next();
});
app.use(morgan('dev'));
app.use(requestLogger);

// Global API Rate Limiter
app.use('/api', apiLimiter);

// SEO Dynamic Feeds & Sitemaps
app.use(['/', '/api/seo'], seoRoutes);

// Sensitive & Submission Route Rate Limits
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contact', authLimiter, contactRoutes);

// Public & Modular API Routes
app.use('/api/work', workRoutes);
app.use('/api/thinking', thinkingRoutes);
app.use('/api/prds', prdRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/educations', educationRoutes);

// Protected Admin CMS Command Center Routes (`/api/admin/*`)
app.use('/api/admin', adminRoutes);

// Health, Liveness, and Readiness check endpoints
const handleLiveness = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

const handleReadiness = async (req, res) => {
  try {
    const withTimeout = (promise, ms = 3000) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
      ]);

    // 1. Check Supabase Database non-destructively
    let dbHealthy = false;
    try {
      const { error: dbError } = await withTimeout(supabase.from('users').select('id').limit(1));
      dbHealthy = !dbError || dbError.code === 'PGRST116';
    } catch {
      dbHealthy = false;
    }

    // 2. Check Supabase Storage
    let storageHealthy = false;
    try {
      const { error: storageError } = await withTimeout(
        supabase.storage.getBucket('portfolio-media')
      );
      storageHealthy = !storageError || storageError.message?.includes('not found') === false;
    } catch {
      storageHealthy = false;
    }

    // 3. Check Email Configuration (true if configured, or ok if dev)
    const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.OWNER_EMAIL);
    const isProd = process.env.NODE_ENV === 'production';
    const emailHealthy = isProd ? emailConfigured : true;

    const allHealthy = dbHealthy && storageHealthy && emailHealthy;

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      status: allHealthy ? 'ready' : 'not_ready',
      checks: {
        database: dbHealthy,
        storage: storageHealthy,
        email_configured: emailConfigured,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    res.status(503).json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
    });
  }
};

app.get(['/healthz/liveness', '/api/healthz/liveness', '/api/health'], handleLiveness);
app.get(['/healthz/readiness', '/api/healthz/readiness'], handleReadiness);

// 404 & Global Error Handling
app.use('*', notFoundHandler);
app.use(errorHandler);

export default app;
