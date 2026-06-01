import { create } from 'zustand';
import { api } from '@/services/api';
import { kvGet, kvSet } from '@/db/kv';

interface Subscription {
  id: number;
  plan: 'trial' | 'active' | 'expired';
  started_at: string;
  expires_at: string | null;
}

interface SubState {
  subscription: Subscription | null;
  load: () => Promise<void>;
  activate: (plan?: 'trial' | 'active') => Promise<void>;
  cancel: () => Promise<void>;
}

export const useSubscriptionStore = create<SubState>((set, get) => ({
  subscription: null,
  load: async () => {
    // Load from SQLite kv cache first
    const cached = await kvGet<Subscription>('subscription');
    if (cached) {
      set({ subscription: cached });
    }
    try {
      const { data } = await api.get('/subscription');
      console.log('[subscription] loaded plan:', data?.plan);
      await kvSet('subscription', data);
      set({ subscription: data });
    } catch {
      // not subscribed yet or offline — use cached value
    }
  },
  activate: async (plan: 'trial' | 'active' = 'trial') => {
    console.log('[subscription] activating plan:', plan);
    const { data } = await api.post('/subscription', { plan });
    console.log('[subscription] activated plan:', data.plan, 'mock:', data.is_mock_payment);
    await kvSet('subscription', data);
    set({ subscription: data });
  },
  cancel: async () => {
    console.log('[subscription] cancelling');
    await api.delete('/subscription');
    const updated = get().subscription ? { ...get().subscription!, plan: 'expired' as const } : null;
    if (updated) await kvSet('subscription', updated);
    set({ subscription: updated });
    console.log('[subscription] cancelled');
  },
}));
