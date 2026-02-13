/**
 * Revenue Analytics Screen
 * Detailed revenue and financial analytics
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
import { useRevenueAnalyticsQuery } from '../../data/repositories/analytics.repository.impl';
import { KpiStatCard } from '../components/KpiStatCard';
import { MetricTrendChart } from '../components/MetricTrendChart';
import { BreakdownList } from '../components/BreakdownList';
import { TimeRangeSelector, TIME_RANGE_DAYS } from '../components/TimeRangeSelector';

export const RevenueAnalyticsScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  
  const [timeRange, setTimeRange] = useState(30);

  const {
    data: revenueData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useRevenueAnalyticsQuery(
    { tenant_id: tenantId, time_range_days: timeRange },
    { enabled: !!tenantId }
  );

  const handleRefresh = () => {
    refetch();
  };

  // Transform data for charts
  const revenueTrends = (revenueData?.revenue_by_period || []).slice(-10).map((item) => ({
    label: item.period?.slice(-5) || '',
    value: item.amount || 0,
  }));

  const revenueSources = (revenueData?.revenue_by_source || []).map((item) => ({
    label: item.source || 'Other',
    value: `$${(item.amount || 0).toLocaleString()}`,
    percentage: item.percentage || 0,
    icon: 'cash' as const,
    color: colors.warning.main,
  }));

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Revenue Analytics</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error.main} />
          <Text style={styles.errorTitle}>Could not load revenue data</Text>
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
          <Text style={styles.headerTitle}>Revenue Analytics</Text>
          <Text style={styles.headerSubtitle}>Financial performance metrics</Text>
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
          <Text style={styles.sectionTitle}>Revenue Summary</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Total Revenue"
                value={`$${(revenueData?.total_revenue || 0).toLocaleString()}`}
                icon="cash"
                color={colors.success.main}
                isLoading={isLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Avg Transaction"
                value={`$${(revenueData?.average_transaction || 0).toFixed(2)}`}
                icon="card"
                color={colors.info.main}
                isLoading={isLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Growth Rate"
                value={`${(revenueData?.growth_rate || 0).toFixed(1)}%`}
                icon="trending-up"
                color={revenueData?.growth_rate && revenueData.growth_rate > 0 ? colors.success.main : colors.error.main}
                trend={revenueData?.growth_rate !== undefined ? {
                  value: revenueData.growth_rate > 0 ? 'Growing' : 'Declining',
                  isPositive: revenueData.growth_rate > 0,
                } : undefined}
                isLoading={isLoading}
              />
            </View>
          </View>
        </View>

        {/* Revenue Trends */}
        <View style={styles.section}>
          <MetricTrendChart
            title="Revenue Over Time"
            data={revenueTrends}
            color={colors.success.main}
            isLoading={isLoading}
            emptyMessage="No revenue trend data available"
          />
        </View>

        {/* Revenue Sources */}
        <View style={styles.section}>
          <BreakdownList
            title="Revenue by Source"
            items={revenueSources}
            isLoading={isLoading}
            emptyMessage="No revenue source data available"
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
