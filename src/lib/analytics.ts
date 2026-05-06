/**
 * Analytics Event System
 */

export type AnalyticsEvent = 
  | { type: 'word_played'; wordId: string; speed: number; repeat: number }
  | { type: 'review_completed'; wordId: string; quality: number; nextReview: string }
  | { type: 'quiz_passed'; lessonId: string; score: number }
  | { type: 'lesson_finished'; lessonId: string }
  | { type: 'review_skipped'; wordId: string }
  | { type: 'xp_gained'; amount: number; total: number }
  | { type: 'streak_updated'; count: number };

class Analytics {
  private static instance: Analytics;
  private isEnabled: boolean = process.env.NODE_ENV === 'production';

  private constructor() {}

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  public track(event: AnalyticsEvent) {
    if (!this.isEnabled) {
      console.log('📊 [Analytics Event]:', event);
      return;
    }

    // Here you would integrate with PostHog, Plausible, or Mixpanel
    // Example: window.plausible(event.type, { props: event });
  }
}

export const analytics = Analytics.getInstance();
