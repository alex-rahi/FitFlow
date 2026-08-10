import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { CategoryPicker } from '../../src/components/CategoryPicker';
import { api } from '../../src/lib/api';
import { UploadCategoryId } from '../../src/constants/categories';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../../src/constants/theme';

export default function UploadScreen() {
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<UploadCategoryId>('meal_prep');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const recordVideo = async () => {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to record videos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!videoUri) {
      Alert.alert('No video', 'Please select or record a video first.');
      return;
    }
    setUploading(true);
    setStatus('Creating post...');
    try {
      const post = await api.createPost(caption || undefined, category);
      setStatus('Getting upload URL...');
      const { upload_url } = await api.getUploadUrl(post.id);

      setStatus('Uploading video...');
      const response = await fetch(videoUri);
      const blob = await response.blob();
      await fetch(upload_url, { method: 'PUT', body: blob, headers: { 'Content-Type': 'video/mp4' } });

      setStatus('Confirming upload...');
      await api.confirmUpload(post.id);
      setStatus('Processing — AI pipeline started (placeholder)');
      Alert.alert('Success', USE_PLACEHOLDERS
        ? 'Demo upload complete. In production, your video would enter the AI moderation pipeline.'
        : 'Your video is being processed. It will appear in your feed once approved.');
      setCaption('');
      setVideoUri(null);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
      setStatus('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Upload Workout</Text>
      <Text style={styles.subtitle}>Share your training with the community</Text>

      <View style={styles.preview}>
        {videoUri ? (
          <Text style={styles.previewText}>Video selected ✓</Text>
        ) : (
          <Text style={styles.previewPlaceholder}>No video selected</Text>
        )}
      </View>

      <Input
        label="Caption"
        placeholder="Describe your workout..."
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      <CategoryPicker selected={category} onSelect={setCategory} />

      <View style={styles.actions}>
        <Button title="Choose from Library" onPress={pickVideo} variant="secondary" disabled={uploading} />
        <View style={{ height: Spacing.sm }} />
        <Button title="Record Video" onPress={recordVideo} variant="secondary" disabled={uploading} />
        <View style={{ height: Spacing.sm }} />
        <Button title="Upload" onPress={handleUpload} loading={uploading} disabled={!videoUri} />
      </View>

      {status ? (
        <View style={styles.statusBar}>
          <ActivityIndicator color={Colors.red} size="small" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack, padding: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  preview: {
    height: 200, backgroundColor: Colors.cardBg, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.borderSubtle, borderStyle: 'dashed',
  },
  previewText: { color: Colors.success, fontSize: 16, fontWeight: '600' },
  previewPlaceholder: { color: Colors.textMuted, fontSize: 14 },
  actions: { marginTop: Spacing.md },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  statusText: { color: Colors.textSecondary, fontSize: 14 },
});
