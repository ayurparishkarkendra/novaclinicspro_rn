/**
 * Paused Series Widget
 * Shows paused treatment series with pause reason and "Resume" button
 * 
 * Requirements: F2.5 - Admin Dashboard Integration
 * Location: features/staffDashboards/presentation/components/PausedSeriesWidget.tsx
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
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useFeatures, hasMultiDayAppointments } from '../../../../core/hooks/useFeatures';

// ============================================
// TYPES
// ============================================

interface PausedSeries {
  id: string;
  treatment_sheet_id: string;
  treatment_name: string;
  client_name: string;
  pause_reason: string;
  paused_days_ago: number;
  remaining_days: number;
  completed_days: number;
  total_days: number;
}

interface PausedSeriesWidgetProps {
  series: PausedSeries[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onResume?: (treatmentSheetId: string) => void;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const PausedSeriesWidget: React.FC<PausedSeriesWidgetProps> = ({
  series,
  isLoading = false,
  onViewAll,
  onResume,
  testID = 'paused-series-widget',
}) => {
  const features = useFeatures();

  // Don't render if multi-day appointments are not enabled
  if (!hasMultiDayAppointments(features)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="pause-circle" size={20} color={colors.info.main} />
            <Text style={styles.title}>Paused Series</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.info.main} />
          <Text style={styles.loadingText}>Loading paused series...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (series.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="pause-circle" size={20} color={colors.info.main} />
            <Text style={styles.title}>Paused Series</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success.main} />
          <Text style={styles.emptyText}>No paused treatment series</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="pause-circle" size={20} color={colors.info.main} />
          <Text style={styles.title}>Paused Series</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} testID={`${testID}-view-all`}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Series count */}
      <Text style={styles.countText}>
        ⏸️ {series.length} series currently paused
      </Text>

      {/* Series list */}
      <View style={styles.seriesList}>
        {series.map((item) => (
          <View
            key={item.id}
            style={styles.seriesCard}
            testID={`${testID}-series-${item.id}`}
          >
            {/* Series header */}
            <View style={styles.seriesHeader}>
              <Text style={styles.seriesName} numberOfLines={1}>
                {item.treatment_name} ({item.client_name})
              </Text>
            </View>

            {/* Pause info */}
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>Reason: {item.pause_reason}</Text>
            </View>

            {/* Paused duration */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                Paused {item.paused_days_ago} day{item.paused_days_ago !== 1 ? 's' : ''} ago
              </Text>
            </View>

            {/* Remaining days */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {item.remaining_days} day{item.remaining_days !== 1 ? 's' : ''} remaining ({item.completed_days}/{item.total_days} completed)
              </Text>
            </View>

            {/* Resume button */}
            {onResume && (
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={() => onResume(item.treatment_sheet_id)}
                testID={`${testID}-resume-${item.id}`}
              >
                <Ionicons name="play-circle" size={16} color={colors.common.white} />
                <Text style={styles.resumeButtonText}>Resume</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* View all button */}
      {onViewAll && series.length > 3 && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAll}
          testID={`${testID}-view-all-bottom`}
        >
          <Text style={styles.viewAllButtonText}>View All Paused Series</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  viewAllText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  countText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  seriesList: {
    gap: spacing.md,
  },
  seriesCard: {
    backgroundColor: colors.background.default,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 3,
    borderLeftColor: colors.info.main,
  },
  seriesHeader: {
    marginBottom: spacing.sm,
  },
  seriesName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body2,
    color: colors.text.secondary,
    flex: 1,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success.main,
    borderRadius: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  resumeButtonText: {
    ...typography.button,
    color: colors.common.white,
    fontSize: 13,
  },
  viewAllButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  viewAllButtonText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
