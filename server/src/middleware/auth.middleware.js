import { supabase } from '../config/supabase.js';
import { setTokenCookies } from '../utils/token.utils.js';

/**
 * Authentication Middleware (`verifyAuth`)
 * Inspects both HTTP-Only cookies (`sb-access-token`) and `Authorization: Bearer <token>` headers.
 * Automatically attempts session refresh if access token is expired.
 */
export const verifyAuth = async (req, res, next) => {
  try {
    let accessToken = req.cookies['sb-access-token'];
    let refreshToken = req.cookies['sb-refresh-token'];

    // Check Authorization header if cookie is absent
    const authHeader = req.headers.authorization;
    if (!accessToken && authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }

    if (!accessToken && !refreshToken) {
      return res
        .status(401)
        .json({ success: false, error: 'Unauthorized: No authentication tokens found.' });
    }

    let authUser = null;

    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data?.user) {
        authUser = data.user;
      }
    }

    // If access token failed or expired, attempt token refresh via refresh_token
    if (!authUser && refreshToken) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!refreshError && refreshData?.session) {
        authUser = refreshData.session.user;
        setTokenCookies(res, refreshData.session.access_token, refreshData.session.refresh_token);
      }
    }

    if (!authUser) {
      return res
        .status(401)
        .json({ success: false, error: 'Unauthorized: Invalid or expired session.' });
    }

    // Query user profile from public users table
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    const ownerEmail = process.env.OWNER_EMAIL.toLowerCase();
    const isOwner = authUser.email?.toLowerCase() === ownerEmail && userProfile?.role === 'owner';

    req.user = userProfile
      ? { ...userProfile, role: isOwner ? 'owner' : 'visitor' }
      : {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          role: 'visitor',
          avatar_url: authUser.user_metadata?.avatar_url || null,
        };

    next();
  } catch (err) {
    console.error('verifyAuth middleware error:', err);
    return res.status(401).json({ success: false, error: 'Authentication failed.' });
  }
};

export const verifyAuthOptional = async (req, res, next) => {
  try {
    let accessToken = req.cookies?.['sb-access-token'];
    let refreshToken = req.cookies?.['sb-refresh-token'];
    const authHeader = req.headers.authorization;
    if (!accessToken && authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }
    if (!accessToken && !refreshToken) {
      req.user = null;
      return next();
    }
    let authUser = null;
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data?.user) authUser = data.user;
    }
    if (!authUser && refreshToken) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (!refreshError && refreshData?.session) {
        authUser = refreshData.session.user;
        setTokenCookies(res, refreshData.session.access_token, refreshData.session.refresh_token);
      }
    }
    if (!authUser) {
      req.user = null;
      return next();
    }
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase();
    const isOwner = authUser.email?.toLowerCase() === ownerEmail && userProfile?.role === 'owner';
    req.user = userProfile
      ? { ...userProfile, role: isOwner ? 'owner' : 'visitor', is_admin: isOwner }
      : {
          id: authUser.id,
          email: authUser.email,
          role: 'visitor',
          is_admin: isOwner,
        };
    next();
  } catch (_err) {
    req.user = null;
    next();
  }
};
