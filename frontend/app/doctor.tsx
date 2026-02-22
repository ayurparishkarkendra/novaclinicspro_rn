/**
 * Doctor Dashboard Screen
 * Role-specific dashboard for doctors with KPI metrics from backend API
 * 
 * API Integration:
 * - GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis - Doctor KPI metrics
 * - GET /api/v1/clinic/{tenant_id}/staff/me/dashboard/doctor - Today's appointments
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardHeader } from '../core/components/DashboardHeader';
import { colors } from '../core/theme/colors';
import { spacing } from '../core/theme/spacing';
import { typography } from '../core/theme/typography';
import { useAuth } from '../features/auth/presentation/hooks/useAuth';
import { t, ErrorTokens } from '../core/localization';
import {
  useDoctorDashboardQuery,
  AppointmentListItem,
  DashboardQuickActions,
  EmptyDashboardState,
  OnLeaveBanner,
  QuickAction,
} from '../features/staffDashboards';
import { StaffFeedbackSection } from '../features/feedback';
import {
  useDoctorKpisQuery,
  KpiPeriodSelector,
  KpiStatsGrid,
  TimeMetricsSection,
  type KPIPeriodType,
  mapConsultationsToCards,
  mapPatientsToCards,
  mapProductivityToCards,
  mapPeakHoursToBars,
  mapBusiestDaysToBars,
  formatDuration,
} from '../features/doctorDashboard';

export default function DoctorDashboard() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const staffId = currentUser?.userId || '';

  // Route guard - only allow doctor and tenant_admin roles
  React.useEffect(() => {
    if (currentUser && currentUser.roles && currentUser.roles.length > 0) {
      const userRole = currentUser.roles[0]?.toLowerCase() || '';
      console.log('[Doctor] Route guard checking role:', userRole);
      
      // Allow: doctor, tenant_admin, tenant admin
      const allowedRoles = ['doctor', 'tenant admin', 'tenant_admin'];
      
      if (!allowedRoles.includes(userRole) && !currentUser.isOrgAdmin) {
        console.log('[Doctor] Access denied, redirecting to appropriate dashboard');
        
        // Redirect to appropriate dashboard based on role
        if (userRole === 'therapist') {
          router.replace('/therapist');
        } else if (userRole === 'clinic admin' || userRole === 'clinic_admin' || userRole === 'receptionist') {
          router.replace('/clinic-admin');
        } else {
          // Unknown role, redirect to index for proper routing
          router.replace('/');
        }
      }
    }
  }, [currentUser, router]);

  // KPI period state
  const [kpiPeriod, setKpiPeriod] = useState<KPIPeriodType>('7d');
  const [customFromDate, setCustomFromDate] = useState<string>();
  const [customToDate, setCustomToDate] = useState<string>();

  // Fetch today's appointments (existing query)
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
    isRefetching: isDashboardRefetching,
  } = useDoctorDashboardQuery(tenantId, {
    enabled: !!tenantId,
  });

  // Fetch KPI metrics from backend
  const {
    data: kpiData,
    isLoading: isKpiLoading,
    isError: isKpiError,
    error: kpiError,
    refetch: refetchKpis,
    isRefetching: isKpiRefetching,
  } = useDoctorKpisQuery(
    tenantId,
    staffId,
    {
      period: kpiPeriod,
      fromDate: customFromDate,
      toDate: customToDate,
    },
    {
      enabled: !!tenantId && !!staffId,
    }
  );

  // Handle period change
  const handlePeriodChange = useCallback(
    (period: KPIPeriodType, fromDate?: string, toDate?: string) => {
      setKpiPeriod(period);
      if (period === 'custom') {
        setCustomFromDate(fromDate);
        setCustomToDate(toDate);
      } else {
        setCustomFromDate(undefined);
        setCustomToDate(undefined);
      }
    },
    []
  );

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refetchDashboard();
    refetchKpis();
  }, [refetchDashboard, refetchKpis]);

  // Map KPI data to card format
  const kpiCards = useMemo(() => {
    if (!kpiData) return null;
    return {
      consultations: mapConsultationsToCards(kpiData.consultations),
      patients: mapPatientsToCards(kpiData.patients),
      productivity: mapProductivityToCards(kpiData.clinical_productivity),
      peakHours: mapPeakHoursToBars(kpiData.time_metrics.peak_hours, 3),
      busiestDays: mapBusiestDaysToBars(kpiData.time_metrics.busiest_days, 3),
      avgDuration: formatDuration(kpiData.time_metrics.avg_consultation_duration_minutes),
    };
  }, [kpiData]);

  // Quick actions
  const quickActions: QuickAction[] = useMemo(() => [
    {
      label: 'View Schedule',
      icon: 'calendar-outline',
      onPress: () => router.push('/clinic-admin/appointments'),
      color: colors.primary.main,
      variant: 'primary',
    },
    {
      label: 'View Patients',
      icon: 'people-outline',
      onPress: () => router.push('/clinic-admin/clients'),
      color: colors.success.main,
    },
    {
      label: 'Start Session',
      icon: 'play-circle-outline',
      onPress: () => {
        const nextAppointment = dashboardData?.appointments?.find(
          (a) => ['scheduled', 'confirmed'].includes(a.status?.toLowerCase())
        );
        if (nextAppointment) {
          Alert.alert(
            'Start Session',
            `Ready to start session with ${nextAppointment.client_name || 'patient'}?`
          );
        } else {
          Alert.alert('No Upcoming', 'No upcoming appointments to start.');
        }
      },
      color: colors.info.main,
    },
  ], [dashboardData, router]);

  // Clinical documents quick actions
  const clinicalActions: QuickAction[] = useMemo(() => [
    {
      label: 'Casesheets',
      icon: 'document-text-outline',
      onPress: () => {
        Alert.alert(
          'View Casesheets',
          'Select a patient first to view their casesheets.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Patients', onPress: () => router.push('/clinic-admin/clients') },
          ]
        );
      },
      color: colors.primary.main,
    },
    {
      label: 'Prescriptions',
      icon: 'medkit-outline',
      onPress: () => {
        Alert.alert(
          'View Prescriptions',
          'Select a patient first to view their prescriptions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Patients', onPress: () => router.push('/clinic-admin/clients') },
          ]
        );
      },
      color: colors.success.main,
    },
  ], [router]);

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

  // Get error message for KPI errors
  const getKpiErrorMessage = (error: any): { title: string; message: string } => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || '';

    switch (status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: detail || 'Invalid period or date range. Please try again.',
        };
      case 401:
        return {
          title: 'Session Expired',
          message: 'Please log in again to view your KPIs.',
        };
      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to view these KPIs.',
        };
      case 404:
        return {
          title: 'Not Found',
          message: 'Staff profile not found. Please contact support.',
        };
      default:
        return {
          title: 'Error Loading KPIs',
          message: 'Could not load your performance metrics. Please try again.',
        };
    }
  };

  const renderContent = () => {
    // Loading state for dashboard
    if (isDashboardLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      );
    }

    // Error state for dashboard
    if (isDashboardError) {
      const axiosError = dashboardError as any;
      const status = axiosError?.response?.status;
      const errorDetail = axiosError?.response?.data?.detail || '';
      
      const isPermissionError = status === 403 || 
        errorDetail.toLowerCase().includes('permission') ||
        errorDetail.toLowerCase().includes('forbidden');
      
      const isAuthError = status === 401;
      
      return (
        <View style={styles.section}>
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
                : t(ErrorTokens.dashboard.loadFailed)
            }
            actionLabel={isPermissionError ? t('common.goBack') : isAuthError ? 'Login' : t('common.retry')}
            onActionPress={() => {
              if (isPermissionError) {
                router.back();
              } else if (isAuthError) {
                router.replace('/login');
              } else {
                refetchDashboard();
              }
            }}
          />
        </View>
      );
    }

    // Success state
    const appointments = dashboardData?.appointments || [];
    const onLeave = dashboardData?.on_leave_today;

    return (
      <>
        {/* On Leave Banner */}
        {onLeave && (
          <View style={styles.section}>
            <OnLeaveBanner />
          </View>
        )}

        {/* KPI Period Selector */}
        <View style={styles.section}>
          <View style={styles.kpiHeader}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <TouchableOpacity onPress={() => refetchKpis()} disabled={isKpiRefetching}>
              <Ionicons
                name="refresh"
                size={20}
                color={isKpiRefetching ? colors.text.disabled : colors.primary.main}
              />
            </TouchableOpacity>
          </View>
          <KpiPeriodSelector
            value={kpiPeriod}
            customFromDate={customFromDate}
            customToDate={customToDate}
            onChange={handlePeriodChange}
            disabled={isKpiLoading}
            testID="kpi-period-selector"
          />
        </View>

        {/* KPI Cards Section */}
        {isKpiLoading ? (
          <View style={styles.section}>
            <View style={styles.kpiLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <Text style={styles.kpiLoadingText}>Loading metrics...</Text>
            </View>
          </View>
        ) : isKpiError ? (
          <View style={styles.section}>
            <View style={styles.kpiErrorContainer}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.error.main} />
              <Text style={styles.kpiErrorTitle}>{getKpiErrorMessage(kpiError).title}</Text>
              <Text style={styles.kpiErrorMessage}>{getKpiErrorMessage(kpiError).message}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchKpis()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : kpiCards ? (
          <>
            {/* Consultations KPIs */}
            <View style={styles.section}>
              <Text style={styles.cardSectionTitle}>
                <Ionicons name="calendar" size={16} color={colors.primary.main} /> Consultations
              </Text>
              <KpiStatsGrid items={kpiCards.consultations} testID="consultations-grid" />
            </View>

            {/* Patients KPIs */}
            <View style={styles.section}>
              <Text style={styles.cardSectionTitle}>
                <Ionicons name="people" size={16} color={colors.success.main} /> Patients
              </Text>
              <KpiStatsGrid items={kpiCards.patients} testID="patients-grid" />
            </View>

            {/* Clinical Productivity KPIs */}
            <View style={styles.section}>
              <Text style={styles.cardSectionTitle}>
                <Ionicons name="document-text" size={16} color={colors.info.main} /> Clinical Productivity
              </Text>
              <KpiStatsGrid items={kpiCards.productivity} testID="productivity-grid" />
            </View>

            {/* Time Metrics */}
            <View style={styles.section}>
              <Text style={styles.cardSectionTitle}>
                <Ionicons name="time" size={16} color={colors.warning.main} /> Time Metrics
              </Text>
              <TimeMetricsSection
                avgDuration={kpiCards.avgDuration}
                peakHours={kpiCards.peakHours}
                busiestDays={kpiCards.busiestDays}
                testID="time-metrics"
              />
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <EmptyDashboardState
              icon="analytics-outline"
              title="No KPI Data"
              message="No performance data available for this period."
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <DashboardQuickActions actions={quickActions} />
        </View>

        {/* Clinical Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Documents</Text>
          <DashboardQuickActions actions={clinicalActions} />
        </View>

        {/* Today's Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Appointments</Text>
            <TouchableOpacity onPress={() => router.push('/clinic-admin/appointments')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {appointments.length === 0 ? (
            <EmptyDashboardState
              icon="calendar-outline"
              title="No Appointments Today"
              message={onLeave ? "You're on leave today." : "You have no appointments scheduled for today."}
            />
          ) : (
            appointments.map((appointment) => (
              <AppointmentListItem
                key={appointment.id}
                appointment={appointment}
                onPress={() => {
                  router.push(`/clinic-admin/appointments/${appointment.id}`);
                }}
                onStartPress={() => {
                  Alert.alert(
                    'Start Appointment',
                    `Start appointment with ${appointment.client_name || 'patient'}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Start', onPress: () => console.log('Start:', appointment.id) },
                    ]
                  );
                }}
              />
            ))
          )}
        </View>

        {/* Patient Feedback Section */}
        {tenantId && staffId && (
          <View style={styles.section}>
            <StaffFeedbackSection
              tenantId={tenantId}
              staffId={staffId}
              staffType="doctor"
              testID="doctor-feedback-section"
            />
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Doctor Dashboard"
        subtitle={kpiData?.staff_name || 'Welcome back, Doctor'}
        userName={currentUser?.email?.split('@')[0] || 'Doctor'}
        onNotificationPress={() => router.push('/notifications/history')}
        onProfilePress={() => console.log('Profile')}
        onLogoutPress={handleLogout}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isDashboardRefetching || isKpiRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardSectionTitle: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAll: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  dashboardLinks: {
    gap: spacing.sm,
  },
  dashboardLink: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dashboardLinkText: {
    ...typography.body1,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  kpiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    gap: spacing.sm,
  },
  kpiLoadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  kpiErrorContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    gap: spacing.sm,
  },
  kpiErrorTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
  },
  kpiErrorMessage: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.common.white,
  },
});
