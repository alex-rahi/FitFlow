import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { FEED_LANES, FeedLaneId, filterPostsForLane } from '../../constants/categories';
import { rankPostsByEngagement, rankPostsForUser, getMatchingInterest } from '../../lib/feedRanking';
import { buildScrollFeedItems, ScrollFeedItem } from '../../lib/feedItems';
import { FeedTheme, getLaneTheme, mixPointer, webAmbientStyle } from '../../lib/feedTheme';
import { recordLaneVisit, recordPostSignal } from '../../lib/userInterests';
import { useUserInterests } from '../../hooks/useUserInterests';
import { analytics } from '../../lib/analytics';
import { Colors, Spacing } from '../../constants/theme';
import { VideoCard, VideoPost } from '../VideoCard';
import { ThreadSlide } from '../ThreadSlide';
import { WorkoutFormSlide } from '../WorkoutFormSlide';
import { AdPlaceholder } from '../AdPlaceholder';
import { WatchFocusFrame, getWatchScreenSize } from './WatchFocusFrame';
import { FluidPageStack } from './FluidPageStack';

const HUD_HIDE_MS = 3200;
const DWELL_MS = 2500;
const DISPLACE_RATIO = 0.2;
const VELOCITY_THRESHOLD = 0.28;
const AXIS_LOCK_PX = 10;
const RUBBER = 0.24;

function laneItemAt(lanes: Lane[], laneIndex: number, itemIndex: number): ScrollFeedItem | null {
  if (laneIndex < 0 || laneIndex >= lanes.length) return null;
  const laneItems = lanes[laneIndex].items;
  if (laneItems.length === 0) return null;
  return laneItems[Math.min(itemIndex, laneItems.length - 1)];
}

function rubberBand(value: number, canGoNext: boolean, canGoPrev: boolean): number {
  if (value < 0 && !canGoNext) return value * RUBBER;
  if (value > 0 && !canGoPrev) return value * RUBBER;
  return value;
}

interface Lane {
  id: FeedLaneId;
  label: string;
  items: ScrollFeedItem[];
}

interface Props {
  posts: VideoPost[];
  loading: boolean;
  height: number;
  bottomInset?: number;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

export function FourWayFeed({
  posts,
  loading,
  height,
  bottomInset = 64,
  onLike,
  onComment,
}: Props) {
  const { width } = useWindowDimensions();
  const { scores: interestScores, topInterests } = useUserInterests();
  const [laneIdx, setLaneIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [hudVisible, setHudVisible] = useState(true);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.4 });
  const [dragAxis, setDragAxis] = useState<'x' | 'y' | null>(null);
  const seenImpressions = useRef(new Set<string>());
  const impressionStarted = useRef<number | null>(null);
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const axisLock = useRef<'x' | 'y' | null>(null);

  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const zeroAnim = useRef(new Animated.Value(0)).current;
  const fullOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hudOpacity = useRef(new Animated.Value(1)).current;
  const themeBlend = useRef(new Animated.Value(0)).current;

  const laneIdxRef = useRef(laneIdx);
  const itemIdxRef = useRef(itemIdx);
  laneIdxRef.current = laneIdx;
  itemIdxRef.current = itemIdx;

  const lanes: Lane[] = useMemo(
    () =>
      FEED_LANES.map((lane) => {
        const filtered = filterPostsForLane(posts, lane.id);
        const ranked =
          lane.id === 'main_feed'
            ? rankPostsForUser(filtered, interestScores)
            : rankPostsByEngagement(filtered);
        const withAds =
          lane.id === 'form' || lane.id === 'community'
            ? ranked.map((post, index) => ({
                type: 'post' as const,
                id: post.id,
                post,
                postIndex: index,
              }))
            : buildScrollFeedItems(ranked);
        return { ...lane, items: withAds };
      }),
    [posts, interestScores],
  );

  const lane = lanes[laneIdx];
  const theme = getLaneTheme(lane?.id ?? 'main_feed');
  const items = lane?.items ?? [];
  const item = items[itemIdx];
  const progress = items.length > 1 ? itemIdx / (items.length - 1) : 0;

  const { screenH } = getWatchScreenSize(width, height);
  const cardInset = Math.max(12, bottomInset * 0.35);
  const pageW = width;

  const revealHud = useCallback(() => {
    setHudVisible(true);
    if (hudTimer.current) clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHudVisible(false), HUD_HIDE_MS);
  }, []);

  useEffect(() => {
    revealHud();
    return () => {
      if (hudTimer.current) clearTimeout(hudTimer.current);
    };
  }, [revealHud]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(themeBlend, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(themeBlend, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();
  }, [laneIdx, themeBlend]);

  const trackImpression = useCallback((current: ScrollFeedItem) => {
    if (current.type === 'ad') {
      if (seenImpressions.current.has(current.id)) return;
      seenImpressions.current.add(current.id);
      analytics.track('ad_impression', {
        ad_id: current.ad.id,
        brand: current.ad.brand,
        placement: 'feed_scroll',
      });
      return;
    }

    const post = current.post;
    if (!seenImpressions.current.has(current.id)) {
      seenImpressions.current.add(current.id);
      recordPostSignal('impression', post);
      analytics.track('video_impression', {
        post_id: post.id,
        feed_view: 'feed',
        category: post.category,
        media_type: post.media_type,
        lane: lane.id,
        index: current.postIndex,
      });
    }
    impressionStarted.current = Date.now();
  }, [lane?.id]);

  const trackDwell = useCallback((current: ScrollFeedItem | undefined) => {
    if (!current || current.type === 'ad' || impressionStarted.current == null) return;
    const elapsed = Date.now() - impressionStarted.current;
    impressionStarted.current = null;
    if (elapsed >= DWELL_MS) recordPostSignal('dwell', current.post);
  }, []);

  useEffect(() => {
    if (item) trackImpression(item);
  }, [item, trackImpression]);

  const springBack = useCallback(() => {
    axisLock.current = null;
    setDragAxis(null);
    Animated.parallel([
      Animated.spring(dragX, { toValue: 0, friction: 8, tension: 72, useNativeDriver: true }),
      Animated.spring(dragY, { toValue: 0, friction: 8, tension: 72, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 72, useNativeDriver: true }),
    ]).start();
  }, [dragX, dragY, scaleAnim]);

  const completeFluidMove = useCallback((
    axis: 'x' | 'y',
    direction: 1 | -1,
    apply: () => void,
  ) => {
    const animValue = axis === 'x' ? dragX : dragY;
    const pageSize = axis === 'x' ? pageW : screenH;
    const target = -direction * pageSize;

    Animated.parallel([
      Animated.spring(animValue, {
        toValue: target,
        friction: 9,
        tension: 68,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 72, useNativeDriver: true }),
    ]).start(() => {
      apply();
      animValue.setValue(0);
      axisLock.current = null;
      setDragAxis(null);
      revealHud();
    });
  }, [dragX, dragY, pageW, revealHud, scaleAnim, screenH]);

  const changeLane = useCallback((next: number, direction: 1 | -1) => {
    if (next < 0 || next >= lanes.length || next === laneIdxRef.current) {
      springBack();
      return;
    }
    trackDwell(items[itemIdxRef.current]);
    completeFluidMove('x', direction, () => {
      setLaneIdx(next);
      setItemIdx(0);
      recordLaneVisit(lanes[next].id);
      analytics.track('feed_lane_change', {
        lane_id: lanes[next].id,
        lane_label: lanes[next].label,
        feed_view: 'feed',
      });
    });
  }, [completeFluidMove, items, lanes, springBack, trackDwell]);

  const navigate = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    const li = laneIdxRef.current;
    const ii = itemIdxRef.current;
    const laneItems = lanes[li]?.items ?? [];

    if (dir === 'up' && ii < laneItems.length - 1) {
      trackDwell(laneItems[ii]);
      completeFluidMove('y', 1, () => setItemIdx((i) => i + 1));
    } else if (dir === 'down' && ii > 0) {
      trackDwell(laneItems[ii]);
      completeFluidMove('y', -1, () => setItemIdx((i) => i - 1));
    } else if (dir === 'left') {
      changeLane(li + 1, 1);
    } else if (dir === 'right') {
      changeLane(li - 1, -1);
    } else {
      springBack();
    }
  }, [changeLane, completeFluidMove, lanes, springBack, trackDwell]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
        onPanResponderGrant: () => {
          revealHud();
          axisLock.current = null;
          setDragAxis(null);
        },
        onPanResponderMove: (_, g) => {
          const { dx, dy } = g;
          const li = laneIdxRef.current;
          const ii = itemIdxRef.current;
          const laneItems = lanes[li]?.items ?? [];

          if (!axisLock.current && Math.hypot(dx, dy) > AXIS_LOCK_PX) {
            axisLock.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            setDragAxis(axisLock.current);
          }

          if (axisLock.current === 'y') {
            const canNext = ii < laneItems.length - 1;
            const canPrev = ii > 0;
            dragY.setValue(rubberBand(dy, canNext, canPrev));
            dragX.setValue(0);
            const progress = Math.min(Math.abs(dy) / screenH, 1);
            scaleAnim.setValue(1 - progress * 0.035);
          } else if (axisLock.current === 'x') {
            const canNext = li < lanes.length - 1;
            const canPrev = li > 0;
            dragX.setValue(rubberBand(dx, canNext, canPrev));
            dragY.setValue(0);
            const progress = Math.min(Math.abs(dx) / pageW, 1);
            scaleAnim.setValue(1 - progress * 0.025);
          }
        },
        onPanResponderRelease: (_, g) => {
          const { dx, dy, vx, vy } = g;
          const li = laneIdxRef.current;
          const ii = itemIdxRef.current;
          const laneItems = lanes[li]?.items ?? [];

          if (!axisLock.current) {
            springBack();
            return;
          }

          if (axisLock.current === 'y') {
            const goingNext = dy < -screenH * DISPLACE_RATIO || vy < -VELOCITY_THRESHOLD;
            const goingPrev = dy > screenH * DISPLACE_RATIO || vy > VELOCITY_THRESHOLD;
            if (goingNext && ii < laneItems.length - 1) {
              trackDwell(laneItems[ii]);
              completeFluidMove('y', 1, () => setItemIdx((i) => i + 1));
            } else if (goingPrev && ii > 0) {
              trackDwell(laneItems[ii]);
              completeFluidMove('y', -1, () => setItemIdx((i) => i - 1));
            } else {
              springBack();
            }
          } else {
            const goingNext = dx < -pageW * DISPLACE_RATIO || vx < -VELOCITY_THRESHOLD;
            const goingPrev = dx > pageW * DISPLACE_RATIO || vx > VELOCITY_THRESHOLD;
            if (goingNext && li < lanes.length - 1) {
              changeLane(li + 1, 1);
            } else if (goingPrev && li > 0) {
              changeLane(li - 1, -1);
            } else {
              springBack();
            }
          }
        },
      }),
    [
      changeLane,
      completeFluidMove,
      dragX,
      dragY,
      lanes,
      pageW,
      revealHud,
      scaleAnim,
      screenH,
      springBack,
      trackDwell,
    ],
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onKey = (e: KeyboardEvent) => {
      revealHud();
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); navigate('up'); break;
        case 'ArrowDown': e.preventDefault(); navigate('down'); break;
        case 'ArrowLeft': e.preventDefault(); navigate('left'); break;
        case 'ArrowRight': e.preventDefault(); navigate('right'); break;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      revealHud();
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (e.deltaX > 16) navigate('left');
        else if (e.deltaX < -16) navigate('right');
      } else {
        if (e.deltaY > 16) navigate('up');
        else if (e.deltaY < -16) navigate('down');
      }
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [navigate, revealHud]);

  useEffect(() => {
    Animated.timing(hudOpacity, {
      toValue: hudVisible ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [hudOpacity, hudVisible]);

  const progressHeight = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['8%', '100%'],
  });

  const ambientStyle = Platform.OS === 'web'
    ? { ...webAmbientStyle(theme, pointer), backgroundColor: '#000' }
    : { backgroundColor: '#000' };

  const orbAX = mixPointer(25, pointer.x, 30);
  const orbAY = mixPointer(20, pointer.y, 25);
  const orbBX = mixPointer(75, pointer.x, 25);
  const orbBY = mixPointer(70, pointer.y, 22);

  const prevLane = laneIdx > 0 ? lanes[laneIdx - 1] : null;
  const nextLane = laneIdx < lanes.length - 1 ? lanes[laneIdx + 1] : null;

  const renderCard = useCallback((
    feedItem: ScrollFeedItem,
    cardTheme: FeedTheme,
    hint: string | null,
    interactive = true,
  ) => {
    const handlers = interactive
      ? {
          onLike: () => feedItem.type === 'post' && onLike(feedItem.post.id),
          onComment: () => feedItem.type === 'post' && onComment(feedItem.post.id),
        }
      : { onLike: () => {}, onComment: () => {} };

    if (feedItem.type === 'ad') {
      return (
        <AdPlaceholder
          ad={feedItem.ad}
          height={screenH}
          onPress={() =>
            interactive && analytics.track('ad_click', {
              ad_id: feedItem.ad.id,
              brand: feedItem.ad.brand,
              placement: 'feed_scroll',
            })
          }
        />
      );
    }
    if (feedItem.post.media_type === 'form') {
      return (
        <WorkoutFormSlide
          post={feedItem.post}
          height={screenH}
          bottomInset={cardInset}
          theme={cardTheme}
          {...handlers}
        />
      );
    }
    if (feedItem.post.media_type === 'text' || feedItem.post.category === 'advice') {
      return (
        <ThreadSlide
          post={feedItem.post}
          height={screenH}
          bottomInset={cardInset}
          theme={cardTheme}
          {...handlers}
        />
      );
    }
    return (
      <VideoCard
        post={feedItem.post}
        index={feedItem.postIndex}
        height={screenH}
        bottomInset={cardInset}
        immersive
        interestHint={hint}
        {...handlers}
      />
    );
  }, [cardInset, onComment, onLike, screenH]);

  const renderLaneFrame = (
    laneData: Lane,
    laneIndex: number,
    itemIndex: number,
    interactive: boolean,
  ) => {
    const laneTheme = getLaneTheme(laneData.id);
    const laneItems = laneData.items;
    const laneItem = laneItems[itemIndex];
    if (!laneItem) return null;

    const pItem = itemIndex > 0 ? laneItems[itemIndex - 1] : null;
    const nItem = itemIndex < laneItems.length - 1 ? laneItems[itemIndex + 1] : null;
    const pLane = laneIndex > 0 ? lanes[laneIndex - 1] : null;
    const nLane = laneIndex < lanes.length - 1 ? lanes[laneIndex + 1] : null;
    const hint =
      laneData.id === 'main_feed' && laneItem.type === 'post'
        ? getMatchingInterest(laneItem.post, interestScores)?.label ?? null
        : null;

    const screenContent = interactive ? (
      <FluidPageStack
        pageW={pageW}
        pageH={screenH}
        offsetX={zeroAnim}
        offsetY={dragY}
        axis={dragAxis === 'y' ? 'y' : null}
        current={renderCard(laneItem, laneTheme, hint, true)}
        prev={pItem ? renderCard(pItem, laneTheme, null, false) : null}
        next={nItem ? renderCard(nItem, laneTheme, null, false) : null}
      />
    ) : (
      renderCard(laneItem, laneTheme, hint, false)
    );

    return (
      <WatchFocusFrame
        width={width}
        height={height}
        theme={laneTheme}
        lanes={lanes}
        laneIdx={laneIndex}
        itemIdx={itemIndex}
        itemCount={laneItems.length}
        laneLabel={laneData.label}
        prevItem={pItem}
        nextItem={nItem}
        prevLaneItem={laneItemAt(lanes, laneIndex - 1, itemIndex)}
        nextLaneItem={laneItemAt(lanes, laneIndex + 1, itemIndex)}
        prevLaneTheme={pLane ? getLaneTheme(pLane.id) : null}
        nextLaneTheme={nLane ? getLaneTheme(nLane.id) : null}
        prevLaneLabel={pLane?.label}
        nextLaneLabel={nLane?.label}
        hudOpacity={interactive ? hudOpacity : fullOpacity}
        topInterests={laneData.id === 'main_feed' ? topInterests : []}
        dragOffsetX={interactive ? dragX : undefined}
        dragOffsetY={interactive ? dragY : undefined}
        pageW={pageW}
        pageH={screenH}
      >
        {screenContent}
      </WatchFocusFrame>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={[styles.center, { height }, ambientStyle]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.center, { height }, ambientStyle]}>
        <Text style={[styles.empty, { color: theme.accent }]}>{lane?.label ?? 'Feed'}</Text>
        <Text style={styles.emptySub}>Nothing here yet</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { height }, ambientStyle]}
      {...panResponder.panHandlers}
      {...(Platform.OS === 'web' ? {
        onMouseMove: (e: any) => {
          const rect = e.currentTarget?.getBoundingClientRect?.();
          if (!rect) return;
          setPointer({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
          });
        },
      } : {})}
    >
      {Platform.OS !== 'web' && (
        <>
          <View style={[styles.orb, styles.orbA, {
            backgroundColor: theme.ambientA,
            left: `${orbAX}%`,
            top: `${orbAY}%`,
          }]} />
          <View style={[styles.orb, styles.orbB, {
            backgroundColor: theme.ambientB,
            left: `${orbBX}%`,
            top: `${orbBY}%`,
          }]} />
        </>
      )}

      <View style={styles.fluidStage}>
        {dragAxis === 'x' && prevLane ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.laneGhost,
              { width, transform: [{ translateX: Animated.subtract(dragX, pageW) }] },
            ]}
          >
            {renderLaneFrame(prevLane, laneIdx - 1, itemIdx, false)}
          </Animated.View>
        ) : null}

        <Animated.View
          style={[
            styles.content,
            {
              width,
              transform: [
                { translateX: dragX },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {renderLaneFrame(lane, laneIdx, itemIdx, true)}
        </Animated.View>

        {dragAxis === 'x' && nextLane ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.laneGhost,
              { width, transform: [{ translateX: Animated.add(dragX, pageW) }] },
            ]}
          >
            {renderLaneFrame(nextLane, laneIdx + 1, itemIdx, false)}
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.progressRail} pointerEvents="none">
        <Animated.View
          style={[
            styles.progressFill,
            {
              height: progressHeight,
              backgroundColor: theme.accent,
              shadowColor: theme.accent,
            },
          ]}
        />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.themePulse,
          {
            backgroundColor: theme.accent,
            opacity: themeBlend.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.12],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: '#000' },
  fluidStage: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
  laneGhost: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  emptySub: { color: Colors.textMuted, fontSize: 13, marginTop: Spacing.xs },
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    marginLeft: -140,
    marginTop: -140,
    opacity: 0.55,
  },
  orbA: { opacity: 0.5 },
  orbB: { opacity: 0.45 },
  progressRail: {
    position: 'absolute',
    left: 6,
    top: '18%',
    bottom: '18%',
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    zIndex: 10,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  themePulse: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
});
