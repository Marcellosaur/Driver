import * as Location from 'expo-location';

import { postLocationBatch } from '@/features/location/locationApi';

export interface LocationPipelineOptions {
  tenantId: string;
  tripId: string;
  flushIntervalSec: number;
  maxBuffer: number;
}

interface Buffered {
  lat: number;
  lng: number;
  recorded_at: string;
  payload: {
    accuracy: number;
    speed: number;
    bearing: number;
    heading: number;
  };
}

export class LocationPipeline {
  private buffer: Buffered[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private belowSpeedSince: number | null = null;
  private running = false;

  constructor(private readonly opts: LocationPipelineOptions) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.belowSpeedSince = null;
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.opts.flushIntervalSec * 1000);
  }

  stop(): void {
    this.running = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    void this.flush();
  }

  /** Call on each foreground location tick (and optionally from background task bridge). */
  handleTick(coords: {
    lat: number;
    lng: number;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
    course?: number | null;
  }): void {
    const speed = coords.speed ?? 0;
    if (speed < 0.5) {
      if (this.belowSpeedSince === null) this.belowSpeedSince = Date.now();
    } else {
      this.belowSpeedSince = null;
    }

    const recorded_at = new Date().toISOString();
    const payload = {
      accuracy: coords.accuracy ?? 0,
      speed,
      bearing: coords.course ?? coords.heading ?? 0,
      heading: coords.heading ?? coords.course ?? 0,
    };

    if (this.buffer.length >= this.opts.maxBuffer) {
      this.buffer.shift();
    }
    this.buffer.push({
      lat: coords.lat,
      lng: coords.lng,
      recorded_at,
      payload,
    });
  }

  private isStationaryTooLong(): boolean {
    if (this.belowSpeedSince === null) return false;
    return Date.now() - this.belowSpeedSince >= 30_000;
  }

  private async flush(): Promise<void> {
    if (!this.running && this.buffer.length === 0) return;
    if (this.isStationaryTooLong()) return;
    if (this.buffer.length === 0) return;

    const samples = this.buffer.splice(0, this.buffer.length).map((b) => ({
      tenant_id: this.opts.tenantId,
      trip_id: this.opts.tripId,
      lat: b.lat,
      lng: b.lng,
      recorded_at: b.recorded_at,
      payload: b.payload,
    }));

    try {
      await postLocationBatch({
        tenantId: this.opts.tenantId,
        tripId: this.opts.tripId,
        samples,
      });
    } catch {
      // batch already queued on retryable failure inside postLocationBatch
    }
  }
}

export function mapExpoLocation(loc: Location.LocationObject): Parameters<
  LocationPipeline['handleTick']
>[0] {
  const c = loc.coords;
  return {
    lat: c.latitude,
    lng: c.longitude,
    accuracy: c.accuracy ?? undefined,
    speed: c.speed ?? undefined,
    heading: c.heading ?? undefined,
    course: 'course' in c ? (c as { course?: number }).course : undefined,
  };
}
