import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';

import {
  ensureLocationTaskDefined,
  setBackgroundLocationHandler,
  startBackgroundLocationTask,
  stopBackgroundLocationTask,
} from '@/features/location/BackgroundTask';
import { LocationPipeline, mapExpoLocation } from '@/features/location/LocationPipeline';
import { useTripSend } from '@/features/trips/tripContext';

export function useLocationService(params: {
  isTripActive: boolean;
  tenantId: string;
  tripId: string | null;
  flushIntervalSec: number;
}): void {
  const send = useTripSend();
  const pipelineRef = useRef<LocationPipeline | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    ensureLocationTaskDefined();
  }, []);

  useEffect(() => {
    if (!params.isTripActive || !params.tripId) {
      void stopBackgroundLocationTask();
      subRef.current?.remove();
      subRef.current = null;
      pipelineRef.current?.stop();
      pipelineRef.current = null;
      return;
    }

    const pipeline = new LocationPipeline({
      tenantId: params.tenantId,
      tripId: params.tripId,
      flushIntervalSec: params.flushIntervalSec,
      maxBuffer: 10,
    });
    pipelineRef.current = pipeline;
    setBackgroundLocationHandler((locations) => {
      const loc = locations[locations.length - 1];
      if (loc) pipeline.handleTick(mapExpoLocation(loc));
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
    };
  }, [params.isTripActive, params.tenantId, params.tripId, params.flushIntervalSec, send]);
}
