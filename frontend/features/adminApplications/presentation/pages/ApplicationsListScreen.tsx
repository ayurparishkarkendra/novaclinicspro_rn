/**
 * Tenant Applications List Screen
 * Super Admin screen to review and manage tenant applications
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../core/theme/spacing';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useApplicationsListQuery,
  useReviewApplicationMutation,
  useActivateApplicationMutation,
  useSuspendApplicationMutation,
  useReactivateApplicationMutation,
} from '../../data/repositories/adminApplications.repository.impl';
import { TenantApplicationListItemResponse } from '../../data/models/adminApplications.dtos';

export default function ApplicationsListScreen() {
  const theme = useClinicTheme();
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>('pending_review');

  const {
    data: applications,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useApplicationsListQuery({
    search: searchQuery || undefined,
    status: selectedStatus,
  });

  const handleLogout = () => {
    router.back();
  };

  const handleQuickAction = (
    applicationId: string,
    action: 'approve' | 'reject' | 'activate' | 'suspend' | 'reactivate'
  ) => {
    const actionLabels = {
      approve: 'Approve',
      reject: 'Reject',
      activate: 'Activate',
      suspend: 'Suspend',
      reactivate: 'Reactivate',
    };

    Alert.alert(
      `${actionLabels[action]} Application`,
      `Are you sure you want to ${action} this application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabels[action],
          style: action === 'reject' || action === 'suspend' ? 'destructive' : 'default',
          onPress: () => {
            // Navigate to detail screen for full review
            router.push(`/super-admin/applications/${applicationId}`);
          },
        },
      ]
    );
  };

  const renderApplicationItem = ({ item }: { item: TenantApplicationListItemResponse }) => (
    <TouchableOpacity
      style={[
        styles.applicationCard,
        {
          backgroundColor: theme.colors.surface.default,
          borderColor: theme.colors.border.default,
        },
      ]}
      onPress={() => router.push(`/super-admin/applications/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.applicationHeader}>
        <View style={styles.applicationInfo}>
          <Text style={[styles.tenantName, { color: theme.colors.text.primary }]}>
            {item.tenant_name}
          </Text>
          <Text style={[styles.applicationMeta, { color: theme.colors.text.secondary }]}>
            {item.clinic_type} • {item.region || 'N/A'}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'approved' || item.status === 'active'
                  ? theme.colors.feedback.successLight
                  : item.status === 'rejected' || item.status === 'suspended'
                  ? theme.colors.feedback.errorLight
                  : theme.colors.feedback.warningLight,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === 'approved' || item.status === 'active'
                    ? theme.colors.feedback.success
                    : item.status === 'rejected' || item.status === 'suspended'
                    ? theme.colors.feedback.error
                    : theme.colors.feedback.warning,
              },
            ]}
          >
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.contactDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color={theme.colors.text.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
            {item.contact_name}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={14} color={theme.colors.text.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
            {item.contact_email}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color={theme.colors.text.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.text.secondary }]}>
            {item.contact_phone}
          </Text>
        </View>
      </View>

      {item.risk_score !== undefined && (
        <View style={styles.riskRow}>
          <Ionicons
            name="shield-outline"
            size={14}
            color={
              item.risk_score < 30
                ? theme.colors.feedback.success
                : item.risk_score < 70
                ? theme.colors.feedback.warning
                : theme.colors.feedback.error
            }
          />
          <Text
            style={[
              styles.riskText,
              {
                color:
                  item.risk_score < 30
                    ? theme.colors.feedback.success
                    : item.risk_score < 70
                    ? theme.colors.feedback.warning
                    : theme.colors.feedback.error,
              },
            ]}
          >
            Risk Score: {item.risk_score}
          </Text>
        </View>
      )}

      <View style={styles.applicationFooter}>
        <Text style={[styles.submittedText, { color: theme.colors.text.tertiary }]}>
          Submitted {new Date(item.submitted_at).toLocaleDateString()}
        </Text>
        <View style={styles.quickActions}>
          {item.status === 'pending_review' && (
            <>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.colors.feedback.success }]}
                onPress={() => handleQuickAction(item.id, 'approve')}
              >
                <Ionicons name="checkmark" size={16} color={theme.colors.primary.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.colors.feedback.error }]}
                onPress={() => handleQuickAction(item.id, 'reject')}
              >
                <Ionicons name="close" size={16} color={theme.colors.primary.onPrimary} />
              </TouchableOpacity>
            </>
          )}
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={theme.colors.text.tertiary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        No Applications Found
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {searchQuery
          ? 'Try adjusting your search or filters'
          : 'New applications will appear here'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle" size={64} color={theme.colors.feedback.error} />
      <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
        Unable to Load Applications
      </Text>
      <Text style={[styles.errorSubtitle, { color: theme.colors.text.secondary }]}>
        {error?.message || 'An error occurred. Please try again.'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.colors.primary.default }]}
        onPress={() => refetch()}
      >
        <Text style={[styles.retryButtonText, { color: theme.colors.primary.onPrimary }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      edges={['top']}
    >
      {/* Navigation Header */}
      <View style={[styles.navHeader, { backgroundColor: theme.colors.surface.default }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.colors.text.primary }]}>
          Tenant Applications
        </Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/super-admin')}
        >
          <Ionicons name="home-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>
        onLogoutPress={handleLogout}
      />

      {/* Filters */}
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface.default }]}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: theme.colors.background.default,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search by name or email..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statusFilters}>
          {['all', 'pending_review', 'approved', 'rejected', 'active'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedStatus === status || (status === 'all' && !selectedStatus)
                      ? theme.colors.primary.soft
                      : theme.colors.surface.default,
                  borderColor:
                    selectedStatus === status || (status === 'all' && !selectedStatus)
                      ? theme.colors.primary.default
                      : theme.colors.border.default,
                },
              ]}
              onPress={() => setSelectedStatus(status === 'all' ? undefined : status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      selectedStatus === status || (status === 'all' && !selectedStatus)
                        ? theme.colors.primary.default
                        : theme.colors.text.secondary,
                  },
                ]}
              >
                {status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Applications List */}
      {isLoading && !isFetching ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading applications...
          </Text>
        </View>
      ) : isError ? (
        renderError()
      ) : (
        <FlatList
          data={applications || []}
          renderItem={renderApplicationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary.default}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
    flexGrow: 1,
  },
  applicationCard: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  applicationInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  applicationMeta: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contactDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submittedText: {
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
