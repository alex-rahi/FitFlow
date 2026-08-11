import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VideoPost } from './VideoCard';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  post: VideoPost;
  height: number;
  onLike: () => void;
  onComment: () => void;
}

export function ThreadSlide({ post, height, onLike, onComment }: Props) {
  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.body}>
        <Text style={styles.author}>@{post.author?.username ?? 'user'}</Text>
        <Text style={styles.caption}>{post.caption ?? ''}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={onLike}>
          <Text style={styles.actionIcon}>♥</Text>
          <Text style={styles.actionCount}>{post.like_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={onComment}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.comment_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.matteBlack,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  body: { flex: 1, justifyContent: 'center' },
  author: { color: Colors.textMuted, fontSize: 14, marginBottom: Spacing.md },
  caption: { color: Colors.textPrimary, fontSize: 22, fontWeight: '600', lineHeight: 30 },
  actions: { flexDirection: 'row', gap: Spacing.xl, paddingBottom: Spacing.xl },
  action: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionIcon: { fontSize: 22, color: Colors.textPrimary },
  actionCount: { color: Colors.textMuted, fontSize: 14 },
});
