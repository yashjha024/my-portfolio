import rateLimit from 'express-rate-limit';

/**
 * Standard API Rate Limiter: 100 requests per 15 minutes window per IP.
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
 * Strict Auth & Contact Rate Limiter: 10 attempts per 15 minutes window per IP.
 * Protects login endpoints and contact submission forms against brute-force & spam bots.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication or submission attempts. Please wait 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});
