import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommentSheet } from '../../src/components/CommentSheet';
import { PostDetailOverlay } from '../../src/components/PostDetailOverlay';
import { ThreadFeedLayout } from '../../src/components/feeds/ThreadFeedLayout';
import { VideoPost } from '../../src/components/VideoCard';
import { api } from '../../src/lib/api';
import { Colors, Spacing } from '../../src/constants/theme';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';
import { analytics } from '../../src/lib/analytics';

interface CommentTarget {
  postId: string;
  parentId?: string | null;
  replyToUsername?: string;
}

export default function CommunityScreen() {
  useScreenAnalytics('community');
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null);
  const [detailPost, setDetailPost] = useState<{ post: VideoPost; index: number } | null>(null);
  const [threadRefresh, setThreadRefresh] = useState(0);

  const loadCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFeedView('community');
      setPosts(data.posts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const handleLike = async (postId: string) => {
    try {
      await api.likePost(postId);
      analytics.track('like', { post_id: postId, feed_view: 'community' });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, like_count: p.like_count + 1 } : p)));
    } catch { /* ignore */ }
  };

  const handleOpenPost = (post: VideoPost, index: number) => {
    analytics.track('video_open', { post_id: post.id, category: post.category, index, feed_view: 'community' });
    setDetailPost({ post, index });
  };

  const handleThreadComment = (postId: string, parentId?: string, username?: string) => {
    setCommentTarget({ postId, parentId, replyToUsername: username });
  };

  const handleReplyCountChange = useCallback((postId: string, count: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comment_count: count } : p)));
  }, []);

  const handleCommentAdded = () => {
    setThreadRefresh((k) => k + 1);
    if (commentTarget) {
      analytics.track('comment', { post_id: commentTarget.postId, feed_view: 'community' });
      setPosts((prev) => prev.map((p) =>
        p.id === commentTarget.postId ? { ...p, comment_count: p.comment_count + 1 } : p,
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Thread-style coaching, form checks, and Q&A</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.red} size="large" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No threads yet</Text>
          <Text style={styles.emptySubtitle}>Start a community thread from Upload</Text>
        </View>
      ) : (
        <ThreadFeedLayout
          posts={posts}
          refreshKey={threadRefresh}
          onLike={handleLike}
          onComment={handleThreadComment}
          onOpen={handleOpenPost}
          onReplyCountChange={handleReplyCountChange}
        />
      )}
      <CommentSheet
        visible={!!commentTarget}
        postId={commentTarget?.postId ?? ''}
        parentId={commentTarget?.parentId}
        replyToUsername={commentTarget?.replyToUsername}
        onClose={() => setCommentTarget(null)}
        onCommentAdded={handleCommentAdded}
      />
      <PostDetailOverlay
        post={detailPost?.post ?? null}
        index={detailPost?.index ?? 0}
        itemHeight={360}
        onClose={() => setDetailPost(null)}
        onLike={() => detailPost && handleLike(detailPost.post.id)}
        onComment={() => detailPost && setCommentTarget({ postId: detailPost.post.id })}
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
