'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { syncEngine, resolveSRSConflict } from '@/lib/firebase/sync-engine';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc, writeBatch, onSnapshot, serverTimestamp, Timestamp, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useSyncStore } from '@/store/useSyncStore';
import { toast } from 'sonner';

export function SyncManager() {
  const user = useAuthStore((state) => state.user);
  const appState = useAppStore();
  const setLastSynced = useSyncStore(state => state.setLastSynced);
  const isInitialMount = useRef(true);
  const isRemoteUpdate = useRef(false);

  // 1. Initial Data Fetch & Migration
  useEffect(() => {
    if (!user) return;

    const performSync = async () => {
      try {
        console.log("[SyncManager] Starting initial sync for user:", user.uid);
        
        // Check if migration is completed
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists() || !userDoc.data()?.migrationCompleted) {
          console.log("[SyncManager] Performing migration from localStorage...");
          
          // Push current local state to Firestore
          const batch = writeBatch(db);
          
          // Progress & Stats
          const progressRef = doc(db, 'users', user.uid, 'progress', 'data');
          batch.set(progressRef, {
            xp: appState.xp,
            streak: appState.streak,
            completedLessons: appState.completedLessons,
            lastActivityDate: appState.lastActivityDate
          }, { merge: true });

          // Favorites
          const favRef = doc(db, 'users', user.uid, 'favorites', 'data');
          batch.set(favRef, { list: appState.favorites }, { merge: true });

          // SRS Data
          const srsRef = doc(db, 'users', user.uid, 'srs', 'data');
          batch.set(srsRef, { userWords: appState.userWords }, { merge: true });

          // Mark migration completed
          batch.set(userDocRef, { migrationCompleted: true }, { merge: true });
          
          await batch.commit();
          toast.success('تمت مزامنة بياناتك المحلية مع حسابك');
        } else if (!userDoc.data()?.migrationV2Completed) {
          // Phase 2 Migration: Single document -> Collection
          console.log("[SyncManager] Performing Migration V2 (Sub-collections)...");
          const srsDoc = await getDoc(doc(db, 'users', user.uid, 'srs', 'data'));
          
          if (srsDoc.exists()) {
            const data = srsDoc.data();
            const words = data.userWords || {};
            const wordIds = Object.keys(words);
            
            // Process in chunks of 500 (Firestore batch limit)
            for (let i = 0; i < wordIds.length; i += 500) {
              const batch = writeBatch(db);
              const chunk = wordIds.slice(i, i + 500);
              chunk.forEach(id => {
                const wordRef = doc(db, 'users', user.uid, 'words', id);
                batch.set(wordRef, { ...words[id], _syncTimestamp: serverTimestamp() });
              });
              await batch.commit();
            }
            
            // Delete old data
            await deleteDoc(doc(db, 'users', user.uid, 'srs', 'data'));
          }
          
          await setDoc(userDocRef, { migrationV2Completed: true }, { merge: true });
          console.log("[SyncManager] Migration V2 Completed.");
        }
        
        // After migration check, PULL data if needed
        if (userDoc.exists()) {
          console.log("[SyncManager] Pulling remote data...");
          
          const [progressDoc, favDoc, wordsSnapshot] = await Promise.all([
            getDoc(doc(db, 'users', user.uid, 'progress', 'data')),
            getDoc(doc(db, 'users', user.uid, 'favorites', 'data')),
            getDocs(collection(db, 'users', user.uid, 'words'))
          ]);

          if (progressDoc.exists()) {
            const data = progressDoc.data();
            useAppStore.setState({
              xp: Math.max(appState.xp, data.xp || 0),
              streak: Math.max(appState.streak, data.streak || 0),
              completedLessons: Array.from(new Set([...appState.completedLessons, ...(data.completedLessons || [])])),
            });
          }

          if (favDoc.exists()) {
            const data = favDoc.data();
            useAppStore.setState({
              favorites: Array.from(new Set([...appState.favorites, ...(data.list || [])]))
            });
          }

          if (!wordsSnapshot.empty) {
            const mergedWords = { ...appState.userWords };
            wordsSnapshot.forEach(doc => {
              const wordId = doc.id;
              const remoteWord = doc.data();
              mergedWords[wordId] = resolveSRSConflict(mergedWords[wordId], remoteWord);
            });
            useAppStore.setState({ userWords: mergedWords });
          }
        }

        // 3. Set up REAL-TIME LISTENERS (Scoped)
        // We use metadata.hasPendingWrites to ignore updates that originated from this client
        const unsubProgress = onSnapshot(doc(db, 'users', user.uid, 'progress', 'data'), (snapshot) => {
          if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
            const data = snapshot.data();
            const current = useAppStore.getState();
            
            // Only update if actually different to prevent re-render loops
            if (data.xp !== current.xp || data.streak !== current.streak || data.completedLessons?.length !== current.completedLessons?.length) {
              console.log("[SyncManager] Remote progress update applied");
              useAppStore.setState({
                xp: data.xp || 0,
                streak: data.streak || 0,
                completedLessons: data.completedLessons || []
              });
              setLastSynced(Date.now());
            }
          }
        });

        const unsubFavs = onSnapshot(doc(db, 'users', user.uid, 'favorites', 'data'), (snapshot) => {
          if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
            const data = snapshot.data();
            const current = useAppStore.getState();
            if (JSON.stringify(data.list) !== JSON.stringify(current.favorites)) {
              console.log("[SyncManager] Remote favorites update applied");
              useAppStore.setState({ favorites: data.list || [] });
              setLastSynced(Date.now());
            }
          }
        });

        // For SRS, we don't listen to the whole collection in real-time to save reads.
        // We only listen to the last updated word to see if there's a sync from another device.
        const unsubSRS = onSnapshot(query(collection(db, 'users', user.uid, 'words'), limit(1)), (snapshot) => {
          if (!snapshot.empty && !snapshot.metadata.hasPendingWrites) {
             // If any word changed on another device, we might want to refresh.
             // For simplicity in Phase 2, we rely on initial mount pull.
             // In a multi-device setup, this could trigger a partial refresh.
          }
        });

        return () => {
          unsubProgress();
          unsubFavs();
          unsubSRS();
        };
      } catch (error) {
        console.error("[SyncManager] Initial sync failed:", error);
      }
    };

    performSync();
  }, [user?.uid]);

  // 2. Continuous Sync (Watch for changes)
  useEffect(() => {
    if (!user || isInitialMount.current || isRemoteUpdate.current) {
      if (user) isInitialMount.current = false;
      return;
    }

    // Debounce state changes and push to SyncEngine
    const timer = setTimeout(() => {
      console.log("[SyncManager] Enqueuing local changes...");
      
      syncEngine.enqueue(user.uid, 'progress', {
        xp: appState.xp,
        streak: appState.streak,
        completedLessons: appState.completedLessons,
        lastActivityDate: appState.lastActivityDate
      });

      syncEngine.enqueue(user.uid, 'favorites', {
        list: appState.favorites
      });

      // Enqueue only modified words
      const modifiedWords = Object.keys(appState.modifiedWords || {});
      if (modifiedWords.length > 0) {
        modifiedWords.forEach(wordId => {
          syncEngine.enqueueWord(user.uid, wordId, appState.userWords[wordId]);
        });
        // Clear modified words locally after enqueuing
        appState.clearModifiedWords();
      }
    }, 1000); // Wait for 1s of stability before enqueuing

    return () => clearTimeout(timer);
  }, [
    user?.uid, 
    appState.xp, 
    appState.streak, 
    appState.favorites, 
    appState.userWords, 
    appState.modifiedWords,
    appState.completedLessons
  ]);

  // 3. Tab Close Safety: Force sync before the user leaves
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are pending changes in the sync engine or queue
      // We force a sync attempt here. Note: Modern browsers are very restrictive 
      // about what can happen in beforeunload, so this is a best-effort.
      syncEngine.forceSync();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return null; // Headless component
}
