// Helper function to communicate with Google Apps Script
export const fetchFromScript = async (params: Record<string, any>, method: 'GET' | 'POST' = 'GET') => {
  // Load the Apps Script URL from Vercel Environment Variables
  const scriptUrl = process.env.APPS_SCRIPT_URL;

  if (!scriptUrl) {
    throw new Error('Missing APPS_SCRIPT_URL in environment variables.');
  }

  // Construct URL with params for GET requests
  let url = scriptUrl;
  let options: RequestInit = {
    method: method,
    headers: {
        'Content-Type': 'application/json'
    }
  };

  if (method === 'GET') {
    const queryParams = new URLSearchParams(params).toString();
    url = `${scriptUrl}?${queryParams}`;
  } else {
    // For POST, we send data in body
    // Note: Google Apps Script redirects POST requests (302). 
    // fetch usually follows redirects automatically.
    options.body = JSON.stringify(params);
    options.redirect = 'follow'; 
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
     throw new Error(`Error connecting to Sheet Script: ${response.statusText}`);
  }

  const text = await response.text();
  try {
      return JSON.parse(text);
  } catch (e) {
      console.error("Invalid JSON from Script:", text);
      throw new Error("Invalid response format from Google Sheet Script");
  }
};