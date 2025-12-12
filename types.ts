export enum AreaType {
  LIMITE_COMUNAL = 'Límite Comunal',
  ZONA_AGRICOLA = 'Zona Agrícola',
  ZONA_RIESGO = 'Zona de Riesgo',
  EQUIPAMIENTO = 'Equipamiento',
  OTROS = 'Otros'
}

// Mapeado a la tabla: sectores_geograficos
export interface SectorGeografico {
  id_sector: string; 
  nombre_sector: string;
  estado?: string;
  municipio?: string;
  parroquia?: string;
  geometria_poligono: string; // WKT o GeoJSON
  created_at?: string;
}

// Mapeado a tabla: viviendas_geoloc + comunidad
export interface ViviendaRecord {
  id_vivienda: string;
  latitud: number;
  longitud: number;
  riesgo_deslizamiento: boolean;
  material_paredes: string;
  // Datos unidos de Comunidad
  nombre_jefe?: string;
  num_miembros?: number;
  comunidad_asociada?: string; // Nombre del sector
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CommunityStats {
  name: string;
  state: string;
  municipality: string;
  parish: string;
  families: number;
  population: number;
}

// Interfaces para el servicio legacy de Google Sheets
export interface AreaRecord {
  ID_AREA?: string;
  COMUNIDAD_ASOCIADA?: string;
  NOMBRE_AREA?: string;
  TIPO_AREA?: string;
  GEOMETRIA_WKT?: string;
  ESTADO?: string;
  MUNICIPIO?: string;
  PARROQUIA?: string;
  [key: string]: any;
}

export interface HouseholdRecord {
  ID_HOGAR?: string;
  COORDENADA_LAT?: number;
  COORDENADA_LONG?: number;
  [key: string]: any;
}