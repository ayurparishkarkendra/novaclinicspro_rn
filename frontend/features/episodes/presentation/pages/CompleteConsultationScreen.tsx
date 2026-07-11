import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useFeatures, isAyurvedaClinic } from '../../../../core/hooks/useFeatures';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { transitionCasesheetStatusApi } from '../../../casesheets/data/datasources/casesheets.api';
import { EpisodeWorkspaceData, useEpisodeWorkspaceData } from '../hooks/useEpisodeWorkspaceData';

interface CompleteConsultationScreenProps {
  episodeId: string;
  appointmentId: string;
  clientId: string;
}

export interface ConsultationSummary {
  notes: SummaryItem;
  prescription: SummaryItem;
  treatmentRecommendation: SummaryItem;
  ayurvedicAssessment?: SummaryItem;
  casesheetId: string | null;
}

interface SummaryItem {
  title: string;
  status: string;
  detail: string;
}

export function deriveSummary(
  data: EpisodeWorkspaceData,
  appointmentId: string,
  includeAyurveda: boolean,
): ConsultationSummary {
  const visit = data.visits.find(item => item.appointment_id === appointmentId);
  const casesheetStatus = data.casesheet?.status ?? data.episodeDetails?.documents.casesheet.status ?? null;
  const prescriptionStatus = visit?.prescription?.status ?? null;
  // The treatment recommendation's "sent" state is the ORDER lifecycle `state`
  // (DRAFT → ORDERED → SCHEDULED …), NOT the document `status` (which remains
  // DRAFT so the doctor can keep editing). Reading `status` here showed "DRAFT"
  // even after Send to Admin — derive from the latest persisted `state` instead.
  const treatmentState = (data.treatmentSheet as any)?.state ?? null;
  const treatmentSent = treatmentState != null && treatmentState !== 'DRAFT';
  const hasAyurveda = Boolean(
    data.casesheet?.data_json?.extensions?.some((ext: any) =>
      ['nadi_pariksha', 'prakriti'].includes(ext.template_id) &&
      Object.values(ext.data || {}).some(value => String(value ?? '').trim()),
    ),
  );

  return {
    casesheetId: data.casesheetId,
    notes: {
      title: 'Consultation Notes',
      status: casesheetStatus || 'Not saved',
      detail: data.hasCasesheet ? 'Notes are available for review.' : 'Consultation notes have not been saved.',
    },
    prescription: {
      title: 'Prescription',
      status: prescriptionStatus || 'Not created',
      detail: prescriptionStatus ? 'Prescription is linked to this visit.' : 'No prescription has been saved for this visit.',
    },
    treatmentRecommendation: {
      title: 'Treatment Recommendation',
      status: treatmentSent ? 'Sent to Admin' : 'Not sent',
      detail: treatmentSent
        ? 'Recommendation sent to Admin for scheduling.'
        : 'No treatment recommendation was sent.',
    },
    ...(includeAyurveda
      ? {
          ayurvedicAssessment: {
            title: 'Ayurvedic Assessment',
            status: hasAyurveda ? 'Recorded' : 'Not recorded',
            detail: hasAyurveda ? 'Nadi or Prakriti observations were captured.' : 'No Ayurveda assessment data was captured.',
          },
        }
      : {}),
  };
}

export const CompleteConsultationScreen: React.FC<CompleteConsultationScreenProps> = ({
  episodeId,
  appointmentId,
  clientId,
}) => {
  const router = useRouter();
  const { currentUser, selectedClinicId } = useAuth();
  const tenantId = selectedClinicId || currentUser?.tenantId || '';
  const features = useFeatures();
  const includeAyurveda = isAyurvedaClinic(features);
  const { colors, spacing, typography } = useClinicTheme();
  const data = useEpisodeWorkspaceData(tenantId, episodeId, clientId);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summary = deriveSummary(data, appointmentId, includeAyurveda);
  const isLoading = data.isEpisodeLoading || data.isCasesheetLoading || data.isTreatmentSheetLoading;

  const complete = async () => {
    if (!summary.casesheetId) {
      setError('Consultation notes must be saved before completing.');
      return;
    }
    setError(null);
    setIsCompleting(true);
    try {
      await transitionCasesheetStatusApi(tenantId, summary.casesheetId, { status: 'FINAL' });
      Alert.alert('Consultation completed. Treatment recommendation sent to Admin.');
      router.replace('/doctor' as any);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? 'Failed to complete consultation.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.default }]}>
      <View style={[styles.header, { padding: spacing.md, borderBottomColor: colors.border.subtle }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[typography.h5, { color: colors.text.primary }]}>Review & Complete</Text>
        <View style={styles.iconButton} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary.default} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
            <SummaryCard item={summary.notes} />
            <SummaryCard item={summary.prescription} />
            <SummaryCard item={summary.treatmentRecommendation} />
            {summary.ayurvedicAssessment && <SummaryCard item={summary.ayurvedicAssessment} />}
            {!!error && (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: colors.feedback.errorLight, padding: spacing.md, borderRadius: spacing.sm },
                ]}
              >
                <Text style={[typography.body2, { color: colors.feedback.error }]}>{error}</Text>
              </View>
            )}
          </ScrollView>
          <View style={[styles.footer, { padding: spacing.md, borderTopColor: colors.border.subtle }]}>
            <TouchableOpacity
              onPress={complete}
              disabled={isCompleting}
              accessibilityRole="button"
              style={[
                styles.completeButton,
                { backgroundColor: colors.primary.default, borderRadius: spacing.sm, padding: spacing.md, gap: spacing.xs },
              ]}
            >
              {isCompleting && <ActivityIndicator size="small" color={colors.primary.onPrimary} />}
              <Text style={[typography.button, { color: colors.primary.onPrimary }]}>Complete Consultation</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const SummaryCard: React.FC<{ item: SummaryItem }> = ({ item }) => {
  const { colors, spacing, typography } = useClinicTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface.default,
          borderColor: colors.border.default,
          borderRadius: spacing.sm,
          padding: spacing.md,
          gap: spacing.xs,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[typography.h6, styles.cardTitle, { color: colors.text.primary }]}>{item.title}</Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>{item.status}</Text>
      </View>
      <Text style={[typography.body2, { color: colors.text.secondary }]}>{item.detail}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1 },
  errorBox: {},
  footer: { borderTopWidth: 1 },
  completeButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
