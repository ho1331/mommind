import { create } from 'zustand';
import { api } from '@/services/api';
import { MoodKey } from '@/components/MoodPicker';
import * as Crypto from 'expo-crypto';

interface MoodEntry {
  id: number;
  mood: MoodKey;
  note: string | null;
  created_at: string;
}

interface MoodState {
  entries: MoodEntry[];
  isLoading: boolean;
  load: () => Promise<void>;
  add: (mood: MoodKey, note?: string) => Promise<void>;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  entries: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/moods');
      set({ entries: data });
    } finally {
      set({ isLoading: false });
    }
  },

  add: async (mood, note) => {
    const client_id = Crypto.randomUUID();
    const optimistic: MoodEntry = {
      id: Date.now(),
      mood,
      note: note ?? null,
      created_at: new Date().toISOString(),
    };
    set({ entries: [optimistic, ...get().entries] });
    try {
      const { data } = await api.post('/moods', { mood, note, client_id });
      set({ entries: [data, ...get().entries.filter((e) => e.id !== optimistic.id)] });
    } catch {
      set({ entries: get().entries.filter((e) => e.id !== optimistic.id) });
      throw new Error('Failed to save mood');
    }
  },
}));
