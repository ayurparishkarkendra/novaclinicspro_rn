/**
 * Treatment Plans Section Component
 * Displays treatment proposals and sheets organized by status
 * 
 * Features:
 * - Three sections: Proposed, Active, Completed
 * - Proposal cards with status badges and action buttons
 * - Treatment sheet cards with progress bars
 * - Permission-based action buttons
 * - Loading skeleton and empty states
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useTreatmentSheetsByEpisodeQuery } from '../../../treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { useProposalsByEpisodeQuery, useCanScheduleProposalQuery } from '../../../treatmentProposals/data/repositories/proposals.repository.impl';
import { ProposalStatusBadge } from '../../../treatmentProposals/presentation/components/ProposalStatusBadge';
import { TreatmentSheetStatusBadge } from '../../../treatmentProposals/presentation/components/TreatmentSheetStatusBadge';
import { ProgressBar } from '../../../treatmentProposals/presentation/components/ProgressBar';
import { CostDisplay } from '../../../treatmentProposals/presentation/components/CostDisplay';

// ============================================
// TYPES
// ============================================

type TabType = 'proposed' | 'active' | 'completed';

interface TreatmentPlansSectionProps {
  /** Episode ID to fetch treatments for */
  episodeId: string;
  /** Callback when user wants to create a new proposal */
  onCreateProposal?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const TreatmentPlansSection: React.FC<TreatmentPlansSectionProps> = ({
  episodeId,
  onCreateProposal,
}) => {
  const theme = useClinicTheme();
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const [activeTab, setActiveTab] = useState<TabType>('proposed');

  // Check if user is doctor (can create proposals)
  const isDoctor = currentUser?.roles?.includes('DOCTOR') || currentUser?.roles?.includes('VAIDYA');

  // Fetch treatment sheets
  const {
    data: sheetsData,
    isLoading: isLoadingSheets,
    isError: isErrorSheets,
    refetch: refetchSheets,
  } = useTreatmentSheetsByEpisodeQuery(tenantId, episodeId);

  // Fetch proposals
  const {
    data: proposalsData,
    isLoading: isLoadingProposals,
    isError: isErrorProposals,
    refetch: refetchProposals,
  } = useProposalsByEpisodeQuery(tenantId, episodeId);

  // Filter proposals by status
  const proposedProposals = proposalsData?.proposals?.filter(
    (proposal) => proposal.status === 'PROPOSED'
  ) || [];

  const declinedProposals = proposalsData?.proposals?.filter(
    (proposal) => proposal.status === 'DECLINED'
  ) || [];

  // Filter treatment sheets by status
  // Handle both old statuses (DRAFT, FINAL, SIGNED) and new statuses (SCHEDULED, IN_PROGRESS, etc.)
  const activeSheets = sheetsData?.treatment_sheets?.filter(
    (sheet) => {
      const status = sheet.status as string;
      return status === 'SCHEDULED' || status === 'IN_PROGRESS' || status === 'DRAFT';
    }
  ) || [];

  const completedSheets = sheetsData?.treatment_sheets?.filter(
    (sheet) => {
      const status = sheet.status as string;
      return status === 'COMPLETED' || status === 'SIGNED' || status === 'FINAL';
    }
  ) || [];

  // Loading state
  const isLoading = isLoadingSheets || isLoadingProposals;
  const isError = isErrorSheets || isErrorProposals;

  // Check if there's any data to show
  const hasProposals = (proposalsData?.proposals?.length || 0) > 0;
  const hasSheets = (sheetsData?.treatment_sheets?.length || 0) > 0;
  const hasAnyData = hasProposals || hasSheets;

  // Don't render section if no data and not loading
  if (!isLoading && !hasAnyData) {
    return null;
  }

  // Handle refresh
  const handleRefresh = () => {
    refetchSheets();
    refetchProposals();
  };

  // Render tab button
  const renderTabButton = (tab: TabType, label: string, count: number) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[
          styles.tab,
          isActive && { borderBottomColor: theme.colors.primary.default },
        ]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            { color: isActive ? theme.colors.primary.default : theme.colors.text.secondary },
          ]}
        >
          {label}
        </Text>
        {count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: theme.colors.primary.light }]}>
            <Text style={[styles.countText, { color: theme.colors.primary.default }]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={[styles.centerText, { color: theme.colors.text.secondary }]}>
            Loading treatment plans...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.feedback.error} />
          <Text style={[styles.centerText, { color: theme.colors.text.secondary }]}>
            Failed to load treatment plans
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary.default }]}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.background.default }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'proposed':
        return (
          <View style={styles.tabContent}>
            {isDoctor && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.colors.primary.default }]}
                onPress={onCreateProposal}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color={theme.colors.background.default} />
                <Text style={[styles.createButtonText, { color: theme.colors.background.default }]}>
                  Propose New Treatment
                </Text>
              </TouchableOpacity>
            )}

            {proposedProposals.length === 0 && declinedProposals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                  No proposed treatments
                </Text>
                {isDoctor && (
                  <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
                    Create a treatment proposal to get started
                  </Text>
                )}
              </View>
            ) : (
              <>
                {proposedProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    tenantId={tenantId}
                    theme={theme}
                    router={router}
                  />
                ))}
                {declinedProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    tenantId={tenantId}
                    theme={theme}
                    router={router}
                  />
                ))}
              </>
            )}
          </View>
        );

      case 'active':
        return (
          <View style={styles.tabContent}>
            {activeSheets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                  No active treatment series
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
                  Schedule a proposal to start treatment
                </Text>
              </View>
            ) : (
              activeSheets.map((sheet) => (
                <TreatmentSheetCard
                  key={sheet.id}
                  sheet={sheet}
                  tenantId={tenantId}
                  theme={theme}
                  router={router}
                />
              ))
            )}
          </View>
        );

      case 'completed':
        return (
          <View style={styles.tabContent}>
            {completedSheets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                  No completed treatments
                </Text>
              </View>
            ) : (
              completedSheets.map((sheet) => (
                <TreatmentSheetCard
                  key={sheet.id}
                  sheet={sheet}
                  tenantId={tenantId}
                  theme={theme}
                  router={router}
                />
              ))
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Treatment Plans
      </Text>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border.default }]}>
        {renderTabButton('proposed', 'Proposed', proposedProposals.length + declinedProposals.length)}
        {renderTabButton('active', 'Active', activeSheets.length)}
        {renderTabButton('completed', 'Completed', completedSheets.length)}
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
};

// ============================================
// PROPOSAL CARD
// ============================================

interface ProposalCardProps {
  proposal: any;
  tenantId: string;
  theme: any;
  router: any;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  tenantId,
  theme,
  router,
}) => {
  // Check if user can schedule
  const { data: canScheduleResult } = useCanScheduleProposalQuery(tenantId, proposal.id);
  const canSchedule = canScheduleResult?.allowed ?? false;

  const handleViewProposal = () => {
    router.push({
      pathname: '/clinic-admin/proposals/[proposalId]',
      params: { proposalId: proposal.id },
    });
  };

  const handleSchedule = () => {
    // TODO: Navigate to scheduling wizard
    console.log('Schedule proposal:', proposal.id);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface.elevated,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={proposal.status === 'DECLINED' ? theme.colors.text.tertiary : theme.colors.feedback.warning}
          />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {proposal.treatment_type || proposal.name || 'Untitled Treatment'}
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.text.secondary }]}>
            {proposal.proposed_duration_days || proposal.duration_days || 0} days
          </Text>
        </View>
        <ProposalStatusBadge status={proposal.status} size="small" />
      </View>

      {/* Cost */}
      {(proposal.estimated_cost_min || proposal.estimated_cost_max) && (
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color={theme.colors.text.secondary} />
          <CostDisplay
            min={proposal.estimated_cost_min}
            max={proposal.estimated_cost_max}
            currency={proposal.currency}
            label="Estimated"
            size="small"
            inline={true}
          />
        </View>
      )}

      {/* Created by */}
      {proposal.proposed_by_staff_name && (
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
            Proposed by {proposal.proposed_by_staff_name} on {formatDate(proposal.proposed_at || proposal.created_at)}
          </Text>
        </View>
      )}

      {/* Decline reason */}
      {proposal.status === 'DECLINED' && (proposal.status_notes || proposal.decline_reason) && (
        <View style={[styles.declineReasonBox, { backgroundColor: theme.colors.feedback.error + '10' }]}>
          <Text style={[styles.declineReasonLabel, { color: theme.colors.feedback.error }]}>
            Decline Reason:
          </Text>
          <Text style={[styles.declineReasonText, { color: theme.colors.text.secondary }]}>
            {proposal.status_notes || proposal.decline_reason}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { borderColor: theme.colors.border.default },
          ]}
          onPress={handleViewProposal}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.primary.default }]}>
            View Details
          </Text>
        </TouchableOpacity>

        {canSchedule && proposal.status === 'PROPOSED' && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary.default }]}
            onPress={handleSchedule}
            activeOpacity={0.7}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.surface.elevated }]}>
              Schedule
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============================================
// TREATMENT SHEET CARD
// ============================================

interface TreatmentSheetCardProps {
  sheet: any;
  tenantId: string;
  theme: any;
  router: any;
}

const TreatmentSheetCard: React.FC<TreatmentSheetCardProps> = ({
  sheet,
  tenantId,
  theme,
  router,
}) => {
  // Calculate progress
  const completedDays = sheet.rows?.filter((row: any) => row.status === 'COMPLETED').length || 0;
  const totalDays = sheet.duration_days || sheet.rows?.length || 0;
  const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  // Find next session
  const today = new Date();
  const nextSession = sheet.rows
    ?.filter((row: any) => row.session_date && new Date(row.session_date) >= today)
    .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0];

  // Format date
  const formatSessionDate = (dateString: string): string => {
    const date = new Date(dateString);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleViewSheet = () => {
    router.push({
      pathname: '/clinic-admin/treatment-sheets/[treatmentSheetId]',
      params: { treatmentSheetId: sheet.id },
    });
  };

  const handlePause = () => {
    // TODO: Implement pause functionality
    console.log('Pause sheet:', sheet.id);
  };

  const handleCancel = () => {
    // TODO: Implement cancel functionality
    console.log('Cancel sheet:', sheet.id);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface.elevated,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={20} color={theme.colors.feedback.info} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {sheet.proposal?.treatment_type || sheet.proposal?.name || 'Multi-Day Treatment'}
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.text.secondary }]}>
            {totalDays} days
          </Text>
        </View>
        <TreatmentSheetStatusBadge status={sheet.status} size="small" />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.colors.text.secondary }]}>
            Progress
          </Text>
          <Text style={[styles.progressValue, { color: theme.colors.text.primary }]}>
            {completedDays}/{totalDays} days ({Math.round(progressPercentage)}%)
          </Text>
        </View>
        <ProgressBar progress={progressPercentage} height={8} />
      </View>

      {/* Date range */}
      {sheet.start_date && (
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
            Started: {formatDate(sheet.start_date)}
            {sheet.end_date && ` • Ends: ${formatDate(sheet.end_date)}`}
          </Text>
        </View>
      )}

      {/* Next Session */}
      {nextSession && sheet.status !== 'COMPLETED' && (
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
            Next Session:{' '}
            <Text style={{ color: theme.colors.text.primary, fontWeight: '600' }}>
              {formatSessionDate(nextSession.session_date)}, {nextSession.scheduled_time || 'Time TBD'}
            </Text>
          </Text>
        </View>
      )}

      {/* Package cost */}
      {sheet.agreed_package_cost && (
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
            Package: {sheet.currency || 'INR'} {sheet.agreed_package_cost.toLocaleString()}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary.default, flex: 1 }]}
          onPress={handleViewSheet}
          activeOpacity={0.7}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.surface.elevated }]}>
            View Treatment Sheet
          </Text>
        </TouchableOpacity>
      </View>

      {sheet.status === 'IN_PROGRESS' && (
        <View style={[styles.actionsRow, { marginTop: 8 }]}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.border.default, flex: 1 },
            ]}
            onPress={handlePause}
            activeOpacity={0.7}
          >
            <Ionicons name="pause-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text.secondary }]}>
              Pause
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.feedback.error, flex: 1 },
            ]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close-outline" size={16} color={theme.colors.feedback.error} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.feedback.error }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabContent: {
    gap: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 4,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  centerText: {
    fontSize: 14,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  declineReasonBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  declineReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  declineReasonText: {
    fontSize: 13,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
