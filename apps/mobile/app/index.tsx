import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { APP_MONOGRAM, APP_NAME, APP_TAGLINE, Colors, Spacing, isDemoMode } from '../src/constants/theme';

export default function SplashScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (session) {
        router.replace('/(tabs)/feed');
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.monogram}>
          <Text style={styles.monogramText}>{APP_MONOGRAM}</Text>
        </View>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        {isDemoMode() && (
          <Text style={styles.demoHint}>Demo mode — log in with any email</Text>
        )}
        <ActivityIndicator color={Colors.red} style={styles.loader} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  overlay: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  monogramText: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  title: { color: Colors.textPrimary, fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: Colors.textSecondary, fontSize: 16, marginTop: Spacing.xs },
  demoHint: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.md },
  loader: { marginTop: Spacing.xxl },
});
