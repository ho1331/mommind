import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  if (!_db) throw new Error('DB not initialized — call initDb() first');
  return _db;
};

export const initDb = async () => {
  _db = await SQLite.openDatabaseAsync('mommind.db');
  await _migrate(_db);
};

async function _migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS moods (
        local_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id  INTEGER,
        client_id  TEXT UNIQUE NOT NULL,
        mood       TEXT NOT NULL,
        note       TEXT,
        created_at TEXT NOT NULL,
        synced     INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS plans (
        local_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id  INTEGER UNIQUE,
        client_id  TEXT,
        title      TEXT NOT NULL,
        completed  INTEGER NOT NULL DEFAULT 0,
        plan_date  TEXT NOT NULL,
        synced     INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS articles (
        id                 INTEGER PRIMARY KEY,
        title              TEXT NOT NULL,
        category           TEXT NOT NULL,
        content            TEXT NOT NULL,
        read_time_minutes  INTEGER NOT NULL,
        cached_at          TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kv (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sync_queue (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        operation  TEXT NOT NULL,
        payload    TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retries    INTEGER NOT NULL DEFAULT 0
      );
      PRAGMA user_version = 1;
    `);
  }
}
