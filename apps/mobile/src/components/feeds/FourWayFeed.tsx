import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  GestureResponderEvent,
} from 'react-native';
import { FEED_LANES, FeedLaneId, filterPostsForLane } from '../../constants/categories';
import { rankPostsByEngagement } from '../../lib/feedRanking';
import { buildScrollFeedItems, ScrollFeedItem } from '../../lib/feedItems';
import { analytics } from '../../lib/analytics';
import { Colors, Spacing } from '../../constants/theme';
import { VideoCard, VideoPost } from '../VideoCard';
import { ThreadSlide } from '../ThreadSlide';
import { AdPlaceholder } from '../AdPlaceholder';

const SWIPE_THRESHOLD = 48;

interface Lane {
  id: FeedLaneId;
  label: string;
  items: ScrollFeedItem[];
}

interface Props {
  posts: VideoPost[];
  loading: boolean;
  height: number;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

export function FourWayFeed({ posts, loading, height, onLike, onComment }: Props) {
  const [laneIdx, setLaneIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const touchStart = useRef({ x: 0, y: 0 });
  const seenImpressions = useRef(new Set<string>());

  const lanes: Lane[] = useMemo(
    () =>
      FEED_LANES.map((lane) => {
        const filtered = filterPostsForLane(posts, lane.id);
        const ranked =
          lane.id === 'main_feed' ? rankPostsByEngagement(filtered) : filtered;
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

  const changeLane = useCallback((next: number) => {
    if (next < 0 || next >= lanes.length || next === laneIdx) return;
    setLaneIdx(next);
    setItemIdx(0);
    analytics.track('feed_lane_change', {
      lane_id: lanes[next].id,
      lane_label: lanes[next].label,
      feed_view: 'feed',
    });
  }, [laneIdx, lanes]);

  const navigate = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (dir === 'up') {
      setItemIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (dir === 'down') {
      setItemIdx((i) => Math.max(i - 1, 0));
    } else if (dir === 'left') {
      changeLane(laneIdx + 1);
    } else if (dir === 'right') {
      changeLane(laneIdx - 1);
    }
  }, [changeLane, itemIdx, items.length, laneIdx]);

  const handleTouchStart = (e: GestureResponderEvent) => {
    touchStart.current = {
      x: e.nativeEvent.pageX,
      y: e.nativeEvent.pageY,
    };
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
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); navigate('up'); break;
        case 'ArrowDown': e.preventDefault(); navigate('down'); break;
        case 'ArrowLeft': e.preventDefault(); navigate('left'); break;
        case 'ArrowRight': e.preventDefault(); navigate('right'); break;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
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
  }, [navigate]);

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
      <View style={styles.laneDots}>
        {lanes.map((l, i) => (
          <View
            key={l.id}
            style={[styles.dot, i === laneIdx && styles.dotActive]}
          />
        ))}
      </View>

      <Text style={styles.laneLabel}>{lane.label}</Text>

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
          onLike={() => onLike(item.post.id)}
          onComment={() => onComment(item.post.id)}
        />
      ) : (
        <VideoCard
          post={item.post}
          index={item.postIndex}
          height={height}
          onLike={() => onLike(item.post.id)}
          onComment={() => onComment(item.post.id)}
          minimal
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.matteBlack, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.matteBlack },
  empty: { color: Colors.textMuted, fontSize: 15 },
  laneDots: {
    position: 'absolute',
    top: Spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: { backgroundColor: Colors.red, width: 16 },
  laneLabel: {
    position: 'absolute',
    top: Spacing.lg,
    alignSelf: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    zIndex: 10,
  },
});
