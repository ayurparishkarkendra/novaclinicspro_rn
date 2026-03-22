import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  TherapistSessionItemV2,
  getStatusColor,
  getStatusLabel,
} from '../../../../features/staffDashboards/data/models/staffDashboards.dtos';
import { canCompleteSession } from '../../domain/entities/therapistDashboard.entity';
import { formatTime } from '../../../../core/utils/dateTimeUtils';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';

interface TherapistSessionCardProps {
  session: TherapistSessionItemV2;
  onComplete: (rowId: string) => void;
  isCompletingRowId: string | null;
  accessibilityLabel?: string;
}

export const TherapistSessionCard: React.FC<TherapistSessionCardProps> = ({
  session,
  onComplete,
  isCompletingRowId,
  accessibilityLabel,
}) => {
  const clientName = session.client_name ?? 'Unknown Client';
  const treatmentName = session.treatment_name ?? 'Unknown Treatment';
  const scheduledTime = formatTime(session.scheduled_time);
  const statusColor = getStatusColor(session.status);
  const statusLabel = getStatusLabel(session.status);
  const showComplete = canCompleteSession(session.status);
  const isLoading = isCompletingRowId === session.row_id;

  const cardLabel = accessibilityLabel ?? `Session for ${clientName}`;

  return (
    <View
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={cardLabel}
    >
      {/* Header row: client name + status badge */}
      <View style={styles.headerRow}>
        <Text style={styles.clientName} numberOfLines={1}>
          {clientName}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      {/* Treatment name */}
      <Text style={styles.treatmentName} numberOfLines={1}>
        {treatmentName}
      </Text>

      {/* Day number + scheduled time */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{`Day ${session.day_number}`}</Text>
        <Text style={styles.metaSeparator}>·</Text>
        <Text style={styles.metaText}>{scheduledTime}</Text>
      </View>

      {/* Complete button — only when status allows it */}
      {showComplete && (
        <TouchableOpacity
          style={[styles.completeButton, isLoading && styles.completeButtonLoading]}
          onPress={() => onComplete(session.row_id)}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Complete session"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.common.white} />
          ) : (
            <Text style={styles.completeButtonText}>Complete</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  clientName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.common.white,
  },
  treatmentName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  metaSeparator: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  completeButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  completeButtonLoading: {
    opacity: 0.7,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.common.white,
  },
});
