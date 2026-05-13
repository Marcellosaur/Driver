import { create } from 'zustand';

interface TripUiSlice {
  selectedTripId: string | null;
  setSelectedTripId: (id: string | null) => void;
}

export const useTripStore = create<TripUiSlice>((set) => ({
  selectedTripId: null,
  setSelectedTripId: (id) => set({ selectedTripId: id }),
}));
