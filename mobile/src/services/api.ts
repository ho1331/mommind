import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Simple observable offline flag — screens can subscribe via useIsOffline()
let _isOffline = false;
const _listeners = new Set<(v: boolean) => void>();

export const setOffline = (v: boolean) => {
  if (_isOffline === v) return;
  _isOffline = v;
  _listeners.forEach((fn) => fn(v));
};

export const useIsOffline = () => {
  const [offline, setOff] = React.useState(_isOffline);
  React.useEffect(() => {
    _listeners.add(setOff);
    return () => { _listeners.delete(setOff); };
  }, []);
  return offline;
};

import React from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const forceLogout = async () => {
  console.log('[api] session expired — forcing logout');
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
  await SecureStore.deleteItemAsync('user');
  router.replace('/(auth)/login');
};

api.interceptors.response.use(
  (r) => { setOffline(false); return r; },
  async (error) => {
    // Network error = no response at all
    if (!error.response) {
      console.log('[api] network error — offline');
      setOffline(true);
      return Promise.reject(error);
    }
    setOffline(false);

    const original = error.config;
    const status = error.response?.status;

    // Skip refresh logic for auth endpoints — 401 there means wrong credentials
    const isAuthEndpoint = original.url?.includes('/auth/');

    // 401 = token expired/invalid, 403 = no token sent (HTTPBearer missing header)
    if ((status === 401 || status === 403) && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync('refresh_token');
        if (!refresh) throw new Error('no refresh token');
        console.log('[api] refreshing access token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
        await SecureStore.setItemAsync('access_token', data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        console.log('[api] token refreshed, retrying request');
        return api(original);
      } catch {
        await forceLogout();
      }
    }
    return Promise.reject(error);
  }
);
