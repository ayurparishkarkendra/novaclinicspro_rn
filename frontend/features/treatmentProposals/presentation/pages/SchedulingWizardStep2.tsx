/**
 * Scheduling Wizard - Step 2 (Review Sessions)
 * Second step of the multi-day treatment scheduling wizard
 * 
 * Features:
 * - Display session grid with day, date, time, therapist, room, status
 * - Call validate_schedule API to detect conflicts
 * - Highlight conflicts with warning/error icons
 * - Show conflict details on row tap
 * - Allow editing individual sessions (time, therapist, room)
 * - Re-validate after each edit
 * - Pagination for large series (> 20 sessions)
 * - Show summary (total sessions, conflicts count)
 * - Navigation to Step 3 and back to Step 1
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useSchedulingWizardStore } from '../stores/schedulingWizard.store';
import { validateScheduleApi } from '../../data/api/schedulingApi';
import { SessionSlot, SchedulingConflict } from '../../data/models/treatmentProposals.dtos';

interface SchedulingWizardStep2Props {
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

interface SessionWithConflict extends SessionSlot {
  day_number: number;
  conflicts?: SchedulingConflict[];
}

const SESSIONS_PER_PAGE = 20;

export const SchedulingWizardStep2: React.FC<SchedulingWizardStep2Props> = ({
  onNext,
  onBack,
  onCancel,
}) => {
  const theme = useClinicTheme();
  
  // Wizard store
  const {
    proposalId,
    proposalName,
    step1Data,
    sessions,
    setSessions,
    validationErrors,
    setValidationErrors,
    isValidating,
    setIsValidating,
  } = useSchedulingWizardStore();

  // Local state
  const [sessionsWithConflicts, setSessionsWithConflicts] = useState<SessionWithConflict[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate sessions on mount if not already generated
  useEffect(() => {
    if (sessions.length === 0) {
      generateSessions();
    } else {
      // Map existing sessions to include day numbers
      const mapped = sessions.map((session, index) => ({
        ...session,
        day_number: index + 1,
      }));
      setSessionsWithConflicts(mapped);
      validateSessions(sessions);
    }
  }, []);

  // Generate sessions based on Step 1 data
  const generateSessions = () => {
    if (!step1Data.start_date || !step1Data.duration_days || !step1Data.default_time) {
      Alert.alert('Error', 'Missing required data from Step 1');
      return;
    }

    setIsGenerating(true);

    try {
      const generatedSessions: SessionSlot[] = [];
      const startDate = new Date(step1Data.start_date);
      
      for (let i = 0; i < step1Data.duration_days; i++) {
        const sessionDate = new Date(startDate);
        
        // Apply frequency pattern
        if (step1Data.frequency === 'DAILY') {
          sessionDate.setDate(startDate.getDate() + i);
        } else if (step1Data.frequency === 'SIX_DAYS_WEEK') {
          // Skip Sundays
          let daysAdded = 0;
          let currentDate = new Date(startDate);
          while (daysAdded <= i) {
            if (currentDate.getDay() !== 0) { // Not Sunday
              if (daysAdded === i) {
                sessionDate.setTime(currentDate.getTime());
                break;
              }
              daysAdded++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else if (step1Data.frequency === 'ALTERNATE_DAYS') {
          sessionDate.setDate(startDate.getDate() + (i * 2));
        } else {
          // CUSTOM - for now, treat as DAILY
          sessionDate.setDate(startDate.getDate() + i);
        }

        generatedSessions.push({
          date: sessionDate.toISOString().split('T')[0],
          time: step1Data.default_time,
          therapist_id: step1Data.default_therapist_id || '',
          room_id: step1Data.default_room_id,
        });
      }

      setSessions(generatedSessions);
      
      const mapped = generatedSessions.map((session, index) => ({
        ...session,
        day_number: index + 1,
      }));
      setSessionsWithConflicts(mapped);
      
      // Validate generated sessions
      validateSessions(generatedSessions);
    } catch (error) {
      console.error('Failed to generate sessions:', error);
      Alert.alert('Error', 'Failed to generate sessions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Validate sessions with backend
  const validateSessions = async (sessionsToValidate: SessionSlot[]) => {
    if (!proposalId) {
      console.error('No proposal ID available');
      return;
    }

    setIsValidating(true);

    try {
      // Get tenant ID from auth context (placeholder)
      const tenantId = 'tenant-123'; // TODO: Get from auth context

      const response = await validateScheduleApi(tenantId, proposalId, {
        start_date: step1Data.start_date || '',
        sessions: sessionsToValidate,
        agreed_package_cost: step1Data.agreed_package_cost || 0,
      });

      setValidationErrors(response.conflicts || []);

      // Map conflicts to sessions
      const mapped = sessionsToValidate.map((session, index) => {
        const sessionConflicts = response.conflicts.filter(
          (c) => c.session_index === index
        );
        return {
          ...session,
          day_number: index + 1,
          conflicts: sessionConflicts.length > 0 ? sessionConflicts : undefined,
        };
      });

      setSessionsWithConflicts(mapped);
    } catch (error) {
      console.error('Failed to validate sessions:', error);
      Alert.alert(
        'Validation Error',
        error instanceof Error ? error.message : 'Failed to validate schedule'
      );
    } finally {
      setIsValidating(false);
    }
  };

  // Handle session edit
  const handleEditSession = (index: number) => {
    setSelectedSessionIndex(index);
    // TODO: Open edit modal
    Alert.alert('Coming Soon', 'Session editing will be implemented');
  };

  // Handle next button
  const handleNext = () => {
    // Check for unresolved ERROR conflicts
    const errorConflicts = validationErrors.filter((c) => c.severity === 'ERROR');
    
    if (errorConflicts.length > 0) {
      Alert.alert(
        'Unresolved Conflicts',
        `You have ${errorConflicts.length} unresolved conflicts that must be fixed before proceeding.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Warn about WARNING conflicts
    const warningConflicts = validationErrors.filter((c) => c.severity === 'WARNING');
    
    if (warningConflicts.length > 0) {
      Alert.alert(
        'Scheduling Warnings',
        `There are ${warningConflicts.length} warnings. Do you want to proceed anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: onNext },
        ]
      );
    } else {
      onNext();
    }
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Get conflict icon
  const getConflictIcon = (conflicts?: SchedulingConflict[]) => {
    if (!conflicts || conflicts.length === 0) {
      return <Ionicons name="checkmark-circle" size={20} color={theme.colors.feedback.success} />;
    }

    const hasError = conflicts.some((c) => c.severity === 'ERROR');
    if (hasError) {
      return <Ionicons name="close-circle" size={20} color={theme.colors.feedback.error} />;
    }

    return <Ionicons name="warning" size={20} color={theme.colors.feedback.warning} />;
  };

  // Get conflict status text
  const getConflictStatus = (conflicts?: SchedulingConflict[]): string => {
    if (!conflicts || conflicts.length === 0) return 'OK';
    
    const hasError = conflicts.some((c) => c.severity === 'ERROR');
    if (hasError) return 'Error';
    
    return 'Warning';
  };

  // Pagination
  const totalPages = Math.ceil(sessionsWithConflicts.length / SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + SESSIONS_PER_PAGE, sessionsWithConflicts.length);
  const paginatedSessions = sessionsWithConflicts.slice(startIndex, endIndex);

  // Summary
  const totalSessions = sessionsWithConflicts.length;
  const errorCount = validationErrors.filter((c) => c.severity === 'ERROR').length;
  const warningCount = validationErrors.filter((c) => c.severity === 'WARNING').length;

  if (isGenerating) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.default} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Generating sessions...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.default }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Review Sessions
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
            Step 2 of 3: {proposalName}
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface.default, padding: theme.spacing.md }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
              {totalSessions}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
              Total Sessions
            </Text>
          </View>
          
          {errorCount > 0 && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.feedback.error }]}>
                {errorCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                Errors
              </Text>
            </View>
          )}
          
          {warningCount > 0 && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.feedback.warning }]}>
                {warningCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                Warnings
              </Text>
            </View>
          )}
          
          {errorCount === 0 && warningCount === 0 && (
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={32} color={theme.colors.feedback.success} />
              <Text style={[styles.summaryLabel, { color: theme.colors.feedback.success }]}>
                No Conflicts
              </Text>
            </View>
          )}
        </View>

        {isValidating && (
          <View style={styles.validatingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary.default} />
            <Text style={[styles.validatingText, { color: theme.colors.text.secondary }]}>
              Validating schedule...
            </Text>
          </View>
        )}
      </View>

      {/* Session Grid */}
      <View style={styles.gridContainer}>
        {/* Grid Header */}
        <View style={[styles.gridHeader, { backgroundColor: theme.colors.surface.default, borderBottomColor: theme.colors.border.default }]}>
          <Text style={[styles.gridHeaderCell, styles.dayColumn, { color: theme.colors.text.secondary, textTransform: 'uppercase' }]}>
            Day
          </Text>
          <Text style={[styles.gridHeaderCell, styles.dateColumn, { color: theme.colors.text.secondary, textTransform: 'uppercase' }]}>
            Date
          </Text>
          <Text style={[styles.gridHeaderCell, styles.timeColumn, { color: theme.colors.text.secondary, textTransform: 'uppercase' }]}>
            Time
          </Text>
          <Text style={[styles.gridHeaderCell, styles.statusColumn, { color: theme.colors.text.secondary, textTransform: 'uppercase' }]}>
            Status
          </Text>
          <View style={[styles.actionColumn]} />
        </View>

        {/* Session Rows */}
        <FlatList
          data={paginatedSessions}
          keyExtractor={(item, index) => `session-${startIndex + index}`}
          renderItem={({ item, index }) => {
            const globalIndex = startIndex + index;
            return (
              <TouchableOpacity
                style={[
                  styles.gridRow,
                  {
                    backgroundColor: theme.colors.background.default,
                    borderBottomColor: theme.colors.border.default,
                  },
                ]}
                onPress={() => {
                  if (item.conflicts && item.conflicts.length > 0) {
                    Alert.alert(
                      'Conflicts',
                      item.conflicts.map((c) => c.message).join('\n\n')
                    );
                  }
                }}
              >
                <Text style={[styles.gridCell, styles.dayColumn, { color: theme.colors.text.primary }]}>
                  {item.day_number}
                </Text>
                <Text style={[styles.gridCell, styles.dateColumn, { color: theme.colors.text.primary }]}>
                  {formatDate(item.date)}
                </Text>
                <Text style={[styles.gridCell, styles.timeColumn, { color: theme.colors.text.primary }]}>
                  {item.time}
                </Text>
                <View style={[styles.statusColumn, styles.statusCell]}>
                  {getConflictIcon(item.conflicts)}
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: item.conflicts
                          ? item.conflicts.some((c) => c.severity === 'ERROR')
                            ? theme.colors.feedback.error
                            : theme.colors.feedback.warning
                          : theme.colors.feedback.success,
                      },
                    ]}
                  >
                    {getConflictStatus(item.conflicts)}
                  </Text>
                </View>
                <View style={[styles.actionColumn]}>
                  <TouchableOpacity onPress={() => handleEditSession(globalIndex)}>
                    <Ionicons name="create-outline" size={20} color={theme.colors.primary.default} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={true}
          style={styles.gridList}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={[styles.pagination, { borderTopColor: theme.colors.border.default, padding: theme.spacing.md }]}>
            <Text style={[styles.paginationText, { color: theme.colors.text.secondary }]}>
              Showing {startIndex + 1}-{endIndex} of {totalSessions} sessions
            </Text>
            <View style={styles.paginationButtons}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  { borderColor: theme.colors.border.default },
                ]}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={currentPage === 1 ? theme.colors.text.disabled : theme.colors.text.primary}
                />
              </TouchableOpacity>
              
              <Text style={[styles.pageNumber, { color: theme.colors.text.primary }]}>
                {currentPage} / {totalPages}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  { borderColor: theme.colors.border.default },
                ]}
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={currentPage === totalPages ? theme.colors.text.disabled : theme.colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border.default, padding: theme.spacing.md }]}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.backButton,
            { borderColor: theme.colors.border.default },
          ]}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
          <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.nextButton,
            { backgroundColor: theme.colors.primary.default },
          ]}
          onPress={handleNext}
          disabled={isValidating}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
            Next: Confirm
          </Text>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.primary.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  summaryCard: {
    margin: 16,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  validatingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  validatingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  gridContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  gridHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
  },
  gridHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridList: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  gridCell: {
    fontSize: 14,
  },
  dayColumn: {
    width: 50,
  },
  dateColumn: {
    flex: 1,
  },
  timeColumn: {
    width: 70,
  },
  statusColumn: {
    width: 80,
  },
  statusCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actionColumn: {
    width: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  paginationText: {
    fontSize: 14,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  pageNumber: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
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
  nextButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
});
