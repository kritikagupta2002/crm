/**
 * Bansal Geo Solutions - HRMS API Client
 * Production-ready HTTP client with automatic base URL detection,
 * Bearer token authentication, and offline fallback resilience.
 */

function resolveApiBase() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Production cloud domain
    if (host.includes('bansalgeo.geoplanetsolution.in')) {
      return 'https://bansalgeo-api.geoplanetsolution.in/api';
    }
  }
  // Development / Local environment (Vite proxy forwards /api to localhost:5000)
  return '/api';
}

const API_BASE = resolveApiBase();

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    try {
      return localStorage.getItem('bgspl_auth_token') || '';
    } catch {
      return '';
    }
  }

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem('bgspl_auth_token', token);
      } else {
        localStorage.removeItem('bgspl_auth_token');
      }
    } catch {
      // Ignored
    }
  }

  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${cleanEndpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.error || response.statusText || 'API Request Failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(`[API Client] ${options.method || 'GET'} ${url} failed:`, err.message);
      throw err;
    }
  }

  get(endpoint, params) {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
    }
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body || {}),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body || {}),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export const apiClient = api;
