/**
 * Staging Row Item Component
 * Displays a single staging row with validation status
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { StagingRow } from '../../data/models/bulkUpload.dtos';

interface StagingRowItemProps {
  row: StagingRow;
  onEdit?: () => void;
}

export const StagingRowItem: React.FC<StagingRowItemProps> = ({ row, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  const hasErrors = row.validation_errors && Object.keys(row.validation_errors).length > 0;
  const errorCount = hasErrors
    ? Object.values(row.validation_errors!).flat().length
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        row.is_committed && styles.committedContainer,
        !row.is_valid && styles.invalidContainer,
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      {/* Status indicator */}
      <View
        style={[
          styles.statusBar,
          {
            backgroundColor: row.is_committed
              ? colors.success.main
              : row.is_valid
              ? colors.primary.main
              : colors.error.main,
          },
        ]}
      />

      {/* Row number */}
      <View style={styles.rowNumber}>
        <Text style={styles.rowNumberText}>#{row.row_index + 1}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Status header */}
        <View style={styles.header}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: row.is_committed
                  ? colors.success.main + '15'
                  : row.is_valid
                  ? colors.primary.main + '15'
                  : colors.error.main + '15',
              },
            ]}
          >
            <Ionicons
              name={
                row.is_committed
                  ? 'checkmark-circle'
                  : row.is_valid
                  ? 'checkmark'
                  : 'close-circle'
              }
              size={14}
              color={
                row.is_committed
                  ? colors.success.main
                  : row.is_valid
                  ? colors.primary.main
                  : colors.error.main
              }
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: row.is_committed
                    ? colors.success.main
                    : row.is_valid
                    ? colors.primary.main
                    : colors.error.main,
                },
              ]}
            >
              {row.is_committed
                ? 'Committed'
                : row.is_valid
                ? 'Valid'
                : `${errorCount} error${errorCount !== 1 ? 's' : ''}`}
            </Text>
          </View>

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.tertiary}
          />
        </View>

        {/* Preview of mapped data */}
        {!expanded && (
          <Text style={styles.preview} numberOfLines={1}>
            {Object.entries(row.mapped_data)
              .slice(0, 3)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' | ')}
          </Text>
        )}

        {/* Expanded view */}
        {expanded && (
          <View style={styles.expandedContent}>
            {/* Mapped data */}
            <Text style={styles.sectionLabel}>Mapped Data</Text>
            {Object.entries(row.mapped_data).map(([key, value]) => (
              <View key={key} style={styles.dataRow}>
                <Text style={styles.dataKey}>{key}</Text>
                <Text style={styles.dataValue}>
                  {value?.toString() || '—'}
                </Text>
              </View>
            ))}

            {/* Validation errors */}
            {hasErrors && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.error.main }]}>
                  Validation Errors
                </Text>
                {Object.entries(row.validation_errors!).map(([field, errors]) => (
                  <View key={field} style={styles.errorItem}>
                    <Text style={styles.errorField}>{field}</Text>
                    {errors.map((error, index) => (
                      <Text key={index} style={styles.errorMessage}>
                        • {error}
                      </Text>
                    ))}
                  </View>
                ))}
              </>
            )}

            {/* Edit button (for invalid rows) */}
            {!row.is_valid && onEdit && (
              <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                <Ionicons name="create-outline" size={18} color={colors.primary.main} />
                <Text style={styles.editButtonText}>Edit Row Data</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  committedContainer: {
    backgroundColor: colors.success.main + '05',
  },
  invalidContainer: {
    borderColor: colors.error.main + '30',
  },
  statusBar: {
    width: 4,
  },
  rowNumber: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey[50],
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
  },
  rowNumberText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  preview: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  dataKey: {
    ...typography.caption,
    color: colors.text.tertiary,
    width: '40%',
  },
  dataValue: {
    ...typography.caption,
    color: colors.text.primary,
    flex: 1,
  },
  errorItem: {
    marginBottom: spacing.xs,
  },
  errorField: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.error.main,
  },
  errorMessage: {
    ...typography.caption,
    color: colors.error.main,
    marginLeft: spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary.main + '10',
  },
  editButtonText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary.main,
  },
});
