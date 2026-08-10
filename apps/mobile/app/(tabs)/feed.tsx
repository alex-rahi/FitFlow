import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommentSheet } from '../../src/components/CommentSheet';
import { CategoryTabs } from '../../src/components/CategoryTabs';
import { PostDetailOverlay } from '../../src/components/PostDetailOverlay';
import { ScrollFeedLayout } from '../../src/components/feeds/ScrollFeedLayout';
import { GridFeedLayout } from '../../src/components/feeds/GridFeedLayout';
import { ColumnFeedLayout } from '../../src/components/feeds/ColumnFeedLayout';
import { ThreadFeedLayout } from '../../src/components/feeds/ThreadFeedLayout';
import { VideoPost } from '../../src/components/VideoCard';
import { api } from '../../src/lib/api';
import { FeedCategoryId, getCategoryLayout } from '../../src/constants/categories';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../../src/constants/theme';

interface CommentTarget {
  postId: string;
  parentId?: string | null;
  replyToUsername?: string;
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [category, setCategory] = useState<FeedCategoryId>('main_feed');
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null);
  const [detailPost, setDetailPost] = useState<{ post: VideoPost; index: number } | null>(null);
  const [threadRefresh, setThreadRefresh] = useState(0);

  const layout = getCategoryLayout(category);

  const loadFeed = useCallback(async (nextCursor?: string, feedCategory: FeedCategoryId = category) => {
    if (!nextCursor) setLoading(true);
    try {
      const data = await api.getFeed(nextCursor, feedCategory);
      setPosts(prev => nextCursor ? [...prev, ...data.posts] : data.posts);
      setCursor(data.next_cursor ?? undefined);
    } catch {
      // API may not be running yet
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    setDetailPost(null);
    loadFeed(undefined, category);
  }, [category, loadFeed]);

  const handleCategoryChange = (id: FeedCategoryId) => {
    if (id !== category) setCategory(id);
  };

  const handleLike = async (postId: string) => {
    try {
      await api.likePost(postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, like_count: p.like_count + 1 } : p
      ));
    } catch { /* ignore */ }
  };

  const handleOpenPost = (post: VideoPost, index: number) => {
    setDetailPost({ post, index });
  };

  const handleThreadComment = (postId: string, parentId?: string, username?: string) => {
    setCommentTarget({ postId, parentId, replyToUsername: username });
  };

  const handleReplyCountChange = useCallback((postId: string, count: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: count } : p));
  }, []);

  const handleCommentAdded = () => {
    setThreadRefresh(k => k + 1);
    if (commentTarget) {
      setPosts(prev => prev.map(p =>
        p.id === commentTarget.postId ? { ...p, comment_count: p.comment_count + 1 } : p
      ));
    }
  };

  const renderFeed = () => {
    if (loading && posts.length === 0) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.red} size="large" />
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <SafeAreaView style={styles.center}>
          <Text style={styles.emptyTitle}>No videos here yet</Text>
          <Text style={styles.emptySubtitle}>
            {USE_PLACEHOLDERS
              ? 'Try another category or upload a video to this feed'
              : 'Follow creators or upload your first workout video'}
          </Text>
        </SafeAreaView>
      );
    }

    switch (layout) {
      case 'grid':
        return (
          <GridFeedLayout
            posts={posts}
            onLike={handleLike}
            onOpen={handleOpenPost}
          />
        );
      case 'columns':
        return (
          <ColumnFeedLayout
            posts={posts}
            onLike={handleLike}
            onOpen={handleOpenPost}
          />
        );
      case 'thread':
        return (
          <ThreadFeedLayout
            posts={posts}
            refreshKey={threadRefresh}
            onLike={handleLike}
            onComment={handleThreadComment}
            onOpen={handleOpenPost}
            onReplyCountChange={handleReplyCountChange}
          />
        );
      default:
        return (
          <ScrollFeedLayout
            posts={posts}
            loading={loading}
            hasMore={!!cursor}
            onLoadMore={() => cursor && loadFeed(cursor, category)}
            onLike={handleLike}
            onComment={(postId) => setCommentTarget({ postId })}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <CategoryTabs selected={category} onSelect={handleCategoryChange} />
      {USE_PLACEHOLDERS && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>Demo mode — using placeholder data</Text>
        </View>
      )}
      {renderFeed()}
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
        onClose={() => setDetailPost(null)}
        onLike={() => detailPost && handleLike(detailPost.post.id)}
        onComment={() => detailPost && setCommentTarget({ postId: detailPost.post.id })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  demoBanner: {
    position: 'absolute', top: 96, alignSelf: 'center', zIndex: 10,
    backgroundColor: 'rgba(230, 57, 70, 0.9)', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: 20,
  },
  demoBannerText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
