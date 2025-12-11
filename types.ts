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