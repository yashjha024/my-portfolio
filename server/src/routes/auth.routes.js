import express from 'express';
import {
  sendMagicLink,
  getGoogleOAuthUrl,
  setSession,
  getMe,
  logout,
} from '../controllers/auth.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Passwordless Magic Link / OTP initiation
router.post('/magic-link', sendMagicLink);

// Google OAuth URL generation
router.get('/google', getGoogleOAuthUrl);

// Client session token synchronization & HTTP-only cookie setting
router.post('/session', setSession);

// Protected session profile lookup
router.get('/me', verifyAuth, getMe);

// Protected logout
router.post('/logout', verifyAuth, logout);

export default router;
