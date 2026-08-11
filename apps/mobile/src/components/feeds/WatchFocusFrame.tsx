import { ReactNode } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { FeedLaneId } from '../../constants/categories';
import { FeedTheme, getLaneTheme, withAlpha } from '../../lib/feedTheme';
import { ScrollFeedItem } from '../../lib/feedItems';
import { PeekPreview } from './PeekPreview';
import { Spacing } from '../../constants/theme';

const LANE_SHORT: Record<FeedLaneId, string> = {
  main_feed: 'FY',
  workouts: 'WO',
  nutrition: 'NU',
  prs: 'PR',
  photos: 'PH',
  community: 'TK',
};

interface LaneInfo {
  id: FeedLaneId;
  label: string;
}

interface Props {
  width: number;
  height: number;
  theme: FeedTheme;
  lanes: LaneInfo[];
  laneIdx: number;
  itemIdx: number;
  itemCount: number;
  prevItem: ScrollFeedItem | null;
  nextItem: ScrollFeedItem | null;
  prevLaneItem: ScrollFeedItem | null;
  nextLaneItem: ScrollFeedItem | null;
  prevLaneTheme: FeedTheme | null;
  nextLaneTheme: FeedTheme | null;
  prevLaneLabel?: string;
  nextLaneLabel?: string;
  hudOpacity: Animated.Value;
  topInterests?: { topic: string; label: string; score: number }[];
  children: ReactNode;
}

export function getWatchScreenSize(width: number, height: number) {
  const frameW = Math.min(width * 0.9, 420);
  const screenH = height * 0.68;
  const screenW = frameW * 0.92;
  return { screenH, screenW, frameW };
}

/** Watch-inspired focus frame: squircle center, edge peeks, circular lane bubbles. */
export function WatchFocusFrame({
  width,
  height,
  theme,
  lanes,
  laneIdx,
  itemIdx,
  itemCount,
  prevItem,
  nextItem,
  prevLaneItem,
  nextLaneItem,
  prevLaneTheme,
  nextLaneTheme,
  prevLaneLabel,
  nextLaneLabel,
  hudOpacity,
  topInterests = [],
  children,
}: Props) {
  const { screenH, screenW, frameW } = getWatchScreenSize(width, height);

  return (
    <View style={[styles.chassis, { height, width }]}>
      <View style={[styles.bezelRing, { width: frameW + 16, height: screenH + 80 }]}>
        <View style={[styles.bezelInner, { borderColor: withAlpha(theme.accent, 0.2) }]}>
          <Animated.View style={[styles.bubbleRow, { opacity: hudOpacity }]}>
            {lanes.map((lane, i) => {
              const lt = i === laneIdx;
              const laneTheme = getLaneTheme(lane.id);
              const accent = laneTheme.accent;
              const scale = lt ? 1.15 : Math.abs(i - laneIdx) === 1 ? 0.92 : 0.78;
              const opacity = lt ? 1 : Math.abs(i - laneIdx) === 1 ? 0.55 : 0.28;
              return (
                <View
                  key={lane.id}
                  style={[
                    styles.bubble,
                    {
                      transform: [{ scale }],
                      opacity,
                      borderColor: lt ? accent : 'rgba(255,255,255,0.12)',
                      backgroundColor: lt ? laneTheme.accentSoft : 'rgba(255,255,255,0.05)',
                    },
                  ]}
                >
                  <Text style={[styles.bubbleText, lt && { color: accent }]}>
                    {LANE_SHORT[lane.id]}
                  </Text>
                </View>
              );
            })}
          </Animated.View>

          {topInterests.length > 0 ? (
            <Animated.View style={[styles.interestRow, { opacity: hudOpacity }]}>
              {topInterests.map((interest) => (
                <View
                  key={interest.topic}
                  style={[styles.interestChip, { borderColor: withAlpha(theme.accent, 0.35) }]}
                >
                  <Text style={[styles.interestChipText, { color: theme.accent }]}>{interest.label}</Text>
                </View>
              ))}
            </Animated.View>
          ) : null}

          <View style={styles.peekTop}>
            {nextItem ? (
              <PeekPreview item={nextItem} theme={theme} variant="vertical" />
            ) : (
              <View style={styles.peekSpacer} />
            )}
          </View>

          <View style={[styles.focusRow, { height: screenH }]}>
            <View style={styles.peekSide}>
              {prevLaneTheme ? (
                <PeekPreview
                  item={prevLaneItem}
                  theme={prevLaneTheme}
                  variant="horizontal"
                  label={prevLaneLabel?.slice(0, 2)}
                />
              ) : (
                <View style={styles.peekSideSpacer} />
              )}
            </View>

            <View
              style={[
                styles.screen,
                {
                  width: screenW,
                  height: screenH,
                  borderColor: withAlpha(theme.accent, 0.33),
                  shadowColor: theme.accent,
                },
              ]}
            >
              <View style={[styles.screenInner, { borderColor: 'rgba(255,255,255,0.08)' }]}>
                {children}
              </View>
              <View style={styles.pageDots}>
                {Array.from({ length: Math.min(itemCount, 8) }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === Math.min(itemIdx, 7) && { backgroundColor: theme.accent, width: 14 },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.peekSide}>
              {nextLaneTheme ? (
                <PeekPreview
                  item={nextLaneItem}
                  theme={nextLaneTheme}
                  variant="horizontal"
                  label={nextLaneLabel?.slice(0, 2)}
                />
              ) : (
                <View style={styles.peekSideSpacer} />
              )}
            </View>
          </View>

          <View style={styles.peekBottom}>
            {prevItem ? (
              <PeekPreview item={prevItem} theme={theme} variant="vertical" />
            ) : (
              <View style={styles.peekSpacer} />
            )}
          </View>
        </View>
      </View>

      <View style={styles.crownColumn} pointerEvents="none">
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.crownDot,
              i === 2 && { backgroundColor: theme.accent, opacity: 0.6 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chassis: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0e0e10',
  },
  bezelRing: {
    borderRadius: 44,
    backgroundColor: '#1a1a1e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    ...(Platform.OS === 'web' ? {
      // @ts-expect-error web
      boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
    } : {}),
  },
  bezelInner: {
    flex: 1,
    width: '100%',
    borderRadius: 38,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  interestChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  interestChipText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  peekTop: { width: '100%', paddingHorizontal: 4 },
  peekBottom: { width: '100%', paddingHorizontal: 4 },
  peekSpacer: { height: 40 },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  peekSide: {
    width: 52,
    height: '100%',
    justifyContent: 'center',
  },
  peekSideSpacer: { width: 52 },
  screen: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  screenInner: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
  },
  pageDots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  crownColumn: {
    position: 'absolute',
    right: 8,
    top: '38%',
    gap: 6,
    opacity: 0.35,
  },
  crownDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
