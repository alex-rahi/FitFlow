import { useState, createElement } from 'react';
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
} from 'react-native';
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
import { Colors, Radius, Spacing, USE_PLACEHOLDERS } from '../../src/constants/theme';
import { analytics } from '../../src/lib/analytics';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2;

function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function FeedVideoPreview({ uri }: { uri: string }) {
  if (Platform.OS === 'web') {
    return createElement('video', {
      src: uri,
      muted: true,
      playsInline: true,
      loop: true,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        backgroundColor: '#000',
      },
    });
  }
  return (
    <View style={styles.videoSelected}>
      <Text style={styles.videoSelectedIcon}>▶</Text>
      <Text style={styles.previewText}>Video selected</Text>
    </View>
  );
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
  const isFeedUpload = destination === 'feed';
  const isRecipeUpload = destination === 'recipes';
  const isThreadUpload = destination === 'community';

  const handleSelectDestination = (nextDestination: FeedViewId, nextCategory: PostCategoryId) => {
    setDestination(nextDestination);
    setCategory(nextCategory);
    setMediaUri(null);
    setFeedback(null);
    setModerationStatus(null);
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isRecipeUpload ? ['images'] : ['videos'],
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
      mediaTypes: isRecipeUpload ? ['images'] : ['videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const canSubmit = isThreadUpload ? caption.trim().length > 0 : !!mediaUri;

  const handleUpload = async () => {
    if (isThreadUpload && !caption.trim()) {
      notify('Empty thread', 'Write something to start your community thread.');
      return;
    }
    if (!isThreadUpload && !mediaUri) {
      notify('No media', isRecipeUpload ? 'Please select a recipe photo first.' : 'Please select or record a video first.');
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
        isRecipeUpload ? mediaUri : null,
      );

      if (isFeedUpload && mediaUri) {
        setStatus('Getting upload URL...');
        const { storage_path } = await api.getUploadUrl(post.id);

        setStatus('Uploading video...');
        await uploadVideoFile(storage_path, mediaUri);

        setStatus('Confirming upload...');
        await api.confirmUpload(post.id);
      }

      setStatus(isThreadUpload ? 'Running caption moderation...' : 'Running YOLO content moderation...');
      setModerationStatus({ status: 'processing', decision: null });
      const moderated = await api.runYoloModeration(post.id);

      setModerationStatus({
        status: moderated.status ?? 'published',
        decision: moderated.moderation_decision ?? 'publish',
      });

      const destLabel = getFeedViewLabel(destination);
      analytics.track('upload_complete', {
        post_id: post.id,
        category,
        feed_view: destination,
        media_type: uploadOption.mediaType,
        moderation: 'yolo_auto_publish',
      });

      const successMessage = isThreadUpload
        ? `Thread passed moderation — auto-published to ${destLabel}.`
        : `Passed YOLO moderation — auto-published to ${destLabel}.`;
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
        <Text style={styles.subtitle}>Feed videos, recipe photos, or community threads</Text>

        <UploadViewPicker
          selectedDestination={destination}
          selectedCategory={category}
          onSelect={handleSelectDestination}
        />

        {isFeedUpload && (
          <View style={styles.feedPreview}>
            {mediaUri ? (
              <FeedVideoPreview uri={mediaUri} />
            ) : (
              <View style={styles.feedPlaceholder}>
                <Text style={styles.feedPlaceholderIcon}>▶</Text>
                <Text style={styles.previewPlaceholder}>Full-screen feed video preview</Text>
              </View>
            )}
          </View>
        )}

        {isRecipeUpload && (
          <View style={styles.gridPreviewWrap}>
            <View style={styles.gridCard}>
              <View style={styles.gridThumb}>
                {mediaUri ? (
                  <Image source={{ uri: mediaUri }} style={styles.gridPhoto} resizeMode="cover" />
                ) : (
                  <Text style={styles.gridPhotoIcon}>📷</Text>
                )}
              </View>
              <View style={styles.gridMeta}>
                <Text style={styles.gridCaption} numberOfLines={2}>
                  {caption || 'Recipe caption preview'}
                </Text>
                <Text style={styles.gridAuthor}>@you</Text>
              </View>
            </View>
          </View>
        )}

        {isThreadUpload && (
          <View style={styles.threadComposer}>
            <View style={styles.threadAvatar}>
              <Text style={styles.threadAvatarText}>Y</Text>
            </View>
            <View style={styles.threadBody}>
              <Text style={styles.threadUser}>@you</Text>
              <Text style={[styles.threadPreview, !caption && styles.threadPreviewEmpty]}>
                {caption || 'Write your thread below…'}
              </Text>
            </View>
          </View>
        )}

        <Input
          label={isThreadUpload ? 'Thread' : 'Caption'}
          placeholder={uploadOption.captionPlaceholder}
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        {!USE_PLACEHOLDERS && !session && (
          <Text style={styles.warning}>Log in with your Supabase account to upload.</Text>
        )}

        {!isThreadUpload && (
          <View style={styles.actions}>
            <Button
              title={isRecipeUpload ? 'Choose Photo' : 'Choose from Library'}
              onPress={pickMedia}
              variant="secondary"
              disabled={uploading}
            />
            <View style={{ height: Spacing.sm }} />
            <Button
              title={isRecipeUpload ? 'Take Photo' : 'Record Video'}
              onPress={captureMedia}
              variant="secondary"
              disabled={uploading}
            />
          </View>
        )}

        <View style={[styles.actions, !isThreadUpload && { marginTop: Spacing.sm }]}>
          <Button
            title={isThreadUpload ? 'Post thread' : 'Upload'}
            onPress={handleUpload}
            loading={uploading}
            disabled={!canSubmit}
          />
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
  feedPreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 420,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  feedPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  feedPlaceholderIcon: { fontSize: 48, color: Colors.textMuted, marginBottom: Spacing.sm },
  videoSelected: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoSelectedIcon: { fontSize: 48, color: Colors.textMuted, marginBottom: Spacing.sm },
  previewText: { color: Colors.success, fontSize: 16, fontWeight: '600' },
  previewPlaceholder: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: Spacing.lg },
  gridPreviewWrap: { alignItems: 'center', marginBottom: Spacing.lg },
  gridCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  gridThumb: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a3a2e',
    overflow: 'hidden',
  },
  gridPhoto: { width: '100%', height: '100%' },
  gridPhotoIcon: { fontSize: 32 },
  gridMeta: { padding: Spacing.sm },
  gridCaption: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  gridAuthor: { color: Colors.textMuted, fontSize: 11, marginTop: Spacing.xs },
  threadComposer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  threadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  threadAvatarText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  threadBody: { flex: 1 },
  threadUser: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  threadPreview: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 6 },
  threadPreviewEmpty: { color: Colors.textMuted, fontStyle: 'italic' },
  actions: { marginTop: Spacing.md },
  warning: { color: Colors.red, fontSize: 13, lineHeight: 18, marginBottom: Spacing.sm },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  statusText: { color: Colors.textSecondary, fontSize: 14 },
  feedback: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: 12, borderWidth: 1 },
  feedbackSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.35)' },
  feedbackError: { backgroundColor: 'rgba(230, 57, 70, 0.12)', borderColor: 'rgba(230, 57, 70, 0.35)' },
  feedbackText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
});
