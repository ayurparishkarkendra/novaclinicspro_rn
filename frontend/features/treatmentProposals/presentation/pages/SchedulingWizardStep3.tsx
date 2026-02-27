/**
 * Scheduling Wizard - Step 3 (Confirmation)
 * Final step of the multi-day treatment scheduling wizard
 * 
 * Features:
 * - Display summary of proposal and schedule
 * - Show total sessions, date range, agreed cost
 * - Call schedule API with idempotency key
 * - Show loading spinner during API call
 * - Handle 409 error (series already exists)
 * - Show success message on completion
 * - Navigate to treatment sheet detail on success
 * - Navigate back to Step 2 on "Back" button
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useSchedulingWizardStore } from '../stores/schedulingWizard.store';
import { scheduleSeriesApi } from '../../data/api/schedulingApi';
import { resumeSeriesApi } from '../../data/api/lifecycleApi';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';

interface SchedulingWizardStep3Props {
  onBack: () => void;
  onCancel: () => void;
  onSuccess: (treatmentSheetId: string) => void;
}

export const SchedulingWizardStep3: React.FC<SchedulingWizardStep3Props> = ({
  onBack,
  onCancel,
  onSuccess,
}) => {
  const theme = useClinicTheme();
  const { currentUser } = useAuth();
  
  // Wizard store
  const {
    mode,
    proposalId,
    treatmentSheetId,
    proposalName,
    proposalDuration,
    step1Data,
    sessions,
  } = useSchedulingWizardStore();

  // Local state
  const [isScheduling, setIsScheduling] = useState(false);

  // Calculate date range
  const getDateRange = (): { startDate: string; endDate: string } => {
    if (sessions.length === 0) {
      return { startDate: '', endDate: '' };
    }

    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    return {
      startDate: firstSession.date,
      endDate: lastSession.date,
    };
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle confirm schedule
  const handleConfirmSchedule = async () => {
    if (mode === 'schedule' && !proposalId) {
      Alert.alert('Error', 'Proposal ID is missing');
      return;
    }

    if (mode === 'resume' && !treatmentSheetId) {
      Alert.alert('Error', 'Treatment Sheet ID is missing');
      return;
    }

    if (sessions.length === 0) {
      Alert.alert('Error', 'No sessions to schedule');
      return;
    }

    setIsScheduling(true);

    try {
      const tenantId = currentUser?.tenantId || '';

      if (mode === 'schedule') {
        // Call schedule API for new series
        const response = await scheduleSeriesApi(tenantId, proposalId!, {
          start_date: step1Data.start_date || '',
          sessions,
          agreed_package_cost: step1Data.agreed_package_cost || 0,
        });

        // Show success message
        Alert.alert(
          'Success',
          'Treatment series scheduled successfully!',
          [
            {
              text: 'View Treatment Sheet',
              onPress: () => onSuccess(response.treatment_sheet_id),
            },
          ]
        );
      } else {
        // Call resume API for paused series
        await resumeSeriesApi(tenantId, treatmentSheetId!, {
          start_date: step1Data.start_date || '',
          sessions,
        });

        // Show success message
        Alert.alert(
          'Success',
          'Treatment series resumed successfully!',
          [
            {
              text: 'View Treatment Sheet',
              onPress: () => onSuccess(treatmentSheetId!),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to schedule/resume series:', error);
      
      // Handle 409 error (series already exists)
      if (error instanceof Error && error.message.includes('already exists')) {
        Alert.alert(
          'Series Already Exists',
          'This treatment series has already been scheduled. Please refresh and try again.',
          [{ text: 'OK' }]
        );
      } else {
        const action = mode === 'schedule' ? 'schedule' : 'resume';
        Alert.alert(
          `${action === 'schedule' ? 'Scheduling' : 'Resume'} Failed`,
          error instanceof Error ? error.message : `Failed to ${action} treatment series. Please try again.`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const { startDate, endDate } = getDateRange();
  const totalSessions = sessions.length;
  const agreedCost = step1Data.agreed_package_cost || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.default }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Confirm Schedule
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
            Step 3 of 3: Review and Confirm
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Summary Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentContainer, { padding: theme.spacing.md }]}>
          {/* Treatment Info Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface.default, padding: theme.spacing.md }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="medical" size={24} color={theme.colors.primary.default} />
              <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                Treatment Plan
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border.default }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                Treatment Name
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {proposalName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                Original Duration
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {proposalDuration} days
              </Text>
            </View>
            {step1Data.duration_days !== proposalDuration && (
              <View style={[styles.warningBox, { backgroundColor: theme.colors.feedback.warning + '20', borderColor: theme.colors.feedback.warning }]}>
                <Ionicons name="warning-outline" size={16} color={theme.colors.feedback.warning} />
                <Text style={[styles.warningText, { color: theme.colors.feedback.warning }]}>
                  Duration adjusted to {step1Data.duration_days} days
                </Text>
              </View>
            )}
          </View>

          {/* Schedule Summary Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface.default, padding: theme.spacing.md }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={24} color={theme.colors.primary.default} />
              <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                Schedule Summary
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border.default }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                Total Sessions
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {totalSessions} sessions
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                Start Date
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {startDate ? formatDate(startDate) : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                End Date
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {endDate ? formatDate(endDate) : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                Frequency
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {step1Data.frequency === 'DAILY' && 'Daily'}
                {step1Data.frequency === 'SIX_DAYS_WEEK' && '6 Days/Week'}
                {step1Data.frequency === 'ALTERNATE_DAYS' && 'Alternate Days'}
                {step1Data.frequency === 'CUSTOM' && 'Custom'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                Default Time
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {step1Data.default_time || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Cost Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface.default, padding: theme.spacing.md }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash" size={24} color={theme.colors.primary.default} />
              <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                Package Cost
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border.default }]} />
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: theme.colors.text.secondary }]}>
                Agreed Package Cost
              </Text>
              <Text style={[styles.costValue, { color: theme.colors.primary.default }]}>
                {formatCurrency(agreedCost)}
              </Text>
            </View>
          </View>

          {/* Important Note */}
          <View style={[styles.noteBox, { backgroundColor: theme.colors.primary.light, borderColor: theme.colors.primary.default }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary.default} />
            <Text style={[styles.noteText, { color: theme.colors.primary.default }]}>
              Once confirmed, the treatment series will be scheduled and a treatment sheet will be created automatically.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border.default, padding: theme.spacing.md }]}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.backButton,
            { borderColor: theme.colors.border.default },
          ]}
          onPress={onBack}
          disabled={isScheduling}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
          <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            { backgroundColor: theme.colors.primary.default },
          ]}
          onPress={handleConfirmSchedule}
          disabled={isScheduling}
        >
          {isScheduling ? (
            <>
              <ActivityIndicator size="small" color={theme.colors.primary.onPrimary} />
              <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary, marginLeft: 8 }]}>
                Scheduling...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary.onPrimary} />
              <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
                Confirm Schedule
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  card: {
    borderRadius: 8,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  costValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  noteText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  confirmButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
});
