/**
 * ProposalCreationModal Demo
 * Example usage of the ProposalCreationModal component
 * 
 * This file demonstrates how to integrate the modal into a screen.
 * Copy this pattern when integrating into CasesheetDetailScreen.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProposalCreationModal } from './ProposalCreationModal';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

interface ProposalCreationModalDemoProps {
  episodeId: string;
}

export const ProposalCreationModalDemo: React.FC<ProposalCreationModalDemoProps> = ({
  episodeId,
}) => {
  const theme = useClinicTheme();
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = () => {
    console.log('✅ Proposal created successfully!');
    setShowModal(false);
    // Refresh proposals list here
  };

  const handleCancel = () => {
    console.log('❌ Proposal creation cancelled');
    setShowModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Proposal Creation Demo
      </Text>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary.default }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
          + Propose Treatment Plan
        </Text>
      </TouchableOpacity>

      {showModal && (
        <ProposalCreationModal
          episodeId={episodeId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * INTEGRATION GUIDE
 * 
 * To integrate this modal into CasesheetDetailScreen:
 * 
 * 1. Import the modal:
 *    import { ProposalCreationModal } from '@/features/treatmentProposals';
 * 
 * 2. Add state to control modal visibility:
 *    const [showProposalModal, setShowProposalModal] = useState(false);
 * 
 * 3. Add a button to open the modal:
 *    <TouchableOpacity onPress={() => setShowProposalModal(true)}>
 *      <Text>+ Propose Treatment Plan</Text>
 *    </TouchableOpacity>
 * 
 * 4. Render the modal conditionally:
 *    {showProposalModal && (
 *      <ProposalCreationModal
 *        episodeId={episode.id}
 *        onSuccess={() => {
 *          setShowProposalModal(false);
 *          // Refresh proposals list
 *          queryClient.invalidateQueries(['proposals', episode.id]);
 *        }}
 *        onCancel={() => setShowProposalModal(false)}
 *      />
 *    )}
 * 
 * 5. The modal will:
 *    - Check if user can create proposals (can-create API)
 *    - Show permission error if not allowed
 *    - Display the form if allowed
 *    - Validate form inputs
 *    - Call create API on submit
 *    - Show success/error toasts
 *    - Close and refresh on success
 */
