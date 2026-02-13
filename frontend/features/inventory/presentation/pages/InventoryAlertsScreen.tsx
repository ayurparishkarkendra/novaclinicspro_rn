/**
 * Inventory Alerts Screen
 * Displays inventory alerts (low stock, expiring, etc.)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useInventoryAlertsListQuery,
  useAcknowledgeInventoryAlertsMutation,
} from '../../data/repositories/inventory.repository.impl';
import { InventoryAlertListItem } from '../components/InventoryAlertListItem';
import { AlertResponse, AlertType, ListAlertsParams } from '../../data/models/inventory.dtos';

const ALERT_TYPES: { value: AlertType | 'all'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'all', label: 'All', icon: 'list' },
  { value: 'LOW_STOCK', label: 'Low Stock', icon: 'trending-down' },
  { value: 'EXPIRY_WARNING', label: 'Expiring', icon: 'time' },
  { value: 'EXPIRED', label: 'Expired', icon: 'alert-circle' },
];

export const InventoryAlertsScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Filter state
  const [selectedType, setSelectedType] = useState<AlertType | 'all'>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  // Build query params
  const queryParams: ListAlertsParams = {
    alert_type: selectedType !== 'all' ? selectedType : undefined,
    is_acknowledged: showAcknowledged ? undefined : false,
    limit: 50,
  };

  // Fetch alerts
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useInventoryAlertsListQuery(tenantId, queryParams);

  // Acknowledge mutation
  const acknowledgeMutation = useAcknowledgeInventoryAlertsMutation(tenantId);

  const alerts = data?.items || [];

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeMutation.mutateAsync({ alert_ids: [alertId] });
    } catch (err) {
      Alert.alert('Error', 'Failed to acknowledge alert. Please try again.');
    }
  };

  const handleAcknowledgeAll = () => {
    const unacknowledgedAlerts = alerts.filter((a) => !a.is_acknowledged);
    if (unacknowledgedAlerts.length === 0) return;

    Alert.alert(
      'Acknowledge All',
      `Are you sure you want to acknowledge ${unacknowledgedAlerts.length} alert(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge All',
          onPress: async () => {
            try {
              await acknowledgeMutation.mutateAsync({
                alert_ids: unacknowledgedAlerts.map((a) => a.id),
              });
            } catch (err) {
              Alert.alert('Error', 'Failed to acknowledge alerts.');
            }
          },
        },
      ]
    );
  };

  const handleAlertPress = (alert: AlertResponse) => {
    if (alert.inventory_item_id) {
      router.push(`/clinic-admin/inventory/${alert.inventory_item_id}`);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: AlertResponse }) => (
      <InventoryAlertListItem
        alert={item}
        onAcknowledge={() => handleAcknowledge(item.id)}
        onPress={() => handleAlertPress(item)}
      />
    ),
    []
  );

  const unacknowledgedCount = alerts.filter((a) => !a.is_acknowledged).length;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Alert Type Filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={ALERT_TYPES}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedType === item.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedType(item.value)}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={
                selectedType === item.value
                  ? colors.text.light
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.filterChipText,
                selectedType === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Show Acknowledged Toggle */}
      <TouchableOpacity
        style={[
          styles.acknowledgedToggle,
          showAcknowledged && styles.acknowledgedToggleActive,
        ]}
        onPress={() => setShowAcknowledged(!showAcknowledged)}
      >
        <Ionicons
          name={showAcknowledged ? 'eye' : 'eye-off'}
          size={16}
          color={showAcknowledged ? colors.text.light : colors.text.secondary}
        />
        <Text
          style={[
            styles.acknowledgedToggleText,
            showAcknowledged && styles.acknowledgedToggleTextActive,
          ]}
        >
          {showAcknowledged ? 'Showing All' : 'Hide Acknowledged'}
        </Text>
      </TouchableOpacity>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <Text style={styles.resultsText}>
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          {unacknowledgedCount > 0 && ` (${unacknowledgedCount} unread)`}
        </Text>
        {unacknowledgedCount > 0 && (
          <TouchableOpacity
            style={styles.acknowledgeAllButton}
            onPress={handleAcknowledgeAll}
            disabled={acknowledgeMutation.isPending}
          >
            <Text style={styles.acknowledgeAllText}>Acknowledge All</Text>
          </TouchableOpacity>
        )}
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
          <Text style={styles.emptyTitle}>Unable to Load Alerts</Text>
          <Text style={styles.emptySubtitle}>
            {error?.message || 'Please check your connection and try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="checkmark-circle" size={48} color={colors.success.main} />
          <Text style={styles.emptyTitle}>All Clear!</Text>
          <Text style={styles.emptySubtitle}>
            {selectedType !== 'all'
              ? `No ${selectedType.replace('_', ' ').toLowerCase()} alerts`
              : 'No inventory alerts at this time'}
          </Text>
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
          <Text style={styles.headerTitle}>Inventory Alerts</Text>
          <Text style={styles.headerSubtitle}>Stock & expiry notifications</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <Ionicons name="refresh" size={24} color={colors.primary.main} />
          )}
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.error.main + '15' }]}>
          <Ionicons name="trending-down" size={24} color={colors.error.main} />
          <Text style={[styles.summaryCount, { color: colors.error.main }]}>
            {alerts.filter((a) => a.alert_type === 'LOW_STOCK' && !a.is_acknowledged).length}
          </Text>
          <Text style={styles.summaryLabel}>Low Stock</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.warning.main + '15' }]}>
          <Ionicons name="time" size={24} color={colors.warning.main} />
          <Text style={[styles.summaryCount, { color: colors.warning.main }]}>
            {alerts.filter((a) => a.alert_type === 'EXPIRY_WARNING' && !a.is_acknowledged).length}
          </Text>
          <Text style={styles.summaryLabel}>Expiring</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.grey[200] }]}>
          <Ionicons name="alert-circle" size={24} color={colors.error.dark} />
          <Text style={[styles.summaryCount, { color: colors.error.dark }]}>
            {alerts.filter((a) => a.alert_type === 'EXPIRED' && !a.is_acknowledged).length}
          </Text>
          <Text style={styles.summaryLabel}>Expired</Text>
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={alerts}
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
  refreshButton: {
    padding: spacing.xs,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
  },
  summaryCount: {
    ...typography.h4,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  headerContainer: {
    paddingTop: spacing.md,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
  },
  filterChipText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.text.light,
  },
  acknowledgedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  acknowledgedToggleActive: {
    backgroundColor: colors.info.main,
  },
  acknowledgedToggleText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  acknowledgedToggleTextActive: {
    color: colors.text.light,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  resultsText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  acknowledgeAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.success.main + '15',
  },
  acknowledgeAllText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.success.main,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
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
