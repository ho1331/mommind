import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';
import { kvGet, kvSet } from '@/db/kv';
import { clearUserData } from '@/db/index';

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

const resetStores = async () => {
  const { useMoodStore } = await import('./moodStore');
  const { usePlanStore } = await import('./planStore');
  const { useSubscriptionStore } = await import('./subscriptionStore');
  useMoodStore.getState().reset();
  usePlanStore.getState().reset();
  useSubscriptionStore.setState({ subscription: null });
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  register: async (email, password, onboarding = {}) => {
    console.log('[auth] register attempt:', email);
    set({ isLoading: true });
    try {
      await resetStores();
      await clearUserData(); // always clear for brand-new users
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
      // Clear local data only if a different user is logging in
      const prevUser = await SecureStore.getItemAsync('user');
      const prevId = prevUser ? JSON.parse(prevUser).id : null;
      if (prevId !== null && prevId !== data.user.id) {
        console.log('[auth] different user detected — clearing local data');
        await resetStores();
        await clearUserData();
      } else {
        await resetStores(); // reset in-memory but keep SQLite cache for same user
      }
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
    // Keep SQLite data so it's available when the same user logs back in
    await resetStores();
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
