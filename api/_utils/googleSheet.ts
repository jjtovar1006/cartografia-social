import https from 'https';
import { IncomingMessage } from 'http';
import { Buffer } from 'buffer';

// Helper function to communicate with Google Apps Script using native Node.js https
// This avoids issues with 'fetch' availability in certain serverless runtimes
export const fetchFromScript = async (params: Record<string, any>, method: 'GET' | 'POST' = 'GET') => {
  const scriptUrl = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycby-XbyZKagUuqLYo6BAo6KtzpKd2eCtEb2s_2lTp471Sexh8psqWf-coORQtlT4oKPm/exec";

  return new Promise((resolve, reject) => {
    const urlObj = new URL(scriptUrl);
    
    let requestOptions: https.RequestOptions = {
      method: method,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    };

    let bodyData = '';

    if (method === 'GET') {
      const queryParams = new URLSearchParams(params).toString();
      requestOptions.path += `?${queryParams}`;
    } else {
      // For POST, we send data in body
      bodyData = JSON.stringify(params);
      requestOptions.headers = {
        ...requestOptions.headers,
        // Explicitly use Buffer from imported module
        'Content-Length': Buffer.byteLength(bodyData)
      };
    }

    const makeRequest = (currentOptions: https.RequestOptions, postBody?: string) => {
      const req = https.request(currentOptions, (res: IncomingMessage) => {
        // Handle Google Apps Script Redirects (302)
        // When a script returns output, Google redirects to a temporary URL serving the content
        if (res.statusCode === 302 && res.headers.location) {
          const newUrl = new URL(res.headers.location);
          const newOptions: https.RequestOptions = {
            method: 'GET', // Follow redirect with GET to retrieve the output
            hostname: newUrl.hostname,
            path: newUrl.pathname + newUrl.search,
            headers: {
                 // Clean headers for the redirect fetch
                 'Accept': '*/*'
            }
          };
          makeRequest(newOptions);
          return;
        }

        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`Google Script API returned status: ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            // Apps Script sometimes returns empty string on success depending on implementation
            if (!data.trim()) {
                resolve({ success: true });
                return;
            }
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            console.error("Raw response from script:", data);
            reject(new Error("Invalid JSON response from Google Script"));
          }
        });
      });

      req.on('error', (e) => {
        console.error("Network error connecting to script:", e);
        reject(e);
      });

      // Write body if it exists (only for the initial POST, not for the redirect GET)
      if (postBody) {
        req.write(postBody);
      }
      
      req.end();
    };

    makeRequest(requestOptions, method === 'POST' ? bodyData : undefined);
  });
};