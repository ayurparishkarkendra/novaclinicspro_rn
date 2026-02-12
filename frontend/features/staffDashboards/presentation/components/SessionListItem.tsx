/**
 * Session List Item Component
 * Displays a single treatment session in a scannable format for therapist dashboard
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  TherapistSessionItem,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '../../data/models/staffDashboards.dtos';

interface SessionListItemProps {
  session: TherapistSessionItem;
  onPress?: () => void;
  onStartPress?: () => void;
}

export const SessionListItem: React.FC<SessionListItemProps> = ({
  session,
  onPress,
  onStartPress,
}) => {
  const statusColor = getStatusColor(session.status);
  const statusLabel = getStatusLabel(session.status);
  const timeDisplay = formatTime(session.session_date);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Time on the left */}
      <View style={styles.timeSection}>
        <View style={[styles.timeBadge, { backgroundColor: colors.success.main + '15' }]}>
          <Text style={styles.timeText}>{timeDisplay}</Text>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.mainRow}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName} numberOfLines={1}>
              {session.client_name || 'Unknown Client'}
            </Text>
            <Text style={styles.treatmentName} numberOfLines={1}>
              {session.treatment_name || 'Treatment Session'}
            </Text>
          </View>

          {/* Status badge on the right */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Secondary info - Session number */}
        <View style={styles.secondaryRow}>
          <View style={styles.sessionTag}>
            <Ionicons name="fitness-outline" size={14} color={colors.info.main} />
            <Text style={styles.sessionNumber}>Session #{session.session_number}</Text>
          </View>
        </View>
      </View>

      {/* Start button for pending sessions */}
      {['pending', 'scheduled'].includes(session.status?.toLowerCase()) && onStartPress && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onStartPress();
          }}
        >
          <Ionicons name="play" size={16} color={colors.background.default} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
  clientName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
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
  startButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
