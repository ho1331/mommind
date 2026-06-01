import { create } from 'zustand';
import { api } from '@/services/api';

interface PlanItem {
  id: number;
  title: string;
  completed: boolean;
  plan_date: string;
}

interface PlanState {
  plans: PlanItem[];
  isLoading: boolean;
  load: () => Promise<void>;
  toggle: (id: number, completed: boolean) => Promise<void>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/plans');
      set({ plans: data });
    } finally {
      set({ isLoading: false });
    }
  },

  toggle: async (id, completed) => {
    // optimistic update
    set({ plans: get().plans.map((p) => (p.id === id ? { ...p, completed } : p)) });
    await api.patch(`/plans/${id}`, { completed });
  },
}));
