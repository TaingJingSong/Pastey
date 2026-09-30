import { db } from './schema';

export interface ClipItem {
  id: number;
  hash: string;
  type: 'text' | 'image';
  preview: string;
  filePath: string | null;
  createdAt: number;
  pinned: number;
}

export interface InsertClipPayload {
  hash: string;
  type: 'text' | 'image';
  preview: string;
  content: string;
  filePath?: string;
  createdAt: number;
}

export async function insertClip(
  payload: InsertClipPayload,
): Promise<void> {
  const result = await db.execute(
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
    ],
  );

  const id = result.rows?.[0]?.id as number | undefined;

  if (id !== undefined && payload.type === 'text') {
    await db.execute(
      `INSERT INTO content (item_id, full_text)
       VALUES (?, ?)
       ON CONFLICT(item_id) DO UPDATE SET full_text = excluded.full_text`,
      [id, payload.content],
    );
  }
}

export async function listClips(
  limit = 100,
  offset = 0,
): Promise<ClipItem[]> {
  const result = await db.execute(
    `SELECT id, hash, type, preview,
            file_path AS filePath,
            created_at AS createdAt,
            pinned
     FROM items
     ORDER BY pinned DESC, created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  return (result.rows ?? []).map((row): ClipItem => {
    if (row.type !== 'text' && row.type !== 'image') {
      throw new Error(`Invalid clip type: ${String(row.type)}`);
    }

    return {
      id: Number(row.id),
      hash: String(row.hash),
      type: row.type,
      preview: String(row.preview),
      filePath: row.filePath == null ? null : String(row.filePath),
      createdAt: Number(row.createdAt),
      pinned: Number(row.pinned),
    };
  });
}

export async function getContent(id: number): Promise<string | null> {
  const result = await db.execute(
    `SELECT full_text AS fullText
     FROM content
     WHERE item_id = ?`,
    [id],
  );

  return (result.rows?.[0]?.fullText as string | undefined) ?? null;
}

export async function togglePin(id: number): Promise<void> {
  await db.execute(
    'UPDATE items SET pinned = 1 - pinned WHERE id = ?'
    [id],
  );
}

export async function deleteClip(id: number): Promise<void> {
  await db.execute('DELETE FROM items WHERE id = ?', [id]);
}

export async function clearAll(): Promise<void> {
  await db.execute('DELETE FROM items');
}
