/**
 * Scheduling Wizard Demo
 * Demonstrates how to use the SchedulingWizard component
 * 
 * Usage:
 * 1. Import the wizard and store
 * 2. Call openWizard() from the store to open the wizard
 * 3. The wizard handles all steps internally
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useSchedulingWizardStore } from '../stores/schedulingWizard.store';
import { SchedulingWizard } from './SchedulingWizard';

export const SchedulingWizardDemo: React.FC = () => {
  const theme = useClinicTheme();
  const { openWizard } = useSchedulingWizardStore();

  // Example proposals
  const exampleProposals = [
    {
      id: 'proposal-1',
      name: 'Panchakarma - 21 Days',
      duration: 21,
      estimatedCost: 18000,
    },
    {
      id: 'proposal-2',
      name: 'Abhyanga Therapy - 14 Days',
      duration: 14,
      estimatedCost: 12000,
    },
    {
      id: 'proposal-3',
      name: 'Shirodhara - 7 Days',
      duration: 7,
      estimatedCost: 8000,
    },
  ];

  const handleSchedule = (proposal: typeof exampleProposals[0]) => {
    openWizard(
      proposal.id,
      proposal.name,
      proposal.duration,
      proposal.estimatedCost
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.content, { padding: theme.spacing.md }]}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Scheduling Wizard Demo
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Click on any proposal to open the scheduling wizard
          </Text>

          {exampleProposals.map((proposal) => (
            <View
              key={proposal.id}
              style={[
                styles.proposalCard,
                {
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                },
              ]}
            >
              <View style={styles.proposalInfo}>
                <Text style={[styles.proposalName, { color: theme.colors.text.primary }]}>
                  {proposal.name}
                </Text>
                <Text style={[styles.proposalDetails, { color: theme.colors.text.secondary }]}>
                  Duration: {proposal.duration} days
                </Text>
                <Text style={[styles.proposalDetails, { color: theme.colors.text.secondary }]}>
                  Estimated Cost: ₹{proposal.estimatedCost.toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.scheduleButton,
                  { backgroundColor: theme.colors.primary.default },
                ]}
                onPress={() => handleSchedule(proposal)}
              >
                <Text style={[styles.scheduleButtonText, { color: theme.colors.primary.onPrimary }]}>
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={[styles.infoBox, { backgroundColor: theme.colors.primary.light, padding: theme.spacing.md }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.primary.default }]}>
              How it works:
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              1. Click "Schedule" on any proposal
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              2. Fill in the basic details (Step 1)
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              3. Review and edit sessions (Step 2 - Coming Soon)
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
              4. Confirm the schedule (Step 3 - Coming Soon)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Wizard Modal */}
      <SchedulingWizard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  proposalCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proposalInfo: {
    flex: 1,
  },
  proposalName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  proposalDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  scheduleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 16,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    borderRadius: 12,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
});
