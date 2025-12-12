import { createClient } from '@supabase/supabase-js';

// Robust environment variable retrieval for Vite/Vercel/Node environments
const getEnv = (keys: string[]) => {
  // 1. Try import.meta.env (Vite client)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      for (const key of keys) {
        // @ts-ignore
        if (import.meta.env[key]) return import.meta.env[key];
      }
    }
  } catch (e) {}

  // 2. Try process.env (Node/Vercel/Polyfilled)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      for (const key of keys) {
        // @ts-ignore
        if (process.env[key]) return process.env[key];
      }
    }
  } catch (e) {}

  return '';
};

// Search for VITE (standard), NEXT_PUBLIC (Vercel/Next), or plain (Node) keys
const supabaseUrl = getEnv(['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']);
const supabaseAnonKey = getEnv(['VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials missing. Check environment variables.");
  console.warn("Looking for VITE_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_URL");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);