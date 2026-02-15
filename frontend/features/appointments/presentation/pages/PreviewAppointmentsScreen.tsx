/**
 * Multi-Day Appointment Preview Screen
 * 
 * ARCHITECTURE (per message #164 spec):
 * - SINGLE SOURCE OF TRUTH: effectiveTimes state holds the authoritative time for each session
 * - NO RECOMPUTING: UI components read from effectiveTimes, never derive from metadata
 * - PLAN-LEVEL ALTERNATIVES: Identified by plan_level: true, shown as global "apply to all" options
 * - SELECTION CONTRACT: Both global and per-session selections update effectiveTimes
 * - CONFLICT MESSAGING: Consolidated messages, no duplicate labels
 * 
 * CRITICAL: This screen MUST be backend-driven.
 * - NO frontend-generated availability/conflict logic
 * - If backend cannot validate, UI blocks progression
 * 
 * All text uses i18n. No IDs displayed in UI.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  openWhatsApp,
  generateWhatsAppSeriesMessage,
} from '../../data/models/appointments.dtos';
import { getAvailableSlotsApi } from '../../data/datasources/appointments.api';
// Import centralized date/time utils
import {
  formatDate,
  formatShortDate,
  formatDayOfWeek,
  formatTime,
  formatTimeFromParts,
  extractTimePattern,
  extractHour,
  extractMinute,
} from '../../../../core/utils/dateTimeUtils';

// ============================================
// TYPES - SINGLE SOURCE OF TRUTH
// ============================================

/**
 * EffectiveTime: The authoritative time slot for a session.
 * This is the SINGLE SOURCE OF TRUTH - all UI must read from this.
 */
interface EffectiveTime {
  start: string;
  end: string;
  staff_id: string | null;
  staff_name: string | null;
  room_id: string | null;
  room_name: string | null;
  is_resolved: boolean; // true if user selected an alternative for a conflicted session
}

/**
 * Plan-level alternative that can be applied globally
 */
interface PlanLevelAlternative {
  time_pattern: string; // e.g., "11:00" - the hour:minute pattern
  start_hour: number;
  start_minute: number;
  coverage_count: number; // how many sessions this works for
  total_sessions: number;
  covered_sessions: number[]; // session_numbers this applies to
}

// NOTE: Date/time formatting functions are now imported from centralized utils:
// formatDate, formatShortDate, formatDayOfWeek, formatTime, formatTimeFromParts,
// extractTimePattern, extractHour, extractMinute
// from '../../../../core/utils/dateTimeUtils'

// Legacy aliases for compatibility (these now use centralized utils)
const safeFormatDate = formatDate;
const safeFormatTime = formatTime;
const safeFormatDayOfWeek = formatDayOfWeek;
const safeFormatShortDate = formatShortDate;

// ============================================
// STAFF ASSIGNMENT TYPE (matching backend)
// ============================================

interface StaffAssignment {
  id: string;
  name: string;
}

// ============================================
// ALTERNATIVE SLOT TYPE - from API
// ============================================

interface AlternativeSlot {
  start: string;
  end: string;
  available_staff: Array<{
    staff_id: string;
    full_name: string;
    staff_type: string;
  }>;
  available_rooms: Array<{
    room_id: string;
    name: string;
    room_type: string;
  }>;
  score: number;
  plan_level?: boolean; // true if this is a plan-level alternative
}

// ============================================
// SESSION DATA TYPE - Updated per API spec
// ============================================

interface SessionData {
  session_number: number;
  appointment_start: string;
  appointment_end: string;
  staff_id: string | null;
  staff_name: string | null;  // Deprecated - use staff_assignments
  staff_assignments?: StaffAssignment[] | null;  // All assigned therapists
  room_id: string | null;
  room_name: string | null;
  is_conflicted: boolean;
  conflict?: {
    day_index: number;
    requested_time: string;
    conflict_type: string;
    message: string;
    alternative_slots: AlternativeSlot[];
  } | null;
}

/**
 * Get therapist display text from session data.
 * BUG FIX #1: When therapists are unavailable, show "Staff not available" instead of "Unassigned"
 */
const getSessionTherapistDisplay = (session: SessionData, isConflicted: boolean): string => {
  // If conflicted due to staff unavailability, show clear message
  if (isConflicted && session.conflict?.conflict_type?.toLowerCase().includes('staff')) {
    return 'Staff not available';
  }
  
  // Use staff_assignments (new API format)
  if (session.staff_assignments && session.staff_assignments.length > 0) {
    return session.staff_assignments.map(staff => staff.name).join(', ');
  }
  // Fallback to deprecated staff_name
  if (session.staff_name) {
    return session.staff_name;
  }
  
  // For non-conflicted sessions without staff, show "To be assigned"
  return isConflicted ? 'Staff not available' : 'To be assigned';
};

// ============================================
// GLOBAL ALTERNATIVES SECTION COMPONENT
// ============================================

interface GlobalAlternativesSectionProps {
  planLevelAlternatives: PlanLevelAlternative[];
  onApplyGlobal: (alternative: PlanLevelAlternative) => void;
  selectedGlobalPattern: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const GlobalAlternativesSection: React.FC<GlobalAlternativesSectionProps> = ({
  planLevelAlternatives,
  onApplyGlobal,
  selectedGlobalPattern,
  t,
}) => {
  if (planLevelAlternatives.length === 0) return null;

  return (
    <View style={styles.globalAlternativesSection} data-testid="global-alternatives-section">
      <Text style={styles.globalAlternativesTitle}>
        {t('appointments.applyToAllSlots') || 'Apply to all sessions'}
      </Text>
      <Text style={styles.globalAlternativesSubtitle}>
        {t('appointments.highCoverageOptions') || 'These times work for most sessions'}
      </Text>
      {planLevelAlternatives.map((alt, index) => {
        const isSelected = selectedGlobalPattern === alt.time_pattern;
        const coverageText = `${alt.coverage_count}/${alt.total_sessions}`;
        
        return (
          <TouchableOpacity
            key={`global-alt-${index}-${alt.time_pattern}`}
            style={[
              styles.globalAlternativeOption,
              isSelected && styles.globalAlternativeOptionSelected,
            ]}
            onPress={() => onApplyGlobal(alt)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            data-testid={`global-alternative-${index}`}
          >
            <View style={styles.globalAlternativeContent}>
              <View style={styles.globalAlternativeTimeRow}>
                <Ionicons 
                  name="time-outline" 
                  size={18} 
                  color={isSelected ? colors.primary.main : colors.text.secondary} 
                />
                <Text style={[
                  styles.globalAlternativeTime,
                  isSelected && styles.globalAlternativeTimeSelected,
                ]}>
                  {formatTimeFromParts(alt.start_hour, alt.start_minute)}
                </Text>
              </View>
              <Text style={styles.globalAlternativeCoverage}>
                {t('appointments.worksForSessions', { count: alt.coverage_count, total: alt.total_sessions }) || 
                  `Works for ${coverageText} sessions`}
              </Text>
            </View>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            ) : (
              <View style={styles.globalAlternativeRadio} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============================================
// SESSION CARD COMPONENT
// ============================================

interface SessionCardProps {
  session: SessionData;
  effectiveTime: EffectiveTime;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectAlternative: (alt: AlternativeSlot) => void;
  onOpenCustomTimePicker?: (sessionNumber: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  effectiveTime,
  isExpanded,
  onToggle,
  onSelectAlternative,
  onOpenCustomTimePicker,
  t,
}) => {
  const hasConflict = session.is_conflicted;
  const isResolved = effectiveTime.is_resolved;
  
  // SINGLE SOURCE OF TRUTH: Always read display values from effectiveTime
  const displayStartTime = effectiveTime.start;
  const displayEndTime = effectiveTime.end;
  
  // BUG FIX #1: Use getSessionTherapistDisplay for proper conflict messaging
  const displayStaffName = effectiveTime.staff_name || 
    getSessionTherapistDisplay(session, hasConflict && !isResolved);
  
  const displayRoomName = effectiveTime.room_name || session.room_name || 'Not assigned';

  // Get alternative slots from conflict object (per API spec)
  // Filter out plan_level alternatives - those are shown globally
  const alternativeSlots = (session.conflict?.alternative_slots || [])
    .filter(alt => !alt.plan_level);

  // BUG FIX #3: Only show conflict message ONCE in the expanded section
  // The main card shows the conflict icon, the expanded section shows the message
  const conflictMessage = session.conflict?.message;

  return (
    <View 
      style={[styles.sessionCard, hasConflict && !isResolved && styles.sessionCardConflict]}
      data-testid={`session-card-${session.session_number}`}
    >
      {/* Session Header */}
      <TouchableOpacity
        style={styles.sessionHeader}
        onPress={hasConflict ? onToggle : undefined}
        activeOpacity={hasConflict ? 0.7 : 1}
        accessibilityRole="button"
        accessibilityLabel={`Session ${session.session_number}${hasConflict && !isResolved ? ', has conflict' : ''}`}
      >
        {/* Status Icon */}
        <View style={styles.sessionStatus}>
          {hasConflict && !isResolved ? (
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
              {safeFormatDayOfWeek(session.appointment_start)}, {safeFormatShortDate(session.appointment_start)}
            </Text>
          </View>
          <Text style={styles.sessionTime}>
            {safeFormatTime(displayStartTime)} - {safeFormatTime(displayEndTime)}
          </Text>
          {/* Display therapist - BUG FIX #1: No duplicate "Unassigned" */}
          <Text style={[
            styles.sessionStaff,
            hasConflict && !isResolved && styles.sessionStaffConflict,
          ]}>
            {displayStaffName}
          </Text>
          {/* Display room name */}
          <Text style={styles.sessionRoom}>
            {displayRoomName}
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

      {/* Conflict Details & Alternatives - Only when expanded */}
      {hasConflict && isExpanded && (
        <View style={styles.conflictSection}>
          {/* C1: Single conflict message - only in expanded section */}
          {conflictMessage && (
            <View style={styles.conflictReason}>
              <Ionicons name="alert-circle" size={16} color={colors.error.main} />
              <Text style={styles.conflictReasonText}>
                {conflictMessage}
              </Text>
            </View>
          )}

          {/* C2: Alternative Slots - fully selectable, updates state */}
          {alternativeSlots.length > 0 ? (
            <View style={styles.alternativesSection}>
              <Text style={styles.alternativesTitle}>
                {t('appointments.selectAlternative') || 'Select an alternative'}:
              </Text>
              {alternativeSlots.map((alt, altIndex) => {
                const firstStaff = alt.available_staff?.[0];
                const firstRoom = alt.available_rooms?.[0];
                // Check if this alternative is currently selected by comparing times
                const isSelected = effectiveTime.is_resolved && 
                  extractTimePattern(effectiveTime.start) === extractTimePattern(alt.start);
                const scorePercent = Math.round((alt.score || 0) * 100);
                const scoreColor = scorePercent >= 90 ? colors.success.main :
                                   scorePercent >= 70 ? colors.warning.main : colors.text.secondary;
                
                return (
                  <TouchableOpacity
                    key={`alt-${altIndex}-${alt.start}`}
                    style={[styles.alternativeOption, isSelected && styles.alternativeOptionSelected]}
                    onPress={() => onSelectAlternative(alt)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    data-testid={`alternative-slot-${session.session_number}-${altIndex}`}
                  >
                    <View style={styles.alternativeContent}>
                      <Text style={[styles.alternativeTime, isSelected && styles.alternativeTextSelected]}>
                        {safeFormatTime(alt.start)} - {safeFormatTime(alt.end)}
                      </Text>
                      <Text style={[styles.alternativeStaff, isSelected && styles.alternativeTextSelected]}>
                        {firstStaff?.full_name || t('common.therapist') || 'Therapist'}
                        {firstRoom?.name && ` • ${firstRoom.name}`}
                      </Text>
                      {alt.available_staff?.length > 1 && (
                        <Text style={styles.moreOptionsText}>
                          +{alt.available_staff.length - 1} more staff options
                        </Text>
                      )}
                    </View>
                    <View style={styles.alternativeScore}>
                      <Text style={[styles.scoreText, { color: scoreColor }]}>
                        {scorePercent}%
                      </Text>
                      <Text style={styles.scoreLabel}>
                        {scorePercent >= 90 ? (t('common.best') || 'Best') : 
                         scorePercent >= 70 ? (t('common.good') || 'Good') : (t('common.fair') || 'Fair')}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* #7: CUSTOM TIME ROW */}
              <TouchableOpacity
                style={styles.customTimeRow}
                onPress={() => onOpenCustomTimePicker?.(session.session_number)}
                data-testid={`custom-time-${session.session_number}`}
              >
                <Ionicons name="time-outline" size={18} color={colors.primary.main} />
                <Text style={styles.customTimeText}>
                  {t('appointments.chooseDifferentTime') || 'Choose a different time…'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noAlternatives}>
              <Text style={styles.noAlternativesText}>
                {t('appointments.noAlternativesAvailable') || 'No alternatives available for this slot'}
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
    // preferredTimeHour removed - time is extracted from startDate per THERAPY_PLAN_TIME_HANDLING.md
    preferredTimeHourLocal: string;
    preferredTimeMinutesLocal: string;
    durationMinutes: string;
    notes: string;
  }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // ============================================
  // STATE - SINGLE SOURCE OF TRUTH
  // ============================================
  
  // Raw sessions from API (immutable after fetch)
  const [sessions, setSessions] = useState<SessionData[]>([]);
  
  // SINGLE SOURCE OF TRUTH: effectiveTimes indexed by session_number
  // This is the ONLY place to read session times from
  const [effectiveTimes, setEffectiveTimes] = useState<Map<number, EffectiveTime>>(new Map());
  
  // Currently selected global pattern (if any)
  const [selectedGlobalPattern, setSelectedGlobalPattern] = useState<string | null>(null);
  
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [apiClientName, setApiClientName] = useState<string | null>(null);

  // #7: Custom Time Picker State
  const [customTimePickerSession, setCustomTimePickerSession] = useState<number | null>(null);
  const [customTimePickerDate, setCustomTimePickerDate] = useState<Date>(new Date());
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [isValidatingCustomTime, setIsValidatingCustomTime] = useState(false);

  // Mutations
  const createMutation = useCreateAppointmentMutation(tenantId);
  const generatePlanMutation = useGenerateTherapyPlanMutation();

  // Extract params with fallbacks
  const clientId = params.clientId || '';
  const clientNameFromParams = params.clientName || t('common.client');
  const clientName = apiClientName || clientNameFromParams;
  const clientPhone = params.clientPhone || '';
  const treatmentId = params.treatmentId || '';
  const treatmentName = params.treatmentName || t('common.therapy');
  const staffIdsStr = params.staffIds || '';
  const staffNames = params.staffNames || '';
  const startDateStr = params.startDate || new Date().toISOString();
  const durationDays = parseInt(params.durationDays || '7', 10);
  
  // Per THERAPY_PLAN_TIME_HANDLING.md: Extract time from startDateStr (not from separate preferredTimeHour param)
  // The startDateStr contains LOCAL time in ISO format (e.g., "2026-02-15T16:43:00Z")
  const timeMatch = startDateStr.match(/T(\d{2}):(\d{2})/);
  const preferredTimeHourLocal = timeMatch ? parseInt(timeMatch[1], 10) : parseInt(params.preferredTimeHourLocal || '10', 10);
  const preferredTimeMinutesLocal = timeMatch ? parseInt(timeMatch[2], 10) : parseInt(params.preferredTimeMinutesLocal || '0', 10);
  
  const durationMinutes = parseInt(params.durationMinutes || '60', 10);
  const notes = params.notes || '';

  // Parse staffIds once
  const staffIds = useMemo(() => staffIdsStr.split(',').filter(Boolean), [staffIdsStr]);

  // ============================================
  // COMPUTE PLAN-LEVEL ALTERNATIVES
  // ============================================
  
  const planLevelAlternatives = useMemo((): PlanLevelAlternative[] => {
    if (sessions.length === 0) return [];
    
    // Collect all plan_level alternatives across all conflicted sessions
    const timePatternMap = new Map<string, {
      hour: number;
      minute: number;
      coveredSessions: Set<number>;
    }>();
    
    sessions.forEach(session => {
      if (!session.is_conflicted || !session.conflict?.alternative_slots) return;
      
      session.conflict.alternative_slots
        .filter(alt => alt.plan_level === true)
        .forEach(alt => {
          const pattern = extractTimePattern(alt.start);
          const hour = extractHour(alt.start);
          const minute = extractMinute(alt.start);
          
          if (!timePatternMap.has(pattern)) {
            timePatternMap.set(pattern, {
              hour,
              minute,
              coveredSessions: new Set(),
            });
          }
          timePatternMap.get(pattern)!.coveredSessions.add(session.session_number);
        });
    });
    
    // Convert to array and sort by coverage (highest first)
    const alternatives: PlanLevelAlternative[] = [];
    timePatternMap.forEach((data, pattern) => {
      alternatives.push({
        time_pattern: pattern,
        start_hour: data.hour,
        start_minute: data.minute,
        coverage_count: data.coveredSessions.size,
        total_sessions: sessions.length,
        covered_sessions: Array.from(data.coveredSessions),
      });
    });
    
    // Sort by coverage descending, then by hour ascending
    return alternatives
      .sort((a, b) => {
        if (b.coverage_count !== a.coverage_count) {
          return b.coverage_count - a.coverage_count;
        }
        return a.start_hour - b.start_hour;
      })
      .slice(0, 2); // Show top 2 global options
  }, [sessions]);

  // ============================================
  // INITIALIZE EFFECTIVE TIMES FROM API RESPONSE
  // ============================================
  
  const initializeEffectiveTimes = useCallback((newSessions: SessionData[]) => {
    const newEffectiveTimes = new Map<number, EffectiveTime>();
    
    newSessions.forEach(session => {
      // Get staff info
      let staffId = session.staff_id;
      let staffName = session.staff_name;
      
      if (session.staff_assignments && session.staff_assignments.length > 0) {
        staffId = session.staff_assignments[0].id;
        staffName = session.staff_assignments.map(s => s.name).join(', ');
      }
      
      newEffectiveTimes.set(session.session_number, {
        start: session.appointment_start,
        end: session.appointment_end,
        staff_id: staffId,
        staff_name: staffName,
        room_id: session.room_id,
        room_name: session.room_name,
        is_resolved: !session.is_conflicted, // Non-conflicted sessions are already resolved
      });
    });
    
    setEffectiveTimes(newEffectiveTimes);
  }, []);

  // ============================================
  // BACKEND-DRIVEN SESSION GENERATION
  // ============================================
  
  useEffect(() => {
    if (hasFetched) return;
    if (!clientId || !treatmentId || staffIds.length === 0) return;

    const fetchTherapyPlan = async () => {
      setHasFetched(true);

      try {
        console.log('[PreviewAppointments] Fetching therapy plan with:', {
          client_id: clientId,
          treatment_id: treatmentId,
          staff_ids: staffIds,
          start_date: startDateStr,
          duration_days: durationDays,
          // NOTE: NOT sending preferred_time_hour - backend extracts time from start_date
        });

        // Per THERAPY_PLAN_TIME_HANDLING.md:
        // - Don't send preferred_time_hour
        // - Let backend extract both hour and minute from start_date
        const response = await generatePlanMutation.mutateAsync({
          client_id: clientId,
          treatment_id: treatmentId,
          staff_ids: staffIds,
          start_date: startDateStr,
          duration_days: durationDays,
          // DO NOT send preferred_time_hour - backend uses start_date time
        });

        console.log('[PreviewAppointments] Backend response:', JSON.stringify(response, null, 2));

        if (response.client_name) {
          setApiClientName(response.client_name);
        }

        if (response.sessions && response.sessions.length > 0) {
          const mappedSessions: SessionData[] = response.sessions.map((session: any) => ({
            session_number: session.session_number,
            appointment_start: session.appointment_start,
            appointment_end: session.appointment_end,
            staff_id: session.staff_id,
            staff_name: session.staff_name || null,
            staff_assignments: session.staff_assignments || null,
            room_id: session.room_id,
            room_name: session.room_name || null,
            is_conflicted: session.is_conflicted || false,
            conflict: session.conflict || null,
          }));
          
          setSessions(mappedSessions);
          initializeEffectiveTimes(mappedSessions);
          
          console.log('[PreviewAppointments] Sessions loaded:', mappedSessions.length);
          console.log('[PreviewAppointments] Has conflicts:', response.has_conflicts);
        }
      } catch (error: any) {
        console.error('[PreviewAppointments] Failed to generate therapy plan:', error);
        console.error('[PreviewAppointments] Error response:', error?.response?.data);
      }
    };

    fetchTherapyPlan();
  }, [hasFetched, clientId, treatmentId, staffIds, startDateStr, durationDays, initializeEffectiveTimes]);

  // ============================================
  // ALTERNATIVE SELECTION HANDLERS
  // ============================================
  
  /**
   * Handle per-session alternative selection
   * Updates ONLY the effectiveTimes state (single source of truth)
   */
  const handleSelectPerSessionAlternative = useCallback((
    sessionNumber: number, 
    alt: AlternativeSlot
  ) => {
    const firstStaff = alt.available_staff?.[0];
    const firstRoom = alt.available_rooms?.[0];
    
    setEffectiveTimes(prev => {
      const newMap = new Map(prev);
      newMap.set(sessionNumber, {
        start: alt.start,
        end: alt.end,
        staff_id: firstStaff?.staff_id || null,
        staff_name: firstStaff?.full_name || null,
        room_id: firstRoom?.room_id || null,
        room_name: firstRoom?.name || null,
        is_resolved: true,
      });
      return newMap;
    });
    
    // Clear global selection since user picked per-session
    setSelectedGlobalPattern(null);
    
    console.log(`[PreviewAppointments] Selected alternative for session ${sessionNumber}:`, alt.start);
  }, []);

  /**
   * Handle global "apply to all" alternative selection
   * Updates effectiveTimes for ALL covered sessions
   */
  const handleApplyGlobalAlternative = useCallback((alternative: PlanLevelAlternative) => {
    setSelectedGlobalPattern(alternative.time_pattern);
    
    setEffectiveTimes(prev => {
      const newMap = new Map(prev);
      
      // For each covered session, find the matching alternative and apply it
      alternative.covered_sessions.forEach(sessionNumber => {
        const session = sessions.find(s => s.session_number === sessionNumber);
        if (!session?.conflict?.alternative_slots) return;
        
        // Find the alternative slot that matches this time pattern
        const matchingAlt = session.conflict.alternative_slots.find(
          alt => extractTimePattern(alt.start) === alternative.time_pattern
        );
        
        if (matchingAlt) {
          const firstStaff = matchingAlt.available_staff?.[0];
          const firstRoom = matchingAlt.available_rooms?.[0];
          
          newMap.set(sessionNumber, {
            start: matchingAlt.start,
            end: matchingAlt.end,
            staff_id: firstStaff?.staff_id || null,
            staff_name: firstStaff?.full_name || null,
            room_id: firstRoom?.room_id || null,
            room_name: firstRoom?.name || null,
            is_resolved: true,
          });
        }
      });
      
      return newMap;
    });
    
    console.log(`[PreviewAppointments] Applied global pattern ${alternative.time_pattern} to ${alternative.coverage_count} sessions`);
  }, [sessions]);

  // ============================================
  // #7: CUSTOM TIME PICKER HANDLERS
  // ============================================

  const handleOpenCustomTimePicker = useCallback((sessionNumber: number) => {
    const session = sessions.find(s => s.session_number === sessionNumber);
    if (!session) return;

    // Initialize picker with session date and preferred time
    const sessionDate = new Date(session.appointment_start);
    sessionDate.setHours(preferredTimeHourLocal, preferredTimeMinutesLocal, 0, 0);
    
    setCustomTimePickerSession(sessionNumber);
    setCustomTimePickerDate(sessionDate);
    setShowCustomTimePicker(true);
  }, [sessions, preferredTimeHourLocal, preferredTimeMinutesLocal]);

  const handleCustomTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCustomTimePicker(false);
    }
    if (selectedDate) {
      setCustomTimePickerDate(selectedDate);
    }
  };

  const handleConfirmCustomTime = useCallback(async () => {
    if (customTimePickerSession === null) return;

    const session = sessions.find(s => s.session_number === customTimePickerSession);
    if (!session) return;

    setIsValidatingCustomTime(true);

    try {
      // Build custom time slot from picker
      const sessionDate = new Date(session.appointment_start);
      const pickerHours = customTimePickerDate.getHours();
      const pickerMinutes = customTimePickerDate.getMinutes();
      
      // Build ISO start/end using session date + picker time
      const startDate = new Date(sessionDate);
      startDate.setHours(pickerHours, pickerMinutes, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      // For custom time validation, we'll check available slots for that date
      const dateStr = startDate.toISOString().split('T')[0];
      const endDateStr = new Date(startDate.getTime() + 86400000).toISOString().split('T')[0]; // Next day
      
      const validationResult = await getAvailableSlotsApi({
        start_date: dateStr,
        end_date: endDateStr,
        treatment_id: treatmentId,
        duration_minutes: durationMinutes,
      });

      // Check if requested time is available in returned slots
      const requestedHour = pickerHours;
      const requestedMinute = pickerMinutes;
      const isTimeAvailable = validationResult.slots?.some(slot => {
        // AvailableSlot uses 'start' not 'start_time'
        const slotHour = extractHour(slot.start);
        const slotMinute = extractMinute(slot.start);
        return slotHour === requestedHour && slotMinute === requestedMinute;
      }) || validationResult.slots?.length === 0; // If no specific slots returned, assume valid

      if (isTimeAvailable || validationResult.slots === undefined) {
        // Update effectiveTimes with custom selection
        setEffectiveTimes(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(customTimePickerSession, {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            staff_id: staffIds[0] || null,
            staff_name: staffNames || null,
            room_id: null,
            room_name: null,
            is_resolved: true,
          });
          return newMap;
        });

        console.log(`[CustomTime] Applied custom time ${pickerHours}:${pickerMinutes} to session ${customTimePickerSession}`);
        
        setShowCustomTimePicker(false);
        setCustomTimePickerSession(null);
      } else {
        Alert.alert(
          t('common.error') || 'Error',
          t('appointments.timeNotAvailable') || 'Selected time is not available. Please choose another time.'
        );
      }
    } catch (error) {
      console.error('[CustomTime] Validation failed:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('appointments.validationFailed') || 'Could not validate the selected time. Please try again.'
      );
    } finally {
      setIsValidatingCustomTime(false);
    }
  }, [customTimePickerSession, customTimePickerDate, sessions, tenantId, treatmentId, durationMinutes, staffIds, staffNames, t]);

  const handleCancelCustomTimePicker = useCallback(() => {
    setShowCustomTimePicker(false);
    setCustomTimePickerSession(null);
  }, []);

  // ============================================
  // DERIVED STATE (from single source of truth)
  // ============================================
  
  const conflictedSessions = useMemo(() => 
    sessions.filter(s => s.is_conflicted), 
    [sessions]
  );
  
  const unresolvedConflicts = useMemo(() => 
    conflictedSessions.filter(s => {
      const effective = effectiveTimes.get(s.session_number);
      return !effective?.is_resolved;
    }), 
    [conflictedSessions, effectiveTimes]
  );
  
  const allConflictsResolved = unresolvedConflicts.length === 0;
  const hasConflicts = conflictedSessions.length > 0;

  // Determine if we can proceed
  const isLoading = generatePlanMutation.isPending;
  const hasError = generatePlanMutation.isError;
  const errorMessage = generatePlanMutation.error?.message || 
                       (generatePlanMutation.error as any)?.response?.data?.detail ||
                       t('appointments.failedToGeneratePlan');
  const canProceed = sessions.length > 0 && allConflictsResolved && !hasError;

  // ============================================
  // SUCCESS MODAL STATE (for web compatibility)
  // ============================================
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    createdCount: number;
    whatsappUrl: string | null;
  }>({ visible: false, createdCount: 0, whatsappUrl: null });

  // ============================================
  // CREATE APPOINTMENTS
  // ============================================
  
  const handleConfirm = async () => {
    if (!canProceed) {
      Alert.alert(t('common.error'), t('appointments.cannotProceedWithConflicts'));
      return;
    }

    setIsCreating(true);
    let createdCount = 0;
    const errors: string[] = [];

    try {
      // Create appointments using EFFECTIVE TIMES (single source of truth)
      for (const session of sessions) {
        const effective = effectiveTimes.get(session.session_number);
        if (!effective) continue;

        const payload: AppointmentCreate = {
          client_id: clientId,
          staff_id: effective.staff_id || staffIds[0],
          treatment_id: treatmentId,
          appointment_start: effective.start,
          appointment_end: effective.end,
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

      // Show result - use modal on web for reliable button handling
      if (createdCount === sessions.length) {
        let whatsappUrl: string | null = null;
        if (clientPhone) {
          const firstEffective = effectiveTimes.get(1);
          const message = generateWhatsAppSeriesMessage(
            clientName,
            t('common.yourClinic'),
            treatmentName,
            sessions.length,
            safeFormatDate(firstEffective?.start),
            safeFormatTime(firstEffective?.start),
            '+91-XXXXXXXXXX'
          );
          whatsappUrl = openWhatsApp(clientPhone, message);
        }
        
        // On web, Alert buttons don't work reliably - show success modal instead
        if (Platform.OS === 'web') {
          setSuccessModal({ visible: true, createdCount, whatsappUrl });
        } else {
          // Native: use Alert
          if (whatsappUrl) {
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
                    Linking.openURL(whatsappUrl!);
                    router.replace('/clinic-admin/appointments' as any);
                  },
                },
              ]
            );
          } else {
            Alert.alert(t('common.success'), `${createdCount} ${t('appointments.appointmentsCreatedSuccess')}`);
            router.replace('/clinic-admin/appointments' as any);
          }
        }
      } else if (createdCount > 0) {
        // Partial success - navigate directly on web
        if (Platform.OS === 'web') {
          alert(`${t('appointments.created') || 'Created'} ${createdCount} of ${sessions.length}. Some errors occurred.`);
          router.replace('/clinic-admin/appointments' as any);
        } else {
          Alert.alert(
            t('appointments.partialSuccess'),
            `${t('appointments.created')} ${createdCount} of ${sessions.length}.\n\n${t('common.errors')}:\n${errors.join('\n')}`,
            [{ text: t('common.ok'), onPress: () => router.replace('/clinic-admin/appointments' as any) }]
          );
        }
      } else {
        Alert.alert(t('common.error'), `${t('appointments.failedToCreate')}:\n${errors.join('\n')}`);
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('appointments.failedToCreate'));
    } finally {
      setIsCreating(false);
    }
  };

  // Handle success modal actions
  const handleSuccessModalDone = () => {
    setSuccessModal({ visible: false, createdCount: 0, whatsappUrl: null });
    router.replace('/clinic-admin/appointments' as any);
  };

  const handleSuccessModalWhatsApp = () => {
    if (successModal.whatsappUrl) {
      Linking.openURL(successModal.whatsappUrl);
    }
    setSuccessModal({ visible: false, createdCount: 0, whatsappUrl: null });
    router.replace('/clinic-admin/appointments' as any);
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
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>{t('appointments.generatingPlan')}</Text>
          <Text style={styles.loadingSubtext}>{t('appointments.checkingAvailability')}</Text>
        </View>
      )}

      {/* Error State - BLOCKS PROGRESSION */}
      {!isLoading && hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>{t('appointments.validationUnavailable') || 'Validation Unavailable'}</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Text style={styles.errorHelp}>
            {t('appointments.cannotProceedWithoutValidation') || 'Cannot proceed without backend validation. Please try again.'}
          </Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setHasFetched(false);
              }}
            >
              <Text style={styles.retryButtonText}>{t('common.retry') || 'Retry'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.grey[400], marginLeft: spacing.md }]}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>{t('common.goBack') || 'Go Back'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Missing Required Fields */}
      {!isLoading && !hasError && sessions.length === 0 && hasFetched && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.warning.main} />
          <Text style={styles.errorTitle}>{t('appointments.noSessionsReturned') || 'No Sessions Available'}</Text>
          <Text style={styles.errorText}>
            {t('appointments.backendReturnedEmpty') || 'The server returned no sessions for this therapy plan.'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>{t('common.goBack') || 'Go Back'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Plan Content - ONLY when we have backend data */}
      {!isLoading && !hasError && sessions.length > 0 && (
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
              {/* Display the scheduled time from first effective time */}
              {effectiveTimes.size > 0 && (
                <Text style={styles.preferredTimeText}>
                  {t('appointments.scheduledTime') || 'Scheduled'}: {safeFormatTime(effectiveTimes.get(1)?.start)} - {safeFormatTime(effectiveTimes.get(1)?.end)}
                </Text>
              )}
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
            {/* BUG FIX #5: Global "Apply to All" Options */}
            {hasConflicts && !allConflictsResolved && planLevelAlternatives.length > 0 && (
              <GlobalAlternativesSection
                planLevelAlternatives={planLevelAlternatives}
                onApplyGlobal={handleApplyGlobalAlternative}
                selectedGlobalPattern={selectedGlobalPattern}
                t={t}
              />
            )}

            {sessions.map((session) => {
              const effectiveTime = effectiveTimes.get(session.session_number);
              if (!effectiveTime) return null;
              
              return (
                <SessionCard
                  key={session.session_number}
                  session={session}
                  effectiveTime={effectiveTime}
                  isExpanded={expandedSession === session.session_number}
                  onToggle={() => setExpandedSession(
                    expandedSession === session.session_number ? null : session.session_number
                  )}
                  onSelectAlternative={(alt) => 
                    handleSelectPerSessionAlternative(session.session_number, alt)
                  }
                  onOpenCustomTimePicker={handleOpenCustomTimePicker}
                  t={t}
                />
              );
            })}

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

      {/* #7: Custom Time Picker Modal */}
      {showCustomTimePicker && (
        <Modal
          visible={showCustomTimePicker}
          transparent
          animationType="slide"
          onRequestClose={handleCancelCustomTimePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('appointments.chooseDifferentTime') || 'Choose a different time'}
                </Text>
                <TouchableOpacity onPress={handleCancelCustomTimePicker}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                {t('appointments.session') || 'Session'} {customTimePickerSession}
              </Text>
              
              {/* Time Picker - Platform-specific rendering */}
              {Platform.OS === 'web' ? (
                // Web: Use native HTML time input
                <View style={styles.webTimePickerContainer}>
                  <Text style={styles.webTimeLabel}>{t('appointments.selectTime') || 'Select Time'}:</Text>
                  <input
                    type="time"
                    value={`${customTimePickerDate.getHours().toString().padStart(2, '0')}:${customTimePickerDate.getMinutes().toString().padStart(2, '0')}`}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newDate = new Date(customTimePickerDate);
                      newDate.setHours(hours, minutes, 0, 0);
                      setCustomTimePickerDate(newDate);
                    }}
                    style={{
                      fontSize: 24,
                      padding: 16,
                      borderRadius: 8,
                      border: `1px solid ${colors.border.main}`,
                      backgroundColor: colors.background.paper,
                      color: colors.text.primary,
                      width: '100%',
                      textAlign: 'center',
                    }}
                  />
                  <Text style={styles.webTimePreview}>
                    {t('appointments.selectedTime') || 'Selected'}: {formatTimeFromParts(customTimePickerDate.getHours(), customTimePickerDate.getMinutes())}
                  </Text>
                </View>
              ) : (
                // Native: Use DateTimePicker
                <DateTimePicker
                  value={customTimePickerDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleCustomTimeChange}
                  minuteInterval={15}
                />
              )}
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={handleCancelCustomTimePicker}
                >
                  <Text style={styles.modalCancelText}>{t('common.cancel') || 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalConfirmButton,
                    isValidatingCustomTime && styles.modalButtonDisabled,
                  ]}
                  onPress={handleConfirmCustomTime}
                  disabled={isValidatingCustomTime}
                >
                  {isValidatingCustomTime ? (
                    <ActivityIndicator size="small" color={colors.background.default} />
                  ) : (
                    <Text style={styles.modalConfirmText}>{t('common.confirm') || 'Confirm'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Modal (for web compatibility) */}
      {successModal.visible && (
        <Modal
          visible={successModal.visible}
          transparent
          animationType="fade"
          onRequestClose={handleSuccessModalDone}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successModalIcon}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success.main} />
              </View>
              <Text style={styles.successModalTitle}>
                {t('appointments.appointmentsCreated') || 'Appointments Created!'}
              </Text>
              <Text style={styles.successModalText}>
                {successModal.createdCount} {t('appointments.sessionsScheduled') || 'sessions have been scheduled'}
              </Text>
              <View style={styles.successModalActions}>
                <TouchableOpacity
                  style={styles.successModalDoneButton}
                  onPress={handleSuccessModalDone}
                >
                  <Text style={styles.successModalDoneText}>{t('common.done') || 'Done'}</Text>
                </TouchableOpacity>
                {successModal.whatsappUrl && (
                  <TouchableOpacity
                    style={styles.successModalWhatsAppButton}
                    onPress={handleSuccessModalWhatsApp}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={styles.successModalWhatsAppText}>
                      {t('appointments.sendWhatsApp') || 'Send WhatsApp'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
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
  errorButtons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },

  // Warning Banner (Fallback Mode)
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.light || '#FFF3E0',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning.main,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    ...typography.body2,
    color: colors.warning.dark || colors.text.primary,
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
  // BUG FIX #4: Preferred time highlight
  preferredTimeText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  // Scheduled time note
  scheduledTimeNote: {
    ...typography.body2,
    color: colors.success.main,
    fontWeight: '600',
    marginTop: spacing.xs / 2,
  },
  scheduledTimeHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '400',
    fontStyle: 'italic',
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
  // Conflict staff text styling
  sessionStaffConflict: {
    color: colors.error.main,
    fontWeight: '500',
  },
  // Room name display
  sessionRoom: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
  },

  // ============================================
  // GLOBAL ALTERNATIVES SECTION (BUG FIX #5)
  // ============================================
  globalAlternativesSection: {
    backgroundColor: colors.primary.main + '08',
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary.main + '20',
  },
  globalAlternativesTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  globalAlternativesSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  globalAlternativeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  globalAlternativeOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  globalAlternativeContent: {
    flex: 1,
  },
  globalAlternativeTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  globalAlternativeTime: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  globalAlternativeTimeSelected: {
    color: colors.primary.main,
  },
  globalAlternativeCoverage: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  globalAlternativeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.main,
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
  moreOptionsText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 2,
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

  // #7: Custom Time Row
  customTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '08',
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
    borderStyle: 'dashed',
  },
  customTimeText: {
    flex: 1,
    ...typography.body2,
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },

  // #7: Custom Time Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h6,
    color: colors.text.primary,
  },
  modalSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.button,
    color: colors.text.primary,
  },
  modalConfirmButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  modalConfirmText: {
    ...typography.button,
    color: colors.background.default,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  // Web Time Picker Styles
  webTimePickerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  webTimeLabel: {
    ...typography.body1,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  webTimePreview: {
    ...typography.body2,
    color: colors.primary.main,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  // Success Modal Styles
  successModalContent: {
    backgroundColor: colors.background.default,
    borderRadius: spacing.lg,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successModalIcon: {
    marginBottom: spacing.md,
  },
  successModalTitle: {
    ...typography.h6,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successModalText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  successModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  successModalDoneButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
  },
  successModalDoneText: {
    ...typography.button,
    color: colors.text.primary,
  },
  successModalWhatsAppButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalWhatsAppText: {
    ...typography.button,
    color: '#fff',
  },
});

export default PreviewAppointmentsScreen;
