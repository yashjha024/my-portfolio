import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { supabase } from '../config/supabase.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data && data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
    } catch (_error) {
      // Server verification is the authority for owner access. A local Supabase
      // session never grants a role while the API is unavailable.
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const loginWithGoogle = async () => {
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
  };

  const sendMagicLink = async (email) => {
    try {
      const { data } = await api.post('/auth/magic-link', { email });
      return data;
    } catch (err) {
      return {
        success: false,
        error: err?.response?.data?.error || err.message || 'Error sending magic link.',
      };
    }
  };

  const syncSession = async (accessToken, refreshToken) => {
    try {
      const { data } = await api.post('/auth/session', {
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (data && data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.warn('Backend syncSession failed:', err.message);
      setUser(null);
    }
    return null;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => null);
      await supabase.auth.signOut().catch(() => null);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isOwner = user?.role === 'owner';

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
