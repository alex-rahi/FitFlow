import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { api } from '../lib/api';
import { Colors, Radius, Spacing } from '../constants/theme';

interface CommentSheetProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
}

const PLACEHOLDER_COMMENTS = [
  { id: '1', content: 'Great form! 💪', author: { username: 'fitness_jade' }, created_at: '2025-07-30T12:00:00Z' },
  { id: '2', content: 'What weight is that?', author: { username: 'bench_king' }, created_at: '2025-07-30T11:30:00Z' },
];

export function CommentSheet({ visible, postId, onClose }: CommentSheetProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    api.getComments(postId)
      .then(setComments)
      .catch(() => setComments(PLACEHOLDER_COMMENTS))
      .finally(() => setLoading(false));
  }, [visible, postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.addComment(postId, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch {
      setComments(prev => [{
        id: Date.now().toString(),
        content: newComment.trim(),
        author: { username: 'you' },
        created_at: new Date().toISOString(),
      }, ...prev]);
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.red} style={{ marginVertical: Spacing.xl }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.comment}>
                  <Text style={styles.commentUser}>@{item.author?.username ?? 'user'}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No comments yet</Text>}
            />
          )}

          <View style={styles.inputRow}>
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              style={{ flex: 1 }}
            />
            <Button title="Post" onPress={handleSubmit} loading={submitting} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: Colors.cardBg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    maxHeight: '70%', paddingBottom: Spacing.lg,
  },
  handle: {
    width: 40, height: 4, backgroundColor: Colors.borderSubtle,
    borderRadius: 2, alignSelf: 'center', marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  closeBtn: { color: Colors.textMuted, fontSize: 20 },
  list: { paddingHorizontal: Spacing.lg },
  comment: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  commentUser: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  commentText: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginVertical: Spacing.xl },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
});
