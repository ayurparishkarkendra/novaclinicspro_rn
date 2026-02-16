/**
 * Casesheet Form Component
 * Dynamic form for creating/editing casesheets with SOAP sections
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

export interface CasesheetFormData {
  basic: {
    chief_complaint?: string;
    provisional_diagnosis?: string;
    final_diagnosis?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    [key: string]: any;
  };
  extensions?: Array<{
    template_id: string;
    template_name?: string;
    data: Record<string, any>;
  }>;
}

// Predefined extension templates for common clinical data
const EXTENSION_TEMPLATES = [
  {
    id: 'vitals',
    name: 'Vital Signs',
    icon: 'pulse' as keyof typeof Ionicons.glyphMap,
    fields: [
      { id: 'blood_pressure', label: 'Blood Pressure', placeholder: 'e.g., 120/80 mmHg' },
      { id: 'pulse_rate', label: 'Pulse Rate', placeholder: 'e.g., 72 bpm' },
      { id: 'temperature', label: 'Temperature', placeholder: 'e.g., 98.6°F' },
      { id: 'respiratory_rate', label: 'Respiratory Rate', placeholder: 'e.g., 16/min' },
      { id: 'spo2', label: 'SpO2', placeholder: 'e.g., 98%' },
      { id: 'weight', label: 'Weight', placeholder: 'e.g., 70 kg' },
    ],
  },
  {
    id: 'prakriti',
    name: 'Prakriti Assessment',
    icon: 'leaf' as keyof typeof Ionicons.glyphMap,
    fields: [
      { id: 'vata', label: 'Vata', placeholder: 'Score or description' },
      { id: 'pitta', label: 'Pitta', placeholder: 'Score or description' },
      { id: 'kapha', label: 'Kapha', placeholder: 'Score or description' },
      { id: 'dominant_dosha', label: 'Dominant Dosha', placeholder: 'e.g., Vata-Pitta' },
    ],
  },
  {
    id: 'nadi_pariksha',
    name: 'Nadi Pariksha',
    icon: 'hand-left' as keyof typeof Ionicons.glyphMap,
    fields: [
      { id: 'nadi_type', label: 'Nadi Type', placeholder: 'e.g., Vata, Pitta, Kapha' },
      { id: 'nadi_gati', label: 'Nadi Gati', placeholder: 'Speed/rhythm' },
      { id: 'nadi_bala', label: 'Nadi Bala', placeholder: 'Strength' },
      { id: 'observations', label: 'Observations', placeholder: 'Additional notes' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Notes',
    icon: 'create' as keyof typeof Ionicons.glyphMap,
    fields: [
      { id: 'title', label: 'Title', placeholder: 'Extension title' },
      { id: 'content', label: 'Content', placeholder: 'Additional clinical notes', multiline: true },
    ],
  },
];

interface CasesheetFormProps {
  initialData?: CasesheetFormData;
  onSubmit: (data: CasesheetFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditable?: boolean;
  submitLabel?: string;
}

interface FormSection {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  fields: Array<{
    id: string;
    label: string;
    placeholder: string;
    multiline?: boolean;
    required?: boolean;
  }>;
}

const FORM_SECTIONS: FormSection[] = [
  {
    id: 'chief',
    title: 'Chief Complaint',
    icon: 'alert-circle-outline',
    fields: [
      {
        id: 'chief_complaint',
        label: 'Chief Complaint',
        placeholder: 'Primary reason for visit...',
        multiline: true,
        required: true,
      },
    ],
  },
  {
    id: 'soap',
    title: 'SOAP Notes',
    icon: 'document-text-outline',
    fields: [
      {
        id: 'subjective',
        label: 'Subjective',
        placeholder: "Patient's description of symptoms...",
        multiline: true,
      },
      {
        id: 'objective',
        label: 'Objective',
        placeholder: 'Clinical findings, vital signs...',
        multiline: true,
      },
      {
        id: 'assessment',
        label: 'Assessment',
        placeholder: 'Clinical assessment and analysis...',
        multiline: true,
      },
      {
        id: 'plan',
        label: 'Plan',
        placeholder: 'Treatment plan and recommendations...',
        multiline: true,
      },
    ],
  },
  {
    id: 'diagnosis',
    title: 'Diagnosis',
    icon: 'medical-outline',
    fields: [
      {
        id: 'provisional_diagnosis',
        label: 'Provisional Diagnosis',
        placeholder: 'Initial diagnosis...',
        multiline: true,
      },
      {
        id: 'final_diagnosis',
        label: 'Final Diagnosis',
        placeholder: 'Confirmed diagnosis...',
        multiline: true,
      },
    ],
  },
];

export const CasesheetForm: React.FC<CasesheetFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditable = true,
  submitLabel = 'Save',
}) => {
  const [formData, setFormData] = useState<CasesheetFormData>({
    basic: initialData?.basic || {},
    extensions: initialData?.extensions || [],
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['chief', 'soap', 'diagnosis'])
  );

  const [showExtensionPicker, setShowExtensionPicker] = useState(false);

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      basic: {
        ...prev.basic,
        [fieldId]: value,
      },
    }));
  }, []);

  const handleExtensionFieldChange = useCallback((extensionIndex: number, fieldId: string, value: string) => {
    setFormData(prev => {
      const newExtensions = [...(prev.extensions || [])];
      if (newExtensions[extensionIndex]) {
        newExtensions[extensionIndex] = {
          ...newExtensions[extensionIndex],
          data: {
            ...newExtensions[extensionIndex].data,
            [fieldId]: value,
          },
        };
      }
      return { ...prev, extensions: newExtensions };
    });
  }, []);

  const handleAddExtension = useCallback((templateId: string) => {
    const template = EXTENSION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      extensions: [
        ...(prev.extensions || []),
        {
          template_id: templateId,
          template_name: template.name,
          data: {},
        },
      ],
    }));
    setShowExtensionPicker(false);
    setExpandedSections(prev => new Set([...prev, `ext-${templateId}-${(formData.extensions?.length || 0)}`]));
  }, [formData.extensions?.length]);

  const handleRemoveExtension = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      extensions: prev.extensions?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(formData);
  }, [formData, onSubmit]);

  const renderField = (field: FormSection['fields'][0]) => {
    const value = formData.basic[field.id] || '';

    return (
      <View key={field.id} style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {field.required && <Text style={styles.requiredAsterisk}> *</Text>}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            field.multiline && styles.textArea,
            !isEditable && styles.disabledInput,
          ]}
          value={value}
          onChangeText={(text) => handleFieldChange(field.id, text)}
          placeholder={field.placeholder}
          placeholderTextColor={colors.text.tertiary}
          multiline={field.multiline}
          numberOfLines={field.multiline ? 4 : 1}
          editable={isEditable}
          accessibilityLabel={field.label}
          accessibilityHint={field.placeholder}
          testID={`casesheet-field-${field.id}`}
        />
      </View>
    );
  };

  const renderSection = (section: FormSection) => {
    const isExpanded = expandedSections.has(section.id);

    return (
      <View key={section.id} style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          accessibilityRole="button"
          accessibilityLabel={`${section.title} section, ${isExpanded ? 'expanded' : 'collapsed'}`}
          testID={`section-toggle-${section.id}`}
        >
          <View style={styles.sectionTitleContainer}>
            <Ionicons name={section.icon} size={20} color={colors.primary.main} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.sectionContent}>
            {section.fields.map(renderField)}
          </View>
        )}
      </View>
    );
  };

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
        {/* Form Instructions */}
        {isEditable && (
          <View style={styles.instructionsCard}>
            <Ionicons name="information-circle" size={20} color={colors.info.main} />
            <Text style={styles.instructionsText}>
              Fill in the clinical details. Fields marked with * are required.
            </Text>
          </View>
        )}

        {/* Form Sections */}
        {FORM_SECTIONS.map(renderSection)}

        {/* Action Buttons */}
        {isEditable && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              testID="casesheet-form-cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
              testID="casesheet-form-submit"
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
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info.main + '10',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  instructionsText: {
    ...typography.body2,
    color: colors.info.main,
    flex: 1,
  },
  section: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.grey[50],
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  requiredAsterisk: {
    color: colors.error.main,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: 8,
    padding: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
    backgroundColor: colors.background.default,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: colors.grey[100],
    color: colors.text.secondary,
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

export default CasesheetForm;
