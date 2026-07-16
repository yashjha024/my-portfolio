import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { syncSession, fetchUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        // If URL contains PKCE ?code= parameter, exchange it for session explicitly
        if (window.location.search.includes('code=')) {
          const { error: exchangeError } = await supabase.auth
            .exchangeCodeForSession(window.location.href)
            .catch(() => ({ error: null }));
          if (exchangeError) {
            console.warn('PKCE code exchange note:', exchangeError.message);
          }
        }

        // First check active Supabase auth session from URL or storage
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Session check note:', sessionError.message);
        }

        if (session?.access_token) {
          await syncSession(session.access_token, session.refresh_token);
          if (mounted) {
            navigate('/admin', { replace: true });
          }
          return;
        }

        // Listen for auth state change event (e.g., hash token parsing by Supabase JS)
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (
              event === 'SIGNED_IN' ||
              event === 'TOKEN_REFRESHED' ||
              event === 'INITIAL_SESSION'
            ) {
              if (newSession?.access_token) {
                await syncSession(newSession.access_token, newSession.refresh_token);
                if (mounted) {
                  navigate('/admin', { replace: true });
                }
              }
            }
          }
        );

        // Timeout fallback after 4 seconds
        const timeoutId = setTimeout(async () => {
          if (mounted) {
            const userProfile = await fetchUser();
            if (userProfile) {
              navigate('/admin', { replace: true });
            } else {
              setError('Session verification timed out. Please try logging in again.');
            }
          }
        }, 4500);

        return () => {
          clearTimeout(timeoutId);
          authListener?.subscription?.unsubscribe();
        };
      } catch (err) {
        console.error('Auth callback processing error:', err);
        if (mounted) {
          setError(err.message || 'Failed to complete authentication. Please try again.');
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, syncSession, fetchUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl">
        {error ? (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">Authentication Error</h2>
            <p className="mb-6 text-sm text-slate-400">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 inline-flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">Verifying Credentials</h2>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Establishing secure session...</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
