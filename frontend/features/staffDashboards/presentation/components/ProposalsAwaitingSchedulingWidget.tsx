/**
 * Proposals Awaiting Scheduling Widget
 * Shows proposals that need scheduling with "Schedule Now" button
 * 
 * Requirements: F2.5 - Admin Dashboard Integration
 * Location: features/staffDashboards/presentation/components/ProposalsAwaitingSchedulingWidget.tsx
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useFeatures, hasMultiDayAppointments } from '../../../../core/hooks/useFeatures';

// ============================================
// TYPES
// ============================================

interface PendingProposal {
  id: string;
  name: string;
  duration_days: number;
  client_name: string;
  created_by_name: string;
  created_at: string;
  days_ago: number;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  currency?: string;
}

interface ProposalsAwaitingSchedulingWidgetProps {
  proposals: PendingProposal[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onScheduleNow?: (proposalId: string) => void;
  testID?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
};

const formatCostRange = (min?: number, max?: number, currency?: string): string => {
  if (!min && !max) return 'Cost to be determined';
  if (min && max) {
    return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
  }
  if (min) return `From ${formatCurrency(min, currency)}`;
  if (max) return `Up to ${formatCurrency(max, currency)}`;
  return 'Cost to be determined';
};

// ============================================
// COMPONENT
// ============================================

export const ProposalsAwaitingSchedulingWidget: React.FC<ProposalsAwaitingSchedulingWidgetProps> = ({
  proposals,
  isLoading = false,
  onViewAll,
  onScheduleNow,
  testID = 'proposals-awaiting-scheduling-widget',
}) => {
  const features = useFeatures();

  // Don't render if multi-day appointments are not enabled
  if (!hasMultiDayAppointments(features)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="bulb" size={20} color={colors.warning.main} />
            <Text style={styles.title}>Proposals Awaiting Scheduling</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.warning.main} />
          <Text style={styles.loadingText}>Loading proposals...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (proposals.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="bulb" size={20} color={colors.warning.main} />
            <Text style={styles.title}>Proposals Awaiting Scheduling</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success.main} />
          <Text style={styles.emptyText}>All proposals have been scheduled</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color={colors.warning.main} />
          <Text style={styles.title}>Proposals Awaiting Scheduling</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} testID={`${testID}-view-all`}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Proposal count */}
      <Text style={styles.countText}>
        💡 {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} need{proposals.length === 1 ? 's' : ''} scheduling
      </Text>

      {/* Proposals list */}
      <View style={styles.proposalsList}>
        {proposals.map((proposal) => (
          <View
            key={proposal.id}
            style={styles.proposalCard}
            testID={`${testID}-proposal-${proposal.id}`}
          >
            {/* Proposal header */}
            <View style={styles.proposalHeader}>
              <Text style={styles.proposalName} numberOfLines={1}>
                {proposal.name} - {proposal.duration_days} days
              </Text>
            </View>

            {/* Client info */}
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>Client: {proposal.client_name}</Text>
            </View>

            {/* Proposed by */}
            <View style={styles.infoRow}>
              <Ionicons name="medical-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                Proposed by: {proposal.created_by_name} ({proposal.days_ago} day{proposal.days_ago !== 1 ? 's' : ''} ago)
              </Text>
            </View>

            {/* Estimated cost */}
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {formatCostRange(proposal.estimated_cost_min, proposal.estimated_cost_max, proposal.currency)}
              </Text>
            </View>

            {/* Schedule button */}
            {onScheduleNow && (
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={() => onScheduleNow(proposal.id)}
                testID={`${testID}-schedule-${proposal.id}`}
              >
                <Ionicons name="calendar" size={16} color={colors.common.white} />
                <Text style={styles.scheduleButtonText}>Schedule Now</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* View all button */}
      {onViewAll && proposals.length > 3 && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAll}
          testID={`${testID}-view-all-bottom`}
        >
          <Text style={styles.viewAllButtonText}>View All Proposals</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  viewAllText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  countText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  proposalsList: {
    gap: spacing.md,
  },
  proposalCard: {
    backgroundColor: colors.background.default,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning.main,
  },
  proposalHeader: {
    marginBottom: spacing.sm,
  },
  proposalName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body2,
    color: colors.text.secondary,
    flex: 1,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  scheduleButtonText: {
    ...typography.button,
    color: colors.common.white,
    fontSize: 13,
  },
  viewAllButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  viewAllButtonText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
