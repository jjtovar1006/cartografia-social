import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSheet } from './_utils/googleSheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    // Read from the Census tab
    const sheet = await getSheet('CENSO_HOGARES');
    const rows = await sheet.getRows();

    const statsMap: Record<string, { families: number; population: number }> = {};

    // Aggregate data manually
    rows.forEach((row: any) => {
      // Handle v3 vs v4 google-spreadsheet syntax safety
      const comunidadRaw = (row.get ? row.get('COMUNIDAD') : row['COMUNIDAD']);
      const comunidad = comunidadRaw || 'Sin Comunidad';
      
      const miembrosRaw = (row.get ? row.get('NUM_MIEMBROS') : row['NUM_MIEMBROS']);
      const miembros = parseInt(miembrosRaw || '0', 10);

      if (!statsMap[comunidad]) {
        statsMap[comunidad] = { families: 0, population: 0 };
      }

      statsMap[comunidad].families += 1; // Each row is a family/home
      statsMap[comunidad].population += isNaN(miembros) ? 0 : miembros;
    });

    // Convert map to array for frontend
    const statsArray = Object.keys(statsMap).map(key => ({
      name: key,
      families: statsMap[key].families,
      population: statsMap[key].population
    }));

    return res.status(200).json(statsArray);

  } catch (error: any) {
    console.error('API Error:', error);
    // If the tab doesn't exist yet or is empty, return dummy data for visualization so the app doesn't look broken
    if (error.message && error.message.includes('not found')) {
         return res.status(200).json([
            { name: "Casco Central (Demo)", families: 45, population: 150 },
            { name: "Sector Norte (Demo)", families: 32, population: 110 }
         ]);
    }
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}