import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { configurePassport } from './config/passport.js';
import { errorHandler } from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import workRoutes from './routes/work.routes.js';
import thinkingRoutes from './routes/thinking.routes.js';
import prdRoutes from './routes/prd.routes.js';
import mediaRoutes from './routes/media.routes.js';
import contactRoutes from './routes/contact.routes.js';

const app = express();

// Security and middleware setup
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Configure Passport Google OAuth
configurePassport();
app.use(passport.initialize());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/work', workRoutes);
app.use('/api/thinking', thinkingRoutes);
app.use('/api/prds', prdRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'MERN API Server is healthy and running' });
});

// Global error handler
app.use(errorHandler);

export default app;
