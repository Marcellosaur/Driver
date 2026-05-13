import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const TEROBYTEZ_LOCATION_TASK = 'TEROBYTEZ_LOCATION_TASK';

type TaskBody = { locations: Location.LocationObject[] };

let defined = false;

let onLocations: ((locations: Location.LocationObject[]) => void) | null = null;

export function setBackgroundLocationHandler(
  handler: ((locations: Location.LocationObject[]) => void) | null,
): void {
  onLocations = handler;
}

export function ensureLocationTaskDefined(): void {
  if (defined) return;
  defined = true;
  TaskManager.defineTask(TEROBYTEZ_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const body = data as TaskBody | undefined;
    if (body?.locations?.length && onLocations) onLocations(body.locations);
  });
}

export async function startBackgroundLocationTask(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(TEROBYTEZ_LOCATION_TASK);
  if (started) return;

  await Location.startLocationUpdatesAsync(TEROBYTEZ_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 10,
    foregroundService: {
      notificationTitle: 'TeroBytez — Trip in progress',
      notificationBody: 'Location is being shared for this trip.',
    },
    showsBackgroundLocationIndicator: true,
  });
}

export async function stopBackgroundLocationTask(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(TEROBYTEZ_LOCATION_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(TEROBYTEZ_LOCATION_TASK);
  }
}
