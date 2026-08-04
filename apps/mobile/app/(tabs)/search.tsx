import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../src/components/Input';
import { api } from '../../src/lib/api';
import { Colors, Radius, Spacing } from '../../src/constants/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.searchProfiles(q);
      setResults(data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Input
        placeholder="Search users..."
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
      />

      {loading && <ActivityIndicator color={Colors.red} style={{ marginTop: Spacing.lg }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.resultName}>{item.display_name ?? item.username}</Text>
              <Text style={styles.resultHandle}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <Text style={styles.empty}>No users found</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.matteBlack, padding: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: Spacing.lg },
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
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
});
