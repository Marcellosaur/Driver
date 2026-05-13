import * as SQLite from 'expo-sqlite';

export type OutboundQueueType = 'location_batch' | 'trip_status' | 'alert';

export interface OutboundRow {
  id: number;
  type: OutboundQueueType;
  payload: string;
  idempotency_key: string;
  created_at: number;
  attempts: number;
  last_error: string | null;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getOutboundDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('terobytez_outbound.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS outbound_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          payload TEXT NOT NULL,
          idempotency_key TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function enqueueOutbound(params: {
  type: OutboundQueueType;
  payload: unknown;
  idempotencyKey: string;
}): Promise<void> {
  const db = await getOutboundDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT OR REPLACE INTO outbound_queue (type, payload, idempotency_key, created_at, attempts, last_error)
     VALUES (?, ?, ?, ?, 0, NULL)`,
    params.type,
    JSON.stringify(params.payload),
    params.idempotencyKey,
    now,
  );
}

export async function listOutboundByTypes(types: OutboundQueueType[]): Promise<OutboundRow[]> {
  const db = await getOutboundDb();
  const placeholders = types.map(() => '?').join(', ');
  const rows = await db.getAllAsync<OutboundRow>(
    `SELECT * FROM outbound_queue WHERE type IN (${placeholders}) ORDER BY created_at ASC`,
    ...types,
  );
  return rows;
}

export async function deleteOutbound(id: number): Promise<void> {
  const db = await getOutboundDb();
  await db.runAsync(`DELETE FROM outbound_queue WHERE id = ?`, id);
}

export async function incrementAttempt(id: number, lastError: string): Promise<void> {
  const db = await getOutboundDb();
  await db.runAsync(
    `UPDATE outbound_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?`,
    lastError,
    id,
  );
}
