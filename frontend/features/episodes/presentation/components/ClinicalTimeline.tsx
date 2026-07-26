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
 */
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { formatDate } from '../../../../core/utils/dateTimeUtils';
import {
  useClinicalTimelineData,
  ClinicalTimelineItem,
  ClinicalTimelineItemType,
} from '../hooks/useClinicalTimelineData';

const ITEM_ICON: Record<ClinicalTimelineItemType, keyof typeof Ionicons.glyphMap> = {
  visit: 'calendar-outline',
  prescription: 'medkit-outline',
  case_sheet: 'document-text-outline',
  treatment_recommendation: 'medical-outline',
  clinical_service: 'pulse-outline',
};

// Bounded height for the panel's own FlatList -- see docstring above.
const TIMELINE_MAX_HEIGHT = 360;

export const ClinicalTimeline: React.FC = () => {
  const router = useRouter();
  const { colors, spacing, typography } = useClinicTheme();
  const { items, isLoading } = useClinicalTimelineData();

  const renderItem = useCallback(
    ({ item }: { item: ClinicalTimelineItem }) => (
      <TouchableOpacity
        onPress={() => router.push(item.route as any)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}${item.subtitle ? `, ${item.subtitle}` : ''}, ${formatDate(item.date)}`}
        style={[
          styles.item,
          { borderColor: colors.border.subtle, borderRadius: spacing.sm, padding: spacing.sm, gap: spacing.sm },
        ]}
      >
        <Ionicons name={ITEM_ICON[item.type]} size={20} color={colors.primary.default} />
        <View style={styles.itemText}>
          <Text style={[typography.subtitle2, { color: colors.text.primary }]}>{item.title}</Text>
          {!!item.subtitle && (
            <Text style={[typography.caption, { color: colors.text.secondary }]}>{item.subtitle}</Text>
          )}
        </View>
        <Text style={[typography.caption, { color: colors.text.tertiary }]}>{formatDate(item.date)}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
      </TouchableOpacity>
    ),
    [router, colors, spacing, typography],
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
  item: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  itemText: { flex: 1 },
});
