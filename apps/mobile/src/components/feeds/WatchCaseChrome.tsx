import { View, StyleSheet, Platform } from 'react-native';
import { FeedTheme, withAlpha } from '../../lib/feedTheme';

interface Props {
  theme: FeedTheme;
  caseH: number;
  caseW: number;
}

/** Side button + Digital Crown affordances on the watch case. */
export function WatchCaseChrome({ theme, caseH, caseW }: Props) {
  const crownTop = caseH * 0.34;

  return (
    <>
      <View style={[styles.sideButton, { top: caseH * 0.18, left: -3 }]} />
      <View style={[styles.crownHousing, { top: crownTop, right: -6 }]}>
        {Array.from({ length: 14 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.crownRidge,
              i % 2 === 0 && { opacity: 0.55 },
            ]}
          />
        ))}
        <View style={[styles.crownCap, { backgroundColor: withAlpha(theme.accent, 0.35) }]} />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.caseHighlight,
          { width: caseW, height: caseH, borderRadius: caseW * 0.19 },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sideButton: {
    position: 'absolute',
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: '#3a3a3e',
    ...(Platform.OS === 'web' ? {
      // @ts-expect-error web
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
    } : {}),
  },
  crownHousing: {
    position: 'absolute',
    width: 12,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#2c2c30',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? {
      // @ts-expect-error web
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.4)',
    } : {}),
  },
  crownRidge: {
    width: 8,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  crownCap: {
    position: 'absolute',
    top: -2,
    width: 10,
    height: 4,
    borderRadius: 2,
  },
  caseHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    ...(Platform.OS === 'web' ? {
      // @ts-expect-error web
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    } : {}),
  },
});
