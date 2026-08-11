import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { CommentSheet } from '../../src/components/CommentSheet';
import { PostDetailOverlay } from '../../src/components/PostDetailOverlay';
import { GridFeedLayout } from '../../src/components/feeds/GridFeedLayout';
import { VideoPost } from '../../src/components/VideoCard';
import { api } from '../../src/lib/api';
import { Colors, Spacing } from '../../src/constants/theme';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';
import { analytics } from '../../src/lib/analytics';

export default function PhotosScreen() {
  useScreenAnalytics('photos');
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPost, setDetailPost] = useState<{ post: VideoPost; index: number } | null>(null);
  const [commentTarget, setCommentTarget] = useState<{ postId: string } | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFeedView('photos');
      setPosts(data.posts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos]),
  );

  const handleLike = async (postId: string) => {
    try {
      await api.likePost(postId);
      analytics.track('like', { post_id: postId, feed_view: 'photos' });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, like_count: p.like_count + 1 } : p)));
    } catch { /* ignore */ }
  };

  const handleOpenPost = (post: VideoPost, index: number) => {
    analytics.track('video_open', { post_id: post.id, category: post.category, index, feed_view: 'photos' });
    setDetailPost({ post, index });
  };

  const handleCommentAdded = () => {
    if (commentTarget) {
      analytics.track('comment', { post_id: commentTarget.postId, feed_view: 'photos' });
      setPosts((prev) => prev.map((p) =>
        p.id === commentTarget.postId ? { ...p, comment_count: p.comment_count + 1 } : p,
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.subtitle}>Progress pics, PR snapshots, and gym moments</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.red} size="large" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptySubtitle}>Upload a photo from the Upload tab</Text>
        </View>
      ) : (
        <GridFeedLayout posts={posts} onLike={handleLike} onOpen={handleOpenPost} />
      )}
      <PostDetailOverlay
        post={detailPost?.post ?? null}
        index={detailPost?.index ?? 0}
        itemHeight={360}
        onClose={() => setDetailPost(null)}
        onLike={() => detailPost && handleLike(detailPost.post.id)}
        onComment={() => detailPost && setCommentTarget({ postId: detailPost.post.id })}
      />
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
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: 13, marginTop: Spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center' },
});
