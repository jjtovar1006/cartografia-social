import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFromScript } from '../_utils/googleSheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const data = await fetchFromScript({ action: 'listar' }, 'GET');
    
    if (Array.isArray(data)) {
        return res.status(200).json(data);
    }
    return res.status(200).json([]);

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}