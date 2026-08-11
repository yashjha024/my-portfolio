import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
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

  const cleanEmail = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/^['"]|['"]$/g, '')
      .trim();

  return {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
    OWNER_EMAIL: cleanEmail(ownerEmail),
    CONTACT_EMAIL: cleanEmail(process.env.CONTACT_EMAIL || ownerEmail),
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  };
};

export const env = validateEnv();
