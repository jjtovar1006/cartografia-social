import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Helper function to initialize the sheet
export const getSheet = async (tabName: string = 'CARTOGRAFIA_AREAS') => {
  // Load variables from Vercel Environment Variables
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Properly handle private key newlines which are often escaped in env vars
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : undefined;

  // Use the specific ID provided by the user as default if env var is missing
  const sheetId = process.env.GOOGLE_SHEET_ID || '1wKoukwkryMSWhcNZ0nan7b2EU10_sqOcVBaSe0hLwsA';

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Missing Google Sheets Credentials. Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.');
  }

  const serviceAccountAuth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);

  await doc.loadInfo(); // loads document properties and worksheets
  
  // Return the specific tab requested
  const sheet = doc.sheetsByTitle[tabName];
  
  if (!sheet) {
      throw new Error(`Tab '${tabName}' not found in the Google Sheet (${sheetId}). Please ensure 'CENSO_HOGARES' and 'CARTOGRAFIA_AREAS' exist.`);
  }

  return sheet;
};