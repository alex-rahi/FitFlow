import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
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

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

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
            <Text style={styles.avatarText}>
              {profile?.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>{profile?.display_name ?? 'User'}</Text>
          <Text style={styles.username}>@{profile?.username ?? 'username'}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>

        <View style={styles.stats}>
          <StatItem label="Posts" value={profile?.post_count ?? posts.length} />
          <StatItem label="Followers" value={profile?.follower_count ?? 0} />
          <StatItem label="Following" value={profile?.following_count ?? 0} />
        </View>

        <View style={styles.actions}>
          <Button title="Edit Profile" onPress={() => router.push('/edit-profile')} variant="secondary" />
          <View style={{ height: Spacing.sm }} />
          <Button title="Settings" onPress={() => router.push('/settings')} variant="secondary" />
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Your recipes</Text>
          <ProfilePostsPanel posts={posts} />
        </View>

        <View style={styles.logout}>
          <Button title="Log Out" onPress={handleSignOut} variant="text" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  content: { paddingBottom: Spacing.xxl },
  center: { flex: 1, backgroundColor: Colors.matteBlack, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.red,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  avatarText: { color: Colors.textPrimary, fontSize: 36, fontWeight: '800' },
  displayName: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  username: { color: Colors.textMuted, fontSize: 14, marginTop: 2 },
  bio: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.sm, textAlign: 'center' },
  stats: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.lg, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: Colors.borderSubtle, marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  actions: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  postsSection: { marginTop: Spacing.sm },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  logout: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
});
