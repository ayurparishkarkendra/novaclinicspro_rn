import React, { useState } from 'react';
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
import { formatDate, formatTime } from '../../../../core/utils/dateTimeUtils';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  SectionKey,
  SectionProgress,
  useConsultationWorkspace,
} from '../hooks/useConsultationWorkspace';
import { ActiveCaseBanner } from '../components/ActiveCaseBanner';
import { PatientSummarySection } from '../components/ConsultationSections/PatientSummarySection';
import { ChiefComplaintSection } from '../components/ConsultationSections/ChiefComplaintSection';
import { ClinicalNotesSection } from '../components/ConsultationSections/ClinicalNotesSection';
import { AyurvedicAssessmentSection } from '../components/ConsultationSections/AyurvedicAssessmentSection';
import { PrescriptionSection } from '../components/ConsultationSections/PrescriptionSection';
import { TreatmentRecommendationSection } from '../components/ConsultationSections/TreatmentRecommendationSection';

interface ConsultationWorkspaceScreenProps {
  episodeId: string;
  appointmentId: string;
  clientId: string;
}

const LABELS: Record<SectionKey, string> = {
  chiefComplaint: 'Chief Complaint',
  clinicalNotes: 'Clinical Notes',
  ayurvedicAssessment: 'Ayurvedic Assessment',
  prescription: 'Prescription',
  treatmentRecommendation: 'Treatment Recommendation',
};

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
  const workspace = useConsultationWorkspace({ tenantId, episodeId, appointmentId, clientId });
  const visit = workspace.episodeDetails?.visits.find(v => v.appointment_id === appointmentId);
  const active = workspace.sectionConfig.activeSections;

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
      await workspace.flushPendingAutosave();
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

          {renderSection('chiefComplaint', expandedSections, toggleSection, workspace.sectionProgress.chiefComplaint, (
            <ChiefComplaintSection
              value={workspace.casesheetData.basic.chief_complaint ?? ''}
              onChange={(value) => workspace.updateCasesheetField('chief_complaint', value)}
              progress={workspace.sectionProgress.chiefComplaint?.status ?? 'empty'}
              saveStatus={workspace.sectionProgress.chiefComplaint?.saveStatus ?? 'idle'}
            />
          ))}
          {renderSection('clinicalNotes', expandedSections, toggleSection, workspace.sectionProgress.clinicalNotes, (
            <ClinicalNotesSection
              data={workspace.casesheetData.basic}
              onChange={workspace.updateCasesheetField}
              progress={workspace.sectionProgress.clinicalNotes?.status ?? 'empty'}
              saveStatus={workspace.sectionProgress.clinicalNotes?.saveStatus ?? 'idle'}
            />
          ))}
          {active.includes('ayurvedicAssessment') && renderSection(
            'ayurvedicAssessment',
            expandedSections,
            toggleSection,
            workspace.sectionProgress.ayurvedicAssessment,
            <AyurvedicAssessmentSection
              extensions={workspace.casesheetData.extensions}
              onChange={workspace.updateExtensionField}
              progress={workspace.sectionProgress.ayurvedicAssessment?.status ?? 'empty'}
              saveStatus={workspace.sectionProgress.ayurvedicAssessment?.saveStatus ?? 'idle'}
            />,
          )}
          {renderSection('prescription', expandedSections, toggleSection, workspace.sectionProgress.prescription, (
            <PrescriptionSection
              prescriptionData={workspace.prescriptionData}
              isPrescriptionSaving={workspace.isPrescriptionSaving}
              prescriptionSaveError={workspace.prescriptionSaveError}
              prescriptionNotRequired={workspace.prescriptionNotRequired}
              onSave={workspace.savePrescription}
              onMarkNotRequired={workspace.markPrescriptionNotRequired}
              onChange={workspace.onChange}
              progress={workspace.sectionProgress.prescription?.status ?? 'empty'}
            />
          ))}
          {renderSection('treatmentRecommendation', expandedSections, toggleSection, workspace.sectionProgress.treatmentRecommendation, (
            <TreatmentRecommendationSection
              draft={workspace.treatmentRecommendation}
              isSaving={workspace.isTreatmentSaving}
              isSent={workspace.isTreatmentSent}
              saveError={workspace.treatmentSaveError}
              onUpdate={workspace.updateTreatmentField}
              onSendToAdmin={workspace.sendTreatmentToAdmin}
              progress={workspace.sectionProgress.treatmentRecommendation?.status ?? 'empty'}
            />
          ))}

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

function renderSection(
  key: SectionKey,
  expandedSections: Set<SectionKey>,
  toggleSection: (key: SectionKey) => void,
  progress: SectionProgress | undefined,
  content: React.ReactNode,
) {
  if (expandedSections.has(key)) return <View key={key}>{content}</View>;
  return <CollapsedSection key={key} label={LABELS[key]} progress={progress} onPress={() => toggleSection(key)} />;
}

const CollapsedSection: React.FC<{
  label: string;
  progress?: SectionProgress;
  onPress: () => void;
}> = ({ label, progress, onPress }) => {
  const { colors, spacing, typography } = useClinicTheme();
  const icon = progress?.status === 'complete' ? 'checkmark-circle' : progress?.status === 'in_progress' ? 'ellipse' : 'ellipse-outline';
  const saveText = progress?.saveStatus === 'saving' ? 'Saving...' : progress?.saveStatus === 'saved' ? '✓ Saved' : progress?.saveStatus === 'error' ? '⚠ Save failed' : '';
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.collapsed,
        {
          backgroundColor: colors.surface.default,
          borderColor: colors.border.default,
          borderRadius: spacing.sm,
          padding: spacing.md,
          gap: spacing.sm,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.primary.default} />
      <Text style={[typography.h6, styles.collapsedText, { color: colors.text.primary }]}>{label}</Text>
      {!!saveText && <Text style={[typography.caption, { color: colors.text.secondary }]}>{saveText}</Text>}
      <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  iconButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  submit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  collapsed: { minHeight: 64, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  collapsedText: { flex: 1 },
});
