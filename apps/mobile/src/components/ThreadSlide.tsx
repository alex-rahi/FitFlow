import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { VideoPost } from './VideoCard';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  post: VideoPost;
  height: number;
  bottomInset?: number;
  onLike: () => void;
  onComment: () => void;
}

export function ThreadSlide({ post, height, bottomInset = 64, onLike, onComment }: Props) {
  return (
    <View style={[styles.card, { height }]}>
      <View style={[styles.ambient, Platform.OS === 'web' && styles.ambientWeb]} />
      <View style={[styles.body, { paddingBottom: bottomInset }]}>
        <Text style={styles.author}>@{post.author?.username ?? 'user'}</Text>
        <Text style={styles.caption}>{post.caption ?? ''}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.glassBtn} onPress={onLike} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>♥</Text>
            <Text style={styles.actionCount}>{post.like_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassBtn} onPress={onComment} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{post.comment_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#080808',
    overflow: 'hidden',
  },
  ambient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121218',
    opacity: 0.9,
  },
  ambientWeb: {
    backgroundColor: 'transparent',
    // @ts-expect-error web-only CSS
    backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(230,57,70,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(30,30,60,0.4) 0%, #080808 70%)',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  author: { color: Colors.textMuted, fontSize: 13, marginBottom: Spacing.lg, letterSpacing: 0.5 },
  caption: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xxl },
  glassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionIcon: { fontSize: 18, color: Colors.textPrimary },
  actionCount: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
});
