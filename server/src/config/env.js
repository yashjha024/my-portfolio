import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const MIN_JWT_SECRET_LENGTH = 32;
const MAX_TRUST_PROXY_HOPS = 5;
const PLACEHOLDER_SECRET_PATTERN =
  /change_in_production|generate_a_random|fallback_secret|your_jwt/i;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Normalize a configured origin to `scheme://host[:port]`, rejecting wildcards, paths and non-http(s) schemes.
 */
const parseOrigin = (value, name) => {
  const raw = (value || '').trim().replace(/^['"]|['"]$/g, '');
  if (raw.includes('*')) {
    throw new Error(
      `FATAL: ${name} must list exact origins; wildcards are not allowed ("${raw}").`
    );
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`FATAL: ${name} contains an invalid origin ("${raw}").`);
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    (url.pathname !== '/' && url.pathname !== '')
  ) {
    throw new Error(`FATAL: ${name} must be a bare http(s) origin without a path ("${raw}").`);
  }
  return url.origin.toLowerCase();
};

const parseTrustProxyHops = (value) => {
  const raw = (value ?? '').toString().trim();
  if (raw === '') return 0;
  if (!/^\d+$/.test(raw) || Number(raw) > MAX_TRUST_PROXY_HOPS) {
    throw new Error(
      `FATAL: TRUST_PROXY_HOPS must be an integer between 0 and ${MAX_TRUST_PROXY_HOPS} ("${raw}").`
    );
  }
  return Number(raw);
};

export const validateEnv = (source = process.env) => {
  const supabaseUrl = source.SUPABASE_URL;
  const supabaseServiceKey = source.SUPABASE_SERVICE_ROLE_KEY;
  const ownerEmail = source.OWNER_EMAIL;
  const isProduction = source.NODE_ENV === 'production';

  if (!supabaseUrl || !supabaseServiceKey || !ownerEmail) {
    throw new Error(
      'FATAL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OWNER_EMAIL are required. Public client keys are not valid server credentials.'
    );
  }

  // Draft preview tokens are signed with JWT_SECRET; production must never sign with a known value
  const jwtSecret = source.JWT_SECRET || '';
  if (
    isProduction &&
    (jwtSecret.length < MIN_JWT_SECRET_LENGTH || PLACEHOLDER_SECRET_PATTERN.test(jwtSecret))
  ) {
    throw new Error(
      `FATAL: JWT_SECRET must be a random value of at least ${MIN_JWT_SECRET_LENGTH} characters in production.`
    );
  }

  // CLIENT_URL is the public site origin; the SPA calls /api on that same origin via the Vercel rewrite
  if (isProduction && !source.CLIENT_URL) {
    throw new Error('FATAL: CLIENT_URL (the public site origin) is required in production.');
  }
  const clientOrigin = parseOrigin(source.CLIENT_URL || 'http://localhost:5173', 'CLIENT_URL');
  const extraOrigins = (source.ALLOWED_ORIGINS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => parseOrigin(entry, 'ALLOWED_ORIGINS'));
  const allowedOrigins = [...new Set([clientOrigin, ...extraOrigins])];

  if (isProduction) {
    const insecure = allowedOrigins.filter((origin) => {
      const { protocol, hostname } = new URL(origin);
      return protocol !== 'https:' || LOCAL_HOSTS.has(hostname);
    });
    if (insecure.length > 0) {
      throw new Error(
        `FATAL: Production origins must be public https origins; remove: ${insecure.join(', ')}`
      );
    }
  }

  const cleanEmail = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/^['"]|['"]$/g, '')
      .trim();

  return {
    PORT: source.PORT || 5000,
    NODE_ENV: source.NODE_ENV || 'development',
    CLIENT_URL: clientOrigin,
    ALLOWED_ORIGINS: allowedOrigins,
    TRUST_PROXY_HOPS: parseTrustProxyHops(source.TRUST_PROXY_HOPS),
    JWT_SECRET: jwtSecret,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
    OWNER_EMAIL: cleanEmail(ownerEmail),
    CONTACT_EMAIL: cleanEmail(source.CONTACT_EMAIL || ownerEmail),
    RESEND_API_KEY: source.RESEND_API_KEY || '',
  };
};

export const env = validateEnv();
