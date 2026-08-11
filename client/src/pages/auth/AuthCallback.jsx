import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { syncSession, fetchUser } = useAuth();
  const [error, setError] = useState(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let active = true;

    const processSession = async (session) => {
      if (!session?.access_token || handledRef.current) return false;
      handledRef.current = true;

      const res = await syncSession(session.access_token, session.refresh_token);
      if (res?.success) {
        navigate('/admin', { replace: true });
        return true;
      }

      if (res?.isForbidden) {
        await supabase?.auth?.signOut()?.catch(() => null);
        if (active) {
          const rejectedEmail = session.user?.email ? ` (${session.user.email})` : '';
          setError(`Access Denied: Account${rejectedEmail} is not authorized for owner access.`);
        }
        return false;
      }

      // If temporary backend error (non-403), proceed if Supabase session is active
      navigate('/admin', { replace: true });
      return true;
    };

    const handleCallback = async () => {
      try {
        // If URL contains PKCE ?code= parameter, exchange it for session explicitly
        if (window.location.search.includes('code=')) {
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get('code');
          if (code && supabase) {
            const { data, error: exchangeError } = await supabase.auth
              .exchangeCodeForSession(code)
              .catch(() => ({ data: null, error: null }));
            if (data?.session) {
              const done = await processSession(data.session);
              if (done) return;
            }
            if (exchangeError) {
              console.warn('PKCE code exchange note:', exchangeError.message);
            }
          }
        }

        // First check active Supabase auth session from URL or storage
        if (supabase) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.warn('Session check note:', sessionError.message);
          }

          if (session?.access_token) {
            const done = await processSession(session);
            if (done) return;
          }
        }

        // Listen for auth state change event (e.g., hash token parsing by Supabase JS)
        let authSubscription = null;
        if (supabase) {
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (
                (event === 'SIGNED_IN' ||
                  event === 'TOKEN_REFRESHED' ||
                  event === 'INITIAL_SESSION') &&
                newSession?.access_token
              ) {
                await processSession(newSession);
              }
            }
          );
          authSubscription = authListener?.subscription;
        }

        // Timeout fallback after 4 seconds
        const timeoutId = setTimeout(async () => {
          if (!handledRef.current && active) {
            const userProfile = await fetchUser();
            if (userProfile) {
              handledRef.current = true;
              navigate('/admin', { replace: true });
            } else {
              setError('Access Denied: Session verification failed or email unauthorized.');
            }
          }
        }, 4000);

        return () => {
          clearTimeout(timeoutId);
          authSubscription?.unsubscribe();
        };
      } catch (err) {
        console.error('Auth callback processing error:', err);
        if (active) {
          await supabase?.auth?.signOut()?.catch(() => null);
          setError(err.message || 'Failed to complete authentication. Please try again.');
        }
      }
    };

    const cleanupPromise = handleCallback();

    return () => {
      active = false;
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [navigate, syncSession, fetchUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F0] p-4 selection:bg-[#171717] selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-[#E5E2DA] bg-white p-8 text-center text-[#171717] shadow-sm"
      >
        {error ? (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-bold tracking-tight text-[#171717]">Access Denied</h2>
            <p className="mb-6 text-sm leading-relaxed text-rose-600">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-3.5 font-medium text-white shadow-sm transition-all hover:bg-black active:scale-[0.99]"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E5E2DA] bg-[#FBFAF8] text-[#171717]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mb-1 text-xl font-bold tracking-tight text-[#171717]">
              Verifying Credentials
            </h2>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#6B6B6B]">
              <Loader2 className="h-4 w-4 animate-spin text-[#171717]" />
              <span>Establishing secure session...</span>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};
