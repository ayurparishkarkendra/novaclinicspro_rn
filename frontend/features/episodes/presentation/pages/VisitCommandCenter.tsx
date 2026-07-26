/**
 * VisitCommandCenter (T-FE-A.1, FR-COS-1, FR-VCC-1)
 *
 * The flag-gated shell for the Clinical Operating System, rendered on the
 * EXISTING Episode workspace route (`app/clinic-admin/episodes/[episodeId]/
 * workspace.tsx`) when `cos_v1` is on — no new route (FR-COS-1 AC1). This
 * shell is structural scaffolding: a header/container, a loading state,
 * and an explicit invalid-context state (wireframe W30), now joined by
 * the "Why today" region (T-FE-C.1, FR-VCC-2 — see `WhyTodaySection.tsx`),
 * the "What changed" region (T-FE-C.2, FR-VCC-3 — see
 * `WhatChangedSection.tsx`), the "Before you act" region (T-FE-C.3,
 * FR-VCC-4/FR-PS-1 — see `BeforeYouActSection.tsx`), the workflow pill
 * rail (T-FE-B.1, FR-MOB-2/FR-WFA-2 — see `WorkflowPills.tsx`), and the
 * backend-recommended next action + deviation menu (T-FE-B.2, FR-REC-2/
 * FR-COS-2, Decision 7 — see `NextActionBar.tsx`), in design.md §3's own
 * region order (`BriefingRegions → WorkflowPills → NextActionBar →
 * active-stage body`), and, in the active-stage body, the existing
 * `CaseSheetModule` (T-FE-E.1a, FR-CS-1).
 *
 * T-FE-E.1a composes `CaseSheetModule` UNCHANGED -- same component R3A ·
 * T-B.1 already built and `ConsultationWorkspaceScreen.tsx` already
 * hosts, reading tenant/episode/patient/visit identity from the SAME
 * `WorkspaceProvider` this shell already wraps everything in (verified:
 * `CaseSheetModule` takes only `{ expandedSections, onToggleSection }` as
 * props -- no identity threading needed). Also wraps in
 * `WorkspaceSaveStatusProvider` -- `CaseSheetModule` calls
 * `useReportSaveStatus()` unconditionally and throws without an
 * ancestor provider (verified in `WorkspaceSaveStatusContext.tsx`); this
 * mirrors exactly what `ClinicalWorkspace.tsx` already does for the same
 * module, not a new pattern.
 *
 * T-FE-C.4 (FR-VCC-1) composes `ClinicalTimeline` UNCHANGED after
 * `CaseSheetModule` -- same episode-scoping-via-context pattern (no props),
 * now virtualized (`FlatList`, bounded `maxHeight`) so it embeds safely
 * inside this shell's single outer `ScrollView` (see `ClinicalTimeline.tsx`
 * for the nested-VirtualizedList reasoning).
 *
 * T-FE-E.2 (FR-RX-1, FR-TR-1, FR-TS-1/2/3, FR-SCH-1): composes
 * `PrescriptionModule` and `TreatmentRecommendationModule` UNCHANGED --
 * same components T-0.2/T-0.4 already remediated, same
 * `{expandedSections, onToggleSection}` props `CaseSheetModule` already
 * takes. `TreatmentRecommendationModule` additionally needs
 * `ensureCasesheetExists` (the T-B.1 transitional bridge) -- this shell
 * now holds a ref to `CaseSheetModule` (previously ref-less) purely to
 * relay that one method, mirroring the exact pattern
 * `ConsultationWorkspaceScreen.tsx` already uses between the same two
 * sibling modules. Also composes two NEW modules built for this task --
 * `SessionInstructionsModule` (doctor content on stable Sessions, OCC
 * adoption) and `SchedulingModule` (current scheduled/unscheduled state +
 * permission-gated schedule writes) -- since no existing frontend module
 * owned either. Treatment Plan composition is explicitly NOT included:
 * Engineering Truth (this task's own pre-implementation report) found
 * `TenantTreatmentPlan` has zero public HTTP contract (service/repository
 * complete, no router) -- the placeholder below renders that gap
 * honestly rather than fabricating a Plan view from Session data
 * (forbidden by this task's own frozen AC, FR-TP-1 AC15). The same gap
 * ALSO blocks the read-only scheduling-proposal sub-capability inside
 * `SchedulingModule`: `resolve_scheduling_proposal` (T-BE-E.2a) requires a
 * `plan_id` path parameter that nothing in the current public contract
 * exposes a way to obtain -- `SchedulingModule` reports this honestly
 * rather than guessing or fabricating a proposal (see that file's own
 * docstring for full detail).
 *
 * Reuses `WorkspaceProvider` (T-A.1, `ClinicalWorkspaceContext.tsx`)
 * exactly as `ClinicalWorkspace.tsx` already does for the consultation
 * route — same props, same context, tenant/patient/episode/visit scoping
 * not weakened. Unlike that route, `workspace.tsx` does not currently
 * carry an `appointmentId` (verified — its query params are
 * `mode`/`clientId`/`initialTab` only), so this shell treats a missing or
 * unresolvable `appointmentId` as invalid context (W30: "No active
 * appointment for this episode"), never a guessed Visit.
 */
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  WorkspaceProvider,
  useEpisodeContext,
  usePatientContext,
  useVisitContext,
} from '../context/ClinicalWorkspaceContext';
import { WorkspaceSaveStatusProvider } from '../context/WorkspaceSaveStatusContext';
import { WhyTodaySection } from '../components/WhyTodaySection';
import { WhatChangedSection } from '../components/WhatChangedSection';
import { BeforeYouActSection } from '../components/BeforeYouActSection';
import { WorkflowPills } from '../components/WorkflowPills';
import { NextActionBar } from '../components/NextActionBar';
import { CaseSheetModule, CaseSheetModuleHandle } from '../components/ConsultationSections/CaseSheetModule';
import { PrescriptionModule } from '../components/ConsultationSections/PrescriptionModule';
import { TreatmentRecommendationModule } from '../components/ConsultationSections/TreatmentRecommendationModule';
import { SessionInstructionsModule } from '../components/ConsultationSections/SessionInstructionsModule';
import { SchedulingModule } from '../components/ConsultationSections/SchedulingModule';
import { ClinicalTimeline } from '../components/ClinicalTimeline';
import { SectionKey } from '../hooks/useConsultationWorkspace';

export interface VisitCommandCenterProps {
  episodeId: string;
  appointmentId?: string;
  clientId: string;
}

export const VisitCommandCenter: React.FC<VisitCommandCenterProps> = ({
  episodeId,
  appointmentId,
  clientId,
}) => {
  const router = useRouter();
  const { currentUser, selectedClinicId } = useAuth();
  const tenantId = selectedClinicId || currentUser?.tenantId || '';

  // No appointmentId (or tenant/episode/client) available at this route yet
  // — never guess a Visit. Safe, explicit invalid-context state (W30).
  if (!tenantId || !episodeId || !appointmentId || !clientId) {
    return <InvalidWorkspaceState onBack={() => router.back()} />;
  }

  return (
    <WorkspaceProvider tenantId={tenantId} episodeId={episodeId} appointmentId={appointmentId} clientId={clientId}>
      <WorkspaceSaveStatusProvider>
        <VisitCommandCenterShell />
      </WorkspaceSaveStatusProvider>
    </WorkspaceProvider>
  );
};

const VisitCommandCenterShell: React.FC = () => {
  const router = useRouter();
  const { colors, spacing, typography, radii, borderWidths, sizes } = useClinicTheme();
  const { t } = useTranslation();
  const patient = usePatientContext();
  const episode = useEpisodeContext();
  const visit = useVisitContext();

  // T-FE-E.1a: CaseSheetModule's own local expand/collapse state,
  // mirroring ConsultationWorkspaceScreen.tsx's identical toggleSection
  // pattern exactly -- CaseSheetModule itself owns all Case Sheet data/
  // save state; this shell owns only which sections are expanded.
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['chiefComplaint']),
  );
  const toggleSection = (key: SectionKey) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // T-FE-E.2: relay CaseSheetModule's own ensureCasesheetExists to
  // TreatmentRecommendationModule -- same transitional-bridge pattern
  // ConsultationWorkspaceScreen.tsx already uses between these two
  // sibling modules (see file header).
  const caseSheetRef = useRef<CaseSheetModuleHandle>(null);
  const ensureCasesheetExists = useCallback(
    () => caseSheetRef.current?.ensureCasesheetExists() ?? Promise.resolve(null),
    [],
  );

  if (episode.isEpisodeLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.default }]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary.default} />
        </View>
      </SafeAreaView>
    );
  }

  // Episode failed to load, or the appointment-scoped Visit lookup
  // (WorkspaceProvider's own, mirrored from ConsultationWorkspaceScreen's
  // existing mechanism) returned undefined — never render a blank or
  // wrong-record workspace (W30).
  if (episode.isEpisodeError || !episode.episodeDetails || !visit.visit) {
    return <InvalidWorkspaceState onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.default }]}>
      <View
        style={[
          styles.header,
          { padding: spacing.md, borderBottomColor: colors.border.subtle, borderBottomWidth: borderWidths.hairline },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          style={[styles.iconButton, { minHeight: sizes.touchTarget, minWidth: sizes.touchTarget }]}
        >
          <Ionicons name="arrow-back" size={sizes.iconMedium} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[typography.h5, { color: colors.text.primary }]}>{t('visitCommandCenter.title')}</Text>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>{patient.clientName}</Text>
        </View>
        <View style={[styles.iconButton, { minHeight: sizes.touchTarget, minWidth: sizes.touchTarget }]} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <WhyTodaySection
          tenantId={episode.tenantId}
          clientId={patient.clientId}
          episodeId={episode.episodeId}
          appointmentId={visit.appointmentId}
        />
        <WhatChangedSection
          tenantId={episode.tenantId}
          clientId={patient.clientId}
          episodeId={episode.episodeId}
          appointmentId={visit.appointmentId}
        />
        <BeforeYouActSection
          tenantId={episode.tenantId}
          clientId={patient.clientId}
          episodeId={episode.episodeId}
          appointmentId={visit.appointmentId}
        />
        <WorkflowPills
          tenantId={episode.tenantId}
          clientId={patient.clientId}
          episodeId={episode.episodeId}
          appointmentId={visit.appointmentId}
        />
        <NextActionBar
          tenantId={episode.tenantId}
          clientId={patient.clientId}
          episodeId={episode.episodeId}
          appointmentId={visit.appointmentId}
        />
        <CaseSheetModule ref={caseSheetRef} expandedSections={expandedSections} onToggleSection={toggleSection} />
        <PrescriptionModule expandedSections={expandedSections} onToggleSection={toggleSection} />
        <TreatmentRecommendationModule
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          ensureCasesheetExists={ensureCasesheetExists}
        />
        <SessionInstructionsModule />
        <SchedulingModule />
        {/* T-FE-C.4 (FR-VCC-1): reuses ClinicalTimeline unchanged -- no
            props needed, it reads tenant/episode/patient/visit identity
            from the same WorkspaceProvider this shell already wraps
            everything in, so it is automatically scoped to this Episode
            (no cross-episode leak), same pattern as CaseSheetModule
            (T-FE-E.1a). */}
        <ClinicalTimeline />
        {/* T-FE-E.2: Treatment Plan composition is explicitly out of
            scope this task -- Engineering Truth found TenantTreatmentPlan
            has no public HTTP contract (see VisitCommandCenter's own
            file header). This renders that gap honestly, never a
            fabricated Plan view reconstructed from Session/schedule data
            (forbidden by this task's own frozen AC, FR-TP-1 AC15). */}
        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: colors.surface.default,
              borderColor: colors.border.default,
              borderWidth: borderWidths.default,
              borderRadius: radii.medium,
              padding: spacing.lg,
            },
          ]}
        >
          <Text style={[typography.body2, { color: colors.text.secondary }]}>
            {t('visitCommandCenter.treatmentPlanUnavailable')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InvalidWorkspaceState: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors, spacing, typography } = useClinicTheme();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.default }]}>
      <View style={[styles.center, { padding: spacing.md, gap: spacing.md }]}>
        <Text style={[typography.h6, { color: colors.text.primary }]}>
          {t('visitCommandCenter.invalidContext.title')}
        </Text>
        <Text style={[typography.body2, { color: colors.text.secondary, textAlign: 'center' }]}>
          {t('visitCommandCenter.invalidContext.message')}
        </Text>
        <TouchableOpacity onPress={onBack} accessibilityRole="button">
          <Text style={[typography.button, { color: colors.primary.default }]}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Component-local structural layout only (flex/flexDirection/alignItems/
// justifyContent) — no reusable visual value (colour, spacing, radius,
// border width, icon size, touch target) belongs here; those come from
// `useClinicTheme()` and are applied via the inline style arrays above.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitles: { flex: 1, alignItems: 'center' },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { alignItems: 'center' },
});
