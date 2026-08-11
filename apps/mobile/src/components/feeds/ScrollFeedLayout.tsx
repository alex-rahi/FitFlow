import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { VideoCard, VideoPost } from '../VideoCard';
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

export function ScrollFeedLayout({ posts, loading, hasMore, itemHeight, onLoadMore, onLike, onComment }: Props) {
  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      style={styles.list}
      renderItem={({ item, index }) => (
        <VideoCard
          post={item}
          index={index}
          height={itemHeight}
          onLike={() => onLike(item.id)}
          onComment={() => onComment(item.id)}
        />
      )}
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
      onEndReached={() => hasMore && onLoadMore()}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
