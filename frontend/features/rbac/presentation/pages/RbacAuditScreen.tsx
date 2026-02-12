/**
 * RbacAuditScreen
 * View RBAC audit history for a tenant
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { AuditHistoryItem } from '../components/AuditHistoryItem';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { useRbacTheme } from '../hooks/useRbacTheme';
import {
  useRbacAuditHistoryQuery,
  useTenantRolesQuery,
} from '../../data/repositories/rbac.repository.impl';
import {
  TenantUserRoleHistoryResponse,
  TenantRoleResponse,
} from '../../data/models/rbac.dtos';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

const ACTION_FILTERS = [
  { key: null, label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'removed', label: 'Removed' },
  { key: 'updated', label: 'Updated' },
  { key: 'expired', label: 'Expired' },
] as const;

export const RbacAuditScreen: React.FC = () => {
  const router = useRouter();
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { colors, getActionColor } = useRbacTheme();

  // State
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Queries
  const auditQuery = useRbacAuditHistoryQuery(
    tenantId || '',
    { action: selectedAction || undefined, limit: 100 },
    { enabled: !!tenantId }
  );

  const rolesQuery = useTenantRolesQuery(
    tenantId || '',
    { limit: 100 },
    { enabled: !!tenantId }
  );

  // Create roles lookup map
  const rolesMap = useMemo(() => {
    const map = new Map<string, TenantRoleResponse>();
    rolesQuery.data?.items.forEach((role) => map.set(role.id, role));
    return map;
  }, [rolesQuery.data?.items]);

  const handleRefresh = useCallback(() => {
    auditQuery.refetch();
  }, [auditQuery]);

  const renderAuditItem = useCallback(
    ({ item }: { item: TenantUserRoleHistoryResponse }) => {
      const role = rolesMap.get(item.role_id);
      return (
        <AuditHistoryItem
          item={item}
          roleName={role?.name}
        />
      );
    },
    [rolesMap]
  );

  const renderEmptyList = useCallback(() => {
    if (selectedAction) {
      return (
        <EmptyState
          icon="filter"
          title="No History Found"
          description={`No audit entries for "${selectedAction}" action.`}
        />
      );
    }
    return (
      <EmptyState
        icon="time"
        title="No Audit History"
        description="Role changes will be recorded here for audit purposes."
      />
    );
  }, [selectedAction]);

  if (!tenantId) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="No Tenant Selected"
          message="Please select a tenant to view audit history."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (auditQuery.isLoading && !auditQuery.data) {
    return (
      <SafeAreaView style={styles.container}>
        <DashboardHeader
          title="RBAC Audit History"
          subtitle="Loading..."
          onBackPress={() => router.back()}
        />
        <LoadingState message="Loading audit history..." />
      </SafeAreaView>
    );
  }

  if (auditQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <DashboardHeader
          title="RBAC Audit History"
          subtitle="Error"
          onBackPress={() => router.back()}
        />
        <ErrorState
          title="Failed to Load Audit History"
          message="Could not load audit history for this tenant."
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="RBAC Audit History"
        subtitle={`${auditQuery.data?.total || 0} entries`}
        onBackPress={() => router.back()}
      />

      {/* Action Filter */}
      <View style={styles.filterContainer}>
        {ACTION_FILTERS.map((filter) => {
          const isSelected = selectedAction === filter.key;
          const bgColor = isSelected
            ? filter.key
              ? getActionColor(filter.key)
              : colors.primary.main
            : '#FFFFFF';
          return (
            <TouchableOpacity
              key={filter.key || 'all'}
              style={[
                styles.filterChip,
                isSelected && { backgroundColor: bgColor, borderColor: bgColor },
              ]}
              onPress={() => setSelectedAction(filter.key)}
              accessibilityLabel={`Filter by ${filter.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Audit List */}
      <FlatList
        data={auditQuery.data?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderAuditItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={auditQuery.isRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4EC',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});

export default RbacAuditScreen;
