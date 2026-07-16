import dotenv from 'dotenv';

dotenv.config();

const validateEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!supabaseUrl || !supabaseServiceKey || !ownerEmail) {
    throw new Error(
      'FATAL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OWNER_EMAIL are required. Public client keys are not valid server credentials.'
    );
  }

  return {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
    OWNER_EMAIL: ownerEmail.toLowerCase(),
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || ownerEmail,
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  };
};

export const env = validateEnv();
