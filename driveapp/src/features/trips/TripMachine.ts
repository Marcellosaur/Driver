import { assign, fromPromise, setup } from 'xstate';

import type { Trip, TripStatus } from '@/types/db';

import { fetchActiveTrip, fetchAssignedTrips, patchTripStatus } from '@/features/trips/tripApi';

export type TripMachineInput = {
  tenantId: string;
  driverId: string;
};

type Ctx = {
  tenantId: string;
  driverId: string;
  trips: Trip[];
  selectedTripId: string | null;
  activeTripId: string | null;
  error: string | null;
  lastLat: number | null;
  lastLng: number | null;
};

export type TripMachineEvent =
  | { type: 'BOOT_CHECK' }
  | { type: 'TRIPS_LOADED'; trips: Trip[] }
  | { type: 'SELECT_TRIP'; tripId: string }
  | { type: 'CONFIRM_START' }
  | { type: 'CANCEL_START' }
  | { type: 'START_SUCCESS' }
  | {
      type: 'LOCATION_TICK';
      lat: number;
      lng: number;
      accuracy?: number;
      speed?: number;
      bearing?: number;
    }
  | { type: 'CONFIRM_END' }
  | { type: 'CANCEL_END' }
  | { type: 'END_SUCCESS' }
  | { type: 'REALTIME_STATUS_CHANGE'; status: TripStatus }
  | { type: 'NETWORK_LOST' }
  | { type: 'NETWORK_RESTORED' }
  | { type: 'ERROR'; message: string };

export const tripMachine = setup({
  types: {
    context: {} as Ctx,
    events: {} as TripMachineEvent,
    input: {} as TripMachineInput,
  },
  actors: {
    bootCheck: fromPromise(async ({ input }: { input: { tenantId: string; driverId: string } }) => {
      return fetchActiveTrip(input.tenantId, input.driverId);
    }),
    loadAssigned: fromPromise(async ({ input }: { input: { tenantId: string; driverId: string } }) => {
      return fetchAssignedTrips(input.tenantId, input.driverId);
    }),
    startTrip: fromPromise(
      async ({ input }: { input: { tenantId: string; tripId: string } }) => {
        await patchTripStatus(input.tenantId, input.tripId, 'active');
      },
    ),
    endTrip: fromPromise(async ({ input }: { input: { tenantId: string; tripId: string } }) => {
      await patchTripStatus(input.tenantId, input.tripId, 'completed');
    }),
  },
}).createMachine({
  id: 'trip',
  initial: 'idle',
  context: ({ input }) => ({
    tenantId: input.tenantId,
    driverId: input.driverId,
    trips: [],
    selectedTripId: null,
    activeTripId: null,
    error: null,
    lastLat: null,
    lastLng: null,
  }),
  states: {
    idle: {
      on: {
        BOOT_CHECK: 'loading_boot',
      },
    },
    loading_boot: {
      invoke: {
        src: 'bootCheck',
        input: ({ context }) => ({ tenantId: context.tenantId, driverId: context.driverId }),
        onDone: [
          {
            guard: ({ event }) => event.output !== null,
            target: 'active',
            actions: assign({
              activeTripId: ({ event }) => (event.output as Trip).id,
              error: () => null,
            }),
          },
          { target: 'loading_assigned', actions: assign({ error: () => null }) },
        ],
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) =>
              event.error instanceof Error ? event.error.message : 'Boot check failed',
          }),
        },
      },
    },
    loading_assigned: {
      invoke: {
        src: 'loadAssigned',
        input: ({ context }) => ({ tenantId: context.tenantId, driverId: context.driverId }),
        onDone: {
          target: 'selecting',
          actions: assign({
            trips: ({ event }) => event.output as Trip[],
            error: () => null,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) =>
              event.error instanceof Error ? event.error.message : 'Failed to load trips',
          }),
        },
      },
    },
    selecting: {
      on: {
        SELECT_TRIP: {
          actions: assign({
            selectedTripId: ({ event }) => event.tripId,
          }),
          target: 'confirming_start',
        },
        BOOT_CHECK: 'loading_boot',
        ERROR: { target: 'error', actions: assign({ error: ({ event }) => event.message }) },
      },
    },
    confirming_start: {
      on: {
        CANCEL_START: { target: 'selecting', actions: assign({ selectedTripId: () => null }) },
        CONFIRM_START: 'starting',
        BOOT_CHECK: 'loading_boot',
      },
    },
    starting: {
      invoke: {
        src: 'startTrip',
        input: ({ context }) => ({
          tenantId: context.tenantId,
          tripId: context.selectedTripId!,
        }),
        onDone: {
          target: 'active',
          actions: assign({
            activeTripId: ({ context }) => context.selectedTripId,
            error: () => null,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) =>
              event.error instanceof Error ? event.error.message : 'Start trip failed',
          }),
        },
      },
    },
    active: {
      on: {
        LOCATION_TICK: {
          actions: assign({
            lastLat: ({ event }) => event.lat,
            lastLng: ({ event }) => event.lng,
          }),
        },
        CONFIRM_END: 'confirming_end',
        REALTIME_STATUS_CHANGE: [
          {
            guard: ({ event }) => event.status === 'completed' || event.status === 'cancelled',
            target: 'ended',
            actions: assign({ activeTripId: () => null, selectedTripId: () => null }),
          },
        ],
        NETWORK_LOST: {},
        NETWORK_RESTORED: {},
        BOOT_CHECK: 'loading_boot',
        ERROR: { target: 'error', actions: assign({ error: ({ event }) => event.message }) },
      },
    },
    confirming_end: {
      on: {
        CANCEL_END: 'active',
        CONFIRM_END: 'ending',
      },
    },
    ending: {
      invoke: {
        src: 'endTrip',
        input: ({ context }) => ({
          tenantId: context.tenantId,
          tripId: context.activeTripId!,
        }),
        onDone: {
          target: 'ended',
          actions: assign({
            activeTripId: () => null,
            selectedTripId: () => null,
            error: () => null,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) =>
              event.error instanceof Error ? event.error.message : 'End trip failed',
          }),
        },
      },
    },
    ended: {
      on: {
        BOOT_CHECK: 'loading_boot',
      },
    },
    error: {
      on: {
        BOOT_CHECK: 'loading_boot',
        TRIPS_LOADED: {
          target: 'selecting',
          actions: assign({
            trips: ({ event }) => event.trips,
            error: () => null,
          }),
        },
      },
    },
  },
});
