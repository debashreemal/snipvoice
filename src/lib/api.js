/**
 * API client helper for calling SnipVoice /api serverless endpoints.
 * Handles fetch, JSON encoding/decoding, and centralized error handling.
 */

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Fetch helper for backend serverless functions (/api/...)
 * @param {string} endpoint - The relative endpoint path (e.g. '/api/health' or 'health')
 * @param {RequestInit} [options={}] - Custom fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

  const isFormData = options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (
    config.body &&
    typeof config.body === 'object' &&
    !(config.body instanceof FormData) &&
    !(config.body instanceof Blob)
  ) {
    config.body = JSON.stringify(config.body);
  }

  let res;
  try {
    res = await fetch(url, config);
  } catch (networkError) {
    throw new ApiError(
      `Network connection error reaching ${url}: ${networkError.message}`,
      0,
      null
    );
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMessage =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(errorMessage, res.status, data);
  }

  return data;
}

export default apiFetch;
