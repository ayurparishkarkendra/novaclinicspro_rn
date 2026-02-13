/**
 * Tenant Billing Overview Screen
 * Dashboard showing subscription summary, outstanding balance, and quick actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useSubscriptionSummaryQuery, useInvoicesListQuery } from '../../data/repositories/billing.repository.impl';
import { SubscriptionSummaryCard } from '../components/SubscriptionSummaryCard';
import { InvoiceListItem } from '../components/InvoiceListItem';
import { formatCurrency } from '../../data/models/billing.dtos';

export const TenantBillingOverviewScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Fetch subscription summary
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useSubscriptionSummaryQuery(tenantId);

  // Fetch recent invoices
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    refetch: refetchInvoices,
    isRefetching,
  } = useInvoicesListQuery(tenantId, { limit: 5 });

  const recentInvoices = invoicesData?.items?.slice(0, 5) || [];

  const handleRefresh = () => {
    refetchSummary();
    refetchInvoices();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Billing & Finance</Text>
          <Text style={styles.headerSubtitle}>Manage invoices & payments</Text>
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
        {/* Subscription Summary Card */}
        <SubscriptionSummaryCard
          summary={summary || null}
          isLoading={summaryLoading}
          isError={summaryError}
        />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/clinic-admin/billing/invoices')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary.main + '15' }]}>
                <Ionicons name="document-text" size={24} color={colors.primary.main} />
              </View>
              <Text style={styles.actionTitle}>View Invoices</Text>
              <Text style={styles.actionSubtitle}>All invoices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/clinic-admin/billing/payments')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success.main + '15' }]}>
                <Ionicons name="card" size={24} color={colors.success.main} />
              </View>
              <Text style={styles.actionTitle}>Payments</Text>
              <Text style={styles.actionSubtitle}>Payment history</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/clinic-admin/billing/invoices/create')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.info.main + '15' }]}>
                <Ionicons name="add-circle" size={24} color={colors.info.main} />
              </View>
              <Text style={styles.actionTitle}>New Invoice</Text>
              <Text style={styles.actionSubtitle}>Create invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardDisabled]}
              disabled
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.grey[200] }]}>
                <Ionicons name="settings" size={24} color={colors.grey[400]} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.grey[400] }]}>Settings</Text>
              <Text style={[styles.actionSubtitle, { color: colors.grey[400] }]}>Coming soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Invoices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => router.push('/clinic-admin/billing/invoices')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {invoicesLoading ? (
            <View style={styles.loadingPlaceholder}>
              <Text style={styles.loadingText}>Loading invoices...</Text>
            </View>
          ) : recentInvoices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={40} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No invoices yet</Text>
            </View>
          ) : (
            recentInvoices.map((invoice) => (
              <InvoiceListItem
                key={invoice.id}
                invoice={invoice}
                onPress={() => router.push(`/clinic-admin/billing/invoices/${invoice.id}`)}
              />
            ))
          )}
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
  viewAllText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary.main,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.background.default,
    borderRadius: 16,
    padding: spacing.md,
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
    marginBottom: spacing.sm,
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
  loadingPlaceholder: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});
