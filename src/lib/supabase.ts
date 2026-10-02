import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = 'https://irhqcroczvdkytvvsico.supabase.co';
const defaultKey = 'sb_publishable_iecSD9eU8wwGFllUWzmZng_yYam5hag';

export function resolveSupabaseCredentials() {
  const urlCandidates = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_URL,
  ];

  const keyCandidates = [
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
  ];

  // A valid URL starts with http:// or https://
  let url = urlCandidates.find(
    (val): val is string => typeof val === 'string' && /^https?:\/\//i.test(val.trim())
  )?.trim();

  // If one of the key variables was accidentally set to the URL:
  if (!url) {
    url = keyCandidates.find(
      (val): val is string => typeof val === 'string' && /^https?:\/\//i.test(val.trim())
    )?.trim();
  }

  if (!url) {
    url = defaultUrl;
  }

  // A valid key does NOT start with http, and has meaningful length
  let key = keyCandidates.find(
    (val): val is string => typeof val === 'string' && val.trim().length > 10 && !/^https?:\/\//i.test(val.trim())
  )?.trim();

  // If one of the URL variables was accidentally set to the key:
  if (!key) {
    key = urlCandidates.find(
      (val): val is string => typeof val === 'string' && val.trim().length > 10 && !/^https?:\/\//i.test(val.trim())
    )?.trim();
  }

  if (!key) {
    key = defaultKey;
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseAnonKey } = resolveSupabaseCredentials();

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
