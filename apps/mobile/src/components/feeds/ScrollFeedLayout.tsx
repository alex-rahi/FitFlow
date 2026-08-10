import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { VideoCard, VideoPost } from './VideoCard';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  posts: VideoPost[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

export function ScrollFeedLayout({ posts, loading, hasMore, onLoadMore, onLike, onComment }: Props) {
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
      renderItem={({ item, index }) => (
        <VideoCard
          post={item}
          index={index}
          onLike={() => onLike(item.id)}
          onComment={() => onComment(item.id)}
        />
      )}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      onEndReached={() => hasMore && onLoadMore()}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
