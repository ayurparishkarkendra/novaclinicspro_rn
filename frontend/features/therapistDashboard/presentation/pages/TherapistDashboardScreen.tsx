/**
 * Therapist Dashboard Screen
 * Main dashboard page for therapists with worklist, KPIs, HR self-service, and learning
 * 
 * API Support Summary:
 * - Worklist/Schedule: SUPPORTED via therapist dashboard API
 * - KPIs: SUPPORTED (derived from worklist data)
 * - Leave Requests: SUPPORTED via staff leave API
 * - Documents: NOT SUPPORTED - shows disabled state
 * - Bank Details: NOT SUPPORTED - shows disabled state
 * - Salary/Payslips: NOT SUPPORTED - shows disabled state
 * - Learning: NOT SUPPORTED - shows coming soon state
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { OnLeaveBanner, EmptyDashboardState } from '../../../staffDashboards';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { t, ErrorTokens } from '../../../../core/localization';

// Feature imports
import {
  useTherapistWorklistQuery,
  useTherapistKpisQuery,
  useTherapistLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useCancelLeaveRequestMutation,
} from '../../data/repositories/therapistDashboard.repository.impl';
import {
  WorklistPeriod,
  filterSessionsByPeriod,
  StaffLeaveCreate,
} from '../../data/models/therapistDashboard.dtos';
import { kpiSummaryToMetrics, getPendingLeaveCount } from '../../domain/entities/therapistDashboard.entity';

// Components
import { TherapistKpiRow } from '../components/TherapistKpiRow';
import { WorklistSection } from '../components/WorklistSection';
import { HrSection } from '../components/HrSection';
import { LeaveSection } from '../components/LeaveSection';
import { LearningSection } from '../components/LearningSection';
import { StaffFeedbackSection } from '../../../feedback';

export const TherapistDashboardScreen: React.FC = () => {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  
  // For leave API, we need staffId. In real app, this would come from auth context
  // For now, we'll use a placeholder since the backend uses /me/ endpoint
  const staffId = currentUser?.userId || '';

  // State
  const [worklistPeriod, setWorklistPeriod] = useState<WorklistPeriod>('today');
  const [kpiPeriod, setKpiPeriod] = useState<WorklistPeriod>('today');
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Queries
  const {
    data: dashboardData,
    isLoading: isWorklistLoading,
    isError: isWorklistError,
    error: worklistError,
    refetch: refetchWorklist,
    isRefetching: isWorklistRefetching,
  } = useTherapistWorklistQuery(tenantId, undefined, {
    enabled: !!tenantId,
  });

  const {
    data: kpiData,
    isLoading: isKpiLoading,
  } = useTherapistKpisQuery(tenantId, kpiPeriod, {
    enabled: !!tenantId,
  });

  const {
    data: leaveData,
    isLoading: isLeaveLoading,
    refetch: refetchLeave,
  } = useTherapistLeaveRequestsQuery(tenantId, staffId, undefined, {
    enabled: !!tenantId && !!staffId,
  });

  // Mutations
  const createLeaveMutation = useCreateLeaveRequestMutation(tenantId, staffId);
  const cancelLeaveMutation = useCancelLeaveRequestMutation(tenantId, staffId);

  // Derived data
  const filteredSessions = useMemo(() => {
    if (!dashboardData?.sessions) return [];
    return filterSessionsByPeriod(dashboardData.sessions, worklistPeriod);
  }, [dashboardData?.sessions, worklistPeriod]);

  const kpiMetrics = useMemo(() => {
    if (!kpiData) return [];
    return kpiSummaryToMetrics(kpiData);
  }, [kpiData]);

  const leaves = leaveData?.items || [];
  const pendingLeaveCount = useMemo(() => getPendingLeaveCount(leaves), [leaves]);

  // Handlers
  const handleRefresh = useCallback(() => {
    refetchWorklist();
    refetchLeave();
  }, [refetchWorklist, refetchLeave]);

  const handleLogout = () => {
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
            } catch (err) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSessionPress = useCallback((session: any) => {
    // Navigate to treatment sheet detail if available
    if (session.treatment_sheet_id) {
      router.push(`/clinic-admin/treatment-sheets/${session.treatment_sheet_id}`);
    } else {
      router.push(`/clinic-admin/treatment-sessions/${session.id}`);
    }
  }, [router]);

  const handleStartSession = useCallback((session: any) => {
    Alert.alert(
      'Start Session',
      `Start session #${session.session_number} with ${session.client_name || 'client'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            // Navigate to session detail to start
            handleSessionPress(session);
          },
        },
      ]
    );
  }, [handleSessionPress]);

  const handleViewAllSessions = useCallback(() => {
    router.push('/clinic-admin/treatment-sessions');
  }, [router]);

  const handleApplyLeave = useCallback(async (payload: StaffLeaveCreate) => {
    await createLeaveMutation.mutateAsync(payload);
  }, [createLeaveMutation]);

  const handleCancelLeave = useCallback(async (leaveId: string) => {
    try {
      await cancelLeaveMutation.mutateAsync(leaveId);
      Alert.alert('Success', 'Leave request cancelled');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel leave request');
    }
  }, [cancelLeaveMutation]);

  const handleLeavePress = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  // Render loading state
  if (isWorklistLoading && !dashboardData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader
          title="Therapist Dashboard"
          subtitle={currentUser?.fullName || 'Therapist'}
          userName={currentUser?.email?.split('@')[0] || 'Therapist'}
          onNotificationPress={() => router.push('/notifications')}
          onProfilePress={() => {}}
          onLogoutPress={handleLogout}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.success.main} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (isWorklistError) {
    const axiosError = worklistError as any;
    const status = axiosError?.response?.status;
    const isPermissionError = status === 403;
    const isAuthError = status === 401;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader
          title="Therapist Dashboard"
          subtitle={currentUser?.fullName || 'Therapist'}
          userName={currentUser?.email?.split('@')[0] || 'Therapist'}
          onNotificationPress={() => router.push('/notifications')}
          onProfilePress={() => {}}
          onLogoutPress={handleLogout}
        />
        <View style={styles.errorContainer}>
          <EmptyDashboardState
            variant="error"
            title={
              isPermissionError
                ? t(ErrorTokens.dashboard.accessRestricted)
                : isAuthError
                ? 'Session Expired'
                : t('common.error')
            }
            message={
              isPermissionError
                ? t(ErrorTokens.auth.permissionDenied)
                : isAuthError
                ? t(ErrorTokens.auth.sessionExpired)
                : t(ErrorTokens.treatmentSessions.loadFailed)
            }
            actionLabel={isPermissionError ? t('common.goBack') : isAuthError ? 'Login' : t('common.retry')}
            onActionPress={() => {
              if (isPermissionError) {
                router.back();
              } else if (isAuthError) {
                router.replace('/login');
              } else {
                refetchWorklist();
              }
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isOnLeave = dashboardData?.on_leave_today || false;

  // Settings icon for notification preferences
  const settingsButton = (
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={() => router.push('/notifications/preferences')}
      accessibilityRole="button"
      accessibilityLabel="Notification settings"
    >
      <Ionicons name="settings-outline" size={22} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Therapist Dashboard"
        subtitle={currentUser?.fullName || 'Therapist'}
        userName={currentUser?.email?.split('@')[0] || 'Therapist'}
        onNotificationPress={() => router.push('/notifications')}
        onProfilePress={() => {}}
        onLogoutPress={handleLogout}
        rightAction={settingsButton}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isWorklistRefetching}
            onRefresh={handleRefresh}
            colors={[colors.success.main]}
            tintColor={colors.success.main}
          />
        }
      >
        {/* On Leave Banner */}
        {isOnLeave && (
          <View style={styles.section}>
            <OnLeaveBanner />
          </View>
        )}

        {/* KPI Row */}
        <View style={styles.section}>
          <TherapistKpiRow
            metrics={kpiMetrics}
            period={kpiPeriod}
            isLoading={isKpiLoading}
          />
        </View>

        {/* Worklist Section */}
        <View style={styles.section}>
          <WorklistSection
            sessions={filteredSessions}
            period={worklistPeriod}
            onPeriodChange={setWorklistPeriod}
            onSessionPress={handleSessionPress}
            onStartSession={handleStartSession}
            onViewAllPress={handleViewAllSessions}
            isLoading={isWorklistLoading}
            isOnLeave={isOnLeave}
          />
        </View>

        {/* HR Self-Service Section */}
        <View style={styles.section}>
          <HrSection
            onLeavePress={handleLeavePress}
            onDocumentsPress={() => {
              Alert.alert(
                'Not Available',
                'Document management is not available in this environment.'
              );
            }}
            onBankDetailsPress={() => {
              Alert.alert(
                'Not Available',
                'Bank details management is not available in this environment.'
              );
            }}
            onPayslipsPress={() => {
              Alert.alert(
                'Not Available',
                'Salary slips are not available in this environment.'
              );
            }}
          />
        </View>

        {/* Leave Section (when modal is open or inline) */}
        {showLeaveModal && (
          <View style={styles.section}>
            <LeaveSection
              leaves={leaves}
              pendingCount={pendingLeaveCount}
              isLoading={isLeaveLoading}
              onApplyLeave={handleApplyLeave}
              onCancelLeave={handleCancelLeave}
              isSubmitting={createLeaveMutation.isPending}
            />
          </View>
        )}

        {/* Learning Section */}
        <View style={styles.section}>
          <LearningSection />
        </View>

        {/* Patient Feedback Section */}
        {tenantId && staffId && (
          <View style={styles.section}>
            <StaffFeedbackSection
              tenantId={tenantId}
              staffId={staffId}
              staffType="therapist"
              testID="therapist-feedback-section"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    padding: spacing.md,
  },
  settingsButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
});

export default TherapistDashboardScreen;
