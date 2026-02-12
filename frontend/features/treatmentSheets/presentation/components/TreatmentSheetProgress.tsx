/**
 * Treatment Sheet Progress Bar Component
 * Visual indicator of treatment completion progress
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  TreatmentSheetRowResponse,
  calculateProgress,
  getRowCompletionStatus,
} from '../../data/models/treatmentSheets.dtos';

interface TreatmentSheetProgressProps {
  rows: TreatmentSheetRowResponse[];
  showDetails?: boolean;
}

export const TreatmentSheetProgress: React.FC<TreatmentSheetProgressProps> = ({
  rows,
  showDetails = true,
}) => {
  const progress = calculateProgress(rows);
  const totalDays = rows.length;
  const completedDays = rows.filter(r => getRowCompletionStatus(r) === 'completed').length;
  const scheduledDays = rows.filter(r => getRowCompletionStatus(r) === 'scheduled').length;
  const pendingDays = totalDays - completedDays - scheduledDays;

  const getProgressColor = () => {
    if (progress >= 100) return colors.success.main;
    if (progress >= 50) return colors.info.main;
    if (progress > 0) return colors.warning.main;
    return colors.grey[400];
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${progress}%`, backgroundColor: getProgressColor() },
          ]}
        />
      </View>

      {/* Progress Text */}
      <View style={styles.progressTextRow}>
        <Text style={styles.progressText}>
          {completedDays} of {totalDays} days completed
        </Text>
        <Text style={[styles.progressPercent, { color: getProgressColor() }]}>
          {progress}%
        </Text>
      </View>

      {/* Details */}
      {showDetails && totalDays > 0 && (
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <View style={[styles.detailDot, { backgroundColor: colors.success.main }]} />
            <Text style={styles.detailText}>{completedDays} Completed</Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailDot, { backgroundColor: colors.info.main }]} />
            <Text style={styles.detailText}>{scheduledDays} Scheduled</Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailDot, { backgroundColor: colors.grey[400] }]} />
            <Text style={styles.detailText}>{pendingDays} Pending</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.grey[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  progressPercent: {
    ...typography.body1,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
