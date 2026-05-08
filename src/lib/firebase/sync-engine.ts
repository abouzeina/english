import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  collection, 
  writeBatch,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";
import { SRSMetadata } from "@/lib/srs";
import { useSyncStore } from "@/store/useSyncStore";

/**
 * Conflict Resolution Logic
 */
export const resolveSRSConflict = (local: SRSMetadata, remote: any) => {
  if (!remote) return local;
  
  // Use timestamps for definitive versioning
  const localTime = new Date(local.lastReview || 0).getTime();
  const remoteTime = remote.lastReview instanceof Timestamp 
    ? remote.lastReview.toMillis() 
    : new Date(remote.lastReview || 0).getTime();

  // If remote is newer, take remote. If they are the same, local wins for UX.
  return remoteTime > localTime ? remote : local;
};

/**
 * The Sync Engine handles debounced, batched writes to Firestore
 */
export class SyncEngine {
  private static instance: SyncEngine;
  private queue: Map<string, any> = new Map();
  private wordQueue: Map<string, any> = new Map(); // [wordId] -> data
  private debounceTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log("[SyncEngine] Online again, forcing sync...");
        this.forceSync();
      });
    }
  }

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Add a general update (progress, favorites)
   */
  public enqueue(userId: string, path: string, data: any) {
    const key = `${userId}/${path}`;
    const existing = this.queue.get(key) || {};
    if (!this.queue.has(key)) useSyncStore.getState().incrementPending();
    this.queue.set(key, { ...existing, ...data });
    this.triggerDebounce();
  }

  /**
   * Add a word update to the collection queue
   */
  public enqueueWord(userId: string, wordId: string, data: any) {
    const key = `${userId}/words/${wordId}`;
    if (!this.wordQueue.has(key)) useSyncStore.getState().incrementPending();
    this.wordQueue.set(key, data);
    this.triggerDebounce();
  }

  private triggerDebounce() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.processQueue(), 5000);
  }

  /**
   * Process the pending queue and push to Firestore
   */
  private async processQueue() {
    if (this.isProcessing || (this.queue.size === 0 && this.wordQueue.size === 0)) return;
    
    // Safety check for uninitialized db (e.g. during build)
    if (!db || !db.type) {
      console.warn("[SyncEngine] Skipping sync: Firestore is not initialized.");
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn("[SyncEngine] Offline, deferring sync.");
      return;
    }

    this.isProcessing = true;
    useSyncStore.getState().setSyncing(true);
    const batch = writeBatch(db);
    
    const currentQueue = new Map(this.queue);
    const currentWordQueue = new Map(this.wordQueue);
    
    this.queue.clear();
    this.wordQueue.clear();

    try {
      // Process General Docs
      for (const [key, data] of currentQueue.entries()) {
        const [userId, path] = key.split('/');
        const docRef = doc(db, 'users', userId, path, 'data');
        batch.set(docRef, { ...data, _syncTimestamp: serverTimestamp() }, { merge: true });
      }

      // Process Individual Words
      for (const [key, data] of currentWordQueue.entries()) {
        const segments = key.split('/');
        const userId = segments[0];
        const wordId = segments[2];
        const wordDocRef = doc(db, 'users', userId, 'words', wordId);
        batch.set(wordDocRef, { ...data, _syncTimestamp: serverTimestamp() }, { merge: true });
      }

      await batch.commit();
      console.log(`[SyncEngine] Successfully synced ${currentQueue.size} general docs and ${currentWordQueue.size} words.`);
      useSyncStore.getState().decrementPending(currentQueue.size + currentWordQueue.size);
      useSyncStore.getState().setLastSynced(Date.now());
    } catch (error) {
      console.error("[SyncEngine] Sync failed, re-queueing data:", error);
      // Best-effort re-queue
      currentQueue.forEach((val, key) => {
        const [userId, path] = key.split('/');
        this.enqueue(userId, path, val);
      });
      currentWordQueue.forEach((val, key) => {
        const segments = key.split('/');
        this.enqueueWord(segments[0], segments[2], val);
      });
    } finally {
      this.isProcessing = false;
      useSyncStore.getState().setSyncing(false);
    }
  }

  /**
   * Force an immediate sync
   */
  public async forceSync() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    await this.processQueue();
  }
}

export const syncEngine = SyncEngine.getInstance();
