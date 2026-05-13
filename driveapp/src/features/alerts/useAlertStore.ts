import { create } from 'zustand';

export interface AlertSlice {
  status: 'idle' | 'pending' | 'acked' | 'failed';
  retryCount: number;
  lastAlertId: string | null;
  setStatus: (s: AlertSlice['status']) => void;
  bumpRetry: () => void;
  setLastAlertId: (id: string | null) => void;
  reset: () => void;
}

export const useAlertStore = create<AlertSlice>((set) => ({
  status: 'idle',
  retryCount: 0,
  lastAlertId: null,
  setStatus: (status) => set({ status }),
  bumpRetry: () => set((s) => ({ retryCount: s.retryCount + 1 })),
  setLastAlertId: (lastAlertId) => set({ lastAlertId }),
  reset: () => set({ status: 'idle', retryCount: 0, lastAlertId: null }),
}));
