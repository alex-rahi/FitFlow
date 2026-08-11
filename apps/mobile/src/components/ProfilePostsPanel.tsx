import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { VideoPost } from './VideoCard';
import { Colors, Radius, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = Spacing.sm;
const GRID_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP) / 2;

interface Props {
  posts: VideoPost[];
  onOpen?: (post: VideoPost, index: number) => void;
}

export function ProfilePostsPanel({ posts, onOpen }: Props) {
  const filtered = posts.filter((p) => p.media_type === 'photo' || !p.media_type);

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No recipe photos yet</Text>
        <Text style={styles.emptySubtitle}>Upload a recipe photo from the Upload tab.</Text>
      </View>
    );
  }

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
    overflow: 'hidden',
  },
  gridPhoto: { width: '100%', height: '100%' },
  photoIcon: { fontSize: 28 },
  gridCaption: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', padding: Spacing.sm },
  gridMeta: { color: Colors.red, fontSize: 11, fontWeight: '600', paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
});
