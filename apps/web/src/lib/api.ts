import axios, { AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: inyecta el accessToken ──────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor: refresh automático al expirar ─────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.data.accessToken;

        localStorage.setItem('accessToken', newAccessToken);
        original.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(original);
      } catch {
        // Refresh falló — limpiar sesión
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ─── Error helper ─────────────────────────────────────────────────────────────

/** Extrae el mensaje de un error de Axios; usa `fallback` para cualquier otro tipo. */
export function getApiError(e: unknown, fallback: string): string {
  if (isAxiosError(e)) return (e.response?.data as { error?: string })?.error ?? fallback;
  return fallback;
}
