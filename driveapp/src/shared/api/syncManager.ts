import NetInfo, { type NetInfoSubscription } from '@react-native-community/netinfo';

import { postAlertDirect } from '@/features/alerts/alertApi';
import { postLocationBatch } from '@/features/location/locationApi';
import { patchTripStatus } from '@/features/trips/tripApi';
import { ApiError } from '@/shared/api/apiClient';
import { scheduleLocalNotification } from '@/shared/push/expoNotificationsSafe';
import {
  deleteOutbound,
  incrementAttempt,
  listOutboundByTypes,
  type OutboundRow,
} from '@/shared/api/offlineQueue';

async function processTripStatusRow(row: OutboundRow): Promise<'ok' | 'retry' | 'dead'> {
  const payload = JSON.parse(row.payload) as {
    tenantId: string;
    tripId: string;
    status: 'active' | 'completed';
  };
  try {
    await patchTripStatus(payload.tenantId, payload.tripId, payload.status, { allowQueue: false });
    await deleteOutbound(row.id);
    return 'ok';
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = e instanceof ApiError ? e.body.status : undefined;
    if (code !== undefined && code >= 400 && code < 500) {
      await scheduleLocalNotification({
        content: {
          title: 'Sync failed',
          body: 'A trip status update was rejected. Open the app to retry.',
        },
        trigger: null,
      });
      await deleteOutbound(row.id);
      return 'dead';
    }
    await incrementAttempt(row.id, msg);
    return 'retry';
  }
}

async function processAlertRow(row: OutboundRow): Promise<'ok' | 'retry' | 'dead'> {
  const payload = JSON.parse(row.payload) as {
    tenantId: string;
    tripId: string | null;
    message: string;
  };
  try {
    await postAlertDirect(payload.tenantId, payload.tripId, payload.message);
    await deleteOutbound(row.id);
    return 'ok';
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = e instanceof ApiError ? e.body.status : undefined;
    if (code !== undefined && code >= 400 && code < 500) {
      await scheduleLocalNotification({
        content: {
          title: 'Alert sync failed',
          body: 'An alert could not be delivered.',
        },
        trigger: null,
      });
      await deleteOutbound(row.id);
      return 'dead';
    }
    await incrementAttempt(row.id, msg);
    return 'retry';
  }
}

async function processLocationBatchRow(row: OutboundRow): Promise<'ok' | 'retry' | 'dead'> {
  const payload = JSON.parse(row.payload) as Parameters<typeof postLocationBatch>[0];
  try {
    await postLocationBatch(payload, { allowQueue: false });
    await deleteOutbound(row.id);
    return 'ok';
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = e instanceof ApiError ? e.body.status : undefined;
    if (code !== undefined && code >= 400 && code < 500) {
      await scheduleLocalNotification({
        content: {
          title: 'Location sync failed',
          body: 'A location batch was rejected.',
        },
        trigger: null,
      });
      await deleteOutbound(row.id);
      return 'dead';
    }
    await incrementAttempt(row.id, msg);
    return 'retry';
  }
}

export async function flushOutboundQueue(): Promise<void> {
  const tripRows = await listOutboundByTypes(['trip_status']);
  for (const row of tripRows) {
    await processTripStatusRow(row);
  }

  const alertRows = await listOutboundByTypes(['alert']);
  for (const row of alertRows) {
    await processAlertRow(row);
  }

  const locRows = await listOutboundByTypes(['location_batch']);
  for (const row of locRows) {
    await processLocationBatchRow(row);
  }
}

let sub: NetInfoSubscription | null = null;

export function startSyncManager(): void {
  if (sub) return;
  sub = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void flushOutboundQueue();
    }
  });
}

export function stopSyncManager(): void {
  sub?.();
  sub = null;
}
