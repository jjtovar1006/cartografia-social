import { supabase } from '../lib/supabase';
import { SectorGeografico, ViviendaRecord, CommunityStats } from '../types';
import { pointsToWKT, wktToPoints } from '../utils/geoUtils';

// ==========================================
// SERVICIO DE SECTORES (POLÍGONOS)
// ==========================================

export const fetchAreasFromSheet = async (): Promise<SectorGeografico[]> => {
  try {
    const { data, error } = await supabase
      .from('sectores_geograficos')
      .select('*');

    if (error) throw error;
    
    return data as SectorGeografico[];
  } catch (error: any) {
    console.error("Error fetching areas from Supabase:", JSON.stringify(error, null, 2));
    return [];
  }
};

export const saveAreaToSheet = async (data: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sectores_geograficos')
      .insert([{
        // Mapeo exacto a las columnas SQL creadas
        id_sector: data.ID_AREA,
        nombre_sector: data.NOMBRE_AREA,
        estado: data.ESTADO,
        municipio: data.MUNICIPIO,
        parroquia: data.PARROQUIA,
        geometria_poligono: data.GEOMETRIA_WKT 
      }]);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error saving area:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export const updateAreaInSheet = async (data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sectores_geograficos')
        .update({
            nombre_sector: data.NOMBRE_AREA,
            estado: data.ESTADO,
            municipio: data.MUNICIPIO,
            parroquia: data.PARROQUIA,
            geometria_poligono: data.GEOMETRIA_WKT
        })
        .eq('id_sector', data.ID_AREA);
  
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error updating area:", JSON.stringify(error, null, 2));
      throw error;
    }
  };

// ==========================================
// SERVICIO DE VIVIENDAS (CENSO)
// ==========================================

export const fetchHouseholdsFromSheet = async (): Promise<ViviendaRecord[]> => {
    try {
        // JOIN entre viviendas_geoloc -> comunidad -> sectores_geograficos
        const { data, error } = await supabase
            .from('viviendas_geoloc')
            .select(`
                id_vivienda,
                latitud,
                longitud,
                material_paredes,
                riesgo_deslizamiento,
                comunidad (
                    nombre_completo,
                    num_miembros,
                    sectores_geograficos ( nombre_sector )
                )
            `);

        if (error) throw error;

        // Mapear respuesta anidada a estructura plana
        // Nota: Si 'comunidad' o 'sectores_geograficos' es null, usamos valores por defecto
        return (data || []).map((item: any) => ({
            id_vivienda: item.id_vivienda,
            latitud: item.latitud,
            longitud: item.longitud,
            material_paredes: item.material_paredes,
            riesgo_deslizamiento: item.riesgo_deslizamiento,
            nombre_jefe: item.comunidad?.nombre_completo || 'Desconocido',
            num_miembros: item.comunidad?.num_miembros || 0,
            comunidad_asociada: item.comunidad?.sectores_geograficos?.nombre_sector || ''
        }));
    } catch (error: any) {
        console.error("Error fetching households:", JSON.stringify(error, null, 2));
        return [];
    }
};

export const saveHouseholdToSheet = async (data: any): Promise<boolean> => {
    console.warn("La escritura de hogares requiere lógica compleja (insertar comunidad primero). Pendiente de implementar en UI.");
    return true; 
};

// ==========================================
// ESTADÍSTICAS
// ==========================================

export const fetchCommunityStats = async (): Promise<CommunityStats[]> => {
    try {
        // Llamada a la función RPC 'get_resumen_comunal' definida en SQL
        const { data, error } = await supabase.rpc('get_resumen_comunal');

        if (error) {
             console.warn("Error calling RPC 'get_resumen_comunal':", JSON.stringify(error, null, 2));
             return [];
        }

        return data as CommunityStats[];
    } catch (error: any) {
        console.error("Error fetching stats:", JSON.stringify(error, null, 2));
        return [];
    }
};
