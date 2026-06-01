import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';
import { kvGet, kvSet } from '@/db/kv';

interface User {
  id: number;
  email: string;
  onboarding_completed: boolean;
  child_age_group: string | null;
  primary_challenge: string | null;
  goals: string[] | null;
}

interface OnboardingData {
  child_age_group?: string;
  primary_challenge?: string;
  goals?: string[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  register: (email: string, password: string, onboarding?: OnboardingData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  register: async (email, password, onboarding = {}) => {
    console.log('[auth] register attempt:', email);
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        confirm_password: password,
        ...onboarding,
      });
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
      await kvSet('user', data.user);
      set({ user: data.user });
      console.log('[auth] register success: user id', data.user.id);
    } catch (err) {
      console.error('[auth] register error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    console.log('[auth] login attempt:', email);
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
      await kvSet('user', data.user);
      set({ user: data.user });
      console.log('[auth] login success: user id', data.user.id);
    } catch (err) {
      console.error('[auth] login error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    console.log('[auth] logout');
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
    await kvSet('user', null);
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.removeItem('onboarding_done');
    set({ user: null });
  },

  loadFromStorage: async () => {
    const stored = await SecureStore.getItemAsync('user');
    if (stored) {
      set({ user: JSON.parse(stored) });
      return true;
    }
    return false;
  },
}));
