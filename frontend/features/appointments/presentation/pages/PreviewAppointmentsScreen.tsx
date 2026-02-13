/**
 * Multi-Day Appointment Preview Screen
 * Shows therapy plan with conflict indicators and inline alternatives
 * 
 * FIXES APPLIED:
 * 9. Preview data binding - proper client name, phone, dates, staff names
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useGenerateTherapyPlanMutation,
  useBulkCreateAppointmentsMutation,
} from '../../data/repositories/appointments.repository.impl';
import {
  TherapyPlanSession,
  TherapyPlanResponse,
  AlternativeSlot,
  BulkAppointmentItem,
  formatDate,
  formatTime,
  formatShortDate,
  formatDayOfWeek,
  openWhatsApp,
  generateWhatsAppSeriesMessage,
} from '../../data/models/appointments.dtos';

// ============================================
// SAFE DATE FORMATTER
// ============================================

const safeFormatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const safeFormatTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

const safeFormatDayOfWeek = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  } catch {
    return '';
  }
};

const safeFormatShortDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '—';
  }
};

// ============================================
// SESSION CARD COMPONENT
// ============================================

interface SessionCardProps {
  session: TherapyPlanSession & { selected_alternative?: AlternativeSlot };
  isExpanded: boolean;
  onToggle: () => void;
  onSelectAlternative: (slot: AlternativeSlot) => void;
  treatmentName: string;
  staffNames: string;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isExpanded,
  onToggle,
  onSelectAlternative,
  treatmentName,
  staffNames,
}) => {
  const hasConflict = session.is_conflicted;
  const hasSelectedAlternative = !!session.selected_alternative;
  const displaySlot = session.selected_alternative || session;

  // Use staff name from session, fallback to passed staffNames
  const displayStaffName = displaySlot.staff_name || staffNames || 'Therapist';

  return (
    <View style={[styles.sessionCard, hasConflict && !hasSelectedAlternative && styles.sessionCardConflict]}>
      {/* Session Header */}
      <TouchableOpacity
        style={styles.sessionHeader}
        onPress={hasConflict ? onToggle : undefined}
        activeOpacity={hasConflict ? 0.7 : 1}
      >
        {/* Status Icon */}
        <View style={styles.sessionStatus}>
          {hasConflict && !hasSelectedAlternative ? (
            <View style={styles.conflictIcon}>
              <Ionicons name="warning" size={20} color={colors.error.main} />
            </View>
          ) : (
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            </View>
          )}
        </View>

        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <View style={styles.sessionTitleRow}>
            <Text style={styles.sessionNumber}>Session {session.session_number}</Text>
            <Text style={styles.sessionDate}>
              {safeFormatDayOfWeek(displaySlot.start)}, {safeFormatShortDate(displaySlot.start)}
            </Text>
          </View>
          <Text style={styles.sessionTime}>
            {safeFormatTime(displaySlot.start)} - {safeFormatTime(displaySlot.end)}
          </Text>
          <Text style={styles.sessionStaff}>
            👨‍⚕️ {displayStaffName}
            {displaySlot.room_name && ` • 🏥 ${displaySlot.room_name}`}
          </Text>
        </View>

        {/* Expand/Collapse Icon */}
        {hasConflict && (
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.secondary}
          />
        )}
      </TouchableOpacity>

      {/* Conflict Details & Alternatives */}
      {hasConflict && isExpanded && (
        <View style={styles.conflictSection}>
          {/* Conflict Reason */}
          <View style={styles.conflictReason}>
            <Ionicons name="alert-circle" size={16} color={colors.error.main} />
            <Text style={styles.conflictReasonText}>
              {session.conflict?.message || 'Scheduling conflict detected'}
            </Text>
          </View>

          {/* Alternative Slots */}
          {session.alternative_slots && session.alternative_slots.length > 0 ? (
            <View style={styles.alternativesSection}>
              <Text style={styles.alternativesTitle}>Select an alternative:</Text>
              {session.alternative_slots.map((alt, index) => {
                const isSelected = session.selected_alternative?.start === alt.start &&
                                   session.selected_alternative?.staff_id === alt.staff_id;
                const scoreColor = alt.score >= 90 ? colors.success.main :
                                   alt.score >= 70 ? colors.warning.main : colors.text.secondary;
                return (
                  <TouchableOpacity
                    key={`${alt.start}-${alt.staff_id}-${index}`}
                    style={[styles.alternativeOption, isSelected && styles.alternativeOptionSelected]}
                    onPress={() => onSelectAlternative(alt)}
                  >
                    <View style={styles.alternativeContent}>
                      <Text style={[styles.alternativeTime, isSelected && styles.alternativeTextSelected]}>
                        {safeFormatTime(alt.start)} - {safeFormatTime(alt.end)}
                      </Text>
                      <Text style={[styles.alternativeStaff, isSelected && styles.alternativeTextSelected]}>
                        {alt.staff_name || 'Therapist'}{alt.room_name && ` • ${alt.room_name}`}
                      </Text>
                    </View>
                    <View style={styles.alternativeScore}>
                      <Text style={[styles.scoreText, { color: scoreColor }]}>
                        {alt.score}%
                      </Text>
                      <Text style={styles.scoreLabel}>
                        {alt.score >= 90 ? 'Best' : alt.score >= 70 ? 'Good' : 'Fair'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noAlternatives}>
              <Text style={styles.noAlternativesText}>
                No alternative slots available. Please contact admin to resolve this conflict.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export const PreviewAppointmentsScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    clientId: string;
    clientName: string;
    clientPhone: string;
    treatmentId: string;
    treatmentName: string;
    staffIds: string;
    staffNames: string;
    startDate: string;
    durationDays: string;
    preferredTimeHour: string;
    durationMinutes: string;
    notes: string;
  }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // State
  const [therapyPlan, setTherapyPlan] = useState<TherapyPlanResponse | null>(null);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<number, AlternativeSlot>>({});

  // Mutations
  const generatePlanMutation = useGenerateTherapyPlanMutation();
  const bulkCreateMutation = useBulkCreateAppointmentsMutation();

  // Extract params with fallbacks
  const clientName = params.clientName || 'Client';
  const clientPhone = params.clientPhone || '';
  const treatmentName = params.treatmentName || 'Therapy';
  const staffNames = params.staffNames || '';
  const startDateStr = params.startDate || '';
  const durationDays = parseInt(params.durationDays || '7', 10);
  const durationMinutes = parseInt(params.durationMinutes || '60', 10);

  // Generate therapy plan on mount
  useEffect(() => {
    const generatePlan = async () => {
      try {
        const staffIds = params.staffIds?.split(',').filter(Boolean) || [];
        const result = await generatePlanMutation.mutateAsync({
          client_id: params.clientId || '',
          treatment_id: params.treatmentId || '',
          staff_ids: staffIds,
          start_date: startDateStr || new Date().toISOString(),
          duration_days: durationDays,
          preferred_time_hour: parseInt(params.preferredTimeHour || '10', 10),
        });
        setTherapyPlan(result);

        // Auto-expand first conflict
        const firstConflictIndex = result.sessions.findIndex(s => s.is_conflicted);
        if (firstConflictIndex >= 0) {
          setExpandedSession(result.sessions[firstConflictIndex].session_number);
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to generate therapy plan');
      }
    };

    if (params.clientId && params.treatmentId) {
      generatePlan();
    }
  }, [params.clientId, params.treatmentId]);

  // Handle alternative selection
  const handleSelectAlternative = (sessionNumber: number, slot: AlternativeSlot) => {
    setSelectedAlternatives(prev => ({
      ...prev,
      [sessionNumber]: slot,
    }));
  };

  // Check if all conflicts are resolved
  const allConflictsResolved = useCallback(() => {
    if (!therapyPlan) return false;
    const conflictedSessions = therapyPlan.sessions.filter(s => s.is_conflicted);
    return conflictedSessions.every(s => selectedAlternatives[s.session_number]);
  }, [therapyPlan, selectedAlternatives]);

  // Create all appointments
  const handleConfirm = async () => {
    if (!therapyPlan) return;

    // Build appointments array
    const appointments: BulkAppointmentItem[] = therapyPlan.sessions.map(session => {
      const alternative = selectedAlternatives[session.session_number];
      const slot = alternative || session;

      return {
        client_id: params.clientId || '',
        staff_id: slot.staff_id || '',
        room_id: slot.room_id,
        treatment_id: params.treatmentId || '',
        appointment_start: slot.start,
        appointment_end: slot.end,
        status: 'scheduled',
        session_number: session.session_number,
        notes: params.notes || `Session ${session.session_number} of ${therapyPlan.total_sessions}`,
      };
    });

    try {
      const result = await bulkCreateMutation.mutateAsync({
        series_id: therapyPlan.series_id,
        appointments,
      });

      // Show success and offer WhatsApp
      if (clientPhone) {
        const firstSession = therapyPlan.sessions[0];
        const message = generateWhatsAppSeriesMessage(
          clientName,
          'Your Clinic',
          treatmentName,
          therapyPlan.total_sessions,
          safeFormatDate(firstSession?.start),
          safeFormatTime(firstSession?.start),
          '+91-XXXXXXXXXX'
        );
        const whatsappUrl = openWhatsApp(clientPhone, message);

        Alert.alert(
          '✅ Appointments Created!',
          `${result.total_created} sessions have been scheduled successfully.`,
          [
            { text: 'Done', style: 'cancel', onPress: () => router.replace('/clinic-admin/appointments' as any) },
            {
              text: 'Send WhatsApp',
              onPress: () => {
                Linking.openURL(whatsappUrl);
                router.replace('/clinic-admin/appointments' as any);
              },
            },
          ]
        );
      } else {
        Alert.alert('Success', `${result.total_created} appointments created successfully`);
        router.replace('/clinic-admin/appointments' as any);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create appointments');
    }
  };

  // Update sessions with selected alternatives for display
  const displaySessions = therapyPlan?.sessions.map(session => ({
    ...session,
    selected_alternative: selectedAlternatives[session.session_number],
  })) || [];

  const conflictsRemaining = displaySessions.filter(
    s => s.is_conflicted && !s.selected_alternative
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading State */}
      {generatePlanMutation.isPending && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Generating therapy plan...</Text>
        </View>
      )}

      {/* Plan Content */}
      {therapyPlan && (
        <>
          {/* Client Info Card - FIXED: Shows actual client name and phone */}
          <View style={styles.clientCard}>
            <View style={styles.clientIconContainer}>
              <Ionicons name="person" size={24} color={colors.primary.main} />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{clientName}</Text>
              {clientPhone && (
                <Text style={styles.clientPhone}>📞 {clientPhone}</Text>
              )}
              <Text style={styles.clientDetails}>
                {treatmentName} • {therapyPlan.total_sessions} sessions
              </Text>
              <Text style={styles.clientDetails}>
                👨‍⚕️ {staffNames || 'Therapists assigned'}
              </Text>
              <Text style={styles.clientDetails}>
                📅 Starting {safeFormatDate(startDateStr)} • {durationMinutes} min each
              </Text>
            </View>
          </View>

          {/* Conflict Summary */}
          {therapyPlan.has_conflicts && (
            <View style={[
              styles.conflictBanner,
              conflictsRemaining === 0 && styles.conflictBannerResolved,
            ]}>
              <Ionicons
                name={conflictsRemaining === 0 ? 'checkmark-circle' : 'warning'}
                size={20}
                color={conflictsRemaining === 0 ? colors.success.main : colors.warning.main}
              />
              <Text style={[
                styles.conflictBannerText,
                conflictsRemaining === 0 && styles.conflictBannerTextResolved,
              ]}>
                {conflictsRemaining === 0
                  ? 'All conflicts resolved! Ready to confirm.'
                  : `${conflictsRemaining} conflict${conflictsRemaining > 1 ? 's' : ''} remaining. Tap to see alternatives.`}
              </Text>
            </View>
          )}

          {/* Sessions List */}
          <ScrollView
            style={styles.sessionsList}
            contentContainerStyle={styles.sessionsContent}
            showsVerticalScrollIndicator={false}
          >
            {displaySessions.map((session) => (
              <SessionCard
                key={session.session_number}
                session={session}
                isExpanded={expandedSession === session.session_number}
                onToggle={() => setExpandedSession(
                  expandedSession === session.session_number ? null : session.session_number
                )}
                onSelectAlternative={(slot) => handleSelectAlternative(session.session_number, slot)}
                treatmentName={treatmentName}
                staffNames={staffNames}
              />
            ))}

            {/* Spacer for action bar */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (therapyPlan.has_conflicts && !allConflictsResolved()) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={bulkCreateMutation.isPending || (therapyPlan.has_conflicts && !allConflictsResolved())}
            >
              {bulkCreateMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.background.default} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={colors.background.default} />
                  <Text style={styles.confirmButtonText}>
                    Confirm {therapyPlan.total_sessions} Sessions
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    ...typography.h6,
    color: colors.text.primary,
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  // Client Card - ENHANCED
  clientCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.default,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  clientIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  clientPhone: {
    ...typography.body2,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  clientDetails: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },

  // Conflict Banner
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.main + '15',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.sm,
    gap: spacing.sm,
  },
  conflictBannerResolved: {
    backgroundColor: colors.success.main + '15',
  },
  conflictBannerText: {
    flex: 1,
    ...typography.body2,
    color: colors.warning.main,
  },
  conflictBannerTextResolved: {
    color: colors.success.main,
  },

  // Sessions List
  sessionsList: {
    flex: 1,
  },
  sessionsContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },

  // Session Card
  sessionCard: {
    backgroundColor: colors.background.default,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  sessionCardConflict: {
    borderColor: colors.error.light,
    borderWidth: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  sessionStatus: {
    marginRight: spacing.md,
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionNumber: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  sessionDate: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  sessionTime: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '500',
    marginTop: spacing.xs / 2,
  },
  sessionStaff: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },

  // Conflict Section
  conflictSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.error.main + '05',
    padding: spacing.md,
  },
  conflictReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  conflictReasonText: {
    ...typography.body2,
    color: colors.error.main,
    flex: 1,
  },
  alternativesSection: {
    marginTop: spacing.sm,
  },
  alternativesTitle: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  alternativeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  alternativeOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  alternativeContent: {
    flex: 1,
  },
  alternativeTime: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  alternativeStaff: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  alternativeTextSelected: {
    color: colors.primary.main,
  },
  alternativeScore: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  scoreText: {
    ...typography.body2,
    fontWeight: '600',
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  noAlternatives: {
    padding: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  noAlternativesText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background.default,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.grey[300],
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
});

export default PreviewAppointmentsScreen;
