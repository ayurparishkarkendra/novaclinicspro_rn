/**
 * Treatment Sheet Detail Screen
 * Displays detailed view of a treatment sheet with inline editable rows
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
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
  TreatmentSheetStatus,
  formatDateTime,
  isEditable,
} from '../../index';
import { TreatmentSheetStatusBadge } from '../components/TreatmentSheetStatusBadge';
import { TreatmentSheetProgress } from '../components/TreatmentSheetProgress';
import { TreatmentSheetActions } from '../components/TreatmentSheetActions';
import { EmptyTreatmentSheetState } from '../components/EmptyTreatmentSheetState';

interface RowFormData {
  id: string;
  day_number: number;
  session_date: string | null;
  treatment_description: string;
  medicines_given: string;
  instructions: string;
  isEditing: boolean;
  isSaving: boolean;
}

export const TreatmentSheetDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ treatmentSheetId: string; casesheetId?: string }>(); 
  const { currentUser } = useAuth();
  const treatmentSheetId = params.treatmentSheetId || '';
  const tenantId = currentUser?.tenantId || '';

  const [rowsData, setRowsData] = useState<RowFormData[]>([]);

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

  // Initialize rows data when treatment sheet loads
  useEffect(() => {
    if (treatmentSheet?.rows) {
      const formattedRows = treatmentSheet.rows.map(row => ({
        id: row.id,
        day_number: row.day_number,
        session_date: row.session_date || null,
        treatment_description: row.treatment_description || '',
        medicines_given: row.medicines_given || '',
        instructions: row.instructions || '',
        isEditing: false,
        isSaving: false,
      }));
      setRowsData(formattedRows);
    }
  }, [treatmentSheet]);

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

  const toggleEdit = (index: number) => {
    setRowsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isEditing: !updated[index].isEditing };
      return updated;
    });
  };

  const updateRowField = (index: number, field: keyof RowFormData, value: string) => {
    setRowsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const copyFromAbove = (index: number) => {
    if (index === 0) {
      Alert.alert('Info', 'This is the first row. Nothing to copy from.');
      return;
    }
    
    setRowsData(prev => {
      const updated = [...prev];
      const aboveRow = updated[index - 1];
      updated[index] = {
        ...updated[index],
        treatment_description: aboveRow.treatment_description,
        medicines_given: aboveRow.medicines_given,
        instructions: aboveRow.instructions,
        isEditing: true,
      };
      return updated;
    });
  };

  const saveRow = async (index: number) => {
    const row = rowsData[index];
    
    // Set saving state
    setRowsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isSaving: true };
      return updated;
    });

    try {
      const { axiosClient } = await import('../../../../core/api/axiosClient');
      
      await axiosClient.patch(
        `/api/v1/clinic/treatment-sheets/rows/${row.id}`,
        {
          treatment_description: row.treatment_description || null,
          medicines_given: row.medicines_given || null,
          instructions: row.instructions || null,
        }
      );
      
      // Update state: stop editing and saving
      setRowsData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isEditing: false, isSaving: false };
        return updated;
      });
      
      Alert.alert('Success', `Day ${row.day_number} saved successfully.`);
      await refetch();
    } catch (err: any) {
      setRowsData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isSaving: false };
        return updated;
      });
      Alert.alert('Error', err.message || 'Failed to save row.');
    }
  };

  const syncSingleRow = async (index: number) => {
    const row = rowsData[index];
    Alert.alert(
      'Sync Row',
      `Sync Day ${row.day_number} with scheduled session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            // This would call a specific API to sync a single row
            // For now, we'll just show a message
            Alert.alert('Info', 'Single row sync feature coming soon. Use the main Sync button to sync all rows.');
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
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

    const canEdit = isEditable(treatmentSheet.status);

    if (rowsData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No treatment days yet</Text>
          <Text style={styles.emptySubtitle}>
            The treatment sheet was created but has no rows.
          </Text>
          {canEdit && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSync}
              disabled={syncMutation.isPending}
            >
              <Ionicons name="sync" size={18} color={colors.common.white} />
              <Text style={styles.syncButtonText}>
                {syncMutation.isPending ? 'Syncing...' : 'Sync with Sessions'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
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
          </View>

          {/* Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <TreatmentSheetProgress rows={treatmentSheet.rows || []} showDetails />
          </View>

          {/* Treatment Rows - Inline Editable */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Treatment Days ({rowsData.length})</Text>
            </View>

            {rowsData.map((row, index) => (
              <View key={row.id} style={styles.rowCard}>
                {/* Row Header with Day/Date and Action Icons */}
                <View style={styles.rowHeader}>
                  <View style={styles.rowHeaderLeft}>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>Day {row.day_number}</Text>
                    </View>
                    {row.session_date && (
                      <Text style={styles.dateText}>{formatDate(row.session_date)}</Text>
                    )}
                  </View>
                  
                  {canEdit && (
                    <View style={styles.rowActions}>
                      {/* Edit/Cancel Icon */}
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => toggleEdit(index)}
                        disabled={row.isSaving}
                      >
                        <Ionicons 
                          name={row.isEditing ? "close-circle-outline" : "create-outline"} 
                          size={20} 
                          color={row.isEditing ? colors.error.main : colors.primary.main} 
                        />
                      </TouchableOpacity>

                      {/* Save Icon */}
                      {row.isEditing && (
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => saveRow(index)}
                          disabled={row.isSaving}
                        >
                          {row.isSaving ? (
                            <ActivityIndicator size="small" color={colors.success.main} />
                          ) : (
                            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Copy from Above Icon */}
                      {index > 0 && (
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => copyFromAbove(index)}
                          disabled={row.isSaving}
                        >
                          <Ionicons name="copy-outline" size={20} color={colors.info.main} />
                        </TouchableOpacity>
                      )}

                      {/* Sync Icon */}
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => syncSingleRow(index)}
                        disabled={row.isSaving}
                      >
                        <Ionicons name="sync-outline" size={20} color={colors.warning.main} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Row Content - Always Visible */}
                <View style={styles.rowContent}>
                  <Text style={styles.fieldLabel}>Treatment Description</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.multilineInput,
                      !row.isEditing && styles.textInputReadOnly
                    ]}
                    value={row.treatment_description}
                    onChangeText={(text) => updateRowField(index, 'treatment_description', text)}
                    placeholder="Describe the treatment performed..."
                    multiline
                    numberOfLines={3}
                    editable={canEdit && row.isEditing}
                  />

                  <Text style={styles.fieldLabel}>Medicines Given</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.multilineInput,
                      !row.isEditing && styles.textInputReadOnly
                    ]}
                    value={row.medicines_given}
                    onChangeText={(text) => updateRowField(index, 'medicines_given', text)}
                    placeholder="List medicines administered..."
                    multiline
                    numberOfLines={2}
                    editable={canEdit && row.isEditing}
                  />

                  <Text style={styles.fieldLabel}>Instructions</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.multilineInput,
                      !row.isEditing && styles.textInputReadOnly
                    ]}
                    value={row.instructions}
                    onChangeText={(text) => updateRowField(index, 'instructions', text)}
                    placeholder="Instructions for the patient..."
                    multiline
                    numberOfLines={2}
                    editable={canEdit && row.isEditing}
                  />
                </View>
              </View>
            ))}
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
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  flex: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  syncButtonText: {
    ...typography.button,
    color: colors.common.white,
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
  rowCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rowHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayBadge: {
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  dayBadgeText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
  },
  dateText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rowContent: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  textInputReadOnly: {
    backgroundColor: colors.grey[100],
    borderColor: colors.grey[300],
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
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
});

export default TreatmentSheetDetailScreen;
