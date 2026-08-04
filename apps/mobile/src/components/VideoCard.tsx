import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLACEHOLDER_GRADIENTS = ['#1a1a2e', '#16213e', '#0f3460', '#1a1a1a', '#2d1b2e'];

export interface VideoPost {
  id: string;
  caption?: string;
  like_count: number;
  comment_count: number;
  author?: { username?: string; display_name?: string };
}

interface VideoCardProps {
  post: VideoPost;
  index: number;
  onLike: () => void;
  onComment?: () => void;
}

export function VideoCard({ post, index, onLike, onComment }: VideoCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.videoPlaceholder, { backgroundColor: PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length] }]}>
        <Text style={styles.playIcon}>▶</Text>
        <Text style={styles.placeholderLabel}>Placeholder video</Text>
      </View>

      <View style={styles.overlay}>
        <View style={styles.sideActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
            <Text style={styles.actionIcon}>♥</Text>
            <Text style={styles.actionCount}>{post.like_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{post.comment_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomInfo}>
          <Text style={styles.username}>@{post.author?.username ?? 'user'}</Text>
          {post.caption && <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>}
        </View>
      </View>
    </View>
  );
}

export { SCREEN_HEIGHT };

const styles = StyleSheet.create({
  card: { height: SCREEN_HEIGHT, backgroundColor: Colors.matteBlack },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 48, color: Colors.textMuted },
  placeholderLabel: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.sm },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sideActions: { position: 'absolute', right: Spacing.md, bottom: 120, gap: Spacing.lg },
  actionBtn: { alignItems: 'center' },
  actionIcon: { fontSize: 28, color: Colors.textPrimary },
  actionCount: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  bottomInfo: { padding: Spacing.lg, paddingBottom: 100 },
  username: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  caption: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs },
});
