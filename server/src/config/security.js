/**
 * Request-origin and session helpers shared by the CORS policy and the mutation guard,
 * so both enforce the same exact-origin allowlist (see config/env.js for validation).
 */

export const createOriginChecker = (allowedOrigins) => {
  const allowed = new Set(allowedOrigins.map((origin) => origin.toLowerCase()));
  return (origin) => {
    // Requests without an Origin header are same-origin navigations or non-browser clients
    if (!origin) return true;
    return allowed.has(origin.trim().replace(/\/+$/, '').toLowerCase());
  };
};

/**
 * CSRF verification is required whenever the browser could have attached session cookies,
 * including a refresh-token-only session that `verifyAuth` would silently renew.
 */
export const hasSessionCookie = (cookies) =>
  Boolean(cookies && (cookies['sb-access-token'] || cookies['sb-refresh-token']));
