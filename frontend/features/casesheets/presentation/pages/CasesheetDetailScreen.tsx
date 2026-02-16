/**
 * Casesheet Detail Screen
 * Displays detailed view of a single casesheet with:
 * - Header/Footer branding
 * - Create Treatment Sheet flow
 * - Extensions display
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
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
import { useCreateTreatmentSheetMutation } from '../../../treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { CasesheetStatusBadge } from '../components/CasesheetStatusBadge';
import { CasesheetActions } from '../components/CasesheetActions';
import { EmptyCasesheetsState } from '../components/EmptyCasesheetsState';

const DURATION_OPTIONS = [
  { days: 7, label: '7 Days' },
  { days: 14, label: '14 Days' },
  { days: 21, label: '21 Days' },
  { days: 30, label: '30 Days' },
  { days: 45, label: '45 Days' },
  { days: 60, label: '60 Days' },
];

export const CasesheetDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string; casesheetId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const clientId = params.clientId || '';
  const casesheetId = params.casesheetId || '';

  // Treatment Sheet Creation Modal State
  const [showCreateTSModal, setShowCreateTSModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(14);
  const [customDuration, setCustomDuration] = useState('');

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
  const createTSMutation = useCreateTreatmentSheetMutation(casesheetId);

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
      Alert.alert('Print', 'Print content ready. Opening print preview...');
      // In production, this would open a WebView with the HTML content
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
      pathname: '/clinic-admin/clients/[clientId]/casesheets/[casesheetId]/edit' as any,
      params: { clientId, casesheetId },
    });
  }, [router, clientId, casesheetId]);

  const handleCreateTreatmentSheet = useCallback(async () => {
    const duration = customDuration ? parseInt(customDuration, 10) : selectedDuration;
    if (!duration || duration < 1) {
      Alert.alert('Error', 'Please select a valid duration.');
      return;
    }

    try {
      const result = await createTSMutation.mutateAsync({ duration_days: duration });
      setShowCreateTSModal(false);
      Alert.alert(
        'Success',
        'Treatment sheet created successfully.',
        [
          {
            text: 'View Treatment Sheet',
            onPress: () => {
              router.push({
                pathname: '/clinic-admin/treatment-sheets/[treatmentSheetId]' as any,
                params: { treatmentSheetId: result.id },
              });
            },
          },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create treatment sheet.');
    }
  }, [createTSMutation, selectedDuration, customDuration, router]);

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

  const renderBrandingHeader = () => {
    const headerData = casesheet?.header_snapshot;
    if (!headerData) return null;

    return (
      <View style={styles.brandingSection} testID="branding-header">
        {headerData.logo_url && (
          <Image
            source={{ uri: headerData.logo_url }}
            style={styles.brandingLogo}
            resizeMode="contain"
            accessibilityLabel="Clinic logo"
          />
        )}
        <View style={styles.brandingInfo}>
          {headerData.clinic_name && (
            <Text style={styles.brandingClinicName}>{headerData.clinic_name}</Text>
          )}
          {headerData.tagline && (
            <Text style={styles.brandingTagline}>{headerData.tagline}</Text>
          )}
          {headerData.address && (
            <Text style={styles.brandingAddress}>{headerData.address}</Text>
          )}
          {headerData.phone && (
            <Text style={styles.brandingContact}>
              <Ionicons name="call-outline" size={12} color={colors.text.secondary} /> {headerData.phone}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderBrandingFooter = () => {
    const footerData = casesheet?.footer_snapshot;
    if (!footerData) return null;

    return (
      <View style={styles.brandingFooterSection} testID="branding-footer">
        {footerData.legal_text && (
          <Text style={styles.footerLegalText}>{footerData.legal_text}</Text>
        )}
        {footerData.registration_no && (
          <Text style={styles.footerRegistration}>Reg. No: {footerData.registration_no}</Text>
        )}
        {footerData.website && (
          <Text style={styles.footerWebsite}>{footerData.website}</Text>
        )}
      </View>
    );
  };

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

  const renderExtensions = () => {
    const extensions = casesheet?.data_json?.extensions;
    if (!extensions || extensions.length === 0) return null;

    return (
      <View style={styles.extensionsSection} testID="extensions-section">
        <View style={styles.extensionsHeader}>
          <Ionicons name="extension-puzzle" size={20} color={colors.info.main} />
          <Text style={styles.extensionsTitle}>Extensions</Text>
        </View>
        {extensions.map((ext: any, index: number) => (
          <View key={ext.template_id || index} style={styles.extensionItem}>
            <Text style={styles.extensionTemplate}>
              {ext.template_name || `Extension ${index + 1}`}
            </Text>
            {ext.data && Object.entries(ext.data).map(([key, value]) => (
              <View key={key} style={styles.extensionField}>
                <Text style={styles.extensionFieldLabel}>{key.replace(/_/g, ' ')}:</Text>
                <Text style={styles.extensionFieldValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderCreateTreatmentSheetModal = () => (
    <Modal
      visible={showCreateTSModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreateTSModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Treatment Sheet</Text>
            <TouchableOpacity
              onPress={() => setShowCreateTSModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Select treatment duration</Text>

          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.days}
                style={[
                  styles.durationOption,
                  selectedDuration === option.days && !customDuration && styles.durationOptionSelected,
                ]}
                onPress={() => {
                  setSelectedDuration(option.days);
                  setCustomDuration('');
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select ${option.label}`}
              >
                <Text
                  style={[
                    styles.durationOptionText,
                    selectedDuration === option.days && !customDuration && styles.durationOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customDurationContainer}>
            <Text style={styles.customDurationLabel}>Or enter custom days:</Text>
            <TextInput
              style={styles.customDurationInput}
              value={customDuration}
              onChangeText={(text) => {
                setCustomDuration(text.replace(/[^0-9]/g, ''));
              }}
              placeholder="e.g., 90"
              keyboardType="number-pad"
              maxLength={3}
              accessibilityLabel="Custom duration in days"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateTSModal(false)}
              accessibilityRole="button"
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalCreateButton,
                createTSMutation.isPending && styles.modalButtonDisabled,
              ]}
              onPress={handleCreateTreatmentSheet}
              disabled={createTSMutation.isPending}
              accessibilityRole="button"
              testID="create-treatment-sheet-confirm"
            >
              {createTSMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.common.white} />
              ) : (
                <Text style={styles.modalCreateText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
        {/* Header Branding */}
        {renderBrandingHeader()}

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
          {(casesheet as any).recorded_by_name && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Recorded by:</Text>
              <Text style={styles.infoValue}>{(casesheet as any).recorded_by_name}</Text>
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

        {/* Extensions */}
        {renderExtensions()}

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
            onPress={() => setShowCreateTSModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Create treatment sheet"
            testID="create-treatment-sheet-btn"
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.success.main} />
            <Text style={styles.createTreatmentSheetText}>Create Treatment Sheet</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Footer Branding */}
        {renderBrandingFooter()}

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
      {renderCreateTreatmentSheetModal()}
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

  // Branding Header
  brandingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
  },
  brandingLogo: {
    width: 60,
    height: 60,
    marginRight: spacing.md,
  },
  brandingInfo: {
    flex: 1,
  },
  brandingClinicName: {
    ...typography.h6,
    color: colors.primary.main,
    fontWeight: '700',
  },
  brandingTagline: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  brandingAddress: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  brandingContact: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  // Branding Footer
  brandingFooterSection: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  footerLegalText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footerRegistration: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  footerWebsite: {
    ...typography.caption,
    color: colors.primary.main,
    marginTop: spacing.xs,
  },

  // Info Card
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

  // Sections
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

  // Extensions
  extensionsSection: {
    backgroundColor: colors.info.main + '10',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.info.main + '30',
  },
  extensionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  extensionsTitle: {
    ...typography.body1,
    color: colors.info.main,
    fontWeight: '600',
  },
  extensionItem: {
    backgroundColor: colors.common.white,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  extensionTemplate: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  extensionField: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  extensionFieldLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
    marginRight: spacing.xs,
  },
  extensionFieldValue: {
    ...typography.caption,
    color: colors.text.primary,
    flex: 1,
  },

  // Actions
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

  // Treatment Sheets
  treatmentSheetsSection: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.success.main + '30',
  },
  treatmentSheetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  treatmentSheetsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.success.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  treatmentSheetsInfo: {
    flex: 1,
  },
  treatmentSheetsTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  treatmentSheetsSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  createTreatmentSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.success.main + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success.main + '30',
    gap: spacing.xs,
  },
  createTreatmentSheetText: {
    ...typography.button,
    color: colors.success.main,
    flex: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  modalSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.main,
    backgroundColor: colors.background.default,
    minWidth: 80,
    alignItems: 'center',
  },
  durationOptionSelected: {
    borderColor: colors.success.main,
    backgroundColor: colors.success.main + '15',
  },
  durationOptionText: {
    ...typography.body2,
    color: colors.text.primary,
  },
  durationOptionTextSelected: {
    color: colors.success.main,
    fontWeight: '600',
  },
  customDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  customDurationLabel: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  customDurationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.button,
    color: colors.text.secondary,
  },
  modalCreateButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.success.main,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalCreateText: {
    ...typography.button,
    color: colors.common.white,
  },
});

export default CasesheetDetailScreen;
