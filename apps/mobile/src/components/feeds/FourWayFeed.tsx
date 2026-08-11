import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  GestureResponderEvent,
  Animated,
  Easing,
} from 'react-native';
import { FEED_LANES, FeedLaneId, filterPostsForLane } from '../../constants/categories';
import { rankPostsByEngagement } from '../../lib/feedRanking';
import { buildScrollFeedItems, ScrollFeedItem } from '../../lib/feedItems';
import { analytics } from '../../lib/analytics';
import { APP_NAME, Colors, Spacing } from '../../constants/theme';
import { VideoCard, VideoPost } from '../VideoCard';
import { ThreadSlide } from '../ThreadSlide';
import { AdPlaceholder } from '../AdPlaceholder';

const SWIPE_THRESHOLD = 48;
const HUD_HIDE_MS = 2800;

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
  const [laneIdx, setLaneIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [hudVisible, setHudVisible] = useState(true);
  const touchStart = useRef({ x: 0, y: 0 });
  const seenImpressions = useRef(new Set<string>());
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const lanes: Lane[] = useMemo(
    () =>
      FEED_LANES.map((lane) => {
        const filtered = filterPostsForLane(posts, lane.id);
        const ranked = lane.id === 'main_feed' ? rankPostsByEngagement(filtered) : filtered;
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
    [posts],
  );

  const lane = lanes[laneIdx];
  const items = lane?.items ?? [];
  const item = items[itemIdx];
  const progress = items.length > 1 ? (itemIdx + 1) / items.length : 1;

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

  const trackImpression = useCallback((current: ScrollFeedItem) => {
    if (seenImpressions.current.has(current.id)) return;
    seenImpressions.current.add(current.id);
    if (current.type === 'ad') {
      analytics.track('ad_impression', {
        ad_id: current.ad.id,
        brand: current.ad.brand,
        placement: 'feed_scroll',
      });
      return;
    }
    analytics.track('video_impression', {
      post_id: current.post.id,
      feed_view: 'feed',
      category: current.post.category,
      lane: lane.id,
      index: current.postIndex,
    });
  }, [lane?.id]);

  useEffect(() => {
    if (item) trackImpression(item);
  }, [item, trackImpression]);

  const animateTransition = useCallback((dir: 'up' | 'down' | 'left' | 'right', apply: () => void) => {
    const exitOffset =
      dir === 'up' ? -48 : dir === 'down' ? 48 : dir === 'left' ? -56 : 56;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: exitOffset,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      apply();
      slideAnim.setValue(-exitOffset * 0.6);
      revealHud();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, revealHud, slideAnim]);

  const changeLane = useCallback((next: number, dir: 'left' | 'right') => {
    if (next < 0 || next >= lanes.length || next === laneIdx) return;
    animateTransition(dir, () => {
      setLaneIdx(next);
      setItemIdx(0);
      analytics.track('feed_lane_change', {
        lane_id: lanes[next].id,
        lane_label: lanes[next].label,
        feed_view: 'feed',
      });
    });
  }, [animateTransition, laneIdx, lanes]);

  const navigate = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (dir === 'up' && itemIdx < items.length - 1) {
      animateTransition('up', () => setItemIdx((i) => i + 1));
    } else if (dir === 'down' && itemIdx > 0) {
      animateTransition('down', () => setItemIdx((i) => i - 1));
    } else if (dir === 'left') {
      changeLane(laneIdx + 1, 'left');
    } else if (dir === 'right') {
      changeLane(laneIdx - 1, 'right');
    }
  }, [animateTransition, changeLane, itemIdx, items.length, laneIdx]);

  const handleTouchStart = (e: GestureResponderEvent) => {
    revealHud();
    touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    const dx = e.nativeEvent.pageX - touchStart.current.x;
    const dy = e.nativeEvent.pageY - touchStart.current.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) navigate('left');
      else navigate('right');
    } else {
      if (dy < 0) navigate('up');
      else navigate('down');
    }
  };

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
        if (e.deltaX > 20) navigate('left');
        else if (e.deltaX < -20) navigate('right');
      } else {
        if (e.deltaY > 20) navigate('up');
        else if (e.deltaY < -20) navigate('down');
      }
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [navigate, revealHud]);

  const hudOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(hudOpacity, {
      toValue: hudVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [hudOpacity, hudVisible]);

  if (loading && posts.length === 0) {
    return (
      <View style={[styles.center, { height }]}>
        <ActivityIndicator color={Colors.red} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.center, { height }]}>
        <Text style={styles.empty}>No content in {lane?.label ?? 'Feed'}</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { height }]}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {item.type === 'ad' ? (
          <AdPlaceholder
            ad={item.ad}
            height={height}
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
            height={height}
            bottomInset={bottomInset}
            onLike={() => onLike(item.post.id)}
            onComment={() => onComment(item.post.id)}
          />
        ) : (
          <VideoCard
            post={item.post}
            index={item.postIndex}
            height={height}
            bottomInset={bottomInset}
            immersive
            onLike={() => onLike(item.post.id)}
            onComment={() => onComment(item.post.id)}
          />
        )}
      </Animated.View>

      <Animated.View style={[styles.hud, { opacity: hudOpacity }]} pointerEvents="none">
        <Text style={styles.brand}>{APP_NAME}</Text>
        <View style={styles.laneRow}>
          {lanes.map((l, i) => (
            <Text key={l.id} style={[styles.laneChip, i === laneIdx && styles.laneChipActive]}>
              {l.label}
            </Text>
          ))}
        </View>
      </Animated.View>

      <View style={styles.progressRail} pointerEvents="none">
        <View style={[styles.progressFill, { height: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#000', overflow: 'hidden' },
  content: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  empty: { color: Colors.textMuted, fontSize: 15 },
  hud: {
    position: 'absolute',
    top: Platform.OS === 'web' ? Spacing.lg : Spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  brand: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  laneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  laneChip: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  laneChipActive: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  progressRail: {
    position: 'absolute',
    left: 4,
    top: '20%',
    bottom: '20%',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
    zIndex: 10,
  },
  progressFill: {
    width: '100%',
    backgroundColor: Colors.red,
    borderRadius: 1,
    opacity: 0.7,
  },
});
