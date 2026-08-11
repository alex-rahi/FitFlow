import { View, Text, StyleSheet, Platform } from 'react-native';
import { ScrollFeedItem } from '../../lib/feedItems';
import { FeedTheme, withAlpha } from '../../lib/feedTheme';
import { Colors } from '../../constants/theme';

interface Props {
  item: ScrollFeedItem | null;
  theme: FeedTheme;
  variant: 'vertical' | 'horizontal';
  label?: string;
}

/** watchOS notification-style glance card for adjacent content. */
export function PeekPreview({ item, theme, variant, label }: Props) {
  const caption =
    item?.type === 'post'
      ? item.post.caption?.slice(0, variant === 'horizontal' ? 16 : 36)
      : item?.type === 'ad'
        ? item.ad.brand
        : null;

  const isHorizontal = variant === 'horizontal';
  const mediaTag =
    item?.type === 'post'
      ? item.post.media_type === 'form'
        ? 'Form'
        : item.post.media_type === 'text'
          ? 'Thread'
          : 'Video'
      : null;

  return (
    <View
      style={[
        styles.peek,
        isHorizontal ? styles.peekH : styles.peekV,
        {
          borderColor: withAlpha(theme.accent, 0.22),
          backgroundColor: withAlpha(theme.accent, 0.06),
        },
        Platform.OS === 'web' && styles.peekWeb,
      ]}
    >
      <View style={[styles.peekAccent, { backgroundColor: theme.accent }]} />
      {label ? <Text style={[styles.peekLabel, { color: theme.accent }]}>{label}</Text> : null}
      {mediaTag ? <Text style={styles.peekMedia}>{mediaTag}</Text> : null}
      <Text style={styles.peekCaption} numberOfLines={isHorizontal ? 2 : 2}>
        {caption ?? '···'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  peek: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 18,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    opacity: 0.88,
  },
  peekWeb: {
    // @ts-expect-error web
    backdropFilter: 'blur(12px)',
  },
  peekV: {
    height: 36,
    marginHorizontal: 4,
  },
  peekH: {
    width: 48,
    flex: 1,
    maxHeight: 110,
    borderRadius: 16,
  },
  peekAccent: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
  peekLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 1,
    marginLeft: 6,
  },
  peekMedia: {
    color: Colors.textMuted,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 6,
    marginBottom: 1,
  },
  peekCaption: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});
