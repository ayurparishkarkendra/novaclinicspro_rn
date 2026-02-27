/**
 * Proposal Detail Screen
 * Displays full details of a treatment proposal
 * 
 * Features:
 * - Display all proposal fields (name, duration, modalities, goals, contraindications, cost)
 * - Display status badge
 * - Display created by and created at
 * - Edit button (only if can-edit)
 * - Schedule button (only if can-schedule, admin only)
 * - Decline button (admin only)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useProposalDetailQuery,
  useCanEditProposalQuery,
  useCanScheduleProposalQuery,
  useDeclineProposalMutation,
} from '../../data/repositories/proposals.repository.impl';
import { ProposalStatusBadge } from '../components/ProposalStatusBadge';
import { CostDisplay } from '../components/CostDisplay';
import { useSchedulingWizardStore } from '../stores/schedulingWizard.store';
import { SchedulingWizard } from './SchedulingWizard';

export const ProposalDetailScreen: React.FC = () => {
  const { proposalId } = useLocalSearchParams<{ proposalId: string }>();
  const theme = useClinicTheme();
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  
  // Scheduling wizard store
  const openWizard = useSchedulingWizardStore((state) => state.openWizard);

  // Fetch proposal
  const {
    data: proposal,
    isLoading,
    isError,
    error,
    refetch,
  } = useProposalDetailQuery(tenantId, proposalId as string);

  // Check permissions (handle errors gracefully)
  const { data: canEditResult, isError: isEditError } = useCanEditProposalQuery(tenantId, proposalId as string);
  const { data: canScheduleResult, isError: isScheduleError } = useCanScheduleProposalQuery(tenantId, proposalId as string);

  const canEdit = isEditError ? false : (canEditResult?.allowed ?? false);
  // For schedule button: if admin and status is PROPOSED, show button even if permission check fails
  const canSchedule = isScheduleError ? false : (canScheduleResult?.allowed ?? false);

  // Check if user is admin (check multiple role formats)
  const userRoles = currentUser?.roles?.map(r => r.toLowerCase()) || [];
  const isAdmin = userRoles.includes('admin') || 
                  userRoles.includes('clinic admin') || 
                  userRoles.includes('clinic_admin') ||
                  userRoles.includes('tenant admin') ||
                  userRoles.includes('tenant_admin') ||
                  currentUser?.isOrgAdmin === true;

  // Debug logging
  React.useEffect(() => {
    console.log('[ProposalDetailScreen] Permission check:', {
      proposalId,
      canEdit,
      canSchedule,
      isAdmin,
      userRoles,
      currentUserRoles: currentUser?.roles,
      proposalStatus: proposal?.status,
      isEditError,
      isScheduleError,
      canEditResult,
      canScheduleResult,
      shouldShowScheduleButton: isAdmin && proposal?.status === 'PROPOSED',
    });
  }, [proposalId, canEdit, canSchedule, isAdmin, userRoles, currentUser?.roles, proposal?.status, isEditError, isScheduleError, canEditResult, canScheduleResult]);

  // Decline mutation
  const declineMutation = useDeclineProposalMutation(tenantId, proposalId as string, {
    onSuccess: () => {
      Alert.alert('Success', 'Proposal declined successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to decline proposal');
    },
  });

  // Handlers
  const handleEdit = () => {
    router.push({
      pathname: '/clinic-admin/proposals/edit/[proposalId]',
      params: { proposalId: proposalId as string },
    });
  };

  const handleSchedule = () => {
    if (!proposal) return;
    
    // Open scheduling wizard with proposal data
    openWizard(
      proposal.id,
      proposal.treatment_type || proposal.name || 'Treatment',
      proposal.proposed_duration_days || proposal.duration_days || 0,
      proposal.estimated_cost_min || proposal.estimated_cost_max
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Proposal',
      'Are you sure you want to decline this proposal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Decline Reason',
              'Please provide a reason for declining:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Submit',
                  onPress: (reason?: string) => {
                    if (reason && reason.trim()) {
                      declineMutation.mutate({ decline_reason: reason.trim() });
                    } else {
                      Alert.alert('Error', 'Please provide a decline reason');
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={[styles.centerText, { color: theme.colors.text.secondary }]}>
            Loading proposal...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !proposal) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.feedback.error} />
          <Text style={[styles.centerText, { color: theme.colors.text.secondary }]}>
            {error?.message || 'Failed to load proposal'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary.default }]}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.background.default }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
      {/* Header with Back Button */}
      <View style={[styles.pageHeader, { borderBottomColor: theme.colors.border.default }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.pageHeaderTitle}>
          <Text style={[styles.pageTitle, { color: theme.colors.text.primary }]}>
            Proposal Details
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title and Status */}
        <View style={styles.titleSection}>
          <View style={styles.titleLeft}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {proposal.treatment_type || proposal.name || 'Untitled Treatment'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {proposal.proposed_duration_days || proposal.duration_days || 0} days
            </Text>
          </View>
          <ProposalStatusBadge status={proposal.status} size="medium" />
        </View>

        {/* Cost Section */}
        {(proposal.estimated_cost_min || proposal.estimated_cost_max) && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface.elevated }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Estimated Cost
          </Text>
          <CostDisplay
            min={proposal.estimated_cost_min}
            max={proposal.estimated_cost_max}
            currency={proposal.currency}
            size="large"
          />
        </View>
      )}

      {/* Modalities Section */}
      {proposal.modalities && proposal.modalities.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface.elevated }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Modalities
          </Text>
          <View style={styles.modalitiesContainer}>
            {proposal.modalities.map((modality: string, index: number) => (
              <View
                key={index}
                style={[styles.modalityChip, { backgroundColor: theme.colors.primary.light }]}
              >
                <Text style={[styles.modalityText, { color: theme.colors.primary.default }]}>
                  {modality}
                </Text>
              </View>
            ))}
          </View>
          {proposal.modalities_notes && (
            <Text style={[styles.notesText, { color: theme.colors.text.secondary }]}>
              {proposal.modalities_notes}
            </Text>
          )}
        </View>
      )}

      {/* Goals Section */}
      {proposal.goals && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface.elevated }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Goals / Expected Outcomes
          </Text>
          <Text style={[styles.bodyText, { color: theme.colors.text.secondary }]}>
            {proposal.goals}
          </Text>
        </View>
      )}

      {/* Contraindications Section */}
      {proposal.contraindications && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface.elevated }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Contraindications / Prerequisites
          </Text>
          <Text style={[styles.bodyText, { color: theme.colors.text.secondary }]}>
            {proposal.contraindications}
          </Text>
        </View>
      )}

      {/* Decline Reason (if declined) */}
      {proposal.status === 'DECLINED' && (proposal.status_notes || proposal.decline_reason) && (
        <View
          style={[
            styles.section,
            styles.declineSection,
            { backgroundColor: theme.colors.feedback.error + '10' },
          ]}
        >
          <View style={styles.declineHeader}>
            <Ionicons name="close-circle" size={20} color={theme.colors.feedback.error} />
            <Text style={[styles.sectionTitle, { color: theme.colors.feedback.error }]}>
              Decline Reason
            </Text>
          </View>
          <Text style={[styles.bodyText, { color: theme.colors.text.secondary }]}>
            {proposal.status_notes || proposal.decline_reason}
          </Text>
        </View>
      )}

      {/* Metadata Section */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.elevated }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Proposal Information
        </Text>
        <View style={styles.metadataRow}>
          <Ionicons name="person-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.metadataText, { color: theme.colors.text.secondary }]}>
            Proposed by: {proposal.proposed_by_staff_name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.metadataRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.metadataText, { color: theme.colors.text.secondary }]}>
            Created: {formatDate(proposal.proposed_at || proposal.created_at || '')}
          </Text>
        </View>
        {proposal.updated_at && proposal.updated_at !== proposal.created_at && (
          <View style={styles.metadataRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.metadataText, { color: theme.colors.text.secondary }]}>
              Last updated: {formatDate(proposal.updated_at)}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {canEdit && proposal.status === 'PROPOSED' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton,
              { borderColor: theme.colors.border.default },
            ]}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary.default} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary.default }]}>
              Edit Proposal
            </Text>
          </TouchableOpacity>
        )}

        {/* Schedule button - show for admin if status is PROPOSED, regardless of permission check */}
        {isAdmin && proposal.status === 'PROPOSED' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              { backgroundColor: theme.colors.primary.default },
            ]}
            onPress={handleSchedule}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.background.default} />
            <Text style={[styles.actionButtonText, { color: theme.colors.background.default }]}>
              Schedule Treatment
            </Text>
          </TouchableOpacity>
        )}

        {isAdmin && proposal.status === 'PROPOSED' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.dangerButton,
              { borderColor: theme.colors.feedback.error },
            ]}
            onPress={handleDecline}
            activeOpacity={0.7}
            disabled={declineMutation.isPending}
          >
            {declineMutation.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.feedback.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={theme.colors.feedback.error} />
                <Text style={[styles.actionButtonText, { color: theme.colors.feedback.error }]}>
                  Decline Proposal
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
    
    {/* Scheduling Wizard Modal */}
    <SchedulingWizard />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  pageHeaderTitle: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleLeft: {
    flex: 1,
    marginRight: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerText: {
    fontSize: 14,
    marginTop: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  modalityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalityText: {
    fontSize: 13,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  declineSection: {
    borderWidth: 1,
  },
  declineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 13,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  primaryButton: {
    // Background color set inline
  },
  secondaryButton: {
    borderWidth: 1,
  },
  dangerButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
