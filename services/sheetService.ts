import { AreaRecord, CommunityStats } from '../types';

// URL del Script de Google Apps (Capa de Persistencia)
// Esta URL se usa como respaldo si la API de Vercel no está disponible localmente.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-XbyZKagUuqLYo6BAo6KtzpKd2eCtEb2s_2lTp471Sexh8psqWf-coORQtlT4oKPm/exec";

// Endpoints Locales (Vercel Functions)
const API_BASE_POLIGONO = '/api/poligono';
const API_STATS = '/api/stats';

/**
 * Función para llamar directamente al Google Apps Script desde el navegador.
 * Se usa cuando el entorno no tiene las Serverless Functions activas (ej: Vite local).
 */
const callScriptDirectly = async (params: Record<string, any>, method: 'GET' | 'POST' = 'GET'): Promise<any> => {
    let url = APPS_SCRIPT_URL;
    let options: RequestInit = {
        method: method,
    };

    if (method === 'GET') {
        const queryParams = new URLSearchParams(params).toString();
        url = `${APPS_SCRIPT_URL}?${queryParams}`;
    } else {
        // TRUCO CLAVE: Google Apps Script maneja mejor las peticiones POST desde navegadores
        // si el Content-Type es text/plain, evitando la pre-verificación OPTIONS (CORS strict).
        options.body = JSON.stringify(params);
        options.headers = {
            'Content-Type': 'text/plain;charset=utf-8',
        };
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
             throw new Error(`Error en Script Directo: ${response.status}`);
        }
        const text = await response.text();
        // Si el script devuelve vacío, asumimos éxito en operaciones de escritura
        if (!text.trim()) return { success: true };
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.warn("Respuesta no-JSON del script:", text.substring(0, 50));
            // A veces Google devuelve HTML de login o error
            throw new Error("Respuesta inválida del script (posiblemente HTML/Login)");
        }
    } catch (error) {
        console.error("Fallo en la llamada directa al script:", error);
        throw error;
    }
};

/**
 * Gestor de peticiones con estrategia de respaldo (Fallback).
 * 1. Intenta llamar a la API local (/api/...).
 * 2. Si falla (404, Red, o JSON inválido), llama directamente al Google Script.
 */
const requestWithFallback = async (endpoint: string, params: Record<string, any>, method: 'GET' | 'POST' | 'PUT' = 'GET'): Promise<any> => {
    try {
        // Intento 1: API Local
        let url = endpoint;
        let options: RequestInit = {
             method: method,
             headers: { 'Content-Type': 'application/json' }
        };
        
        if (method !== 'GET') {
            options.body = JSON.stringify(params);
        }

        const response = await fetch(url, options);

        // Si devuelve 404, es probable que estemos en local (Vite) sin backend corriendo.
        if (response.status === 404) {
             throw new Error('API_NOT_FOUND');
        }
        
        if (!response.ok) {
             throw new Error(`Server Error ${response.status}`);
        }

        const text = await response.text();
        // Si devuelve HTML (ej: index.html de Vite), JSON.parse fallará
        return text ? JSON.parse(text) : null;

    } catch (error: any) {
        // Intento 2: Fallback a Conexión Directa
        const isFallbackNeeded = 
            error.message === 'API_NOT_FOUND' || 
            error.name === 'TypeError' || 
            error instanceof SyntaxError;

        if (isFallbackNeeded) { 
             console.log(`⚠️ Sincronización Local: API no disponible (${endpoint}). Conectando directo a Google Sheets...`);
             
             // Determinar la acción basada en el endpoint
             const action = endpoint.includes('stats') ? 'stats' : 
                            endpoint.includes('listar') ? 'listar' : 
                            endpoint.includes('crear') ? 'crear' : 
                            endpoint.includes('actualizar') ? 'actualizar' : null;

             if (action) {
                 const scriptMethod = method === 'GET' ? 'GET' : 'POST';
                 try {
                    const result = await callScriptDirectly({ ...params, action }, scriptMethod);
                    return result;
                 } catch (fallbackError) {
                    console.error("El fallback también falló:", fallbackError);
                    throw fallbackError;
                 }
             }
        }
        throw error;
    }
}

/**
 * Obtener estadísticas de comunidades con datos demo enriquecidos.
 */
export const fetchCommunityStats = async (): Promise<CommunityStats[]> => {
  try {
    const data = await requestWithFallback(API_STATS, {}, 'GET');
    if (Array.isArray(data)) {
        return data as CommunityStats[];
    }
    return [];
  } catch (error) {
    console.warn("Error obteniendo stats, usando datos demo.", error);
    // Datos Demo Enriquecidos con Geografía
    return [
        { 
            name: "Casco Central", 
            state: "Miranda", 
            municipality: "Sucre", 
            parish: "Petare", 
            families: 45, 
            population: 150 
        },
        { 
            name: "Sector Norte", 
            state: "Miranda", 
            municipality: "Sucre", 
            parish: "Leoncio Martínez", 
            families: 32, 
            population: 110 
        },
        { 
            name: "La Candelaria", 
            state: "Distrito Capital", 
            municipality: "Libertador", 
            parish: "La Candelaria", 
            families: 60, 
            population: 210 
        }
    ];
  }
};

export const saveAreaToSheet = async (data: AreaRecord): Promise<boolean> => {
  try {
    await requestWithFallback(`${API_BASE_POLIGONO}/crear`, data, 'POST');
    return true;
  } catch (error) {
    console.error("Failed to save area:", error);
    throw error;
  }
};

export const fetchAreasFromSheet = async (): Promise<AreaRecord[]> => {
  try {
    const data = await requestWithFallback(`${API_BASE_POLIGONO}/listar`, {}, 'GET');
    if (Array.isArray(data)) {
      return data as AreaRecord[];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch areas:", error);
    return [];
  }
};

export const updateAreaInSheet = async (data: Partial<AreaRecord> & { ID_AREA: string }): Promise<boolean> => {
  try {
    await requestWithFallback(`${API_BASE_POLIGONO}/actualizar`, data, 'PUT');
    return true;
  } catch (error) {
    console.error("Failed to update area:", error);
    throw error;
  }
};