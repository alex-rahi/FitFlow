import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlaceholderAd } from '../constants/ads';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  ad: PlaceholderAd;
  height?: number;
  variant?: 'feed' | 'banner';
  onPress?: () => void;
}

export function AdPlaceholder({ ad, height, variant = 'feed', onPress }: Props) {
  if (variant === 'banner') {
    return (
      <TouchableOpacity style={styles.banner} activeOpacity={0.9} onPress={onPress}>
        <View style={styles.bannerTop}>
          <Text style={styles.sponsored}>Sponsored</Text>
          <Text style={styles.brand}>{ad.brand}</Text>
        </View>
        <Text style={styles.bannerHeadline}>{ad.headline}</Text>
        <Text style={styles.bannerCta}>{ad.cta} →</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.feedCard, height ? { height } : null]}>
      <View style={[styles.feedGlow, { backgroundColor: `${ad.accent}22` }]} />
      <View style={styles.feedContent}>
        <Text style={styles.sponsored}>Sponsored</Text>
        <Text style={[styles.feedBrand, { color: ad.accent }]}>{ad.brand}</Text>
        <Text style={styles.feedHeadline}>{ad.headline}</Text>
        <Text style={styles.feedBody}>{ad.body}</Text>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: ad.accent }]}
          activeOpacity={0.85}
          onPress={onPress}
        >
          <Text style={styles.ctaText}>{ad.cta}</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Placeholder ad — monetization demo only</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  feedCard: {
    backgroundColor: Colors.matteBlack,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  feedGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  feedContent: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  sponsored: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  feedBrand: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  feedHeadline: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: Spacing.sm,
  },
  feedBody: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  ctaButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    minWidth: 180,
    alignItems: 'center',
  },
  ctaText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  banner: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  brand: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerHeadline: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  bannerCta: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
});
