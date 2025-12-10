import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFromScript } from '../_utils/googleSheet';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed. Use PUT.' });
  }

  try {
    const data = req.body;
    
    const payload = {
        action: 'actualizar',
        ...data
    };

    // We send POST to the script even though it's an update logically, 
    // the script handles the logic based on 'action'
    const result = await fetchFromScript(payload, 'POST');
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}