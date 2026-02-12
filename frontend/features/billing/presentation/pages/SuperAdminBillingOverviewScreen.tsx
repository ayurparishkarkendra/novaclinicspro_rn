/**
 * Super Admin Billing Overview Screen
 * Shows aggregated billing data across all tenants
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { formatCurrency } from '../../data/models/billing.dtos';

// Note: Since the billing API is tenant-scoped, the Super Admin overview
// displays a summary view. For a real multi-tenant aggregation, the backend
// would need cross-tenant billing endpoints.

export const SuperAdminBillingOverviewScreen: React.FC = () => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Since there's no cross-tenant billing endpoint, we show placeholder/summary data
  // In a real implementation, this would call a super-admin specific billing aggregation API
  const mockSummaryData = {
    totalRevenue: 127500,
    monthlyRecurringRevenue: 45000,
    pendingPayments: 12500,
    overdueInvoices: 3,
    activeSubscriptions: 45,
    totalTenants: 47,
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Finance Overview</Text>
          <Text style={styles.headerSubtitle}>System-wide billing summary</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
          />
        }
      >
        {/* Revenue Summary */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="trending-up" size={32} color={colors.success.main} />
            <Text style={styles.revenueLabel}>Total Revenue (All Time)</Text>
          </View>
          <Text style={styles.revenueValue}>
            {formatCurrency(mockSummaryData.totalRevenue)}
          </Text>
          <View style={styles.revenueTrend}>
            <Ionicons name="arrow-up" size={16} color={colors.success.main} />
            <Text style={styles.trendText}>+12% vs last month</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.success.main + '15' }]}>
                <Ionicons name="sync" size={24} color={colors.success.main} />
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(mockSummaryData.monthlyRecurringRevenue)}
              </Text>
              <Text style={styles.statLabel}>Monthly Recurring</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning.main + '15' }]}>
                <Ionicons name="time" size={24} color={colors.warning.main} />
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(mockSummaryData.pendingPayments)}
              </Text>
              <Text style={styles.statLabel}>Pending Payments</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.error.main + '15' }]}>
                <Ionicons name="alert-circle" size={24} color={colors.error.main} />
              </View>
              <Text style={styles.statValue}>{mockSummaryData.overdueInvoices}</Text>
              <Text style={styles.statLabel}>Overdue Invoices</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary.main + '15' }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
              </View>
              <Text style={styles.statValue}>{mockSummaryData.activeSubscriptions}</Text>
              <Text style={styles.statLabel}>Active Subscriptions</Text>
            </View>
          </View>
        </View>

        {/* Subscription Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Status</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionRow}>
              <View style={styles.subscriptionInfo}>
                <View style={[styles.statusDot, { backgroundColor: colors.success.main }]} />
                <Text style={styles.subscriptionLabel}>Active</Text>
              </View>
              <Text style={styles.subscriptionValue}>{mockSummaryData.activeSubscriptions}</Text>
            </View>
            <View style={styles.subscriptionRow}>
              <View style={styles.subscriptionInfo}>
                <View style={[styles.statusDot, { backgroundColor: colors.warning.main }]} />
                <Text style={styles.subscriptionLabel}>Trial</Text>
              </View>
              <Text style={styles.subscriptionValue}>2</Text>
            </View>
            <View style={styles.subscriptionRow}>
              <View style={styles.subscriptionInfo}>
                <View style={[styles.statusDot, { backgroundColor: colors.error.main }]} />
                <Text style={styles.subscriptionLabel}>Expired</Text>
              </View>
              <Text style={styles.subscriptionValue}>0</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.info.main} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Per-Tenant Billing</Text>
              <Text style={styles.infoText}>
                For detailed billing information, navigate to a specific tenant and access their
                billing section. Cross-tenant billing aggregation requires additional backend
                support.
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/super-admin/tenants')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary.main + '15' }]}>
              <Ionicons name="business" size={24} color={colors.primary.main} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>View Tenants</Text>
              <Text style={styles.actionSubtitle}>Access tenant billing details</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardDisabled]}
            disabled
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.grey[200] }]}>
              <Ionicons name="download" size={24} color={colors.grey[400]} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.grey[400] }]}>Export Reports</Text>
              <Text style={[styles.actionSubtitle, { color: colors.grey[400] }]}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.grey[300]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardDisabled]}
            disabled
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.grey[200] }]}>
              <Ionicons name="settings" size={24} color={colors.grey[400]} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.grey[400] }]}>Billing Settings</Text>
              <Text style={[styles.actionSubtitle, { color: colors.grey[400] }]}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.grey[300]} />
          </TouchableOpacity>
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
  revenueCard: {
    backgroundColor: colors.success.main + '10',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  revenueLabel: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  revenueValue: {
    ...typography.h1,
    fontWeight: '700',
    color: colors.success.main,
  },
  revenueTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  trendText: {
    ...typography.body2,
    color: colors.success.main,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h5,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  subscriptionCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subscriptionLabel: {
    ...typography.body2,
    color: colors.text.primary,
  },
  subscriptionValue: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.info.main + '10',
    padding: spacing.md,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.info.dark,
    marginBottom: 4,
  },
  infoText: {
    ...typography.body2,
    color: colors.info.dark,
    lineHeight: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.primary,
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
