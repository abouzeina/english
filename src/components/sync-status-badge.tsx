"use client";

import { useSyncStore } from "@/store/useSyncStore";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function SyncStatusBadge() {
  const { isOnline, isSyncing, pendingChanges, lastSyncedAt } = useSyncStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleOnline = () => useSyncStore.getState().setOnline(true);
    const handleOffline = () => useSyncStore.getState().setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!mounted) return null;

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest" title="Offline">
        <CloudOff className="w-3.5 h-3.5" />
      </div>
    );
  }

  if (isSyncing || pendingChanges > 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-widest" title="Syncing...">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </div>
    );
  }

  if (lastSyncedAt) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-emerald-500/50 hover:text-emerald-500 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-default" title="All changes saved to cloud">
        <Cloud className="w-3.5 h-3.5" />
      </div>
    );
  }

  return null;
}
