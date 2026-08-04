import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            {sent
              ? 'Check your email for a reset link'
              : 'Enter your email and we\'ll send you a reset link'}
          </Text>
        </View>

        {!sent ? (
          <View style={styles.form}>
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" />
            {USE_PLACEHOLDERS && (
              <Text style={styles.hint}>Demo mode — simulates sending reset email</Text>
            )}
            <Button title="Send Reset Link" onPress={handleReset} loading={loading} />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successText}>Reset link sent to {email}</Text>
            <Button title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
          </View>
        )}

        <Button title="Back" onPress={() => router.back()} variant="text" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  inner: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  header: { marginBottom: Spacing.xl },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 16, marginTop: Spacing.xs },
  form: { marginBottom: Spacing.lg },
  hint: { color: Colors.textMuted, fontSize: 12, marginBottom: Spacing.md, textAlign: 'center' },
  successIcon: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.md },
  successText: { color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
});
