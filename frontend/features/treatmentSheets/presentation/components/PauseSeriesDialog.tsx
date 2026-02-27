/**
 * Pause Series Dialog Component
 * Dialog for pausing a treatment series with reason and billing impact
 * Part of F4.1: Pause Series Flow
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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

interface PauseSeriesDialogProps {
  visible: boolean;
  treatmentName: string;
  billingImpact?: {
    refundAmount: number;
    remainingSessions: number;
  };
  onConfirm: (reason: string, hasConsent: boolean) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const PauseSeriesDialog: React.FC<PauseSeriesDialogProps> = ({
  visible,
  treatmentName,
  billingImpact,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const theme = useClinicTheme();
  const [reason, setReason] = useState('');
  const [hasConsent, setHasConsent] = useState(false);

  const handleConfirm = () => {
    if (!reason.trim()) {
      return;
    }
    onConfirm(reason, hasConsent);
  };

  const handleCancel = () => {
    setReason('');
    setHasConsent(false);
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
            <Ionicons name="pause-circle" size={32} color={theme.colors.feedback.warning} />
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Pause Treatment Series
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.treatmentName, { color: theme.colors.text.primary }]}>
              {treatmentName}
            </Text>

            {/* Billing Impact */}
            {billingImpact && (
              <View style={[styles.impactCard, { backgroundColor: theme.colors.feedback.warning + '15', borderColor: theme.colors.feedback.warning }]}>
                <Text style={[styles.impactTitle, { color: theme.colors.feedback.warning }]}>
                  Billing Impact
                </Text>
                <Text style={[styles.impactText, { color: theme.colors.text.primary }]}>
                  Remaining Sessions: {billingImpact.remainingSessions}
                </Text>
                <Text style={[styles.impactText, { color: theme.colors.text.primary }]}>
                  Potential Refund: ₹{billingImpact.refundAmount.toLocaleString()}
                </Text>
              </View>
            )}

            {/* Reason Input */}
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              Reason for Pausing <Text style={{ color: theme.colors.feedback.error }}>*</Text>
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
              placeholder="e.g., Patient requested temporary break"
              placeholderTextColor={theme.colors.text.disabled}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              editable={!loading}
            />

            {/* Patient Consent */}
            <View style={styles.consentRow}>
              <Switch
                value={hasConsent}
                onValueChange={setHasConsent}
                disabled={loading}
                trackColor={{
                  false: theme.colors.border.default,
                  true: theme.colors.primary.default,
                }}
                thumbColor={theme.colors.primary.onPrimary}
              />
              <Text style={[styles.consentText, { color: theme.colors.text.primary }]}>
                Patient has consented to pause treatment
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: theme.colors.border.default }]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: theme.colors.feedback.warning,
                  opacity: !reason.trim() || !hasConsent || loading ? 0.5 : 1,
                },
              ]}
              onPress={handleConfirm}
              disabled={!reason.trim() || !hasConsent || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary.onPrimary} />
              ) : (
                <>
                  <Ionicons name="pause" size={20} color={theme.colors.primary.onPrimary} />
                  <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
                    Pause Series
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
    marginBottom: 16,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consentText: {
    fontSize: 14,
    flex: 1,
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
