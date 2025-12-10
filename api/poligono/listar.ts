import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSheet } from '../_utils/googleSheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const sheet = await getSheet('CARTOGRAFIA_AREAS');
    const rows = await sheet.getRows();

    // Ensure rows is an array before mapping
    if (!rows || !Array.isArray(rows)) {
      return res.status(200).json([]);
    }

    // Map rows to a clean JSON object using direct property access for google-spreadsheet v4
    const polygons = rows.map((row: any) => ({
      ID_AREA: row.get ? row.get('ID_AREA') : row['ID_AREA'],
      COMUNIDAD_ASOCIADA: row.get ? row.get('COMUNIDAD_ASOCIADA') : row['COMUNIDAD_ASOCIADA'],
      TIPO_AREA: row.get ? row.get('TIPO_AREA') : row['TIPO_AREA'],
      NOMBRE_AREA: row.get ? row.get('NOMBRE_AREA') : row['NOMBRE_AREA'],
      GEOMETRIA_WKT: row.get ? row.get('GEOMETRIA_WKT') : row['GEOMETRIA_WKT'],
      FECHA_ACTUALIZACION: row.get ? row.get('FECHA_ACTUALIZACION') : row['FECHA_ACTUALIZACION'],
      USUARIO_WKT: row.get ? row.get('USUARIO_WKT') : row['USUARIO_WKT'],
    }));

    return res.status(200).json(polygons);

  } catch (error: any) {
    console.error('API Error:', error);
    // If we fail to connect to Google Sheets, return a 500 error
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}