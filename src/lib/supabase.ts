import { createClient } from '@supabase/supabase-js';

// Fallback to the user-provided credentials if environment variables are not set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://irhqcroczvdkytvvsico.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iecSD9eU8wwGFllUWzmZng_yYam5hag';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
