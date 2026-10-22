import rateLimit from 'express-rate-limit';

/**
 * All limiters key on `req.ip`, which is only the real visitor address when `trust proxy` is set to the
 * validated TRUST_PROXY_HOPS value (see app.js). Each limiter owns its own store so login attempts and
 * contact submissions never consume each other's allowance.
 */

/**
 * Standard API Rate Limiter: 120 requests per 15 minutes window per client IP.
 * Prevents DDoS and abusive automated crawling while allowing normal SPA navigation.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // Limit each IP to 120 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests from this IP address. Please wait 15 minutes before retrying.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Strict Login Rate Limiter: 15 attempts per 15 minutes window per client IP.
 * Applied only to sign-in initiation and session exchange, not to session checks such as /auth/me.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Contact Submission Rate Limiter: 15 submissions per 15 minutes window per client IP.
 * Protects the public contact form against spam bots.
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many submission attempts. Please wait 15 minutes.',
    code: 'CONTACT_RATE_LIMIT_EXCEEDED',
  },
});
