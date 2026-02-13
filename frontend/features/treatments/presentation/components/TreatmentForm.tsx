/**
 * Treatment Form Component
 * Reusable form for creating and editing treatments
 * 
 * Features:
 * - All treatment fields (code, name, description, duration, price, dosha, contraindications)
 * - hasFormChanges() check - edit won't call API if no changes (Issue #7)
 * - Used for both create and edit flows
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { colors } from '../../../../core/theme/colors';
import {
  TreatmentResponse,
  TreatmentCreate,
  TreatmentUpdate,
  DoshaBenefits,
  DOSHA_COLORS,
} from '../../data/models/treatments.dtos';

// ============================================
// TYPES
// ============================================

interface DoshaState {
  balances: boolean;
  notes: string;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  contraindications: string;
}

interface DoshaFormState {
  vata: DoshaState;
  pitta: DoshaState;
  kapha: DoshaState;
}

interface TreatmentFormProps {
  initialData?: TreatmentResponse | null;
  onSubmit: (data: TreatmentCreate | TreatmentUpdate, hasChanges: boolean) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract form data from treatment response
 */
const getInitialFormData = (data?: TreatmentResponse | null): FormData => {
  if (!data) {
    return {
      code: '',
      name: '',
      description: '',
      duration: '',
      price: '',
      contraindications: '',
    };
  }

  return {
    code: data.code || '',
    name: data.name || '',
    description: data.description || '',
    duration: data.duration_minutes?.toString() || '',
    price: data.price || data.base_price || '',
    contraindications: data.contraindications || '',
  };
};

/**
 * Extract dosha state from treatment response
 */
const getInitialDoshaState = (benefits?: DoshaBenefits | null): DoshaFormState => {
  return {
    vata: {
      balances: benefits?.vata?.balances || false,
      notes: benefits?.vata?.notes || '',
    },
    pitta: {
      balances: benefits?.pitta?.balances || false,
      notes: benefits?.pitta?.notes || '',
    },
    kapha: {
      balances: benefits?.kapha?.balances || false,
      notes: benefits?.kapha?.notes || '',
    },
  };
};

/**
 * Compare current form data with initial data to detect changes
 */
const hasFormChanges = (
  formData: FormData,
  doshaState: DoshaFormState,
  initialData?: TreatmentResponse | null
): boolean => {
  if (!initialData) return true; // Always has changes for new entries

  const initial = getInitialFormData(initialData);
  const initialDosha = getInitialDoshaState(initialData.dosha_benefits);

  // Check basic fields
  if (formData.code.trim().toUpperCase() !== initial.code) return true;
  if (formData.name.trim() !== initial.name) return true;
  if (formData.description.trim() !== (initial.description || '')) return true;
  if (formData.duration !== initial.duration) return true;
  if (formData.price !== initial.price) return true;
  if (formData.contraindications.trim() !== (initial.contraindications || '')) return true;

  // Check dosha benefits
  const doshas: Array<keyof DoshaFormState> = ['vata', 'pitta', 'kapha'];
  for (const dosha of doshas) {
    if (doshaState[dosha].balances !== initialDosha[dosha].balances) return true;
    if (doshaState[dosha].notes.trim() !== (initialDosha[dosha].notes || '')) return true;
  }

  return false;
};

// ============================================
// COMPONENT
// ============================================

export const TreatmentForm: React.FC<TreatmentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}) => {
  const isEditing = mode === 'edit';

  // Form state
  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(initialData));
  const [doshaBenefits, setDoshaBenefits] = useState<DoshaFormState>(() => 
    getInitialDoshaState(initialData?.dosha_benefits)
  );

  // Validation
  const isValid = useMemo(() => {
    return formData.code.trim().length > 0 && formData.name.trim().length > 0;
  }, [formData.code, formData.name]);

  // Check for changes
  const formHasChanges = useMemo(() => {
    return hasFormChanges(formData, doshaBenefits, initialData);
  }, [formData, doshaBenefits, initialData]);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    // Build dosha benefits object
    const doshaData: DoshaBenefits = {};
    if (doshaBenefits.vata.balances || doshaBenefits.vata.notes.trim()) {
      doshaData.vata = {
        balances: doshaBenefits.vata.balances,
        notes: doshaBenefits.vata.notes.trim() || undefined,
      };
    }
    if (doshaBenefits.pitta.balances || doshaBenefits.pitta.notes.trim()) {
      doshaData.pitta = {
        balances: doshaBenefits.pitta.balances,
        notes: doshaBenefits.pitta.notes.trim() || undefined,
      };
    }
    if (doshaBenefits.kapha.balances || doshaBenefits.kapha.notes.trim()) {
      doshaData.kapha = {
        balances: doshaBenefits.kapha.balances,
        notes: doshaBenefits.kapha.notes.trim() || undefined,
      };
    }

    const payload: TreatmentCreate | TreatmentUpdate = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      duration_minutes: formData.duration ? parseInt(formData.duration, 10) : null,
      base_price: formData.price ? parseFloat(formData.price) : null,
      dosha_benefits: Object.keys(doshaData).length > 0 ? doshaData : null,
      contraindications: formData.contraindications.trim() || null,
    };

    onSubmit(payload, formHasChanges);
  }, [formData, doshaBenefits, isValid, formHasChanges, onSubmit]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Treatment Code *</Text>
            <TextInput
              style={[styles.input, isEditing && styles.inputDisabled]}
              placeholder="e.g., ABHYANGA"
              placeholderTextColor="#9CA3AF"
              value={formData.code}
              onChangeText={(text) => setFormData(prev => ({ ...prev, code: text }))}
              autoCapitalize="characters"
              editable={!isEditing} // Code is typically not editable
            />
            <Text style={styles.hint}>
              {isEditing ? 'Treatment code cannot be changed' : 'Unique identifier (will be uppercased)'}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Treatment Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Abhyanga Massage"
              placeholderTextColor="#9CA3AF"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the treatment..."
              placeholderTextColor="#9CA3AF"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Duration & Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration & Pricing</Text>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                placeholder="60"
                placeholderTextColor="#9CA3AF"
                value={formData.duration}
                onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="1500"
                placeholderTextColor="#9CA3AF"
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Ayurveda Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayurvedic Properties</Text>
          <Text style={styles.sectionHint}>Select doshas this treatment helps balance</Text>

          {/* Vata */}
          <View style={styles.doshaCard}>
            <View style={styles.doshaHeader}>
              <View style={[styles.doshaIndicator, { backgroundColor: DOSHA_COLORS.vata }]} />
              <Text style={styles.doshaName}>Vata</Text>
              <Text style={styles.doshaDesc}>(Air + Space)</Text>
              <Switch
                value={doshaBenefits.vata.balances}
                onValueChange={(value) => setDoshaBenefits(prev => ({
                  ...prev,
                  vata: { ...prev.vata, balances: value },
                }))}
                trackColor={{ false: '#E5E7EB', true: DOSHA_COLORS.vata + '60' }}
                thumbColor={doshaBenefits.vata.balances ? DOSHA_COLORS.vata : '#F4F4F5'}
              />
            </View>
            {doshaBenefits.vata.balances && (
              <TextInput
                style={styles.doshaInput}
                placeholder="Notes on Vata benefits..."
                placeholderTextColor="#9CA3AF"
                value={doshaBenefits.vata.notes}
                onChangeText={(text) => setDoshaBenefits(prev => ({
                  ...prev,
                  vata: { ...prev.vata, notes: text },
                }))}
              />
            )}
          </View>

          {/* Pitta */}
          <View style={styles.doshaCard}>
            <View style={styles.doshaHeader}>
              <View style={[styles.doshaIndicator, { backgroundColor: DOSHA_COLORS.pitta }]} />
              <Text style={styles.doshaName}>Pitta</Text>
              <Text style={styles.doshaDesc}>(Fire + Water)</Text>
              <Switch
                value={doshaBenefits.pitta.balances}
                onValueChange={(value) => setDoshaBenefits(prev => ({
                  ...prev,
                  pitta: { ...prev.pitta, balances: value },
                }))}
                trackColor={{ false: '#E5E7EB', true: DOSHA_COLORS.pitta + '60' }}
                thumbColor={doshaBenefits.pitta.balances ? DOSHA_COLORS.pitta : '#F4F4F5'}
              />
            </View>
            {doshaBenefits.pitta.balances && (
              <TextInput
                style={styles.doshaInput}
                placeholder="Notes on Pitta benefits..."
                placeholderTextColor="#9CA3AF"
                value={doshaBenefits.pitta.notes}
                onChangeText={(text) => setDoshaBenefits(prev => ({
                  ...prev,
                  pitta: { ...prev.pitta, notes: text },
                }))}
              />
            )}
          </View>

          {/* Kapha */}
          <View style={styles.doshaCard}>
            <View style={styles.doshaHeader}>
              <View style={[styles.doshaIndicator, { backgroundColor: DOSHA_COLORS.kapha }]} />
              <Text style={styles.doshaName}>Kapha</Text>
              <Text style={styles.doshaDesc}>(Earth + Water)</Text>
              <Switch
                value={doshaBenefits.kapha.balances}
                onValueChange={(value) => setDoshaBenefits(prev => ({
                  ...prev,
                  kapha: { ...prev.kapha, balances: value },
                }))}
                trackColor={{ false: '#E5E7EB', true: DOSHA_COLORS.kapha + '60' }}
                thumbColor={doshaBenefits.kapha.balances ? DOSHA_COLORS.kapha : '#F4F4F5'}
              />
            </View>
            {doshaBenefits.kapha.balances && (
              <TextInput
                style={styles.doshaInput}
                placeholder="Notes on Kapha benefits..."
                placeholderTextColor="#9CA3AF"
                value={doshaBenefits.kapha.notes}
                onChangeText={(text) => setDoshaBenefits(prev => ({
                  ...prev,
                  kapha: { ...prev.kapha, notes: text },
                }))}
              />
            )}
          </View>
        </View>

        {/* Contraindications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contraindications</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="List any conditions where this treatment should be avoided..."
              placeholderTextColor="#9CA3AF"
              value={formData.contraindications}
              onChangeText={(text) => setFormData(prev => ({ ...prev, contraindications: text }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Change indicator for edit mode */}
        {isEditing && (
          <View style={styles.changeIndicator}>
            <Ionicons 
              name={formHasChanges ? 'ellipse' : 'checkmark-circle'} 
              size={16} 
              color={formHasChanges ? '#F59E0B' : '#10B981'} 
            />
            <Text style={[
              styles.changeText,
              { color: formHasChanges ? '#F59E0B' : '#10B981' }
            ]}>
              {formHasChanges ? 'Unsaved changes' : 'No changes'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isValid || isLoading) && styles.disabledButton,
            isEditing && !formHasChanges && styles.noChangesButton,
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons 
                name={isEditing ? 'checkmark-circle' : 'add-circle'} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.submitButtonText}>
                {isEditing 
                  ? (formHasChanges ? 'Save Changes' : 'No Changes')
                  : 'Create Treatment'
                }
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    ...typography.h6,
    color: '#1F2937',
    marginBottom: spacing.sm,
  },
  sectionHint: {
    ...typography.caption,
    color: '#6B7280',
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: '#9CA3AF',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: '#1F2937',
    minHeight: 48,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  doshaCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  doshaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doshaIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  doshaName: {
    ...typography.body1,
    fontWeight: '600',
    color: '#1F2937',
  },
  doshaDesc: {
    ...typography.caption,
    color: '#6B7280',
    flex: 1,
    marginLeft: spacing.xs,
  },
  doshaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    ...typography.body2,
    color: '#1F2937',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  changeText: {
    ...typography.caption,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#2F6F4E',
    borderRadius: 10,
    paddingVertical: spacing.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  noChangesButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TreatmentForm;
