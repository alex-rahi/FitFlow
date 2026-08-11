import AsyncStorage from '@react-native-async-storage/async-storage';
import { USE_PLACEHOLDERS } from '../constants/theme';

export type AnalyticsEventName =
  | 'screen_view'
  | 'feed_view_change'
  | 'feed_lane_change'
  | 'video_impression'
  | 'video_open'
  | 'like'
  | 'comment'
  | 'upload_start'
  | 'upload_media_complete'
  | 'upload_complete'
  | 'moderation_passed'
  | 'moderation_flagged'
  | 'moderation_rejected'
  | 'ad_impression'
  | 'ad_click';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, unknown>;
  timestamp: string;
}

export interface SessionSummary {
  totalEvents: number;
  screenViews: number;
  videoImpressions: number;
  likes: number;
  comments: number;
  uploadsStarted: number;
  uploadsPublished: number;
  uploadsFlagged: number;
  uploadsRejected: number;
  adImpressions: number;
  laneChanges: number;
}

const STORAGE_KEY = '@gymtok/analytics_events';
const MAX_EVENTS = 200;

const events: AnalyticsEvent[] = [];
let hydrated = false;
let hydratePromise: Promise<void> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function logEvent(event: AnalyticsEvent) {
  events.unshift(event);
  if (events.length > MAX_EVENTS) events.pop();
  if (__DEV__ || USE_PLACEHOLDERS) {
    console.log('[analytics]', event.name, event.properties ?? {});
  }
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events)).catch(() => {});
  }, 400);
}

async function hydrateFromStorage() {
  if (hydrated) return;
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AnalyticsEvent[];
          if (Array.isArray(parsed)) {
            events.length = 0;
            events.push(...parsed.slice(0, MAX_EVENTS));
          }
        }
      } catch {
        // ignore corrupt storage
      } finally {
        hydrated = true;
      }
    })();
  }
  await hydratePromise;
}

function countEvents(name: AnalyticsEventName): number {
  return events.filter((event) => event.name === name).length;
}

export const analytics = {
  async hydrate() {
    await hydrateFromStorage();
  },

  track(name: AnalyticsEventName, properties?: Record<string, unknown>) {
    try {
      void hydrateFromStorage().then(() => {
        logEvent({
          name,
          properties,
          timestamp: new Date().toISOString(),
        });
        schedulePersist();
      });
    } catch {
      // Never block UX for analytics
    }
  },

  trackModerationOutcome(
    status: string | undefined,
    properties: Record<string, unknown>,
  ) {
    this.track('upload_complete', { ...properties, moderation_status: status });
    if (status === 'published') {
      this.track('moderation_passed', properties);
    } else if (status === 'pending_review') {
      this.track('moderation_flagged', properties);
    } else if (status === 'rejected') {
      this.track('moderation_rejected', properties);
    }
  },

  getRecentEvents(limit = 20): AnalyticsEvent[] {
    return events.slice(0, limit);
  },

  getEventCounts(): Record<string, number> {
    return events.reduce<Record<string, number>>((counts, event) => {
      counts[event.name] = (counts[event.name] ?? 0) + 1;
      return counts;
    }, {});
  },

  getTotalEvents(): number {
    return events.length;
  },

  getSessionSummary(): SessionSummary {
    return {
      totalEvents: events.length,
      screenViews: countEvents('screen_view'),
      videoImpressions: countEvents('video_impression'),
      likes: countEvents('like'),
      comments: countEvents('comment'),
      uploadsStarted: countEvents('upload_start'),
      uploadsPublished: countEvents('moderation_passed'),
      uploadsFlagged: countEvents('moderation_flagged'),
      uploadsRejected: countEvents('moderation_rejected'),
      adImpressions: countEvents('ad_impression'),
      laneChanges: countEvents('feed_lane_change'),
    };
  },

  async clearSession() {
    events.length = 0;
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
