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
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../core/theme/spacing';
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
import { PauseSeriesDialog } from '../components/PauseSeriesDialog';
import { CancelSeriesDialog } from '../components/CancelSeriesDialog';
import { 
  canPauseSeriesApi, 
  pauseSeriesApi, 
  canResumeSeriesApi, 
  resumeSeriesApi, 
  canCancelSeriesApi, 
  cancelSeriesApi 
} from '../../../treatmentProposals/data/api/lifecycleApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchedulingWizardStore } from '../../../treatmentProposals/presentation/stores/schedulingWizard.store';
import { SchedulingWizard } from '../../../treatmentProposals/presentation/pages/SchedulingWizard';

interface RowFormData {
  id: string;
  day_number: number;
  session_date: string | null;
  session_id: string | null;
  scheduled_time: string | null;
  therapist_id: string | null;
  treatment_name: string;
  medicines_text: string;
  instructions_text: string;
  isEditing: boolean;
  isSaving: boolean;
}

export const TreatmentSheetDetailScreen: React.FC = () => {
  const theme = useClinicTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ treatmentSheetId: string; casesheetId?: string }>(); 
  const { currentUser } = useAuth();
  const treatmentSheetId = params.treatmentSheetId || '';
  const tenantId = currentUser?.tenantId || '';

  const [rowsData, setRowsData] = useState<RowFormData[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Lifecycle dialog state
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const queryClient = useQueryClient();
  
  // Scheduling wizard store
  const { openWizardForResume } = useSchedulingWizardStore();

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

  // Lifecycle permission queries
  const { data: canPauseResult } = useQuery({
    queryKey: ['can-pause-series', tenantId, treatmentSheetId],
    queryFn: () => canPauseSeriesApi(tenantId, treatmentSheetId),
    enabled: !!tenantId && !!treatmentSheetId && !!treatmentSheet,
  });

  const { data: canResumeResult } = useQuery({
    queryKey: ['can-resume-series', tenantId, treatmentSheetId],
    queryFn: () => canResumeSeriesApi(tenantId, treatmentSheetId),
    enabled: !!tenantId && !!treatmentSheetId && !!treatmentSheet,
  });

  const { data: canCancelResult } = useQuery({
    queryKey: ['can-cancel-series', tenantId, treatmentSheetId],
    queryFn: () => canCancelSeriesApi(tenantId, treatmentSheetId),
    enabled: !!tenantId && !!treatmentSheetId && !!treatmentSheet,
  });

  // Lifecycle mutations
  const pauseMutation = useMutation({
    mutationFn: (payload: { reason: string; patient_consent: boolean }) =>
      pauseSeriesApi(tenantId, treatmentSheetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-sheet', treatmentSheetId] });
      queryClient.invalidateQueries({ queryKey: ['can-pause-series', tenantId, treatmentSheetId] });
      queryClient.invalidateQueries({ queryKey: ['can-resume-series', tenantId, treatmentSheetId] });
      Alert.alert('Success', 'Treatment series paused successfully');
      setShowPauseDialog(false);
      refetch();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to pause treatment series');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: { reason: string }) =>
      cancelSeriesApi(tenantId, treatmentSheetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-sheet', treatmentSheetId] });
      queryClient.invalidateQueries({ queryKey: ['can-cancel-series', tenantId, treatmentSheetId] });
      Alert.alert('Success', 'Treatment series cancelled successfully');
      setShowCancelDialog(false);
      refetch();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to cancel treatment series');
    },
  });

  // Initialize rows data when treatment sheet loads
  useEffect(() => {
    if (treatmentSheet?.rows) {
      const formattedRows = treatmentSheet.rows.map(row => ({
        id: row.id,
        day_number: row.day_number,
        session_date: row.session_date || null,
        session_id: row.session_id || null,
        scheduled_time: row.scheduled_time || null,
        therapist_id: row.therapist_id || null,
        treatment_name: row.treatment_name || row.treatment_description || '',
        medicines_text: row.medicines_text || row.medicines_given || '',
        instructions_text: row.instructions_text || row.instructions || '',
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

  // Lifecycle handlers
  const handlePause = useCallback(() => {
    setShowPauseDialog(true);
  }, []);

  const handlePauseConfirm = useCallback((reason: string, hasConsent: boolean) => {
    pauseMutation.mutate({ reason, patient_consent: hasConsent });
  }, [pauseMutation]);

  const handleResume = useCallback(() => {
    if (!treatmentSheet) return;
    
    // Calculate remaining days
    const totalDays = treatmentSheet.duration_days || 0;
    const completedDays = rowsData.filter(row => 
      row.treatment_name && row.treatment_name.trim() !== ''
    ).length;
    const remainingDays = Math.max(0, totalDays - completedDays);
    
    // Open scheduling wizard in resume mode
    openWizardForResume(
      treatmentSheetId,
      `Resume: ${treatmentSheet.duration_days} Day Treatment`,
      remainingDays,
      treatmentSheet.agreed_package_cost
    );
  }, [treatmentSheet, rowsData, treatmentSheetId, openWizardForResume]);

  const handleCancel = useCallback(() => {
    setShowCancelDialog(true);
  }, []);

  const handleCancelConfirm = useCallback((reason: string) => {
    cancelMutation.mutate({ reason });
  }, [cancelMutation]);

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
        treatment_name: aboveRow.treatment_name,
        medicines_text: aboveRow.medicines_text,
        instructions_text: aboveRow.instructions_text,
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
          treatment_name: row.treatment_name || null,
          medicines_text: row.medicines_text || null,
          instructions_text: row.instructions_text || null,
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
    <View style={[styles.header, { borderBottomColor: theme.colors.border.subtle }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Treatment Sheet</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
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
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>Loading treatment sheet...</Text>
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
    const paginatedRows = rowsData.slice(0, page * PAGE_SIZE);
    const hasMore = paginatedRows.length < rowsData.length;

    if (rowsData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={theme.colors.text.secondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>No treatment days yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
            The treatment sheet was created but has no rows.
          </Text>
          {canEdit && (
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: theme.colors.primary.default }]}
              onPress={handleSync}
              disabled={syncMutation.isPending}
            >
              <Ionicons name="sync" size={18} color={theme.colors.primary.onPrimary} />
              <Text style={[styles.syncButtonText, { color: theme.colors.primary.onPrimary }]}>
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
              colors={[theme.colors.primary.default]}
              tintColor={theme.colors.primary.default}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Treatment Sheet Header Info */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.background.default, borderColor: theme.colors.border.subtle }]}>
            {/* Name and Date Range */}
            {treatmentSheet.proposal_id && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={16} color={theme.colors.primary.default} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Treatment:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                  {treatmentSheet.duration_days} days
                </Text>
              </View>
            )}
            
            {/* View Original Proposal Link */}
            {treatmentSheet.proposal_id && (
              <TouchableOpacity
                style={styles.proposalLink}
                onPress={() => router.push(`/proposals/${treatmentSheet.proposal_id}`)}
              >
                <Ionicons name="link-outline" size={16} color={theme.colors.primary.default} />
                <Text style={[styles.proposalLinkText, { color: theme.colors.primary.default }]}>
                  View Original Proposal
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Package Cost */}
            {treatmentSheet.agreed_package_cost && (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={16} color={theme.colors.feedback.success} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Package:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.feedback.success, fontWeight: '600' }]}>
                  ₹{treatmentSheet.agreed_package_cost.toLocaleString()}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Created:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{formatDateTime(treatmentSheet.recorded_at)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={theme.colors.feedback.info} />
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Duration:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.feedback.info }]}>
                {treatmentSheet.duration_days} days
              </Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Progress</Text>
            <TreatmentSheetProgress rows={treatmentSheet.rows || []} showDetails />
          </View>

          {/* Treatment Rows - Inline Editable */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Treatment Days ({rowsData.length})</Text>
            </View>

            {paginatedRows.map((row, index) => (
              <View key={row.id} style={[styles.rowCard, { backgroundColor: theme.colors.background.default, borderColor: theme.colors.border.subtle }]}>
                {/* Row Header with Day/Date and Action Icons */}
                <View style={styles.rowHeader}>
                  <View style={styles.rowHeaderLeft}>
                    <View style={[styles.dayBadge, { backgroundColor: theme.colors.primary.default + '15' }]}>
                      <Text style={[styles.dayBadgeText, { color: theme.colors.primary.default }]}>Day {row.day_number}</Text>
                    </View>
                    {row.session_date && (
                      <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>{formatDate(row.session_date)}</Text>
                    )}
                    {row.scheduled_time && (
                      <Text style={[styles.timeText, { color: theme.colors.text.secondary }]}>{row.scheduled_time}</Text>
                    )}
                  </View>
                  
                  {canEdit && (
                    <View style={styles.rowActions}>
                      {/* Edit/Cancel Icon */}
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}
                        onPress={() => toggleEdit(index)}
                        disabled={row.isSaving}
                      >
                        <Ionicons 
                          name={row.isEditing ? "close-circle-outline" : "create-outline"} 
                          size={20} 
                          color={row.isEditing ? theme.colors.feedback.error : theme.colors.primary.default} 
                        />
                      </TouchableOpacity>

                      {/* Save Icon */}
                      {row.isEditing && (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}
                          onPress={() => saveRow(index)}
                          disabled={row.isSaving}
                        >
                          {row.isSaving ? (
                            <ActivityIndicator size="small" color={theme.colors.feedback.success} />
                          ) : (
                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.feedback.success} />
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Copy from Above Icon */}
                      {index > 0 && (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}
                          onPress={() => copyFromAbove(index)}
                          disabled={row.isSaving}
                        >
                          <Ionicons name="copy-outline" size={20} color={theme.colors.feedback.info} />
                        </TouchableOpacity>
                      )}

                      {/* Sync Icon */}
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}
                        onPress={() => syncSingleRow(index)}
                        disabled={row.isSaving}
                      >
                        <Ionicons name="sync-outline" size={20} color={theme.colors.feedback.warning} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Row Content - Always Visible */}
                <View style={styles.rowContent}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>Treatment Description</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.multilineInput,
                      { 
                        backgroundColor: row.isEditing ? theme.colors.background.elevated : theme.colors.background.muted,
                        borderColor: row.isEditing ? theme.colors.border.subtle : theme.colors.border.subtle,
                        color: theme.colors.text.primary
                      }
                    ]}
                    value={row.treatment_name}
                    onChangeText={(text) => updateRowField(index, 'treatment_name', text)}
                    placeholder="Describe the treatment performed..."
                    placeholderTextColor={theme.colors.text.disabled}
                    multiline
                    numberOfLines={3}
                    editable={canEdit && row.isEditing}
                  />

                  <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>Medicines Given</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.multilineInput,
                      { 
                        backgroundColor: row.isEditing ? theme.colors.background.elevated : theme.colors.background.muted,
                        borderColor: row.isEditing ? theme.colors.border.subtle : theme.colors.border.subtle,
                        color: theme.colors.text.primary
                      }
                    ]}
                    value={row.medicines_text}
                    onChangeText={(text) => updateRowField(index, 'medicines_text', text)}
                    placeholder="List medicines administered..."
                    placeholderTextColor={theme.colors.text.disabled}
                    multiline
                    numberOfLines={2}
                    editable={canEdit && row.isEditing}
                  />

                  <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>Instructions</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.multilineInput,
                      { 
                        backgroundColor: row.isEditing ? theme.colors.background.elevated : theme.colors.background.muted,
                        borderColor: row.isEditing ? theme.colors.border.subtle : theme.colors.border.subtle,
                        color: theme.colors.text.primary
                      }
                    ]}
                    value={row.instructions_text}
                    onChangeText={(text) => updateRowField(index, 'instructions_text', text)}
                    placeholder="Instructions for the patient..."
                    placeholderTextColor={theme.colors.text.disabled}
                    multiline
                    numberOfLines={2}
                    editable={canEdit && row.isEditing}
                  />
                </View>
              </View>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { backgroundColor: theme.colors.primary.default }]}
                onPress={() => setPage(prev => prev + 1)}
              >
                <Text style={[styles.loadMoreText, { color: theme.colors.primary.onPrimary }]}>
                  Load More Days ({paginatedRows.length} of {rowsData.length})
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.primary.onPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          <View style={[styles.actionsContainer, { borderTopColor: theme.colors.border.subtle }]}>
            <Text style={[styles.actionsTitle, { color: theme.colors.text.secondary }]}>Actions</Text>
            
            {/* Sign Sheet Button (Doctor only, all rows complete) */}
            {currentUser?.role === 'DOCTOR' && 
             treatmentSheet.status !== 'SIGNED' && 
             rowsData.every(r => r.treatment_name) && (
              <TouchableOpacity
                style={[styles.signButton, { backgroundColor: theme.colors.feedback.success }]}
                onPress={() => {
                  Alert.alert(
                    'Sign Treatment Sheet',
                    'Are you sure you want to sign this treatment sheet? Once signed, it cannot be edited.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Sign',
                        onPress: () => handleTransition('SIGNED' as TreatmentSheetStatus),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="create-outline" size={20} color={theme.colors.primary.onPrimary} />
                <Text style={[styles.signButtonText, { color: theme.colors.primary.onPrimary }]}>
                  Sign Sheet
                </Text>
              </TouchableOpacity>
            )}

            {/* Lifecycle Management Buttons */}
            <View style={styles.lifecycleButtons}>
              {/* Pause Button */}
              {canPauseResult?.allowed && (
                <TouchableOpacity
                  style={[styles.lifecycleButton, { backgroundColor: theme.colors.feedback.warning }]}
                  onPress={handlePause}
                  disabled={pauseMutation.isPending}
                >
                  <Ionicons name="pause-circle-outline" size={20} color={theme.colors.primary.onPrimary} />
                  <Text style={[styles.lifecycleButtonText, { color: theme.colors.primary.onPrimary }]}>
                    Pause Series
                  </Text>
                </TouchableOpacity>
              )}

              {/* Resume Button */}
              {canResumeResult?.allowed && (
                <TouchableOpacity
                  style={[styles.lifecycleButton, { backgroundColor: theme.colors.primary.default }]}
                  onPress={handleResume}
                >
                  <Ionicons name="play-circle-outline" size={20} color={theme.colors.primary.onPrimary} />
                  <Text style={[styles.lifecycleButtonText, { color: theme.colors.primary.onPrimary }]}>
                    Resume Series
                  </Text>
                </TouchableOpacity>
              )}

              {/* Cancel Button */}
              {canCancelResult?.allowed && (
                <TouchableOpacity
                  style={[styles.lifecycleButton, { backgroundColor: theme.colors.feedback.error }]}
                  onPress={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  <Ionicons name="close-circle-outline" size={20} color={theme.colors.primary.onPrimary} />
                  <Text style={[styles.lifecycleButtonText, { color: theme.colors.primary.onPrimary }]}>
                    Cancel Series
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
      {renderHeader()}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Pause Series Dialog */}
      <PauseSeriesDialog
        visible={showPauseDialog}
        treatmentName={treatmentSheet?.duration_days ? `${treatmentSheet.duration_days} Day Treatment` : 'Treatment Series'}
        billingImpact={undefined} // TODO: Calculate billing impact from backend
        onConfirm={handlePauseConfirm}
        onCancel={() => setShowPauseDialog(false)}
        loading={pauseMutation.isPending}
      />

      {/* Cancel Series Dialog */}
      <CancelSeriesDialog
        visible={showCancelDialog}
        treatmentName={treatmentSheet?.duration_days ? `${treatmentSheet.duration_days} Day Treatment` : 'Treatment Series'}
        billingImpact={undefined} // TODO: Calculate billing impact from backend
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelDialog(false)}
        loading={cancelMutation.isPending}
      />

      {/* Scheduling Wizard for Resume */}
      <SchedulingWizard />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 14,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  proposalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  proposalLinkText: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  rowCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 12,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
  },
  rowContent: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
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
  actionsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  actionsTitle: {
    fontSize: 14,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  signButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lifecycleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  lifecycleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
  },
  lifecycleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TreatmentSheetDetailScreen;
