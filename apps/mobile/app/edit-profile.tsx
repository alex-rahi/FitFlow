import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { api } from '../src/lib/api';
import { Colors, Spacing } from '../src/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProfile().then((p) => {
      setDisplayName(p.display_name ?? '');
      setBio(p.bio ?? '');
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateProfile({ display_name: displayName, bio });
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Profile</Text>

        <Input label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
        <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell us about your fitness journey..." multiline />

        <View style={styles.actions}>
          <Button title="Save Changes" onPress={handleSave} loading={loading} />
          <View style={{ height: Spacing.sm }} />
          <Button title="Cancel" onPress={() => router.back()} variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  content: { padding: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: Spacing.xl },
  actions: { marginTop: Spacing.lg },
});
