import { ReactNode } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Props {
  pageW: number;
  pageH: number;
  offsetX: Animated.Value;
  offsetY: Animated.Value;
  axis: 'x' | 'y' | null;
  current: ReactNode;
  prev: ReactNode | null;
  next: ReactNode | null;
  prevHorizontal?: ReactNode | null;
  nextHorizontal?: ReactNode | null;
}

/** Layers current/prev/next pages that follow drag offsets for fluid paging. */
export function FluidPageStack({
  pageW,
  pageH,
  offsetX,
  offsetY,
  axis,
  current,
  prev,
  next,
  prevHorizontal,
  nextHorizontal,
}: Props) {
  const showVertical = axis !== 'x';
  const showHorizontal = axis !== 'y';

  return (
    <View style={styles.viewport}>
      {showVertical && prev ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.page,
            {
              transform: [
                { translateX: offsetX },
                { translateY: Animated.subtract(offsetY, pageH) },
              ],
            },
          ]}
        >
          {prev}
        </Animated.View>
      ) : null}

      {showHorizontal && prevHorizontal ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.page,
            {
              transform: [
                { translateX: Animated.subtract(offsetX, pageW) },
                { translateY: offsetY },
              ],
            },
          ]}
        >
          {prevHorizontal}
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.page,
          {
            transform: [{ translateX: offsetX }, { translateY: offsetY }],
          },
        ]}
      >
        {current}
      </Animated.View>

      {showVertical && next ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.page,
            {
              transform: [
                { translateX: offsetX },
                { translateY: Animated.add(offsetY, pageH) },
              ],
            },
          ]}
        >
          {next}
        </Animated.View>
      ) : null}

      {showHorizontal && nextHorizontal ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.page,
            {
              transform: [
                { translateX: Animated.add(offsetX, pageW) },
                { translateY: offsetY },
              ],
            },
          ]}
        >
          {nextHorizontal}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  page: {
    ...StyleSheet.absoluteFillObject,
  },
});
