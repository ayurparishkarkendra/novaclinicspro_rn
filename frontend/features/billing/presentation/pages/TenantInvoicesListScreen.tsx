/**
 * Tenant Invoices List Screen
 * Lists all invoices for the tenant
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useInvoicesListQuery } from '../../data/repositories/billing.repository.impl';
import { InvoiceListItem } from '../components/InvoiceListItem';
import { InvoiceResponse, ListInvoicesParams } from '../../data/models/billing.dtos';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export const TenantInvoicesListScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';

  const [statusFilter, setStatusFilter] = useState('all');

  // Query params
  const queryParams: ListInvoicesParams = {
    limit: 50,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useInvoicesListQuery(tenantId, queryParams);

  const allInvoices = data?.items || [];

  // Client-side filtering since API may not support status filter
  const filteredInvoices = allInvoices.filter((invoice) => {
    if (statusFilter === 'all') return true;
    const status = invoice.status.toLowerCase();
    if (statusFilter === 'paid') return status === 'paid' || status === 'completed';
    if (statusFilter === 'unpaid') return status !== 'paid' && status !== 'completed' && status !== 'cancelled';
    if (statusFilter === 'overdue') {
      if (!invoice.due_date) return false;
      const dueDate = new Date(invoice.due_date);
      return dueDate < new Date() && status !== 'paid' && status !== 'completed';
    }
    return true;
  });

  const handleInvoicePress = useCallback(
    (invoice: InvoiceResponse) => {
      router.push(`/clinic-admin/billing/invoices/${invoice.id}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: InvoiceResponse }) => (
      <InvoiceListItem invoice={item} onPress={() => handleInvoicePress(item)} />
    ),
    [handleInvoicePress]
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === item.value && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(item.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.resultsText}>
        {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary.main} />
      ) : isError ? (
        <>
          <Ionicons name="alert-circle" size={48} color={colors.error.main} />
          <Text style={styles.emptyTitle}>Unable to Load Invoices</Text>
          <Text style={styles.emptySubtitle}>
            {error?.message || 'Please check your connection.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="document-text-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Invoices Found</Text>
          <Text style={styles.emptySubtitle}>
            {statusFilter !== 'all'
              ? 'Try adjusting your filter'
              : 'Create your first invoice'}
          </Text>
          {statusFilter === 'all' && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/clinic-admin/billing/invoices/create')}
            >
              <Ionicons name="add" size={20} color={colors.text.light} />
              <Text style={styles.createButtonText}>Create Invoice</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Invoices</Text>
          <Text style={styles.headerSubtitle}>{data?.total || 0} total</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/clinic-admin/billing/invoices/create')}
        >
          <Ionicons name="add" size={24} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary.main]}
          />
        }
      />
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
  addButton: {
    padding: spacing.xs,
  },
  headerContainer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  filtersContainer: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
  },
  filterChipText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.text.light,
  },
  resultsText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  createButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.light,
  },
});
