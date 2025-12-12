import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in various environments (Vite, Node, etc.)
const getEnvVar = (key: string): string => {
  // Try Vite's import.meta.env
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
       // @ts-ignore
       return import.meta.env[key];
    }
  } catch (e) {}

  // Try Node's process.env
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
       // @ts-ignore
       return process.env[key];
    }
  } catch (e) {}

  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials missing. Please check your .env file or environment variables.");
  console.warn("Expected variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY");
}

// Initialize Supabase client
// We provide fallback placeholders to prevent the client initialization from crashing immediately if keys are missing.
// This allows the app to render the UI (and likely show connection errors) instead of crashing with a white screen.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);