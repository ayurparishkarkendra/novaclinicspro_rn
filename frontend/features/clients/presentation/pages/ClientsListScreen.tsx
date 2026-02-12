/**
 * Clients List Screen
 * Displays list of all clients/patients for the clinic
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
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
  useClientsListQuery,
  useCreateClientMutation,
} from '../../data/repositories/clients.repository.impl';
import { ClientResponse, ClientCreate } from '../../data/models/clients.dtos';
import { ClientListItem } from '../components/ClientListItem';
import { ClientForm } from '../components/ClientForm';

export const ClientsListScreen: React.FC = () => {
  const router = useRouter();
  const { currentTenant } = useAuth();
  const tenantId = currentTenant?.id || '';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Queries
  const {
    data: clientsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useClientsListQuery(tenantId, {
    search: searchQuery || undefined,
    limit: 50,
  });

  // Mutations
  const createMutation = useCreateClientMutation(tenantId);

  const handleClientPress = useCallback(
    (client: ClientResponse) => {
      router.push(`/clinic-admin/clients/${client.id}`);
    },
    [router]
  );

  const handleCreateClient = useCallback(
    async (data: ClientCreate) => {
      try {
        await createMutation.mutateAsync(data);
        setShowAddModal(false);
        Alert.alert('Success', 'Client added successfully');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to add client');
      }
    },
    [createMutation]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients by name or phone..."
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
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Clients Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Add your first client to get started'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.background.default} />
          <Text style={styles.emptyButtonText}>Add Client</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Error state
  if (isError && !clientsData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>Could not load clients</Text>
          <Text style={styles.errorText}>
            {error?.message || 'Please check your connection and try again'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Clients</Text>
          <Text style={styles.pageSubtitle}>
            {clientsData?.total || 0} registered clients
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.background.default} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading clients...</Text>
        </View>
      ) : (
        <FlatList
          data={clientsData?.items || []}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          renderItem={({ item }) => (
            <ClientListItem client={item} onPress={handleClientPress} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary.main]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Client Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Client</Text>
            <View style={{ width: 24 }} />
          </View>
          <ClientForm
            onSubmit={handleCreateClient}
            onCancel={() => setShowAddModal(false)}
            isLoading={createMutation.isPending}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  backButton: {
    padding: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pageTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  pageSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  addButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.sm,
    borderRadius: 8,
  },
  header: {
    paddingBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  modalTitle: {
    ...typography.h6,
    color: colors.text.primary,
  },
});

export default ClientsListScreen;
