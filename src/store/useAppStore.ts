import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SRSMetadata, INITIAL_SRS_METADATA, calculateSRS, isFocusWord } from '@/lib/srs';

interface SessionStats {
  correct: number;
  total: number;
  startTime: number;
  xpGained: number;
  focusWordsIdentified: number;
}

interface UserProgress {
  userWords: Record<string, SRSMetadata>;
  favorites: string[];
  completedLessons: string[];
  lastStudiedLesson: string | null;
  
  // Analytics & Gamification
  xp: number;
  streak: number;
  lastActivityDate: string | null;

  // Session Engine
  currentSession: SessionStats | null;
}

interface AppActions {
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  markLessonCompleted: (id: string) => void;
  setLastStudied: (id: string) => void;
  
  // SRS Actions
  updateWordProgress: (wordId: string, quality: number) => void;
  getWordMetadata: (wordId: string) => SRSMetadata;
  getReviewQueue: () => string[];
  getFocusWords: () => string[];
  
  // Session Actions
  startSession: () => void;
  endSession: () => SessionStats | null;
}

export type StoreState = UserProgress & AppActions;

export const useAppStore = create<StoreState>()(
  persist(
    (set, get) => ({
      userWords: {},
      favorites: [],
      completedLessons: [],
      lastStudiedLesson: null,
      xp: 0,
      streak: 0,
      lastActivityDate: null,
      currentSession: null,

      toggleFavorite: (id) =>
        set((state) => {
          const isFav = state.favorites.includes(id);
          return {
            favorites: isFav
              ? state.favorites.filter((fav) => fav !== id)
              : [...state.favorites, id],
          };
        }),

      isFavorite: (id) => get().favorites.includes(id),

      markLessonCompleted: (id) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(id)
            ? state.completedLessons
            : [...state.completedLessons, id],
        })),

      setLastStudied: (id) => set({ lastStudiedLesson: id }),

      getWordMetadata: (wordId) => {
        return get().userWords?.[wordId] || INITIAL_SRS_METADATA;
      },

      updateWordProgress: (wordId, quality) =>
        set((state) => {
          const userWords = state.userWords || {};
          const currentMetadata = userWords[wordId] || INITIAL_SRS_METADATA;
          const nextMetadata = calculateSRS(quality, currentMetadata);
          
          const xpGain = quality === 2 ? 10 : quality === 1 ? 5 : 0;
          
          // Update Session Stats if active
          const currentSession = state.currentSession;
          let nextSession = null;
          if (currentSession) {
            nextSession = {
              ...currentSession,
              total: currentSession.total + 1,
              correct: quality > 0 ? currentSession.correct + 1 : currentSession.correct,
              xpGained: currentSession.xpGained + xpGain,
              focusWordsIdentified: isFocusWord(nextMetadata) ? currentSession.focusWordsIdentified + 1 : currentSession.focusWordsIdentified
            };
          }

          const today = new Date().toDateString();
          const lastActivity = state.lastActivityDate ? new Date(state.lastActivityDate).toDateString() : null;
          let nextStreak = state.streak || 0;

          if (lastActivity !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastActivity === yesterday.toDateString()) {
              nextStreak += 1;
            } else {
              nextStreak = 1;
            }
          }

          return {
            userWords: {
              ...userWords,
              [wordId]: nextMetadata,
            },
            xp: (state.xp || 0) + xpGain,
            streak: nextStreak,
            lastActivityDate: new Date().toISOString(),
            currentSession: nextSession
          };
        }),

      getReviewQueue: () => {
        const userWords = get().userWords;
        if (!userWords) return [];
        const now = new Date();
        return Object.keys(userWords).filter((id) => {
          const meta = userWords[id];
          if (!meta || !meta.nextReview) return false;
          return new Date(meta.nextReview) <= now;
        });
      },

      getFocusWords: () => {
        const userWords = get().userWords;
        if (!userWords) return [];
        return Object.keys(userWords).filter(id => isFocusWord(userWords[id]));
      },

      startSession: () => set({ 
        currentSession: { 
          correct: 0, 
          total: 0, 
          startTime: Date.now(), 
          xpGained: 0,
          focusWordsIdentified: 0
        } 
      }),

      endSession: () => {
        const stats = get().currentSession;
        set({ currentSession: null });
        return stats;
      },
    }),
    {
      name: 'wafi-learning-storage-v4',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useWafiStore<T>(selector: (state: StoreState) => T): T | undefined {
  const result = useAppStore(selector);
  const [data, setData] = useState<T>();

  useEffect(() => {
    setData(result);
  }, [result]); // Keep in sync after initial hydration

  return data;
}
