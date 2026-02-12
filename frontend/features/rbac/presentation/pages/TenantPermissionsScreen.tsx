/**
 * TenantPermissionsScreen
 * View and toggle tenant permissions
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { PermissionToggle } from '../components/PermissionToggle';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { useRbacTheme } from '../hooks/useRbacTheme';
import { useApiErrorHandler } from '../hooks/useApiErrorHandler';
import {
  useTenantPermissionsQuery,
  useToggleTenantPermissionMutation,
} from '../../data/repositories/rbac.repository.impl';
import { TenantPermissionResponse } from '../../data/models/rbac.dtos';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export const TenantPermissionsScreen: React.FC = () => {
  const router = useRouter();
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { colors, getModuleColor } = useRbacTheme();
  const { handleError } = useApiErrorHandler();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Queries & Mutations
  const permissionsQuery = useTenantPermissionsQuery(
    tenantId || '',
    { limit: 200 },
    { enabled: !!tenantId }
  );

  const toggleMutation = useToggleTenantPermissionMutation(tenantId || '');

  // Group permissions by module
  const sections = useMemo(() => {
    const items = permissionsQuery.data?.items || [];
    
    // Filter by search and module
    let filtered = items;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          (p.description?.toLowerCase().includes(query))
      );
    }
    if (selectedModule) {
      filtered = filtered.filter((p) => p.module === selectedModule);
    }

    // Group by module
    const grouped = filtered.reduce((acc, permission) => {
      const module = permission.module || 'OTHER';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {} as Record<string, TenantPermissionResponse[]>);

    // Convert to sections format
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, data]) => ({
        title: module,
        data,
        activeCount: data.filter((p) => p.is_active).length,
        totalCount: data.length,
      }));
  }, [permissionsQuery.data?.items, searchQuery, selectedModule]);

  // Get unique modules for filter
  const modules = useMemo(() => {
    const items = permissionsQuery.data?.items || [];
    return [...new Set(items.map((p) => p.module))].sort();
  }, [permissionsQuery.data?.items]);

  const handleRefresh = useCallback(() => {
    permissionsQuery.refetch();
  }, [permissionsQuery]);

  const handleTogglePermission = useCallback(
    async (permissionId: string, isActive: boolean) => {
      setTogglingIds((prev) => new Set(prev).add(permissionId));
      
      try {
        await toggleMutation.mutateAsync({
          permissionId,
          payload: { is_active: isActive },
        });
      } catch (error) {
        handleError(error, {
          contextMessage: `Could not ${isActive ? 'enable' : 'disable'} permission`,
        });
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(permissionId);
          return next;
        });
      }
    },
    [toggleMutation, handleError]
  );

  const renderPermission = useCallback(
    ({ item }: { item: TenantPermissionResponse }) => (
      <PermissionToggle
        permission={item}
        isLoading={togglingIds.has(item.id)}
        onToggle={handleTogglePermission}
      />
    ),
    [togglingIds, handleTogglePermission]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string; activeCount: number; totalCount: number } }) => (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View
            style={[
              styles.moduleIndicator,
              { backgroundColor: getModuleColor(section.title) },
            ]}
          />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Text style={styles.sectionCount}>
          {section.activeCount}/{section.totalCount} enabled
        </Text>
      </View>
    ),
    [getModuleColor]
  );

  const renderEmptyList = useCallback(() => {
    if (searchQuery || selectedModule) {
      return (
        <EmptyState
          icon="search"
          title="No Permissions Found"
          description="Try adjusting your search or filter criteria."
        />
      );
    }
    return (
      <EmptyState
        icon="key"
        title="No Permissions"
        description="This tenant has no permissions configured yet."
      />
    );
  }, [searchQuery, selectedModule]);

  if (!tenantId) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="No Tenant Selected"
          message="Please select a tenant to manage permissions."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (permissionsQuery.isLoading && !permissionsQuery.data) {
    return (
      <SafeAreaView style={styles.container}>
        <DashboardHeader
          title="Tenant Permissions"
          subtitle="Loading..."
          onBackPress={() => router.back()}
        />
        <LoadingState message="Loading permissions..." />
      </SafeAreaView>
    );
  }

  if (permissionsQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <DashboardHeader
          title="Tenant Permissions"
          subtitle="Error"
          onBackPress={() => router.back()}
        />
        <ErrorState
          title="Failed to Load Permissions"
          message="Could not load permissions for this tenant."
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  const totalActive = permissionsQuery.data?.items.filter((p) => p.is_active).length || 0;
  const totalPermissions = permissionsQuery.data?.total || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Tenant Permissions"
        subtitle={`${totalActive}/${totalPermissions} enabled`}
        onBackPress={() => router.back()}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search permissions..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search permissions"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Module Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedModule && styles.filterChipActive,
            !selectedModule && { backgroundColor: colors.primary.main },
          ]}
          onPress={() => setSelectedModule(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              !selectedModule && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {modules.map((module) => (
          <TouchableOpacity
            key={module}
            style={[
              styles.filterChip,
              selectedModule === module && styles.filterChipActive,
              selectedModule === module && { backgroundColor: getModuleColor(module) },
            ]}
            onPress={() => setSelectedModule(module === selectedModule ? null : module)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedModule === module && styles.filterChipTextActive,
              ]}
            >
              {module}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Permissions List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderPermission}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        stickySectionHeadersEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={permissionsQuery.isRefetching}
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body1,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
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
  filterChipActive: {
    borderColor: 'transparent',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: '#F8F4EC',
    marginTop: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moduleIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionCount: {
    ...typography.caption,
    color: '#6B7280',
  },
});

export default TenantPermissionsScreen;
