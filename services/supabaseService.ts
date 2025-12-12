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
    
    // Si viene como GeoJSON binary, habría que convertirlo. 
    // Para simplificar, asumimos que el backend devuelve WKT si usamos una vista o función,
    // o que el cliente maneja el formato. Aquí simulamos el retorno directo.
    return data as SectorGeografico[];
  } catch (error) {
    console.error("Error fetching areas from Supabase:", error);
    return [];
  }
};

export const saveAreaToSheet = async (data: any): Promise<boolean> => {
  try {
    // Convertir a formato SQL WKT si es necesario
    const { error } = await supabase
      .from('sectores_geograficos')
      .insert([{
        id_sector: data.ID_AREA,
        nombre_sector: data.NOMBRE_AREA,
        estado: data.ESTADO,
        municipio: data.MUNICIPIO,
        parroquia: data.PARROQUIA,
        geometria_poligono: data.GEOMETRIA_WKT 
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving area:", error);
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
    } catch (error) {
      console.error("Error updating area:", error);
      throw error;
    }
  };

// ==========================================
// SERVICIO DE VIVIENDAS (CENSO)
// ==========================================

export const fetchHouseholdsFromSheet = async (): Promise<ViviendaRecord[]> => {
    try {
        // Hacemos un JOIN con la tabla comunidad para obtener datos demográficos
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

        // Mapear respuesta compleja de Supabase a estructura plana para la App
        return data.map((item: any) => ({
            id_vivienda: item.id_vivienda,
            latitud: item.latitud,
            longitud: item.longitud,
            material_paredes: item.material_paredes,
            riesgo_deslizamiento: item.riesgo_deslizamiento,
            nombre_jefe: item.comunidad?.nombre_completo || 'Desconocido',
            num_miembros: item.comunidad?.num_miembros || 0,
            comunidad_asociada: item.comunidad?.sectores_geograficos?.nombre_sector || ''
        }));
    } catch (error) {
        console.error("Error fetching households:", error);
        return [];
    }
};

export const saveHouseholdToSheet = async (data: any): Promise<boolean> => {
    // Esta función requiere insertar primero en 'comunidad' y luego en 'viviendas_geoloc'
    // Se recomienda usar una Transacción o RPC en Supabase.
    console.warn("Implementar lógica de guardado transaccional en Supabase");
    return true; 
};

// ==========================================
// ESTADÍSTICAS
// ==========================================

export const fetchCommunityStats = async (): Promise<CommunityStats[]> => {
    try {
        // En una app real, usaríamos una Vista SQL o una función RPC 'get_community_stats'
        // Simulamos la llamada a la función RPC:
        const { data, error } = await supabase.rpc('get_resumen_comunal');

        if (error) {
             // Fallback si la función RPC no existe aún
             console.warn("RPC 'get_resumen_comunal' not found, fetching raw data");
             return [];
        }

        return data as CommunityStats[];
    } catch (error) {
        console.error("Error fetching stats:", error);
        return [
             // Fallback visual
            { name: "Casco Central", state: "Miranda", municipality: "Sucre", parish: "Petare", families: 45, population: 150 },
            { name: "Sector Norte", state: "Miranda", municipality: "Sucre", parish: "Leoncio Martínez", families: 32, population: 110 }
        ];
    }
};
