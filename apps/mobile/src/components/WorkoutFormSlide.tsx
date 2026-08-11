import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { createElement } from 'react';
import { VideoPost } from './VideoCard';
import { FeedTheme } from '../lib/feedTheme';
import { FORM_UPLOAD_DISCLAIMER } from '../constants/workoutForm';
import { resolvePlaybackUrl } from '../lib/videoUrl';
import { Colors, Radius, Spacing, USE_PLACEHOLDERS } from '../constants/theme';

interface Props {
  post: VideoPost;
  height: number;
  bottomInset?: number;
  theme: FeedTheme;
  onLike: () => void;
  onComment: () => void;
}

const PLACEHOLDER_GRADIENTS = ['#0d0d12', '#12101a', '#0a1018', '#100a0a'];

function WebVideo({ uri }: { uri: string }) {
  return createElement('video', {
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    style: { width: '100%', height: '100%', objectFit: 'cover' as const },
  });
}

export function WorkoutFormSlide({ post, height, bottomInset = 64, theme, onLike, onComment }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const form = post.workout_form;
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(!USE_PLACEHOLDERS);

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

  useEffect(() => {
    let active = true;
    if (USE_PLACEHOLDERS) {
      setLoadingVideo(false);
      return;
    }
    setLoadingVideo(true);
    resolvePlaybackUrl(post)
      .then((url) => {
        if (active) setPlaybackUrl(url);
      })
      .finally(() => {
        if (active) setLoadingVideo(false);
      });
    return () => {
      active = false;
    };
  }, [post]);

  const exercise = form?.exercise ?? post.caption ?? 'Form check';
  const focusPoints = form?.focus_points ?? [];
  const videoH = Math.round(height * 0.52);
  const showVideo = playbackUrl && Platform.OS === 'web';

  return (
    <View style={[styles.card, { height, backgroundColor: '#060608' }]}>
      <View style={[styles.glowLine, { backgroundColor: theme.accent, shadowColor: theme.accent }]} />

      <Animated.View
        style={[
          styles.body,
          { paddingBottom: bottomInset, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.videoWrap, { height: videoH, borderColor: `${theme.accent}33` }]}>
          {loadingVideo ? (
            <ActivityIndicator color={theme.accent} />
          ) : showVideo ? (
            <WebVideo uri={playbackUrl} />
          ) : (
            <View style={[styles.videoPlaceholder, { backgroundColor: PLACEHOLDER_GRADIENTS[0] }]}>
              <Text style={[styles.playIcon, { color: theme.accent }]}>▶</Text>
              <Text style={styles.placeholderLabel}>Form-check clip</Text>
            </View>
          )}
          <View style={[styles.videoBadge, { backgroundColor: `${theme.accent}22`, borderColor: `${theme.accent}55` }]}>
            <Text style={[styles.videoBadgeText, { color: theme.accent }]}>Form</Text>
          </View>
        </View>

        <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.author, { color: theme.accent }]}>@{post.author?.username ?? 'user'}</Text>
            {form?.request_feedback !== false ? (
              <Text style={[styles.feedbackTag, { color: theme.accent }]}>Feedback welcome</Text>
            ) : null}
          </View>

          <Text style={styles.exercise}>{exercise}</Text>

          {focusPoints.length > 0 ? (
            <View style={[styles.focusBox, { borderColor: `${theme.accent}33` }]}>
              <Text style={styles.focusTitle}>Check these cues</Text>
              {focusPoints.map((point) => (
                <View key={point} style={styles.focusRow}>
                  <Text style={[styles.focusDot, { color: theme.accent }]}>•</Text>
                  <Text style={styles.focusText}>{point}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {form?.notes ? <Text style={styles.notes}>{form.notes}</Text> : null}
          {post.caption && post.caption !== exercise ? (
            <Text style={styles.caption}>{post.caption}</Text>
          ) : null}
          <Text style={styles.liability}>{FORM_UPLOAD_DISCLAIMER.liability}</Text>
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
    zIndex: 2,
  },
  body: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  videoWrap: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  videoPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 42, opacity: 0.7 },
  placeholderLabel: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.sm, fontWeight: '600' },
  videoBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  videoBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  detailScroll: { flex: 1, marginBottom: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  author: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  feedbackTag: { fontSize: 11, fontWeight: '600', opacity: 0.9 },
  exercise: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: Spacing.sm,
  },
  focusBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  focusTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  focusRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  focusDot: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
  focusText: { flex: 1, color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
  notes: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: Spacing.xs },
  caption: { color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
  liability: { color: Colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: Spacing.sm, opacity: 0.85 },
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
