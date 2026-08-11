import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommentSheet } from '../../src/components/CommentSheet';
import { FeedViewTabs } from '../../src/components/FeedViewTabs';
import { PostDetailOverlay } from '../../src/components/PostDetailOverlay';
import { ScrollFeedLayout } from '../../src/components/feeds/ScrollFeedLayout';
import { GridFeedLayout } from '../../src/components/feeds/GridFeedLayout';
import { ThreadFeedLayout } from '../../src/components/feeds/ThreadFeedLayout';
import { VideoPost } from '../../src/components/VideoCard';
import { api } from '../../src/lib/api';
import { FeedViewId, getFeedViewLayout } from '../../src/constants/categories';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../../src/constants/theme';
import { analytics } from '../../src/lib/analytics';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';

interface CommentTarget {
  postId: string;
  parentId?: string | null;
  replyToUsername?: string;
}

const EMPTY_COPY: Record<FeedViewId, { title: string; subtitle: string }> = {
  feed: {
    title: 'No videos here yet',
    subtitle: USE_PLACEHOLDERS
      ? 'Upload a workout or PR to populate the feed'
      : 'Follow creators or upload your first workout video',
  },
  recipes: {
    title: 'No recipes yet',
    subtitle: USE_PLACEHOLDERS
      ? 'Upload a recipe video to fill the grid'
      : 'Share meal prep and nutrition content to get started',
  },
  community: {
    title: 'No threads yet',
    subtitle: USE_PLACEHOLDERS
      ? 'Post a community thread to start a discussion'
      : 'Ask questions and share coaching tips with the community',
  },
};

export default function FeedScreen() {
  useScreenAnalytics('feed');
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [view, setView] = useState<FeedViewId>('feed');
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null);
  const [detailPost, setDetailPost] = useState<{ post: VideoPost; index: number } | null>(null);
  const [threadRefresh, setThreadRefresh] = useState(0);
  const [feedHeight, setFeedHeight] = useState(0);

  const layout = getFeedViewLayout(view);

  const loadFeed = useCallback(async (nextCursor?: string, feedView: FeedViewId = view) => {
    if (!nextCursor) setLoading(true);
    try {
      const data = await api.getFeedView(feedView, nextCursor);
      setPosts(prev => nextCursor ? [...prev, ...data.posts] : data.posts);
      setCursor(data.next_cursor ?? undefined);
    } catch {
      // API may not be running yet
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    setDetailPost(null);
    loadFeed(undefined, view);
  }, [view, loadFeed]);

  const handleViewChange = (id: FeedViewId) => {
    if (id !== view) {
      analytics.track('feed_view_change', { from: view, to: id });
      setView(id);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.likePost(postId);
      analytics.track('like', { post_id: postId, feed_view: view });
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, like_count: p.like_count + 1 } : p
      ));
    } catch { /* ignore */ }
  };

  const handleOpenPost = (post: VideoPost, index: number) => {
    analytics.track('video_open', { post_id: post.id, category: post.category, index, feed_view: view });
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
      analytics.track('comment', { post_id: commentTarget.postId, feed_view: view });
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
      const copy = EMPTY_COPY[view];
      return (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{copy.title}</Text>
          <Text style={styles.emptySubtitle}>{copy.subtitle}</Text>
        </View>
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
            itemHeight={feedHeight}
            onLoadMore={() => cursor && loadFeed(cursor, view)}
            onLike={handleLike}
            onComment={(postId) => setCommentTarget({ postId })}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FeedViewTabs selected={view} onSelect={handleViewChange} />
      {USE_PLACEHOLDERS && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>Demo mode — using placeholder data</Text>
        </View>
      )}
      <View
        style={styles.feedArea}
        onLayout={(event) => {
          const nextHeight = Math.floor(event.nativeEvent.layout.height);
          if (nextHeight > 0 && nextHeight !== feedHeight) {
            setFeedHeight(nextHeight);
          }
        }}
      >
        {layout === 'scroll' && feedHeight === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.red} size="large" />
          </View>
        ) : (
          renderFeed()
        )}
      </View>
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
        itemHeight={feedHeight}
        onClose={() => setDetailPost(null)}
        onLike={() => detailPost && handleLike(detailPost.post.id)}
        onComment={() => detailPost && setCommentTarget({ postId: detailPost.post.id })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  feedArea: { flex: 1 },
  demoBanner: {
    alignSelf: 'center',
    marginBottom: Spacing.xs,
    backgroundColor: 'rgba(230, 57, 70, 0.9)', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: 20,
  },
  demoBannerText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
