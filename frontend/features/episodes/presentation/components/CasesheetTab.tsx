/**
 * CasesheetTab
 *
 * Phase 4 (R4) · T-F.2a (ADR-R4-05) — read-only summary only. Case Sheet
 * editing has exactly one owner: CaseSheetModule / CasesheetStandaloneScreen
 * (the canonical core). This tab used to embed CasesheetForm and call
 * useUpdateCasesheetMutation directly, making it a second live Case Sheet
 * writer; both are removed. "Edit" now navigates to the canonical route
 * instead of saving in place.
 *
 * The accordion header shows title + status chip + chevron.
 * Open by default.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { CasesheetResponse } from '../../../casesheets/data/models/casesheets.dtos';
import {
  SectionSkeleton,
  useCtaStyles,
  StatusChip,
  cardStyles,
} from './EpisodeWorkspaceShared';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CasesheetTabProps {
  casesheet: CasesheetResponse | undefined;
  casesheetId: string | null;
  hasCasesheet: boolean;
  isLoading: boolean;
  canCreate: boolean;
  onCreateCasesheet: () => void;
  /** Phase 4 (R4) · T-F.2a — navigates to the canonical Case Sheet edit
   * route; this tab no longer saves anything itself. */
  onEditCasesheet: () => void;
}

// ─── CasesheetTab ─────────────────────────────────────────────────────────────

export const CasesheetTab: React.FC<CasesheetTabProps> = ({
  casesheet,
  casesheetId,
  hasCasesheet,
  isLoading,
  canCreate,
  onCreateCasesheet,
  onEditCasesheet,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const { t } = useTranslation();
  const cta = useCtaStyles();

  // Accordion open by default
  const [expanded, setExpanded] = useState(true);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) return <SectionSkeleton />;

  // ── No casesheet ──────────────────────────────────────────────────────────

  if (!hasCasesheet) {
    return (
      <View
        style={[
          cardStyles.emptySection,
          { paddingVertical: spacing.xxl, gap: spacing.md, paddingHorizontal: spacing.md },
        ]}
      >
        <Ionicons name="document-outline" size={40} color={colors.text.disabled} />
        <Text style={[typography.body2, { color: colors.text.secondary, textAlign: 'center', maxWidth: 260 }]}>
          {t('episodeWorkspace.casesheet.empty')}
        </Text>
        {canCreate && (
          <TouchableOpacity
            style={[cta.primaryCta, { backgroundColor: colors.primary.default }]}
            onPress={onCreateCasesheet}
            accessibilityRole="button"
            accessibilityLabel={t('episodeWorkspace.casesheet.addCasesheet')}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary.onPrimary} />
            <Text style={[cta.primaryCtaText, { color: colors.primary.onPrimary }]}>
              {t('episodeWorkspace.casesheet.addCasesheet')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── Casesheet exists — read-only summary ─────────────────────────────────

  const status = casesheet?.status ?? 'DRAFT';
  const statusColor = status === 'DRAFT'
    ? colors.feedback.warning
    : status === 'FINAL'
    ? colors.feedback.info
    : colors.feedback.success;

  const chiefComplaint = casesheet?.chief_complaint?.trim();
  const diagnosis = (casesheet?.final_diagnosis || casesheet?.provisional_diagnosis)?.trim();

  return (
    <View style={{ paddingBottom: spacing.md }}>
      {/* Accordion header */}
      <TouchableOpacity
        style={[
          styles.accordionHeader,
          {
            backgroundColor: colors.background.elevated,
            borderColor: colors.border.subtle,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderBottomWidth: expanded ? 1 : 0,
            borderTopLeftRadius: spacing.sm,
            borderTopRightRadius: spacing.sm,
            borderBottomLeftRadius: expanded ? 0 : spacing.sm,
            borderBottomRightRadius: expanded ? 0 : spacing.sm,
            marginHorizontal: spacing.md,
            marginTop: spacing.md,
          },
        ]}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t('episodeWorkspace.casesheet.title')}
      >
        <Ionicons name="document-text" size={20} color={colors.primary.default} />
        <Text style={[typography.subtitle1, { color: colors.text.primary, flex: 1, marginLeft: spacing.xs }]}>
          {t('episodeWorkspace.casesheet.title')}
        </Text>
        <StatusChip
          label={t(`episodeWorkspace.casesheet.status.${status.toLowerCase()}`) || status}
          color={statusColor}
        />
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.text.secondary}
          style={{ marginLeft: spacing.xs }}
        />
      </TouchableOpacity>

      {/* Accordion body — read-only summary, no embedded editor */}
      {expanded && (
        <View
          style={[
            styles.accordionBody,
            {
              backgroundColor: colors.background.default,
              borderColor: colors.border.subtle,
              borderBottomLeftRadius: spacing.sm,
              borderBottomRightRadius: spacing.sm,
              marginHorizontal: spacing.md,
              padding: spacing.md,
              gap: spacing.sm,
            },
          ]}
        >
          {!casesheet ? (
            <SectionSkeleton />
          ) : (
            <>
              <SummaryField
                label={t('episodeWorkspace.casesheet.chiefComplaint')}
                value={chiefComplaint}
                noContentLabel={t('episodeWorkspace.casesheet.noContent')}
              />
              <SummaryField
                label={t('episodeWorkspace.casesheet.diagnosis')}
                value={diagnosis}
                noContentLabel={t('episodeWorkspace.casesheet.noContent')}
              />
              {canCreate && (
                <TouchableOpacity
                  style={[cta.primaryCta, { backgroundColor: colors.primary.default, alignSelf: 'flex-start', marginTop: spacing.xs }]}
                  onPress={onEditCasesheet}
                  accessibilityRole="button"
                  accessibilityLabel={t('episodeWorkspace.casesheet.editCasesheet')}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary.onPrimary} />
                  <Text style={[cta.primaryCtaText, { color: colors.primary.onPrimary }]}>
                    {t('episodeWorkspace.casesheet.editCasesheet')}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

// ─── SummaryField ─────────────────────────────────────────────────────────────

const SummaryField: React.FC<{ label: string; value?: string; noContentLabel: string }> = ({ label, value, noContentLabel }) => {
  const { colors, spacing, typography } = useClinicTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={[typography.caption, { color: colors.text.secondary, fontWeight: '600' }]}>{label}</Text>
      <Text style={[typography.body2, { color: value ? colors.text.primary : colors.text.disabled }]}>
        {value || noContentLabel}
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  accordionBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    overflow: 'hidden',
  },
});
