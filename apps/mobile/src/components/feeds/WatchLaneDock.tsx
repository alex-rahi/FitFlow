import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { FeedLaneId } from '../../constants/categories';
import { FeedTheme, getLaneTheme } from '../../lib/feedTheme';

const LANE_ICONS: Record<FeedLaneId, string> = {
  main_feed: '✦',
  workouts: '🏋',
  equipment: '🛠',
  nutrition: '🥗',
  prs: '🏆',
  photos: '📷',
  community: '💬',
};

interface LaneInfo {
  id: FeedLaneId;
  label: string;
}

interface Props {
  lanes: LaneInfo[];
  laneIdx: number;
  hudOpacity: Animated.Value;
}

/** watchOS-style arc dock — active lane centered and enlarged. */
export function WatchLaneDock({ lanes, laneIdx, hudOpacity }: Props) {
  return (
    <Animated.View style={[styles.dock, { opacity: hudOpacity }]}>
      <View style={styles.arcTrack}>
        {lanes.map((lane, i) => {
          const dist = i - laneIdx;
          const laneTheme = getLaneTheme(lane.id);
          const active = dist === 0;
          const scale = active ? 1.24 : Math.max(0.68, 1 - Math.abs(dist) * 0.13);
          const opacity = active ? 1 : Math.max(0.25, 0.85 - Math.abs(dist) * 0.22);
          const translateY = Math.abs(dist) * 5 + (dist * dist) * 1.5;
          const translateX = dist * 42;

          return (
            <View
              key={lane.id}
              style={[
                styles.iconSlot,
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { scale },
                  ],
                  opacity,
                  zIndex: active ? 10 : 5 - Math.abs(dist),
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  active && styles.iconCircleActive,
                  {
                    borderColor: active ? laneTheme.accent : 'rgba(255,255,255,0.1)',
                    backgroundColor: active ? laneTheme.accentSoft : 'rgba(255,255,255,0.04)',
                    ...(active && Platform.OS === 'web' ? {
                      // @ts-expect-error web
                      boxShadow: `0 0 16px ${laneTheme.glow}`,
                    } : {}),
                  },
                ]}
              >
                <Text style={[styles.iconGlyph, active && { color: laneTheme.accent }]}>
                  {LANE_ICONS[lane.id]}
                </Text>
              </View>
              {active ? (
                <Text style={[styles.iconLabel, { color: laneTheme.accent }]} numberOfLines={1}>
                  {lane.label}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: {
    width: '100%',
    height: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  arcTrack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 64,
    width: '100%',
  },
  iconSlot: {
    position: 'absolute',
    alignItems: 'center',
    width: 52,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
  },
  iconGlyph: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.75)',
  },
  iconLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    maxWidth: 64,
  },
});
