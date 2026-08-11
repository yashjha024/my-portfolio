import { supabase } from '../config/supabase.js';
import { setTokenCookies, clearTokenCookies } from '../utils/token.utils.js';

/**
 * Trigger OTP/Magic Link passwordless sign-in via Supabase Auth
 */
export const sendMagicLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(400)
        .json({ success: false, error: 'Please provide a valid email address.' });
    }
    const cleanEmail = (str) =>
      (str || '')
        .toLowerCase()
        .replace(/^['"]|['"]$/g, '')
        .trim();
    const ownerEmail = cleanEmail(process.env.OWNER_EMAIL);
    if (!ownerEmail) {
      return res
        .status(500)
        .json({ success: false, error: 'Server configuration error: OWNER_EMAIL is missing.' });
    }

    if (cleanEmail(email) !== ownerEmail) {
      return res
        .status(403)
        .json({ success: false, error: 'This account is not authorized for the owner console.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        redirectTo: `${clientUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error('Magic link send error:', error.message);
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Magic link sent successfully. Please check your inbox.',
    });
  } catch (err) {
    console.error('Magic link controller error:', err);
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error while sending magic link.' });
  }
};

/**
 * Retrieve Google OAuth URL for frontend redirection
 */
export const getGoogleOAuthUrl = async (req, res) => {
  try {
    const origin = req.get('origin');
    const clientUrl = origin || process.env.CLIENT_URL || 'http://localhost:5173';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${clientUrl}/auth/callback`,
      },
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, url: data.url });
  } catch (err) {
    console.error('Google OAuth URL generation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate Google OAuth URL.' });
  }
};

/**
 * Establish server session after client completes Supabase OAuth/OTP callback
 */
export const setSession = async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;
    if (!access_token) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing access_token in request body.' });
    }

    // Verify token with Supabase auth server
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser(access_token);
    if (error || !authUser) {
      return res
        .status(401)
        .json({ success: false, error: 'Invalid or expired Supabase access token.' });
    }

    const cleanEmail = (str) =>
      (str || '')
        .toLowerCase()
        .replace(/^['"]|['"]$/g, '')
        .trim();
    const ownerEmail = cleanEmail(process.env.OWNER_EMAIL);

    if (!ownerEmail) {
      console.error('CRITICAL: OWNER_EMAIL is not set in backend environment variables.');
      return res
        .status(500)
        .json({ success: false, error: 'Server configuration error: OWNER_EMAIL is missing.' });
    }

    if (!authUser.email || cleanEmail(authUser.email) !== ownerEmail) {
      return res
        .status(403)
        .json({ success: false, error: 'This account is not authorized for the owner console.' });
    }

    // Upsert user profile in public users table
    const { data: userProfile, error: upsertError } = await supabase
      .from('users')
      .upsert(
        {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          role: 'owner',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (upsertError) {
      console.error('User profile upsert warning:', upsertError.message);
    }

    // Set secure HTTP-only cookies
    setTokenCookies(res, access_token, refresh_token);

    return res.status(200).json({
      success: true,
      user: userProfile || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        role: 'owner',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      },
    });
  } catch (err) {
    console.error('Session establishment error:', err);
    return res.status(500).json({ success: false, error: 'Failed to establish server session.' });
  }
};

/**
 * Return currently authenticated user profile
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * Sign out user and clear HTTP-only cookies
 */
export const logout = async (req, res) => {
  try {
    const token = req.cookies['sb-access-token'] || req.headers.authorization?.split(' ')[1];
    if (token) {
      await supabase.auth.admin?.signOut?.(token).catch(() => null);
    }
  } catch (_e) {
    // Ignore sign-out errors on expired tokens
  } finally {
    clearTokenCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }
};
