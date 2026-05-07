import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingChanges: number;
  
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSynced: (timestamp: number) => void;
  incrementPending: () => void;
  decrementPending: (count: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncedAt: null,
  pendingChanges: 0,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSynced: (lastSyncedAt) => set({ lastSyncedAt }),
  incrementPending: () => set((state) => ({ pendingChanges: state.pendingChanges + 1 })),
  decrementPending: (count) => set((state) => ({ 
    pendingChanges: Math.max(0, state.pendingChanges - count) 
  })),
}));
