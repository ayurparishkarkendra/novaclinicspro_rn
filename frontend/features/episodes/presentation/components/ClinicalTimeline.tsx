/**
 * ClinicalTimeline (R3B · T-C.2, ADR-R3B-02, ADR-R3B-07, Timeline Adapter Rule §7)
 *
 * Render-only: consumes `useClinicalTimelineData()`'s (T-C.1) already-
 * normalized output and renders chronological ordering + per-item
 * navigation. Performs NO aggregation, NO query merging, and NO
 * normalization of its own — that logic lives exclusively in the adapter
 * (Timeline Adapter Rule). Holds no clinical-artifact state (CO-4) — its
 * only local state, if any, would be presentation-only (e.g. expand/
 * collapse), never artifact content.
 *
 * Read-only in every sense (CO-3, CO-6, N-7): this file calls zero create/
 * update/save APIs of any kind, including no Visit Note API — it only reads
 * the adapter's output and calls `router.push()`. Every item navigates to
 * its own canonical detail/reference route (FR-C2) — this component never
 * renders an editable field.
 *
 * Mounted as a sibling of `ConsultationWorkspaceScreen` (the "ModuleHost" of
 * design.md's own target-architecture diagram) inside `ClinicalWorkspace`,
 * active only when `isClinicalSpineV1Enabled` is ON (ClinicalWorkspace.tsx).
 * Also composed inside `VisitCommandCenter` (T-FE-C.4, FR-VCC-1) — same
 * public API (no props; episode scope comes entirely from
 * `useEpisodeContext()`), so both hosts work unmodified.
 *
 * T-FE-C.4: virtualized via `FlatList` (was a plain `ScrollView` + `.map()`)
 * and given a bounded `maxHeight` so it is always its own independently-
 * scrollable region -- required both to satisfy the "virtualized" AC and to
 * make embedding safe inside `VisitCommandCenter`'s single outer
 * `ScrollView` (an unbounded-height `FlatList` nested in a ScrollView of the
 * same orientation is a known RN anti-pattern). The legacy `flex: 1` host in
 * `ClinicalWorkspace.tsx` is unaffected -- `maxHeight` only caps growth, it
 * doesn't fight a smaller flex-constrained parent.
 *
 * T-FE-C.5 (T-BE-A.3/A.3a): the adapter's item shape changed (backend
 * `encounter_type` taxonomy replaces the old 5 UI-artifact types), so this
 * file's icon lookup and press handling were updated minimally: (1)
 * `ITEM_ICON` now keys on the 4 backend encounter types plus a generic
 * fallback for an unrecognized future value; (2) an item with no `route`
 * (Treatment Plan/Treatment Review -- no existing detail screen for either
 * yet) renders non-interactive rather than calling `router.push(undefined)`.
 * No other rendering behavior changed -- `formatDate(item.date)` already
 * handled a null date gracefully before this task. A one-state
 * error/retry surface was added (`isError`/`refetch`, now exposed by the
 * adapter) since the single Clinical History query can itself fail --
 * unlike the pre-T-FE-C.5 assembly, there are no "remaining" queries to
 * fall back to.
 *
 * T-FE-C.6 (FR-HIST-1): `treatment_plan` rows are now individually
 * collapsible -- local UI state only (a `Set` of expanded item ids), per
 * this file's own pre-existing docstring anticipation above ("its only
 * local state, if any, would be presentation-only, e.g. expand/collapse").
 * Expanding a Plan row reveals its `sessionCounts` breakdown (icon+text
 * per count, never colour-alone) -- the only Plan-level detail the
 * backend contract actually carries. Engineering Truth (this task's own
 * pre-implementation report): `HistoryItemResponse` has no `sessions[]`
 * array and no Plan `status` field (design.md's own `history_items[]`
 * description names both; neither exists on the live contract) -- so
 * expanding a Plan can only ever reveal the real aggregate counts, never
 * fabricated per-session rows or a fabricated status label. AC(4)'s
 * "completed/stopped/superseded Plans remain visible and distinct" is
 * satisfied on its literal "remain visible" clause only (every Plan the
 * backend returns is rendered, never locally filtered by any status
 * heuristic -- proven by test); visual differentiation BY status is a
 * discovered, reported gap requiring a backend field, not fabricated
 * here. `legacy_treatment_sessions` rows get an explicit
 * "Plan association unavailable" subtitle (AC-6) -- literal text, not an
 * inferred one, since that is exactly what this encounter type means.
 */
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { formatDate } from '../../../../core/utils/dateTimeUtils';
import {
  useClinicalTimelineData,
  ClinicalTimelineItem,
  ClinicalTimelineSessionCounts,
} from '../hooks/useClinicalTimelineData';

const ITEM_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  consultation: 'calendar-outline',
  treatment_review: 'clipboard-outline',
  treatment_plan: 'medical-outline',
  legacy_treatment_sessions: 'pulse-outline',
};
const DEFAULT_ITEM_ICON: keyof typeof Ionicons.glyphMap = 'ellipse-outline';

// Bounded height for the panel's own FlatList -- see docstring above.
const TIMELINE_MAX_HEIGHT = 360;

const SESSION_COUNT_ICON: Record<keyof ClinicalTimelineSessionCounts, keyof typeof Ionicons.glyphMap> = {
  completed: 'checkmark-circle-outline',
  scheduled: 'time-outline',
  not_completed: 'ellipse-outline',
  cancelled: 'close-circle-outline',
};

const SessionCountsBreakdown: React.FC<{ counts: ClinicalTimelineSessionCounts }> = ({ counts }) => {
  const { colors, spacing, typography } = useClinicTheme();
  const { t } = useTranslation();
  const rows: Array<[keyof ClinicalTimelineSessionCounts, string]> = [
    ['completed', t('clinicalTimeline.sessionCounts.completed')],
    ['scheduled', t('clinicalTimeline.sessionCounts.scheduled')],
    ['not_completed', t('clinicalTimeline.sessionCounts.notCompleted')],
    ['cancelled', t('clinicalTimeline.sessionCounts.cancelled')],
  ];
  return (
    <View style={[styles.sessionCounts, { gap: spacing.xs, paddingTop: spacing.xs }]}>
      {rows.map(([key, label]) => (
        <View key={key} style={[styles.sessionCountRow, { gap: spacing.xs }]}>
          <Ionicons name={SESSION_COUNT_ICON[key]} size={14} color={colors.text.secondary} />
          <Text style={[typography.caption, { color: colors.text.secondary }]}>
            {label}: {counts[key]}
          </Text>
        </View>
      ))}
    </View>
  );
};

export const ClinicalTimeline: React.FC = () => {
  const router = useRouter();
  const { colors, spacing, typography } = useClinicTheme();
  const { t } = useTranslation();
  const { items, isLoading, isError, refetch } = useClinicalTimelineData();
  // T-FE-C.6 (AC-3): presentation-only expand/collapse state -- which
  // Plan rows are currently expanded. Never holds clinical-artifact
  // content, only item ids.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ClinicalTimelineItem }) => {
      const isPlan = item.type === 'treatment_plan';
      const isExpanded = isPlan && expandedIds.has(item.id);
      const subtitle =
        item.type === 'legacy_treatment_sessions' ? t('clinicalTimeline.legacyUnavailableLabel') : item.subtitle;

      return (
        <TouchableOpacity
          onPress={
            isPlan ? () => toggleExpanded(item.id) : item.route ? () => router.push(item.route as any) : undefined
          }
          disabled={!isPlan && !item.route}
          accessibilityRole="button"
          accessibilityState={isPlan ? { expanded: isExpanded } : undefined}
          accessibilityLabel={`${item.title}${subtitle ? `, ${subtitle}` : ''}, ${formatDate(item.date)}`}
          style={[
            styles.item,
            { borderColor: colors.border.subtle, borderRadius: spacing.sm, padding: spacing.sm, gap: spacing.sm },
          ]}
        >
          <View style={[styles.itemRow, { gap: spacing.sm }]}>
            <Ionicons name={ITEM_ICON[item.type] ?? DEFAULT_ITEM_ICON} size={20} color={colors.primary.default} />
            <View style={styles.itemText}>
              <Text style={[typography.subtitle2, { color: colors.text.primary }]}>{item.title}</Text>
              {!!subtitle && <Text style={[typography.caption, { color: colors.text.secondary }]}>{subtitle}</Text>}
            </View>
            <Text style={[typography.caption, { color: colors.text.tertiary }]}>{formatDate(item.date)}</Text>
            {isPlan && !!item.sessionCounts && (
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.text.secondary}
              />
            )}
            {!isPlan && !!item.route && <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />}
          </View>
          {isExpanded && item.sessionCounts && <SessionCountsBreakdown counts={item.sessionCounts} />}
        </TouchableOpacity>
      );
    },
    [router, colors, spacing, typography, t, expandedIds, toggleExpanded],
  );
  const keyExtractor = useCallback((item: ClinicalTimelineItem) => item.id, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface.default, borderColor: colors.border.default, maxHeight: TIMELINE_MAX_HEIGHT },
      ]}
    >
      <Text style={[typography.h6, { color: colors.text.primary, padding: spacing.md, paddingBottom: spacing.sm }]}>
        Clinical Timeline
      </Text>
      {isLoading ? (
        <View style={[styles.center, { padding: spacing.lg }]}>
          <ActivityIndicator color={colors.primary.default} />
        </View>
      ) : isError ? (
        <View style={[styles.center, { padding: spacing.lg, gap: spacing.sm }]}>
          <Text style={[typography.body2, { color: colors.feedback.error }]}>
            {t('clinicalTimeline.error')}
          </Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={[typography.button, { color: colors.primary.default }]}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <Text
          style={[typography.body2, { color: colors.text.secondary, paddingHorizontal: spacing.md, paddingBottom: spacing.md }]}
        >
          No clinical activity recorded yet for this episode.
        </Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, borderWidth: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  item: { borderWidth: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemText: { flex: 1 },
  sessionCounts: {},
  sessionCountRow: { flexDirection: 'row', alignItems: 'center' },
});
