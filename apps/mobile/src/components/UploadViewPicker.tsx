import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  FeedViewId,
  PostCategoryId,
  RECIPE_SUBCATEGORIES,
  UPLOAD_VIEW_OPTIONS,
  getUploadOptionForView,
} from '../constants/categories';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  selectedView: FeedViewId;
  selectedCategory: PostCategoryId;
  onSelectView: (view: FeedViewId, category: PostCategoryId) => void;
}

export function UploadViewPicker({ selectedView, selectedCategory, onSelectView }: Props) {
  const activeOption = getUploadOptionForView(selectedView);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Post to</Text>
      <View style={styles.grid}>
        {UPLOAD_VIEW_OPTIONS.map((option) => {
          const active = selectedView === option.view;
          return (
            <TouchableOpacity
              key={option.view}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelectView(option.view, option.category)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
              <Text style={[styles.chipHint, active && styles.chipHintActive]} numberOfLines={2}>
                {option.description}
              </Text>
              <Text style={[styles.destination, active && styles.destinationActive]}>
                → {option.view === 'feed' ? 'Feed scroll' : option.view === 'recipes' ? 'Recipes grid' : 'Community threads'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedView === 'recipes' && (
        <View style={styles.subPicker}>
          <Text style={styles.subLabel}>Recipe type</Text>
          <View style={styles.subRow}>
            {RECIPE_SUBCATEGORIES.map((category) => {
              const active = selectedCategory === category;
              const label = category === 'meal_prep' ? 'Meal Prep' : 'Nutrition';
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.subChip, active && styles.subChipActive]}
                  onPress={() => onSelectView('recipes', category)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subChipText, active && styles.subChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Text style={styles.helper}>
        {activeOption.label} posts appear in {selectedView === 'feed' ? 'the main Feed' : selectedView === 'recipes' ? 'Recipes' : 'Community'} once approved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: { color: Colors.textSecondary, fontSize: 14, marginBottom: Spacing.sm, fontWeight: '500' },
  grid: { gap: Spacing.sm },
  chip: {
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
  destination: { color: Colors.textMuted, fontSize: 11, marginTop: Spacing.xs, fontWeight: '600' },
  destinationActive: { color: Colors.textSecondary },
  subPicker: { marginTop: Spacing.md },
  subLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: Spacing.xs, fontWeight: '600' },
  subRow: { flexDirection: 'row', gap: Spacing.sm },
  subChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
  },
  subChipActive: {
    borderColor: Colors.red,
    backgroundColor: 'rgba(230, 57, 70, 0.12)',
  },
  subChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  subChipTextActive: { color: Colors.red },
  helper: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.md, lineHeight: 18 },
});
