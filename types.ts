export enum AreaType {
  LIMITE_COMUNAL = 'Límite Comunal',
  ZONA_AGRICOLA = 'Zona Agrícola',
  ZONA_RIESGO = 'Zona de Riesgo',
  EQUIPAMIENTO = 'Equipamiento',
  OTROS = 'Otros'
}

export interface AreaRecord {
  ID_AREA: string; // Generated via crypto.randomUUID()
  COMUNIDAD_ASOCIADA: string;
  TIPO_AREA: AreaType;
  NOMBRE_AREA: string;
  GEOMETRIA_WKT: string; // The polygon string: POLYGON((x y, x y...))
  FECHA_ACTUALIZACION: string;
  USUARIO_WKT: string;
  // Nuevos campos geográficos
  ESTADO?: string;
  MUNICIPIO?: string;
  PARROQUIA?: string;
}

export interface HouseholdRecord {
  ID_HOGAR: string;
  FECHA_CENSO: string;
  USUARIO_APP: string;
  ESTADO: string;
  MUNICIPIO: string;
  PARROQUIA: string;
  COMUNIDAD: string;
  COORDENADA_LAT: number;
  COORDENADA_LONG: number;
  DIRECCION_REF: string;
  NOMBRE_JEFE_FAMILIA: string;
  NUM_MIEMBROS: number;
  TIPO_VIVIENDA: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CommunityStats {
  name: string;
  state: string;        // Estado
  municipality: string; // Municipio
  parish: string;       // Parroquia
  families: number;
  population: number;
}