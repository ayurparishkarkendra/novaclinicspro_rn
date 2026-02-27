/**
 * Scheduling Wizard
 * Main container for the multi-step scheduling wizard
 * 
 * Features:
 * - Multi-step wizard flow (Step 1, 2, 3)
 * - Modal presentation
 * - Step navigation
 * - State management via Zustand store
 */

import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useSchedulingWizardStore } from '../stores/schedulingWizard.store';
import { SchedulingWizardStep1 } from './SchedulingWizardStep1';
import { SchedulingWizardStep2 } from './SchedulingWizardStep2';
import { SchedulingWizardStep3 } from './SchedulingWizardStep3';

export const SchedulingWizard: React.FC = () => {
  const theme = useClinicTheme();
  const {
    isWizardOpen,
    currentStep,
    closeWizard,
    nextStep,
    previousStep,
    resetWizard,
  } = useSchedulingWizardStore();

  // Handle cancel
  const handleCancel = () => {
    resetWizard();
  };

  // Handle next step
  const handleNext = () => {
    nextStep();
  };

  // Handle previous step
  const handlePrevious = () => {
    previousStep();
  };

  // Handle completion
  const handleComplete = (treatmentSheetId: string) => {
    // Navigate to treatment sheet detail
    console.log('Navigate to treatment sheet:', treatmentSheetId);
    // TODO: Implement navigation to treatment sheet detail screen
    resetWizard();
  };

  if (!isWizardOpen) {
    return null;
  }

  return (
    <Modal
      visible={isWizardOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.content, { backgroundColor: theme.colors.surface.default }]}>
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <SchedulingWizardStep1
              onNext={handleNext}
              onCancel={handleCancel}
            />
          )}

          {/* Step 2: Review Sessions */}
          {currentStep === 2 && (
            <SchedulingWizardStep2
              onNext={handleNext}
              onBack={handlePrevious}
              onCancel={handleCancel}
            />
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <SchedulingWizardStep3
              onBack={handlePrevious}
              onCancel={handleCancel}
              onSuccess={handleComplete}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
