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
    const created_at = new Date().toISOString();
    const today = created_at.slice(0, 10); // YYYY-MM-DD
    const db = getDb();
    if (__DEV__) console.log('[mood] logging mood:', mood);

    // Check if there's already an entry for today
    const existing = await db.getFirstAsync<DbMoodRow>(
      "SELECT * FROM moods WHERE date(created_at) = ?",
      [today]
    );

    let entry: MoodEntry;

    if (existing) {
      // Update today's entry in-place
      const client_id = existing.client_id;
      await db.runAsync(
        'UPDATE moods SET mood = ?, note = ?, synced = 0 WHERE local_id = ?',
        [mood, note ?? null, existing.local_id]
      );
      entry = {
        id: existing.local_id,
        server_id: existing.server_id,
        client_id,
        mood,
        note: note ?? null,
        created_at: existing.created_at,
        synced: false,
      };
      set({ entries: get().entries.map((e) => e.id === entry.id ? entry : e) });

      try {
        const { data } = await api.post('/moods', { mood, note, client_id, created_at: existing.created_at });
        await db.runAsync('UPDATE moods SET server_id = ?, synced = 1 WHERE local_id = ?', [data.id, existing.local_id]);
        set({ entries: get().entries.map((e) => e.id === entry.id ? { ...e, server_id: data.id, synced: true } : e) });
      } catch {
        if (__DEV__) console.log('[mood] offline — queued for later sync');
        await enqueue('CREATE_MOOD', { mood, note: note ?? null, client_id, created_at: existing.created_at });
      }
    } else {
      // New entry for today
      const client_id = Crypto.randomUUID();
      const result = await db.runAsync(
        'INSERT INTO moods (client_id, mood, note, created_at, synced) VALUES (?, ?, ?, ?, 0)',
        [client_id, mood, note ?? null, created_at]
      );
      entry = {
        id: result.lastInsertRowId,
        server_id: null,
        client_id,
        mood,
        note: note ?? null,
        created_at,
        synced: false,
      };
      set({ entries: [entry, ...get().entries] });

      try {
        const { data } = await api.post('/moods', { mood, note, client_id, created_at });
        await db.runAsync('UPDATE moods SET server_id = ?, synced = 1 WHERE client_id = ?', [data.id, client_id]);
        set({ entries: get().entries.map((e) => e.client_id === client_id ? { ...e, server_id: data.id, synced: true } : e) });
        if (__DEV__) console.log('[mood] synced, server id:', data.id);
      } catch {
        if (__DEV__) console.log('[mood] offline — queued for later sync');
        await enqueue('CREATE_MOOD', { mood, note: note ?? null, client_id, created_at });
      }
    }
  },
  reset: () => set({ entries: [], isLoading: false }),
}));
