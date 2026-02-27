/**
 * Cancel Series Dialog Component
 * Dialog for cancelling a treatment series with reason and billing impact
 * Part of F4.3: Cancel Series Flow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

interface CancelSeriesDialogProps {
  visible: boolean;
  treatmentName: string;
  billingImpact?: {
    refundAmount: number;
    remainingSessions: number;
  };
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const CancelSeriesDialog: React.FC<CancelSeriesDialogProps> = ({
  visible,
  treatmentName,
  billingImpact,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const theme = useClinicTheme();
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      return;
    }
    onConfirm(reason);
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.colors.surface.default }]}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="close-circle" size={32} color={theme.colors.feedback.error} />
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Cancel Treatment Series
            </Text>
            <Text style={[styles.warning, { color: theme.colors.feedback.error }]}>
              This action cannot be undone
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.treatmentName, { color: theme.colors.text.primary }]}>
              {treatmentName}
            </Text>

            {/* Billing Impact */}
            {billingImpact && (
              <View style={[styles.impactCard, { backgroundColor: theme.colors.feedback.error + '15', borderColor: theme.colors.feedback.error }]}>
                <Text style={[styles.impactTitle, { color: theme.colors.feedback.error }]}>
                  Billing Impact
                </Text>
                <Text style={[styles.impactText, { color: theme.colors.text.primary }]}>
                  Remaining Sessions: {billingImpact.remainingSessions}
                </Text>
                <Text style={[styles.impactText, { color: theme.colors.text.primary }]}>
                  Refund Amount: ₹{billingImpact.refundAmount.toLocaleString()}
                </Text>
              </View>
            )}

            {/* Reason Input */}
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Reason for Cancellation <Text style={{ color: theme.colors.feedback.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.background.default,
                  borderColor: theme.colors.border.default,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder="e.g., Patient discontinued treatment"
              placeholderTextColor={theme.colors.text.disabled}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: theme.colors.border.default }]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
                Go Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: theme.colors.feedback.error,
                  opacity: !reason.trim() || loading ? 0.5 : 1,
                },
              ]}
              onPress={handleConfirm}
              disabled={!reason.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary.onPrimary} />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color={theme.colors.primary.onPrimary} />
                  <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
                    Cancel Series
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  warning: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    marginBottom: 24,
  },
  treatmentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  impactCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  impactText: {
    fontSize: 14,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
