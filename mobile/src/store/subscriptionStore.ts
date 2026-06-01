import { create } from 'zustand';
import { api } from '@/services/api';

interface Subscription {
  id: number;
  plan: 'trial' | 'active' | 'expired';
  started_at: string;
  expires_at: string | null;
}

interface SubState {
  subscription: Subscription | null;
  load: () => Promise<void>;
  activate: () => Promise<void>;
}

export const useSubscriptionStore = create<SubState>((set) => ({
  subscription: null,
  load: async () => {
    try {
      const { data } = await api.get('/subscription');
      set({ subscription: data });
    } catch {
      // not subscribed yet — that's fine
    }
  },
  activate: async () => {
    const { data } = await api.post('/subscription', { plan: 'trial' });
    set({ subscription: data });
  },
}));
