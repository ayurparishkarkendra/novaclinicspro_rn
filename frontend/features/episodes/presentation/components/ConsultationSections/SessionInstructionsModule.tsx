/**
 * SessionInstructionsModule (T-FE-E.2, FR-TS-3, FR-SCH-2)
 *
 * NEW module -- no existing frontend component owned "doctor-authored
 * Session content" before this task. Reads the current Episode's
 * treatment order via `useTreatmentOrderQuery` (the rich
 * `TreatmentRowOrderResponse[]` projection -- `id`, `status`,
 * `treatment_name`/`medicines_text`/`instructions_text`, unlike the
 * narrower `treatmentSheet` already in `useEpisodeContext()`, which the
 * backend's own `_row_to_dict` docstring documents as deliberately
 * excluding scheduling/status fields -- see `ClinicalTimeline.tsx`'s own
 * Engineering Truth note on the same distinction, T-BE-A.3b).
 *
 * Sessions are selected and edited by their stable `id`
 * (`TreatmentSheetRow.id`, T-BE-E.1) -- never `day_number`, `session_date`,
 * therapist, or array position (FR-TS-1). A completed Session's content
 * is never editable (mirrors the backend's own `update_row` rejection of
 * `status == 'COMPLETED'` -- this is a UI convenience matching a real
 * server-side rule, not a new rule invented here).
 *
 * OCC (T-BE-E.5, staged-optional): the order's own `version` (already
 * fetched, no second call) is sent as `If-Match` on every content save.
 * A stale token surfaces an explicit conflict state with a `current_version`-
 * driven reload action -- never a silent overwrite, never an automatic
 * blind retry with the server's version.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../../core/localization/useTranslation';
import { useEpisodeContext } from '../../context/ClinicalWorkspaceContext';
import { useTreatmentOrderQuery } from '../../../../treatmentSheets/data/repositories/treatmentOrders.repository.impl';
import { useUpdateTreatmentSheetRowMutation } from '../../../../treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { TreatmentRowOrderResponse } from '../../../../treatmentSheets/data/models/treatmentOrders.dtos';

const KNOWN_ROW_STATUSES: ReadonlySet<string> = new Set(['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

function is409VersionConflict(err: any): number | null {
  const detail = err?.response?.data?.detail;
  if (err?.response?.data?.error === 'VERSION_CONFLICT') return err.response.data.current_version ?? null;
  if (detail?.error === 'VERSION_CONFLICT') return detail.current_version ?? null;
  return null;
}

export const SessionInstructionsModule: React.FC = () => {
  const { colors, spacing, typography, radii, borderWidths, sizes } = useClinicTheme();
  const { t } = useTranslation();
  const { tenantId, treatmentSheetId } = useEpisodeContext();

  const orderQuery = useTreatmentOrderQuery(treatmentSheetId ?? '', tenantId, { enabled: !!tenantId && !!treatmentSheetId });
  const updateRowMutation = useUpdateTreatmentSheetRowMutation(tenantId, treatmentSheetId ?? '');

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ treatment_description: string; medicines_given: string; instructions: string }>({
    treatment_description: '',
    medicines_given: '',
    instructions: '',
  });
  const [conflict, setConflict] = useState<{ currentVersion: number | null } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rows: TreatmentRowOrderResponse[] = orderQuery.data?.rows ?? [];
  const selectedRow = useMemo(() => rows.find((r) => r.id === selectedRowId) ?? null, [rows, selectedRowId]);

  const selectRow = useCallback((row: TreatmentRowOrderResponse) => {
    setSelectedRowId(row.id);
    setDraft({
      treatment_description: row.treatment_name ?? '',
      medicines_given: row.medicines_text ?? '',
      instructions: row.instructions_text ?? '',
    });
    setConflict(null);
    setSaveError(null);
  }, []);

  const saveDraft = useCallback(async () => {
    if (!selectedRow) return;
    setSaveError(null);
    setConflict(null);
    try {
      await updateRowMutation.mutateAsync({
        rowId: selectedRow.id,
        payload: draft,
        expectedVersion: orderQuery.data?.version,
      });
      await orderQuery.refetch();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setConflict({ currentVersion: is409VersionConflict(err) });
        return;
      }
      setSaveError(err?.response?.data?.detail ?? err?.message ?? t('sessionInstructions.saveFailed'));
    }
  }, [selectedRow, draft, orderQuery, updateRowMutation, t]);

  const reloadAfterConflict = useCallback(async () => {
    setConflict(null);
    setSaveError(null);
    setSelectedRowId(null);
    await orderQuery.refetch();
  }, [orderQuery]);

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface.default,
      borderColor: colors.border.default,
      borderWidth: borderWidths.default,
      borderRadius: radii.medium,
      padding: spacing.lg,
    },
  ];

  if (!treatmentSheetId) {
    // Honest, field-specific empty state -- never "coming soon". A
    // Recommendation must exist (TreatmentRecommendationModule) before
    // any Session exists to author content on.
    return (
      <View style={cardStyle} testID="session-instructions-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>
          {t('sessionInstructions.title')}
        </Text>
        <Text style={[typography.body2, { color: colors.text.secondary }]}>{t('sessionInstructions.noOrderYet')}</Text>
      </View>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <View style={cardStyle} testID="session-instructions-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>
          {t('sessionInstructions.title')}
        </Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary.default} />
          <Text style={[typography.body2, { color: colors.text.secondary, marginLeft: spacing.sm }]}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (orderQuery.isError) {
    return (
      <View style={cardStyle} testID="session-instructions-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>
          {t('sessionInstructions.title')}
        </Text>
        <Text style={[typography.body2, { color: colors.feedback.error, marginBottom: spacing.sm }]}>
          {t('errors.generic.loadFailed')}
        </Text>
        <TouchableOpacity onPress={() => orderQuery.refetch()} accessibilityRole="button">
          <Text style={[typography.button, { color: colors.primary.default }]}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={cardStyle} testID="session-instructions-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>
          {t('sessionInstructions.title')}
        </Text>
        <Text style={[typography.body2, { color: colors.text.secondary }]}>{t('sessionInstructions.noSessions')}</Text>
      </View>
    );
  }

  return (
    <View style={cardStyle} testID="session-instructions-section">
      <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>
        {t('sessionInstructions.title')}
      </Text>
      <View style={[styles.rowList, { gap: spacing.xs }]}>
        {rows.map((row) => {
          const isSelected = row.id === selectedRowId;
          const statusLabel = KNOWN_ROW_STATUSES.has(row.status)
            ? t(`sessionInstructions.rowStatus.${row.status}`)
            : row.status;
          return (
            <TouchableOpacity
              key={row.id}
              onPress={() => selectRow(row)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.rowItem,
                {
                  borderColor: isSelected ? colors.primary.default : colors.border.subtle,
                  borderRadius: spacing.sm,
                  padding: spacing.sm,
                  minHeight: sizes.touchTarget,
                },
              ]}
            >
              <Ionicons
                name={row.status === 'COMPLETED' ? 'checkmark-circle-outline' : 'ellipse-outline'}
                size={18}
                color={colors.text.secondary}
              />
              <Text style={[typography.body2, { color: colors.text.primary, marginLeft: spacing.sm, flex: 1 }]}>
                {t('sessionInstructions.dayLabel', { day: row.day_number })}
              </Text>
              <Text style={[typography.caption, { color: colors.text.secondary }]}>{statusLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedRow && (
        <View style={[styles.editor, { marginTop: spacing.md, gap: spacing.sm }]}>
          {selectedRow.status === 'COMPLETED' ? (
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              {t('sessionInstructions.completedReadOnly')}
            </Text>
          ) : null}
          <FieldInput
            label={t('sessionInstructions.fields.treatmentName')}
            value={draft.treatment_description}
            editable={selectedRow.status !== 'COMPLETED'}
            onChangeText={(v) => setDraft((d) => ({ ...d, treatment_description: v }))}
          />
          <FieldInput
            label={t('sessionInstructions.fields.medicines')}
            value={draft.medicines_given}
            editable={selectedRow.status !== 'COMPLETED'}
            onChangeText={(v) => setDraft((d) => ({ ...d, medicines_given: v }))}
          />
          <FieldInput
            label={t('sessionInstructions.fields.instructions')}
            value={draft.instructions}
            editable={selectedRow.status !== 'COMPLETED'}
            onChangeText={(v) => setDraft((d) => ({ ...d, instructions: v }))}
            multiline
          />

          {conflict && (
            <View
              style={[
                styles.conflictBanner,
                { backgroundColor: colors.feedback.errorLight, borderColor: colors.feedback.error, borderRadius: spacing.sm, padding: spacing.sm, gap: spacing.xs },
              ]}
              accessibilityRole="alert"
            >
              <Text style={[typography.body2, { color: colors.feedback.error }]}>{t('sessionInstructions.conflict.message')}</Text>
              <TouchableOpacity onPress={reloadAfterConflict} accessibilityRole="button" style={{ minHeight: sizes.touchTarget, justifyContent: 'center' }}>
                <Text style={[typography.button, { color: colors.primary.default }]}>{t('sessionInstructions.conflict.reload')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {saveError && (
            <Text style={[typography.body2, { color: colors.feedback.error }]}>{saveError}</Text>
          )}

          {selectedRow.status !== 'COMPLETED' && (
            <TouchableOpacity
              onPress={saveDraft}
              disabled={updateRowMutation.isPending}
              accessibilityRole="button"
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary.default,
                  borderRadius: spacing.sm,
                  minHeight: sizes.touchTarget,
                },
              ]}
            >
              {updateRowMutation.isPending ? (
                <ActivityIndicator color={colors.surface.default} />
              ) : (
                <Text style={[typography.button, { color: colors.surface.default }]}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const FieldInput: React.FC<{
  label: string;
  value: string;
  editable: boolean;
  multiline?: boolean;
  onChangeText: (v: string) => void;
}> = ({ label, value, editable, multiline, onChangeText }) => {
  const { colors, spacing, typography, radii, borderWidths } = useClinicTheme();
  return (
    <View>
      <Text style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.xs }]}>{label}</Text>
      <TextInput
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[
          {
            borderColor: colors.border.default,
            borderWidth: borderWidths.default,
            borderRadius: radii.small,
            padding: spacing.sm,
            color: editable ? colors.text.primary : colors.text.secondary,
            backgroundColor: editable ? colors.surface.default : colors.surface.muted,
            minHeight: multiline ? 80 : undefined,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {},
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  rowList: {},
  rowItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  editor: {},
  conflictBanner: { borderWidth: 1 },
  saveButton: { alignItems: 'center', justifyContent: 'center' },
});
