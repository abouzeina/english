/**
 * SM-2 Algorithm Implementation
 * Enhanced with Focus Word logic and Learning Metrics
 */

export type LearningState = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface SRSMetadata {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string; // ISO String
  lastReview?: string; // ISO String
  state: LearningState;
  
  // New Learning Metrics (Subtle Intelligence)
  history: number[]; // Store last 10 quality results
  accuracy: number; // 0 to 1
  failCount: number;
  totalReviews: number;
}

export const INITIAL_SRS_METADATA: SRSMetadata = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: new Date().toISOString(),
  state: 'new',
  history: [],
  accuracy: 0,
  failCount: 0,
  totalReviews: 0,
};

/**
 * quality: 
 * 0 - Forgot (Wrong)
 * 1 - Struggled (Correct but hard)
 * 2 - Easy (Correct and fast)
 */
export function calculateSRS(quality: number, current: SRSMetadata): SRSMetadata {
  let { easeFactor, interval, repetitions, history, failCount, totalReviews } = current;
  let nextState: LearningState = current.state;

  // Track History & Metrics
  const nextHistory = [quality, ...history].slice(0, 10);
  const nextTotalReviews = totalReviews + 1;
  const nextFailCount = quality === 0 ? failCount + 1 : failCount;
  
  // Calculate accuracy based on history
  const correctInHistory = nextHistory.filter(q => q > 0).length;
  const nextAccuracy = nextHistory.length > 0 ? correctInHistory / nextHistory.length : 0;

  // Map our 0-2 quality to SM-2 0-5 scale
  const smQuality = quality === 0 ? 0 : quality === 1 ? 3 : 5;

  if (smQuality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  // Calculate Ease Factor
  easeFactor = easeFactor + (0.1 - (5 - smQuality) * (0.08 + (5 - smQuality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Determine state
  if (repetitions >= 8) {
    nextState = 'mastered';
  } else if (repetitions >= 1) {
    nextState = 'reviewing';
  } else {
    nextState = 'learning';
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReviewDate.toISOString(),
    lastReview: new Date().toISOString(),
    state: nextState,
    history: nextHistory,
    accuracy: nextAccuracy,
    failCount: nextFailCount,
    totalReviews: nextTotalReviews
  };
}

/**
 * Focus Words are words that need extra attention (subtle naming for "weak words")
 * Logic: Either failed recently or has low accuracy
 */
export function isFocusWord(meta: SRSMetadata | undefined): boolean {
  if (!meta || (meta.totalReviews || 0) < 3) return false;
  const recentlyFailed = meta.history && meta.history[0] === 0;
  const lowAccuracy = (meta.accuracy || 0) < 0.6;
  return recentlyFailed || lowAccuracy;
}
