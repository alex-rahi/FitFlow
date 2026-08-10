import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { VideoPost } from '../VideoCard';
import { Colors, Radius, Spacing } from '../../constants/theme';

interface Props {
  posts: VideoPost[];
  onLike: (postId: string) => void;
  onOpen: (post: VideoPost, index: number) => void;
}

interface MacroInfo {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

function demoMacros(postId: string): MacroInfo {
  const n = postId.charCodeAt(postId.length - 2) + postId.charCodeAt(postId.length - 1);
  return {
    protein: 28 + (n % 35),
    carbs: 45 + (n % 70),
    fat: 12 + (n % 20),
    calories: 380 + (n % 520),
  };
}

function MacroColumn({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.macroCol}>
      <Text style={styles.macroValue}>{value}{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

export function ColumnFeedLayout({ posts, onLike, onOpen }: Props) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => {
        const macros = demoMacros(item.id);
        return (
          <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => onOpen(item, index)}>
            <View style={styles.thumb}>
              <Text style={styles.playIcon}>▶</Text>
            </View>

            <View style={styles.body}>
              <Text style={styles.caption} numberOfLines={2}>{item.caption ?? 'Nutrition post'}</Text>
              <Text style={styles.author}>@{item.author?.username ?? 'user'}</Text>

              <View style={styles.macroRow}>
                <MacroColumn label="Protein" value={macros.protein} unit="g" />
                <View style={styles.macroDivider} />
                <MacroColumn label="Carbs" value={macros.carbs} unit="g" />
                <View style={styles.macroDivider} />
                <MacroColumn label="Fat" value={macros.fat} unit="g" />
                <View style={styles.macroDivider} />
                <MacroColumn label="Cal" value={macros.calories} unit="" />
              </View>

              <View style={styles.footer}>
                <TouchableOpacity onPress={() => onLike(item.id)} hitSlop={8}>
                  <Text style={styles.likes}>♥ {item.like_count}</Text>
                </TouchableOpacity>
                <Text style={styles.tapHint}>Tap to watch breakdown</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.md, paddingTop: 100, paddingBottom: 120, gap: Spacing.md },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  thumb: {
    height: 160,
    backgroundColor: '#1a2e3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 36, color: Colors.textMuted },
  body: { padding: Spacing.md },
  caption: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  author: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  macroRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.md,
  },
  macroCol: { flex: 1, alignItems: 'center' },
  macroValue: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  macroLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 2, textTransform: 'uppercase' },
  macroDivider: { width: 1, backgroundColor: Colors.borderSubtle },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  likes: { color: Colors.red, fontSize: 13, fontWeight: '600' },
  tapHint: { color: Colors.textMuted, fontSize: 11 },
});
