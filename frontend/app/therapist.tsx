/**
 * Therapist Dashboard Screen
 * Role-specific dashboard for therapists showing today's sessions, stats, and quick actions
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
  useTherapistDashboardQuery,
  SessionListItem,
  DashboardStatsRow,
  DashboardQuickActions,
  EmptyDashboardState,
  OnLeaveBanner,
  StatItem,
  QuickAction,
} from '../features/staffDashboards';

export default function TherapistDashboard() {
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
  } = useTherapistDashboardQuery(tenantId, {
    enabled: !!tenantId,
  });

  // Calculate stats from the data
  const stats: StatItem[] = useMemo(() => {
    if (!dashboardData) {
      return [
        { label: 'Today', value: 0, icon: 'fitness', color: colors.primary.main },
        { label: 'In Progress', value: 0, icon: 'play-circle', color: colors.info.main },
        { label: 'Completed', value: 0, icon: 'checkmark-circle', color: colors.success.main },
        { label: 'Cancelled', value: 0, icon: 'close-circle', color: colors.error.main },
      ];
    }

    const sessions = dashboardData.sessions || [];
    const todayCount = sessions.length;
    const inProgress = sessions.filter((s) =>
      s.status?.toLowerCase() === 'in_progress'
    ).length;
    const completed = sessions.filter((s) =>
      s.status?.toLowerCase() === 'completed'
    ).length;
    const cancelledOrNoShow = sessions.filter((s) =>
      ['cancelled', 'no_show'].includes(s.status?.toLowerCase())
    ).length;

    return [
      { label: 'Today', value: todayCount, icon: 'fitness', color: colors.primary.main },
      { label: 'In Progress', value: inProgress, icon: 'play-circle', color: colors.info.main },
      { label: 'Completed', value: completed, icon: 'checkmark-circle', color: colors.success.main },
      { label: 'Cancelled', value: cancelledOrNoShow, icon: 'close-circle', color: colors.error.main },
    ];
  }, [dashboardData]);

  // Quick actions
  const quickActions: QuickAction[] = useMemo(() => [
    {
      label: 'View Sessions',
      icon: 'list-outline',
      onPress: () => router.push('/clinic-admin/treatment-sessions'),
      color: colors.primary.main,
      variant: 'primary',
    },
    {
      label: 'Treatment Sheets',
      icon: 'fitness-outline',
      onPress: () => {
        Alert.alert(
          'Treatment Sheets',
          'View treatment sheets from patient casesheets.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Patients', onPress: () => router.push('/clinic-admin/clients') },
          ]
        );
      },
      color: colors.success.main,
    },
    {
      label: 'View Clients',
      icon: 'people-outline',
      onPress: () => router.push('/clinic-admin/clients'),
      color: colors.info.main,
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
          <ActivityIndicator size="large" color={colors.success.main} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      );
    }

    // Error state
    if (isError) {
      const errorMessage = error?.message || '';
      const errorData = (error as any)?.response?.data?.detail || '';
      
      // Handle permission errors (403)
      const isPermissionError = errorMessage.includes('403') || errorData.includes('permission');
      
      return (
        <View style={styles.section}>
          <EmptyDashboardState
            variant="error"
            title={isPermissionError ? t(ErrorTokens.dashboard.accessRestricted) : t('common.error')}
            message={
              isPermissionError
                ? t(ErrorTokens.dashboard.permissionRequired)
                : error?.message?.includes('401')
                ? t(ErrorTokens.auth.sessionExpired)
                : t(ErrorTokens.treatmentSessions.loadFailed)
            }
            actionLabel={isPermissionError ? t('common.goBack') : t('common.retry')}
            onActionPress={() => isPermissionError ? router.back() : refetch()}
          />
        </View>
      );
    }

    // Success state
    const sessions = dashboardData?.sessions || [];
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
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <DashboardStatsRow stats={stats} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <DashboardQuickActions actions={quickActions} />
        </View>

        {/* Today's Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Sessions</Text>
            <TouchableOpacity onPress={() => router.push('/clinic-admin/treatment-sessions')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {sessions.length === 0 ? (
            <EmptyDashboardState
              icon="fitness-outline"
              title="No Sessions Today"
              message={onLeave ? "You're on leave today." : "You have no treatment sessions scheduled for today."}
            />
          ) : (
            sessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                onPress={() => {
                  router.push(`/clinic-admin/treatment-sessions/${session.id}`);
                }}
                onStartPress={() => {
                  Alert.alert(
                    'Start Session',
                    `Start session #${session.session_number} with ${session.client_name || 'client'}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Start', onPress: () => console.log('Start:', session.id) },
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
              onPress={() => router.push('/doctor')}
            >
              <Ionicons name="medical" size={20} color={colors.error.main} />
              <Text style={styles.dashboardLinkText}>Doctor</Text>
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
        title="Therapist Dashboard"
        subtitle="Physical Therapy Center"
        userName={currentUser?.email?.split('@')[0] || 'Therapist'}
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
            colors={[colors.success.main]}
            tintColor={colors.success.main}
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
