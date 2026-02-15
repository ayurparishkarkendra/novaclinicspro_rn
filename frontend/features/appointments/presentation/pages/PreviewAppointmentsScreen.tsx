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
  openWhatsApp,
  generateWhatsAppSeriesMessage,
} from '../../data/models/appointments.dtos';

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

/**
 * Extract time pattern (HH:MM) from ISO string without timezone conversion
 */
const extractTimePattern = (dateStr: string): string => {
  const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }
  return '00:00';
};

/**
 * Extract hour from ISO string
 */
const extractHour = (dateStr: string): number => {
  const timeMatch = dateStr.match(/T(\d{2}):/);
  return timeMatch ? parseInt(timeMatch[1], 10) : 0;
};

/**
 * Extract minute from ISO string
 */
const extractMinute = (dateStr: string): number => {
  const timeMatch = dateStr.match(/T\d{2}:(\d{2})/);
  return timeMatch ? parseInt(timeMatch[1], 10) : 0;
};

/**
 * FIX #3: Display time exactly as returned by backend WITHOUT timezone conversion.
 * Backend returns times like "2026-02-14T16:00:00Z" where 16:00 represents the user's
 * intended local time (4 PM). We must NOT convert this to local timezone.
 */
const safeFormatTime = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    // If it's a string, extract hours/minutes directly from the ISO string
    // to avoid timezone conversion that would shift 16:00 to 21:30 in IST
    if (typeof dateStr === 'string') {
      // Parse ISO format: "2026-02-14T16:00:00Z" or "2026-02-14T16:00:00"
      const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = hours >= 12 ? 'pm' : 'am';
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    }
    // Fallback for Date objects - use UTC methods to avoid conversion
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '—';
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return '—';
  }
};

/**
 * Format time from hour and minute numbers
 */
const formatTimeFromParts = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
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
  t: (key: string, params?: Record<string, string | number>) => string;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  effectiveTime,
  isExpanded,
  onToggle,
  onSelectAlternative,
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
          {/* BUG FIX #3: Single conflict message - only in expanded section */}
          {conflictMessage && (
            <View style={styles.conflictReason}>
              <Ionicons name="alert-circle" size={16} color={colors.error.main} />
              <Text style={styles.conflictReasonText}>
                {conflictMessage}
              </Text>
            </View>
          )}

          {/* BUG FIX #4: Alternative Slots - fully selectable */}
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
    preferredTimeHour: string;
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
  const preferredTimeHour = parseInt(params.preferredTimeHour || '10', 10);
  const preferredTimeHourLocal = parseInt(params.preferredTimeHourLocal || params.preferredTimeHour || '10', 10);
  const preferredTimeMinutesLocal = parseInt(params.preferredTimeMinutesLocal || '0', 10);
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
          preferred_time_hour: preferredTimeHour,
        });

        const response = await generatePlanMutation.mutateAsync({
          client_id: clientId,
          treatment_id: treatmentId,
          staff_ids: staffIds,
          start_date: startDateStr,
          duration_days: durationDays,
          preferred_time_hour: preferredTimeHour,
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
  }, [hasFetched, clientId, treatmentId, staffIds, startDateStr, durationDays, preferredTimeHour, initializeEffectiveTimes]);

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

      // Show result
      if (createdCount === sessions.length) {
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
        Alert.alert(
          t('appointments.partialSuccess'),
          `${t('appointments.created')} ${createdCount} of ${sessions.length}.\n\n${t('common.errors')}:\n${errors.join('\n')}`,
          [{ text: t('common.ok'), onPress: () => router.replace('/clinic-admin/appointments' as any) }]
        );
      } else {
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
});

export default PreviewAppointmentsScreen;
