import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UPLOAD_CATEGORIES, UploadCategoryId } from '../constants/categories';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  selected: UploadCategoryId;
  onSelect: (id: UploadCategoryId) => void;
}

export function CategoryPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.grid}>
        {UPLOAD_CATEGORIES.map((cat) => {
          const active = selected === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(cat.id as UploadCategoryId)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{cat.label}</Text>
              <Text style={[styles.chipHint, active && styles.chipHintActive]} numberOfLines={2}>
                {cat.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: { color: Colors.textSecondary, fontSize: 14, marginBottom: Spacing.sm, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  chipActive: {
    borderColor: Colors.red,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
  },
  chipLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  chipLabelActive: { color: Colors.red },
  chipHint: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  chipHintActive: { color: Colors.textSecondary },
});
