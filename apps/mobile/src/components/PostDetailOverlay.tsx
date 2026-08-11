import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { VideoCard, VideoPost, FEED_ITEM_HEIGHT } from './VideoCard';
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
    <Modal visible={!!post} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {post && (
            <VideoCard
              post={post}
              index={index}
              height={FEED_ITEM_HEIGHT}
              onLike={onLike}
              onComment={onComment}
            />
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingTop: 52,
    paddingBottom: 84,
  },
  sheet: {
    height: FEED_ITEM_HEIGHT,
    backgroundColor: Colors.matteBlack,
    overflow: 'hidden',
  },
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
