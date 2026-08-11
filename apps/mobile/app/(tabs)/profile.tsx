import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProfilePostsPanel } from '../../src/components/ProfilePostsPanel';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { VideoPost } from '../../src/components/VideoCard';
import { Colors, Spacing, PLACEHOLDER_USER_ID, USE_PLACEHOLDERS } from '../../src/constants/theme';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';

export default function ProfileScreen() {
  useScreenAnalytics('profile');
  const { signOut, session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id ?? (USE_PLACEHOLDERS ? PLACEHOLDER_USER_ID : null);
    Promise.all([
      api.getProfile(),
      userId ? api.getUserPosts(userId) : Promise.resolve([]),
    ])
      .then(([profileData, userPosts]) => {
        setProfile(profileData);
        setPosts(userPosts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.username?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.name}>{profile?.display_name ?? 'User'}</Text>
          <Text style={styles.handle}>@{profile?.username ?? 'user'}</Text>
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.stats}>
          <Text style={styles.stat}>{posts.length} posts</Text>
          <Text style={styles.stat}>{profile?.follower_count ?? 0} followers</Text>
        </View>

        <ProfilePostsPanel posts={posts} view="feed" />

        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.link}>
          <Text style={styles.linkText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          }}
          style={styles.link}
        >
          <Text style={styles.linkTextMuted}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  content: { paddingBottom: Spacing.xxl },
  center: { flex: 1, backgroundColor: Colors.matteBlack, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', paddingTop: Spacing.lg, paddingHorizontal: Spacing.lg },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.red,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  avatarText: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  name: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  handle: { color: Colors.textMuted, fontSize: 13 },
  bio: { color: Colors.textSecondary, fontSize: 13, marginTop: Spacing.sm, textAlign: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, paddingVertical: Spacing.lg },
  stat: { color: Colors.textMuted, fontSize: 13 },
  link: { alignItems: 'center', paddingVertical: Spacing.sm },
  linkText: { color: Colors.textPrimary, fontSize: 14 },
  linkTextMuted: { color: Colors.textMuted, fontSize: 14 },
});
