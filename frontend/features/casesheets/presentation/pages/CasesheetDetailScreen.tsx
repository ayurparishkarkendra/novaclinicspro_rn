/**
 * Casesheet Detail Screen
 * Displays detailed view of a single casesheet
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useCasesheetDetailQuery,
  useTransitionCasesheetStatusMutation,
  usePrintCasesheetMutation,
  useArchiveCasesheetMutation,
  CasesheetStatus,
  formatDateTime,
  isEditable,
} from '../../index';
import { CasesheetStatusBadge } from '../components/CasesheetStatusBadge';
import { CasesheetActions } from '../components/CasesheetActions';
import { EmptyCasesheetsState } from '../components/EmptyCasesheetsState';

export const CasesheetDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string; casesheetId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const clientId = params.clientId || '';
  const casesheetId = params.casesheetId || '';

  const {
    data: casesheet,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCasesheetDetailQuery(tenantId, casesheetId);

  const transitionMutation = useTransitionCasesheetStatusMutation(tenantId, casesheetId);
  const printMutation = usePrintCasesheetMutation(tenantId, casesheetId);
  const archiveMutation = useArchiveCasesheetMutation(tenantId, casesheetId, clientId);

  const handleTransition = useCallback(async (newStatus: CasesheetStatus) => {
    try {
      await transitionMutation.mutateAsync({ status: newStatus });
      Alert.alert('Success', `Casesheet ${newStatus.toLowerCase()} successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update casesheet status.');
    }
  }, [transitionMutation]);

  const handlePrint = useCallback(async () => {
    try {
      const result = await printMutation.mutateAsync();
      // In a real app, this would open the print content
      Alert.alert('Print', 'Print content ready. In production, this would open a print dialog.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to print casesheet.');
    }
  }, [printMutation]);

  const handleArchive = useCallback(async () => {
    try {
      await archiveMutation.mutateAsync();
      Alert.alert('Success', 'Casesheet archived successfully.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to archive casesheet.');
    }
  }, [archiveMutation, router]);

  const handleEdit = useCallback(() => {
    router.push({
      pathname: '/clinic-admin/clients/[clientId]/casesheets/[casesheetId]/edit',
      params: { clientId, casesheetId },
    });
  }, [router, clientId, casesheetId]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Casesheet</Text>
        <Text style={styles.headerSubtitle}>v{casesheet?.document_version || 1}</Text>
      </View>
      {casesheet && (
        <CasesheetStatusBadge status={casesheet.status} size="medium" />
      )}
    </View>
  );

  const renderSection = (title: string, content: string | null | undefined, icon: keyof typeof Ionicons.glyphMap) => {
    if (!content) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon} size={18} color={colors.primary.main} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={styles.sectionContent}>{content}</Text>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading casesheet...</Text>
        </View>
      );
    }

    if (isError || !casesheet) {
      return (
        <EmptyCasesheetsState
          variant="error"
          title="Unable to Load Casesheet"
          message={
            error?.message?.includes('401')
              ? 'Authentication failed. Please try logging in again.'
              : 'Could not load this casesheet. Please try again.'
          }
          actionLabel="Retry"
          onActionPress={() => refetch()}
        />
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Document Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>Recorded:</Text>
            <Text style={styles.infoValue}>{formatDateTime(casesheet.recorded_at)}</Text>
          </View>
          {casesheet.signed_at && (
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success.main} />
              <Text style={styles.infoLabel}>Signed:</Text>
              <Text style={[styles.infoValue, { color: colors.success.main }]}>
                {formatDateTime(casesheet.signed_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Clinical Sections */}
        {renderSection('Chief Complaint', casesheet.chief_complaint, 'alert-circle-outline')}
        {renderSection('Provisional Diagnosis', casesheet.provisional_diagnosis, 'medical-outline')}
        {renderSection('Final Diagnosis', casesheet.final_diagnosis, 'checkmark-circle-outline')}

        {/* SOAP Data (if available in data_json) */}
        {casesheet.data_json && (
          <View style={styles.soapContainer}>
            <Text style={styles.soapTitle}>Clinical Notes</Text>
            {casesheet.data_json.subjective && renderSection('Subjective', casesheet.data_json.subjective, 'person-outline')}
            {casesheet.data_json.objective && renderSection('Objective', casesheet.data_json.objective, 'eye-outline')}
            {casesheet.data_json.assessment && renderSection('Assessment', casesheet.data_json.assessment, 'analytics-outline')}
            {casesheet.data_json.plan && renderSection('Plan', casesheet.data_json.plan, 'list-outline')}
          </View>
        )}

        {/* Treatment Sheets Section */}
        <View style={styles.treatmentSheetsSection}>
          <View style={styles.treatmentSheetsHeader}>
            <View style={styles.treatmentSheetsIcon}>
              <Ionicons name="fitness" size={24} color={colors.success.main} />
            </View>
            <View style={styles.treatmentSheetsInfo}>
              <Text style={styles.treatmentSheetsTitle}>Treatment Sheets</Text>
              <Text style={styles.treatmentSheetsSubtitle}>
                Therapy plans and progress tracking
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createTreatmentSheetButton}
            onPress={() => {
              Alert.alert(
                'Create Treatment Sheet',
                'Create a new treatment sheet from this casesheet?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Create',
                    onPress: () => {
                      // Navigate to create treatment sheet
                      // The actual creation would require specifying duration_days
                      Alert.alert(
                        'Coming Soon',
                        'Treatment sheet creation will be available after selecting treatment duration.'
                      );
                    },
                  },
                ]
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Create treatment sheet"
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.success.main} />
            <Text style={styles.createTreatmentSheetText}>Create Treatment Sheet</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Actions</Text>
          <CasesheetActions
            status={casesheet.status}
            onTransition={handleTransition}
            onPrint={handlePrint}
            onArchive={handleArchive}
            onEdit={isEditable(casesheet.status) ? handleEdit : undefined}
            isLoading={
              transitionMutation.isPending ||
              printMutation.isPending ||
              archiveMutation.isPending
            }
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  infoValue: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.body1,
    color: colors.primary.main,
    fontWeight: '600',
  },
  sectionContent: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 22,
  },
  soapContainer: {
    marginTop: spacing.sm,
  },
  soapTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionsTitle: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
});

export default CasesheetDetailScreen;
