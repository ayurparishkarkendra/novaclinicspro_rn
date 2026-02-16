/**
 * Prescription Form Component
 * Form for creating/editing prescriptions with medication items
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export interface MedicationItemData {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface PrescriptionFormData {
  medications: MedicationItemData[];
  dietary_advice?: string;
  lifestyle_advice?: string;
  notes?: string;
  next_visit_days?: number;
}

interface PrescriptionFormProps {
  initialData?: PrescriptionFormData;
  onSubmit: (data: PrescriptionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditable?: boolean;
  submitLabel?: string;
}

const EMPTY_MEDICATION: MedicationItemData = {
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditable = true,
  submitLabel = 'Save',
}) => {
  const [medications, setMedications] = useState<MedicationItemData[]>(
    initialData?.medications?.length ? initialData.medications : [{ ...EMPTY_MEDICATION }]
  );
  const [dietaryAdvice, setDietaryAdvice] = useState(initialData?.dietary_advice || '');
  const [lifestyleAdvice, setLifestyleAdvice] = useState(initialData?.lifestyle_advice || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [nextVisitDays, setNextVisitDays] = useState(
    initialData?.next_visit_days?.toString() || ''
  );

  const handleMedicationChange = useCallback(
    (index: number, field: keyof MedicationItemData, value: string) => {
      setMedications(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const addMedication = useCallback(() => {
    setMedications(prev => [...prev, { ...EMPTY_MEDICATION }]);
  }, []);

  const removeMedication = useCallback((index: number) => {
    setMedications(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = useCallback(() => {
    // Filter out empty medications
    const validMedications = medications.filter(
      med => med.name.trim() && med.dosage.trim()
    );

    if (validMedications.length === 0) {
      return; // Show error - at least one medication required
    }

    const formData: PrescriptionFormData = {
      medications: validMedications,
      dietary_advice: dietaryAdvice || undefined,
      lifestyle_advice: lifestyleAdvice || undefined,
      notes: notes || undefined,
      next_visit_days: nextVisitDays ? parseInt(nextVisitDays, 10) : undefined,
    };

    onSubmit(formData);
  }, [medications, dietaryAdvice, lifestyleAdvice, notes, nextVisitDays, onSubmit]);

  const renderMedicationItem = (med: MedicationItemData, index: number) => (
    <View key={index} style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <Text style={styles.medicationNumber}>Medication {index + 1}</Text>
        {medications.length > 1 && isEditable && (
          <TouchableOpacity
            onPress={() => removeMedication(index)}
            style={styles.removeMedicationButton}
            accessibilityLabel={`Remove medication ${index + 1}`}
            testID={`remove-medication-${index}`}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error.main} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.medicationFields}>
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Medicine Name *</Text>
            <TextInput
              style={[styles.textInput, !isEditable && styles.disabledInput]}
              value={med.name}
              onChangeText={(text) => handleMedicationChange(index, 'name', text)}
              placeholder="e.g., Paracetamol"
              placeholderTextColor={colors.text.tertiary}
              editable={isEditable}
              testID={`medication-${index}-name`}
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Dosage *</Text>
            <TextInput
              style={[styles.textInput, !isEditable && styles.disabledInput]}
              value={med.dosage}
              onChangeText={(text) => handleMedicationChange(index, 'dosage', text)}
              placeholder="e.g., 500mg"
              placeholderTextColor={colors.text.tertiary}
              editable={isEditable}
              testID={`medication-${index}-dosage`}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Frequency</Text>
            <TextInput
              style={[styles.textInput, !isEditable && styles.disabledInput]}
              value={med.frequency}
              onChangeText={(text) => handleMedicationChange(index, 'frequency', text)}
              placeholder="e.g., 3 times daily"
              placeholderTextColor={colors.text.tertiary}
              editable={isEditable}
              testID={`medication-${index}-frequency`}
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <TextInput
              style={[styles.textInput, !isEditable && styles.disabledInput]}
              value={med.duration}
              onChangeText={(text) => handleMedicationChange(index, 'duration', text)}
              placeholder="e.g., 5 days"
              placeholderTextColor={colors.text.tertiary}
              editable={isEditable}
              testID={`medication-${index}-duration`}
            />
          </View>
        </View>

        <View style={styles.fieldFull}>
          <Text style={styles.fieldLabel}>Instructions</Text>
          <TextInput
            style={[styles.textInput, !isEditable && styles.disabledInput]}
            value={med.instructions}
            onChangeText={(text) => handleMedicationChange(index, 'instructions', text)}
            placeholder="e.g., Take after meals"
            placeholderTextColor={colors.text.tertiary}
            editable={isEditable}
            testID={`medication-${index}-instructions`}
          />
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit" size={20} color={colors.primary.main} />
            <Text style={styles.sectionTitle}>Medications</Text>
          </View>

          {medications.map((med, index) => renderMedicationItem(med, index))}

          {isEditable && (
            <TouchableOpacity
              style={styles.addMedicationButton}
              onPress={addMedication}
              accessibilityLabel="Add another medication"
              testID="add-medication-button"
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary.main} />
              <Text style={styles.addMedicationText}>Add Medication</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Advice Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="nutrition-outline" size={20} color={colors.success.main} />
            <Text style={styles.sectionTitle}>Advice</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Dietary Advice</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, !isEditable && styles.disabledInput]}
              value={dietaryAdvice}
              onChangeText={setDietaryAdvice}
              placeholder="Dietary recommendations..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              editable={isEditable}
              testID="dietary-advice-input"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Lifestyle Advice</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, !isEditable && styles.disabledInput]}
              value={lifestyleAdvice}
              onChangeText={setLifestyleAdvice}
              placeholder="Lifestyle recommendations..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              editable={isEditable}
              testID="lifestyle-advice-input"
            />
          </View>
        </View>

        {/* Additional Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={colors.info.main} />
            <Text style={styles.sectionTitle}>Additional Information</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, !isEditable && styles.disabledInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              editable={isEditable}
              testID="notes-input"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Follow-up in (days)</Text>
            <TextInput
              style={[styles.textInput, !isEditable && styles.disabledInput]}
              value={nextVisitDays}
              onChangeText={setNextVisitDays}
              placeholder="e.g., 7"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              editable={isEditable}
              testID="next-visit-days-input"
            />
          </View>
        </View>

        {/* Action Buttons */}
        {isEditable && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              testID="prescription-form-cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
              testID="prescription-form-submit"
            >
              {isLoading ? (
                <Text style={styles.submitButtonText}>Saving...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.background.default} />
                  <Text style={styles.submitButtonText}>{submitLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  medicationCard: {
    backgroundColor: colors.grey[50],
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  medicationNumber: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
  },
  removeMedicationButton: {
    padding: spacing.xs,
  },
  medicationFields: {
    gap: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldFull: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: 8,
    padding: spacing.sm,
    ...typography.body2,
    color: colors.text.primary,
    backgroundColor: colors.background.default,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: colors.grey[100],
    color: colors.text.secondary,
  },
  addMedicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary.main,
    borderRadius: 8,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  addMedicationText: {
    ...typography.button,
    color: colors.primary.main,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.grey[200],
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default PrescriptionForm;
