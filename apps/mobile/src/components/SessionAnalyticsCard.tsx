import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SessionSummary, AnalyticsEvent } from '../lib/analytics';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  summary: SessionSummary;
  recentEvents?: AnalyticsEvent[];
  compact?: boolean;
  onClear?: () => void;
}

const SUMMARY_ROWS: { key: keyof SessionSummary; label: string }[] = [
  { key: 'screenViews', label: 'Screen views' },
  { key: 'videoImpressions', label: 'Video impressions' },
  { key: 'laneChanges', label: 'Lane changes' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'uploadsStarted', label: 'Uploads started' },
  { key: 'uploadsPublished', label: 'Published' },
  { key: 'uploadsFlagged', label: 'Flagged for review' },
  { key: 'uploadsRejected', label: 'Rejected' },
  { key: 'adImpressions', label: 'Ad impressions' },
];

export function SessionAnalyticsCard({ summary, recentEvents, compact = false, onClear }: Props) {
  const rows = compact
    ? SUMMARY_ROWS.filter((row) => summary[row.key] > 0).slice(0, 6)
    : SUMMARY_ROWS;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Session analytics</Text>
        <Text style={styles.total}>{summary.totalEvents} events</Text>
      </View>
      {!compact && (
        <Text style={styles.subtitle}>
          Persisted locally — survives refresh in demo mode. Product metrics still come from the backend in production.
        </Text>
      )}
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.key} style={styles.stat}>
            <Text style={styles.statValue}>{summary[row.key]}</Text>
            <Text style={styles.statLabel}>{row.label}</Text>
          </View>
        ))}
      </View>
      {!compact && recentEvents && recentEvents.length > 0 && (
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>Recent events</Text>
          {recentEvents.slice(0, 8).map((event, index) => (
            <Text key={`${event.timestamp}-${index}`} style={styles.recentRow} numberOfLines={1}>
              {event.name.replace(/_/g, ' ')}
              {event.properties?.screen ? ` · ${event.properties.screen}` : ''}
              {event.properties?.lane ? ` · ${event.properties.lane}` : ''}
            </Text>
          ))}
        </View>
      )}
      {onClear && summary.totalEvents > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear session analytics</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  total: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  subtitle: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stat: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  recent: { marginTop: Spacing.xs, gap: 4 },
  recentTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  recentRow: { color: Colors.textMuted, fontSize: 11 },
  clearBtn: { marginTop: Spacing.xs, alignSelf: 'flex-start' },
  clearText: { color: Colors.red, fontSize: 13, fontWeight: '600' },
});
