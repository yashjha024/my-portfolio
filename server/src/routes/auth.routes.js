import express from 'express';
import passport from 'passport';
import { googleAuthCallback, getMe, logout } from '../controllers/auth.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=true' }),
  googleAuthCallback
);

router.get('/me', verifyAuth, getMe);
router.post('/logout', verifyAuth, logout);

export default router;
