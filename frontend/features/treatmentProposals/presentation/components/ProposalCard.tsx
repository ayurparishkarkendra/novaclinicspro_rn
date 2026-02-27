/**
 * Proposal Card Component
 * Displays treatment proposal information in a card format for list views
 * 
 * Features:
 * - Shows proposal name, status badge, cost range, created date
 * - Conditional buttons based on permissions (can-edit, can-schedule)
 * - Tappable card navigates to detail screen
 * - Handles button clicks (view details, edit, schedule)
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
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  TreatmentProposal,
  formatDate,
  formatCostRange,
} from '../../data/models/treatmentProposals.dtos';
import { useCanEditProposalQuery, useCanScheduleProposalQuery } from '../../data/repositories/proposals.repository.impl';
import { ProposalStatusBadge } from './ProposalStatusBadge';

// ============================================
// TYPES
// ============================================

interface ProposalCardProps {
  /** The treatment proposal to display */
  proposal: TreatmentProposal;
  /** Callback when edit button is clicked */
  onEdit?: (proposal: TreatmentProposal) => void;
  /** Callback when schedule button is clicked */
  onSchedule?: (proposal: TreatmentProposal) => void;
  /** Show compact version (smaller, less info) */
  compact?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onEdit,
  onSchedule,
  compact = false,
}) => {
  const theme = useClinicTheme();
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Check permissions
  const { data: canEditResult, isLoading: isCheckingEdit } = useCanEditProposalQuery(
    tenantId,
    proposal.id
  );

  const { data: canScheduleResult, isLoading: isCheckingSchedule } = useCanScheduleProposalQuery(
    tenantId,
    proposal.id
  );

  const canEdit = canEditResult?.allowed ?? false;
  const canSchedule = canScheduleResult?.allowed ?? false;

  // Handlers
  const handleViewDetails = () => {
    router.push({
      pathname: '/clinic-admin/proposals/[proposalId]',
      params: { proposalId: proposal.id },
    });
  };

  const handleEditPress = (e: any) => {
    e.stopPropagation(); // Prevent card press
    if (onEdit) {
      onEdit(proposal);
    }
  };

  const handleSchedulePress = (e: any) => {
    e.stopPropagation(); // Prevent card press
    if (onSchedule) {
      onSchedule(proposal);
    }
  };

  // Render
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface.elevated,
          borderColor: theme.colors.border.default,
        },
        compact && styles.cardCompact,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Treatment proposal: ${proposal.treatment_type || proposal.name}, ${proposal.proposed_duration_days || proposal.duration_days} days`}
      accessibilityHint="Tap to view proposal details"
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.text.primary },
              compact && styles.titleCompact,
            ]}
            numberOfLines={1}
          >
            {proposal.treatment_type || proposal.name || 'Untitled Treatment'}
          </Text>
          <Text
            style={[
              styles.duration,
              { color: theme.colors.text.secondary },
              compact && styles.durationCompact,
            ]}
          >
            {(proposal.proposed_duration_days || proposal.duration_days || 0)}{' '}
            {(proposal.proposed_duration_days || proposal.duration_days || 0) === 1 ? 'day' : 'days'}
          </Text>
        </View>
        <ProposalStatusBadge status={proposal.status} size={compact ? 'small' : 'medium'} />
      </View>

      {/* Cost and Date Row */}
      {!compact && (
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons
              name="cash-outline"
              size={14}
              color={theme.colors.text.secondary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              {formatCostRange(
                proposal.estimated_cost_min,
                proposal.estimated_cost_max,
                proposal.currency
              )}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={theme.colors.text.secondary}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              {formatDate(proposal.proposed_at || proposal.created_at)}
            </Text>
          </View>
        </View>
      )}

      {/* Modalities (if not compact) */}
      {!compact && proposal.modalities && proposal.modalities.length > 0 && (
        <View style={styles.modalitiesRow}>
          <Text
            style={[styles.modalitiesText, { color: theme.colors.text.secondary }]}
            numberOfLines={1}
          >
            {proposal.modalities.join(', ')}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* View Details Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonPrimary,
            { backgroundColor: theme.colors.primary.default + '15' },
          ]}
          onPress={handleViewDetails}
          accessibilityRole="button"
          accessibilityLabel="View proposal details"
        >
          <Ionicons name="eye-outline" size={16} color={theme.colors.primary.default} />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary.default }]}>
            View Details
          </Text>
        </TouchableOpacity>

        {/* Edit Button (conditional) */}
        {isCheckingEdit ? (
          <View style={[styles.actionButton, styles.actionButtonSecondary]}>
            <ActivityIndicator size="small" color={theme.colors.text.secondary} />
          </View>
        ) : canEdit ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonSecondary,
              { borderColor: theme.colors.border.default },
            ]}
            onPress={handleEditPress}
            accessibilityRole="button"
            accessibilityLabel="Edit proposal"
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.text.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Schedule Button (conditional, admin only) */}
        {isCheckingSchedule ? (
          <View style={[styles.actionButton, styles.actionButtonSecondary]}>
            <ActivityIndicator size="small" color={theme.colors.text.secondary} />
          </View>
        ) : canSchedule ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonSuccess,
              { backgroundColor: theme.colors.feedback.success + '15' },
            ]}
            onPress={handleSchedulePress}
            accessibilityRole="button"
            accessibilityLabel="Schedule treatment series"
          >
            <Ionicons name="calendar-outline" size={16} color={theme.colors.feedback.success} />
            <Text style={[styles.actionButtonText, { color: theme.colors.feedback.success }]}>
              Schedule
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompact: {
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 14,
  },
  duration: {
    fontSize: 13,
    fontWeight: '500',
  },
  durationCompact: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalitiesRow: {
    marginBottom: 12,
  },
  modalitiesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonPrimary: {
    // Background color set inline
  },
  actionButtonSecondary: {
    borderWidth: 1,
  },
  actionButtonSuccess: {
    // Background color set inline
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

