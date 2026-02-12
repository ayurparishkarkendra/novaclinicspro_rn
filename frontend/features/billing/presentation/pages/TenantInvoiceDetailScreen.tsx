/**
 * Tenant Invoice Detail Screen
 * Displays detailed information about an invoice
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useInvoiceDetailQuery,
  usePaymentsForInvoiceQuery,
} from '../../data/repositories/billing.repository.impl';
import { InvoiceStatusBadge } from '../components/InvoiceStatusBadge';
import { PaymentListItem } from '../components/PaymentListItem';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  parseAmount,
  isInvoiceOverdue,
  isInvoicePaid,
} from '../../data/models/billing.dtos';

export const TenantInvoiceDetailScreen: React.FC = () => {
  const router = useRouter();
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';

  const [showPayments, setShowPayments] = useState(true);

  // Fetch invoice detail
  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useInvoiceDetailQuery(tenantId, invoiceId || '');

  // Fetch payments for this invoice
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
  } = usePaymentsForInvoiceQuery(tenantId, invoiceId || '');

  const payments = paymentsData?.items || [];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !invoice) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error.main} />
          <Text style={styles.errorTitle}>Unable to Load Invoice</Text>
          <Text style={styles.errorSubtitle}>
            {error?.message || 'Please check your connection.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalAmount = parseAmount(invoice.total_amount);
  const paidAmount = payments.reduce((sum, p) => sum + parseAmount(p.amount), 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const isOverdue = isInvoiceOverdue(invoice);
  const isPaid = isInvoicePaid(invoice);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {invoice.invoice_number}
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/clinic-admin/billing/invoices/${invoiceId}/edit`)}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary.main} />
        </TouchableOpacity>
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
        {/* Status Card */}
        <View style={[styles.statusCard, isOverdue && styles.statusCardOverdue]}>
          <InvoiceStatusBadge status={invoice.status} />
          {isOverdue && (
            <Text style={styles.overdueText}>This invoice is overdue</Text>
          )}
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(invoice.total_amount, invoice.currency)}
          </Text>
          {!isPaid && payments.length > 0 && (
            <View style={styles.paymentProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(paidAmount / totalAmount) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {formatCurrency(paidAmount)} paid • {formatCurrency(remainingAmount)} remaining
              </Text>
            </View>
          )}
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice Date</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.invoice_date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={[styles.detailValue, isOverdue && styles.detailValueOverdue]}>
              {formatDate(invoice.due_date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Currency</Text>
            <Text style={styles.detailValue}>{invoice.currency || 'INR'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{formatDateTime(invoice.created_at)}</Text>
          </View>
        </View>

        {/* Line Items */}
        {invoice.lines && invoice.lines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            {invoice.lines.map((line, index) => (
              <View key={line.id || index} style={styles.lineItem}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.lineItemDescription}>
                    {line.description || `Item ${index + 1}`}
                  </Text>
                  <Text style={styles.lineItemTotal}>
                    {formatCurrency(line.line_total)}
                  </Text>
                </View>
                <Text style={styles.lineItemDetails}>
                  {parseAmount(line.quantity)} x {formatCurrency(line.unit_price)}
                  {parseAmount(line.tax_percentage) > 0 &&
                    ` + ${parseAmount(line.tax_percentage)}% tax`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.subtotal_amount, invoice.currency)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.tax_amount, invoice.currency)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(invoice.discount_amount, invoice.currency)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoice.total_amount, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payments */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPayments(!showPayments)}
          >
            <Text style={styles.sectionTitle}>Payments ({payments.length})</Text>
            <Ionicons
              name={showPayments ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {showPayments && (
            <View style={styles.paymentsList}>
              {paymentsLoading ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <PaymentListItem
                    key={payment.id}
                    payment={payment}
                    onPress={() =>
                      router.push(`/clinic-admin/billing/payments/${payment.id}`)
                    }
                  />
                ))
              ) : (
                <Text style={styles.noPaymentsText}>No payments recorded yet</Text>
              )}
            </View>
          )}
        </View>

        {/* Record Payment Button */}
        {!isPaid && (
          <TouchableOpacity
            style={styles.recordPaymentButton}
            onPress={() =>
              router.push(
                `/clinic-admin/billing/payments/record?invoiceId=${invoiceId}&clientId=${invoice.client_id}&amount=${remainingAmount}`
              )
            }
          >
            <Ionicons name="cash" size={24} color={colors.text.light} />
            <Text style={styles.recordPaymentButtonText}>Record Payment</Text>
          </TouchableOpacity>
        )}
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
  headerTitle: {
    flex: 1,
    ...typography.h6,
    color: colors.text.primary,
  },
  editButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  statusCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusCardOverdue: {
    backgroundColor: colors.error.main + '10',
  },
  overdueText: {
    ...typography.caption,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  amountCard: {
    backgroundColor: colors.primary.main + '10',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amountLabel: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  amountValue: {
    ...typography.h2,
    fontWeight: '700',
    color: colors.primary.main,
    marginTop: 4,
  },
  paymentProgress: {
    width: '100%',
    marginTop: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.grey[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success.main,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detailLabel: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
  },
  detailValueOverdue: {
    color: colors.error.main,
  },
  lineItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemDescription: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  lineItemTotal: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.primary.main,
  },
  lineItemDetails: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  totalsCard: {
    backgroundColor: colors.grey[50],
    borderRadius: 8,
    padding: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  totalValue: {
    ...typography.body2,
    color: colors.text.primary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  grandTotalLabel: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.primary,
  },
  grandTotalValue: {
    ...typography.h6,
    fontWeight: '700',
    color: colors.primary.main,
  },
  paymentsList: {
    marginTop: spacing.sm,
  },
  noPaymentsText: {
    ...typography.body2,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  recordPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success.main,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  recordPaymentButtonText: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.light,
  },
});
