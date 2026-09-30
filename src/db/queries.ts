import { sqlite } from '../native/PasteySQLite';

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

  if (id !== undefined && payload.type === 'text') {
    await sqlite.execute(
      `INSERT INTO content (item_id, full_text)
      VALUES (?, ?)
      ON CONFLICT(item_id)
      DO UPDATE SET full_text = excluded.full_text`,
      [id, payload.content],
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
