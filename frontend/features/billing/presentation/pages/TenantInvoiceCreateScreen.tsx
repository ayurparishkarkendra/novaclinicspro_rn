/**
 * Tenant Invoice Create Screen
 * Screen for creating new invoices
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useCreateInvoiceMutation } from '../../data/repositories/billing.repository.impl';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceCreateRequest } from '../../data/models/billing.dtos';

export const TenantInvoiceCreateScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // For simplicity, we'll use a placeholder client ID
  // In a real app, you'd have a client selector component
  const [clientId, setClientId] = useState<string>('');

  const createMutation = useCreateInvoiceMutation(tenantId, {
    onSuccess: (data) => {
      Alert.alert(
        'Success',
        'Invoice created successfully!',
        [
          {
            text: 'View Invoice',
            onPress: () => router.replace(`/clinic-admin/billing/invoices/${data.id}`),
          },
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form - will need state refresh
            },
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create invoice');
    },
  });

  const handleSubmit = (data: InvoiceCreateRequest) => {
    if (!data.client_id) {
      Alert.alert('Error', 'Please enter a client ID');
      return;
    }
    createMutation.mutate(data as InvoiceCreateRequest);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Create Invoice</Text>
            <Text style={styles.headerSubtitle}>Add a new invoice</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Client ID Input (simplified) */}
          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>Client Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Client ID *</Text>
              <View style={styles.clientInputContainer}>
                <Ionicons name="person" size={20} color={colors.text.tertiary} />
                <Text style={styles.clientInputHint}>
                  Client selection coming soon. For now, enter client ID manually in the form.
                </Text>
              </View>
            </View>
          </View>

          {/* Invoice Form */}
          <InvoiceForm
            clientId={clientId || 'placeholder-client-id'}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            isEdit={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.default,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  clientSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  clientInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info.main + '10',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  clientInputHint: {
    ...typography.body2,
    color: colors.info.dark,
    flex: 1,
  },
});
