import { View, Text, StyleSheet } from 'react-native';
import { ScrollFeedItem } from '../../lib/feedItems';
import { FeedTheme, withAlpha } from '../../lib/feedTheme';
import { Colors } from '../../constants/theme';

interface Props {
  item: ScrollFeedItem | null;
  theme: FeedTheme;
  variant: 'vertical' | 'horizontal';
  label?: string;
}

export function PeekPreview({ item, theme, variant, label }: Props) {
  const caption =
    item?.type === 'post'
      ? item.post.caption?.slice(0, variant === 'horizontal' ? 18 : 42)
      : item?.type === 'ad'
        ? item.ad.brand
        : null;

  const isHorizontal = variant === 'horizontal';

  return (
    <View
      style={[
        styles.peek,
        isHorizontal ? styles.peekH : styles.peekV,
        { borderColor: withAlpha(theme.accent, 0.27), backgroundColor: withAlpha(theme.accent, 0.08) },
      ]}
    >
      <View style={[styles.peekGlow, { backgroundColor: theme.accent }]} />
      {label ? <Text style={[styles.peekLabel, { color: theme.accent }]}>{label}</Text> : null}
      <Text style={styles.peekCaption} numberOfLines={isHorizontal ? 3 : 2}>
        {caption ?? '···'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  peek: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 6,
    opacity: 0.72,
  },
  peekV: {
    height: 40,
    marginHorizontal: 8,
  },
  peekH: {
    width: 52,
    flex: 1,
    maxHeight: 120,
  },
  peekGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.2,
  },
  peekLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  peekCaption: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500',
  },
});
