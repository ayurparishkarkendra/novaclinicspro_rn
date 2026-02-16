/**
 * Treatment Sheet Detail Screen
 * Displays detailed view of a treatment sheet with rows and progress
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useTreatmentSheetDetailQuery,
  useTransitionTreatmentSheetStatusMutation,
  useSyncTreatmentSheetMutation,
  usePrintTreatmentSheetMutation,
  useArchiveTreatmentSheetMutation,
  useUpdateTreatmentSheetRowMutation,
  useCompleteTreatmentSheetRowMutation,
  TreatmentSheetStatus,
  TreatmentSheetRowResponse,
  formatDateTime,
  isEditable,
} from '../../index';
import { TreatmentSheetStatusBadge } from '../components/TreatmentSheetStatusBadge';
import { TreatmentSheetProgress } from '../components/TreatmentSheetProgress';
import { TreatmentSheetRowItem } from '../components/TreatmentSheetRowItem';
import { TreatmentSheetActions } from '../components/TreatmentSheetActions';
import { EmptyTreatmentSheetState } from '../components/EmptyTreatmentSheetState';

export const TreatmentSheetDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ treatmentSheetId: string; casesheetId?: string }>(); 
  const { currentUser } = useAuth();
  const treatmentSheetId = params.treatmentSheetId || '';
  // BUG FIX #9: Get tenantId to pass to API
  const tenantId = currentUser?.tenantId || '';

  const [selectedRow, setSelectedRow] = useState<TreatmentSheetRowResponse | null>(null);
  const [showRowModal, setShowRowModal] = useState(false);
  const [rowFormData, setRowFormData] = useState({
    treatment_description: '',
    medicines_given: '',
    instructions: '',
  });

  const {
    data: treatmentSheet,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTreatmentSheetDetailQuery(treatmentSheetId, tenantId);

  const transitionMutation = useTransitionTreatmentSheetStatusMutation(treatmentSheetId);
  const syncMutation = useSyncTreatmentSheetMutation(treatmentSheetId);
  const printMutation = usePrintTreatmentSheetMutation(treatmentSheetId);
  const archiveMutation = useArchiveTreatmentSheetMutation(treatmentSheetId);

  // Row mutations (initialized with empty values, will be re-created when row is selected)
  const updateRowMutation = useUpdateTreatmentSheetRowMutation(
    selectedRow?.id || '',
    treatmentSheetId
  );
  const completeRowMutation = useCompleteTreatmentSheetRowMutation(
    selectedRow?.id || '',
    treatmentSheetId
  );

  const handleTransition = useCallback(async (newStatus: TreatmentSheetStatus) => {
    try {
      await transitionMutation.mutateAsync({ status: newStatus });
      Alert.alert('Success', `Treatment sheet ${newStatus.toLowerCase()} successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status.');
    }
  }, [transitionMutation]);

  const handleSync = useCallback(async () => {
    try {
      const result = await syncMutation.mutateAsync();
      Alert.alert(
        'Sync Complete',
        `Synced with sessions: ${result.created} created, ${result.updated} updated.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to sync with sessions.');
    }
  }, [syncMutation]);

  const handlePrint = useCallback(async () => {
    try {
      await printMutation.mutateAsync();
      Alert.alert('Print', 'Print content ready.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to print.');
    }
  }, [printMutation]);

  const handleArchive = useCallback(async () => {
    try {
      await archiveMutation.mutateAsync();
      Alert.alert('Success', 'Treatment sheet archived.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to archive.');
    }
  }, [archiveMutation, router]);

  const openRowModal = (row: TreatmentSheetRowResponse) => {
    setSelectedRow(row);
    setRowFormData({
      treatment_description: row.treatment_description || '',
      medicines_given: row.medicines_given || '',
      instructions: row.instructions || '',
    });
    setShowRowModal(true);
  };

  const handleSaveRow = async () => {
    if (!selectedRow) return;
    try {
      await updateRowMutation.mutateAsync(rowFormData);
      setShowRowModal(false);
      Alert.alert('Success', 'Row updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update row.');
    }
  };

  const handleCompleteRow = async (row: TreatmentSheetRowResponse) => {
    Alert.alert(
      'Complete Row',
      `Mark Day ${row.day_number} as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              // Use a fresh mutation for this specific row
              await completeTreatmentSheetRowMutation(row);
              Alert.alert('Success', 'Row marked as complete.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to complete row.');
            }
          },
        },
      ]
    );
  };

  // Helper to complete a specific row
  const completeTreatmentSheetRowMutation = async (row: TreatmentSheetRowResponse) => {
    const { completeTreatmentSheetRowApi } = await import('../../data/datasources/treatmentSheets.api');
    await completeTreatmentSheetRowApi(row.id, {});
    refetch();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Treatment Sheet</Text>
        <Text style={styles.headerSubtitle}>
          {treatmentSheet?.duration_days || 0} Days
        </Text>
      </View>
      {treatmentSheet && (
        <TreatmentSheetStatusBadge status={treatmentSheet.status} size="medium" />
      )}
    </View>
  );

  const renderRowEditModal = () => (
    <Modal
      visible={showRowModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRowModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Edit Day {selectedRow?.day_number}
            </Text>
            <TouchableOpacity onPress={() => setShowRowModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Treatment Description</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={rowFormData.treatment_description}
              onChangeText={(text) =>
                setRowFormData((prev) => ({ ...prev, treatment_description: text }))
              }
              placeholder="Describe the treatment performed..."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Medicines Given</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={rowFormData.medicines_given}
              onChangeText={(text) =>
                setRowFormData((prev) => ({ ...prev, medicines_given: text }))
              }
              placeholder="List medicines administered..."
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Instructions</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={rowFormData.instructions}
              onChangeText={(text) =>
                setRowFormData((prev) => ({ ...prev, instructions: text }))
              }
              placeholder="Instructions for the patient..."
              multiline
              numberOfLines={2}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveRow}
              disabled={updateRowMutation.isPending}
            >
              {updateRowMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.background.default} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading treatment sheet...</Text>
        </View>
      );
    }

    if (isError || !treatmentSheet) {
      return (
        <EmptyTreatmentSheetState
          variant="error"
          title="Unable to Load Treatment Sheet"
          message={
            error?.message?.includes('401')
              ? 'Authentication failed. Please try logging in again.'
              : 'Could not load this treatment sheet. Please try again.'
          }
          actionLabel="Retry"
          onActionPress={() => refetch()}
        />
      );
    }

    const rows = treatmentSheet.rows || [];
    const canEdit = isEditable(treatmentSheet.status);

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Document Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDateTime(treatmentSheet.recorded_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={colors.info.main} />
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={[styles.infoValue, { color: colors.info.main }]}>
              {treatmentSheet.duration_days} days
            </Text>
          </View>
          {treatmentSheet.signed_at && (
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success.main} />
              <Text style={styles.infoLabel}>Signed:</Text>
              <Text style={[styles.infoValue, { color: colors.success.main }]}>
                {formatDateTime(treatmentSheet.signed_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <TreatmentSheetProgress rows={rows} showDetails />
        </View>

        {/* Treatment Rows */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Treatment Days ({rows.length})</Text>
            {canEdit && (
              <TouchableOpacity
                style={styles.syncInlineButton}
                onPress={handleSync}
                disabled={syncMutation.isPending}
              >
                <Ionicons name="sync" size={16} color={colors.primary.main} />
                <Text style={styles.syncInlineText}>Sync</Text>
              </TouchableOpacity>
            )}
          </View>

          {rows.length === 0 ? (
            <View style={styles.emptyRows}>
              <Ionicons name="calendar-outline" size={32} color={colors.text.secondary} />
              <Text style={styles.emptyRowsText}>No treatment days yet.</Text>
              {canEdit && (
                <Text style={styles.emptyRowsSubtext}>
                  Tap "Sync Sessions" to populate from scheduled sessions.
                </Text>
              )}
            </View>
          ) : (
            rows.map((row) => (
              <TreatmentSheetRowItem
                key={row.id}
                row={row}
                onPress={canEdit ? () => openRowModal(row) : undefined}
                onComplete={canEdit ? () => handleCompleteRow(row) : undefined}
                isEditable={canEdit}
              />
            ))
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Actions</Text>
          <TreatmentSheetActions
            status={treatmentSheet.status}
            onTransition={handleTransition}
            onSync={handleSync}
            onPrint={handlePrint}
            onArchive={handleArchive}
            isLoading={
              transitionMutation.isPending ||
              printMutation.isPending ||
              archiveMutation.isPending
            }
            isSyncing={syncMutation.isPending}
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <View style={styles.content}>
        {renderContent()}
      </View>
      {renderRowEditModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  infoValue: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
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
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  syncInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.main + '15',
    borderRadius: 6,
  },
  syncInlineText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
  },
  emptyRows: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyRowsText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  emptyRowsSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  actionsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionsTitle: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.h6,
    color: colors.text.primary,
  },
  modalContent: {
    padding: spacing.md,
  },
  inputLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.grey[200],
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary.main,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
});

export default TreatmentSheetDetailScreen;
