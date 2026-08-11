import { useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { FEED_LANES, filterPostsForLane } from '../../constants/categories';
import { rankPostsByEngagement } from '../../lib/feedRanking';
import { analytics } from '../../lib/analytics';
import { Colors, Spacing } from '../../constants/theme';
import { ScrollFeedLayout } from './ScrollFeedLayout';
import { VideoPost } from '../VideoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  posts: VideoPost[];
  loading: boolean;
  hasMore: boolean;
  itemHeight: number;
  onLoadMore: () => void;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

export function DirectionalFeedLayout({
  posts,
  loading,
  hasMore,
  itemHeight,
  onLoadMore,
  onLike,
  onComment,
}: Props) {
  const [activeLane, setActiveLane] = useState(0);
  const lastLaneRef = useRef(0);

  const lanes = useMemo(
    () =>
      FEED_LANES.map((lane) => {
        const filtered = filterPostsForLane(posts, lane.id);
        const ranked = lane.id === 'main_feed' ? rankPostsByEngagement(filtered) : filtered;
        return { ...lane, posts: ranked };
      }),
    [posts],
  );

  const handleLaneScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== lastLaneRef.current && idx >= 0 && idx < lanes.length) {
      lastLaneRef.current = idx;
      setActiveLane(idx);
      analytics.track('feed_lane_change', {
        lane_id: lanes[idx].id,
        lane_label: lanes[idx].label,
        feed_view: 'feed',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.laneBar}>
        {lanes.map((lane, index) => (
          <Text
            key={lane.id}
            style={[styles.laneLabel, index === activeLane && styles.laneLabelActive]}
          >
            {lane.label}
          </Text>
        ))}
      </View>

      <FlatList
        data={lanes}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleLaneScroll}
        onScrollEndDrag={handleLaneScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={[styles.lanePage, { width: SCREEN_WIDTH }]}>
            {item.posts.length === 0 && !loading ? (
              <View style={styles.emptyLane}>
                <Text style={styles.emptyTitle}>No videos in {item.label}</Text>
                <Text style={styles.emptySubtitle}>Upload a workout video from the Upload tab</Text>
              </View>
            ) : (
              <ScrollFeedLayout
                posts={item.posts}
                loading={loading && index === 0}
                hasMore={hasMore && item.id === 'main_feed'}
                itemHeight={itemHeight}
                onLoadMore={onLoadMore}
                onLike={onLike}
                onComment={onComment}
              />
            )}
          </View>
        )}
      />

      <Text style={styles.hint}>Swipe ← → categories · Scroll ↑ ↓ videos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  laneBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  laneLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  laneLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  lanePage: { flex: 1 },
  emptyLane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center' },
  hint: {
    position: 'absolute',
    bottom: Spacing.sm,
    alignSelf: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
