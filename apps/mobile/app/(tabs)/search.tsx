import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../src/components/Input';
import { FeedViewTabs } from '../../src/components/FeedViewTabs';
import { api } from '../../src/lib/api';
import { FeedViewId, getFeedViewLabel } from '../../src/constants/categories';
import { VideoPost } from '../../src/components/VideoCard';
import { Colors, Spacing } from '../../src/constants/theme';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';

type SearchResult =
  | { type: 'user'; id: string; username: string; display_name?: string }
  | { type: 'post'; id: string; post: VideoPost; view: FeedViewId };

export default function SearchScreen() {
  useScreenAnalytics('search');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<FeedViewId>('feed');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [users, posts] = await Promise.all([
        api.searchProfiles(q),
        api.searchPosts(q, view),
      ]);
      const merged: SearchResult[] = [
        ...users.map((user: { id: string; username: string; display_name?: string }) => ({
          type: 'user' as const,
          id: user.id,
          username: user.username,
          display_name: user.display_name,
        })),
        ...posts.map((post: VideoPost) => ({
          type: 'post' as const,
          id: post.id,
          post,
          view,
        })),
      ];
      setResults(merged);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (nextView: FeedViewId) => {
    setView(nextView);
    if (query.length >= 2) handleSearch(query);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Find users and {getFeedViewLabel(view).toLowerCase()} content</Text>

      <Input
        placeholder="Search users, captions, creators..."
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
      />

      <FeedViewTabs selected={view} onSelect={handleViewChange} />

      {loading && <ActivityIndicator color={Colors.red} style={{ marginTop: Spacing.lg }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === 'user') {
            return (
              <TouchableOpacity style={styles.resultItem}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.resultName}>{item.display_name ?? item.username}</Text>
                  <Text style={styles.resultHandle}>@{item.username}</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity style={styles.postItem}>
              <Text style={styles.postBadge}>{getFeedViewLabel(item.view)}</Text>
              <Text style={styles.postCaption} numberOfLines={2}>{item.post.caption ?? 'Untitled post'}</Text>
              <Text style={styles.postMeta}>@{item.post.author?.username ?? 'user'} · ♥ {item.post.like_count}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <Text style={styles.empty}>No results in {getFeedViewLabel(view).toLowerCase()}</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack, padding: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  list: { paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.red,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  resultName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  resultHandle: { color: Colors.textMuted, fontSize: 14 },
  postItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  postBadge: { color: Colors.red, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  postCaption: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  postMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
});
