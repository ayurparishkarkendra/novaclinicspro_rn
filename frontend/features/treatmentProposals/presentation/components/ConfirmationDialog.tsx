/**
 * Confirmation Dialog Component
 * Modal dialog for confirming destructive actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

// ============================================
// TYPES
// ============================================

interface ConfirmationDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether the action is destructive (red button) */
  destructive?: boolean;
  /** Whether to show a reason input field */
  requireReason?: boolean;
  /** Placeholder for reason input */
  reasonPlaceholder?: string;
  /** Whether the action is loading */
  loading?: boolean;
  /** Callback when confirmed */
  onConfirm: (reason?: string) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  requireReason = false,
  reasonPlaceholder = 'Enter reason (optional)',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const theme = useClinicTheme();
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(requireReason ? reason : undefined);
    setReason(''); // Reset for next time
  };

  const handleCancel = () => {
    onCancel();
    setReason(''); // Reset for next time
  };

  const confirmButtonColor = destructive
    ? theme.colors.feedback.error
    : theme.colors.primary.default;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
          accessibilityLabel="Close dialog"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.dialog,
                { backgroundColor: theme.colors.background.default },
              ]}
            >
              {/* Title */}
              <Text
                style={[
                  styles.title,
                  { color: theme.colors.text.primary },
                ]}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={[
                  styles.message,
                  { color: theme.colors.text.secondary },
                ]}
              >
                {message}
              </Text>

              {/* Reason Input (if required) */}
              {requireReason && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background.muted,
                      borderColor: theme.colors.border.default,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  placeholder={reasonPlaceholder}
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!loading}
                  accessibilityLabel="Reason input"
                />
              )}

              {/* Buttons */}
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: theme.colors.border.default },
                  ]}
                  onPress={handleCancel}
                  disabled={loading}
                  accessibilityLabel={cancelText}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: confirmButtonColor },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={loading}
                  accessibilityLabel={confirmText}
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
