import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { syncSession, fetchUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const processSession = async (session) => {
      if (!session?.access_token) return false;
      const user = await syncSession(session.access_token, session.refresh_token);
      if (user) {
        if (mounted) navigate('/admin', { replace: true });
        return true;
      }
      // If server rejected the session (unauthorized email)
      await supabase.auth.signOut().catch(() => null);
      if (mounted) {
        const rejectedEmail = session.user?.email ? ` (${session.user.email})` : '';
        setError(`Access Denied: Account${rejectedEmail} is not authorized for owner access.`);
      }
      return false;
    };

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
          const success = await processSession(session);
          if (success) return;
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
                await processSession(newSession);
              }
            }
          }
        );

        // Timeout fallback after 4.5 seconds
        const timeoutId = setTimeout(async () => {
          if (mounted && !error) {
            const userProfile = await fetchUser();
            if (userProfile) {
              navigate('/admin', { replace: true });
            } else {
              setError('Access Denied: Session verification failed or email unauthorized.');
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
          await supabase.auth.signOut().catch(() => null);
          setError(err.message || 'Failed to complete authentication. Please try again.');
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, syncSession, fetchUser, error]);

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
