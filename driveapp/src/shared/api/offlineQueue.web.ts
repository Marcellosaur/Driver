/**
 * Web stub: expo-sqlite loads WASM that Metro cannot bundle for web by default.
 * Offline persistence is in-memory only on web (driver app targets iOS/Android).
 */

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

const rows: OutboundRow[] = [];
let nextId = 1;

export async function getOutboundDb(): Promise<never> {
  throw new Error('outbound SQLite queue is not available on web');
}

export async function enqueueOutbound(params: {
  type: OutboundQueueType;
  payload: unknown;
  idempotencyKey: string;
}): Promise<void> {
  const now = Date.now();
  const payloadStr = JSON.stringify(params.payload);
  const existing = rows.find((r) => r.idempotency_key === params.idempotencyKey);
  if (existing) {
    existing.type = params.type;
    existing.payload = payloadStr;
    existing.created_at = now;
    existing.attempts = 0;
    existing.last_error = null;
    return;
  }
  rows.push({
    id: nextId++,
    type: params.type,
    payload: payloadStr,
    idempotency_key: params.idempotencyKey,
    created_at: now,
    attempts: 0,
    last_error: null,
  });
}

export async function listOutboundByTypes(types: OutboundQueueType[]): Promise<OutboundRow[]> {
  const set = new Set(types);
  return rows.filter((r) => set.has(r.type)).sort((a, b) => a.created_at - b.created_at);
}

export async function deleteOutbound(id: number): Promise<void> {
  const i = rows.findIndex((r) => r.id === id);
  if (i >= 0) rows.splice(i, 1);
}

export async function incrementAttempt(id: number, lastError: string): Promise<void> {
  const row = rows.find((r) => r.id === id);
  if (row) {
    row.attempts += 1;
    row.last_error = lastError;
  }
}
