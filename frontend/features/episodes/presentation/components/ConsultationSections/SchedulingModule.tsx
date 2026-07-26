/**
 * SchedulingModule (T-FE-E.2, FR-SCH-1, FR-SCH-2)
 *
 * NEW module. Shows current scheduled/unscheduled Session state (via the
 * same `useTreatmentOrderQuery` fetch `SessionInstructionsModule` already
 * uses -- react-query dedupes the two calls on their shared query key, so
 * this is not a second network request) and lets a permitted user schedule
 * a row via the existing `ScheduleRowModal` (already used by the admin
 * scheduling surfaces, `treatment_order.schedule`-gated backend-side).
 *
 * Engineering Truth gap (reported, not implemented here): the backend's
 * read-only scheduling PROPOSAL endpoint
 * (`GET /treatment-sheets/plans/{plan_id}/scheduling-proposal`, T-BE-E.2a)
 * takes a `TenantTreatmentPlan.plan_id` path parameter. `TenantTreatmentPlan`
 * has zero public HTTP contract (no router/schema/main.py registration --
 * same gap blocking the Treatment Plan section elsewhere in this screen),
 * and no existing response anywhere (Order, Sheet, or Row) carries a
 * `plan_id` field. There is therefore no way for this frontend to obtain
 * the `plan_id` this endpoint requires, for any Episode. The "governed
 * scheduling intent" / "proposed dates" / "PRN: no pre-created dates" /
 * "review-dependent: stops at milestone" acceptance-criteria items are
 * consequently BLOCKED, not merely unimplemented -- there is no honest way
 * to show them without either fabricating a proposal locally (explicitly
 * forbidden by this task's own instructions) or guessing a `plan_id`.
 * Proposed remediation: `T-BE-D.4a` (the same proposed narrow amendment
 * task that would give Treatment Plan a public router) should also expose
 * a way to resolve a Plan's id for a given Episode/Sheet, so this endpoint
 * becomes reachable.
 *
 * What IS implemented: current scheduled/unscheduled state per Session,
 * and the write action itself -- both operate on the already-public
 * Row/Order contract and need no `plan_id`.
 */
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../../core/localization/useTranslation';
import { useAuth } from '../../../../auth/presentation/hooks/useAuth';
import { useEpisodeContext } from '../../context/ClinicalWorkspaceContext';
import { useTreatmentOrderQuery } from '../../../../treatmentSheets/data/repositories/treatmentOrders.repository.impl';
import { ScheduleRowModal } from '../../../../treatmentSheets/presentation/components/ScheduleRowModal';
import { TreatmentRowOrderResponse } from '../../../../treatmentSheets/data/models/treatmentOrders.dtos';

const SCHEDULE_PERMISSION = 'treatment_order.schedule';

export const SchedulingModule: React.FC = () => {
  const { colors, spacing, typography, radii, borderWidths, sizes } = useClinicTheme();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { tenantId, treatmentSheetId } = useEpisodeContext();

  const orderQuery = useTreatmentOrderQuery(treatmentSheetId ?? '', tenantId, { enabled: !!tenantId && !!treatmentSheetId });
  const [schedulingRow, setSchedulingRow] = useState<TreatmentRowOrderResponse | null>(null);

  const rows: TreatmentRowOrderResponse[] = orderQuery.data?.rows ?? [];
  const canSchedule = (currentUser?.permissions ?? []).includes(SCHEDULE_PERMISSION);

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
    return (
      <View style={cardStyle} testID="scheduling-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>{t('scheduling.title')}</Text>
        <Text style={[typography.body2, { color: colors.text.secondary }]}>{t('scheduling.noOrderYet')}</Text>
      </View>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <View style={cardStyle} testID="scheduling-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>{t('scheduling.title')}</Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary.default} />
          <Text style={[typography.body2, { color: colors.text.secondary, marginLeft: spacing.sm }]}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (orderQuery.isError) {
    return (
      <View style={cardStyle} testID="scheduling-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>{t('scheduling.title')}</Text>
        <Text style={[typography.body2, { color: colors.feedback.error, marginBottom: spacing.sm }]}>{t('errors.generic.loadFailed')}</Text>
        <TouchableOpacity onPress={() => orderQuery.refetch()} accessibilityRole="button">
          <Text style={[typography.button, { color: colors.primary.default }]}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={cardStyle} testID="scheduling-section">
      <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>{t('scheduling.title')}</Text>

      {/* Honest gap notice for the proposal sub-capability -- see file docstring */}
      <Text style={[typography.caption, { color: colors.text.tertiary, marginBottom: spacing.sm }]}>
        {t('scheduling.proposalUnavailable')}
      </Text>

      {!canSchedule && (
        <View
          style={[
            styles.waitingBanner,
            { backgroundColor: colors.surface.muted, borderColor: colors.border.subtle, borderRadius: spacing.sm, padding: spacing.sm, marginBottom: spacing.sm },
          ]}
        >
          <Text style={[typography.body2, { color: colors.text.secondary }]}>{t('scheduling.waitingOnRole')}</Text>
        </View>
      )}

      {rows.length === 0 ? (
        <Text style={[typography.body2, { color: colors.text.secondary }]}>{t('scheduling.unscheduled')}</Text>
      ) : (
        <View style={{ gap: spacing.xs }}>
          {rows.map((row) => {
            const isScheduled = !!row.scheduled_date;
            return (
              <View
                key={row.id}
                style={[
                  styles.rowItem,
                  { borderColor: colors.border.subtle, borderRadius: spacing.sm, padding: spacing.sm, minHeight: sizes.touchTarget },
                ]}
              >
                <Ionicons
                  name={isScheduled ? 'calendar' : 'calendar-outline'}
                  size={18}
                  color={isScheduled ? colors.feedback.success : colors.text.secondary}
                />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text style={[typography.body2, { color: colors.text.primary }]}>
                    {t('sessionInstructions.dayLabel', { day: row.day_number })}
                  </Text>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {isScheduled
                      ? `${row.scheduled_date}${row.scheduled_time ? ' · ' + row.scheduled_time : ''}`
                      : t('scheduling.unassigned')}
                  </Text>
                </View>
                {canSchedule && row.status !== 'COMPLETED' && row.status !== 'CANCELLED' && (
                  <TouchableOpacity
                    onPress={() => setSchedulingRow(row)}
                    accessibilityRole="button"
                    style={{ minHeight: sizes.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm }}
                  >
                    <Text style={[typography.button, { color: colors.primary.default }]}>
                      {isScheduled ? t('scheduling.rescheduleActionLabel') : t('scheduling.scheduleActionLabel')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {schedulingRow && orderQuery.data && (
        <ScheduleRowModal
          visible={!!schedulingRow}
          tenantId={tenantId}
          sheetId={treatmentSheetId}
          row={schedulingRow}
          orderVersion={orderQuery.data.version}
          onClose={() => setSchedulingRow(null)}
          onScheduled={() => {
            setSchedulingRow(null);
            orderQuery.refetch();
          }}
          onVersionConflict={() => {
            setSchedulingRow(null);
            orderQuery.refetch();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {},
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  waitingBanner: {},
  rowItem: { flexDirection: 'row', alignItems: 'center' },
});
