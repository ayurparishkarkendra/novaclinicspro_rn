/**
 * Create Inventory Item Route
 * /clinic-admin/inventory/create
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../core/theme/colors';
import { spacing } from '../../../core/theme/spacing';
import { typography } from '../../../core/theme/typography';
import { useAuth } from '../../../features/auth/presentation/hooks/useAuth';
import { useCreateInventoryItemMutation } from '../../../features/inventory/data/repositories/inventory.repository.impl';
import { InventoryItemForm } from '../../../features/inventory/presentation/components/InventoryItemForm';
import { InventoryCreateRequest, InventoryUpdateRequest } from '../../../features/inventory/data/models/inventory.dtos';

export default function CreateInventoryItemRoute() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  const createMutation = useCreateInventoryItemMutation(tenantId);

  const handleSubmit = async (data: InventoryCreateRequest | InventoryUpdateRequest) => {
    try {
      const result = await createMutation.mutateAsync(data);
      Alert.alert(
        'Success',
        `"${result.name}" has been added to inventory.`,
        [
          {
            text: 'View Item',
            onPress: () => router.replace(`/clinic-admin/inventory/${result.id}`),
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Stay on the same screen
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Failed to create item. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Inventory Item</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <InventoryItemForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
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
  headerTitle: {
    flex: 1,
    ...typography.h6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
});
