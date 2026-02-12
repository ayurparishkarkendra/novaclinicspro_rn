/**
 * Casesheet Actions Component
 * Action buttons for casesheet operations (status transitions, print, archive)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  CasesheetStatus,
  getAllowedTransitions,
  getStatusLabel,
  isEditable,
} from '../../data/models/casesheets.dtos';

interface CasesheetActionsProps {
  status: CasesheetStatus;
  onTransition: (newStatus: CasesheetStatus) => void;
  onPrint: () => void;
  onArchive: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
}

export const CasesheetActions: React.FC<CasesheetActionsProps> = ({
  status,
  onTransition,
  onPrint,
  onArchive,
  onEdit,
  isLoading = false,
}) => {
  const allowedTransitions = getAllowedTransitions(status);
  const canEdit = isEditable(status);

  const handleTransition = (newStatus: CasesheetStatus) => {
    const actionLabel = newStatus === 'FINAL' ? 'finalize' : 'sign';
    const warningMessage =
      newStatus === 'SIGNED'
        ? 'Once signed, this casesheet cannot be edited. This action is permanent.'
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
      'Archive Casesheet',
      'This will archive the casesheet. It will no longer appear in the active list. Are you sure?',
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
          accessibilityLabel={`${getStatusLabel(newStatus)} this casesheet`}
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

      {/* Edit Button (only for drafts) */}
      {canEdit && onEdit && (
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Edit casesheet"
        >
          <Ionicons name="create-outline" size={18} color={colors.primary.main} />
          <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
        </TouchableOpacity>
      )}

      {/* Print Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={onPrint}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Print casesheet"
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
        accessibilityLabel="Archive casesheet"
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
  finalizeButton: {
    backgroundColor: colors.info.main,
  },
  signButton: {
    backgroundColor: colors.success.main,
  },
  editButton: {
    backgroundColor: colors.primary.main + '15',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  editButtonText: {
    color: colors.primary.main,
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
