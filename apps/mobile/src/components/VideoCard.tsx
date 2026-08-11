import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { createElement } from 'react';
import { resolvePlaybackUrl } from '../lib/videoUrl';
import { getCategoryAccent, getCategoryAccentBorder, getCategoryAccentSoft, webScrimStyle } from '../lib/feedTheme';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../constants/theme';

const PLACEHOLDER_GRADIENTS = ['#0d0d12', '#12101a', '#0a1018', '#100a0a', '#0a120f'];

export interface VideoPost {
  id: string;
  caption?: string;
  category?: string;
  media_type?: 'video' | 'photo' | 'text';
  photo_uri?: string | null;
  topics?: string[];
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
  accentColor?: string;
  interestHint?: string | null;
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

export function VideoCard({
  post,
  index,
  onLike,
  onComment,
  height,
  immersive = false,
  bottomInset = 64,
  accentColor: accentOverride,
  interestHint,
}: VideoCardProps) {
  const isPhoto = post.media_type === 'photo';
  const accent = accentOverride ?? getCategoryAccent(post.category);
  const accentSoft = getCategoryAccentSoft(post.category);
  const accentBorder = getCategoryAccentBorder(post.category);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(!USE_PLACEHOLDERS && !isPhoto);
  const [liked, setLiked] = useState(false);

  const kenBurns = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const likeBurst = useRef(new Animated.Value(0)).current;
  const enterOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLiked(false);
    enterOpacity.setValue(0);
    Animated.timing(enterOpacity, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [post.id, enterOpacity]);

  useEffect(() => {
    if (!USE_PLACEHOLDERS && !isPhoto) return;
    kenBurns.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(kenBurns, {
          toValue: 1.06,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(kenBurns, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [isPhoto, kenBurns, post.id]);

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
    likeBurst.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(likeScale, { toValue: 1.35, friction: 4, useNativeDriver: true }),
        Animated.spring(likeScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.timing(likeBurst, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => likeBurst.setValue(0));
    onLike();
  };

  const burstScale = likeBurst.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.2],
  });
  const burstOpacity = likeBurst.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.6, 0.35, 0],
  });

  const scrimWeb = Platform.OS === 'web' ? webScrimStyle(accent) : undefined;

  return (
    <Animated.View style={[styles.card, { height, opacity: enterOpacity }]}>
      <Animated.View
        style={[
          styles.media,
          {
            backgroundColor: PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length],
            transform: [{ scale: kenBurns }],
          },
        ]}
      >
        {isPhoto ? (
          post.photo_uri ? (
            <Image source={{ uri: post.photo_uri }} style={styles.mediaFill} resizeMode="cover" />
          ) : (
            <Text style={[styles.placeholderIcon, { color: accent }]}>📷</Text>
          )
        ) : loadingVideo ? (
          <ActivityIndicator color={accent} size="large" />
        ) : showVideo ? (
          <WebVideo uri={playbackUrl} />
        ) : (
          <View style={styles.placeholderVideo}>
            <Text style={[styles.placeholderIcon, { color: accent, opacity: 0.5 }]}>▶</Text>
          </View>
        )}
      </Animated.View>

      {immersive && (
        <View style={styles.scrimWrap} pointerEvents="none">
          <View style={[styles.scrim, scrimWeb]} />
          <View style={[styles.accentWash, { backgroundColor: accent, opacity: 0.07 }]} />
        </View>
      )}

      <View style={[styles.vignette, Platform.OS === 'web' && styles.vignetteWeb]} pointerEvents="none" />

      <View style={[styles.overlay, { paddingBottom: bottomInset }]} pointerEvents="box-none">
        <View style={styles.sideActions}>
          <TouchableOpacity
            style={[
              styles.glassBtn,
              liked && { backgroundColor: accentSoft, borderColor: accentBorder },
            ]}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Text style={[styles.actionIcon, liked && { color: accent }]}>♥</Text>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.likeBurst,
                {
                  backgroundColor: accent,
                  opacity: burstOpacity,
                  transform: [{ scale: burstScale }],
                },
              ]}
            />
            <Text style={styles.actionCount}>{post.like_count + (liked ? 1 : 0)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.glassBtn, { borderColor: accentBorder }]}
            onPress={onComment}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{post.comment_count}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomInfo}>
          {interestHint ? (
            <View style={[styles.interestPill, { borderColor: accentBorder, backgroundColor: accentSoft }]}>
              <Text style={[styles.interestText, { color: accent }]}>For you · {interestHint}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <View style={[styles.categoryPill, { backgroundColor: accentSoft, borderColor: accentBorder }]}>
              <Text style={[styles.categoryText, { color: accent }]}>
                {isPhoto ? 'Photo' : 'Video'} · {(post.category ?? 'fitness').replace('_', ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.username}>@{post.author?.username ?? 'user'}</Text>
          {post.caption ? (
            <Text style={styles.caption} numberOfLines={immersive ? 2 : 3}>{post.caption}</Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#000', overflow: 'hidden' },
  media: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  mediaFill: { width: '100%', height: '100%' },
  placeholderVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  placeholderIcon: { fontSize: 48 },
  scrimWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  scrim: {
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  accentWash: {
    ...StyleSheet.absoluteFillObject,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
  },
  vignetteWeb: {
    // @ts-expect-error web-only
    boxShadow: 'inset 0 0 120px rgba(0,0,0,0.45)',
  },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sideActions: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 128,
    gap: Spacing.md,
  },
  glassBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 50,
    overflow: 'visible',
  },
  likeBurst: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    top: 4,
  },
  actionIcon: { fontSize: 22, color: Colors.textPrimary },
  actionCount: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  bottomInfo: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  interestPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  interestText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  metaRow: { flexDirection: 'row', gap: Spacing.xs },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  categoryText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  username: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  caption: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 6, lineHeight: 20 },
});
