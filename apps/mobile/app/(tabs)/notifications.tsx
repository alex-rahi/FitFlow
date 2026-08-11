import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';
import { Colors, Spacing } from '../../src/constants/theme';
import { useScreenAnalytics } from '../../src/hooks/useScreenAnalytics';

const TYPE_ICONS: Record<string, string> = {
  like: '♥',
  comment: '💬',
  follow: '👤',
  system: '🔔',
};

export default function NotificationsScreen() {
  useScreenAnalytics('notifications');
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>You'll see likes, comments, and follows here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.item, !item.read && styles.unread]}>
              <Text style={styles.itemIcon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.body && <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>}
                <Text style={styles.itemTime}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack },
  center: { flex: 1, backgroundColor: Colors.matteBlack, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  markAll: { color: Colors.red, fontSize: 14, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: Colors.textMuted, fontSize: 14, marginTop: Spacing.xs, textAlign: 'center' },
  item: {
    flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  unread: { backgroundColor: 'rgba(230, 57, 70, 0.08)' },
  itemIcon: { fontSize: 24, marginTop: 2 },
  itemContent: { flex: 1 },
  itemTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  itemBody: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  itemTime: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
});
