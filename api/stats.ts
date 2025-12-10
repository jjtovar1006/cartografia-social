import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFromScript } from './_utils/googleSheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    // Call Apps Script with action='stats'
    const data = await fetchFromScript({ action: 'stats' }, 'GET');
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('API Error:', error);
    // Fallback demo data if configuration is missing
    if (error.message && error.message.includes('APPS_SCRIPT_URL')) {
        return res.status(200).json([
            { name: "Casco Central (Demo)", families: 45, population: 150 },
            { name: "Sector Norte (Demo)", families: 32, population: 110 }
        ]);
    }
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}