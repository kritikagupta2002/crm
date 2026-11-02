/*
 * HTTP client for the HRMS API. Sends the signed-in user's token, turns error responses into Error objects with
 * the server's message, and announces an expired session so the app can return to the sign-in page.
 *
 * The API address comes from VITE_API_URL at build time; in development Vite proxies /api to the local server.
 */
function resolveApiBase() {
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('bansalgeo.geoplanetsolution.in')) {
    return 'https://bansalgeo-api.geoplanetsolution.in/api';
  }
  return '/api';
}
const API_BASE = resolveApiBase().replace(/\/+$/, '');
const TOKEN_KEY = 'bgspl_auth_token';
export const SESSION_EXPIRED_EVENT = 'hrms:session-expired';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage blocked (private mode): the session lasts only for this page.
    }
  }

  async request(endpoint, options = {}) {
    const url = /^https?:/.test(endpoint) ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });
    } catch {
      const error = new Error('Cannot reach the server. Check your internet connection and try again.');
      error.status = 0;
      throw error;
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token && !endpoint.startsWith('/auth/login')) {
        this.setToken('');
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      }
      const error = new Error(data?.error || `Request failed (${response.status}).`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  get(endpoint, params) {
    let url = endpoint;
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') search.append(key, String(val));
      });
      const qs = search.toString();
      if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;
    }
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body || {}) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body || {}) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export const apiClient = api;
