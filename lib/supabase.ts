import { createClient } from '@supabase/supabase-js';

// Helper to get env vars safely across environments (Vite, Next, Node)
const getEnvVar = (keys: string[]): string => {
  // 1. Try import.meta.env (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const key of keys) {
      // @ts-ignore
      const val = import.meta.env[key];
      if (val) return val;
    }
  }

  // 2. Try process.env (Node/System/Webpack)
  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      const val = process.env[key];
      if (val) return val;
    }
  }

  return '';
};

// Keys to search for (Ordered by priority)
const URL_KEYS = [
  'VITE_SUPABASE_URL', 
  'NEXT_PUBLIC_SUPABASE_URL', 
  'cartografia_SUPABASE_URL', 
  'SUPABASE_URL'
];
const KEY_KEYS = [
  'VITE_SUPABASE_ANON_KEY', 
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'cartografia_SUPABASE_ANON_KEY', 
  'SUPABASE_ANON_KEY'
];

const supabaseUrl = getEnvVar(URL_KEYS);
const supabaseAnonKey = getEnvVar(KEY_KEYS);

// Fallback to avoid build crash if vars are missing during build time
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl) console.warn('⚠️ Supabase URL not found in environment variables. Checked: ', URL_KEYS.join(', '));

export const supabase = createClient(finalUrl, finalKey);