/**
 * Analytics Dashboard Screen
 * Main analytics overview for Clinic Admin
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useDashboardOverviewQuery,
  useRevenueAnalyticsQuery,
  useUserGrowthQuery,
} from '../../data/repositories/analytics.repository.impl';
import { KpiStatCard } from '../components/KpiStatCard';
import { MetricTrendChart } from '../components/MetricTrendChart';
import { BreakdownList } from '../components/BreakdownList';
import { TimeRangeSelector, TIME_RANGE_DAYS } from '../components/TimeRangeSelector';

export const AnalyticsDashboardScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  
  const [timeRange, setTimeRange] = useState(30);

  // Fetch dashboard overview
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
    isRefetching,
  } = useDashboardOverviewQuery(
    { tenant_id: tenantId, time_range_days: timeRange },
    { enabled: !!tenantId }
  );

  // Fetch revenue analytics
  const {
    data: revenueData,
    isLoading: revenueLoading,
  } = useRevenueAnalyticsQuery(
    { tenant_id: tenantId, time_range_days: timeRange },
    { enabled: !!tenantId }
  );

  // Fetch user growth
  const {
    data: userGrowthData,
    isLoading: userGrowthLoading,
  } = useUserGrowthQuery(
    { tenant_id: tenantId, time_range_days: timeRange },
    { enabled: !!tenantId }
  );

  const handleRefresh = () => {
    refetchDashboard();
  };

  // Transform data for charts
  const appointmentTrends = (dashboardData?.appointment_trends || []).slice(-7).map((item) => ({
    label: item.date?.slice(-5) || '',
    value: item.count || 0,
  }));

  const revenueTrends = (dashboardData?.revenue_trends || []).slice(-7).map((item) => ({
    label: item.date?.slice(-5) || '',
    value: item.amount || 0,
  }));

  const topTreatments = (dashboardData?.top_treatments || []).slice(0, 5).map((item) => ({
    label: item.name || 'Unknown',
    value: item.count || 0,
    percentage: item.revenue ? ((item.revenue / (revenueData?.total_revenue || 1)) * 100) : 0,
    icon: 'leaf' as const,
    color: colors.success.main,
  }));

  const revenueSources = (revenueData?.revenue_by_source || []).slice(0, 5).map((item) => ({
    label: item.source || 'Other',
    value: `$${(item.amount || 0).toLocaleString()}`,
    percentage: item.percentage || 0,
    icon: 'cash' as const,
    color: colors.warning.main,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Clinic performance overview</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
          />
        }
      >
        {/* Time Range Selector */}
        <View style={styles.section}>
          <TimeRangeSelector
            options={TIME_RANGE_DAYS}
            selectedValue={timeRange}
            onSelect={setTimeRange}
          />
        </View>

        {/* KPI Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Total Appointments"
                value={dashboardData?.total_appointments?.toLocaleString() || '0'}
                icon="calendar"
                color={colors.primary.main}
                isLoading={dashboardLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Total Patients"
                value={dashboardData?.total_patients?.toLocaleString() || '0'}
                icon="people"
                color={colors.info.main}
                isLoading={dashboardLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Total Revenue"
                value={`$${(dashboardData?.total_revenue || 0).toLocaleString()}`}
                icon="cash"
                color={colors.success.main}
                isLoading={dashboardLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Active Staff"
                value={dashboardData?.active_staff?.toString() || '0'}
                icon="person"
                color={colors.warning.main}
                isLoading={dashboardLoading}
              />
            </View>
          </View>
        </View>

        {/* Appointment Trends */}
        <View style={styles.section}>
          <MetricTrendChart
            title="Appointment Trends (Last 7 Days)"
            data={appointmentTrends}
            color={colors.primary.main}
            isLoading={dashboardLoading}
            emptyMessage="No appointment data available"
          />
        </View>

        {/* Revenue Trends */}
        <View style={styles.section}>
          <MetricTrendChart
            title="Revenue Trends (Last 7 Days)"
            data={revenueTrends}
            color={colors.success.main}
            isLoading={dashboardLoading}
            emptyMessage="No revenue data available"
          />
        </View>

        {/* Top Treatments */}
        <View style={styles.section}>
          <BreakdownList
            title="Top Treatments"
            items={topTreatments}
            isLoading={dashboardLoading}
            emptyMessage="No treatment data available"
          />
        </View>

        {/* Revenue Sources */}
        <View style={styles.section}>
          <BreakdownList
            title="Revenue by Source"
            items={revenueSources}
            isLoading={revenueLoading}
            emptyMessage="No revenue source data available"
          />
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Analytics</Text>
          <View style={styles.quickLinks}>
            <Link href="/clinic-admin/analytics/revenue" asChild>
              <Pressable style={styles.quickLinkCard}>
                <View style={[styles.quickLinkIcon, { backgroundColor: colors.success.main + '15' }]}>
                  <Ionicons name="trending-up" size={24} color={colors.success.main} />
                </View>
                <View style={styles.quickLinkInfo}>
                  <Text style={styles.quickLinkTitle}>Revenue Analytics</Text>
                  <Text style={styles.quickLinkSubtitle}>Detailed financial metrics</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </Pressable>
            </Link>

            <Link href="/clinic-admin/analytics/users" asChild>
              <Pressable style={styles.quickLinkCard}>
                <View style={[styles.quickLinkIcon, { backgroundColor: colors.info.main + '15' }]}>
                  <Ionicons name="people" size={24} color={colors.info.main} />
                </View>
                <View style={styles.quickLinkInfo}>
                  <Text style={styles.quickLinkTitle}>Patient Growth</Text>
                  <Text style={styles.quickLinkSubtitle}>User acquisition & retention</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </Pressable>
            </Link>

            <Link href="/clinic-admin/analytics/performance" asChild>
              <Pressable style={styles.quickLinkCard}>
                <View style={[styles.quickLinkIcon, { backgroundColor: colors.warning.main + '15' }]}>
                  <Ionicons name="speedometer" size={24} color={colors.warning.main} />
                </View>
                <View style={styles.quickLinkInfo}>
                  <Text style={styles.quickLinkTitle}>Performance Metrics</Text>
                  <Text style={styles.quickLinkSubtitle}>System & operational health</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: spacing.md,
    backgroundColor: colors.background.default,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiItem: {
    width: '48%',
  },
  quickLinks: {
    gap: spacing.sm,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  quickLinkInfo: {
    flex: 1,
  },
  quickLinkTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  quickLinkSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
