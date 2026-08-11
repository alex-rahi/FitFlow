import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FeedViewId, filterPostsForFeedView, getFeedViewLabel } from '../constants/categories';
import { VideoPost } from './VideoCard';
import { Colors, Radius, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = Spacing.sm;
const GRID_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP) / 2;

interface Props {
  posts: VideoPost[];
  view: FeedViewId;
  onOpen?: (post: VideoPost, index: number) => void;
}

export function ProfilePostsPanel({ posts, view, onOpen }: Props) {
  const filtered = filterPostsForFeedView(posts, view);

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No {getFeedViewLabel(view).toLowerCase()} posts yet</Text>
        <Text style={styles.emptySubtitle}>
          {view === 'feed' && 'Upload a workout or PR to fill your feed.'}
          {view === 'recipes' && 'Share a recipe or meal prep video.'}
          {view === 'community' && 'Start a community thread or form-check post.'}
        </Text>
      </View>
    );
  }

  if (view === 'recipes') {
    return (
      <View style={styles.grid}>
        {filtered.map((post, index) => (
          <TouchableOpacity
            key={post.id}
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => onOpen?.(post, index)}
          >
            <View style={styles.gridThumb}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <Text style={styles.gridCaption} numberOfLines={2}>{post.caption ?? 'Untitled'}</Text>
            <Text style={styles.gridMeta}>♥ {post.like_count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (view === 'community') {
    return (
      <View style={styles.list}>
        {filtered.map((post, index) => (
          <TouchableOpacity
            key={post.id}
            style={styles.threadRow}
            activeOpacity={0.85}
            onPress={() => onOpen?.(post, index)}
          >
            <Text style={styles.threadCaption} numberOfLines={2}>{post.caption ?? 'Community post'}</Text>
            <Text style={styles.threadMeta}>💬 {post.comment_count} · ♥ {post.like_count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {filtered.map((post, index) => (
        <TouchableOpacity
          key={post.id}
          style={styles.feedRow}
          activeOpacity={0.85}
          onPress={() => onOpen?.(post, index)}
        >
          <View style={styles.feedThumb}>
            <Text style={styles.playIconSm}>▶</Text>
          </View>
          <View style={styles.feedBody}>
            <Text style={styles.feedCaption} numberOfLines={2}>{post.caption ?? 'Workout clip'}</Text>
            <Text style={styles.feedMeta}>♥ {post.like_count} · 💬 {post.comment_count}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md, alignItems: 'center' },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 13, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 18 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  gridCard: {
    width: GRID_WIDTH,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  gridThumb: {
    aspectRatio: 1,
    backgroundColor: '#1a3a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCaption: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', padding: Spacing.sm },
  gridMeta: { color: Colors.red, fontSize: 11, fontWeight: '600', paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  threadRow: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  threadCaption: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  threadMeta: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.xs },
  feedRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  feedThumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedBody: { flex: 1, justifyContent: 'center' },
  feedCaption: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  feedMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  playIcon: { fontSize: 28, color: Colors.textMuted },
  playIconSm: { fontSize: 20, color: Colors.textMuted },
});
