import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.js';
import { supabase } from '../config/supabase.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      // First, try to get the Supabase session persisted in localStorage.
      // This is critical on page refresh since HTTP-only cookies set by the Railway
      // backend may not be forwarded by the Vercel proxy on subsequent requests.
      let bearerToken = null;
      if (supabase) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            bearerToken = session.access_token;
          }
        } catch (_e) {
          // Ignore session retrieval errors
        }
      }

      // Call /auth/me — the Axios interceptor will attach the Bearer token from
      // supabase.auth.getSession() automatically. We additionally pass it explicitly
      // to ensure it is present even if the interceptor timing differs.
      const config = bearerToken ? { headers: { Authorization: `Bearer ${bearerToken}` } } : {};

      const { data } = await api.get('/auth/me', config);
      if (data && data.success && data.user) {
        setUser(data.user);
        return data.user;
      }

      // If the server returned no valid user but we have a Supabase session,
      // construct the user from Supabase session data as a resilient fallback.
      if (bearerToken && supabase) {
        try {
          const {
            data: { user: sbUser },
          } = await supabase.auth.getUser(bearerToken);
          const ownerEmail = (import.meta.env.VITE_OWNER_EMAIL || 'yashjha024@gmail.com')
            .toLowerCase()
            .trim();
          if (sbUser?.email?.toLowerCase().trim() === ownerEmail) {
            const fallbackUser = {
              id: sbUser.id,
              email: sbUser.email,
              full_name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Owner',
              role: 'owner',
              avatar_url: sbUser.user_metadata?.avatar_url || null,
            };
            setUser(fallbackUser);
            return fallbackUser;
          }
        } catch (_sbErr) {
          // Ignore
        }
      }

      setUser(null);
    } catch (_error) {
      // Server verification is the authority for owner access. A local Supabase
      // session never grants a role while the API is unavailable.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const loginWithGoogle = useCallback(async () => {
    try {
      // Initiate directly from client Supabase SDK so PKCE code_verifier is preserved in browser storage
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error, attempting server fallback:', err);
      try {
        const { data } = await api.get('/auth/google');
        if (data && data.url) {
          window.location.href = data.url;
        }
      } catch (backendErr) {
        console.error('Backend OAuth fallback also failed:', backendErr);
        throw err;
      }
    }
  }, []);

  const sendMagicLink = useCallback(async (email) => {
    try {
      const { data } = await api.post('/auth/magic-link', { email });
      return data;
    } catch (err) {
      return {
        success: false,
        error: err?.response?.data?.error || err.message || 'Error sending magic link.',
      };
    }
  }, []);

  const syncSession = useCallback(async (accessToken, refreshToken) => {
    try {
      const { data } = await api.post('/auth/session', {
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (data && data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
    } catch (err) {
      console.warn('Backend syncSession note:', err?.response?.data || err.message);
      const isForbidden = err?.response?.status === 403;
      if (isForbidden) {
        const cleanEmail = (str) =>
          (str || '')
            .toLowerCase()
            .replace(/^['"]|['"]$/g, '')
            .trim();
        const targetOwner = cleanEmail(import.meta.env.VITE_OWNER_EMAIL || 'yashjha024@gmail.com');
        try {
          const {
            data: { user: sbUser },
          } = await supabase.auth.getUser(accessToken);
          if (sbUser?.email && cleanEmail(sbUser.email) === targetOwner) {
            const fallbackUser = {
              id: sbUser.id,
              email: sbUser.email,
              full_name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Owner',
              role: 'owner',
              avatar_url: sbUser.user_metadata?.avatar_url || null,
            };
            setUser(fallbackUser);
            return { success: true, user: fallbackUser };
          }
        } catch (_sbErr) {
          // Ignore fallback error
        }

        setUser(null);
        return {
          success: false,
          isForbidden: true,
          error: err?.response?.data?.error || 'Account not authorized for owner access.',
        };
      }
    }

    // Fallback: If backend had a non-403 error (e.g. 500 or CORS), check active Supabase user
    try {
      const {
        data: { user: sbUser },
      } = await supabase.auth.getUser(accessToken);
      if (sbUser) {
        const fallbackUser = {
          id: sbUser.id,
          email: sbUser.email,
          full_name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Owner',
          role: 'owner',
          avatar_url: sbUser.user_metadata?.avatar_url || null,
        };
        setUser(fallbackUser);
        return { success: true, user: fallbackUser };
      }
    } catch (_sbErr) {
      setUser(null);
    }

    return { success: false, isForbidden: false, error: 'Session verification failed.' };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout').catch(() => null);
      await supabase.auth.signOut().catch(() => null);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  const isOwner = user?.role === 'owner';

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isOwner,
      isAdmin: isOwner,
      loading,
      loginWithGoogle,
      sendMagicLink,
      syncSession,
      logout,
      fetchUser,
    }),
    [user, isOwner, loading, loginWithGoogle, sendMagicLink, syncSession, logout, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
