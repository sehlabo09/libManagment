// Central place for talking to the Express API with the Fetch API.

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

/**
 * Performs a request against the backend and returns the parsed JSON body.
 * Throws an Error carrying `status` and optional `details` when the API
 * responds with a non 2xx status code, so callers can show a message.
 */
export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error('Cannot reach the server. Is the backend running on port 4000?');
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data?.details || null;
    throw error;
  }

  return data;
}

export { API_URL };
