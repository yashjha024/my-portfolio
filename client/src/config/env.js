/**
 * Client Environment Validation & Export Module.
 * Ensures required VITE_* configuration keys are present for Supabase and API connections.
 */
const validateClientEnv = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[ENV WARNING] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Some auth or live features may fall back to REST API.'
    );
  }

  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    API_URL: apiUrl,
    GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
    IS_PROD: import.meta.env.PROD || false,
  };
};

export const env = validateClientEnv();
