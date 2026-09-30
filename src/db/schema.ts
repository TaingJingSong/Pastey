import { open } from '@op-engineering/op-sqlite';

export const db = open({ name: 'pastey.db' });

export async function initSchema(): Promise<void> {
  await db.execute('PRAGMA journal_mode = WAL');
  await db.execute('PRAGMA foreign_keys = ON');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      preview TEXT NOT NULL,
      file_path TEXT,
      created_at INTEGER NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_items_created
    ON items(pinned DESC, created_at DESC)
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS content (
      item_id INTEGER PRIMARY KEY
        REFERENCES items(id) ON DELETE CASCADE,
      full_text TEXT
    )
  `);
}
