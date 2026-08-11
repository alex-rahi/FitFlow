import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { analytics } from '../lib/analytics';

export function useScreenAnalytics(screen: string) {
  useFocusEffect(
    useCallback(() => {
      analytics.track('screen_view', { screen });
    }, [screen]),
  );
}
