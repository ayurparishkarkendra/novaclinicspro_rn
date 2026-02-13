/**
 * Tenant Payments List Screen
 * Lists payments - note: API only supports listing payments per invoice
 * This screen shows a message directing users to view payments via invoices
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
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useInvoicesListQuery } from '../../data/repositories/billing.repository.impl';
import { formatCurrency, formatDate, isInvoicePaid } from '../../data/models/billing.dtos';

export const TenantPaymentsListScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Fetch invoices to show paid ones
  const {
    data: invoicesData,
    isLoading,
    isRefetching,
    refetch,
  } = useInvoicesListQuery(tenantId, { limit: 50 });

  const allInvoices = invoicesData?.items || [];
  const paidInvoices = allInvoices.filter((inv) => isInvoicePaid(inv));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Payments</Text>
          <Text style={styles.headerSubtitle}>Payment history</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary.main]}
          />
        }
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info.main} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Payment Records</Text>
            <Text style={styles.infoText}>
              Payments are linked to specific invoices. To view or record payments, 
              open an invoice and access the payments section.
            </Text>
          </View>
        </View>

        {/* Paid Invoices Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paid Invoices</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
            </View>
          ) : paidInvoices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No Paid Invoices</Text>
              <Text style={styles.emptySubtitle}>
                Once invoices are paid, they will appear here.
              </Text>
            </View>
          ) : (
            paidInvoices.map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.invoiceCard}
                onPress={() => router.push(`/clinic-admin/billing/invoices/${invoice.id}`)}
              >
                <View style={styles.invoiceIcon}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
                </View>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                  <Text style={styles.invoiceDate}>Paid on {formatDate(invoice.updated_at)}</Text>
                </View>
                <View style={styles.invoiceAmount}>
                  <Text style={styles.amountText}>
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/clinic-admin/billing/invoices')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary.main + '15' }]}>
              <Ionicons name="document-text" size={24} color={colors.primary.main} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>View All Invoices</Text>
              <Text style={styles.actionSubtitle}>See unpaid invoices and record payments</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.info.main + '10',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.lg,
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  invoiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.success.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.primary,
  },
  invoiceDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  invoiceAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  amountText: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.success.main,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
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
