import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import {
  getCategoryLabel,
  getUploadDestinationForCategory,
  MediaType,
  PHOTO_CATEGORIES,
  PHOTO_UPLOAD_DISCLAIMER,
  PostCategoryId,
} from '../../src/constants/categories';
import { Colors, Radius, Spacing, isDemoMode, isLocalYoloMode } from '../../src/constants/theme';
import { analytics } from '../../src/lib/analytics';
import { uploadVideoFile } from '../../src/lib/uploadVideo';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';

const UPLOAD_CATEGORIES: PostCategoryId[] = ['workouts', 'equipment', 'nutrition', 'prs', 'advice'];
const MEDIA_TYPES: { id: MediaType; label: string }[] = [
  { id: 'video', label: 'Video' },
  { id: 'photo', label: 'Photo' },
  { id: 'text', label: 'Thread' },
];

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export default function UploadScreen() {
  useScreenAnalytics('upload');
  const { session } = useAuth();
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<PostCategoryId>('workouts');
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [photoDisclaimerAccepted, setPhotoDisclaimerAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const isText = mediaType === 'text';
  const isPhoto = mediaType === 'photo';

  const selectMediaType = (type: MediaType) => {
    setMediaType(type);
    setMediaUri(null);
    setPhotoDisclaimerAccepted(false);
    if (type === 'photo' && category === 'advice') {
      setCategory(PHOTO_CATEGORIES[0]);
    }
  };

  const pickMedia = async () => {
    if (isText) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'video' ? ['videos'] : ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setMediaUri(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!isText && !mediaUri) {
      notify('Missing media', `Select a ${mediaType} first.`);
      return;
    }
    if (isText && !caption.trim()) {
      notify('Empty', 'Write something first.');
      return;
    }
    if (isPhoto && !photoDisclaimerAccepted) {
      notify('Disclaimer required', 'Accept the photo guidelines before publishing.');
      return;
    }
    if (!isDemoMode() && !isLocalYoloMode() && !session) {
      setError('Log in to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setStatus('Publishing...');
    try {
      const destination = getUploadDestinationForCategory(category, mediaType);
      const post = await api.createPost(
        caption || undefined,
        category,
        isText ? 'text' : mediaType,
        mediaType === 'photo' ? mediaUri : null,
      );

      if (!isText && mediaUri) {
        if (isLocalYoloMode()) {
          setStatus('Uploading media...');
          await api.uploadMediaFile(post.id, mediaUri, mediaType as 'video' | 'photo');
        } else if (!isDemoMode() && mediaType === 'video') {
          setStatus('Uploading video...');
          const { storage_path } = await api.getUploadUrl(post.id);
          await uploadVideoFile(storage_path, mediaUri);
          await api.confirmUpload(post.id);
        }
      }

      setStatus('Moderating...');
      await api.runYoloModeration(post.id);

      analytics.track('upload_complete', {
        post_id: post.id,
        category,
        feed_view: destination,
        media_type: mediaType,
      });

      notify('Published', 'Live in feed.');
      setCaption('');
      setMediaUri(null);
      setPhotoDisclaimerAccepted(false);
      setStatus('');
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.typeRow}>
          {MEDIA_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, mediaType === t.id && styles.chipActive]}
              onPress={() => selectMediaType(t.id)}
            >
              <Text style={[styles.chipText, mediaType === t.id && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isPhoto ? (
          <View style={styles.photoForm}>
            <Text style={styles.formTitle}>Progress photo</Text>
            <Text style={styles.formHint}>Choose a category for the Photos grid.</Text>
            <View style={styles.catRow}>
              {PHOTO_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chipSm, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {getCategoryLabel(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerTitle}>{PHOTO_UPLOAD_DISCLAIMER.title}</Text>
              <Text style={styles.disclaimerBody}>{PHOTO_UPLOAD_DISCLAIMER.body}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setPhotoDisclaimerAccepted((v) => !v)}
              disabled={uploading}
            >
              <View style={[styles.checkbox, photoDisclaimerAccepted && styles.checkboxChecked]}>
                {photoDisclaimerAccepted ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxLabel}>{PHOTO_UPLOAD_DISCLAIMER.checkbox}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.catRow}>
            {UPLOAD_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chipSm, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {getCategoryLabel(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Input
          placeholder={isText ? 'Ask the community...' : isPhoto ? 'Caption (optional)' : 'Caption'}
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        {!isText && (
          <Button title={mediaUri ? 'Change media' : 'Choose media'} onPress={pickMedia} variant="secondary" disabled={uploading} />
        )}

        <View style={styles.publish}>
          <Button title="Publish" onPress={handleUpload} loading={uploading} />
        </View>

        {status ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={Colors.red} size="small" />
            <Text style={styles.status}>{status}</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  chipSm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  chipActive: { borderColor: Colors.red, backgroundColor: 'rgba(230,57,70,0.1)' },
  chipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.red },
  photoForm: { gap: Spacing.sm },
  formTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  formHint: { color: Colors.textMuted, fontSize: 12, marginBottom: Spacing.xs },
  disclaimerBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  disclaimerTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  disclaimerBody: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.xs },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { borderColor: Colors.red, backgroundColor: 'rgba(230,57,70,0.15)' },
  checkmark: { color: Colors.red, fontSize: 13, fontWeight: '700' },
  checkboxLabel: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  publish: { marginTop: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  status: { color: Colors.textMuted, fontSize: 13 },
  error: { color: Colors.red, fontSize: 13 },
});
