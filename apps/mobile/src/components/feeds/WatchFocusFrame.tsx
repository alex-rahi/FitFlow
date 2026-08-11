import { ReactNode } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { FeedLaneId } from '../../constants/categories';
import { FeedTheme, withAlpha } from '../../lib/feedTheme';
import { ScrollFeedItem } from '../../lib/feedItems';
import { PeekPreview } from './PeekPreview';
import { WatchCaseChrome } from './WatchCaseChrome';
import { WatchLaneDock } from './WatchLaneDock';

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
  laneLabel: string;
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
  dragOffsetX?: Animated.Value;
  dragOffsetY?: Animated.Value;
  pageW?: number;
  pageH?: number;
  children: ReactNode;
}

export function getWatchScreenSize(width: number, height: number) {
  const caseW = Math.min(width * 0.82, 380);
  const caseH = height * 0.78;
  const screenW = caseW * 0.9;
  const screenH = caseH * 0.62;
  return { screenH, screenW, caseW, caseH, frameW: caseW };
}

/** watchOS-style feed shell: case chrome, arc dock, complications, fluid peeks. */
export function WatchFocusFrame({
  width,
  height,
  theme,
  lanes,
  laneIdx,
  itemIdx,
  itemCount,
  laneLabel,
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
  dragOffsetX,
  dragOffsetY,
  pageW = 1,
  pageH = 1,
  children,
}: Props) {
  const { screenH, screenW, caseW, caseH } = getWatchScreenSize(width, height);
  const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const nextPeekScale = dragOffsetY?.interpolate({
    inputRange: [-pageH, 0],
    outputRange: [1.14, 0.92],
    extrapolate: 'clamp',
  });
  const prevPeekScale = dragOffsetY?.interpolate({
    inputRange: [0, pageH],
    outputRange: [0.92, 1.14],
    extrapolate: 'clamp',
  });
  const nextLanePeekScale = dragOffsetX?.interpolate({
    inputRange: [-pageW, 0],
    outputRange: [1.12, 0.9],
    extrapolate: 'clamp',
  });
  const prevLanePeekScale = dragOffsetX?.interpolate({
    inputRange: [0, pageW],
    outputRange: [0.9, 1.12],
    extrapolate: 'clamp',
  });

  const screenScale = dragOffsetY?.interpolate({
    inputRange: [-pageH, 0, pageH],
    outputRange: [0.97, 1, 0.97],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.chassis, { height, width }]}>
      <View style={[styles.caseOuter, { width: caseW + 28, height: caseH + 20 }]}>
        <View style={[styles.caseBody, { width: caseW, height: caseH, borderRadius: caseW * 0.19 }]}>
          <WatchCaseChrome theme={theme} caseW={caseW} caseH={caseH} />
          <View style={[styles.caseBezel, { borderRadius: caseW * 0.17 }]}>
            <Animated.View style={[styles.complicationRow, { opacity: hudOpacity }]}>
              <Text style={styles.complicationTime}>{timeStr}</Text>
              <View style={styles.complicationCenter}>
                <Text style={[styles.complicationLane, { color: theme.accent }]}>{laneLabel}</Text>
                <Text style={styles.complicationIndex}>
                  {itemCount > 0 ? `${itemIdx + 1}/${itemCount}` : '—'}
                </Text>
              </View>
              {topInterests[0] ? (
                <Text style={[styles.complicationInterest, { color: theme.accent }]}>
                  {topInterests[0].label}
                </Text>
              ) : (
                <Text style={styles.complicationBrand}>GymTok</Text>
              )}
            </Animated.View>

            <WatchLaneDock lanes={lanes} laneIdx={laneIdx} hudOpacity={hudOpacity} />

            <Animated.View
              style={[
                styles.peekTop,
                dragOffsetY && nextPeekScale ? { transform: [{ scale: nextPeekScale }] } : null,
              ]}
            >
              {nextItem ? (
                <PeekPreview item={nextItem} theme={theme} variant="vertical" />
              ) : (
                <View style={styles.peekSpacer} />
              )}
            </Animated.View>

            <View style={[styles.focusRow, { height: screenH }]}>
              <Animated.View
                style={[
                  styles.peekSide,
                  dragOffsetX && prevLanePeekScale ? { transform: [{ scale: prevLanePeekScale }] } : null,
                ]}
              >
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
              </Animated.View>

              <Animated.View
                style={[
                  styles.screen,
                  {
                    width: screenW,
                    height: screenH,
                    borderRadius: screenW * 0.11,
                    borderColor: withAlpha(theme.accent, 0.28),
                    shadowColor: theme.accent,
                    transform: dragOffsetY && screenScale ? [{ scale: screenScale }] : [],
                  },
                ]}
              >
                <View style={[styles.screenInner, { borderRadius: screenW * 0.1 }]}>
                  {children}
                </View>
                <View style={styles.pageDots}>
                  {Array.from({ length: Math.min(itemCount, 9) }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === Math.min(itemIdx, 8) && {
                          backgroundColor: theme.accent,
                          width: 16,
                          height: 5,
                          borderRadius: 3,
                        },
                      ]}
                    />
                  ))}
                </View>
              </Animated.View>

              <Animated.View
                style={[
                  styles.peekSide,
                  dragOffsetX && nextLanePeekScale ? { transform: [{ scale: nextLanePeekScale }] } : null,
                ]}
              >
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
              </Animated.View>
            </View>

            <Animated.View
              style={[
                styles.peekBottom,
                dragOffsetY && prevPeekScale ? { transform: [{ scale: prevPeekScale }] } : null,
              ]}
            >
              {prevItem ? (
                <PeekPreview item={prevItem} theme={theme} variant="vertical" />
              ) : (
                <View style={styles.peekSpacer} />
              )}
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chassis: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  caseOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  caseBody: {
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      // @ts-expect-error web
      boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 16,
    }),
  },
  caseBezel: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0a0a0a',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  complicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 0,
  },
  complicationTime: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 52,
  },
  complicationCenter: {
    alignItems: 'center',
    flex: 1,
  },
  complicationLane: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  complicationIndex: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  complicationInterest: {
    fontSize: 9,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'right',
  },
  complicationBrand: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    minWidth: 52,
    textAlign: 'right',
  },
  peekTop: { width: '100%', paddingHorizontal: 6 },
  peekBottom: { width: '100%', paddingHorizontal: 6 },
  peekSpacer: { height: 36 },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  peekSide: {
    width: 48,
    height: '100%',
    justifyContent: 'center',
  },
  peekSideSpacer: { width: 48 },
  screen: {
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  screenInner: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pageDots: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
