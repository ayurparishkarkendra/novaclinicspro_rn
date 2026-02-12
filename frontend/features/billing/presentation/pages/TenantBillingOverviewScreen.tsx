/**
 * Tenant Billing Overview Screen
 * Main billing dashboard for clinic admins
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
import { StatCard } from '../../../../core/components/StatCard';
import { QuickActionButton } from '../../../../core/components/QuickActionButton';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useInvoicesListQuery,
  useSubscriptionSummaryQuery,
} from '../../data/repositories/billing.repository.impl';
import { SubscriptionSummaryCard } from '../components/SubscriptionSummaryCard';
import { InvoiceListItem } from '../components/InvoiceListItem';
import { formatCurrency } from '../../data/models/billing.dtos';

export const TenantBillingOverviewScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';

  // Fetch summary
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

  const recentInvoices = invoicesData?.items || [];

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
          <Text style={styles.headerTitle}>Billing & Subscription</Text>
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
          <View style={styles.actionsRow}>
            <QuickActionButton
              icon="document-text"
              label="Invoices"
              onPress={() => router.push('/clinic-admin/billing/invoices')}
              color={colors.primary.main}
            />
            <QuickActionButton
              icon="cash"
              label="Payments"
              onPress={() => router.push('/clinic-admin/billing/payments')}
              color={colors.success.main}
            />
            <QuickActionButton
              icon="add-circle"
              label="New Invoice"
              onPress={() => router.push('/clinic-admin/billing/invoices/create')}
              color={colors.info.main}
            />
            <QuickActionButton
              icon="wallet"
              label="Record Payment"
              onPress={() => router.push('/clinic-admin/billing/payments/record')}
              color={colors.warning.main}
            />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.section}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StatCard
                title="Outstanding"
                value={summaryLoading ? '...' : formatCurrency(summary?.outstandingBalance || 0)}
                icon="alert-circle"
                color={summary?.outstandingBalance ? colors.warning.main : colors.success.main}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Unpaid Invoices"
                value={summaryLoading ? '...' : (summary?.unpaidInvoices || 0).toString()}
                icon="document"
                color={colors.info.main}
              />
            </View>
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
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading invoices...</Text>
            </View>
          ) : recentInvoices.length > 0 ? (
            recentInvoices.map((invoice) => (
              <InvoiceListItem
                key={invoice.id}
                invoice={invoice}
                onPress={() => router.push(`/clinic-admin/billing/invoices/${invoice.id}`)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No invoices yet</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/clinic-admin/billing/invoices/create')}
              >
                <Text style={styles.createButtonText}>Create First Invoice</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: spacing.xl,
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
    color: colors.primary.main,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  createButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  createButtonText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.light,
  },
});
