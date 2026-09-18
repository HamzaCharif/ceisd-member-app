// /admin-web/lib/api.ts
// Axios instance for admin web dashboard.

import axios from 'axios';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'ceisd_admin_token';

export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function setAdminToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: 'strict' });
}

export function clearAdminToken(): void {
  Cookies.remove(TOKEN_KEY);
}

export function getAdminToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}
