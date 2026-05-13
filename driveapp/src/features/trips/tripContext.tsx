import { useMachine } from '@xstate/react';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { SnapshotFrom } from 'xstate';

import { tripMachine } from '@/features/trips/TripMachine';
import type { TripMachineEvent } from '@/features/trips/TripMachine';

type TripMachineSnapshot = SnapshotFrom<typeof tripMachine>;

const TripSendContext = createContext<((event: TripMachineEvent) => void) | null>(null);
const TripStateContext = createContext<TripMachineSnapshot | null>(null);

export function TripProvider(props: { tenantId: string; driverId: string; children: ReactNode }) {
  const [state, send] = useMachine(tripMachine, {
    input: { tenantId: props.tenantId, driverId: props.driverId },
  });

  useEffect(() => {
    send({ type: 'BOOT_CHECK' });
  }, [send]);

  const sendStable = useMemo(() => send, [send]);

  return (
    <TripStateContext.Provider value={state}>
      <TripSendContext.Provider value={sendStable}>{props.children}</TripSendContext.Provider>
    </TripStateContext.Provider>
  );
}

export function useTripSend() {
  const ctx = useContext(TripSendContext);
  if (!ctx) throw new Error('useTripSend outside TripProvider');
  return ctx;
}

export function useTripState() {
  const ctx = useContext(TripStateContext);
  if (!ctx) throw new Error('useTripState outside TripProvider');
  return ctx;
}
