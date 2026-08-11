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
import { getLaneTheme, mixPointer, webAmbientStyle } from '../../lib/feedTheme';
import { recordLaneVisit, recordPostSignal } from '../../lib/userInterests';
import { useUserInterests } from '../../hooks/useUserInterests';
import { analytics } from '../../lib/analytics';
import { Colors, Spacing } from '../../constants/theme';
import { VideoCard, VideoPost } from '../VideoCard';
import { ThreadSlide } from '../ThreadSlide';
import { AdPlaceholder } from '../AdPlaceholder';
import { WatchFocusFrame, getWatchScreenSize } from './WatchFocusFrame';

const SWIPE_THRESHOLD = 52;
const HUD_HIDE_MS = 3200;
const DWELL_MS = 2500;

function laneItemAt(lanes: Lane[], laneIndex: number, itemIndex: number): ScrollFeedItem | null {
  if (laneIndex < 0 || laneIndex >= lanes.length) return null;
  const laneItems = lanes[laneIndex].items;
  if (laneItems.length === 0) return null;
  return laneItems[Math.min(itemIndex, laneItems.length - 1)];
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
  const seenImpressions = useRef(new Set<string>());
  const impressionStarted = useRef<number | null>(null);
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hudOpacity = useRef(new Animated.Value(1)).current;
  const themeBlend = useRef(new Animated.Value(0)).current;

  const lanes: Lane[] = useMemo(
    () =>
      FEED_LANES.map((lane) => {
        const filtered = filterPostsForLane(posts, lane.id);
        const ranked =
          lane.id === 'main_feed'
            ? rankPostsForUser(filtered, interestScores)
            : rankPostsByEngagement(filtered);
        const withAds =
          lane.id === 'photos' || lane.id === 'community'
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

  const resetDrag = useCallback(() => {
    Animated.parallel([
      Animated.spring(dragX, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.spring(dragY, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [dragX, dragY, scaleAnim]);

  const animateTransition = useCallback((dir: 'up' | 'down' | 'left' | 'right', apply: () => void) => {
    const exitOffset =
      dir === 'up' ? -64 : dir === 'down' ? 64 : dir === 'left' ? -width * 0.12 : width * 0.12;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: exitOffset,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      apply();
      slideAnim.setValue(-exitOffset * 0.45);
      fadeAnim.setValue(0.4);
      scaleAnim.setValue(1.04);
      dragX.setValue(0);
      dragY.setValue(0);
      revealHud();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, revealHud, scaleAnim, slideAnim, width, dragX, dragY]);

  const changeLane = useCallback((next: number, dir: 'left' | 'right') => {
    if (next < 0 || next >= lanes.length || next === laneIdx) return;
    trackDwell(item);
    animateTransition(dir, () => {
      setLaneIdx(next);
      setItemIdx(0);
      recordLaneVisit(lanes[next].id);
      analytics.track('feed_lane_change', {
        lane_id: lanes[next].id,
        lane_label: lanes[next].label,
        feed_view: 'feed',
      });
    });
  }, [animateTransition, item, laneIdx, lanes, trackDwell]);

  const navigate = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (dir === 'up' && itemIdx < items.length - 1) {
      trackDwell(item);
      animateTransition('up', () => setItemIdx((i) => i + 1));
    } else if (dir === 'down' && itemIdx > 0) {
      trackDwell(item);
      animateTransition('down', () => setItemIdx((i) => i - 1));
    } else if (dir === 'left') {
      changeLane(laneIdx + 1, 'left');
    } else if (dir === 'right') {
      changeLane(laneIdx - 1, 'right');
    } else {
      resetDrag();
    }
  }, [animateTransition, changeLane, item, itemIdx, items.length, laneIdx, resetDrag, trackDwell]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
        onPanResponderGrant: () => {
          revealHud();
          dragX.setOffset(0);
          dragY.setOffset(0);
        },
        onPanResponderMove: (_, g) => {
          const damp = 0.42;
          dragX.setValue(g.dx * damp);
          dragY.setValue(g.dy * damp);
          const dist = Math.min(Math.hypot(g.dx, g.dy) / 280, 0.06);
          scaleAnim.setValue(1 - dist);
        },
        onPanResponderRelease: (_, g) => {
          const { dx, dy } = g;
          if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
            resetDrag();
            return;
          }
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) navigate('left');
            else navigate('right');
          } else {
            if (dy < 0) navigate('up');
            else navigate('down');
          }
        },
      }),
    [dragX, dragY, navigate, resetDrag, revealHud, scaleAnim],
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
    ? webAmbientStyle(theme, pointer)
    : { backgroundColor: '#030303' };

  const orbAX = mixPointer(25, pointer.x, 30);
  const orbAY = mixPointer(20, pointer.y, 25);
  const orbBX = mixPointer(75, pointer.x, 25);
  const orbBY = mixPointer(70, pointer.y, 22);

  const { screenH } = getWatchScreenSize(width, height);
  const cardInset = Math.max(12, bottomInset * 0.35);

  const prevItem = itemIdx > 0 ? items[itemIdx - 1] : null;
  const nextItem = itemIdx < items.length - 1 ? items[itemIdx + 1] : null;
  const prevLane = laneIdx > 0 ? lanes[laneIdx - 1] : null;
  const nextLane = laneIdx < lanes.length - 1 ? lanes[laneIdx + 1] : null;
  const prevLaneTheme = prevLane ? getLaneTheme(prevLane.id) : null;
  const nextLaneTheme = nextLane ? getLaneTheme(nextLane.id) : null;
  const prevLaneItem = laneItemAt(lanes, laneIdx - 1, itemIdx);
  const nextLaneItem = laneItemAt(lanes, laneIdx + 1, itemIdx);

  const interestHint =
    lane?.id === 'main_feed' && item?.type === 'post'
      ? getMatchingInterest(item.post, interestScores)?.label ?? null
      : null;

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

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: dragX },
              { translateY: Animated.add(slideAnim, dragY) },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <WatchFocusFrame
          width={width}
          height={height}
          theme={theme}
          lanes={lanes}
          laneIdx={laneIdx}
          itemIdx={itemIdx}
          itemCount={items.length}
          prevItem={prevItem}
          nextItem={nextItem}
          prevLaneItem={prevLaneItem}
          nextLaneItem={nextLaneItem}
          prevLaneTheme={prevLaneTheme}
          nextLaneTheme={nextLaneTheme}
          prevLaneLabel={prevLane?.label}
          nextLaneLabel={nextLane?.label}
          hudOpacity={hudOpacity}
          topInterests={lane?.id === 'main_feed' ? topInterests : []}
        >
          {item.type === 'ad' ? (
            <AdPlaceholder
              ad={item.ad}
              height={screenH}
              onPress={() =>
                analytics.track('ad_click', {
                  ad_id: item.ad.id,
                  brand: item.ad.brand,
                  placement: 'feed_scroll',
                })
              }
            />
          ) : item.post.media_type === 'text' || item.post.category === 'advice' ? (
            <ThreadSlide
              post={item.post}
              height={screenH}
              bottomInset={cardInset}
              theme={theme}
              onLike={() => onLike(item.post.id)}
              onComment={() => onComment(item.post.id)}
            />
          ) : (
            <VideoCard
              post={item.post}
              index={item.postIndex}
              height={screenH}
              bottomInset={cardInset}
              immersive
              interestHint={interestHint}
              onLike={() => onLike(item.post.id)}
              onComment={() => onComment(item.post.id)}
            />
          )}
        </WatchFocusFrame>
      </Animated.View>

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
  container: { overflow: 'hidden' },
  content: { flex: 1 },
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
