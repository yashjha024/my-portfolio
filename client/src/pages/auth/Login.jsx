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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F0] p-4 selection:bg-[#171717] selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-[#E5E2DA] bg-white p-8 text-[#171717] shadow-sm"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E5E2DA] bg-[#FBFAF8] text-[#171717]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Admin Command Center</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            Secure, passwordless authentication for the product portfolio CMS
          </p>
        </div>

        {statusMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-600">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E5E2DA] bg-white px-4 py-3.5 font-medium text-[#171717] shadow-sm transition-colors hover:bg-[#FBFAF8] active:scale-[0.99]"
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
            <div className="w-full border-t border-[#E5E2DA]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-white px-3 font-semibold text-[#6B6B6B]">Or Magic Link OTP</span>
          </div>
        </div>

        {/* Magic Link Form */}
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]"
            >
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B6B]" />
              <input
                id="email"
                type="email"
                required
                placeholder="admin@portfolio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#E5E2DA] bg-[#FBFAF8] py-3 pl-10 pr-4 text-sm text-[#171717] placeholder-[#6B6B6B]/60 outline-none transition-all focus:border-[#171717] focus:bg-white focus:ring-1 focus:ring-[#171717]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingMagicLink}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-3.5 font-medium text-white shadow-sm transition-all hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMagicLink ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Send Passwordless Magic Link</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-[#E5E2DA] pt-6 text-center">
          <a
            href="/"
            className="text-xs text-[#6B6B6B] underline underline-offset-4 transition-colors hover:text-[#171717]"
          >
            ← Back to Public Portfolio
          </a>
        </div>
      </motion.div>
    </div>
  );
};
