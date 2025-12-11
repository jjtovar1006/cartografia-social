import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFromScript } from '../_utils/googleSheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const data = req.body;
    
    // Add action to the body so Apps Script knows what to do
    const payload = {
        action: 'registrar_hogar',
        ...data
    };

    const result = await fetchFromScript(payload, 'POST');
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}