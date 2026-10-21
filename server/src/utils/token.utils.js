/**
 * Token & Cookie Utility Functions
 * Handles secure, HTTP-only cookie setting and clearing for Supabase sessions.
 */

/**
 * Shared attributes for setting and clearing session cookies, so both always match.
 * The SPA reaches the API through the same-origin /api rewrite, so session cookies never need to be
 * sent cross-site; SameSite=Lax keeps them off requests initiated by other sites.
 */
export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

export const setTokenCookies = (res, accessToken, refreshToken) => {
  const baseOptions = sessionCookieOptions();

  if (accessToken) {
    res.cookie('sb-access-token', accessToken, {
      ...baseOptions,
      maxAge: 3600 * 1000, // 1 hour
    });
  }

  if (refreshToken) {
    res.cookie('sb-refresh-token', refreshToken, {
      ...baseOptions,
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
    });
  }
};

export const clearTokenCookies = (res) => {
  const cookieOptions = sessionCookieOptions();

  res.clearCookie('sb-access-token', cookieOptions);
  res.clearCookie('sb-refresh-token', cookieOptions);
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
