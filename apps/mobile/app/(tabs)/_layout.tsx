import { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { analytics } from '../../src/lib/analytics';

const TAB_BAR = {
  backgroundColor: Colors.matteBlack,
  borderTopColor: Colors.borderSubtle,
  borderTopWidth: StyleSheet.hairlineWidth,
  height: 56,
  paddingBottom: 8,
  paddingTop: 8,
};

const IMMERSIVE_TAB_BAR = {
  position: 'absolute' as const,
  backgroundColor: Platform.OS === 'web' ? 'rgba(10,10,10,0.72)' : 'rgba(10,10,10,0.88)',
  borderTopWidth: 0,
  height: 52,
  paddingBottom: 6,
  paddingTop: 6,
  ...(Platform.OS === 'web' ? {
    left: 48,
    right: 48,
    bottom: 16,
    maxWidth: 420,
    marginLeft: 'auto' as unknown as number,
    marginRight: 'auto' as unknown as number,
    borderRadius: 26,
    backdropFilter: 'blur(12px)',
  } : {}),
};

export default function TabLayout() {
  useEffect(() => {
    void analytics.hydrate();
  }, []);

  return (
    <Tabs
      initialRouteName="feed"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
        tabBarStyle: TAB_BAR,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: () => null,
          tabBarStyle: IMMERSIVE_TAB_BAR,
        }}
      />
      <Tabs.Screen name="upload" options={{ title: 'Upload', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => null }} />
      <Tabs.Screen name="recipes" options={{ href: null }} />
      <Tabs.Screen name="community" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
