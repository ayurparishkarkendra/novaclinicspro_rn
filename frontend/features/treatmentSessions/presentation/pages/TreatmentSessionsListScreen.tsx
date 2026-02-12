/**
 * Treatment Sessions List Screen
 * Displays list of all treatment sessions for the clinic
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
  useTreatmentSessionsListQuery,
  useStartTreatmentSessionMutation,
} from '../../data/repositories/treatmentSessions.repository.impl';
import {
  TreatmentSessionResponse,
  SESSION_STATUSES,
  getSessionStatusLabel,
  getSessionStatusColor,
} from '../../data/models/treatmentSessions.dtos';
import { TreatmentSessionListItem } from '../components/TreatmentSessionListItem';

export const TreatmentSessionsListScreen: React.FC = () => {
  const router = useRouter();
  const { currentTenant } = useAuth();
  const tenantId = currentTenant?.id || '';

  // State
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');

  // Queries
  const {
    data: sessionsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTreatmentSessionsListQuery(tenantId, {
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    limit: 50,
  });

  // Mutations
  const startMutation = useStartTreatmentSessionMutation(tenantId);

  const handleSessionPress = useCallback(
    (session: TreatmentSessionResponse) => {
      router.push(`/clinic-admin/treatment-sessions/${session.id}`);
    },
    [router]
  );

  const handleStartSession = useCallback(
    async (session: TreatmentSessionResponse) => {
      Alert.alert(
        'Start Session',
        `Start therapy session for ${session.client_name || 'this client'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              try {
                await startMutation.mutateAsync(session.id);
                Alert.alert('Success', 'Session started');
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to start session');
              }
            },
          },
        ]
      );
    },
    [startMutation]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Status Filters */}
      <Text style={styles.filterLabel}>Filter by Status</Text>
      <FlatList
        horizontal
        data={['all', ...SESSION_STATUSES]}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const isAll = item === 'all';
          const statusColor = isAll ? colors.primary.main : getSessionStatusColor(item);
          const isSelected = selectedStatus === item;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                isSelected && { backgroundColor: statusColor, borderColor: statusColor },
              ]}
              onPress={() => setSelectedStatus(item)}
            >
              {!isAll && (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isSelected ? colors.background.default : statusColor },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected,
                ]}
              >
                {isAll ? 'All' : getSessionStatusLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item}
      />
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Treatment Sessions Found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedStatus !== 'all'
          ? `No ${getSessionStatusLabel(selectedStatus).toLowerCase()} sessions`
          : 'Treatment sessions will appear here once appointments are scheduled'}
      </Text>
    </View>
  );

  // Error state
  if (isError && !sessionsData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>Could not load sessions</Text>
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
          <Text style={styles.pageTitle}>Treatment Sessions</Text>
          <Text style={styles.pageSubtitle}>
            {sessionsData?.total || 0} sessions
          </Text>
        </View>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : (
        <FlatList
          data={sessionsData?.items || []}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          renderItem={({ item }) => (
            <TreatmentSessionListItem
              session={item}
              onPress={handleSessionPress}
            />
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
  header: {
    paddingBottom: spacing.md,
  },
  filterLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  filterList: {
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  filterChipTextSelected: {
    color: colors.background.default,
    fontWeight: '600',
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
});

export default TreatmentSessionsListScreen;
