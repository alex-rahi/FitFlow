import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { CommentSheet } from '../../src/components/CommentSheet';
import { ScrollFeedLayout } from '../../src/components/feeds/ScrollFeedLayout';
import { VideoPost } from '../../src/components/VideoCard';
import { api } from '../../src/lib/api';
import { Colors, Spacing, isDemoMode } from '../../src/constants/theme';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';
import { analytics } from '../../src/lib/analytics';

export default function FeedScreen() {
  useScreenAnalytics('feed');
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [commentTarget, setCommentTarget] = useState<{ postId: string } | null>(null);
  const [feedHeight, setFeedHeight] = useState(0);

  const loadFeed = useCallback(async (nextCursor?: string) => {
    if (!nextCursor) setLoading(true);
    try {
      const data = await api.getFeedView('feed', nextCursor);
      setPosts((prev) => (nextCursor ? [...prev, ...data.posts] : data.posts));
      setCursor(data.next_cursor ?? undefined);
    } catch {
      // API may not be running yet
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed]),
  );

  const handleLike = async (postId: string) => {
    try {
      await api.likePost(postId);
      analytics.track('like', { post_id: postId, feed_view: 'feed' });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, like_count: p.like_count + 1 } : p)));
    } catch { /* ignore */ }
  };

  const handleCommentAdded = () => {
    if (commentTarget) {
      analytics.track('comment', { post_id: commentTarget.postId, feed_view: 'feed' });
      setPosts((prev) => prev.map((p) =>
        p.id === commentTarget.postId ? { ...p, comment_count: p.comment_count + 1 } : p,
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Watch</Text>
        {posts.length > 0 && (
          <Text style={styles.rankHint}>Recipe videos and cooking reels — ranked for you</Text>
        )}
      </View>
      {isDemoMode() && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>Demo mode — using placeholder data</Text>
        </View>
      )}
      <View
        style={styles.feedArea}
        onLayout={(event) => {
          const nextHeight = Math.floor(event.nativeEvent.layout.height);
          if (nextHeight > 0 && nextHeight !== feedHeight) setFeedHeight(nextHeight);
        }}
      >
        {feedHeight === 0 || (loading && posts.length === 0) ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.red} size="large" />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No recipe videos yet</Text>
            <Text style={styles.emptySubtitle}>Upload a recipe video from the Upload tab</Text>
          </View>
        ) : (
          <ScrollFeedLayout
            posts={posts}
            loading={loading}
            hasMore={!!cursor}
            itemHeight={feedHeight}
            onLoadMore={() => cursor && loadFeed(cursor)}
            onLike={handleLike}
            onComment={(postId) => setCommentTarget({ postId })}
          />
        )}
      </View>
      <CommentSheet
        visible={!!commentTarget}
        postId={commentTarget?.postId ?? ''}
        onClose={() => setCommentTarget(null)}
        onCommentAdded={handleCommentAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  rankHint: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.xs },
  feedArea: { flex: 1 },
  demoBanner: {
    alignSelf: 'center',
    marginBottom: Spacing.xs,
    backgroundColor: 'rgba(230, 57, 70, 0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
  demoBannerText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center' },
});
