import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSheet } from '../_utils/googleSheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed. Use PUT.' });
  }

  try {
    const { ID_AREA, GEOMETRIA_WKT, USUARIO_WKT, FECHA_ACTUALIZACION } = req.body;

    if (!ID_AREA || !GEOMETRIA_WKT) {
      return res.status(400).json({ error: 'ID_AREA and GEOMETRIA_WKT are required' });
    }

    const sheet = await getSheet('CARTOGRAFIA_AREAS');
    const rows = await sheet.getRows();

    // Find the row with the matching ID
    // FIX: In google-spreadsheet v4, access values directly via row['HeaderName']
    const rowToUpdate = rows.find((r: any) => (r.get ? r.get('ID_AREA') : r['ID_AREA']) === ID_AREA);

    if (!rowToUpdate) {
      return res.status(404).json({ error: 'Polygon ID not found' });
    }

    // Update fields directly
    if (rowToUpdate.set) {
        rowToUpdate.set('GEOMETRIA_WKT', GEOMETRIA_WKT);
        rowToUpdate.set('FECHA_ACTUALIZACION', FECHA_ACTUALIZACION);
        rowToUpdate.set('USUARIO_WKT', USUARIO_WKT);
    } else {
        rowToUpdate['GEOMETRIA_WKT'] = GEOMETRIA_WKT;
        rowToUpdate['FECHA_ACTUALIZACION'] = FECHA_ACTUALIZACION;
        rowToUpdate['USUARIO_WKT'] = USUARIO_WKT;
    }

    await rowToUpdate.save();

    return res.status(200).json({ success: true, message: 'Polygon updated successfully' });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}