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
import { axiosClient } from '../../../../core/api/axiosClient';
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
} from '../../data/api/lifecycleApi';
import { PauseSeriesDTO } from '../../data/models/lifecycle.dtos';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  isSaving: boolean;
  isEditing: boolean; // Track if this specific row is in edit mode
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
  const [hasBeenSavedOnce, setHasBeenSavedOnce] = useState(false); // Track if global save has been done
  const [isSavingAll, setIsSavingAll] = useState(false); // Track global save operation

  // Episode and client data for header
  const [episodeData, setEpisodeData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [isLoadingHeaderData, setIsLoadingHeaderData] = useState(false);

  // Lifecycle dialog state
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: treatmentSheet,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTreatmentSheetDetailQuery(treatmentSheetId, tenantId);

  const transitionMutation = useTransitionTreatmentSheetStatusMutation(treatmentSheetId);
  const syncMutation = useSyncTreatmentSheetMutation(tenantId, treatmentSheetId);
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
    mutationFn: (payload: PauseSeriesDTO) =>
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
      // Check if any row has content (has been saved before)
      const hasContent = treatmentSheet.rows.some(row => 
        row.treatment_description || row.medicines_given || row.instructions
      );
      
      // Set hasBeenSavedOnce based on whether rows have content
      setHasBeenSavedOnce(hasContent);
      
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
        isSaving: false,
        isEditing: !hasContent, // Not editable if content exists
      }));
      setRowsData(formattedRows);
    }
  }, [treatmentSheet]);

  // Fetch episode and client data for header
  useEffect(() => {
    const fetchHeaderData = async () => {
      if (!treatmentSheet?.episode_id || !tenantId) return;
      
      setIsLoadingHeaderData(true);
      try {
        // Fetch episode
        const episodeResponse = await axiosClient.get(
          `/api/v1/clinic/${tenantId}/episodes/${treatmentSheet.episode_id}`
        );
        setEpisodeData(episodeResponse.data);
        
        // Fetch client
        if (episodeResponse.data.client_id) {
          const clientResponse = await axiosClient.get(
            `/api/v1/clinic/${tenantId}/clients/${episodeResponse.data.client_id}`
          );
          setClientData(clientResponse.data);
        }
      } catch (error) {
        console.error('[TreatmentSheet] Failed to fetch header data:', error);
      } finally {
        setIsLoadingHeaderData(false);
      }
    };
    
    fetchHeaderData();
  }, [treatmentSheet?.episode_id, tenantId]);

  const handleTransition = useCallback(async (newStatus: TreatmentSheetStatus) => {
    try {
      await transitionMutation.mutateAsync({ status: newStatus });
      Alert.alert('Success', `Treatment sheet ${newStatus.toLowerCase()} successfully.`);
      // Refetch to update the UI with new status
      await refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status.');
    }
  }, [transitionMutation, refetch]);

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

  const handleScheduleAppointments = useCallback(() => {
    if (!treatmentSheet) return;
    
    // Fetch episode to get treatment_id
    const fetchEpisodeAndNavigate = async () => {
      try {
        const episodeResponse = await axiosClient.get(
          `/api/v1/clinic/${tenantId}/episodes/${treatmentSheet.episode_id}`
        );
        const episode = episodeResponse.data;
        
        // Navigate to CreateAppointmentScreen with MULTI tab pre-selected
        // Pass all necessary data for pre-filling the form
        router.push({
          pathname: '/clinic-admin/appointments/create',
          params: {
            tab: 'MULTI',
            treatmentSheetId: treatmentSheetId,
            episodeId: treatmentSheet.episode_id,
            treatmentId: episode.treatment_id || '',
            treatmentName: episode.title || '',
            durationDays: treatmentSheet.duration_days?.toString(),
          }
        });
      } catch (error) {
        console.error('[TreatmentSheet] Failed to fetch episode:', error);
        // Navigate anyway with available data
        router.push({
          pathname: '/clinic-admin/appointments/create',
          params: {
            tab: 'MULTI',
            treatmentSheetId: treatmentSheetId,
            episodeId: treatmentSheet.episode_id,
            durationDays: treatmentSheet.duration_days?.toString(),
          }
        });
      }
    };
    
    fetchEpisodeAndNavigate();
  }, [treatmentSheet, treatmentSheetId, router, tenantId]);

  const handlePauseConfirm = useCallback((reason: string, hasConsent: boolean) => {
    pauseMutation.mutate({ 
      reason, 
      patient_consent: hasConsent,
      billing_acknowledged: true // Acknowledge billing implications
    });
  }, [pauseMutation]);

  const handleResume = useCallback(() => {
    if (!treatmentSheet) return;
    
    // Calculate remaining days
    const totalDays = treatmentSheet.duration_days || 0;
    const completedDays = rowsData.filter(row => 
      row.treatment_name && row.treatment_name.trim() !== ''
    ).length;
    const remainingDays = Math.max(0, totalDays - completedDays);
    
    // Navigate to CreateAppointmentScreen with MULTI tab for remaining days
    router.push({
      pathname: '/clinic-admin/appointments/create',
      params: {
        tab: 'MULTI',
        treatmentSheetId: treatmentSheetId,
        episodeId: treatmentSheet.episode_id,
        durationDays: remainingDays.toString(),
      }
    });
  }, [treatmentSheet, rowsData, treatmentSheetId, router]);

  const handleCancel = useCallback(() => {
    setShowCancelDialog(true);
  }, []);

  const handleCancelConfirm = useCallback((reason: string) => {
    cancelMutation.mutate({ reason });
  }, [cancelMutation]);

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
      };
      return updated;
    });
  };

  // Toggle edit mode for a specific row
  const toggleEditMode = (index: number) => {
    setRowsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isEditing: !updated[index].isEditing };
      return updated;
    });
  };

  // Update a single row using PATCH API
  const updateSingleRow = async (index: number) => {
    const row = rowsData[index];
    
    // Set saving state
    setRowsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isSaving: true };
      return updated;
    });

    try {
      // Use single row update API
      await axiosClient.patch(
        `/api/v1/clinic/treatment-sheets/rows/${row.id}`,
        {
          treatment_description: row.treatment_name || null,
          medicines_given: row.medicines_text || null,
          instructions: row.instructions_text || null,
        }
      );
      
      // Update state: stop saving and exit edit mode
      setRowsData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isSaving: false, isEditing: false };
        return updated;
      });
      
      Alert.alert('Success', `Day ${row.day_number} updated successfully.`);
      await refetch();
    } catch (err: any) {
      setRowsData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isSaving: false };
        return updated;
      });
      Alert.alert('Error', err.message || 'Failed to update row.');
    }
  };

  // Save all rows at once (global save) - bulk update
  const saveAllRows = async () => {
    setIsSavingAll(true);
    
    try {
      // Prepare rows data for bulk update
      const rowsPayload = rowsData.map(row => ({
        id: row.id,
        treatment_description: row.treatment_name || null,
        medicines_given: row.medicines_text || null,
        instructions: row.instructions_text || null,
      }));
      
      // Use bulk update API - single call for all rows
      await axiosClient.patch(
        `/api/v1/clinic/treatment-sheets/${treatmentSheetId}/rows`,
        { rows: rowsPayload }
      );
      
      // Mark as saved once and make all rows non-editable
      setHasBeenSavedOnce(true);
      setRowsData(prev => prev.map(row => ({ ...row, isEditing: false })));
      
      Alert.alert('Success', 'All treatment days saved successfully.');
      await refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save all rows.');
    } finally {
      setIsSavingAll(false);
    }
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
          {treatmentSheet?.duration_days || rowsData.length || 0} Days
        </Text>
      </View>
      {treatmentSheet && (
        <View style={styles.headerActions}>
          <TreatmentSheetStatusBadge status={treatmentSheet.status} size="medium" />
          {/* Print Icon */}
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: theme.colors.background.elevated }]}
            onPress={handlePrint}
            disabled={printMutation.isPending}
          >
            <Ionicons name="print-outline" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          {/* Archive Icon */}
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: theme.colors.background.elevated }]}
            onPress={() => {
              Alert.alert(
                'Archive Treatment Sheet',
                'This will archive the treatment sheet. It will no longer appear in the active list. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Archive',
                    style: 'destructive',
                    onPress: handleArchive,
                  },
                ]
              );
            }}
            disabled={archiveMutation.isPending}
          >
            <Ionicons name="archive-outline" size={20} color={theme.colors.feedback.error} />
          </TouchableOpacity>
        </View>
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
            The treatment sheet was created but has no rows. Schedule appointments to create treatment days.
          </Text>
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
            {/* Client Name */}
            {isLoadingHeaderData && !clientData ? (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={theme.colors.text.disabled} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Patient:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.disabled }]}>Loading...</Text>
              </View>
            ) : clientData ? (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={theme.colors.primary.default} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Patient:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary, fontWeight: '600' }]}>
                  {clientData.name || clientData.full_name || 'Unknown'}
                </Text>
              </View>
            ) : null}
            
            {/* Episode Title (Disease/Condition) */}
            {isLoadingHeaderData && !episodeData ? (
              <View style={styles.infoRow}>
                <Ionicons name="medical-outline" size={16} color={theme.colors.text.disabled} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Condition:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.disabled }]}>Loading...</Text>
              </View>
            ) : episodeData ? (
              <View style={styles.infoRow}>
                <Ionicons name="medical-outline" size={16} color={theme.colors.feedback.error} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Condition:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary, fontWeight: '600' }]}>
                  {episodeData.title || 'Not specified'}
                </Text>
              </View>
            ) : null}
            
            {/* Duration */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={theme.colors.feedback.info} />
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Duration:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.feedback.info, fontWeight: '600' }]}>
                {treatmentSheet.duration_days || rowsData.length || 0} days treatment
              </Text>
            </View>
            
            {/* Package Cost */}
            {treatmentSheet.agreed_package_cost && (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={16} color={theme.colors.feedback.success} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Package Cost:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.feedback.success, fontWeight: '600' }]}>
                  ₹{treatmentSheet.agreed_package_cost.toLocaleString()}
                </Text>
              </View>
            )}
            
            {/* Created Date */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>Created:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{formatDateTime(treatmentSheet.recorded_at)}</Text>
            </View>
          </View>

          {/* Schedule Appointments Button or Schedule Summary */}
          {treatmentSheet.status === 'DRAFT' && (
            <>
              {/* Check if rows are synced (have session_id) */}
              {rowsData.some(row => row.session_id) ? (
                // Show schedule summary
                <View style={[styles.scheduleSummaryCard, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}>
                  <View style={styles.scheduleSummaryHeader}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.feedback.success} />
                    <Text style={[styles.scheduleSummaryTitle, { color: theme.colors.text.primary }]}>
                      Appointments Scheduled
                    </Text>
                  </View>
                  <Text style={[styles.scheduleSummaryText, { color: theme.colors.text.secondary }]}>
                    {rowsData.filter(row => row.session_id).length} of {rowsData.length} sessions have been scheduled
                  </Text>
                  {rowsData.filter(row => row.session_date).length > 0 && (
                    <View style={styles.scheduleSummaryDates}>
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={[styles.scheduleSummaryDatesText, { color: theme.colors.text.secondary }]}>
                        {formatDate(rowsData.find(row => row.session_date)?.session_date || '')} - {formatDate(rowsData[rowsData.length - 1]?.session_date || '')}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.viewAppointmentsButton, { backgroundColor: theme.colors.primary.default }]}
                    onPress={() => router.push('/clinic-admin/appointments' as any)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="list" size={18} color={theme.colors.primary.onPrimary} />
                    <Text style={[styles.viewAppointmentsButtonText, { color: theme.colors.primary.onPrimary }]}>
                      View All Appointments
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Show schedule button
                <TouchableOpacity
                  style={[styles.scheduleButton, { backgroundColor: theme.colors.primary.default }]}
                  onPress={handleScheduleAppointments}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar" size={20} color={theme.colors.primary.onPrimary} />
                  <Text style={[styles.scheduleButtonText, { color: theme.colors.primary.onPrimary }]}>
                    Schedule Appointments
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Progress */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Progress</Text>
            <TreatmentSheetProgress rows={treatmentSheet.rows || []} showDetails />
          </View>

          {/* Treatment Rows - Inline Editable */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Treatment Days ({rowsData.length})</Text>
              {/* Global Save All Button - always show when editable */}
              {canEdit && rowsData.length > 0 && (
                <TouchableOpacity
                  style={[styles.saveAllButton, { backgroundColor: theme.colors.feedback.success }]}
                  onPress={saveAllRows}
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
              )}
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
                      {/* Show Edit button when not editing and has been saved once */}
                      {!row.isEditing && hasBeenSavedOnce && (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}
                          onPress={() => toggleEditMode(index)}
                        >
                          <Ionicons name="create-outline" size={20} color={theme.colors.primary.default} />
                        </TouchableOpacity>
                      )}

                      {/* Show Update button when editing */}
                      {row.isEditing && (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}
                          onPress={() => updateSingleRow(index)}
                          disabled={row.isSaving}
                        >
                          {row.isSaving ? (
                            <ActivityIndicator size="small" color={theme.colors.feedback.success} />
                          ) : (
                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.feedback.success} />
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Copy from Above Icon - only show when editing */}
                      {row.isEditing && index > 0 && (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}
                          onPress={() => copyFromAbove(index)}
                          disabled={row.isSaving}
                        >
                          <Ionicons name="copy-outline" size={20} color={theme.colors.feedback.info} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {/* Row Content - Conditionally Editable */}
                <View style={styles.rowContent}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>Treatment Description</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      styles.multilineInput,
                      { 
                        backgroundColor: row.isEditing ? theme.colors.background.elevated : theme.colors.background.default,
                        borderColor: theme.colors.border.subtle,
                        color: theme.colors.text.primary,
                        opacity: row.isEditing ? 1 : 0.7,
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
                        backgroundColor: row.isEditing ? theme.colors.background.elevated : theme.colors.background.default,
                        borderColor: theme.colors.border.subtle,
                        color: theme.colors.text.primary,
                        opacity: row.isEditing ? 1 : 0.7,
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
                        backgroundColor: row.isEditing ? theme.colors.background.elevated : theme.colors.background.default,
                        borderColor: theme.colors.border.subtle,
                        color: theme.colors.text.primary,
                        opacity: row.isEditing ? 1 : 0.7,
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
            
            {/* Lifecycle Management Buttons - Cancel and Finalize in one row */}
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
              
              {/* Finalize Button */}
              {treatmentSheet.status !== 'FINAL' && treatmentSheet.status !== 'SIGNED' && (
                <TouchableOpacity
                  style={[styles.lifecycleButton, { backgroundColor: theme.colors.feedback.success }]}
                  onPress={() => {
                    Alert.alert(
                      'Finalize Treatment Sheet',
                      'Are you sure you want to finalize this treatment sheet?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Finalize',
                          onPress: () => handleTransition('FINAL' as TreatmentSheetStatus),
                        },
                      ]
                    );
                  }}
                  disabled={transitionMutation.isPending}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary.onPrimary} />
                  <Text style={[styles.lifecycleButtonText, { color: theme.colors.primary.onPrimary }]}>
                    Finalize
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconButton: {
    padding: spacing.xs,
    borderRadius: 6,
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
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleSummaryCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  scheduleSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  scheduleSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleSummaryText: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  scheduleSummaryDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  scheduleSummaryDatesText: {
    fontSize: 13,
  },
  viewAppointmentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  viewAppointmentsButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
