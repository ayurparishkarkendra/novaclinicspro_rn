import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { formatTime } from '../../../../core/utils/dateTimeUtils';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { SectionKey, useConsultationWorkspace } from '../hooks/useConsultationWorkspace';
import { ActiveCaseBanner } from '../components/ActiveCaseBanner';
import { PatientSummarySection } from '../components/ConsultationSections/PatientSummarySection';
import { CaseSheetModule, CaseSheetModuleHandle } from '../components/ConsultationSections/CaseSheetModule';
import { PrescriptionModule } from '../components/ConsultationSections/PrescriptionModule';
import { TreatmentRecommendationModule } from '../components/ConsultationSections/TreatmentRecommendationModule';
import { ClinicalServicesModule } from '../components/ConsultationSections/ClinicalServicesModule';

interface ConsultationWorkspaceScreenProps {
  episodeId: string;
  appointmentId: string;
  clientId: string;
}

export const ConsultationWorkspaceScreen: React.FC<ConsultationWorkspaceScreenProps> = ({
  episodeId,
  appointmentId,
  clientId,
}) => {
  const router = useRouter();
  const { currentUser, selectedClinicId } = useAuth();
  const tenantId = selectedClinicId || currentUser?.tenantId || '';
  const { colors, spacing, typography } = useClinicTheme();
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['chiefComplaint']));
  const [submitError, setSubmitError] = useState<string | null>(null);
  // R3A · T-B.1: Case Sheet's own state now lives in CaseSheetModule. This
  // ref bridges two things back to the screen: (1) "Save & Submit" flushing
  // its pending autosave before navigating away (2) sendTreatmentToAdmin's
  // existing dependency on a casesheet existing first (transitional,
  // user-confirmed — a real backend constraint, not something T-B.3 retires;
  // it only relocates from "hook input" to a prop passed directly to
  // TreatmentRecommendationModule, since sendTreatmentToAdmin now lives
  // there instead of in the hook).
  const caseSheetModuleRef = useRef<CaseSheetModuleHandle>(null);
  const ensureCasesheetExists = () => caseSheetModuleRef.current?.ensureCasesheetExists() ?? Promise.resolve(null);
  const workspace = useConsultationWorkspace({ tenantId, episodeId, appointmentId, clientId });
  const visit = workspace.episodeDetails?.visits.find(v => v.appointment_id === appointmentId);

  const toggleSection = (key: SectionKey) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveAndSubmit = async () => {
    setSubmitError(null);
    try {
      await caseSheetModuleRef.current?.flushPendingAutosave();
      router.push(
        `/clinic-admin/episodes/${episodeId}/complete-consultation?appointmentId=${appointmentId}&clientId=${clientId}` as any,
      );
    } catch {
      setSubmitError('Failed to save your notes — please retry.');
    }
  };

  if (workspace.isEpisodeLoading || !workspace.episodeDetails) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background.default }]}>
        <ActivityIndicator color={colors.primary.default} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.default }]}>
      <View style={[styles.header, { padding: spacing.md, borderBottomColor: colors.border.subtle }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[typography.h6, styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {workspace.episodeDetails.episode.title}
        </Text>
        <TouchableOpacity onPress={saveAndSubmit} accessibilityRole="button" style={styles.iconButton}>
          <Ionicons name="checkmark" size={24} color={colors.primary.default} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          // Without this, ScrollView's default "never" swallows the FIRST tap on
          // any touchable (e.g. a Recommended Therapy suggestion) while a text
          // field is focused — it only dismisses the keyboard and never calls
          // onPress, so taps on the therapy suggestion list appeared to do
          // nothing. "handled" lets the tap both register on the child AND
          // dismiss the keyboard via the TextInput's own blur.
          keyboardShouldPersistTaps="handled"
        >
          <ActiveCaseBanner
            episodeTitle={workspace.episodeDetails.episode.title}
            visitsCount={workspace.episodeDetails.episode.visits_count}
            onChangeCase={() => router.push(`/clinic-admin/appointments/${appointmentId}/link-episode?clientId=${clientId}` as any)}
          />
          <PatientSummarySection
            episodeDetails={workspace.episodeDetails}
            appointmentDate={visit?.appointment_date ?? ''}
            appointmentTime={visit ? formatTime(`${visit.appointment_date}T${visit.appointment_time}`) : ''}
            appointmentStatus={visit?.appointment_status ?? ''}
            clientName={workspace.clientName}
          />

          <CaseSheetModule
            ref={caseSheetModuleRef}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
          />

          <PrescriptionModule
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
          />

          <TreatmentRecommendationModule
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            ensureCasesheetExists={ensureCasesheetExists}
          />

          <ClinicalServicesModule
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
          />

          {!!submitError && (
            <Text style={[typography.body2, { color: colors.feedback.error }]}>{submitError}</Text>
          )}
          <TouchableOpacity
            onPress={saveAndSubmit}
            accessibilityRole="button"
            style={[styles.submit, { backgroundColor: colors.primary.default, borderRadius: spacing.sm, padding: spacing.md }]}
          >
            <Text style={[typography.button, { color: colors.primary.onPrimary }]}>Save & Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  iconButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  submit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
