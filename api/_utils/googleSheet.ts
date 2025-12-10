// Helper function to communicate with Google Apps Script
export const fetchFromScript = async (params: Record<string, any>, method: 'GET' | 'POST' = 'GET') => {
  // Use the provided Apps Script URL directly
  // This allows the app to work without setting up Vercel Environment Variables explicitly
  const scriptUrl = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycby-XbyZKagUuqLYo6BAo6KtzpKd2eCtEb2s_2lTp471Sexh8psqWf-coORQtlT4oKPm/exec";

  if (!scriptUrl) {
    throw new Error('Missing APPS_SCRIPT_URL in environment variables or default configuration.');
  }

  // Construct URL with params for GET requests
  let url = scriptUrl;
  let options: RequestInit = {
    method: method,
    headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script handles text/plain better for avoiding CORS preflight issues in some cases
    }
  };

  if (method === 'GET') {
    const queryParams = new URLSearchParams(params).toString();
    url = `${scriptUrl}?${queryParams}`;
  } else {
    // For POST, we send data in body
    // Google Apps Script requires specific handling. 
    // Using simple stringify often works best with the doPost(e) setup provided previously.
    options.body = JSON.stringify(params);
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