import { create } from 'zustand';
import { api } from '@/services/api';
import { getDb } from '@/db/index';
import { enqueue } from '@/db/syncQueue';
import { MoodKey } from '@/components/MoodPicker';
import * as Crypto from 'expo-crypto';

interface MoodEntry {
  id: number; // local_id used as display id
  server_id: number | null;
  client_id: string;
  mood: MoodKey;
  note: string | null;
  created_at: string;
  synced: boolean;
}

interface MoodState {
  entries: MoodEntry[];
  isLoading: boolean;
  load: () => Promise<void>;
  add: (mood: MoodKey, note?: string) => Promise<void>;
  reset: () => void;
}

type DbMoodRow = {
  local_id: number;
  server_id: number | null;
  client_id: string;
  mood: string;
  note: string | null;
  created_at: string;
  synced: number;
};

const rowToEntry = (r: DbMoodRow): MoodEntry => ({
  id: r.local_id,
  server_id: r.server_id,
  client_id: r.client_id,
  mood: r.mood as MoodKey,
  note: r.note,
  created_at: r.created_at,
  synced: r.synced === 1,
});

export const useMoodStore = create<MoodState>((set, get) => ({
  entries: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const db = getDb();
    // 1. Load from SQLite immediately
    const local = await db.getAllAsync<DbMoodRow>(
      'SELECT * FROM moods ORDER BY created_at DESC LIMIT 30'
    );
    set({ entries: local.map(rowToEntry), isLoading: false });

    // 2. Fetch from server and reconcile
    try {
      const { data } = await api.get('/moods');
      // Upsert server records into SQLite
      for (const m of data) {
        await db.runAsync(
          `INSERT INTO moods (server_id, client_id, mood, note, created_at, synced)
           VALUES (?, ?, ?, ?, ?, 1)
           ON CONFLICT(client_id) DO UPDATE SET server_id=excluded.server_id, synced=1`,
          [m.id, m.client_id ?? `server-${m.id}`, m.mood, m.note ?? null, m.created_at]
        );
      }
      const updated = await db.getAllAsync<DbMoodRow>(
        'SELECT * FROM moods ORDER BY created_at DESC LIMIT 30'
      );
      set({ entries: updated.map(rowToEntry) });
    } catch {
      // Offline: already showing SQLite data — that's fine
    }
  },

  add: async (mood, note) => {
    const client_id = Crypto.randomUUID();
    const created_at = new Date().toISOString();
    const db = getDb();
    if (__DEV__) console.log('[mood] logging mood:', mood);

    // Write to SQLite immediately
    const result = await db.runAsync(
      'INSERT INTO moods (client_id, mood, note, created_at, synced) VALUES (?, ?, ?, ?, 0)',
      [client_id, mood, note ?? null, created_at]
    );
    const optimistic: MoodEntry = {
      id: result.lastInsertRowId,
      server_id: null,
      client_id,
      mood,
      note: note ?? null,
      created_at,
      synced: false,
    };
    set({ entries: [optimistic, ...get().entries] });

    // Sync to server
    try {
      const { data } = await api.post('/moods', { mood, note, client_id, created_at });
      await db.runAsync(
        'UPDATE moods SET server_id = ?, synced = 1 WHERE client_id = ?',
        [data.id, client_id]
      );
      set({
        entries: get().entries.map((e) =>
          e.client_id === client_id ? { ...e, server_id: data.id, synced: true } : e
        ),
      });
      if (__DEV__) console.log('[mood] synced, server id:', data.id);
    } catch {
      if (__DEV__) console.log('[mood] offline — queued for later sync');
      await enqueue('CREATE_MOOD', { mood, note: note ?? null, client_id, created_at });
    }
  },
  reset: () => set({ entries: [], isLoading: false }),
}));
