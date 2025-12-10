import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSheet } from '../_utils/googleSheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const data = req.body;

    // Basic validation
    if (!data.ID_AREA || !data.GEOMETRIA_WKT || !data.COMUNIDAD_ASOCIADA) {
      return res.status(400).json({ error: 'Missing required fields (ID_AREA, GEOMETRIA_WKT, COMUNIDAD_ASOCIADA)' });
    }

    const sheet = await getSheet('CARTOGRAFIA_AREAS');

    // Add the row to Google Sheets
    await sheet.addRow({
      ID_AREA: data.ID_AREA,
      COMUNIDAD_ASOCIADA: data.COMUNIDAD_ASOCIADA,
      TIPO_AREA: data.TIPO_AREA,
      NOMBRE_AREA: data.NOMBRE_AREA,
      GEOMETRIA_WKT: data.GEOMETRIA_WKT,
      FECHA_ACTUALIZACION: data.FECHA_ACTUALIZACION,
      USUARIO_WKT: data.USUARIO_WKT
    });

    return res.status(200).json({ success: true, message: 'Polygon created successfully' });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}