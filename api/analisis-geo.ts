import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // BLOQUE 3: API DE CONEXIÓN
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Safe environment access for Vercel Function (Node.js)
  // We explicitly check for the specific project prefix 'cartografia_' as well as standard keys
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      process.env.cartografia_SUPABASE_URL;

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                             process.env.SUPABASE_SECRET_KEY || 
                             process.env.cartografia_SUPABASE_SERVICE_ROLE_KEY ||
                             process.env.cartografia_SUPABASE_SECRET_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase Environment Variables in Server Function");
      console.error("Available Keys:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
      return res.status(500).json({ error: "Server Configuration Error: Missing Database Credentials" });
  }

  // Cliente Supabase del lado del servidor (Service Role)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { token, polygon_geojson } = req.body;

    // 1. Validar Token (Simulado)
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    // 2. Ejecutar consulta geoespacial ST_Contains
    // Esta consulta cuenta cuántas viviendas caen DENTRO del polígono enviado
    const { data, error } = await supabase.rpc('analisis_territorial_agregado', { 
        geo_input: polygon_geojson 
    });

    if (error) throw error;

    return res.status(200).json({
        success: true,
        data: data
    });

  } catch (error: any) {
    console.error('Geo Analysis Error:', error);
    return res.status(500).json({ error: error.message });
  }
}