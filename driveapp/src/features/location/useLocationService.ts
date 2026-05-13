import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';

import {
  ensureLocationTaskDefined,
  setBackgroundLocationHandler,
  startBackgroundLocationTask,
  stopBackgroundLocationTask,
} from '@/features/location/BackgroundTask';
import { clearDriverLivePosition, upsertDriverLivePosition } from '@/features/location/livePositionApi';
import { LocationPipeline, mapExpoLocation } from '@/features/location/LocationPipeline';
import { useShareLiveLocationStore } from '@/features/location/useShareLiveLocationStore';
import { useTripSend } from '@/features/trips/tripContext';
import { useSession } from '@/shared/auth/useSession';

const LIVE_UPSERT_MIN_MS = 2000;

export function useLocationService(params: {
  isTripActive: boolean;
  tenantId: string;
  tripId: string | null;
  flushIntervalSec: number;
}): void {
  const send = useTripSend();
  const userId = useSession((s) => s.userId);
  const shareLiveLocation = useShareLiveLocationStore((s) => s.shareLiveLocation);
  const pipelineRef = useRef<LocationPipeline | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const lastLiveUpsertRef = useRef(0);

  const enabled =
    params.isTripActive && shareLiveLocation && !!params.tripId && !!params.tenantId && !!userId;

  useEffect(() => {
    ensureLocationTaskDefined();
  }, []);

  useEffect(() => {
    if (!enabled) {
      void stopBackgroundLocationTask();
      subRef.current?.remove();
      subRef.current = null;
      pipelineRef.current?.stop();
      pipelineRef.current = null;
      return;
    }

    const tripId = params.tripId!;
    const tenantId = params.tenantId;
    const uid = userId!;

    const pipeline = new LocationPipeline({
      tenantId,
      tripId,
      flushIntervalSec: params.flushIntervalSec,
      maxBuffer: 10,
    });
    pipelineRef.current = pipeline;
    setBackgroundLocationHandler((locations) => {
      const loc = locations[locations.length - 1];
      if (!loc) return;
      const m = mapExpoLocation(loc);
      pipeline.handleTick(m);
      const now = Date.now();
      if (now - lastLiveUpsertRef.current < LIVE_UPSERT_MIN_MS) return;
      lastLiveUpsertRef.current = now;
      void upsertDriverLivePosition({
        tripId,
        tenantId,
        userId: uid,
        lat: m.lat,
        lng: m.lng,
        accuracy: loc.coords.accuracy,
      }).catch(() => {});
    });
    pipeline.start();

    let cancelled = false;
    (async () => {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted || cancelled) return;
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.granted) {
        await startBackgroundLocationTask();
      }

      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (loc) => {
          pipeline.handleTick(mapExpoLocation(loc));
          send({
            type: 'LOCATION_TICK',
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
            speed: loc.coords.speed ?? undefined,
            bearing: loc.coords.heading ?? undefined,
          });

          const now = Date.now();
          if (now - lastLiveUpsertRef.current < LIVE_UPSERT_MIN_MS) return;
          lastLiveUpsertRef.current = now;
          void upsertDriverLivePosition({
            tripId,
            tenantId,
            userId: uid,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
          }).catch(() => {
            /* non-fatal; batch trail still buffered */
          });
        },
      );
    })();

    return () => {
      cancelled = true;
      setBackgroundLocationHandler(null);
      void stopBackgroundLocationTask();
      subRef.current?.remove();
      subRef.current = null;
      pipeline.stop();
      if (pipelineRef.current === pipeline) pipelineRef.current = null;
      void clearDriverLivePosition(tripId).catch(() => {
        /* row may already be gone */
      });
    };
  }, [enabled, params.tenantId, params.tripId, params.flushIntervalSec, send, userId]);
}
