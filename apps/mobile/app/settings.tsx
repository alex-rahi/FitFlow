import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { useAuth } from '../src/context/AuthContext';
import { Colors, Radius, Spacing, USE_PLACEHOLDERS } from '../src/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, isPlaceholder } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {USE_PLACEHOLDERS && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Demo mode active</Text>
          </View>
        )}

        <SettingsSection title="Account">
          <SettingsRow label="Email" value={isPlaceholder ? 'demo@gymtok.app' : '••••••@••••.com'} />
          <SettingsRow label="Change Password" onPress={() => router.push('/(auth)/forgot-password')} />
        </SettingsSection>

        <SettingsSection title="Privacy">
          <ToggleRow label="Private Account" defaultValue={false} />
          <ToggleRow label="Allow Comments" defaultValue={true} />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <ToggleRow label="Likes" defaultValue={true} />
          <ToggleRow label="Comments" defaultValue={true} />
          <ToggleRow label="New Followers" defaultValue={true} />
        </SettingsSection>

        <SettingsSection title="Content">
          <SettingsRow label="Age Restriction" value="18+" />
          <SettingsRow label="Community Guidelines" onPress={() => {}} />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="Version" value="1.0.0 (MVP)" />
          <SettingsRow label="Terms of Service" onPress={() => {}} />
          <SettingsRow label="Privacy Policy" onPress={() => {}} />
        </SettingsSection>

        <View style={styles.actions}>
          <Button title="Log Out" onPress={handleSignOut} variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingsRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  const Wrapper = onPress ? require('react-native').TouchableOpacity : View;
  return (
    <Wrapper style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Text style={styles.chevron}>›</Text>}
    </Wrapper>
  );
}

function ToggleRow({ label, defaultValue }: { label: string; defaultValue: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={defaultValue}
        trackColor={{ false: Colors.borderSubtle, true: Colors.red }}
        thumbColor={Colors.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: Spacing.lg },
  demoBanner: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.red,
  },
  demoBannerText: { color: Colors.red, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm, textTransform: 'uppercase' },
  sectionContent: { backgroundColor: Colors.cardBg, borderRadius: Radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  rowLabel: { color: Colors.textPrimary, fontSize: 16 },
  rowValue: { color: Colors.textMuted, fontSize: 14 },
  chevron: { color: Colors.textMuted, fontSize: 20 },
  actions: { marginTop: Spacing.lg },
});
