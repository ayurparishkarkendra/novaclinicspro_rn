/**
 * WorkspaceHeader (R3A · T-D.1, optional — design §23 Q3, ADR-R3A-03)
 *
 * Thin, read-only. Renders Patient/Episode summary from Persistent Context
 * and an aggregated save-status badge across every module, read by
 * reference from WorkspaceSaveStatusContext (never a copy, never a second
 * owner — Doc 06 §5). It has no onPress handlers, no API calls, and no
 * dependency on any module's save/create/update function — it cannot
 * trigger a save, and one module's status can never block another's,
 * since it only aggregates already-independent, already-computed values.
 *
 * Deliberately compact: PatientSummarySection (rendered inside
 * ConsultationWorkspaceScreen's own scroll content) already shows the full
 * Patient/Episode/Visit detail grid — duplicating that here would violate
 * Composition Before Duplication (Doc 06 §3.4). The one thing that doesn't
 * exist anywhere else is a single glance at every module's save status
 * together, so that's the only new content this component adds.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useEpisodeContext, usePatientContext } from '../context/ClinicalWorkspaceContext';
import { useWorkspaceSaveStatuses } from '../context/WorkspaceSaveStatusContext';

type AggregateTone = 'success' | 'warning' | 'error' | 'neutral';

interface AggregateSaveStatus {
  label: string;
  tone: AggregateTone;
}

export function summarizeSaveStatuses(statuses: ReturnType<typeof useWorkspaceSaveStatuses>): AggregateSaveStatus {
  const values = Object.values(statuses);
  if (values.some((v) => v === 'error')) return { label: '⚠ Save error', tone: 'error' };
  if (values.some((v) => v === 'saving')) return { label: 'Saving…', tone: 'warning' };
  if (values.some((v) => v === 'saved')) return { label: '✓ Saved', tone: 'success' };
  return { label: '', tone: 'neutral' };
}

export const WorkspaceHeader: React.FC = () => {
  const { colors, spacing, typography } = useClinicTheme();
  const { clientName } = usePatientContext();
  const { episodeDetails } = useEpisodeContext();
  const saveStatuses = useWorkspaceSaveStatuses();

  const aggregate = useMemo(() => summarizeSaveStatuses(saveStatuses), [saveStatuses]);
  const toneColor =
    aggregate.tone === 'error'
      ? colors.feedback.error
      : aggregate.tone === 'warning'
        ? colors.feedback.warning
        : colors.feedback.success;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface.muted,
          borderBottomColor: colors.border.subtle,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        },
      ]}
    >
      <Text style={[typography.subtitle2, styles.identity, { color: colors.text.primary }]} numberOfLines={1}>
        {clientName}
        {episodeDetails ? ` · ${episodeDetails.episode.title}` : ''}
      </Text>
      {!!aggregate.label && (
        <Text testID="workspaceHeaderSaveStatus" style={[typography.caption, { color: toneColor }]}>
          {aggregate.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  identity: { flex: 1 },
});
