import { createClient } from '@supabase/supabase-js';

// Usamos las credenciales proporcionadas directamente para asegurar la conexión
// En producción, esto debería venir de variables de entorno (import.meta.env)
const SUPABASE_URL = "https://cafbwinxctjqjsheqcfj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZmJ3aW54Y3RqcWpzaGVxY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTIwMzgsImV4cCI6MjA4MTEyODAzOH0.KCiZvRmEfCEW1uQOCzQOcArWBOp6ltlNM6eRgfM2xhY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
