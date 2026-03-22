/**
 * TherapistDashboardScreen
 *
 * Uses the dedicated therapist sessions endpoint (getTherapistSessionsApi)
 * which returns only this therapist's sessions, filtered by date.
 * Each session carries row_id directly — no secondary lookup needed.
 *
 * Requirements: 1.1–1.5, 2.1, 3.1, 3.3, 3.4, 4.1, 4.3, 4.5,
 *               5.1–5.5, 6.1, 6.2, 6.6, 9.1, 10.1, 11.1, 12.6
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

import { useAuth } from '../../../auth/presentation/hooks/useAuth';

// Data layer
import {
  useTherapistSessionsQuery,
  useSheetRowUsablesQuery,
  useCompleteSheetRowMutation,
  staffDashboardsKeys,
} from '../../../staffDashboards/data/repositories/staffDashboards.repository.impl';
import { TherapistSessionItemV2 } from '../../../staffDashboards/data/models/staffDashboards.dtos';
import { useUpdateAppointmentStatusMutation } from '../../../appointments/data/repositories/appointments.repository.impl';

// Domain / use cases
import { useGetTherapistDashboard } from '../../domain/usecases/get-therapist-dashboard.usecase';

// Presentation components
import { TherapistDashboardSummary } from '../components/TherapistDashboardSummary';
import { TreatmentSessionCompleteModal } from '../components/TreatmentSessionCompleteModal';
import { TherapistKpiSection } from '../components/TherapistKpiSection';
import { LeaveSection } from '../components/LeaveSection';
import { HrSection } from '../components/HrSection';
import { AppointmentListItem } from '../../../appointments/presentation/components/AppointmentListItem';
import { AppointmentResponse } from '../../../appointments/data/models/appointments.dtos';

import { DateStrip } from '../../../../core/components/DateStrip';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { useTherapistDashboardDate } from '../../../staffDashboards/presentation/hooks/useDashboardDate';
import { therapistKeys } from '../../../staffDashboards/data/repositories/staffDashboards.repository.impl';

// Leave / HR data
import {
  useTherapistLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useCancelLeaveRequestMutation,
} from '../../data/repositories/therapistDashboard.repository.impl';
import { getPendingLeaveCount } from '../../domain/entities/therapistDashboard.entity';
import { StaffLeaveCreate } from '../../data/models/therapistDashboard.dtos';

// ============================================
// HELPERS
// ============================================

/**
 * Map a TherapistSessionItemV2 to the AppointmentResponse shape
 * expected by AppointmentListItem.
 *
 * scheduled_time / scheduled_end_time: full ISO strings with timezone offset.
 *   Passed directly as appointment_start/end — formatTime() handles UTC conversion.
 * all_therapist_names: all assigned therapists joined with ", " for display.
 */
function sessionToAppointment(
  session: TherapistSessionItemV2,
  tenantId: string
): AppointmentResponse {
  // Build a valid ISO datetime from "HH:MM:SS" + session_date, or pass through full ISO.
  const buildIso = (timeField: string | null): string | null => {
    if (!timeField) return null;
    const isFullIso = timeField.includes('T') || timeField.includes('+');
    if (isFullIso) return timeField;
    const dateBase = session.session_date ?? new Date().toISOString().split('T')[0];
    return `${dateBase}T${timeField}`;
  };

  const appointmentStart = buildIso(session.scheduled_time) ?? session.session_date ?? new Date().toISOString();
  const appointmentEnd = buildIso(session.scheduled_end_time);

  const cardId = session.row_id ?? session.appointment_id ?? '';

  // Build display name: all assigned therapists, falling back to the logged-in one
  const staffDisplayName =
    session.all_therapist_names && session.all_therapist_names.length > 0
      ? session.all_therapist_names.join(', ')
      : (session.therapist_name ?? undefined);

  return {
    id: cardId,
    tenant_id: tenantId,
    client_id: '',
    doctor_id: null,
    therapist_ids: [],
    room_id: null,
    treatment_id: null,
    appointment_start: appointmentStart,
    appointment_end: appointmentEnd,
    status: session.status ?? 'scheduled',
    notes: null,
    is_active: true,
    created_at: '',
    appointment_type: null,
    series_id: null,
    client_name: session.client_name ?? undefined,
    treatment_name: session.treatment_name ?? undefined,
    staff_name: staffDisplayName,
  } as AppointmentResponse & { staff_name?: string };
}

// ============================================
// COMPONENT
// ============================================

export const TherapistDashboardScreen: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, logout } = useAuth();

  // ── Auth context ──────────────────────────────────────────────────────────
  const tenantId: string = currentUser?.tenantId ?? '';
  const staffId: string = currentUser?.userId ?? '';
  const displayName: string = currentUser?.fullName ?? '';
  const userRole: string = (currentUser?.roles?.[0] ?? '').toLowerCase();

  // ── RBAC guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    if (userRole === 'therapist') return;

    if (userRole === 'doctor') {
      router.replace('/doctor');
    } else if (
      userRole === 'clinic admin' ||
      userRole === 'clinic_admin' ||
      userRole === 'receptionist' ||
      userRole === 'tenant admin' ||
      userRole === 'tenant_admin'
    ) {
      router.replace('/clinic-admin');
    } else if (currentUser.isOrgAdmin) {
      router.replace('/super-admin');
    } else {
      router.replace('/');
    }
  }, [currentUser, userRole, router]);

  // ── Completion flow state ─────────────────────────────────────────────────
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [usablesError, setUsablesError] = useState<string | null>(null);

  // ── Date selection ────────────────────────────────────────────────────────
  const {
    selectedDate: therapistSelectedDate,
    setSelectedDate: setTherapistSelectedDate,
    selectedDateStr,
    isToday,
  } = useTherapistDashboardDate();

  // ── Dashboard summary ─────────────────────────────────────────────────────
  // Only used for averageRating — all session counts are derived from sessionsData below.
  const {
    data: dashboardData,
    isError: isDashboardError,
  } = useGetTherapistDashboard(tenantId, displayName);

  // ── Sessions list — dedicated therapist endpoint, filtered by date ─────────
  // This endpoint returns ONLY this therapist's sessions (server-side filtered).
  // Each item has row_id directly — no secondary lookup needed.
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
  } = useTherapistSessionsQuery(
    tenantId,
    { date: selectedDateStr },
    { enabled: !!tenantId }
  );

  // Derive summary stats from sessions — no extra network call needed
  const sessionItems = sessionsData?.items ?? [];
  const totalSessions = sessionsData?.total ?? sessionItems.length;
  const completedSessions = sessionItems.filter((s) => s.status === 'completed').length;
  const pendingSessions = sessionItems.filter(
    (s) => s.status === 'scheduled' || s.status === 'in_progress'
  ).length;

  // ── Usables fetch (fetches when a row is selected, modal opens immediately) ─
  const {
    data: usablesData,
  } = useSheetRowUsablesQuery(tenantId, selectedRowId, {
    enabled: !!tenantId && !!selectedRowId,
  });

  // ── Completion mutation (multi-day: sheet row) ────────────────────────────
  const {
    mutate: completeRow,
    submitStatus,
    errorMessage: completionError,
    reset: resetCompletion,
  } = useCompleteSheetRowMutation(tenantId);

  // ── Completion mutation (single-day: appointment status) ──────────────────
  const updateStatusMutation = useUpdateAppointmentStatusMutation();

  useEffect(() => {
    if (submitStatus === 'conflict') {
      setCompletionModalOpen(false);
      setSelectedRowId(null);
      setSelectedAppointmentId(null);
      resetCompletion();
    }
  }, [submitStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Leave ─────────────────────────────────────────────────────────────────
  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const {
    data: leaveData,
    isLoading: isLeaveLoading,
  } = useTherapistLeaveRequestsQuery(tenantId, staffId, undefined, {
    enabled: !!tenantId && !!staffId,
  });

  const createLeaveMutation = useCreateLeaveRequestMutation(tenantId, staffId);
  const cancelLeaveMutation = useCancelLeaveRequestMutation(tenantId, staffId);

  const leaves = leaveData?.items ?? [];
  const pendingLeaveCount = getPendingLeaveCount(leaves);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: staffDashboardsKeys.therapist(tenantId),
        }),
        queryClient.invalidateQueries({
          queryKey: ['staffDashboards', 'therapist', 'sessions', tenantId],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ['staffDashboards', 'therapist', 'kpis', tenantId],
          exact: false,
        }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, tenantId]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  }, [logout]);

  /** Shared helper — invalidates sessions + KPIs after any completion */
  const invalidateAfterCompletion = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['staffDashboards', 'therapist', 'sessions', tenantId],
      exact: false,
    });
    queryClient.invalidateQueries({
      queryKey: staffDashboardsKeys.therapist(tenantId),
    });
    queryClient.invalidateQueries({
      queryKey: ['staffDashboards', 'therapist', 'kpis', tenantId],
      exact: false,
    });
  }, [queryClient, tenantId]);

  /**
   * Called by AppointmentListItem's onComplete(cardId).
   * cardId = row_id (multi-day) or appointment_id (single-day).
   * - Multi-day: opens materials modal → completeSheetRowApi
   * - Single-day: shows confirmation → updateAppointmentStatusApi
   */
  const handleAppointmentComplete = useCallback(
    (cardId: string) => {
      const session = (sessionsData?.items ?? []).find(
        (s) => (s.row_id ?? s.appointment_id) === cardId
      );

      setUsablesError(null);
      setSelectedRowId(session?.row_id ?? null);
      setSelectedAppointmentId(session?.appointment_id ?? null);
      setCompletionModalOpen(true);
    },
    [sessionsData?.items]
  );

  const handleModalClose = useCallback(() => {
    setCompletionModalOpen(false);
    setSelectedRowId(null);
    setSelectedAppointmentId(null);
    resetCompletion();
  }, [resetCompletion]);

  const handleModalSubmit = useCallback(
    async (payload: Parameters<typeof completeRow>[0]['payload']) => {
      if (selectedRowId) {
        // Multi-day: complete the sheet row (records materials server-side)
        completeRow({ rowId: selectedRowId, payload });
      } else if (selectedAppointmentId) {
        // Single-day: mark appointment completed
        updateStatusMutation.mutate(
          { appointmentId: selectedAppointmentId, status: 'COMPLETED' },
          {
            onSuccess: () => {
              setCompletionModalOpen(false);
              setSelectedAppointmentId(null);
              invalidateAfterCompletion();
            },
            onError: (err: any) => {
              Alert.alert('Error', err?.message || 'Failed to complete session.');
            },
          }
        );
      }
    },
    [completeRow, selectedRowId, selectedAppointmentId, updateStatusMutation, invalidateAfterCompletion]
  );

  const handleApplyLeave = useCallback(
    async (payload: StaffLeaveCreate) => {
      await createLeaveMutation.mutateAsync(payload);
    },
    [createLeaveMutation]
  );

  const handleCancelLeave = useCallback(
    async (leaveId: string) => {
      try {
        await cancelLeaveMutation.mutateAsync(leaveId);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to cancel leave request');
      }
    },
    [cancelLeaveMutation]
  );

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (!tenantId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centeredFull}>
          <ActivityIndicator size="large" color={colors.primary.main} accessibilityLabel="Loading dashboard" />
        </View>
      </SafeAreaView>
    );
  }

  if (isDashboardError) {
    // Non-fatal — summary stats are derived from sessions, so just log and continue
    console.warn('[TherapistDashboard] Dashboard endpoint error — using session-derived stats');
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const initialMaterials = usablesData?.items ?? [];

  const modalSubmitStatus: 'idle' | 'completing' | 'error' =
    submitStatus === 'completing'
      ? 'completing'
      : submitStatus === 'error' || submitStatus === 'partial_error'
      ? 'error'
      : 'idle';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Therapist Dashboard"
        subtitle={`Welcome, ${displayName}`}
        onNotificationPress={() => router.push('/notifications' as any)}
        onProfilePress={() => router.push('/profile' as any)}
        onLogoutPress={handleLogout}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Dashboard Summary */}
        <TherapistDashboardSummary
          displayName={displayName}
          totalSessions={totalSessions}
          completedSessions={completedSessions}
          pendingSessions={pendingSessions}
          averageRating={dashboardData?.averageRating ?? null}
          isLoading={isSessionsLoading}
        />

        {/* Usables error banner */}
        {usablesError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{usablesError}</Text>
          </View>
        ) : null}

        {/* Date strip */}
        <View style={styles.dateStripSection}>
          <DateStrip
            selectedDate={therapistSelectedDate}
            onDateChange={setTherapistSelectedDate}
          />
        </View>

        {/* Sessions list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isToday
              ? "Today's Sessions"
              : `Sessions — ${therapistSelectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </Text>

          {isSessionsLoading ? (
            <View style={styles.centeredSection}>
              <ActivityIndicator size="small" color={colors.primary.main} accessibilityLabel="Loading sessions" />
            </View>
          ) : (sessionsData?.items ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isToday
                  ? 'No sessions scheduled for today.'
                  : `No sessions on ${therapistSelectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`}
              </Text>
            </View>
          ) : (
          (sessionsData?.items ?? []).map((session) => (
              <AppointmentListItem
                key={session.row_id ?? session.appointment_id ?? session.id}
                appointment={sessionToAppointment(session, tenantId)}
                onPress={undefined}
                showActions={true}
                userRole="therapist"
                onComplete={handleAppointmentComplete}
              />
            ))
          )}
        </View>

        {/* KPI Section */}
        <View style={styles.section}>
          <TherapistKpiSection tenantId={tenantId} staffId={staffId} isLoading={false} />
        </View>

        {/* Leave Section */}
        <View style={styles.section}>
          <LeaveSection
            leaves={leaves}
            pendingCount={pendingLeaveCount}
            isLoading={isLeaveLoading}
            onApplyLeave={handleApplyLeave}
            onCancelLeave={handleCancelLeave}
            isSubmitting={createLeaveMutation.isPending}
            externalOpen={openLeaveModal}
            onExternalOpenHandled={() => setOpenLeaveModal(false)}
          />
        </View>

        {/* HR Section */}
        <View style={styles.section}>
          <HrSection
            onLeavePress={() => setOpenLeaveModal(true)}
            onDocumentsPress={() => Alert.alert('Not Available', 'Document management is not available in this environment.')}
            onBankDetailsPress={() => Alert.alert('Not Available', 'Bank details management is not available in this environment.')}
            onPayslipsPress={() => Alert.alert('Not Available', 'Salary slips are not available in this environment.')}
          />
        </View>
      </ScrollView>

      {/* Completion Modal */}
      {completionModalOpen ? (
        <TreatmentSessionCompleteModal
          visible={completionModalOpen}
          rowId={selectedRowId}
          initialMaterials={initialMaterials}
          onSubmit={handleModalSubmit}
          onClose={handleModalClose}
          isSubmitting={submitStatus === 'completing' || updateStatusMutation.isPending}
          submitStatus={modalSubmitStatus}
          errorMessage={completionError}
        />
      ) : null}
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  centeredFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  centeredSection: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  accessDeniedTitle: {
    ...typography.h5,
    color: colors.error.main,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  accessDeniedMessage: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  backButtonText: {
    ...typography.button,
    color: colors.common.white,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.error.main + '15',
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error.main + '40',
  },
  errorBannerText: {
    ...typography.body2,
    color: colors.error.main,
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  dateStripSection: {
    marginTop: spacing.md,
  },
});

export default TherapistDashboardScreen;
