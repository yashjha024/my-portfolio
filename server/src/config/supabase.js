import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { env } from './env.js';

dotenv.config();

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    '❌ FATAL: Supabase configuration (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) is missing. Cannot start server safely.'
  );
}

// Server-side Supabase client with strict admin/service-role credentials
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
