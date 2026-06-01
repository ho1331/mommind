import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';

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
      set({ user: data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await SecureStore.setItemAsync('access_token', data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.refresh_token);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
      set({ user: data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
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
