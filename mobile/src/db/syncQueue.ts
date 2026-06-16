import { getDb } from './index';

export type SyncOperation = 'CREATE_MOOD' | 'TOGGLE_PLAN';

export interface QueueItem {
  id: number;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  retries: number;
}

export const enqueue = async (op: SyncOperation, payload: Record<string, unknown>) => {
  const db = getDb();
  await db.runAsync(
    'INSERT INTO sync_queue (operation, payload, created_at) VALUES (?, ?, ?)',
    [op, JSON.stringify(payload), new Date().toISOString()]
  );
};

export const getPending = async (): Promise<QueueItem[]> => {
  const db = getDb();
  const rows = await db.getAllAsync<{ id: number; operation: string; payload: string; retries: number }>(
    'SELECT id, operation, payload, retries FROM sync_queue ORDER BY id ASC'
  );
  return rows.map((r) => ({ ...r, operation: r.operation as SyncOperation, payload: JSON.parse(r.payload) }));
};

export const remove = async (id: number) => {
  await getDb().runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
};

export const incrementRetries = async (id: number) => {
  await getDb().runAsync('UPDATE sync_queue SET retries = retries + 1 WHERE id = ?', [id]);
};
