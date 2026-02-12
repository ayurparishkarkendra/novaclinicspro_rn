/**
 * TenantUserRolesScreen
 * Manage user role assignments within a tenant
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { UserRoleCard } from '../components/UserRoleCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { useRbacTheme } from '../hooks/useRbacTheme';
import { useApiErrorHandler } from '../hooks/useApiErrorHandler';
import {
  useTenantUserRolesQuery,
  useTenantRolesQuery,
  useTenantUsersQuery,
  useAssignTenantUserRoleMutation,
  useRemoveTenantUserRoleMutation,
} from '../../data/repositories/rbac.repository.impl';
import {
  TenantUserRoleResponse,
  TenantRoleResponse,
  TenantUserResponse,
} from '../../data/models/rbac.dtos';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

export const TenantUserRolesScreen: React.FC = () => {
  const router = useRouter();
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { colors } = useRbacTheme();
  const { handleError } = useApiErrorHandler();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [assignReason, setAssignReason] = useState<string>('');

  // Queries & Mutations
  const userRolesQuery = useTenantUserRolesQuery(
    tenantId || '',
    { limit: 100 },
    { enabled: !!tenantId }
  );

  const rolesQuery = useTenantRolesQuery(
    tenantId || '',
    { is_active: true, limit: 50 },
    { enabled: !!tenantId }
  );

  const usersQuery = useTenantUsersQuery(
    tenantId || '',
    { is_active: true, limit: 100 },
    { enabled: !!tenantId }
  );

  const assignMutation = useAssignTenantUserRoleMutation(tenantId || '');
  const removeMutation = useRemoveTenantUserRoleMutation(tenantId || '');

  // Create lookup maps
  const rolesMap = useMemo(() => {
    const map = new Map<string, TenantRoleResponse>();
    rolesQuery.data?.items.forEach((role) => map.set(role.id, role));
    return map;
  }, [rolesQuery.data?.items]);

  const usersMap = useMemo(() => {
    const map = new Map<string, TenantUserResponse>();
    usersQuery.data?.items.forEach((user) => map.set(user.id, user));
    return map;
  }, [usersQuery.data?.items]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    const items = userRolesQuery.data?.items || [];
    if (!searchQuery) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((assignment) => {
      const role = rolesMap.get(assignment.role_id);
      return role?.name.toLowerCase().includes(query);
    });
  }, [userRolesQuery.data?.items, searchQuery, rolesMap]);

  const handleRefresh = useCallback(() => {
    userRolesQuery.refetch();
    rolesQuery.refetch();
    usersQuery.refetch();
  }, [userRolesQuery, rolesQuery, usersQuery]);

  const handleAssignRole = useCallback(async () => {
    if (!selectedUserId || !selectedRoleId) {
      Alert.alert('Validation Error', 'Please select both a user and a role.');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        tenant_user_id: selectedUserId,
        role_id: selectedRoleId,
        reason: assignReason.trim() || undefined,
      });
      setShowAssignModal(false);
      setSelectedUserId('');
      setSelectedRoleId('');
      setAssignReason('');
      Alert.alert('Success', 'Role assigned successfully.');
    } catch (error) {
      handleError(error, { contextMessage: 'Could not assign role' });
    }
  }, [assignMutation, selectedUserId, selectedRoleId, assignReason, handleError]);

  const handleRemoveRole = useCallback(
    (assignment: TenantUserRoleResponse) => {
      const role = rolesMap.get(assignment.role_id);
      Alert.alert(
        'Remove Role',
        `Are you sure you want to remove the "${role?.name || 'role'}" from this user?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeMutation.mutateAsync({
                  assignmentId: assignment.id,
                  payload: { reason: 'Removed by admin' },
                });
                Alert.alert('Success', 'Role removed successfully.');
              } catch (error) {
                handleError(error, { contextMessage: 'Could not remove role' });
              }
            },
          },
        ]
      );
    },
    [removeMutation, rolesMap, handleError]
  );

  const renderAssignment = useCallback(
    ({ item }: { item: TenantUserRoleResponse }) => {
      const role = rolesMap.get(item.role_id);
      const user = usersMap.get(item.tenant_user_id);
      return (
        <UserRoleCard
          assignment={item}
          role={role}
          userName={user ? `User ${user.user_id.slice(0, 8)}...` : undefined}
          onRemove={handleRemoveRole}
        />
      );
    },
    [rolesMap, usersMap, handleRemoveRole]
  );

  const renderEmptyList = useCallback(() => {
    if (searchQuery) {
      return (
        <EmptyState
          icon="search"
          title="No Assignments Found"
          description={`No role assignments match "${searchQuery}"`}
        />
      );
    }
    return (
      <EmptyState
        icon="person-add"
        title="No Role Assignments"
        description="Assign roles to users to grant them permissions."
        actionLabel="Assign Role"
        onAction={() => setShowAssignModal(true)}
      />
    );
  }, [searchQuery]);

  const isLoading = userRolesQuery.isLoading || rolesQuery.isLoading || usersQuery.isLoading;
  const isError = userRolesQuery.isError || rolesQuery.isError || usersQuery.isError;
  const isRefreshing = userRolesQuery.isRefetching || rolesQuery.isRefetching || usersQuery.isRefetching;

  if (!tenantId) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="No Tenant Selected"
          message="Please select a tenant to manage user roles."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (isLoading && !userRolesQuery.data) {
    return (
      <SafeAreaView style={styles.container}>
        <DashboardHeader
          title="User Roles"
          subtitle="Loading..."
          onBackPress={() => router.back()}
        />
        <LoadingState message="Loading user roles..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <DashboardHeader
          title="User Roles"
          subtitle="Error"
          onBackPress={() => router.back()}
        />
        <ErrorState
          title="Failed to Load User Roles"
          message="Could not load user role data."
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="User Roles"
        subtitle={`${userRolesQuery.data?.total || 0} assignments`}
        onBackPress={() => router.back()}
      />

      {/* Search & Actions Bar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by role..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search user role assignments"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary.main }]}
          onPress={() => setShowAssignModal(true)}
          accessibilityLabel="Assign role to user"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Assignments List */}
      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignment}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      />

      {/* Assign Role Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAssignModal(false);
          setSelectedUserId('');
          setSelectedRoleId('');
          setAssignReason('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Role</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAssignModal(false);
                  setSelectedUserId('');
                  setSelectedRoleId('');
                  setAssignReason('');
                }}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* User Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select User *</Text>
                <View style={styles.optionsList}>
                  {usersQuery.data?.items.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.optionItem,
                        selectedUserId === user.id && styles.optionItemSelected,
                        selectedUserId === user.id && { borderColor: colors.primary.main },
                      ]}
                      onPress={() => setSelectedUserId(user.id)}
                    >
                      <Ionicons
                        name={selectedUserId === user.id ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selectedUserId === user.id ? colors.primary.main : colors.text.tertiary}
                      />
                      <Text style={styles.optionText}>
                        User: {user.user_id.slice(0, 8)}...
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Role Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Role *</Text>
                <View style={styles.optionsList}>
                  {rolesQuery.data?.items.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.optionItem,
                        selectedRoleId === role.id && styles.optionItemSelected,
                        selectedRoleId === role.id && { borderColor: colors.primary.main },
                      ]}
                      onPress={() => setSelectedRoleId(role.id)}
                    >
                      <Ionicons
                        name={selectedRoleId === role.id ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selectedRoleId === role.id ? colors.primary.main : colors.text.tertiary}
                      />
                      <View style={styles.roleOptionContent}>
                        <Text style={styles.optionText}>{role.name}</Text>
                        {role.is_system && (
                          <View style={[styles.badge, { backgroundColor: '#6366F1' + '20' }]}>
                            <Text style={[styles.badgeText, { color: '#6366F1' }]}>System</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Reason (Optional) */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Reason (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Why is this role being assigned?"
                  placeholderTextColor={colors.text.tertiary}
                  value={assignReason}
                  onChangeText={setAssignReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Assignment reason input"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary.main },
                assignMutation.isPending && styles.disabledButton,
              ]}
              onPress={handleAssignRole}
              disabled={assignMutation.isPending}
              accessibilityLabel="Assign role"
              accessibilityRole="button"
            >
              <Text style={styles.submitButtonText}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign Role'}
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
  modalScroll: {
    flex: 1,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.sm,
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
    minHeight: 80,
    paddingTop: spacing.sm,
  },
  optionsList: {
    gap: spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
  },
  optionItemSelected: {
    backgroundColor: '#E8F5EE',
  },
  optionText: {
    ...typography.body2,
    color: '#1F2937',
  },
  roleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
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

export default TenantUserRolesScreen;
