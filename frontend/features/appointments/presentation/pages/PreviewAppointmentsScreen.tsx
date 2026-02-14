/**
 * Multi-Day Appointment Preview Screen
 * 
 * CRITICAL: This screen MUST be backend-driven.
 * - NO frontend-generated availability/conflict logic
 * - If backend cannot validate, UI blocks progression
 * - Uses /check-availability and /alternative-slots APIs only
 * 
 * All text uses i18n.
 * No IDs displayed in UI.
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
import { useTranslation } from '../../../../core/localization/useTranslation';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useCreateAppointmentMutation,
  useGenerateTherapyPlanMutation,
} from '../../data/repositories/appointments.repository.impl';
import {
  AppointmentCreate,
  AlternativeSlot,
  TherapyPlanSession,
  openWhatsApp,
  generateWhatsAppSeriesMessage,
} from '../../data/models/appointments.dtos';

// ============================================
// SAFE DATE FORMATTERS
// ============================================

const safeFormatDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
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

const safeFormatTime = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
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

const safeFormatDayOfWeek = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  } catch {
    return '';
  }
};

const safeFormatShortDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
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
// SESSION DATA TYPE
// ============================================

interface SessionData extends TherapyPlanSession {
  selected_alternative?: AlternativeSlot;
}

// ============================================
// SESSION CARD COMPONENT
// ============================================

interface SessionCardProps {
  session: SessionData;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectAlternative: (slot: AlternativeSlot) => void;
  staffNames: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isExpanded,
  onToggle,
  onSelectAlternative,
  staffNames,
  t,
}) => {
  const hasConflict = session.is_conflicted;
  const hasSelectedAlternative = !!session.selected_alternative;
  
  // Display time from selected alternative if available
  const displayStartTime = session.selected_alternative?.start || session.start;
  const displayEndTime = session.selected_alternative?.end || session.end;
  const displayStaffName = session.selected_alternative?.staff_name || session.staff_name || staffNames || t('common.therapist');

  return (
    <View 
      style={[styles.sessionCard, hasConflict && !hasSelectedAlternative && styles.sessionCardConflict]}
      data-testid={`session-card-${session.session_number}`}
    >
      {/* Session Header */}
      <TouchableOpacity
        style={styles.sessionHeader}
        onPress={hasConflict ? onToggle : undefined}
        activeOpacity={hasConflict ? 0.7 : 1}
        accessibilityRole="button"
        accessibilityLabel={`Session ${session.session_number}${hasConflict ? ', has conflict' : ''}`}
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
            <Text style={styles.sessionNumber}>
              {t('appointments.session')} {session.session_number}
            </Text>
            <Text style={styles.sessionDate}>
              {safeFormatDayOfWeek(session.start)}, {safeFormatShortDate(session.start)}
            </Text>
          </View>
          <Text style={styles.sessionTime}>
            {safeFormatTime(displayStartTime)} - {safeFormatTime(displayEndTime)}
          </Text>
          <Text style={styles.sessionStaff}>
            {displayStaffName}
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
              {session.conflict?.message || t('appointments.conflictDetected')}
            </Text>
          </View>

          {/* Alternative Slots from Backend */}
          {session.alternative_slots && session.alternative_slots.length > 0 ? (
            <View style={styles.alternativesSection}>
              <Text style={styles.alternativesTitle}>
                {t('appointments.selectAlternative')}:
              </Text>
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
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    data-testid={`alternative-slot-${index}`}
                  >
                    <View style={styles.alternativeContent}>
                      <Text style={[styles.alternativeTime, isSelected && styles.alternativeTextSelected]}>
                        {safeFormatTime(alt.start)} - {safeFormatTime(alt.end)}
                      </Text>
                      <Text style={[styles.alternativeStaff, isSelected && styles.alternativeTextSelected]}>
                        {alt.staff_name || t('common.therapist')}{alt.room_name && ` • ${alt.room_name}`}
                      </Text>
                    </View>
                    <View style={styles.alternativeScore}>
                      <Text style={[styles.scoreText, { color: scoreColor }]}>
                        {alt.score}%
                      </Text>
                      <Text style={styles.scoreLabel}>
                        {alt.score >= 90 ? t('common.best') : alt.score >= 70 ? t('common.good') : t('common.fair')}
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
                {t('appointments.noAlternativesAvailable')}
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
  const { t } = useTranslation();
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
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Mutations
  const createMutation = useCreateAppointmentMutation(tenantId);
  const generatePlanMutation = useGenerateTherapyPlanMutation();

  // Extract params with fallbacks
  const clientId = params.clientId || '';
  const clientName = params.clientName || t('common.client');
  const clientPhone = params.clientPhone || '';
  const treatmentId = params.treatmentId || '';
  const treatmentName = params.treatmentName || t('common.therapy');
  const staffIds = params.staffIds?.split(',').filter(Boolean) || [];
  const staffNames = params.staffNames || '';
  const startDateStr = params.startDate || new Date().toISOString();
  const durationDays = parseInt(params.durationDays || '7', 10);
  const preferredTimeHour = parseInt(params.preferredTimeHour || '10', 10);
  const durationMinutes = parseInt(params.durationMinutes || '60', 10);
  const notes = params.notes || '';

  // ===== BACKEND-DRIVEN SESSION GENERATION =====
  // CRITICAL: This MUST use the backend API for conflict detection
  useEffect(() => {
    const fetchTherapyPlan = async () => {
      setIsGenerating(true);
      setBackendError(null);

      try {
        // Call backend to generate therapy plan with conflict detection
        const response = await generatePlanMutation.mutateAsync({
          client_id: clientId,
          treatment_id: treatmentId,
          staff_ids: staffIds,
          start_date: startDateStr,
          duration_days: durationDays,
          preferred_time_hour: preferredTimeHour,
        });

        // Map backend response to local state
        const mappedSessions: SessionData[] = response.sessions.map((session) => ({
          ...session,
          selected_alternative: undefined,
        }));

        setSessions(mappedSessions);
      } catch (error: any) {
        console.error('Failed to generate therapy plan:', error);
        
        // Check if it's a 404/501 (endpoint not available)
        if (error?.response?.status === 404 || error?.response?.status === 501) {
          setBackendError(t('appointments.backendValidationUnavailable'));
        } else if (error?.response?.status === 401 || error?.response?.status === 403) {
          setBackendError(t('errors.auth.unauthorized'));
        } else {
          setBackendError(error?.message || t('appointments.failedToGeneratePlan'));
        }
      } finally {
        setIsGenerating(false);
      }
    };

    if (clientId && treatmentId && staffIds.length > 0) {
      fetchTherapyPlan();
    } else {
      setBackendError(t('appointments.missingRequiredFields'));
      setIsGenerating(false);
    }
  }, [clientId, treatmentId, staffIds.join(','), startDateStr, durationDays, preferredTimeHour]);

  // Handle alternative selection
  const handleSelectAlternative = (sessionNumber: number, slot: AlternativeSlot) => {
    setSessions(prev => prev.map(session => 
      session.session_number === sessionNumber
        ? { ...session, selected_alternative: slot }
        : session
    ));
  };

  // Check if all conflicts are resolved
  const conflictedSessions = sessions.filter(s => s.is_conflicted);
  const unresolvedConflicts = conflictedSessions.filter(s => !s.selected_alternative);
  const allConflictsResolved = unresolvedConflicts.length === 0;
  const hasConflicts = conflictedSessions.length > 0;

  // Determine if we can proceed
  const canProceed = !backendError && sessions.length > 0 && allConflictsResolved;

  // Create all appointments
  const handleConfirm = async () => {
    if (!canProceed) {
      Alert.alert(t('common.error'), t('appointments.cannotProceedWithConflicts'));
      return;
    }

    setIsCreating(true);
    let createdCount = 0;
    const errors: string[] = [];

    try {
      // Create appointments one by one
      for (const session of sessions) {
        const slot = session.selected_alternative || {
          start: session.start,
          end: session.end,
          staff_id: session.staff_id || staffIds[0],
        };

        const payload: AppointmentCreate = {
          client_id: clientId,
          staff_id: slot.staff_id || staffIds[0],
          treatment_id: treatmentId,
          appointment_start: slot.start || session.start,
          appointment_end: slot.end || session.end,
          status: 'scheduled',
          notes: notes || `${t('appointments.session')} ${session.session_number} of ${sessions.length}`,
          appointment_type: 'MULTI',
        };

        try {
          await createMutation.mutateAsync(payload);
          createdCount++;
        } catch (err: any) {
          errors.push(`${t('appointments.session')} ${session.session_number}: ${err.message || t('common.failed')}`);
        }
      }

      // Show result
      if (createdCount === sessions.length) {
        // All succeeded - offer WhatsApp (for CREATED status)
        if (clientPhone) {
          const firstSession = sessions[0];
          const message = generateWhatsAppSeriesMessage(
            clientName,
            t('common.yourClinic'),
            treatmentName,
            sessions.length,
            safeFormatDate(firstSession?.start),
            safeFormatTime(firstSession?.start),
            '+91-XXXXXXXXXX'
          );
          const whatsappUrl = openWhatsApp(clientPhone, message);

          Alert.alert(
            t('appointments.appointmentsCreated'),
            `${createdCount} ${t('appointments.sessionsScheduled')}`,
            [
              { 
                text: t('common.done'), 
                style: 'cancel', 
                onPress: () => router.replace('/clinic-admin/appointments' as any) 
              },
              {
                text: t('appointments.sendWhatsApp'),
                onPress: () => {
                  Linking.openURL(whatsappUrl);
                  router.replace('/clinic-admin/appointments' as any);
                },
              },
            ]
          );
        } else {
          Alert.alert(t('common.success'), `${createdCount} ${t('appointments.appointmentsCreatedSuccess')}`);
          router.replace('/clinic-admin/appointments' as any);
        }
      } else if (createdCount > 0) {
        // Partial success
        Alert.alert(
          t('appointments.partialSuccess'),
          `${t('appointments.created')} ${createdCount} of ${sessions.length}.\n\n${t('common.errors')}:\n${errors.join('\n')}`,
          [{ text: t('common.ok'), onPress: () => router.replace('/clinic-admin/appointments' as any) }]
        );
      } else {
        // All failed
        Alert.alert(t('common.error'), `${t('appointments.failedToCreate')}:\n${errors.join('\n')}`);
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('appointments.failedToCreate'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityLabel={t('common.goBack')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('appointments.previewPlan')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading State */}
      {isGenerating && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>{t('appointments.generatingPlan')}</Text>
          <Text style={styles.loadingSubtext}>{t('appointments.checkingAvailability')}</Text>
        </View>
      )}

      {/* Backend Error State - BLOCKS PROGRESSION */}
      {!isGenerating && backendError && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>{t('appointments.validationUnavailable')}</Text>
          <Text style={styles.errorText}>{backendError}</Text>
          <Text style={styles.errorHelp}>
            {t('appointments.cannotProceedWithoutValidation')}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Plan Content */}
      {!isGenerating && !backendError && sessions.length > 0 && (
        <>
          {/* Client Info Card */}
          <View style={styles.clientCard} data-testid="preview-client-card">
            <View style={styles.clientIconContainer}>
              <Ionicons name="person" size={24} color={colors.primary.main} />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{clientName}</Text>
              {clientPhone && (
                <Text style={styles.clientPhone}>{clientPhone}</Text>
              )}
              <Text style={styles.clientDetails}>
                {treatmentName} • {sessions.length} {t('appointments.sessions')}
              </Text>
              <Text style={styles.clientDetails}>
                {staffNames || t('appointments.therapistsAssigned')}
              </Text>
              <Text style={styles.clientDetails}>
                {t('appointments.starting')} {safeFormatDate(startDateStr)} • {durationMinutes} {t('common.minEach')}
              </Text>
            </View>
          </View>

          {/* Conflict Summary */}
          {hasConflicts && (
            <View style={[
              styles.conflictBanner,
              allConflictsResolved && styles.conflictBannerResolved,
            ]}>
              <Ionicons
                name={allConflictsResolved ? 'checkmark-circle' : 'warning'}
                size={20}
                color={allConflictsResolved ? colors.success.main : colors.warning.main}
              />
              <Text style={[
                styles.conflictBannerText,
                allConflictsResolved && styles.conflictBannerTextResolved,
              ]}>
                {allConflictsResolved
                  ? t('appointments.allConflictsResolved')
                  : `${unresolvedConflicts.length} ${t('appointments.conflictsRemaining')}`}
              </Text>
            </View>
          )}

          {/* No Conflicts Banner */}
          {!hasConflicts && (
            <View style={styles.successBanner} data-testid="no-conflicts-banner">
              <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
              <Text style={styles.successBannerText}>
                {t('appointments.allSessionsAvailable', { count: sessions.length })}
              </Text>
            </View>
          )}

          {/* Sessions List */}
          <ScrollView
            style={styles.sessionsList}
            contentContainerStyle={styles.sessionsContent}
            showsVerticalScrollIndicator={false}
          >
            {sessions.map((session) => (
              <SessionCard
                key={session.session_number}
                session={session}
                isExpanded={expandedSession === session.session_number}
                onToggle={() => setExpandedSession(
                  expandedSession === session.session_number ? null : session.session_number
                )}
                onSelectAlternative={(slot) => handleSelectAlternative(session.session_number, slot)}
                staffNames={staffNames}
                t={t}
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
              data-testid="preview-back-button"
            >
              <Text style={styles.cancelButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !canProceed && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={isCreating || !canProceed}
              data-testid="preview-confirm-button"
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={colors.background.default} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={colors.background.default} />
                  <Text style={styles.confirmButtonText}>
                    {t('appointments.confirmSessions', { count: sessions.length })}
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  loadingSubtext: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Error - Backend validation unavailable
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h6,
    color: colors.error.main,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  errorHelp: {
    ...typography.body2,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background.default,
  },

  // Client Card
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

  // Banners
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.main + '15',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.sm,
    gap: spacing.sm,
  },
  successBannerText: {
    flex: 1,
    ...typography.body2,
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
    minHeight: 48,
    justifyContent: 'center',
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
    minHeight: 48,
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
