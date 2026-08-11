import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, USE_PLACEHOLDERS, APP_NAME } from '../../src/constants/theme';
import { supabase } from '../../src/lib/supabase';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) return;
    setLoading(true);
    try {
      await signUp(email, password, username);
      if (USE_PLACEHOLDERS) {
        router.replace('/(tabs)/feed');
      } else {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace('/(tabs)/feed');
        } else {
          router.replace('/(auth)/verify-email');
        }
      }
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join the {APP_NAME} community</Text>
        </View>

        <View style={styles.form}>
          <Input label="Username" value={username} onChangeText={setUsername} placeholder="your_username" autoCapitalize="none" />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Min 6 characters" />
          {USE_PLACEHOLDERS && (
            <Text style={styles.hint}>Demo mode — any email/password works</Text>
          )}
          <Button title="Sign Up" onPress={handleSignup} loading={loading} />
        </View>

        <Button title="Already have an account? Log In" onPress={() => router.push('/(auth)/login')} variant="text" />
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
});
