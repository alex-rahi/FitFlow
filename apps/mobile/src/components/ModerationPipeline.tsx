import { View, Text, StyleSheet } from 'react-native';
import {
  YOLO_MODERATION_STEPS,
  getActiveStepIndex,
  getModerationPhase,
} from '../constants/moderation';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  status?: string | null;
  moderationDecision?: string | null;
  compact?: boolean;
}

export function ModerationPipeline({ status, moderationDecision, compact = false }: Props) {
  const phase = getModerationPhase(status, moderationDecision);
  const activeIndex = getActiveStepIndex(phase);
  const rejected = phase === 'rejected';

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={styles.title}>YOLO moderation pipeline</Text>
      {!compact && (
        <Text style={styles.subtitle}>
          Uploads run through YOLO object detection and a rules engine, then auto-publish — no manual approval queue.
        </Text>
      )}
      {YOLO_MODERATION_STEPS.map((step, index) => {
        const done = index < activeIndex || phase === 'published';
        const active = index === activeIndex && phase !== 'published';
        const failed = rejected && index === activeIndex;

        return (
          <View key={step.id} style={styles.stepRow}>
            <View style={[
              styles.dot,
              done && styles.dotDone,
              active && styles.dotActive,
              failed && styles.dotFailed,
            ]}>
              <Text style={styles.dotText}>{done ? '✓' : failed ? '!' : index + 1}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{step.label}</Text>
              {!compact && <Text style={styles.stepDetail}>{step.detail}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  cardCompact: { marginTop: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: Spacing.xs },
  subtitle: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: Spacing.md },
  stepRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: 'rgba(46, 204, 113, 0.25)' },
  dotActive: { backgroundColor: 'rgba(230, 57, 70, 0.25)' },
  dotFailed: { backgroundColor: 'rgba(231, 76, 60, 0.25)' },
  dotText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700' },
  stepBody: { flex: 1 },
  stepLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  stepLabelActive: { color: Colors.textPrimary },
  stepDetail: { color: Colors.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 },
});
