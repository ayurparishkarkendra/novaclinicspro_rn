import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../../core/theme/spacing';
import { TreatmentSheetResponse } from '../../../data/models/treatmentSheets.dtos';
import { TreatmentSheetStatusBadge } from '../../components/TreatmentSheetStatusBadge';

interface Props {
  treatmentSheet?: TreatmentSheetResponse;
  rowsCount: number;
  isPrinting: boolean;
  isArchiving: boolean;
  onBack: () => void;
  onPrint: () => void;
  onArchive: () => void;
}

export const TreatmentSheetDetailHeader: React.FC<Props> = ({
  treatmentSheet,
  rowsCount,
  isPrinting,
  isArchiving,
  onBack,
  onPrint,
  onArchive,
}) => {
  const theme = useClinicTheme();

  const confirmArchive = () => {
    Alert.alert(
      'Archive Treatment Sheet',
      'This will archive the treatment sheet. It will no longer appear in the active list. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', style: 'destructive', onPress: onArchive },
      ]
    );
  };

  return (
    <View style={[styles.header, { borderBottomColor: theme.colors.border.subtle }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Treatment Sheet</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
          {treatmentSheet?.duration_days || rowsCount || 0} Days
        </Text>
      </View>
      {treatmentSheet && (
        <View style={styles.headerActions}>
          <TreatmentSheetStatusBadge status={treatmentSheet.status} size="medium" />
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: theme.colors.background.elevated }]}
            onPress={onPrint}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color={theme.colors.primary.default} />
            ) : (
              <Ionicons name="print-outline" size={20} color={theme.colors.text.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: theme.colors.background.elevated }]}
            onPress={confirmArchive}
            disabled={isArchiving}
          >
            <Ionicons name="archive-outline" size={20} color={theme.colors.feedback.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconButton: {
    padding: spacing.xs,
    borderRadius: 6,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
