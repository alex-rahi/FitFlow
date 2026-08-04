import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { Colors, Radius, Spacing } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        <StatItem label="Posts" value={profile?.post_count ?? 0} />
        <StatItem label="Followers" value={profile?.follower_count ?? 0} />
        <StatItem label="Following" value={profile?.following_count ?? 0} />
      </View>

      <View style={styles.actions}>
        <Button title="Edit Profile" onPress={() => router.push('/edit-profile')} variant="secondary" />
        <View style={{ height: Spacing.sm }} />
        <Button title="Settings" onPress={() => router.push('/settings')} variant="secondary" />
        <View style={{ height: Spacing.sm }} />
        <Button title="Log Out" onPress={handleSignOut} variant="text" />
      </View>
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
  container: { flex: 1, backgroundColor: Colors.matteBlack, padding: Spacing.lg },
  center: { flex: 1, backgroundColor: Colors.matteBlack, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
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
    borderColor: Colors.borderSubtle, marginBottom: Spacing.xl,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  actions: { paddingHorizontal: Spacing.sm },
});
