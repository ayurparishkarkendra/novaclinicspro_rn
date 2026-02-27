/**
 * Proposed Treatment Plans Section Component
 * Displays list of treatment proposals for an episode
 * Used in CasesheetDetailScreen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useProposalsByEpisodeQuery, useCanCreateProposalQuery } from '../../data/repositories/proposals.repository.impl';
import { ProposalCard } from './ProposalCard';

// ============================================
// TYPES
// ============================================

interface ProposedTreatmentPlansSectionProps {
  tenantId: string;
  episodeId: string;
  onCreateProposal?: () => void;
  onViewProposal?: (proposalId: string) => void;
  onEditProposal?: (proposalId: string) => void;
  onScheduleProposal?: (proposalId: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export const ProposedTreatmentPlansSection: React.FC<ProposedTreatmentPlansSectionProps> = ({
  tenantId,
  episodeId,
  onCreateProposal,
  onViewProposal,
  onEditProposal,
  onScheduleProposal,
}) => {
  const theme = useClinicTheme();

  // Fetch proposals for this episode
  const {
    data: proposalsData,
    isLoading: isLoadingProposals,
    isError: isProposalsError,
    refetch: refetchProposals,
  } = useProposalsByEpisodeQuery(tenantId, episodeId);

  // Check if user can create proposals
  const {
    data: canCreateData,
    isLoading: isLoadingCanCreate,
    isError: isCanCreateError,
  } = useCanCreateProposalQuery(tenantId, episodeId);

  const proposals = proposalsData?.proposals || [];
  // If permission check fails, default to true to show the button (let backend reject if needed)
  const canCreate = isCanCreateError ? true : (canCreateData?.allowed || false);

  // Debug logging
  console.log('[ProposedTreatmentPlansSection] Can create:', { 
    canCreate, 
    isLoadingCanCreate,
    isCanCreateError,
    canCreateData,
    hasCallback: !!onCreateProposal,
    proposalsCount: proposals.length
  });

  // Loading state
  if (isLoadingProposals) {
    return (
      <View style={[styles.section, { borderColor: theme.colors.border.default }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.feedback.infoLight }]}>
              <Ionicons name="document-text" size={20} color={theme.colors.feedback.info} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                Proposed Treatment Plans
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                Loading...
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary.default} />
        </View>
      </View>
    );
  }

  // Error state
  if (isProposalsError) {
    return (
      <View style={[styles.section, { borderColor: theme.colors.border.default }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.feedback.infoLight }]}>
              <Ionicons name="document-text" size={20} color={theme.colors.feedback.info} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                Proposed Treatment Plans
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.feedback.error }]}>
            Failed to load proposals
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: theme.colors.primary.default }]}
            onPress={() => refetchProposals()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading proposals"
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.primary.default }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, { borderColor: theme.colors.border.default }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.feedback.infoLight }]}>
            <Ionicons name="document-text" size={20} color={theme.colors.feedback.info} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Proposed Treatment Plans
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {proposals.length === 0
                ? 'No proposals yet'
                : `${proposals.length} proposal${proposals.length > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>
        
        {/* Create Button in Header (when there are proposals) */}
        {proposals.length > 0 && canCreate && onCreateProposal && (
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.primary.default }]}
            onPress={onCreateProposal}
            accessibilityRole="button"
            accessibilityLabel="Propose new treatment plan"
          >
            <Ionicons name="add" size={20} color={theme.colors.primary.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Proposals List */}
      {proposals.length > 0 && (
        <View style={styles.proposalsList}>
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onEdit={(p) => onEditProposal?.(p.id)}
              onSchedule={(p) => onScheduleProposal?.(p.id)}
            />
          ))}
        </View>
      )}

      {/* Empty State with Create Button */}
      {proposals.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={40} color={theme.colors.text.secondary} />
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            No treatment plans proposed yet
          </Text>
          
          {/* Create Button for Empty State */}
          {onCreateProposal && (
            <>
              {isLoadingCanCreate ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary.default} />
                  <Text style={[styles.loadingButtonText, { color: theme.colors.text.secondary }]}>
                    Checking permissions...
                  </Text>
                </View>
              ) : canCreate ? (
                <TouchableOpacity
                  style={[
                    styles.emptyStateButton,
                    { backgroundColor: theme.colors.primary.default },
                  ]}
                  onPress={onCreateProposal}
                  accessibilityRole="button"
                  accessibilityLabel="Propose treatment plan"
                >
                  <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary.onPrimary} />
                  <Text style={[styles.emptyStateButtonText, { color: theme.colors.primary.onPrimary }]}>
                    Propose Treatment Plan
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cannotCreateText, { color: theme.colors.text.tertiary }]}>
                  {canCreateData?.reason || 'Cannot create proposals at this time'}
                </Text>
              )}
            </>
          )}
        </View>
      )}

      {/* Create Button at Bottom (when there are proposals) */}
      {proposals.length > 0 && canCreate && onCreateProposal && (
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: theme.colors.feedback.infoLight, borderColor: theme.colors.feedback.info + '50' },
          ]}
          onPress={onCreateProposal}
          accessibilityRole="button"
          accessibilityLabel="Propose treatment plan"
          disabled={isLoadingCanCreate}
        >
          <Ionicons name="add-circle-outline" size={18} color={theme.colors.feedback.info} />
          <Text style={[styles.createButtonText, { color: theme.colors.feedback.info }]}>
            Propose Treatment Plan
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  proposalsList: {
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cannotCreateText: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loadingButtonText: {
    fontSize: 13,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
