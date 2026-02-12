/**
 * Inventory Stock Adjust Screen
 * Screen for adjusting inventory stock levels
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useInventoryItemDetailQuery,
  useAdjustInventoryStockMutation,
} from '../../data/repositories/inventory.repository.impl';
import { StockAdjustmentForm } from '../components/StockAdjustmentForm';
import { StockAdjustmentRequest } from '../../data/models/inventory.dtos';

export const InventoryStockAdjustScreen: React.FC = () => {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.activeTenant?.id || '';

  // Fetch item details
  const {
    data: item,
    isLoading,
    isError,
    error,
  } = useInventoryItemDetailQuery(tenantId, itemId || '');

  // Adjust stock mutation
  const adjustMutation = useAdjustInventoryStockMutation(tenantId, itemId || '');

  const handleSubmit = async (data: StockAdjustmentRequest) => {
    try {
      await adjustMutation.mutateAsync(data);
      Alert.alert(
        'Success',
        'Stock has been adjusted successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message || 'Failed to adjust stock. Please try again.'
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading item details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adjust Stock</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error.main} />
          <Text style={styles.errorTitle}>Unable to Load Item</Text>
          <Text style={styles.errorSubtitle}>
            {error?.message || 'Please check your connection and try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Adjust Stock</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <StockAdjustmentForm
          currentStock={item.current_stock}
          unit={item.unit}
          onSubmit={handleSubmit}
          isLoading={adjustMutation.isPending}
        />
      </ScrollView>
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
    ...typography.h6,
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  errorSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.light,
  },
});
