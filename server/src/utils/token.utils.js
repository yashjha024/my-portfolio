/**
 * Token & Cookie Utility Functions
 * Handles secure, HTTP-only cookie setting and clearing for Supabase sessions.
 */

export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'none' : 'lax';

  if (accessToken) {
    res.cookie('sb-access-token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 3600 * 1000, // 1 hour
      path: '/',
    });
  }

  if (refreshToken) {
    res.cookie('sb-refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
      path: '/',
    });
  }
};

export const clearTokenCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  res.clearCookie('sb-access-token', cookieOptions);
  res.clearCookie('sb-refresh-token', cookieOptions);
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
