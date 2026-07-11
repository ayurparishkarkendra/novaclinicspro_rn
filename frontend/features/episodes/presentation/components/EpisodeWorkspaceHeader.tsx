/**
 * EpisodeWorkspaceHeader
 *
 * Two components:
 *  - EpisodeHeader  — patient name, episode title, status chip, meta row
 *  - WorkspaceTabBar — keyboard-focusable tab strip (ARIA tablist)
 *
 * All sizes from theme.spacing / theme.typography. No hardcoded values.
 * Works on Android, iOS, and Web (no platform-specific APIs).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { formatDisplayDate } from './EpisodeWorkspaceShared';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkspaceTab = 'visitNotes' | 'treatmentPlans' | 'prescriptions';

interface EpisodeHeaderProps {
  clientName: string;
  episodeTitle: string;
  episodeStatus: 'ACTIVE' | 'CLOSED';
  startDate: string;
  visitsCount: number;
}

interface WorkspaceTabBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  tabs: { key: WorkspaceTab; labelKey: string; icon: string }[];
}

// ─── Tab definitions (exported so screen can filter) ─────────────────────────

export const ALL_WORKSPACE_TABS: { key: WorkspaceTab; labelKey: string; icon: string }[] = [
  { key: 'prescriptions',   labelKey: 'episodeWorkspace.tabs.prescriptions',   icon: 'calendar-number-outline' },
  { key: 'visitNotes',      labelKey: 'episodeWorkspace.tabs.visitNotes',      icon: 'document-text-outline' },
  { key: 'treatmentPlans',  labelKey: 'episodeWorkspace.tabs.treatmentPlans',  icon: 'calendar-outline' },
];

// ─── EpisodeHeader ────────────────────────────────────────────────────────────

export const EpisodeHeader: React.FC<EpisodeHeaderProps> = ({
  clientName,
  episodeTitle,
  episodeStatus,
  startDate,
  visitsCount,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const { t } = useTranslation();

  const statusColor =
    episodeStatus === 'ACTIVE' ? colors.feedback.success : colors.text.secondary;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background.elevated,
          borderBottomColor: colors.border.subtle,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        },
      ]}
      accessibilityRole="header"
    >
      <Text
        style={[typography.h4, { color: colors.text.primary, marginBottom: spacing.xs }]}
        accessibilityRole="text"
      >
        {clientName || '—'}
      </Text>

      <View style={styles.titleRow}>
        <Text
          style={[typography.body2, { color: colors.text.secondary, flex: 1 }]}
          numberOfLines={1}
        >
          {episodeTitle}
        </Text>
        <View
          style={[
            styles.statusChip,
            {
              backgroundColor: statusColor + '18',
              borderColor: statusColor + '50',
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs / 2,
              borderRadius: spacing.md,
              gap: spacing.xs,
            },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: statusColor }]}
          />
          <Text style={[typography.caption, { color: statusColor, fontWeight: '600' }]}>
            {t(
              episodeStatus === 'ACTIVE'
                ? 'episodeWorkspace.header.active'
                : 'episodeWorkspace.header.closed'
            )}
          </Text>
        </View>
      </View>

      <Text style={[typography.caption, { color: colors.text.tertiary, marginTop: spacing.xs }]}>
        {t('episodeWorkspace.header.episode')} · {formatDisplayDate(startDate)} ·{' '}
        {visitsCount} {visitsCount === 1 ? 'visit' : 'visits'}
      </Text>
    </View>
  );
};

// ─── WorkspaceTabBar ──────────────────────────────────────────────────────────

export const WorkspaceTabBar: React.FC<WorkspaceTabBarProps> = ({
  activeTab,
  onTabChange,
  tabs,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.background.elevated,
          borderBottomColor: colors.border.subtle,
        },
      ]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const labelColor = isActive
          ? colors.primary.default
          : colors.text.secondary;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                paddingVertical: spacing.sm,
                borderBottomWidth: 2,
                borderBottomColor: isActive
                  ? colors.primary.default
                  : 'transparent',
                gap: spacing.xs,
              },
            ]}
            onPress={() => onTabChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={t(tab.labelKey)}
            activeOpacity={0.7}
            // Web: allow keyboard focus
            {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}
          >
            <Ionicons name={tab.icon as any} size={16} color={labelColor} />
            <Text
              style={[
                typography.caption,
                { color: labelColor, fontWeight: isActive ? '600' : '400' },
              ]}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
