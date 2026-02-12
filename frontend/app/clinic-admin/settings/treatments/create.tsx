/**
 * Create Treatment Route
 * /clinic-admin/settings/treatments/create
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { useCreateTreatmentMutation } from '../../../../features/treatments/data/repositories/treatments.repository.impl';
import { DOSHA_COLORS } from '../../../../features/treatments/data/models/treatments.dtos';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuthStore } from '../../../../features/auth/presentation/stores/auth.store';

interface DoshaState {
  balances: boolean;
  notes: string;
}

export default function CreateTreatmentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    duration: '',
    price: '',
    contraindications: '',
  });

  const [doshaBenefits, setDoshaBenefits] = useState({
    vata: { balances: false, notes: '' } as DoshaState,
    pitta: { balances: false, notes: '' } as DoshaState,
    kapha: { balances: false, notes: '' } as DoshaState,
  });

  const createMutation = useCreateTreatmentMutation(tenantId);

  const handleCreate = useCallback(async () => {
    // Validation
    if (!formData.code.trim()) {
      Alert.alert('Validation Error', 'Treatment code is required');
      return;
    }
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Treatment name is required');
      return;
    }

    try {
      // Build dosha benefits object
      const doshaData: Record<string, any> = {};
      if (doshaBenefits.vata.balances || doshaBenefits.vata.notes) {
        doshaData.vata = {
          balances: doshaBenefits.vata.balances,
          notes: doshaBenefits.vata.notes || undefined,
        };
      }
      if (doshaBenefits.pitta.balances || doshaBenefits.pitta.notes) {
        doshaData.pitta = {
          balances: doshaBenefits.pitta.balances,
          notes: doshaBenefits.pitta.notes || undefined,
        };
      }
      if (doshaBenefits.kapha.balances || doshaBenefits.kapha.notes) {
        doshaData.kapha = {
          balances: doshaBenefits.kapha.balances,
          notes: doshaBenefits.kapha.notes || undefined,
        };
      }

      await createMutation.mutateAsync({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        duration_minutes: formData.duration ? parseInt(formData.duration, 10) : undefined,
        base_price: formData.price ? parseFloat(formData.price) : undefined,
        dosha_benefits: Object.keys(doshaData).length > 0 ? doshaData : undefined,
        contraindications: formData.contraindications.trim() || undefined,
      });

      Alert.alert('Success', 'Treatment created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create treatment');
    }
  }, [createMutation, formData, doshaBenefits, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Add Treatment"
        subtitle="Create new service"
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
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
                style={styles.input}
                placeholder="e.g., ABHYANGA"
                placeholderTextColor="#9CA3AF"
                value={formData.code}
                onChangeText={(text) => setFormData(prev => ({ ...prev, code: text }))}
                autoCapitalize="characters"
              />
              <Text style={styles.hint}>Unique identifier (will be uppercased)</Text>
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
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, createMutation.isPending && styles.disabledButton]}
            onPress={handleCreate}
            disabled={createMutation.isPending}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {createMutation.isPending ? 'Creating...' : 'Create Treatment'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4EC',
  },
  keyboardView: {
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
  footer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
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
  submitButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
