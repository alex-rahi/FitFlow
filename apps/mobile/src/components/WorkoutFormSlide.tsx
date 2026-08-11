import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing, ScrollView } from 'react-native';
import { VideoPost } from './VideoCard';
import { FeedTheme } from '../lib/feedTheme';
import { formatWorkoutSet } from '../constants/workoutForm';
import { getCategoryLabel } from '../constants/categories';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  post: VideoPost;
  height: number;
  bottomInset?: number;
  theme: FeedTheme;
  onLike: () => void;
  onComment: () => void;
}

export function WorkoutFormSlide({ post, height, bottomInset = 64, theme, onLike, onComment }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const form = post.workout_form;

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

  const title = form?.title ?? post.caption ?? 'Workout log';
  const entries = form?.entries ?? [];

  return (
    <View style={[styles.card, { height }, ambientWeb]}>
      <View style={[styles.glowLine, { backgroundColor: theme.accent, shadowColor: theme.accent }]} />

      <Animated.View
        style={[
          styles.body,
          { paddingBottom: bottomInset, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.badge, { color: theme.accent, borderColor: `${theme.accent}55` }]}>
            {getCategoryLabel(post.category)} · Form
          </Text>
          <Text style={[styles.author, { color: theme.accent }]}>@{post.author?.username ?? 'user'}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.table, { borderColor: `${theme.accent}33` }]}>
            <View style={[styles.tableHeader, { backgroundColor: `${theme.accent}14` }]}>
              <Text style={[styles.colExercise, styles.headerText]}>Exercise</Text>
              <Text style={[styles.colSets, styles.headerText]}>Work</Text>
            </View>
            {entries.length > 0 ? entries.map((entry, i) => (
              <View key={`${entry.exercise}-${i}`} style={styles.tableRow}>
                <Text style={styles.colExercise}>{entry.exercise}</Text>
                <Text style={[styles.colSets, { color: theme.accent }]}>{formatWorkoutSet(entry)}</Text>
              </View>
            )) : (
              <View style={styles.tableRow}>
                <Text style={styles.emptyRow}>No exercises logged</Text>
              </View>
            )}
          </View>
          {form?.notes ? (
            <Text style={styles.notes}>{form.notes}</Text>
          ) : null}
        </ScrollView>

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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  author: { fontSize: 13, letterSpacing: 0.8, fontWeight: '700' },
  title: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  tableScroll: { flex: 1, marginBottom: Spacing.md },
  table: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: Spacing.md },
  headerText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderSubtle,
  },
  colExercise: { flex: 1, color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  colSets: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700', minWidth: 88, textAlign: 'right' },
  emptyRow: { color: Colors.textMuted, fontSize: 14, flex: 1 },
  notes: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  actions: { flexDirection: 'row', gap: Spacing.md },
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
