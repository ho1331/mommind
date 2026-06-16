import { create } from 'zustand';
import { api } from '@/services/api';
import { getDb } from '@/db/index';
import { enqueue } from '@/db/syncQueue';

interface PlanItem {
  id: number; // local_id
  server_id: number | null;
  title: string;
  completed: boolean;
  plan_date: string;
  synced: boolean;
}

interface PlanState {
  plans: PlanItem[];
  isLoading: boolean;
  load: () => Promise<void>;
  toggle: (id: number, completed: boolean) => Promise<void>;
  reset: () => void;
}

type DbPlanRow = {
  local_id: number;
  server_id: number | null;
  client_id: string | null;
  title: string;
  completed: number;
  plan_date: string;
  synced: number;
};

const rowToPlan = (r: DbPlanRow): PlanItem => ({
  id: r.local_id,
  server_id: r.server_id,
  title: r.title,
  completed: r.completed === 1,
  plan_date: r.plan_date,
  synced: r.synced === 1,
});

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // 1. Load from SQLite
    const local = await db.getAllAsync<DbPlanRow>(
      'SELECT * FROM plans WHERE plan_date = ? ORDER BY local_id ASC',
      [today]
    );
    if (local.length > 0) {
      set({ plans: local.map(rowToPlan), isLoading: false });
    } else {
      set({ isLoading: false });
    }

    // 2. Fetch from server and reconcile
    try {
      const { data } = await api.get('/plans');
      for (const p of data) {
        await db.runAsync(
          `INSERT INTO plans (server_id, client_id, title, completed, plan_date, synced)
           VALUES (?, ?, ?, ?, ?, 1)
           ON CONFLICT(server_id) DO UPDATE SET completed=excluded.completed, synced=1`,
          [p.id, p.client_id ?? null, p.title, p.completed ? 1 : 0, p.plan_date]
        );
      }
      const updated = await db.getAllAsync<DbPlanRow>(
        'SELECT * FROM plans WHERE plan_date = ? ORDER BY local_id ASC',
        [today]
      );
      set({ plans: updated.map(rowToPlan) });
    } catch {
      // Offline: already showing SQLite data
    }
  },

  toggle: async (id, completed) => {
    if (__DEV__) console.log('[plan] toggle local_id:', id, 'completed:', completed);
    const db = getDb();

    const plan = get().plans.find((p) => p.id === id);

    // Optimistic local update
    set({ plans: get().plans.map((p) => (p.id === id ? { ...p, completed, synced: false } : p)) });
    await db.runAsync(
      'UPDATE plans SET completed = ?, synced = 0 WHERE local_id = ?',
      [completed ? 1 : 0, id]
    );

    if (!plan?.server_id) {
      if (__DEV__) console.warn('[plan] no server_id yet, skipping sync');
      return;
    }

    try {
      await api.patch(`/plans/${plan.server_id}`, { completed });
      await db.runAsync('UPDATE plans SET synced = 1 WHERE local_id = ?', [id]);
      set({ plans: get().plans.map((p) => (p.id === id ? { ...p, synced: true } : p)) });
    } catch {
      if (__DEV__) console.log('[plan] offline — queued for later sync');
      await enqueue('TOGGLE_PLAN', { server_id: plan.server_id, completed });
    }
  },
  reset: () => set({ plans: [], isLoading: false }),
}));
