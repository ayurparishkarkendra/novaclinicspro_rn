/**
 * Doctor Dashboard Screen
 * Role-specific dashboard for doctors showing today's appointments, stats, and quick actions
 */

import React, { useMemo } from 'react';
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
  DashboardStatsRow,
  DashboardQuickActions,
  EmptyDashboardState,
  OnLeaveBanner,
  StatItem,
  QuickAction,
} from '../features/staffDashboards';
import { StaffFeedbackSection } from '../features/feedback';

export default function DoctorDashboard() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDoctorDashboardQuery(tenantId, {
    enabled: !!tenantId,
  });

  // Calculate stats from the data
  const stats: StatItem[] = useMemo(() => {
    if (!dashboardData) {
      return [
        { label: 'Today', value: 0, icon: 'calendar', color: colors.primary.main },
        { label: 'Upcoming', value: 0, icon: 'time', color: colors.info.main },
        { label: 'Completed', value: 0, icon: 'checkmark-circle', color: colors.success.main },
        { label: 'No-Shows', value: 0, icon: 'close-circle', color: colors.error.main },
      ];
    }

    const appointments = dashboardData.appointments || [];
    const todayCount = appointments.length;
    const completed = appointments.filter((a) =>
      a.status?.toLowerCase() === 'completed'
    ).length;
    const noShows = appointments.filter((a) =>
      a.status?.toLowerCase() === 'no_show'
    ).length;
    const upcoming = appointments.filter((a) =>
      ['scheduled', 'confirmed'].includes(a.status?.toLowerCase())
    ).length;

    return [
      { label: 'Today', value: todayCount, icon: 'calendar', color: colors.primary.main },
      { label: 'Upcoming', value: upcoming, icon: 'time', color: colors.info.main },
      { label: 'Completed', value: completed, icon: 'checkmark-circle', color: colors.success.main },
      { label: 'No-Shows', value: noShows, icon: 'close-circle', color: colors.error.main },
    ];
  }, [dashboardData]);

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

  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      );
    }

    // Error state
    if (isError) {
      const axiosError = error as any;
      const status = axiosError?.response?.status;
      const errorMessage = axiosError?.message || '';
      const errorDetail = axiosError?.response?.data?.detail || '';
      
      // Handle permission errors (403)
      const isPermissionError = status === 403 || 
        errorMessage.includes('403') || 
        errorDetail.toLowerCase().includes('permission') ||
        errorDetail.toLowerCase().includes('forbidden');
      
      // Handle authentication errors (401)
      const isAuthError = status === 401 || errorMessage.includes('401');
      
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
                refetch();
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

        {/* Stats Row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Overview</Text>
          <DashboardStatsRow stats={stats} />
        </View>

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

        {/* Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Switch Dashboard</Text>
          <View style={styles.dashboardLinks}>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/super-admin')}
            >
              <Ionicons name="shield-checkmark" size={20} color={colors.primary.main} />
              <Text style={styles.dashboardLinkText}>Super Admin</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/clinic-admin')}
            >
              <Ionicons name="business" size={20} color={colors.success.main} />
              <Text style={styles.dashboardLinkText}>Clinic Admin</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/therapist')}
            >
              <Ionicons name="heart" size={20} color={colors.error.main} />
              <Text style={styles.dashboardLinkText}>Therapist</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Doctor Dashboard"
        subtitle="Welcome back, Doctor"
        userName={currentUser?.email?.split('@')[0] || 'Doctor'}
        onNotificationPress={() => console.log('Notifications')}
        onProfilePress={() => console.log('Profile')}
        onLogoutPress={handleLogout}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
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
});
