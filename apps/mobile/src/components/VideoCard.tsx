import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Image } from 'react-native';
import { createElement } from 'react';
import { resolvePlaybackUrl } from '../lib/videoUrl';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../constants/theme';

const PLACEHOLDER_GRADIENTS = ['#1a1a2e', '#16213e', '#0f3460', '#1a1a1a', '#2d1b2e'];

export interface VideoPost {
  id: string;
  caption?: string;
  category?: string;
  media_type?: 'video' | 'photo' | 'text';
  photo_uri?: string | null;
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
  height: number;
  minimal?: boolean;
}

function WebVideo({ uri }: { uri: string }) {
  return createElement('video', {
    src: uri,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    controls: false,
    controlsList: 'nofullscreen nodownload noremoteplayback',
    disablePictureInPicture: true,
    preload: 'metadata',
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      backgroundColor: '#000',
      pointerEvents: 'none',
    },
  });
}

export function VideoCard({ post, index, onLike, onComment, height, minimal = false }: VideoCardProps) {
  const isPhoto = post.media_type === 'photo';
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(!USE_PLACEHOLDERS && !isPhoto);

  useEffect(() => {
    let active = true;
    if (isPhoto || USE_PLACEHOLDERS) {
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
  }, [isPhoto, post.id, post.raw_video_url, post.processed_video_url]);

  const showVideo = !isPhoto && playbackUrl && Platform.OS === 'web';

  return (
    <View style={[styles.card, { height }]}>
      <View style={[styles.videoArea, { backgroundColor: PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length] }]}>
        {isPhoto ? (
          post.photo_uri ? (
            <Image source={{ uri: post.photo_uri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Text style={styles.playIcon}>📷</Text>
          )
        ) : loadingVideo ? (
          <ActivityIndicator color={Colors.red} size="large" />
        ) : showVideo ? (
          <WebVideo uri={playbackUrl} />
        ) : (
          <Text style={styles.playIcon}>▶</Text>
        )}
      </View>

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.sideActions, minimal && styles.sideActionsMinimal]}>
          <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
            <Text style={styles.actionIcon}>♥</Text>
            {!minimal && <Text style={styles.actionCount}>{post.like_count}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
            <Text style={styles.actionIcon}>💬</Text>
            {!minimal && <Text style={styles.actionCount}>{post.comment_count}</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomInfo, minimal && styles.bottomInfoMinimal]}>
          <Text style={styles.username}>@{post.author?.username ?? 'user'}</Text>
          {post.caption && (
            <Text style={styles.caption} numberOfLines={minimal ? 1 : 2}>{post.caption}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.matteBlack },
  videoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  playIcon: { fontSize: 40, color: Colors.textMuted },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sideActions: { position: 'absolute', right: Spacing.md, bottom: 100, gap: Spacing.lg },
  sideActionsMinimal: { bottom: 72, gap: Spacing.md },
  actionBtn: { alignItems: 'center' },
  actionIcon: { fontSize: 24, color: Colors.textPrimary },
  actionCount: { color: Colors.textPrimary, fontSize: 11, fontWeight: '600', marginTop: 2 },
  bottomInfo: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  bottomInfoMinimal: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  username: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  caption: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
});
