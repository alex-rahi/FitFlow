import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { VideoCard, VideoPost } from './VideoCard';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  post: VideoPost | null;
  index: number;
  onClose: () => void;
  onLike: () => void;
  onComment: () => void;
}

export function PostDetailOverlay({ post, index, onClose, onLike, onComment }: Props) {
  return (
    <Modal visible={!!post} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {post && (
          <VideoCard post={post} index={index} onLike={onLike} onComment={onComment} />
        )}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  closeText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
});
