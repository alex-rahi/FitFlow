import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { UploadViewPicker } from '../../src/components/UploadViewPicker';
import { ModerationPipeline } from '../../src/components/ModerationPipeline';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { uploadVideoFile } from '../../src/lib/uploadVideo';
import {
  FeedViewId,
  PostCategoryId,
  getFeedViewLabel,
  getUploadOptionForDestination,
} from '../../src/constants/categories';
import { Colors, Spacing, USE_PLACEHOLDERS } from '../../src/constants/theme';
import { analytics } from '../../src/lib/analytics';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function UploadScreen() {
  useScreenAnalytics('upload');
  const { session } = useAuth();
  const [caption, setCaption] = useState('');
  const [destination, setDestination] = useState<FeedViewId>('feed');
  const [category, setCategory] = useState<PostCategoryId>('prs');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [moderationStatus, setModerationStatus] = useState<{ status: string; decision?: string | null } | null>(null);

  const uploadOption = getUploadOptionForDestination(destination);
  const isPhotoUpload = uploadOption.mediaType === 'photo';

  const handleSelectDestination = (nextDestination: FeedViewId, nextCategory: PostCategoryId) => {
    setDestination(nextDestination);
    setCategory(nextCategory);
    setMediaUri(null);
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isPhotoUpload ? ['images'] : ['videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const captureMedia = async () => {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: isPhotoUpload ? ['images'] : ['videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!mediaUri) {
      notify('No media', isPhotoUpload ? 'Please select a recipe photo first.' : 'Please select or record a video first.');
      return;
    }
    if (!USE_PLACEHOLDERS && !session) {
      const message = 'You must log in with a real account before uploading.';
      setFeedback({ type: 'error', message });
      notify('Not signed in', message);
      return;
    }

    setUploading(true);
    setFeedback(null);
    setModerationStatus(null);
    setStatus('Creating post...');
    try {
      const post = await api.createPost(
        caption || undefined,
        category,
        uploadOption.mediaType,
        isPhotoUpload ? mediaUri : null,
      );

      if (!isPhotoUpload) {
        setStatus('Getting upload URL...');
        const { storage_path } = await api.getUploadUrl(post.id);

        setStatus('Uploading video...');
        await uploadVideoFile(storage_path, mediaUri);

        setStatus('Confirming upload...');
        await api.confirmUpload(post.id);
      }

      setStatus('Running YOLO content moderation...');
      setModerationStatus({ status: 'processing', decision: null });
      const moderated = await api.runYoloModeration(post.id);

      setModerationStatus({
        status: moderated.status ?? 'published',
        decision: moderated.moderation_decision ?? 'publish',
      });

      const destLabel = getFeedViewLabel(isPhotoUpload ? 'recipes' : destination);
      analytics.track('upload_complete', {
        post_id: post.id,
        category,
        feed_view: isPhotoUpload ? 'recipes' : destination,
        media_type: uploadOption.mediaType,
        moderation: 'yolo_auto_publish',
      });

      const successMessage = `Passed YOLO moderation — auto-published to ${destLabel}.`;
      setStatus('');
      setFeedback({ type: 'success', message: successMessage });
      notify('Published', successMessage);
      setCaption('');
      setMediaUri(null);
    } catch (err: any) {
      const message = err?.message ?? 'Upload failed';
      setStatus('');
      setFeedback({ type: 'error', message });
      notify('Upload Failed', message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Upload</Text>
      <Text style={styles.subtitle}>
        Feed videos, recipe photos, or community threads
      </Text>

      <View style={styles.preview}>
        {mediaUri && isPhotoUpload ? (
          <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
        ) : mediaUri ? (
          <Text style={styles.previewText}>Video selected ✓</Text>
        ) : (
          <Text style={styles.previewPlaceholder}>
            {isPhotoUpload ? 'No photo selected' : 'No video selected'}
          </Text>
        )}
      </View>

      <Input
        label="Caption"
        placeholder={uploadOption.captionPlaceholder}
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      <UploadViewPicker
        selectedDestination={destination}
        selectedCategory={category}
        onSelect={handleSelectDestination}
      />

      {!USE_PLACEHOLDERS && !session && (
        <Text style={styles.warning}>
          Log in with your Supabase account to upload.
        </Text>
      )}

      <View style={styles.actions}>
        <Button
          title={isPhotoUpload ? 'Choose Photo' : 'Choose from Library'}
          onPress={pickMedia}
          variant="secondary"
          disabled={uploading}
        />
        <View style={{ height: Spacing.sm }} />
        <Button
          title={isPhotoUpload ? 'Take Photo' : 'Record Video'}
          onPress={captureMedia}
          variant="secondary"
          disabled={uploading}
        />
        <View style={{ height: Spacing.sm }} />
        <Button title="Upload" onPress={handleUpload} loading={uploading} disabled={!mediaUri} />
      </View>

      {status ? (
        <View style={styles.statusBar}>
          <ActivityIndicator color={Colors.red} size="small" />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {feedback ? (
        <View style={[styles.feedback, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
          <Text style={styles.feedbackText}>{feedback.message}</Text>
          {feedback.type === 'success' && moderationStatus && (
            <ModerationPipeline
              status={moderationStatus.status}
              moderationDecision={moderationStatus.decision}
              compact
            />
          )}
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
    height: 200,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  previewText: { color: Colors.success, fontSize: 16, fontWeight: '600' },
  previewPlaceholder: { color: Colors.textMuted, fontSize: 14 },
  actions: { marginTop: Spacing.md },
  warning: { color: Colors.red, fontSize: 13, lineHeight: 18, marginBottom: Spacing.sm },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  statusText: { color: Colors.textSecondary, fontSize: 14 },
  feedback: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: 12, borderWidth: 1 },
  feedbackSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.35)' },
  feedbackError: { backgroundColor: 'rgba(230, 57, 70, 0.12)', borderColor: 'rgba(230, 57, 70, 0.35)' },
  feedbackText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
});
