import { create } from 'zustand';

interface ShareLiveLocationState {
  shareLiveLocation: boolean;
  setShareLiveLocation: (v: boolean) => void;
  reset: () => void;
}

export const useShareLiveLocationStore = create<ShareLiveLocationState>((set) => ({
  shareLiveLocation: false,
  setShareLiveLocation: (v) => set({ shareLiveLocation: v }),
  reset: () => set({ shareLiveLocation: false }),
}));
