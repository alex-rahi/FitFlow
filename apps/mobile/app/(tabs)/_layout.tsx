import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="recipes"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.matteBlack,
          borderTopColor: Colors.borderSubtle,
          height: 84,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="recipes" options={{ title: 'Recipes', tabBarIcon: () => null }} />
      <Tabs.Screen name="feed" options={{ title: 'Watch', tabBarIcon: () => null }} />
      <Tabs.Screen name="upload" options={{ title: 'Upload', tabBarIcon: () => null }} />
      <Tabs.Screen name="community" options={{ title: 'Kitchen', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
