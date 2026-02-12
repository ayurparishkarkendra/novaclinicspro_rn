/**
 * Performance Analytics Screen
 * System and operational performance metrics
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
import {
  usePerformanceSummaryQuery,
  useApiPerformanceQuery,
  useRegistrationPerformanceQuery,
  useBillingPerformanceQuery,
  useOnboardingPerformanceQuery,
} from '../../data/repositories/analytics.repository.impl';
import { KpiStatCard } from '../components/KpiStatCard';
import { TimeRangeSelector, TIME_RANGE_HOURS } from '../components/TimeRangeSelector';

export const PerformanceAnalyticsScreen: React.FC = () => {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState(24);

  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch,
    isRefetching,
  } = usePerformanceSummaryQuery();

  const {
    data: apiData,
    isLoading: apiLoading,
  } = useApiPerformanceQuery({ time_range_hours: timeRange });

  const {
    data: registrationData,
    isLoading: registrationLoading,
  } = useRegistrationPerformanceQuery({ time_range_hours: timeRange });

  const {
    data: billingData,
    isLoading: billingLoading,
  } = useBillingPerformanceQuery({ time_range_hours: timeRange });

  const {
    data: onboardingData,
    isLoading: onboardingLoading,
  } = useOnboardingPerformanceQuery({ time_range_hours: timeRange });

  const handleRefresh = () => {
    refetch();
  };

  const getUptimeColor = (uptime: number | undefined) => {
    if (!uptime) return colors.grey[400];
    if (uptime >= 99.9) return colors.success.main;
    if (uptime >= 99) return colors.warning.main;
    return colors.error.main;
  };

  const getErrorRateColor = (rate: number | undefined) => {
    if (!rate) return colors.success.main;
    if (rate <= 1) return colors.success.main;
    if (rate <= 5) return colors.warning.main;
    return colors.error.main;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Performance</Text>
          <Text style={styles.headerSubtitle}>System health metrics</Text>
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
            options={TIME_RANGE_HOURS}
            selectedValue={timeRange}
            onSelect={setTimeRange}
          />
        </View>

        {/* System Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Uptime"
                value={`${(summaryData?.summary?.uptime_percentage || 0).toFixed(2)}%`}
                icon="checkmark-circle"
                color={getUptimeColor(summaryData?.summary?.uptime_percentage)}
                isLoading={summaryLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Avg Response Time"
                value={`${(summaryData?.summary?.avg_response_time_ms || 0).toFixed(0)}ms`}
                icon="speedometer"
                color={colors.info.main}
                isLoading={summaryLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Error Rate"
                value={`${(summaryData?.summary?.error_rate || 0).toFixed(2)}%`}
                icon="warning"
                color={getErrorRateColor(summaryData?.summary?.error_rate)}
                isLoading={summaryLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Total Requests"
                value={(summaryData?.summary?.total_requests || 0).toLocaleString()}
                icon="globe"
                color={colors.primary.main}
                isLoading={summaryLoading}
              />
            </View>
          </View>
        </View>

        {/* API Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Performance</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="API Requests"
                value={(apiData?.metrics?.total_requests || 0).toLocaleString()}
                icon="code"
                color={colors.primary.main}
                isLoading={apiLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="P95 Latency"
                value={`${(apiData?.metrics?.p95_response_time_ms || 0).toFixed(0)}ms`}
                icon="time"
                color={colors.warning.main}
                isLoading={apiLoading}
              />
            </View>
          </View>
        </View>

        {/* Registration Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration Performance</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Total Registrations"
                value={(registrationData?.metrics?.total_registrations || 0).toLocaleString()}
                icon="person-add"
                color={colors.success.main}
                isLoading={registrationLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Success Rate"
                value={`${registrationData?.metrics?.total_registrations ? 
                  ((registrationData.metrics.successful || 0) / registrationData.metrics.total_registrations * 100).toFixed(1) : '0'}%`}
                icon="checkmark"
                color={colors.success.main}
                isLoading={registrationLoading}
              />
            </View>
          </View>
        </View>

        {/* Billing Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Performance</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Transactions"
                value={(billingData?.metrics?.total_transactions || 0).toLocaleString()}
                icon="card"
                color={colors.warning.main}
                isLoading={billingLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Processing Time"
                value={`${(billingData?.metrics?.avg_processing_time_ms || 0).toFixed(0)}ms`}
                icon="flash"
                color={colors.info.main}
                isLoading={billingLoading}
              />
            </View>
          </View>
        </View>

        {/* Onboarding Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onboarding Performance</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Total Onboardings"
                value={(onboardingData?.metrics?.total_onboardings || 0).toLocaleString()}
                icon="rocket"
                color={colors.primary.main}
                isLoading={onboardingLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Completed"
                value={(onboardingData?.metrics?.completed || 0).toLocaleString()}
                icon="checkmark-done"
                color={colors.success.main}
                isLoading={onboardingLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="In Progress"
                value={(onboardingData?.metrics?.in_progress || 0).toLocaleString()}
                icon="hourglass"
                color={colors.warning.main}
                isLoading={onboardingLoading}
              />
            </View>
            <View style={styles.kpiItem}>
              <KpiStatCard
                title="Avg Time (hrs)"
                value={(onboardingData?.metrics?.avg_completion_time_hours || 0).toFixed(1)}
                icon="time"
                color={colors.info.main}
                isLoading={onboardingLoading}
              />
            </View>
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
});
