import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { loginWithGoogle, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoadingMagicLink(true);
    try {
      const res = await sendMagicLink(email);
      if (res && res.success) {
        setStatusMessage('Magic link sent! Check your email inbox to sign in instantly.');
      } else {
        setErrorMessage(res?.error || 'Failed to send magic link. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.error || err.message || 'Error sending magic link.');
    } finally {
      setLoadingMagicLink(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 selection:bg-indigo-500 selection:text-white">
      {/* Subtle glowing orb in background */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Command Center</h1>
          <p className="mt-1 text-sm text-slate-400">
            Secure, passwordless authentication for the product portfolio CMS
          </p>
        </div>

        {statusMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 font-medium text-slate-900 shadow-lg shadow-white/5 transition-colors hover:bg-slate-100 active:scale-[0.99]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.3 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.3-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14c0 2.4.6 4.6 1.6 6.6l3.7-2.8z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.2L1.6 15.9C3.5 19.7 7.4 23 12 23z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-slate-900 px-3 font-mono text-slate-500">Or Magic Link OTP</span>
          </div>
        </div>

        {/* Magic Link Form */}
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-mono text-xs uppercase tracking-wider text-slate-400"
            >
              Work Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yashjha024@gmail.com"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingMagicLink}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMagicLink ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Sending Link...
              </span>
            ) : (
              <>
                <span>Send Passwordless Magic Link</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/80 pt-6 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 underline underline-offset-4 transition-colors hover:text-white"
          >
            ← Back to Public Portfolio
          </a>
        </div>
      </motion.div>
    </div>
  );
};
