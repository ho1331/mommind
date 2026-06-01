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
      console.log('[subscription] loaded plan:', data?.plan);
      set({ subscription: data });
    } catch {
      // not subscribed yet — that's fine
    }
  },
  activate: async () => {
    console.log('[subscription] activating trial');
    const { data } = await api.post('/subscription', { plan: 'trial' });
    console.log('[subscription] activated plan:', data.plan, 'mock:', data.is_mock_payment);
    set({ subscription: data });
  },
}));
