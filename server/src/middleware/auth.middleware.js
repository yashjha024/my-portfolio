import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { setTokenCookies } from '../utils/token.utils.js';

/**
 * Single owner decision shared by required and optional authentication, so draft previews,
 * private downloads and the admin console all agree on who the owner is.
 * The owner is the Supabase-verified account whose confirmed email equals OWNER_EMAIL; the
 * `users.role` column is never trusted on its own (it defaults to 'owner' for every row).
 */
export const isOwnerAuthUser = (authUser) =>
  Boolean(
    env.OWNER_EMAIL &&
    authUser?.email &&
    authUser.email.toLowerCase().trim() === env.OWNER_EMAIL &&
    (authUser.email_confirmed_at || authUser.confirmed_at)
  );

const loadProfile = async (userId) => {
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  return data || null;
};

const buildRequestUser = (authUser, userProfile) => {
  const isOwner = isOwnerAuthUser(authUser);
  return {
    id: authUser.id,
    email: authUser.email,
    full_name:
      userProfile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      'User',
    role: isOwner ? 'owner' : 'visitor',
    avatar_url: userProfile?.avatar_url || authUser.user_metadata?.avatar_url || null,
    is_admin: isOwner,
  };
};

/**
 * Resolve the Supabase user from the Bearer header, the access-token cookie, or (last) the
 * refresh-token cookie, renewing session cookies when a refresh succeeds.
 */
const resolveAuthUser = async (req, res) => {
  const authHeader = req.headers.authorization;
  const headerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = req.cookies?.['sb-access-token'];
  const refreshToken = req.cookies?.['sb-refresh-token'];

  if (!headerToken && !cookieToken && !refreshToken) {
    return { authUser: null, hadCredentials: false };
  }

  for (const token of [headerToken, cookieToken]) {
    if (!token) continue;
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) return { authUser: data.user, hadCredentials: true };
  }

  if (refreshToken) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (!refreshError && refreshData?.session) {
      setTokenCookies(res, refreshData.session.access_token, refreshData.session.refresh_token);
      return { authUser: refreshData.session.user, hadCredentials: true };
    }
  }

  return { authUser: null, hadCredentials: true };
};

/**
 * Authentication Middleware (`verifyAuth`)
 * Inspects both HTTP-Only cookies (`sb-access-token`) and `Authorization: Bearer <token>` headers.
 * Automatically attempts session refresh if access token is expired.
 */
export const verifyAuth = async (req, res, next) => {
  try {
    const { authUser, hadCredentials } = await resolveAuthUser(req, res);

    if (!hadCredentials) {
      return res
        .status(401)
        .json({ success: false, error: 'Unauthorized: No authentication tokens found.' });
    }

    if (!authUser) {
      return res
        .status(401)
        .json({ success: false, error: 'Unauthorized: Invalid or expired session.' });
    }

    req.user = buildRequestUser(authUser, await loadProfile(authUser.id));
    next();
  } catch (err) {
    console.error('verifyAuth middleware error:', err);
    return res.status(401).json({ success: false, error: 'Authentication failed.' });
  }
};

/**
 * Optional authentication: attaches `req.user` when a valid session exists, otherwise `null`.
 * Uses the same owner rule as `verifyAuth`.
 */
export const verifyAuthOptional = async (req, res, next) => {
  try {
    const { authUser } = await resolveAuthUser(req, res);
    req.user = authUser ? buildRequestUser(authUser, await loadProfile(authUser.id)) : null;
    next();
  } catch (_err) {
    req.user = null;
    next();
  }
};
