/**
 * ProposalCard Demo Screen
 * Visual demonstration of the ProposalCard component
 * This can be used for manual testing and visual verification
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { ProposalCard } from './ProposalCard';
import {
  TreatmentProposal,
  ProposalStatus,
} from '../../data/models/treatmentProposals.dtos';

// ============================================
// MOCK DATA
// ============================================

const mockProposals: TreatmentProposal[] = [
  {
    id: 'proposal-1',
    tenant_id: 'tenant-1',
    episode_id: 'episode-1',
    name: 'Panchakarma - Complete Detox',
    duration_days: 21,
    modalities: ['Abhyanga', 'Swedana', 'Virechana', 'Basti'],
    modalities_notes: 'Focus on complete body detoxification',
    goals: 'Complete body detoxification and rejuvenation. Improve digestion and metabolism.',
    contraindications: 'None known',
    estimated_cost_min: 15000,
    estimated_cost_max: 20000,
    currency: 'INR',
    status: ProposalStatus.PROPOSED,
    created_by_staff_id: 'staff-1',
    created_at: '2026-02-24T10:00:00Z',
    updated_at: '2026-02-24T10:00:00Z',
    version: 1,
  },
  {
    id: 'proposal-2',
    tenant_id: 'tenant-1',
    episode_id: 'episode-1',
    name: 'Abhyanga Therapy',
    duration_days: 14,
    modalities: ['Abhyanga', 'Swedana'],
    goals: 'Stress relief and muscle relaxation',
    estimated_cost_min: 12000,
    estimated_cost_max: 15000,
    currency: 'INR',
    status: ProposalStatus.ACCEPTED,
    created_by_staff_id: 'staff-1',
    created_at: '2026-02-20T10:00:00Z',
    updated_at: '2026-02-22T14:30:00Z',
    version: 2,
  },
  {
    id: 'proposal-3',
    tenant_id: 'tenant-1',
    episode_id: 'episode-1',
    name: 'Shirodhara - 7 Days',
    duration_days: 7,
    modalities: ['Shirodhara'],
    goals: 'Mental relaxation and stress relief',
    currency: 'INR',
    status: ProposalStatus.DECLINED,
    decline_reason: 'Patient cannot afford the treatment',
    created_by_staff_id: 'staff-1',
    created_at: '2026-02-18T10:00:00Z',
    updated_at: '2026-02-19T11:00:00Z',
    version: 1,
  },
  {
    id: 'proposal-4',
    tenant_id: 'tenant-1',
    episode_id: 'episode-1',
    name: 'Quick Rejuvenation',
    duration_days: 3,
    modalities: ['Abhyanga'],
    goals: 'Quick stress relief',
    estimated_cost_min: 5000,
    estimated_cost_max: 7000,
    currency: 'INR',
    status: ProposalStatus.EXPIRED,
    created_by_staff_id: 'staff-1',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    version: 1,
  },
];

// ============================================
// QUERY CLIENT
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// ============================================
// COMPONENT
// ============================================

const ProposalCardDemoContent: React.FC = () => {
  const theme = useClinicTheme();
  const [selectedProposal, setSelectedProposal] = useState<TreatmentProposal | null>(null);

  const handleEdit = (proposal: TreatmentProposal) => {
    setSelectedProposal(proposal);
    Alert.alert(
      'Edit Proposal',
      `You clicked edit for: ${proposal.name}`,
      [{ text: 'OK', onPress: () => setSelectedProposal(null) }]
    );
  };

  const handleSchedule = (proposal: TreatmentProposal) => {
    setSelectedProposal(proposal);
    Alert.alert(
      'Schedule Treatment',
      `You clicked schedule for: ${proposal.name}`,
      [{ text: 'OK', onPress: () => setSelectedProposal(null) }]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        ProposalCard Component Demo
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
        Visual demonstration of the ProposalCard component with different states
      </Text>

      {/* Normal Mode */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Normal Mode
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
          Full information display with all features
        </Text>
        {mockProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onEdit={handleEdit}
            onSchedule={handleSchedule}
          />
        ))}
      </View>

      {/* Compact Mode */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Compact Mode
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
          Smaller display with essential information only
        </Text>
        {mockProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onEdit={handleEdit}
            onSchedule={handleSchedule}
            compact
          />
        ))}
      </View>

      {/* Status Examples */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Status Examples
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
          Different proposal statuses
        </Text>
        
        <Text style={[styles.statusLabel, { color: theme.colors.text.secondary }]}>
          PROPOSED (can edit and schedule):
        </Text>
        <ProposalCard
          proposal={mockProposals[0]}
          onEdit={handleEdit}
          onSchedule={handleSchedule}
        />

        <Text style={[styles.statusLabel, { color: theme.colors.text.secondary }]}>
          ACCEPTED (read-only):
        </Text>
        <ProposalCard
          proposal={mockProposals[1]}
          onEdit={handleEdit}
          onSchedule={handleSchedule}
        />

        <Text style={[styles.statusLabel, { color: theme.colors.text.secondary }]}>
          DECLINED (read-only):
        </Text>
        <ProposalCard
          proposal={mockProposals[2]}
          onEdit={handleEdit}
          onSchedule={handleSchedule}
        />

        <Text style={[styles.statusLabel, { color: theme.colors.text.secondary }]}>
          EXPIRED (read-only):
        </Text>
        <ProposalCard
          proposal={mockProposals[3]}
          onEdit={handleEdit}
          onSchedule={handleSchedule}
        />
      </View>

      {/* Without Cost */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Without Cost Estimate
        </Text>
        <ProposalCard
          proposal={{
            ...mockProposals[0],
            estimated_cost_min: undefined,
            estimated_cost_max: undefined,
          }}
          onEdit={handleEdit}
          onSchedule={handleSchedule}
        />
      </View>

      {/* Without Modalities */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Without Modalities
        </Text>
        <ProposalCard
          proposal={{
            ...mockProposals[0],
            modalities: [],
          }}
          onEdit={handleEdit}
          onSchedule={handleSchedule}
        />
      </View>
    </ScrollView>
  );
};

export const ProposalCardDemo: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ProposalCardDemoContent />
    </QueryClientProvider>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
});
