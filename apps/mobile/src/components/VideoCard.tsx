import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { createElement } from 'react';
import { resolvePlaybackUrl } from '../lib/videoUrl';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../constants/theme';

const PLACEHOLDER_GRADIENTS = ['#0d0d12', '#12101a', '#0a1018', '#100a0a', '#0a120f'];

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
  immersive?: boolean;
  bottomInset?: number;
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
    preload: 'auto',
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      backgroundColor: '#000',
      pointerEvents: 'none',
    },
  });
}

function BottomScrim() {
  return (
    <View style={styles.scrimWrap} pointerEvents="none">
      <View style={[styles.scrim, Platform.OS === 'web' && styles.scrimWeb]} />
    </View>
  );
}

export function VideoCard({
  post,
  index,
  onLike,
  onComment,
  height,
  immersive = false,
  bottomInset = 64,
}: VideoCardProps) {
  const isPhoto = post.media_type === 'photo';
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(!USE_PLACEHOLDERS && !isPhoto);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(false);
  }, [post.id]);

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

  const handleLike = () => {
    setLiked(true);
    onLike();
  };

  return (
    <View style={[styles.card, { height }]}>
      <View
        style={[
          styles.media,
          { backgroundColor: PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length] },
        ]}
      >
        {isPhoto ? (
          post.photo_uri ? (
            <Image source={{ uri: post.photo_uri }} style={styles.mediaFill} resizeMode="cover" />
          ) : (
            <Text style={styles.placeholderIcon}>📷</Text>
          )
        ) : loadingVideo ? (
          <ActivityIndicator color={Colors.red} size="large" />
        ) : showVideo ? (
          <WebVideo uri={playbackUrl} />
        ) : (
          <View style={styles.placeholderVideo}>
            <Text style={styles.placeholderIcon}>▶</Text>
          </View>
        )}
      </View>

      {immersive && <BottomScrim />}

      <View style={[styles.overlay, { paddingBottom: bottomInset }]} pointerEvents="box-none">
        <View style={styles.sideActions}>
          <TouchableOpacity
            style={[styles.glassBtn, liked && styles.glassBtnActive]}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionIcon, liked && styles.actionIconActive]}>♥</Text>
            <Text style={styles.actionCount}>{post.like_count + (liked ? 1 : 0)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassBtn} onPress={onComment} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{post.comment_count}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomInfo}>
          <Text style={styles.username}>@{post.author?.username ?? 'user'}</Text>
          {post.caption ? (
            <Text style={styles.caption} numberOfLines={immersive ? 2 : 3}>{post.caption}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#000' },
  media: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  mediaFill: { width: '100%', height: '100%' },
  placeholderVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  placeholderIcon: { fontSize: 44, color: 'rgba(255,255,255,0.25)' },
  scrimWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  scrim: {
    height: '45%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scrimWeb: {
    backgroundColor: 'transparent',
    // @ts-expect-error web-only CSS
    backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 45%, transparent 100%)',
  },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sideActions: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 120,
    gap: Spacing.md,
  },
  glassBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 48,
  },
  glassBtnActive: {
    backgroundColor: 'rgba(230,57,70,0.35)',
    borderColor: 'rgba(230,57,70,0.5)',
  },
  actionIcon: { fontSize: 22, color: Colors.textPrimary },
  actionIconActive: { color: Colors.red },
  actionCount: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  bottomInfo: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  username: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  caption: { color: 'rgba(255,255,255,0.82)', fontSize: 14, marginTop: 6, lineHeight: 20 },
});
