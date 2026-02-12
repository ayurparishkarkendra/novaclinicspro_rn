/**
 * Treatment Sheet Actions Component
 * Action buttons for treatment sheet operations
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  TreatmentSheetStatus,
  getAllowedTransitions,
  getStatusLabel,
  isEditable,
} from '../../data/models/treatmentSheets.dtos';

interface TreatmentSheetActionsProps {
  status: TreatmentSheetStatus;
  onTransition: (newStatus: TreatmentSheetStatus) => void;
  onSync: () => void;
  onPrint: () => void;
  onArchive: () => void;
  isLoading?: boolean;
  isSyncing?: boolean;
}

export const TreatmentSheetActions: React.FC<TreatmentSheetActionsProps> = ({
  status,
  onTransition,
  onSync,
  onPrint,
  onArchive,
  isLoading = false,
  isSyncing = false,
}) => {
  const allowedTransitions = getAllowedTransitions(status);
  const canEdit = isEditable(status);

  const handleTransition = (newStatus: TreatmentSheetStatus) => {
    const actionLabel = newStatus === 'FINAL' ? 'finalize' : 'sign';
    const warningMessage =
      newStatus === 'SIGNED'
        ? 'Once signed, this treatment sheet cannot be edited. This action is permanent.'
        : 'Finalizing will lock some fields. Are you sure you want to continue?';

    Alert.alert(
      `Confirm ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}`,
      warningMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Yes, ${actionLabel}`,
          style: newStatus === 'SIGNED' ? 'destructive' : 'default',
          onPress: () => onTransition(newStatus),
        },
      ]
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Treatment Sheet',
      'This will archive the treatment sheet. It will no longer appear in the active list. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: onArchive,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Sync Button (primary action for treatment sheets) */}
      {canEdit && (
        <TouchableOpacity
          style={[styles.actionButton, styles.syncButton]}
          onPress={onSync}
          disabled={isLoading || isSyncing}
          accessibilityRole="button"
          accessibilityLabel="Sync with sessions"
        >
          <Ionicons
            name="sync"
            size={18}
            color={colors.background.default}
          />
          <Text style={styles.actionButtonText}>
            {isSyncing ? 'Syncing...' : 'Sync Sessions'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Status Transitions */}
      {allowedTransitions.map((newStatus) => (
        <TouchableOpacity
          key={newStatus}
          style={[
            styles.actionButton,
            newStatus === 'SIGNED' ? styles.signButton : styles.finalizeButton,
          ]}
          onPress={() => handleTransition(newStatus)}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={`${getStatusLabel(newStatus)} this treatment sheet`}
        >
          <Ionicons
            name={newStatus === 'SIGNED' ? 'shield-checkmark' : 'checkmark-circle'}
            size={18}
            color={colors.background.default}
          />
          <Text style={styles.actionButtonText}>
            {newStatus === 'SIGNED' ? 'Sign' : 'Finalize'}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Print Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={onPrint}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Print treatment sheet"
      >
        <Ionicons name="print-outline" size={18} color={colors.text.primary} />
        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Print</Text>
      </TouchableOpacity>

      {/* Archive Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.dangerButton]}
        onPress={handleArchive}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Archive treatment sheet"
      >
        <Ionicons name="archive-outline" size={18} color={colors.error.main} />
        <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Archive</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  syncButton: {
    backgroundColor: colors.primary.main,
  },
  finalizeButton: {
    backgroundColor: colors.info.main,
  },
  signButton: {
    backgroundColor: colors.success.main,
  },
  secondaryButton: {
    backgroundColor: colors.grey[200],
  },
  secondaryButtonText: {
    color: colors.text.primary,
  },
  dangerButton: {
    backgroundColor: colors.error.main + '15',
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  dangerButtonText: {
    color: colors.error.main,
  },
});
