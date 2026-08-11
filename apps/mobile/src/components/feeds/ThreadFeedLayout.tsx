import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { VideoPost } from '../VideoCard';
import { ThreadComment } from '../../constants/threadComments';
import { api } from '../../lib/api';
import { Colors, Radius, Spacing } from '../../constants/theme';

interface Props {
  posts: VideoPost[];
  refreshKey?: number;
  onLike: (postId: string) => void;
  onComment: (postId: string, parentId?: string, username?: string) => void;
  onOpen: (post: VideoPost, index: number) => void;
  onReplyCountChange?: (postId: string, count: number) => void;
}

function timeAgo(iso?: string) {
  if (!iso) return 'recently';
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  return `${Math.max(1, hours)}h`;
}

function initials(name?: string) {
  return (name ?? '?').slice(0, 1).toUpperCase();
}

function ThreadReplyRow({
  reply,
  nested,
  onReply,
}: {
  reply: ThreadComment;
  nested?: boolean;
  onReply: () => void;
}) {
  return (
    <View style={[styles.replyRow, nested && styles.replyRowNested]}>
      {!nested && <View style={styles.threadLine} />}
      <View style={styles.replyContent}>
        <View style={styles.replyHeader}>
          <View style={[styles.avatar, styles.avatarSm]}>
            <Text style={styles.avatarTextSm}>{initials(reply.author?.display_name ?? reply.author?.username)}</Text>
          </View>
          <Text style={styles.replyUser}>@{reply.author?.username ?? 'user'}</Text>
          <Text style={styles.replyTime}>· {timeAgo(reply.created_at)}</Text>
        </View>
        <Text style={styles.replyBody}>{reply.content}</Text>
        <View style={styles.replyFooter}>
          <Text style={styles.replyLikes}>♥ {reply.like_count}</Text>
          <TouchableOpacity onPress={onReply} hitSlop={8}>
            <Text style={styles.replyLink}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ThreadCard({
  post,
  index,
  comments,
  loadingComments,
  onLike,
  onComment,
  onOpen,
}: {
  post: VideoPost;
  index: number;
  comments: ThreadComment[];
  loadingComments: boolean;
  onLike: (postId: string) => void;
  onComment: (postId: string, parentId?: string, username?: string) => void;
  onOpen: (post: VideoPost, index: number) => void;
}) {
  const topLevel = comments.filter((c) => !c.parent_id);
  const replyCount = comments.length;

  return (
    <View style={styles.thread}>
      <View style={styles.opRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(post.author?.display_name ?? post.author?.username)}</Text>
        </View>
        <View style={styles.opBody}>
          <View style={styles.opHeader}>
            <Text style={styles.opUser}>@{post.author?.username ?? 'user'}</Text>
            <Text style={styles.opTime}>· {timeAgo(post.created_at)}</Text>
          </View>
          <Text style={styles.opText}>{post.caption ?? 'Started a thread'}</Text>

          <TouchableOpacity style={styles.clipStrip} onPress={() => onOpen(post, index)} activeOpacity={0.85}>
            <Text style={styles.clipIcon}>▶</Text>
            <Text style={styles.clipLabel}>Watch attached clip</Text>
          </TouchableOpacity>

          <View style={styles.opActions}>
            <TouchableOpacity onPress={() => onLike(post.id)} style={styles.actionBtn}>
              <Text style={styles.actionText}>♥ {post.like_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onComment(post.id)} style={styles.actionBtn}>
              <Text style={styles.actionText}>💬 {replyCount} replies</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onComment(post.id)} style={styles.actionBtn}>
              <Text style={styles.replyLink}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loadingComments ? (
        <ActivityIndicator color={Colors.red} style={styles.threadLoading} />
      ) : (
        topLevel.map((reply) => (
          <View key={reply.id}>
            <ThreadReplyRow
              reply={reply}
              onReply={() => onComment(post.id, reply.id, reply.author?.username)}
            />
            {comments
              .filter((c) => c.parent_id === reply.id)
              .map((nested) => (
                <ThreadReplyRow
                  key={nested.id}
                  reply={nested}
                  nested
                  onReply={() => onComment(post.id, nested.id, nested.author?.username)}
                />
              ))}
          </View>
        ))
      )}
    </View>
  );
}

export function ThreadFeedLayout({
  posts,
  refreshKey = 0,
  onLike,
  onComment,
  onOpen,
  onReplyCountChange,
}: Props) {
  const [commentsByPost, setCommentsByPost] = useState<Record<string, ThreadComment[]>>({});
  const [loadingPosts, setLoadingPosts] = useState<Set<string>>(new Set());

  const loadThreadComments = useCallback(async (postIds: string[]) => {
    setLoadingPosts(new Set(postIds));
    const results = await Promise.all(
      postIds.map(async (id) => {
        try {
          const comments = await api.getComments(id);
          return { id, comments };
        } catch {
          return { id, comments: [] as ThreadComment[] };
        }
      })
    );
    setCommentsByPost((prev) => {
      const next = { ...prev };
      for (const { id, comments } of results) {
        next[id] = comments;
        onReplyCountChange?.(id, comments.length);
      }
      return next;
    });
    setLoadingPosts(new Set());
  }, [onReplyCountChange]);

  useEffect(() => {
    if (posts.length === 0) return;
    loadThreadComments(posts.map((p) => p.id));
  }, [posts, refreshKey, loadThreadComments]);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.communityHeader}>
          <Text style={styles.communityTitle}>Advice Community</Text>
          <Text style={styles.communitySub}>Threads, form checks, and coaching talk</Text>
        </View>
      }
      renderItem={({ item, index }) => (
        <ThreadCard
          post={item}
          index={index}
          comments={commentsByPost[item.id] ?? []}
          loadingComments={loadingPosts.has(item.id) && !commentsByPost[item.id]}
          onLike={onLike}
          onComment={onComment}
          onOpen={onOpen}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  communityHeader: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  communityTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  communitySub: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  thread: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  threadLoading: { marginTop: Spacing.md },
  opRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarSm: { width: 28, height: 28, borderRadius: 14 },
  avatarText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  avatarTextSm: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700' },
  opBody: { flex: 1 },
  opHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  opUser: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  opTime: { color: Colors.textMuted, fontSize: 12 },
  opText: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 6 },
  clipStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#1a1a2e',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.sm,
  },
  clipIcon: { fontSize: 14, color: Colors.red },
  clipLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  opActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  actionBtn: { paddingVertical: 4 },
  actionText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  replyLink: { color: Colors.red, fontSize: 12, fontWeight: '700' },
  replyRow: { flexDirection: 'row', marginTop: Spacing.md, paddingLeft: 4 },
  replyRowNested: { paddingLeft: 36 },
  threadLine: {
    width: 2,
    backgroundColor: Colors.borderSubtle,
    borderRadius: 1,
    marginRight: Spacing.sm,
    marginLeft: 18,
  },
  replyContent: { flex: 1 },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyUser: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  replyTime: { color: Colors.textMuted, fontSize: 11 },
  replyBody: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  replyFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 6 },
  replyLikes: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
});
