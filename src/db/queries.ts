import { sqlite } from '../native/PasteySQLite';
import { ClipboardMonitor } from '../native/ClipboardMonitor';
import { readSetting } from '../native/SettingsModule';

const DAY_MS = 24 * 60 * 60 * 1000;

// Unpinned rows that are either past the age limit or outside the newest
// maxItems. maxItems is a bound param so the limit lives in the settings store.
const EXPIRABLE = `
  pinned = 0
  AND (
    created_at < ?
    OR id NOT IN (
      SELECT id FROM items
      WHERE pinned = 0
      ORDER BY created_at DESC
      LIMIT ?
    )
  )
`;

export interface ClipItem {
  id: number;
  hash: string;
  type: 'text' | 'image';
  preview: string;
  filePath: string | null;
  createdAt: number;
  pinned: number;
}

export async function insertClip(payload: {
  hash: string;
  type: 'text' | 'image';
  preview: string;
  content: string;
  filePath?: string;
  createdAt: number;
}) {
  const rows = await sqlite.execute<{ id: number }>(
    `INSERT INTO items (hash, type, preview, file_path, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(hash) DO UPDATE SET created_at = excluded.created_at
     RETURNING id`,
    [
      payload.hash,
      payload.type,
      payload.preview,
      payload.filePath ?? null,
      payload.createdAt,
    ]
  );

  const id = rows[0]?.id;
  if (!id) {
    return;
  }

  if (payload.type === 'text' && payload.content) {
    await sqlite.execute(
      `INSERT INTO content (item_id, full_text) VALUES (?, ?)
       ON CONFLICT(item_id) DO UPDATE SET full_text = excluded.full_text`,
      [id, payload.content]
    );
  }
}

export async function listClips(limit = 100, offset = 0): Promise<ClipItem[]> {
  return sqlite.execute<ClipItem>(
    `SELECT id, hash, type, preview,
            file_path AS filePath,
            created_at AS createdAt,
            pinned
     FROM items
     ORDER BY pinned DESC, created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export async function searchClips(
  query: string,
  limit = 100,
  offset = 0
): Promise<ClipItem[]> {
  const q = query.trim();
  if (!q) {
    return listClips(limit, offset);
  }

  const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`;

  return sqlite.execute<ClipItem>(
    `SELECT items.id, items.hash, items.type, items.preview,
            items.file_path AS filePath,
            items.created_at AS createdAt,
            items.pinned
     FROM items
     LEFT JOIN content ON content.item_id = items.id
     WHERE items.preview LIKE ? ESCAPE '\\'
        OR content.full_text LIKE ? ESCAPE '\\'
     ORDER BY items.pinned DESC, items.created_at DESC
     LIMIT ? OFFSET ?`,
    [pattern, pattern, limit, offset]
  );
}

export async function getContent(id: number): Promise<string | null> {
  const rows = await sqlite.execute<{ fullText: string }>(
    'SELECT full_text AS fullText FROM content WHERE item_id = ?',
    [id]
  );
  return rows[0]?.fullText ?? null;
}

export async function togglePin(id: number) {
  await sqlite.execute('UPDATE items SET pinned = 1 - pinned WHERE id = ?', [id]);
}

export async function deleteClip(id: number) {
  await sqlite.execute('DELETE FROM items WHERE id = ?', [id]);
}

export async function clearAll() {
  await sqlite.execute('DELETE FROM items');
}

export async function pruneOldItems(): Promise<number> {
  const [maxItems, maxAgeDays] = await Promise.all([
    readSetting('maxItems'),
    readSetting('maxAgeDays'),
  ]);
  const cutoff = Date.now() - maxAgeDays * DAY_MS;

  const doomed = await sqlite.execute<{ id: number }>(
    `SELECT id FROM items WHERE ${EXPIRABLE}`,
    [cutoff, maxItems]
  );
  if (doomed.length === 0) {
    return 0;
  }

  await sqlite.execute(`DELETE FROM items WHERE ${EXPIRABLE}`, [cutoff, maxItems]);

  // Rows first, then files: unlinking before the DELETE would risk leaving a
  // live row pointing at a file that no longer exists. Anything the DELETE
  // missed (a row inserted between the two statements) simply keeps its file.
  const remaining = await sqlite.execute<{ filePath: string | null }>(
    'SELECT file_path AS filePath FROM items WHERE file_path IS NOT NULL'
  );
  await ClipboardMonitor.syncImages(
    remaining.map(row => row.filePath).filter((p): p is string => !!p)
  );

  return doomed.length;
}
