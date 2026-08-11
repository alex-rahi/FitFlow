import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { VideoPost } from './VideoCard';
import { FeedTheme } from '../lib/feedTheme';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  post: VideoPost;
  height: number;
  bottomInset?: number;
  theme: FeedTheme;
  onLike: () => void;
  onComment: () => void;
}

export function ThreadSlide({ post, height, bottomInset = 64, theme, onLike, onComment }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [post.id, fadeAnim, slideAnim]);

  const ambientWeb = Platform.OS === 'web' ? {
    backgroundColor: '#060608',
    // @ts-expect-error web-only
    backgroundImage: `radial-gradient(ellipse 60% 50% at 25% 25%, ${theme.glow} 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 80% 75%, ${theme.ambientB} 0%, #060608 70%)`,
  } : { backgroundColor: '#060608' };

  return (
    <View style={[styles.card, { height }, ambientWeb]}>
      <View style={[styles.glowLine, { backgroundColor: theme.accent, shadowColor: theme.accent }]} />

      <Animated.View
        style={[
          styles.body,
          { paddingBottom: bottomInset, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={[styles.author, { color: theme.accent }]}>@{post.author?.username ?? 'user'}</Text>
        <Text style={styles.caption}>{post.caption ?? ''}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.glassBtn, { borderColor: `${theme.accent}44`, backgroundColor: `${theme.accent}18` }]}
            onPress={onLike}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionIcon, { color: theme.accent }]}>♥</Text>
            <Text style={styles.actionCount}>{post.like_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassBtn} onPress={onComment} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{post.comment_count}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  glowLine: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  author: { fontSize: 13, marginBottom: Spacing.lg, letterSpacing: 0.8, fontWeight: '700' },
  caption: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xxl },
  glassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionIcon: { fontSize: 18, color: Colors.textPrimary },
  actionCount: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
});
