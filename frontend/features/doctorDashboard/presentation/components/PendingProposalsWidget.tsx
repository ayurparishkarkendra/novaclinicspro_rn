/**
 * Pending Proposals Widget
 * Shows proposals created by the doctor awaiting scheduling
 * 
 * Requirements: F2.4 - Doctor Dashboard Integration
 * Location: features/doctorDashboard/presentation/components/PendingProposalsWidget.tsx
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
  created_at: string;
  days_ago: number;
}

interface PendingProposalsWidgetProps {
  proposals: PendingProposal[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onViewProposal?: (proposalId: string) => void;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const PendingProposalsWidget: React.FC<PendingProposalsWidgetProps> = ({
  proposals,
  isLoading = false,
  onViewAll,
  onViewProposal,
  testID = 'pending-proposals-widget',
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
            <Text style={styles.title}>Pending Proposals</Text>
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
            <Text style={styles.title}>Pending Proposals</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bulb-outline" size={48} color={colors.text.disabled} />
          <Text style={styles.emptyText}>No pending proposals</Text>
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
          <Text style={styles.title}>Pending Proposals</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} testID={`${testID}-view-all`}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Proposal count */}
      <Text style={styles.countText}>
        💡 {proposals.length} treatment proposal{proposals.length !== 1 ? 's' : ''} awaiting scheduling
      </Text>

      {/* Proposals list */}
      <View style={styles.proposalsList}>
        {proposals.map((proposal) => (
          <TouchableOpacity
            key={proposal.id}
            style={styles.proposalCard}
            onPress={() => onViewProposal?.(proposal.id)}
            testID={`${testID}-proposal-${proposal.id}`}
          >
            <View style={styles.proposalHeader}>
              <Text style={styles.proposalName} numberOfLines={1}>
                {proposal.name} - {proposal.duration_days} days
              </Text>
            </View>
            
            <Text style={styles.clientName} numberOfLines={1}>
              {proposal.client_name}
            </Text>
            
            <Text style={styles.proposedTime}>
              Proposed {proposal.days_ago} day{proposal.days_ago !== 1 ? 's' : ''} ago
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  },
  title: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
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
    gap: spacing.sm,
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
    marginBottom: spacing.xs,
  },
  proposalName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  clientName: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  proposedTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
