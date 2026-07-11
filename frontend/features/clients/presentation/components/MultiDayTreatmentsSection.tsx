/**
 * Multi-Day Treatments Section Component
 * Displays active treatment sheets and pending proposals for an episode
 * 
 * Features:
 * - Shows IN_PROGRESS treatment sheets with progress bars
 * - Shows PROPOSED treatment proposals
 * - Displays next session date/time
 * - Action buttons (View Treatment Sheet, View Proposal, Schedule)
 * - Loading skeleton and empty states
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useFeatures, hasMultiDayAppointments } from '../../../../core/hooks/useFeatures';
import { useTreatmentSheetsByEpisodeQuery } from '../../../treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { TreatmentSheetStatusBadge } from '../../../treatmentSheets/presentation/components/TreatmentSheetStatusBadge';
import { ProgressBar } from '../../../treatmentSheets/presentation/components/ProgressBar';

// ============================================
// TYPES
// ============================================

interface MultiDayTreatmentsSectionProps {
  /** Episode ID to fetch treatments for */
  episodeId: string;
}

// ============================================
// COMPONENT
// ============================================

export const MultiDayTreatmentsSection: React.FC<MultiDayTreatmentsSectionProps> = ({
  episodeId,
}) => {
  const theme = useClinicTheme();
  const router = useRouter();
  const { currentUser } = useAuth();
  const features = useFeatures();
  const tenantId = currentUser?.tenantId || '';

  // Check if multi-day appointments are enabled
  const isFeatureEnabled = hasMultiDayAppointments(features);

  // Fetch treatment sheets (only if feature is enabled)
  const {
    data: sheetsData,
    isLoading: isLoadingSheets,
    isError: isErrorSheets,
  } = useTreatmentSheetsByEpisodeQuery(tenantId, episodeId, {
    enabled: isFeatureEnabled && !!tenantId && !!episodeId,
  });

  // Don't render if multi-day appointments are not enabled
  if (!isFeatureEnabled) {
    return null;
  }

  // Filter for active sheets (IN_PROGRESS or SCHEDULED)
  const activeSheets = sheetsData?.treatment_sheets?.filter(
    (sheet) => sheet.status === 'DRAFT' || sheet.status === 'FINAL' || sheet.status === 'IN_PROGRESS' || sheet.status === 'SCHEDULED'
  ) || [];

  // Loading state
  if (isLoadingSheets) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Multi-Day Treatments
        </Text>
        <View style={[styles.loadingCard, { backgroundColor: theme.colors.surface.elevated }]}>
          <ActivityIndicator size="small" color={theme.colors.primary.default} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading treatments...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (isErrorSheets) {
    return null; // Silently fail - this is not critical
  }

  // Empty state
  if (activeSheets.length === 0) {
    return null; // Don't show section if no multi-day treatments
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Multi-Day Treatments
      </Text>

      {/* Active Treatment Sheets */}
      {activeSheets.map((sheet) => (
        <TreatmentSheetCard
          key={sheet.id}
          sheet={sheet}
          tenantId={tenantId}
          theme={theme}
          router={router}
        />
      ))}

      {/* Empty State */}
      {activeSheets.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={theme.colors.text.disabled} />
          <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
            No active multi-day treatments
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// TREATMENT SHEET CARD
// ============================================

interface TreatmentSheetCardProps {
  sheet: any;
  tenantId: string;
  theme: any;
  router: any;
}

const TreatmentSheetCard: React.FC<TreatmentSheetCardProps> = ({
  sheet,
  tenantId,
  theme,
  router,
}) => {
  // Calculate progress
  const completedDays = sheet.rows?.filter((row: any) => row.status === 'COMPLETED').length || 0;
  const totalDays = sheet.duration_days || sheet.rows?.length || 0;
  const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  // Find next session
  const today = new Date();
  const nextSession = sheet.rows
    ?.filter((row: any) => row.session_date && new Date(row.session_date) >= today)
    .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0];

  const handleViewSheet = () => {
    router.push({
      pathname: '/clinic-admin/treatment-sheets/[treatmentSheetId]',
      params: { treatmentSheetId: sheet.id },
    });
  };

  // Get treatment name from episode or default
  const treatmentName = sheet.episode_title || 'Multi-Day Treatment';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface.elevated,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={20} color={theme.colors.feedback.info} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {treatmentName}
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.text.secondary }]}>
            {totalDays} days
          </Text>
        </View>
        <TreatmentSheetStatusBadge status={sheet.status} size="small" />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.colors.text.secondary }]}>
            Progress
          </Text>
          <Text style={[styles.progressValue, { color: theme.colors.text.primary }]}>
            {completedDays}/{totalDays} days ({Math.round(progressPercentage)}%)
          </Text>
        </View>
        <ProgressBar progress={progressPercentage} height={8} />
      </View>

      {/* Next Session */}
      {nextSession && (
        <View style={styles.nextSessionSection}>
          <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={[styles.nextSessionText, { color: theme.colors.text.secondary }]}>
            Next Session:{' '}
            <Text style={{ color: theme.colors.text.primary }}>
              {formatSessionDate(nextSession.session_date)}, {nextSession.scheduled_time || 'Time TBD'}
            </Text>
          </Text>
        </View>
      )}

      {/* Actions */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.colors.primary.main }]}
        onPress={handleViewSheet}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionButtonText, { color: theme.colors.surface.elevated }]}>
          View Treatment Sheet
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.surface.elevated} />
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// HELPERS
// ============================================

const formatSessionDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Check if tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // Format as "Mon, 26 Feb"
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextSessionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  nextSessionText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  costSection: {
    marginBottom: 12,
  },
  modalitiesSection: {
    marginBottom: 8,
  },
  modalitiesText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  metadataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: 12,
  },
});
