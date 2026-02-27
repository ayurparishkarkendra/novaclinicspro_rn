/**
 * Scheduling Wizard Step 3 Demo
 * Standalone demo for testing Step 3 component
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { SchedulingWizardStep3 } from './SchedulingWizardStep3';
import { useSchedulingWizardStore } from '../stores/schedulingWizard.store';

export const SchedulingWizardStep3Demo: React.FC = () => {
  const { openWizard, goToStep, setSessions, updateStep1Field } = useSchedulingWizardStore();

  // Initialize wizard with demo data
  useEffect(() => {
    openWizard(
      'proposal-123',
      'Panchakarma - 21 Days',
      21,
      18000
    );

    // Set Step 1 data
    updateStep1Field('start_date', '2026-03-01');
    updateStep1Field('default_time', '09:00');
    updateStep1Field('frequency', 'DAILY');
    updateStep1Field('duration_days', 21);
    updateStep1Field('default_therapist_id', 'therapist-123');
    updateStep1Field('agreed_package_cost', 18000);

    // Generate demo sessions
    const demoSessions = [];
    const startDate = new Date('2026-03-01');
    for (let i = 0; i < 21; i++) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + i);
      demoSessions.push({
        date: sessionDate.toISOString().split('T')[0],
        time: '09:00',
        therapist_id: 'therapist-123',
        room_id: 'room-1',
      });
    }
    setSessions(demoSessions);

    // Go to Step 3
    goToStep(3);
  }, []);

  const handleBack = () => {
    console.log('Back button pressed');
  };

  const handleCancel = () => {
    console.log('Cancel button pressed');
  };

  const handleSuccess = (treatmentSheetId: string) => {
    console.log('Success! Treatment sheet ID:', treatmentSheetId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SchedulingWizardStep3
          onBack={handleBack}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      </View>
    </SafeAreaView>
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
