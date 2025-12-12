import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase del lado del servidor (Service Role para permisos elevados si necesario)
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // BLOQUE 3: API DE CONEXIÓN
  // Recibe token y polígono GeoJSON
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    /**
     * NOTA: Debes crear esta función en Supabase SQL Editor:
     * 
     * CREATE OR REPLACE FUNCTION analisis_territorial_agregado(geo_input JSONB)
     * RETURNS TABLE(total_viviendas BIGINT, poblacion_estimada BIGINT) AS $$
     * BEGIN
     *   RETURN QUERY
     *   SELECT 
     *     COUNT(v.id_vivienda),
     *     SUM(c.num_miembros)
     *   FROM viviendas_geoloc v
     *   JOIN comunidad c ON v.id_propietario = c.id_persona
     *   WHERE ST_Contains(
     *     ST_GeomFromGeoJSON(geo_input), 
     *     v.geog
     *   );
     * END;
     * $$ LANGUAGE plpgsql;
     */

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