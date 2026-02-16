/**
 * Worklist Section Component
 * Displays the therapist's scheduled sessions with period tabs
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { WorklistPeriod, TherapistSessionItem } from '../../data/models/therapistDashboard.dtos';
import { getPeriodLabel } from '../../domain/entities/therapistDashboard.entity';
import { WorklistItemCard } from './WorklistItemCard';

interface WorklistSectionProps {
  sessions: TherapistSessionItem[];
  period: WorklistPeriod;
  onPeriodChange: (period: WorklistPeriod) => void;
  onSessionPress?: (session: TherapistSessionItem) => void;
  onStartSession?: (session: TherapistSessionItem) => void;
  onViewAllPress?: () => void;
  isLoading?: boolean;
  isOnLeave?: boolean;
}

const PERIOD_TABS: { key: WorklistPeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'next_7_days', label: 'Next 7 Days' },
  { key: 'past_7_days', label: 'Past 7 Days' },
];

export const WorklistSection: React.FC<WorklistSectionProps> = ({
  sessions,
  period,
  onPeriodChange,
  onSessionPress,
  onStartSession,
  onViewAllPress,
  isLoading = false,
  isOnLeave = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{getPeriodLabel(period)}</Text>
        {onViewAllPress && (
          <TouchableOpacity onPress={onViewAllPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary.main} />
          </TouchableOpacity>
        )}
      </View>

      {/* Period Tabs */}
      <View style={styles.tabsContainer}>
        {PERIOD_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              period === tab.key && styles.tabActive,
            ]}
            onPress={() => onPeriodChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: period === tab.key }}
            accessibilityLabel={`${tab.label} sessions`}
          >
            <Text style={[
              styles.tabText,
              period === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.success.main} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name={isOnLeave ? 'bed-outline' : 'calendar-outline'}
              size={48}
              color={colors.grey[400]}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {isOnLeave ? "You're on leave" : 'No Sessions'}
          </Text>
          <Text style={styles.emptyMessage}>
            {isOnLeave
              ? 'Enjoy your time off!'
              : `No treatment sessions scheduled for ${getPeriodLabel(period).toLowerCase()}.`}
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsList}>
          {sessions.slice(0, 5).map((session) => (
            <WorklistItemCard
              key={session.id}
              session={session}
              onPress={() => onSessionPress?.(session)}
              onStartPress={() => onStartSession?.(session)}
            />
          ))}
          {sessions.length > 5 && (
            <TouchableOpacity style={styles.moreButton} onPress={onViewAllPress}>
              <Text style={styles.moreButtonText}>
                +{sessions.length - 5} more sessions
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.grey[100],
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: colors.background.default,
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.grey[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sessionsList: {
    gap: spacing.sm,
  },
  moreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.grey[50],
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  moreButtonText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '500',
  },
});

export default WorklistSection;
