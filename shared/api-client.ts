// /shared/api-client.ts
// Shared Axios API client for the CEISD Member App (mobile).
// All HTTP calls from mobile screens must use this client — never raw fetch.
// Agent 1 owns this file.

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

// expo-secure-store is native-only. On web we fall back to localStorage.
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.setItemAsync(key, value);
  },
  async del(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.deleteItemAsync(key);
  },
};

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
export const TOKEN_KEY = 'ceisd_jwt';

// ─────────────────────────────────────────────
// AXIOS INSTANCE
// ─────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────
// REQUEST INTERCEPTOR — attach JWT
// ─────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.get(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Storage unavailable — proceed without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// RESPONSE INTERCEPTOR — handle 401
// ─────────────────────────────────────────────

let _onUnauthorized: (() => void) | null = null;

/**
 * Register a callback that fires when a 401 response is received.
 * Call this once from RootNavigator to redirect to the Login screen.
 */
export function registerUnauthorizedHandler(handler: () => void): void {
  _onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear stored token
      try {
        await storage.del(TOKEN_KEY);
      } catch {
        // ignore
      }
      // Trigger navigation to login
      if (_onUnauthorized) {
        _onUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────────

export async function storeToken(token: string): Promise<void> {
  await storage.set(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  try {
    return await storage.get(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await storage.del(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────
// TYPED HELPERS
// ─────────────────────────────────────────────

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

export default apiClient;
