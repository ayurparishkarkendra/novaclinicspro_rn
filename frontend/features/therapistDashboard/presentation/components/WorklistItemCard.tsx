/**
 * Worklist Item Card Component
 * Individual session card with actions for the worklist
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  TherapistSessionItem,
  getStatusColor,
  getStatusLabel,
} from '../../../staffDashboards/data/models/staffDashboards.dtos';
import { formatSessionTime } from '../../data/models/therapistDashboard.dtos';
import { canStartSession } from '../../domain/entities/therapistDashboard.entity';

interface WorklistItemCardProps {
  session: TherapistSessionItem;
  onPress?: () => void;
  onStartPress?: () => void;
}

export const WorklistItemCard: React.FC<WorklistItemCardProps> = ({
  session,
  onPress,
  onStartPress,
}) => {
  const statusColor = getStatusColor(session.status);
  const statusLabel = getStatusLabel(session.status);
  const timeDisplay = formatSessionTime(session.session_date);
  const isStartable = canStartSession(session);
  const isNewPatient = session.session_number === 1;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Session with ${session.client_name || 'client'}, ${statusLabel}`}
    >
      {/* Left Section - Time */}
      <View style={styles.timeSection}>
        <View style={[styles.timeBadge, { backgroundColor: colors.success.main + '15' }]}>
          <Text style={styles.timeText}>{timeDisplay}</Text>
        </View>
      </View>

      {/* Middle Section - Details */}
      <View style={styles.content}>
        <View style={styles.mainRow}>
          <View style={styles.clientInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.clientName} numberOfLines={1}>
                {session.client_name || 'Unknown Client'}
              </Text>
              {isNewPatient && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
            <Text style={styles.treatmentName} numberOfLines={1}>
              {session.treatment_name || 'Treatment Session'}
            </Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Secondary Row */}
        <View style={styles.secondaryRow}>
          <View style={styles.sessionTag}>
            <Ionicons name="fitness-outline" size={14} color={colors.info.main} />
            <Text style={styles.sessionNumber}>Session #{session.session_number}</Text>
          </View>
        </View>
      </View>

      {/* Right Section - Actions */}
      <View style={styles.actionsSection}>
        {isStartable && onStartPress && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onStartPress();
            }}
            accessibilityRole="button"
            accessibilityLabel="Start session"
          >
            <Ionicons name="play" size={16} color={colors.background.default} />
          </TouchableOpacity>
        )}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.grey[400]}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey[50],
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  timeSection: {
    marginRight: spacing.md,
  },
  timeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  timeText: {
    ...typography.caption,
    color: colors.success.main,
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  clientName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  newBadge: {
    backgroundColor: colors.warning.main,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    ...typography.caption,
    color: colors.common.white,
    fontWeight: '700',
    fontSize: 9,
  },
  treatmentName: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sessionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionNumber: {
    ...typography.caption,
    color: colors.info.main,
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  startButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export default WorklistItemCard;
