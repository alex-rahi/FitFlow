import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { FeedViewId, filterPostsForFeedView } from '../constants/categories';
import { VideoPost } from './VideoCard';
import { Colors, Radius, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = Spacing.sm;
const GRID_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP) / 2;

interface Props {
  posts: VideoPost[];
  view?: FeedViewId;
  onOpen?: (post: VideoPost, index: number) => void;
}

export function ProfilePostsPanel({ posts, view = 'feed', onOpen }: Props) {
  const filtered = filterPostsForFeedView(posts, view);

  if (filtered.length === 0) {
    const emptyCopy = view === 'community'
      ? { title: 'No threads yet', subtitle: 'Start a community thread from Upload.' }
      : view === 'photos'
        ? { title: 'No photos yet', subtitle: 'Upload a progress pic from the Upload tab.' }
        : { title: 'No videos yet', subtitle: 'Upload a workout video from the Upload tab.' };
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
        <Text style={styles.emptySubtitle}>{emptyCopy.subtitle}</Text>
      </View>
    );
  }

  if (view === 'community') {
    return (
      <View style={styles.threadList}>
        {filtered.map((post) => (
          <View key={post.id} style={styles.threadItem}>
            <Text style={styles.threadCaption} numberOfLines={3}>{post.caption ?? 'Untitled thread'}</Text>
            <Text style={styles.threadMeta}>♥ {post.like_count} · 💬 {post.comment_count}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (view === 'photos') {
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
              {post.media_type === 'photo' && post.photo_uri ? (
                <Image source={{ uri: post.photo_uri }} style={styles.gridPhoto} resizeMode="cover" />
              ) : (
                <Text style={styles.photoIcon}>📷</Text>
              )}
            </View>
            <Text style={styles.gridCaption} numberOfLines={2}>{post.caption ?? 'Untitled'}</Text>
            <Text style={styles.gridMeta}>♥ {post.like_count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.videoList}>
      {filtered.map((post, index) => (
        <TouchableOpacity key={post.id} style={styles.videoItem} onPress={() => onOpen?.(post, index)}>
          <Text style={styles.videoIcon}>🎬</Text>
          <View style={styles.videoMeta}>
            <Text style={styles.videoCaption} numberOfLines={2}>{post.caption ?? 'Untitled'}</Text>
            <Text style={styles.videoStats}>♥ {post.like_count} · 💬 {post.comment_count}</Text>
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
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridPhoto: { width: '100%', height: '100%' },
  photoIcon: { fontSize: 28 },
  gridCaption: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', padding: Spacing.sm },
  gridMeta: { color: Colors.red, fontSize: 11, fontWeight: '600', paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
  videoList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  videoIcon: { fontSize: 28 },
  videoMeta: { flex: 1 },
  videoCaption: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  videoStats: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  threadList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  threadItem: {
    padding: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  threadCaption: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  threadMeta: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.xs },
});
