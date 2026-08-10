import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { api } from '../lib/api';
import { ThreadComment } from '../constants/threadComments';
import { Colors, Radius, Spacing } from '../constants/theme';

interface CommentSheetProps {
  visible: boolean;
  postId: string;
  parentId?: string | null;
  replyToUsername?: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

function CommentRow({ item, depth = 0 }: { item: ThreadComment; depth?: number }) {
  return (
    <View style={[styles.comment, depth > 0 && { marginLeft: depth * 16 }]}>
      <Text style={styles.commentUser}>@{item.author?.username ?? 'user'}</Text>
      <Text style={styles.commentText}>{item.content}</Text>
    </View>
  );
}

export function CommentSheet({
  visible,
  postId,
  parentId,
  replyToUsername,
  onClose,
  onCommentAdded,
}: CommentSheetProps) {
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    api.getComments(postId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [visible, postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.addComment(postId, newComment.trim(), parentId);
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      onCommentAdded?.();
    } catch {
      const fallback: ThreadComment = {
        id: Date.now().toString(),
        post_id: postId,
        parent_id: parentId ?? null,
        content: newComment.trim(),
        like_count: 0,
        created_at: new Date().toISOString(),
        author: { username: 'you' },
      };
      setComments((prev) => [...prev, fallback]);
      setNewComment('');
      onCommentAdded?.();
    } finally {
      setSubmitting(false);
    }
  };

  const title = parentId && replyToUsername ? `Reply to @${replyToUsername}` : 'Thread replies';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
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
                <CommentRow item={item} depth={item.parent_id ? 1 : 0} />
              )}
              ListEmptyComponent={<Text style={styles.empty}>No replies yet — start the conversation</Text>}
            />
          )}

          <View style={styles.inputRow}>
            <Input
              placeholder={parentId ? 'Write a reply...' : 'Join the thread...'}
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
