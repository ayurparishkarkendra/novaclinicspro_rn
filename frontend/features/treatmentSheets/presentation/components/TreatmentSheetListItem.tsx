/**
 * Treatment Sheet List Item Component
 * Displays a treatment sheet summary in a list
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { TreatmentSheetStatusBadge } from './TreatmentSheetStatusBadge';
import { TreatmentSheetResponse, TreatmentSheetRowResponse } from '../../data/models/treatmentSheets.dtos';

interface TreatmentSheetListItemProps {
  treatmentSheet: TreatmentSheetResponse;
  onPress: () => void;
}

const calculateProgress = (rows: TreatmentSheetRowResponse[] | undefined) => {
  if (!rows || rows.length === 0) return { completed: 0, total: 0, percentage: 0 };
  const total = rows.length;
  const completed = rows.filter(r => r.status === 'COMPLETED').length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
};

export const TreatmentSheetListItem: React.FC<TreatmentSheetListItemProps> = ({
  treatmentSheet,
  onPress,
}) => {
  const progress = calculateProgress(treatmentSheet.rows);
  const createdDate = new Date(treatmentSheet.created_at).toLocaleDateString();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Treatment sheet created on ${createdDate}, ${progress.completed} of ${progress.total} treatments completed`}
      testID={`treatment-sheet-item-${treatmentSheet.id}`}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="fitness-outline" size={20} color={colors.primary.main} />
          <Text style={styles.title}>Treatment Sheet</Text>
        </View>
        <TreatmentSheetStatusBadge status={treatmentSheet.status} size="small" />
      </View>

      {treatmentSheet.treatment_plan_summary && (
        <Text style={styles.summary} numberOfLines={2}>
          {treatmentSheet.treatment_plan_summary}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress.percentage}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress.completed}/{progress.total} completed
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.footerText}>{createdDate}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="document-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.footerText}>v{treatmentSheet.document_version}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summary: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.grey[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success.main,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.secondary,
    minWidth: 80,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});

export default TreatmentSheetListItem;
