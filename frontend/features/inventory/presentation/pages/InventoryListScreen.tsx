/**
 * Inventory List Screen
 * Main screen for viewing and managing inventory items
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import { 
  useInventoryItemsListQuery,
  useSearchInventoryQuery,
} from '../../data/repositories/inventory.repository.impl';
import { InventoryItemListItem } from '../components/InventoryItemListItem';
import {
  InventoryItemResponse,
  InventoryCategory,
  ListInventoryParams,
} from '../../data/models/inventory.dtos';

// Minimum characters before triggering search
const MIN_SEARCH_LENGTH = 3;
// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

const CATEGORIES: { value: InventoryCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'consumable', label: 'Consumable' },
];

export const InventoryListScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'all'>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Build query params
  const queryParams: ListInventoryParams = {
    search: searchQuery || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    limit: 50,
  };

  // Fetch inventory items
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useInventoryItemsListQuery(tenantId, queryParams);

  const items = data?.items || [];

  // Filter low stock items if needed
  const displayedItems = showLowStockOnly
    ? items.filter((item) => {
        const stock = parseFloat(item.current_stock) || 0;
        return stock <= item.reorder_point;
      })
    : items;

  const handleItemPress = useCallback(
    (item: InventoryItemResponse) => {
      router.push(`/clinic-admin/inventory/${item.id}`);
    },
    [router]
  );

  const handleCreateItem = () => {
    router.push('/clinic-admin/inventory/create');
  };

  const renderItem = useCallback(
    ({ item }: { item: InventoryItemResponse }) => (
      <InventoryItemListItem item={item} onPress={() => handleItemPress(item)} />
    ),
    [handleItemPress]
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search inventory..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.value && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.value)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item.value && styles.categoryChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Low Stock Filter Toggle */}
      <TouchableOpacity
        style={[
          styles.lowStockToggle,
          showLowStockOnly && styles.lowStockToggleActive,
        ]}
        onPress={() => setShowLowStockOnly(!showLowStockOnly)}
      >
        <Ionicons
          name="warning"
          size={16}
          color={showLowStockOnly ? colors.text.light : colors.warning.main}
        />
        <Text
          style={[
            styles.lowStockToggleText,
            showLowStockOnly && styles.lowStockToggleTextActive,
          ]}
        >
          Low Stock Only
        </Text>
      </TouchableOpacity>

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {displayedItems.length} item{displayedItems.length !== 1 ? 's' : ''}
          {data?.total && data.total > displayedItems.length && ` of ${data.total}`}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary.main} />
      ) : isError ? (
        <>
          <Ionicons name="alert-circle" size={48} color={colors.error.main} />
          <Text style={styles.emptyTitle}>Unable to Load Inventory</Text>
          <Text style={styles.emptySubtitle}>
            {error?.message || 'Please check your connection and try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="cube-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>
            {searchQuery || selectedCategory !== 'all'
              ? 'No items found'
              : 'No Inventory Items Yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first inventory item to get started'}
          </Text>
          {!searchQuery && selectedCategory === 'all' && (
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateItem}>
              <Ionicons name="add" size={20} color={colors.text.light} />
              <Text style={styles.emptyButtonText}>Add Item</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>Manage stock & supplies</Text>
        </View>
        <TouchableOpacity
          style={styles.alertsButton}
          onPress={() => router.push('/clinic-admin/inventory/alerts')}
        >
          <Ionicons name="notifications" size={24} color={colors.warning.main} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary.main]}
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateItem}>
        <Ionicons name="add" size={28} color={colors.text.light} />
      </TouchableOpacity>
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
    ...typography.h5,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  alertsButton: {
    padding: spacing.xs,
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
  },
  categoriesContainer: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    marginRight: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.main,
  },
  categoryChipText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.light,
  },
  lowStockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.warning.main + '15',
    marginBottom: spacing.md,
  },
  lowStockToggleActive: {
    backgroundColor: colors.warning.main,
  },
  lowStockToggleText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.warning.main,
  },
  lowStockToggleTextActive: {
    color: colors.text.light,
  },
  resultsRow: {
    marginBottom: spacing.sm,
  },
  resultsText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  emptyButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.light,
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
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
