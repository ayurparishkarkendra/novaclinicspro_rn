/**
 * User Growth Analytics Screen
 * Patient acquisition and retention analytics
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
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useUserGrowthQuery, useChurnAnalyticsQuery } from '../../data/repositories/analytics.repository.impl';
import { KpiStatCard } from '../components/KpiStatCard';
import { MetricTrendChart } from '../components/MetricTrendChart';
import { BreakdownList } from '../components/BreakdownList';
import { TimeRangeSelector, TIME_RANGE_DAYS } from '../components/TimeRangeSelector';

export const UserGrowthAnalyticsScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';
  
  const [timeRange, setTimeRange] = useState(30);

  const {
    data: userGrowthData,
    isLoading: growthLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useUserGrowthQuery(
    { tenant_id: tenantId, time_range_days: timeRange },
    { enabled: !!tenantId }
  );

  const {
    data: churnData,
    isLoading: churnLoading,
  } = useChurnAnalyticsQuery(
    { time_range_days: timeRange },
    { enabled: !!tenantId }
  );

  const handleRefresh = () => {
    refetch();
  };

  // Transform data for charts
  const userGrowthTrends = (userGrowthData?.user_growth || []).slice(-10).map((item) => ({
    label: item.date?.slice(-5) || '',
    value: item.new_users || 0,
  }));

  const userSources = (userGrowthData?.user_sources || []).map((item) => ({
    label: item.source || 'Other',
    value: item.count || 0,
    percentage: item.percentage || 0,
    icon: 'person-add' as const,
    color: colors.info.main,
  }));

  const churnReasons = (churnData?.churn_reasons || []).map((item) => ({
    label: item.reason || 'Unknown',
    value: item.count || 0,
    percentage: item.percentage || 0,
    icon: 'log-out' as const,
    color: colors.error.main,
  }));

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Patient Growth</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error.main} />
          <Text style={styles.errorTitle}>Could not load user data</Text>
          <Text style={styles.errorSubtitle}>
            {error?.message || 'Please try again later.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Patient Growth</Text>
          <Text style={styles.headerSubtitle}>Acquisition & retention metrics</Text>
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
          <Text style={styles.sectionTitle}>Growth Summary</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Total Patients"
                value={userGrowthData?.total_users?.toLocaleString() || '0'}
                icon="people"
                color={colors.primary.main}
                isLoading={growthLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="New Patients"
                value={userGrowthData?.new_users_period?.toLocaleString() || '0'}
                subtitle={`Last ${timeRange} days`}
                icon="person-add"
                color={colors.success.main}
                isLoading={growthLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Growth Rate"
                value={`${(userGrowthData?.growth_rate || 0).toFixed(1)}%`}
                icon="trending-up"
                color={userGrowthData?.growth_rate && userGrowthData.growth_rate > 0 ? colors.success.main : colors.error.main}
                trend={userGrowthData?.growth_rate !== undefined ? {
                  value: userGrowthData.growth_rate > 0 ? 'Growing' : 'Declining',
                  isPositive: userGrowthData.growth_rate > 0,
                } : undefined}
                isLoading={growthLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Churn Rate"
                value={`${(churnData?.churn_rate || 0).toFixed(1)}%`}
                icon="log-out"
                color={churnData?.churn_rate && churnData.churn_rate > 5 ? colors.error.main : colors.warning.main}
                isLoading={churnLoading}
              />
            </View>
          </View>
        </View>

        {/* User Growth Trends */}
        <View style={styles.section}>
          <MetricTrendChart
            title="New Patients Over Time"
            data={userGrowthTrends}
            color={colors.success.main}
            isLoading={growthLoading}
            emptyMessage="No patient growth data available"
          />
        </View>

        {/* User Sources */}
        <View style={styles.section}>
          <BreakdownList
            title="Patient Acquisition Sources"
            items={userSources}
            isLoading={growthLoading}
            emptyMessage="No acquisition data available"
          />
        </View>

        {/* Churn Reasons */}
        <View style={styles.section}>
          <BreakdownList
            title="Churn Reasons"
            items={churnReasons}
            isLoading={churnLoading}
            emptyMessage="No churn data available"
          />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  errorSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.light,
  },
});
