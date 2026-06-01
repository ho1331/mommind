import { api } from '@/services/api';
import * as syncQueue from '@/db/syncQueue';
import { getDb } from '@/db/index';

const MAX_RETRIES = 3;

export const replayQueue = async () => {
  try {
    const items = await syncQueue.getPending();
    if (items.length === 0) return;
    if (__DEV__) console.log('[sync] replaying', items.length, 'queued operations');

    for (const item of items) {
      if (item.retries >= MAX_RETRIES) {
        if (__DEV__) console.warn('[sync] dropping item after max retries:', item.id, item.operation);
        await syncQueue.remove(item.id);
        continue;
      }
      try {
        await _execute(item);
        await syncQueue.remove(item.id);
        if (__DEV__) console.log('[sync] replayed:', item.operation);
      } catch (err) {
        console.error('[sync] retry later:', item.operation, err);
        await syncQueue.incrementRetries(item.id);
      }
    }
  } catch {
    return;
  }
};

async function _execute(item: syncQueue.QueueItem) {
  const db = getDb();
  switch (item.operation) {
    case 'CREATE_MOOD': {
      const { data } = await api.post('/moods', item.payload);
      await db.runAsync(
        'UPDATE moods SET server_id = ?, synced = 1 WHERE client_id = ?',
        [data.id, item.payload.client_id as string]
      );
      break;
    }
    case 'TOGGLE_PLAN': {
      const { server_id, completed } = item.payload as { server_id: number; completed: boolean };
      await api.patch(`/plans/${server_id}`, { completed });
      await db.runAsync(
        'UPDATE plans SET synced = 1 WHERE server_id = ?',
        [server_id]
      );
      break;
    }
  }
}
