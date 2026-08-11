import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Colors, Radius, Spacing } from '../../src/constants/theme';

const FEATURES = [
  { icon: '📹', label: 'Feed' },
  { icon: '🥗', label: 'Recipes' },
  { icon: '💬', label: 'Community' },
  { icon: '📊', label: 'Progress' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.overlay}>
          <View style={styles.brandBlock}>
            <View style={styles.monogram}>
              <Text style={styles.monogramText}>GT</Text>
            </View>
            <Text style={styles.title}>GymTok</Text>
            <Text style={styles.tagline}>Train. Share. Inspire.</Text>
          </View>

          <View style={styles.ctaBlock}>
            <Button title="Get Started" onPress={() => router.push('/(auth)/signup')} />
            <View style={styles.spacer} />
            <Button title="Log In" onPress={() => router.push('/(auth)/login')} variant="secondary" />
            <Button title="Sign Up" onPress={() => router.push('/(auth)/signup')} variant="text" />
          </View>

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  safe: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  brandBlock: { alignItems: 'center', marginTop: Spacing.xxl * 2 },
  monogram: {
    width: 72, height: 72, borderRadius: Radius.monogram,
    backgroundColor: Colors.red, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  monogramText: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  title: { color: Colors.textPrimary, fontSize: 36, fontWeight: '800' },
  tagline: { color: Colors.textSecondary, fontSize: 16, marginTop: Spacing.xs },
  ctaBlock: { paddingHorizontal: Spacing.sm },
  spacer: { height: Spacing.sm },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
  },
  featureItem: { alignItems: 'center', gap: Spacing.xs },
  featureIcon: { fontSize: 24 },
  featureLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' },
});
