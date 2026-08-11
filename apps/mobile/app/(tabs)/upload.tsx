import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ModerationPipeline } from '../../src/components/ModerationPipeline';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import {
  getCategoryLabel,
  getUploadDestinationForCategory,
  MediaType,
  PostCategoryId,
} from '../../src/constants/categories';
import { Colors, Radius, Spacing, isDemoMode } from '../../src/constants/theme';
import { analytics } from '../../src/lib/analytics';
import { uploadVideoFile } from '../../src/lib/uploadVideo';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

const UPLOAD_CATEGORIES: PostCategoryId[] = ['workouts', 'nutrition', 'prs', 'advice'];
const MEDIA_TYPES: { id: MediaType; label: string }[] = [
  { id: 'video', label: 'Video' },
  { id: 'photo', label: 'Photo' },
  { id: 'text', label: 'Thread' },
];

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
  const [category, setCategory] = useState<PostCategoryId>('workouts');
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [moderationStatus, setModerationStatus] = useState<{ status: string; decision?: string | null } | null>(null);

  const destination = getUploadDestinationForCategory(category, mediaType);
  const isText = mediaType === 'text';

  const pickMedia = async (fromCamera: boolean) => {
    if (isText) return;
    if (fromCamera) {
      const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required.');
        return;
      }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: mediaType === 'video' ? ['videos'] : ['images'],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: mediaType === 'video' ? ['videos'] : ['images'],
          quality: 0.8,
        });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!isText && !mediaUri) {
      notify('No media', `Please select a ${mediaType} first.`);
      return;
    }
    if (isText && !caption.trim()) {
      notify('Empty thread', 'Write something for the community thread.');
      return;
    }
    if (!isDemoMode() && !session) {
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
        isText ? 'text' : mediaType,
        mediaType === 'photo' ? mediaUri : null,
      );

      if (mediaType === 'video' && mediaUri && !isDemoMode()) {
        setStatus('Uploading video...');
        const { upload_url, storage_path } = await api.getUploadUrl(post.id);
        await uploadVideoFile(storage_path, mediaUri);
        await api.confirmUpload(post.id);
      }

      setStatus('Running content moderation...');
      setModerationStatus({ status: 'processing', decision: null });
      const moderated = await api.runYoloModeration(post.id);

      setModerationStatus({
        status: moderated.status ?? 'published',
        decision: moderated.moderation_decision ?? 'publish',
      });

      analytics.track('upload_complete', {
        post_id: post.id,
        category,
        feed_view: destination,
        media_type: mediaType,
        moderation: 'yolo_auto_publish',
      });

      const destLabel = destination === 'feed' ? 'video feed' : destination === 'photos' ? 'photo grid' : 'community';
      const successMessage = `Passed moderation — added to ${destLabel}.`;
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Upload</Text>
        <Text style={styles.subtitle}>Share videos, photos, or community threads</Text>

        <View style={styles.typePicker}>
          <Text style={styles.categoryLabel}>Content type</Text>
          <View style={styles.categoryRow}>
            {MEDIA_TYPES.map((type) => {
              const active = mediaType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => {
                    setMediaType(type.id);
                    setMediaUri(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {!isText && (
          <View style={styles.previewWrap}>
            <View style={[styles.preview, mediaType === 'video' && styles.previewVideo]}>
              {mediaUri ? (
                mediaType === 'photo' ? (
                  <Image source={{ uri: mediaUri }} style={styles.previewMedia} resizeMode="cover" />
                ) : (
                  <Text style={styles.previewIcon}>🎬</Text>
                )
              ) : (
                <Text style={styles.previewIcon}>{mediaType === 'video' ? '🎬' : '📷'}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.categoryPicker}>
          <Text style={styles.categoryLabel}>Category</Text>
          <View style={styles.categoryRowWrap}>
            {UPLOAD_CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChipSm, active && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {getCategoryLabel(cat)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input
          label={isText ? 'Thread' : 'Caption'}
          placeholder={isText ? 'Ask the community...' : 'Describe your workout, PR, or progress...'}
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        {!isDemoMode() && !session && (
          <Text style={styles.warning}>Log in with your Supabase account to upload.</Text>
        )}

        {!isText && (
          <View style={styles.actions}>
            <Button title={`Choose ${mediaType === 'video' ? 'Video' : 'Photo'}`} onPress={() => pickMedia(false)} variant="secondary" disabled={uploading} />
            <View style={{ height: Spacing.sm }} />
            <Button title={`Record ${mediaType === 'video' ? 'Video' : 'Photo'}`} onPress={() => pickMedia(true)} variant="secondary" disabled={uploading} />
          </View>
        )}

        <View style={[styles.actions, !isText && { marginTop: Spacing.sm }]}>
          <Button title="Publish" onPress={handleUpload} loading={uploading} disabled={!isText && !mediaUri} />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  typePicker: { marginBottom: Spacing.md },
  previewWrap: { alignItems: 'center', marginBottom: Spacing.lg },
  preview: {
    width: PREVIEW_WIDTH * 0.55,
    aspectRatio: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewVideo: { aspectRatio: 9 / 16, width: PREVIEW_WIDTH * 0.45 },
  previewMedia: { width: '100%', height: '100%' },
  previewIcon: { fontSize: 36 },
  categoryPicker: { marginBottom: Spacing.md },
  categoryLabel: { color: Colors.textSecondary, fontSize: 14, marginBottom: Spacing.sm, fontWeight: '500' },
  categoryRow: { flexDirection: 'row', gap: Spacing.sm },
  categoryRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
  },
  categoryChipSm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.cardBg,
  },
  categoryChipActive: {
    borderColor: Colors.red,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
  },
  categoryChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: Colors.red },
  actions: { marginTop: Spacing.md },
  warning: { color: Colors.red, fontSize: 13, lineHeight: 18, marginBottom: Spacing.sm },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  statusText: { color: Colors.textSecondary, fontSize: 14 },
  feedback: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: 12, borderWidth: 1 },
  feedbackSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.35)' },
  feedbackError: { backgroundColor: 'rgba(230, 57, 70, 0.12)', borderColor: 'rgba(230, 57, 70, 0.35)' },
  feedbackText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
});
