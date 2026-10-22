import crypto from 'crypto';
import net from 'net';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { escapeHtml } from '../utils/html.utils.js';

// Field limits (shared with the contact form in client/src/pages/public/Contact.jsx)
export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  subject: 150,
  purpose: 60,
  message: 5000,
};

// Single-line fields must not carry line breaks into the email subject/sender line
const singleLine = (value) => value.replace(/[\r\n\t]+/g, ' ').trim();

const contactSchema = z.object({
  name: z
    .string()
    .transform(singleLine)
    .pipe(
      z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(CONTACT_LIMITS.name, `Name must be at most ${CONTACT_LIMITS.name} characters`)
    ),
  email: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.email, 'Email address is too long')
    .email('Valid email is required'),
  subject: z
    .string()
    .transform(singleLine)
    .pipe(
      z
        .string()
        .min(3, 'Subject is required')
        .max(CONTACT_LIMITS.subject, `Subject must be at most ${CONTACT_LIMITS.subject} characters`)
    ),
  purpose: z
    .string()
    .transform(singleLine)
    .pipe(z.string().max(CONTACT_LIMITS.purpose, 'Purpose is too long'))
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(CONTACT_LIMITS.message, `Message must be at most ${CONTACT_LIMITS.message} characters`),
  honeypot: z.string().max(500).optional(),
});

const RESEND_KEY_PATTERN = /^re_[A-Za-z0-9_]{8,}$/;
const EMAIL_TIMEOUT_MS = 10_000;
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

/** Whether a usable Resend API key is configured (absent, placeholder or malformed keys are not). */
export const isEmailDeliveryConfigured = (apiKey = process.env.RESEND_API_KEY) =>
  RESEND_KEY_PATTERN.test(apiKey || '');

export const buildContactEmailHtml = ({ name, email, subject, message }) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E2DA; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #171717; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">New Portfolio Inquiry Received</h2>
          <div style="background-color: #f9f9f8; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; color: #444; font-size: 14px;"><strong>From:</strong> ${safeName} &lt;<a href="mailto:${safeEmail}" style="color: #2563eb;">${safeEmail}</a>&gt;</p>
            <p style="margin: 0; color: #444; font-size: 14px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          </div>
          <div style="padding: 16px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; text-transform: uppercase; font-weight: 600;">Message Content:</p>
            <p style="margin: 0; color: #171717; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
          <p style="font-size: 13px; color: #666; margin: 0;">💡 <strong>Tip:</strong> Click "Reply" in your email client to respond directly to ${safeName}.</p>
        </div>
      `;
};

/**
 * Send the owner notification. Never reports success unless Resend accepted the email.
 * @returns {Promise<{ status: 'sent' | 'failed' | 'not_configured', detail?: string }>}
 */
export const deliverContactEmail = async ({ name, email, subject, message }) => {
  if (!isEmailDeliveryConfigured()) {
    return { status: 'not_configured', detail: 'RESEND_API_KEY is missing or invalid' };
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
        to: [env.CONTACT_EMAIL || env.OWNER_EMAIL],
        reply_to: email,
        subject: `[Portfolio Inquiry] ${subject}`,
        html: buildContactEmailHtml({ name, email, subject, message }),
      }),
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        status: 'failed',
        detail: `Resend responded ${response.status} ${body.slice(0, 300)}`,
      };
    }
    return { status: 'sent' };
  } catch (err) {
    return { status: 'failed', detail: err?.message || 'Email request failed' };
  }
};

// In-process record of recent outcomes, so a retry is recognised even when the database lookup
// is unavailable. Keyed by a hash; message contents are not kept in memory.
const recentSubmissions = new Map();

const submissionKey = (email, message) =>
  crypto.createHash('sha256').update(`${email.toLowerCase()}\n${message}`).digest('hex');

const rememberSubmission = (key, outcome, now = Date.now()) => {
  for (const [storedKey, entry] of recentSubmissions) {
    if (now - entry.at > DUPLICATE_WINDOW_MS) recentSubmissions.delete(storedKey);
  }
  recentSubmissions.set(key, { ...outcome, at: now });
};

const recallSubmission = (key, now = Date.now()) => {
  const entry = recentSubmissions.get(key);
  if (!entry) return null;
  if (now - entry.at > DUPLICATE_WINDOW_MS) {
    recentSubmissions.delete(key);
    return null;
  }
  return entry;
};

export const resetContactSubmissionCache = () => recentSubmissions.clear();

const RESPONSES = {
  received: (extra = {}) => [
    200,
    {
      success: true,
      persisted: true,
      message: 'Thank you! Your message has been received.',
      ...extra,
    },
  ],
  emailedOnly: (extra = {}) => [
    202,
    {
      success: false,
      persisted: false,
      notified: true,
      code: 'CONTACT_NOT_STORED',
      message:
        'Your message reached me by email, but a copy could not be saved on the site. There is no need to resend it.',
      ...extra,
    },
  ],
  unavailable: () => [
    503,
    {
      success: false,
      persisted: false,
      notified: false,
      code: 'CONTACT_UNAVAILABLE',
      error:
        'Your message could not be sent right now. Please try again in a few minutes or email me directly.',
    },
  ],
};

const send = (res, [status, body]) => res.status(status).json(body);

export const submitContactForm = async (req, res, next) => {
  try {
    const parsed = contactSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors[0]?.message || 'Invalid contact form submission.',
        errors: parsed.error.errors,
      });
    }
    const data = parsed.data;

    // Spam check / Honeypot per PRD Section 9: pretend success, store and send nothing
    if (data.honeypot && data.honeypot.trim() !== '') {
      return send(res, RESPONSES.received());
    }

    const fullSubject = data.purpose ? `[${data.purpose}] ${data.subject}` : data.subject;
    const key = submissionKey(data.email, data.message);

    // Idempotency 1: a retry already handled by this process (works even if the database is down)
    const recalled = recallSubmission(key);
    if (recalled?.persisted) return send(res, RESPONSES.received({ deduplicated: true }));
    if (recalled?.notified) return send(res, RESPONSES.emailedOnly({ deduplicated: true }));

    // Idempotency 2: same email + message stored in the last five minutes
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
    const { data: existing, error: lookupError } = await supabase
      .from('contact_messages')
      .select('id')
      .eq('email', data.email)
      .eq('message', data.message)
      .gte('created_at', since)
      .limit(1);

    if (lookupError) {
      // Not treated as "no duplicate" silently: logged, and the in-process record above still
      // prevents repeat notifications for retries handled by this instance
      console.error('[CONTACT] Duplicate lookup failed; continuing without database dedupe:', {
        code: lookupError.code,
        message: lookupError.message,
      });
    } else if (existing && existing.length > 0) {
      rememberSubmission(key, { persisted: true, notified: true });
      return send(res, RESPONSES.received({ deduplicated: true }));
    }

    const ip = req.ip && net.isIP(req.ip) ? req.ip : null;
    const { data: stored, error: insertError } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: data.name,
          email: data.email,
          subject: fullSubject,
          message: data.message,
          status: 'new',
          ip_address: ip,
          user_agent: (req.get('User-Agent') || '').slice(0, 500) || null,
        },
      ])
      .select('id')
      .single();

    const persisted = !insertError && Boolean(stored?.id);
    if (!persisted) {
      console.error('[CONTACT] Failed to store contact message:', {
        code: insertError?.code,
        message: insertError?.message || 'no row returned',
      });
    }

    const delivery = await deliverContactEmail({
      name: data.name,
      email: data.email,
      subject: fullSubject,
      message: data.message,
    });
    const notified = delivery.status === 'sent';
    if (!notified) {
      // Missing email configuration in production is an operational error, not a soft warning
      const misconfiguredInProduction =
        delivery.status === 'not_configured' && process.env.NODE_ENV === 'production';
      const log = persisted && !misconfiguredInProduction ? console.warn : console.error;
      log('[CONTACT] Owner notification not sent:', {
        status: delivery.status,
        detail: delivery.detail,
        messageId: stored?.id || null,
      });
    }

    if (persisted) {
      rememberSubmission(key, { persisted: true, notified });
      return send(res, RESPONSES.received({ notified }));
    }
    if (notified) {
      rememberSubmission(key, { persisted: false, notified: true });
      return send(res, RESPONSES.emailedOnly());
    }
    return send(res, RESPONSES.unavailable());
  } catch (error) {
    next(error);
  }
};
