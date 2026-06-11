/**
 * CasesheetTab
 *
 * Embeds CasesheetForm directly inline:
 *  - DRAFT status → editable form with Save button (saves in-place, no navigation)
 *  - FINAL / SIGNED → read-only form (isEditable=false)
 *  - No casesheet → empty state with "Add Casesheet" button
 *
 * The accordion header shows title + status chip + chevron.
 * Open by default.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { CasesheetResponse } from '../../../casesheets/data/models/casesheets.dtos';
import { useUpdateCasesheetMutation } from '../../../casesheets/data/repositories/casesheets.repository.impl';
import { CasesheetForm, CasesheetFormData } from '../../../casesheets/presentation/components/CasesheetForm';
import {
  SectionSkeleton,
  useCtaStyles,
  StatusChip,
  cardStyles,
} from './EpisodeWorkspaceShared';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CasesheetTabProps {
  casesheet: CasesheetResponse | undefined;
  casesheetId: string | null;
  hasCasesheet: boolean;
  isLoading: boolean;
  canCreate: boolean;
  onCreateCasesheet: () => void;
  onCasesheetSaved?: () => void;
}

// ─── CasesheetTab ─────────────────────────────────────────────────────────────

export const CasesheetTab: React.FC<CasesheetTabProps> = ({
  casesheet,
  casesheetId,
  hasCasesheet,
  isLoading,
  canCreate,
  onCreateCasesheet,
  onCasesheetSaved,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const { t } = useTranslation();
  const cta = useCtaStyles();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId ?? '';

  // Accordion open by default
  const [expanded, setExpanded] = useState(true);

  const updateMutation = useUpdateCasesheetMutation(tenantId, casesheetId ?? '');

  const isDraft = casesheet?.status === 'DRAFT';
  const isEditable = isDraft;

  const handleSave = useCallback(async (data: CasesheetFormData) => {
    try {
      await updateMutation.mutateAsync({ data_json: data });
      Alert.alert('Saved', 'Casesheet updated successfully.');
      onCasesheetSaved?.();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.detail ?? err?.message ?? 'Failed to save.';
      Alert.alert('Error', String(msg));
    }
  }, [updateMutation, onCasesheetSaved]);

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

  // ── Casesheet exists ──────────────────────────────────────────────────────

  const status = casesheet?.status ?? 'DRAFT';
  const statusColor = status === 'DRAFT'
    ? colors.feedback.warning
    : status === 'FINAL'
    ? colors.feedback.info
    : colors.feedback.success;

  // Build initialData for CasesheetForm from the loaded casesheet
  const initialData: CasesheetFormData | undefined = casesheet
    ? {
        basic: {
          chief_complaint: casesheet.chief_complaint ?? '',
          provisional_diagnosis: casesheet.provisional_diagnosis ?? '',
          final_diagnosis: casesheet.final_diagnosis ?? '',
          ...casesheet.data_json?.basic,
        },
        extensions: casesheet.data_json?.extensions ?? [],
      }
    : undefined;

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

      {/* Accordion body — CasesheetForm */}
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
            },
          ]}
        >
          {!casesheet ? (
            <SectionSkeleton />
          ) : (
            <CasesheetForm
              key={casesheetId ?? 'cs'}
              initialData={initialData}
              onSubmit={handleSave}
              onCancel={() => setExpanded(false)}
              isLoading={updateMutation.isPending}
              isEditable={isEditable}
              submitLabel={t('episodeWorkspace.casesheet.save')}
            />
          )}
        </View>
      )}
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
