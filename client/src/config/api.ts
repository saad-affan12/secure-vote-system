const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedApiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '';
const devFallbackApiUrl = import.meta.env.DEV ? '/api' : '';

export const API_URL = normalizedApiUrl || devFallbackApiUrl;
export const API_URL_ERROR = API_URL
  ? ''
  : 'API is not configured. Set VITE_API_URL to your backend URL, for example https://YOUR_BACKEND_URL/api.';

export default API_URL
