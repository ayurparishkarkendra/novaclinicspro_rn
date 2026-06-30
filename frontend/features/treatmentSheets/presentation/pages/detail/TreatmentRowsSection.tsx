import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../../core/theme/spacing';
import { TreatmentOrderResponse } from '../../../data/models/treatmentOrders.dtos';
import { PAGE_SIZE } from './helpers';
import { RowFormData, ScheduleRow } from './types';
import { TreatmentRowEditor } from './TreatmentRowEditor';

interface Props {
  rowsData: RowFormData[];
  page: number;
  canEdit: boolean;
  hasBeenSavedOnce: boolean;
  isSavingAll: boolean;
  treatmentOrder?: TreatmentOrderResponse;
  onSaveAllRows: () => void;
  onSetPage: (page: number | ((prev: number) => number)) => void;
  onUpdateField: (index: number, field: keyof RowFormData, value: string) => void;
  onUpdateSingleRow: (index: number) => void;
  onToggleEditMode: (index: number) => void;
  onCopyFromAbove: (index: number) => void;
  onScheduleRow: (row: ScheduleRow) => void;
}

export const TreatmentRowsSection: React.FC<Props> = ({
  rowsData,
  page,
  canEdit,
  hasBeenSavedOnce,
  isSavingAll,
  treatmentOrder,
  onSaveAllRows,
  onSetPage,
  onUpdateField,
  onUpdateSingleRow,
  onToggleEditMode,
  onCopyFromAbove,
  onScheduleRow,
}) => {
  const theme = useClinicTheme();
  const paginatedRows = rowsData.slice(0, page * PAGE_SIZE);
  const hasMore = paginatedRows.length < rowsData.length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Treatment Days ({rowsData.length})</Text>
        {canEdit && rowsData.length > 0 ? (
          <TouchableOpacity
            style={[styles.saveAllButton, { backgroundColor: theme.colors.feedback.success }]}
            onPress={onSaveAllRows}
            disabled={isSavingAll}
          >
            {isSavingAll ? (
              <ActivityIndicator size="small" color={theme.colors.primary.onPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={18} color={theme.colors.primary.onPrimary} />
                <Text style={[styles.saveAllButtonText, { color: theme.colors.primary.onPrimary }]}>
                  {hasBeenSavedOnce ? 'Update All' : 'Save All'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {rowsData.length === 0 ? (
        <View style={styles.emptyRows}>
          <Ionicons name="calendar-outline" size={32} color={theme.colors.text.secondary} />
          <Text style={[styles.emptyRowsText, { color: theme.colors.text.secondary }]}>
            No treatment days scheduled yet
          </Text>
        </View>
      ) : (
        paginatedRows.map((row, index) => (
          <TreatmentRowEditor
            key={row.id}
            row={row}
            index={index}
            canEdit={canEdit}
            hasBeenSavedOnce={hasBeenSavedOnce}
            treatmentOrder={treatmentOrder}
            onUpdateField={onUpdateField}
            onUpdateSingleRow={onUpdateSingleRow}
            onToggleEditMode={onToggleEditMode}
            onCopyFromAbove={onCopyFromAbove}
            onScheduleRow={onScheduleRow}
          />
        ))
      )}
      {hasMore ? (
        <TouchableOpacity
          style={[styles.loadMoreButton, { backgroundColor: theme.colors.primary.default }]}
          onPress={() => onSetPage(prev => prev + 1)}
        >
          <Text style={[styles.loadMoreText, { color: theme.colors.primary.onPrimary }]}>
            Load More Days ({paginatedRows.length} of {rowsData.length})
          </Text>
          <Ionicons name="chevron-down" size={20} color={theme.colors.primary.onPrimary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  saveAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  saveAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyRows: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyRowsText: {
    fontSize: 14,
  },
});
