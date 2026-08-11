import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { analytics } from '../lib/analytics';

export function useScreenAnalytics(screen: string) {
  useFocusEffect(
    useCallback(() => {
      analytics.track('screen_view', { screen });
    }, [screen]),
  );
}
