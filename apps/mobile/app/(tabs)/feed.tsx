import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoCard } from '../../src/components/VideoCard';
import { CommentSheet } from '../../src/components/CommentSheet';
import { api } from '../../src/lib/api';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../../src/constants/theme';

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  const loadFeed = useCallback(async (nextCursor?: string) => {
    try {
      const data = await api.getFeed(nextCursor);
      setPosts(prev => nextCursor ? [...prev, ...data.posts] : data.posts);
      setCursor(data.next_cursor ?? undefined);
    } catch {
      // API may not be running yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLike = async (postId: string) => {
    try {
      await api.likePost(postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, like_count: p.like_count + 1 } : p
      ));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>Your feed is empty</Text>
        <Text style={styles.emptySubtitle}>
          {USE_PLACEHOLDERS
            ? 'Placeholder mode — sample posts will appear once the feed loads'
            : 'Follow creators or upload your first workout video'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {USE_PLACEHOLDERS && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>Demo mode — using placeholder data</Text>
        </View>
      )}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <VideoCard
            post={item}
            index={index}
            onLike={() => handleLike(item.id)}
            onComment={() => setCommentPostId(item.id)}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onEndReached={() => cursor && loadFeed(cursor)}
      />
      <CommentSheet
        visible={!!commentPostId}
        postId={commentPostId ?? ''}
        onClose={() => setCommentPostId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  demoBanner: {
    position: 'absolute', top: 50, alignSelf: 'center', zIndex: 10,
    backgroundColor: 'rgba(230, 57, 70, 0.9)', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: 20,
  },
  demoBannerText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '600' },
  center: { flex: 1, backgroundColor: Colors.matteBlack, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
