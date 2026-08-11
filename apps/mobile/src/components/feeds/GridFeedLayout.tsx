import { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image } from 'react-native';
import { VideoPost } from '../VideoCard';
import { AdPlaceholder } from '../AdPlaceholder';
import { PLACEHOLDER_ADS } from '../../constants/ads';
import { analytics } from '../../lib/analytics';
import { Colors, Radius, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - CARD_GAP) / 2;

const GRADIENTS = ['#1a3a2e', '#2e1a3a', '#1a2e3a', '#3a2e1a', '#2a1a1a'];

interface Props {
  posts: VideoPost[];
  onLike: (postId: string) => void;
  onOpen: (post: VideoPost, index: number) => void;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function GridFeedLayout({ posts, onLike, onOpen }: Props) {
  const headerAd = PLACEHOLDER_ADS[0];
  const adSeen = useRef(false);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <AdPlaceholder
          ad={headerAd}
          variant="banner"
          onPress={() => {
            analytics.track('ad_click', { ad_id: headerAd.id, brand: headerAd.brand, placement: 'recipes_grid' });
          }}
        />
      }
      onLayout={() => {
        if (adSeen.current) return;
        adSeen.current = true;
        analytics.track('ad_impression', { ad_id: headerAd.id, brand: headerAd.brand, placement: 'recipes_grid' });
      }}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => onOpen(item, index)}
        >
          <View style={[styles.thumb, { backgroundColor: GRADIENTS[index % GRADIENTS.length] }]}>
            {item.media_type === 'photo' && item.photo_uri ? (
              <Image source={{ uri: item.photo_uri }} style={styles.photo} resizeMode="cover" />
            ) : (
              <Text style={styles.photoIcon}>📷</Text>
            )}
          </View>
          <View style={styles.meta}>
            <Text style={styles.caption} numberOfLines={2}>{item.caption ?? 'Untitled'}</Text>
            <View style={styles.footer}>
              <Text style={styles.author}>@{item.author?.username ?? 'user'}</Text>
              <TouchableOpacity onPress={() => onLike(item.id)} hitSlop={8}>
                <Text style={styles.likes}>♥ {formatCount(item.like_count)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  thumb: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoIcon: { fontSize: 32 },
  meta: { padding: Spacing.sm },
  caption: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  author: { color: Colors.textMuted, fontSize: 11, flex: 1 },
  likes: { color: Colors.red, fontSize: 11, fontWeight: '600' },
});
