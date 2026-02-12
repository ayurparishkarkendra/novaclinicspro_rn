/**
 * TenantRolesScreen
 * Manage tenant roles (list, create, edit, delete)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { RoleListItem } from '../components/RoleListItem';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { useRbacTheme } from '../hooks/useRbacTheme';
import { useApiErrorHandler } from '../hooks/useApiErrorHandler';
import {
  useTenantRolesQuery,
  useCreateTenantRoleMutation,
  useUpdateTenantRoleMutation,
  useDeleteTenantRoleMutation,
} from '../../data/repositories/rbac.repository.impl';
import { TenantRoleResponse, TenantRoleCreate, TenantRoleUpdate } from '../../data/models/rbac.dtos';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export const TenantRolesScreen: React.FC = () => {
  const router = useRouter();
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { colors } = useRbacTheme();
  const { handleError } = useApiErrorHandler();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<TenantRoleResponse | null>(null);
  const [formData, setFormData] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });

  // Queries & Mutations
  const rolesQuery = useTenantRolesQuery(
    tenantId || '',
    { search: searchQuery || undefined, limit: 50 },
    { enabled: !!tenantId }
  );

  const createMutation = useCreateTenantRoleMutation(tenantId || '');
  const deleteMutation = useDeleteTenantRoleMutation(tenantId || '');

  const handleRefresh = useCallback(() => {
    rolesQuery.refetch();
  }, [rolesQuery]);

  const handleCreateRole = useCallback(async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Role name is required.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      Alert.alert('Success', 'Role created successfully.');
    } catch (error) {
      handleError(error, { contextMessage: 'Could not create role' });
    }
  }, [createMutation, formData, handleError]);

  const handleDeleteRole = useCallback((role: TenantRoleResponse) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(role.id);
              Alert.alert('Success', 'Role deleted successfully.');
            } catch (error) {
              handleError(error, { contextMessage: 'Could not delete role' });
            }
          },
        },
      ]
    );
  }, [deleteMutation, handleError]);

  const handleRolePress = useCallback((role: TenantRoleResponse) => {
    // Could navigate to role detail or show edit modal
    if (!role.is_system) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description || '' });
    }
  }, []);

  const handleEditRole = useCallback((role: TenantRoleResponse) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
  }, []);

  const renderRole = useCallback(({ item }: { item: TenantRoleResponse }) => (
    <RoleListItem
      role={item}
      onPress={handleRolePress}
      onEdit={!item.is_system ? handleEditRole : undefined}
      onDelete={!item.is_system ? handleDeleteRole : undefined}
    />
  ), [handleRolePress, handleEditRole, handleDeleteRole]);

  const renderEmptyList = useCallback(() => {
    if (searchQuery) {
      return (
        <EmptyState
          icon="search"
          title="No Roles Found"
          description={`No roles match "${searchQuery}"`}
        />
      );
    }
    return (
      <EmptyState
        icon="shield-checkmark"
        title="No Roles Yet"
        description="Create your first custom role to manage user permissions."
        actionLabel="Create Role"
        onAction={() => setShowCreateModal(true)}
      />
    );
  }, [searchQuery]);

  if (!tenantId) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="No Tenant Selected"
          message="Please select a tenant to manage roles."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (rolesQuery.isLoading && !rolesQuery.data) {
    return (
      <SafeAreaView style={styles.container}>
        <DashboardHeader
          title="Tenant Roles"
          subtitle="Loading..."
          onBackPress={() => router.back()}
        />
        <LoadingState message="Loading roles..." />
      </SafeAreaView>
    );
  }

  if (rolesQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <DashboardHeader
          title="Tenant Roles"
          subtitle="Error"
          onBackPress={() => router.back()}
        />
        <ErrorState
          title="Failed to Load Roles"
          message="Could not load roles for this tenant."
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Tenant Roles"
        subtitle={`${rolesQuery.data?.total || 0} roles`}
        onBackPress={() => router.back()}
      />

      {/* Search & Actions Bar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roles..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search roles"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary.main }]}
          onPress={() => setShowCreateModal(true)}
          accessibilityLabel="Create new role"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Roles List */}
      <FlatList
        data={rolesQuery.data?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderRole}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={rolesQuery.isRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal || !!editingRole}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          setEditingRole(null);
          setFormData({ name: '', description: '' });
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRole ? 'Edit Role' : 'Create Role'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingRole(null);
                  setFormData({ name: '', description: '' });
                }}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Role Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter role name"
                placeholderTextColor={colors.text.tertiary}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                accessibilityLabel="Role name input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter role description (optional)"
                placeholderTextColor={colors.text.tertiary}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Role description input"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary.main },
                (createMutation.isPending) && styles.disabledButton,
              ]}
              onPress={handleCreateRole}
              disabled={createMutation.isPending}
              accessibilityLabel={editingRole ? 'Update role' : 'Create role'}
              accessibilityRole="button"
            >
              <Text style={styles.submitButtonText}>
                {createMutation.isPending
                  ? 'Saving...'
                  : editingRole
                  ? 'Update Role'
                  : 'Create Role'}
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4EC',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  modalTitle: {
    ...typography.h5,
    color: '#1F2937',
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
  submitButton: {
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
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

export default TenantRolesScreen;
