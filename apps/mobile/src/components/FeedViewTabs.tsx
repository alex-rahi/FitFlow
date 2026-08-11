import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FEED_VIEWS, FeedViewId } from '../constants/categories';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  selected: FeedViewId;
  onSelect: (id: FeedViewId) => void;
}

export function FeedViewTabs({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.container}
    >
      {FEED_VIEWS.map((view) => {
        const active = selected === view.id;
        return (
          <TouchableOpacity
            key={view.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(view.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{view.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: Spacing.sm,
  },
  row: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  chipActive: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.textPrimary,
  },
});
