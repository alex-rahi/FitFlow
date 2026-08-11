import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CommentSheet } from '../../src/components/CommentSheet';
import { FourWayFeed } from '../../src/components/feeds/FourWayFeed';
import { VideoPost } from '../../src/components/VideoCard';
import { api } from '../../src/lib/api';
import { Colors } from '../../src/constants/theme';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';
import { analytics } from '../../src/lib/analytics';

const TAB_BAR_HEIGHT = 56;

export default function FeedScreen() {
  useScreenAnalytics('feed');
  const { height: windowHeight } = useWindowDimensions();
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentTarget, setCommentTarget] = useState<{ postId: string } | null>(null);

  const feedHeight = useMemo(() => windowHeight - TAB_BAR_HEIGHT, [windowHeight]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [feed, photos, community] = await Promise.all([
        api.getFeedView('feed'),
        api.getFeedView('photos'),
        api.getFeedView('community'),
      ]);
      setPosts([...feed.posts, ...photos.posts, ...community.posts]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
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
    <View style={styles.container}>
      {loading && posts.length === 0 ? (
        <View style={[styles.center, { height: feedHeight }]}>
          <ActivityIndicator color={Colors.red} />
        </View>
      ) : (
        <FourWayFeed
          posts={posts}
          loading={loading}
          height={feedHeight}
          onLike={handleLike}
          onComment={(postId) => setCommentTarget({ postId })}
        />
      )}
      <CommentSheet
        visible={!!commentTarget}
        postId={commentTarget?.postId ?? ''}
        onClose={() => setCommentTarget(null)}
        onCommentAdded={handleCommentAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.matteBlack },
});
