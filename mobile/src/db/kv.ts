import { getDb } from './index';

export const kvSet = async (key: string, value: unknown) => {
  await getDb().runAsync(
    `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    [key, JSON.stringify(value), new Date().toISOString()]
  );
};

export const kvGet = async <T>(key: string): Promise<T | null> => {
  const row = await getDb().getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key]);
  return row ? JSON.parse(row.value) : null;
};
