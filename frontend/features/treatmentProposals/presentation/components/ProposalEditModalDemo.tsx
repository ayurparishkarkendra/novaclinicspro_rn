/**
 * ProposalEditModal Demo
 * Demonstrates the ProposalEditModal component usage
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProposalEditModal } from './ProposalEditModal';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

/**
 * Demo component showing how to use ProposalEditModal
 * 
 * Usage:
 * 1. Import the component
 * 2. Manage visible state
 * 3. Pass proposalId, visible, onSuccess, and onCancel props
 * 
 * Example:
 * ```tsx
 * const [showEditModal, setShowEditModal] = useState(false);
 * 
 * <ProposalEditModal
 *   proposalId="proposal-123"
 *   visible={showEditModal}
 *   onSuccess={() => {
 *     setShowEditModal(false);
 *     // Refresh proposal list
 *   }}
 *   onCancel={() => setShowEditModal(false)}
 * />
 * ```
 */
export const ProposalEditModalDemo: React.FC = () => {
  const theme = useClinicTheme();
  const [showModal, setShowModal] = useState(false);
  const [proposalId] = useState('proposal-123'); // Replace with actual proposal ID

  const handleSuccess = () => {
    console.log('✅ Proposal updated successfully');
    setShowModal(false);
    // In real app: refresh proposal list, show toast, etc.
  };

  const handleCancel = () => {
    console.log('❌ Edit cancelled');
    setShowModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        ProposalEditModal Demo
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary.default }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
          Open Edit Modal
        </Text>
      </TouchableOpacity>

      <ProposalEditModal
        proposalId={proposalId}
        visible={showModal}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      <View style={styles.infoBox}>
        <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
          Features:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
          • Pre-fills form with existing proposal data
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
          • Includes version field for optimistic locking
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
          • Handles 409 conflict errors gracefully
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
          • Shows success toast on update
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
          • Closes and refreshes on success
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    width: '100%',
    maxWidth: 400,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});
