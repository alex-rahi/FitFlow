import { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, ViewToken } from 'react-native';
import { VideoCard, VideoPost } from '../VideoCard';
import { AdPlaceholder } from '../AdPlaceholder';
import { analytics } from '../../lib/analytics';
import { buildScrollFeedItems, ScrollFeedItem } from '../../lib/feedItems';
import { Colors } from '../../constants/theme';

interface Props {
  posts: VideoPost[];
  loading: boolean;
  hasMore: boolean;
  itemHeight: number;
  onLoadMore: () => void;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

export function ScrollFeedLayout({
  posts,
  loading,
  hasMore,
  itemHeight,
  onLoadMore,
  onLike,
  onComment,
}: Props) {
  const items = useMemo(() => buildScrollFeedItems(posts), [posts]);
  const seenImpressions = useRef(new Set<string>());

  const trackImpression = useCallback((item: ScrollFeedItem) => {
    if (seenImpressions.current.has(item.id)) return;
    seenImpressions.current.add(item.id);

    if (item.type === 'ad') {
      analytics.track('ad_impression', { ad_id: item.ad.id, brand: item.ad.brand, placement: 'feed_scroll' });
      return;
    }

    analytics.track('video_impression', {
      post_id: item.post.id,
      feed_view: 'feed',
      category: item.post.category,
      index: item.postIndex,
    });
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((token) => {
        if (!token.isViewable || !token.item) return;
        trackImpression(token.item as ScrollFeedItem);
      });
    },
    [trackImpression],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      style={styles.list}
      renderItem={({ item }) => {
        if (item.type === 'ad') {
          return (
            <AdPlaceholder
              ad={item.ad}
              height={itemHeight}
              onPress={() => analytics.track('ad_click', { ad_id: item.ad.id, brand: item.ad.brand, placement: 'feed_scroll' })}
            />
          );
        }

        return (
          <VideoCard
            post={item.post}
            index={item.postIndex}
            height={itemHeight}
            onLike={() => onLike(item.post.id)}
            onComment={() => onComment(item.post.id)}
          />
        );
      }}
      pagingEnabled
      snapToInterval={itemHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onEndReached={() => hasMore && onLoadMore()}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
