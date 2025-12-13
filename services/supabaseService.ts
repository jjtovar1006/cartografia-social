import { supabase } from '../lib/supabase';
import { SectorGeografico, ViviendaRecord, CommunityStats } from '../types';

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
    // Extraemos el mensaje real del error para mostrarlo en consola
    const msg = error.message || JSON.stringify(error);
    console.error(`Error Supabase (Areas): ${msg}`);
    return [];
  }
};

export const saveAreaToSheet = async (data: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sectores_geograficos')
      .insert([{
        id_sector: data.ID_AREA,
        nombre_sector: data.NOMBRE_AREA,
        tipo_area: data.TIPO_AREA, // Campo añadido
        estado: data.ESTADO,
        municipio: data.MUNICIPIO,
        parroquia: data.PARROQUIA,
        geometria_poligono: data.GEOMETRIA_WKT 
      }]);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error(`Error Guardando Area: ${error.message || JSON.stringify(error)}`);
    throw error;
  }
};

export const updateAreaInSheet = async (data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sectores_geograficos')
        .update({
            nombre_sector: data.NOMBRE_AREA,
            tipo_area: data.TIPO_AREA, // Campo añadido
            estado: data.ESTADO,
            municipio: data.MUNICIPIO,
            parroquia: data.PARROQUIA,
            geometria_poligono: data.GEOMETRIA_WKT
        })
        .eq('id_sector', data.ID_AREA);
  
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error(`Error Actualizando Area: ${error.message || JSON.stringify(error)}`);
      throw error;
    }
  };

// ==========================================
// SERVICIO DE VIVIENDAS (CENSO)
// ==========================================

export const fetchHouseholdsFromSheet = async (): Promise<ViviendaRecord[]> => {
    try {
        // CORRECCIÓN: La tabla comunidad tiene 'nombre' y 'apellido', no 'nombre_completo'.
        const { data, error } = await supabase
            .from('viviendas_geoloc')
            .select(`
                id_vivienda,
                latitud,
                longitud,
                material_paredes,
                riesgo_deslizamiento,
                comunidad (
                    nombre,
                    apellido,
                    sectores_geograficos ( nombre_sector )
                )
            `);

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id_vivienda: item.id_vivienda,
            latitud: item.latitud,
            longitud: item.longitud,
            material_paredes: item.material_paredes,
            riesgo_deslizamiento: item.riesgo_deslizamiento,
            // Concatenamos el nombre manualmente
            nombre_jefe: item.comunidad 
                ? `${item.comunidad.nombre || ''} ${item.comunidad.apellido || ''}`.trim() 
                : 'Desconocido',
            // Asignamos 0 porque num_miembros no parece estar en la tabla comunidad actual
            num_miembros: 0,
            comunidad_asociada: item.comunidad?.sectores_geograficos?.nombre_sector || ''
        }));
    } catch (error: any) {
        console.error(`Error Supabase (Hogares): ${error.message || JSON.stringify(error)}`);
        return [];
    }
};

export const saveHouseholdToSheet = async (data: any): Promise<boolean> => {
    console.warn("Funcionalidad de guardar hogares pendiente de implementación en UI.");
    return true; 
};

// ==========================================
// ESTADÍSTICAS
// ==========================================

export const fetchCommunityStats = async (): Promise<CommunityStats[]> => {
    try {
        const { data, error } = await supabase.rpc('get_resumen_comunal');

        if (error) {
             console.warn(`Error RPC Stats: ${error.message}`);
             return [];
        }

        return data as CommunityStats[];
    } catch (error: any) {
        console.error(`Error Fetching Stats: ${error.message}`);
        return [];
    }
};