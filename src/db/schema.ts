import { sqlite } from '../native/PasteySQLite';

export const db = sqlite;

let initialized = false;
let initialization: Promise<void> | null = null;

export async function initSchema(): Promise<void> {
  console.log('[db] initSchema start');
  if (initialized) {
    return;
  }
  if (initialization) {
    return initialization;
  }

  initialization = (async () => {
    await db.open('pastey.db');

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

    initialized = true;
  })();

  try {
    await initialization;
  } finally {
    console.log('[db] initSchema completed');
    initialization = null;
  }
}
