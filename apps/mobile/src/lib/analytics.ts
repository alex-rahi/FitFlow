import { USE_PLACEHOLDERS } from '../constants/theme';

export type AnalyticsEventName =
  | 'screen_view'
  | 'feed_view_change'
  | 'feed_lane_change'
  | 'video_impression'
  | 'video_open'
  | 'like'
  | 'comment'
  | 'upload_complete'
  | 'ad_impression'
  | 'ad_click';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, unknown>;
  timestamp: string;
}

const MAX_EVENTS = 200;
const events: AnalyticsEvent[] = [];

function logEvent(event: AnalyticsEvent) {
  events.unshift(event);
  if (events.length > MAX_EVENTS) events.pop();
  if (__DEV__ || USE_PLACEHOLDERS) {
    console.log('[analytics]', event.name, event.properties ?? {});
  }
}

export const analytics = {
  track(name: AnalyticsEventName, properties?: Record<string, unknown>) {
    try {
      logEvent({
        name,
        properties,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Never block UX for analytics
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
};
