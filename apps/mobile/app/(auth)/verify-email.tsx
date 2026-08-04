import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../../src/constants/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to your email address. Click the link to activate your account.
        </Text>
        {USE_PLACEHOLDERS && (
          <Text style={styles.hint}>Demo mode — email verification is simulated</Text>
        )}
        <View style={styles.actions}>
          <Button title="Continue to App" onPress={() => router.replace('/(tabs)/feed')} />
          <View style={{ height: Spacing.sm }} />
          <Button title="Resend Email" onPress={() => {}} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  content: { flex: 1, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: 16, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 24 },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.md, textAlign: 'center' },
  actions: { width: '100%', marginTop: Spacing.xxl },
});
