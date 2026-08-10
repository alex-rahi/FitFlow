import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { createElement } from 'react';
import { getCategoryLabel } from '../constants/categories';
import { resolvePlaybackUrl } from '../lib/videoUrl';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLACEHOLDER_GRADIENTS = ['#1a1a2e', '#16213e', '#0f3460', '#1a1a1a', '#2d1b2e'];

export interface VideoPost {
  id: string;
  caption?: string;
  category?: string;
  created_at?: string;
  like_count: number;
  comment_count: number;
  raw_video_url?: string | null;
  processed_video_url?: string | null;
  thumbnail_url?: string | null;
  author?: { username?: string; display_name?: string };
}

interface VideoCardProps {
  post: VideoPost;
  index: number;
  onLike: () => void;
  onComment?: () => void;
}

function WebVideo({ uri }: { uri: string }) {
  return createElement('video', {
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    controls: true,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      backgroundColor: '#000',
    },
  });
}

export function VideoCard({ post, index, onLike, onComment }: VideoCardProps) {
  const categoryLabel = getCategoryLabel(post.category);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(!USE_PLACEHOLDERS);

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
  }, [post.id, post.raw_video_url, post.processed_video_url]);

  const showVideo = playbackUrl && Platform.OS === 'web';

  return (
    <View style={styles.card}>
      <View style={[styles.videoArea, { backgroundColor: PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length] }]}>
        {loadingVideo ? (
          <ActivityIndicator color={Colors.red} size="large" />
        ) : showVideo ? (
          <WebVideo uri={playbackUrl} />
        ) : (
          <>
            <Text style={styles.playIcon}>▶</Text>
            <Text style={styles.placeholderLabel}>
              {USE_PLACEHOLDERS ? 'Placeholder video' : 'Video preview unavailable'}
            </Text>
          </>
        )}
      </View>

      <View style={styles.overlay} pointerEvents="box-none">
        {categoryLabel && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>
        )}
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
  videoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playIcon: { fontSize: 48, color: Colors.textMuted },
  placeholderLabel: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.lg },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  categoryBadge: {
    position: 'absolute',
    top: 100,
    left: Spacing.md,
    backgroundColor: 'rgba(230, 57, 70, 0.85)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700' },
  sideActions: { position: 'absolute', right: Spacing.md, bottom: 120, gap: Spacing.lg },
  actionBtn: { alignItems: 'center' },
  actionIcon: { fontSize: 28, color: Colors.textPrimary },
  actionCount: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  bottomInfo: { padding: Spacing.lg, paddingBottom: 100 },
  username: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  caption: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs },
});
