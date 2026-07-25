/**
 * WorkflowPills (T-FE-B.1, FR-MOB-2, FR-WFA-2)
 *
 * Renders the Visit Command Center's workflow-stage pill rail, sourced
 * ONLY from the governed Clinical Workflow contract
 * (`useClinicalWorkflowQuery`, T-BE-B.2a). Render-only: assembles no
 * stage list, computes no state, infers no next action, and duplicates
 * no backend resolver rule. Backend `stages[]` is rendered as-is, in the
 * order the backend returns it — this component never reorders,
 * filters (except the one documented `unresolved` exception below), or
 * derives stage applicability.
 *
 * State -> visual token mapping (design.md §3/§4a: "never colour-alone
 * (icon + text)", "no dot-only pills"). Verified against the backend's
 * actual `StageState` enum (app/domain/models/clinical_workflow.py),
 * which carries NINE values, not the six tasks.md's own AC shorthand
 * names (🟢completed 🟡current ⚪pending 🔵waiting-on-role 🔴blocked
 * ⚫n/a). The three unnamed values are handled per the backend's own
 * documented rules, not invented:
 *   - `read_only`, `historical_only` -> mapped to the same muted/neutral
 *     token family as `not_applicable` (closest existing visual family;
 *     a presentation choice, not a new clinical meaning).
 *   - `unresolved` -> the domain module's own docstring is explicit:
 *     "must never render as a patient-facing badge... treat as an error
 *     surface, not a status." This component honors that literally: a
 *     stage in this state is filtered out of the rendered rail, never
 *     invented as a 7th visual state.
 *
 * `waiting_permission` is a permission CODE (e.g. "treatment.schedule"),
 * never a role name (FR-WFA-2 AC2) — design.md/tasks.md are explicit
 * that `episodeWorkspaceConfigByRole` is never the actionability
 * authority. No frontend permission-code -> role-name mapping exists
 * anywhere in this codebase (verified), and inventing one here would be
 * exactly the kind of clinical-meaning derivation FR-COS-2 forbids. This
 * component instead renders the raw permission code the backend sent,
 * through a template string — showing WHO is waited on using the
 * backend's own identifier, never a guessed role label.
 */
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { useClinicalWorkflowQuery } from '../../data/repositories/clinicalWorkflow.repository.impl';
import { WorkflowStage } from '../../data/models/clinicalWorkflow.dtos';

export interface WorkflowPillsProps {
  tenantId: string;
  clientId: string;
  episodeId: string;
  appointmentId: string;
}

type PillTone = 'success' | 'current' | 'neutral' | 'waiting' | 'blocked' | 'muted';

const STATE_TONE: Record<string, PillTone> = {
  completed: 'success',
  current: 'current',
  pending: 'neutral',
  waiting: 'waiting',
  blocked: 'blocked',
  read_only: 'muted',
  historical_only: 'muted',
  not_applicable: 'muted',
  // 'unresolved' intentionally absent: filtered before rendering (see
  // this file's own header docstring).
};

const STATE_ICON: Record<PillTone, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  current: 'ellipse',
  neutral: 'ellipse-outline',
  waiting: 'time-outline',
  blocked: 'alert-circle',
  muted: 'remove-circle-outline',
};

export const WorkflowPills: React.FC<WorkflowPillsProps> = ({
  tenantId,
  clientId,
  episodeId,
  appointmentId,
}) => {
  const { colors, spacing, typography, radii, borderWidths } = useClinicTheme();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useClinicalWorkflowQuery(
    tenantId,
    clientId,
    episodeId,
    appointmentId,
  );

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

  if (isLoading) {
    return (
      <View style={cardStyle} testID="workflow-pills-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>
          {t('visitCommandCenter.workflowPills.title')}
        </Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary.default} />
          <Text style={[typography.body2, { color: colors.text.secondary, marginLeft: spacing.sm }]}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={cardStyle} testID="workflow-pills-section">
        <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>
          {t('visitCommandCenter.workflowPills.title')}
        </Text>
        <Text
          accessibilityRole="text"
          style={[typography.body2, { color: colors.feedback.error }]}
        >
          {t('visitCommandCenter.workflowPills.unavailable')}
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => refetch()}
          style={[typography.button, { color: colors.primary.default, marginTop: spacing.sm }]}
        >
          {t('common.retry')}
        </Text>
      </View>
    );
  }

  // Backend's own documented rule: `unresolved` is an error surface, not
  // a status — never rendered as a patient-facing badge. See header
  // docstring. Every other stage renders exactly as returned, same order.
  const renderableStages = data.stages.filter((stage) => stage.state !== 'unresolved');

  return (
    <View style={cardStyle} testID="workflow-pills-section">
      <Text style={[typography.h6, { color: colors.text.primary, marginBottom: spacing.sm }]}>
        {t('visitCommandCenter.workflowPills.title')}
      </Text>
      {renderableStages.length === 0 ? (
        <Text style={[typography.body2, { color: colors.text.secondary }]}>
          {t('visitCommandCenter.workflowPills.empty')}
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
          accessibilityRole="tablist"
        >
          {renderableStages.map((stage) => (
            <WorkflowPill key={stage.code} stage={stage} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const WorkflowPill: React.FC<{ stage: WorkflowStage }> = ({ stage }) => {
  const { colors, spacing, typography, radii, borderWidths, sizes } = useClinicTheme();
  const { t } = useTranslation();

  const tone: PillTone = STATE_TONE[stage.state] ?? 'neutral';
  const isCurrent = stage.state === 'current';

  const toneColor: Record<PillTone, string> = {
    success: colors.feedback.success,
    current: colors.primary.default,
    neutral: colors.text.secondary,
    waiting: colors.feedback.info,
    blocked: colors.feedback.error,
    muted: colors.text.disabled,
  };

  const toneBackground: Record<PillTone, string> = {
    success: colors.feedback.successLight,
    current: colors.primary.soft,
    neutral: colors.background.muted,
    waiting: colors.feedback.infoLight,
    blocked: colors.feedback.errorLight,
    muted: colors.background.muted,
  };

  const stageLabel = t(`visitCommandCenter.workflowPills.stage.${stage.code}`);
  const stateLabelKey =
    stage.state === 'read_only'
      ? 'readOnly'
      : stage.state === 'historical_only'
      ? 'historicalOnly'
      : stage.state === 'not_applicable'
      ? 'notApplicable'
      : stage.state;
  const stateLabel = t(`visitCommandCenter.workflowPills.state.${stateLabelKey}`);

  const a11yLabel = stage.waiting_permission
    ? `${stageLabel}, ${stateLabel}, ${t('visitCommandCenter.workflowPills.waitingOn', {
        permission: stage.waiting_permission,
      })}`
    : `${stageLabel}, ${stateLabel}`;

  return (
    <View
      testID={`workflow-pill-${stage.code}`}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
      style={[
        styles.pill,
        {
          minHeight: sizes.touchTarget,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radii.pill,
          backgroundColor: toneBackground[tone],
          borderWidth: isCurrent ? borderWidths.default : borderWidths.hairline,
          borderColor: isCurrent ? colors.primary.default : colors.border.subtle,
        },
      ]}
    >
      <Ionicons name={STATE_ICON[tone]} size={sizes.iconSmall} color={toneColor[tone]} />
      <Text style={[typography.caption, { color: toneColor[tone], marginLeft: spacing.xs }]} numberOfLines={1}>
        {stageLabel}
      </Text>
      {stage.mandatory === false && (
        <Text style={[typography.caption, { color: colors.text.tertiary, marginLeft: spacing.xs }]}>
          {t('visitCommandCenter.workflowPills.optional')}
        </Text>
      )}
      {stage.state === 'waiting' && stage.waiting_permission && (
        <Text
          style={[typography.caption, { color: colors.text.tertiary, marginLeft: spacing.xs }]}
          numberOfLines={1}
        >
          {t('visitCommandCenter.workflowPills.waitingOn', { permission: stage.waiting_permission })}
        </Text>
      )}
    </View>
  );
};

// Component-local structural layout only (flex/flexDirection/alignItems/
// justifyContent) — no reusable visual value (colour, spacing, radius,
// border width, icon size, touch target) belongs here; those come from
// `useClinicTheme()` and are applied via the inline style arrays above.
const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
