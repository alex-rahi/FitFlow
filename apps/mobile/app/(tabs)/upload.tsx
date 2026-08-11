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
import { PostCategoryId, RECIPE_SUBCATEGORIES } from '../../src/constants/categories';
import { Colors, Radius, Spacing, isDemoMode } from '../../src/constants/theme';
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

export default function UploadScreen() {
  useScreenAnalytics('upload');
  const { session } = useAuth();
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<PostCategoryId>('meal_prep');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [moderationStatus, setModerationStatus] = useState<{ status: string; decision?: string | null } | null>(null);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const capturePhoto = async () => {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!mediaUri) {
      notify('No photo', 'Please select a recipe photo first.');
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
      const post = await api.createPost(caption || undefined, category, 'photo', mediaUri);

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
        feed_view: 'recipes',
        media_type: 'photo',
        moderation: 'yolo_auto_publish',
      });

      const successMessage = 'Passed moderation — added to the recipe grid.';
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
        <Text style={styles.subtitle}>Share a recipe photo to the grid</Text>

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

        <View style={styles.categoryPicker}>
          <Text style={styles.categoryLabel}>Recipe type</Text>
          <View style={styles.categoryRow}>
            {RECIPE_SUBCATEGORIES.map((cat) => {
              const active = category === cat;
              const label = cat === 'meal_prep' ? 'Meal Prep' : 'Nutrition';
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input
          label="Caption"
          placeholder="Describe your dish, ingredients, or macros..."
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        {!isDemoMode() && !session && (
          <Text style={styles.warning}>Log in with your Supabase account to upload.</Text>
        )}

        <View style={styles.actions}>
          <Button title="Choose Photo" onPress={pickPhoto} variant="secondary" disabled={uploading} />
          <View style={{ height: Spacing.sm }} />
          <Button title="Take Photo" onPress={capturePhoto} variant="secondary" disabled={uploading} />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs, marginBottom: Spacing.lg },
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
  categoryPicker: { marginBottom: Spacing.md },
  categoryLabel: { color: Colors.textSecondary, fontSize: 14, marginBottom: Spacing.sm, fontWeight: '500' },
  categoryRow: { flexDirection: 'row', gap: Spacing.sm },
  categoryChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
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
