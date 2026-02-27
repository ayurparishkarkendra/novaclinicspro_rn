/**
 * Staff Management Screen (Placeholder)
 * Shows mock staff data with disabled actions
 * "Coming Soon" functionality indicator
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { spacing } from '../../core/theme/spacing';
import { typography } from '../../core/theme/typography';

type StaffStatus = 'active' | 'on_leave' | 'inactive';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: StaffStatus;
  avatar: string;
}

// Mock staff data
const MOCK_STAFF: StaffMember[] = [
  {
    id: '1',
    name: 'Dr. Priya Sharma',
    role: 'Doctor',
    email: 'priya.sharma@clinic.com',
    phone: '+91 98765 43210',
    status: 'active',
    avatar: 'P',
  },
  {
    id: '2',
    name: 'Ravi Kumar',
    role: 'Therapist',
    email: 'ravi.kumar@clinic.com',
    phone: '+91 98765 43211',
    status: 'active',
    avatar: 'R',
  },
  {
    id: '3',
    name: 'Anita Desai',
    role: 'Receptionist',
    email: 'anita.desai@clinic.com',
    phone: '+91 98765 43212',
    status: 'active',
    avatar: 'A',
  },
  {
    id: '4',
    name: 'Suresh Patel',
    role: 'Therapist',
    email: 'suresh.patel@clinic.com',
    phone: '+91 98765 43213',
    status: 'on_leave',
    avatar: 'S',
  },
  {
    id: '5',
    name: 'Meena Reddy',
    role: 'Nurse',
    email: 'meena.reddy@clinic.com',
    phone: '+91 98765 43214',
    status: 'inactive',
    avatar: 'M',
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return { label: 'Active', color: colors.success.main, bgColor: colors.success[50] };
    case 'on_leave':
      return { label: 'On Leave', color: colors.warning.main, bgColor: colors.warning[50] };
    case 'inactive':
      return { label: 'Inactive', color: colors.text.tertiary, bgColor: colors.grey[100] };
    default:
      return { label: 'Unknown', color: colors.text.tertiary, bgColor: colors.grey[100] };
  }
};

export default function StaffManagementScreen() {
  const router = useRouter();

  const handleAddStaff = () => {
    // Show coming soon toast/alert
    if (typeof window !== 'undefined') {
      window.alert('Coming Soon: Add staff functionality is under development.');
    }
  };

  const handleEditStaff = (staffId: string) => {
    if (typeof window !== 'undefined') {
      window.alert('Coming Soon: Edit staff functionality is under development.');
    }
  };

  const handleDeleteStaff = (staffId: string) => {
    if (typeof window !== 'undefined') {
      window.alert('Coming Soon: Remove staff functionality is under development.');
    }
  };

  const renderStaffCard = ({ item }: { item: StaffMember }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <View style={styles.staffCard} testID={`staff-card-${item.id}`}>
        <View style={styles.staffCardHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.avatar}</Text>
          </View>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{item.name}</Text>
            <Text style={styles.staffRole}>{item.role}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.staffDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        </View>

        <View style={styles.staffActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => handleEditStaff(item.id)}
            disabled
            testID={`edit-staff-${item.id}`}
          >
            <Ionicons name="pencil" size={16} color={colors.text.tertiary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => handleDeleteStaff(item.id)}
            disabled
            testID={`delete-staff-${item.id}`}
          >
            <Ionicons name="trash-outline" size={16} color={colors.text.tertiary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          testID="staff-management-back-button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={handleAddStaff}
          testID="add-staff-button"
        >
          <Ionicons name="add" size={24} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Coming Soon Banner */}
      <View style={styles.comingSoonBanner}>
        <View style={styles.comingSoonIcon}>
          <Ionicons name="construct" size={20} color={colors.warning.main} />
        </View>
        <View style={styles.comingSoonContent}>
          <Text style={styles.comingSoonTitle}>Staff Management Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Full staff management features are under development. Actions are currently disabled.
          </Text>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsSummary}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_STAFF.length}</Text>
          <Text style={styles.statLabel}>Total Staff</Text>
        </View>
        <View style={[styles.statItem, styles.statItemBorder]}>
          <Text style={[styles.statValue, { color: colors.success.main }]}>
            {MOCK_STAFF.filter(s => s.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning.main }]}>
            {MOCK_STAFF.filter(s => s.status === 'on_leave').length}
          </Text>
          <Text style={styles.statLabel}>On Leave</Text>
        </View>
      </View>

      {/* Staff List */}
      <FlatList
        data={MOCK_STAFF}
        renderItem={renderStaffCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.listHeader}>Staff Members ({MOCK_STAFF.length})</Text>
        }
        testID="staff-list"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  headerAddButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 20,
  },
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warning[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning.light,
    gap: spacing.md,
  },
  comingSoonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warning.main + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonTitle: {
    ...typography.subtitle2,
    color: colors.warning.dark,
    fontWeight: '600',
  },
  comingSoonText: {
    ...typography.caption,
    color: colors.warning.main,
    marginTop: 2,
  },
  statsSummary: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border.light,
  },
  statValue: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listHeader: {
    ...typography.subtitle2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  staffCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  staffCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h6,
    color: colors.common.white,
    fontWeight: '600',
  },
  staffInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  staffName: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  staffRole: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  staffDetails: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  staffActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  actionButtonPrimary: {
    backgroundColor: colors.grey[100],
  },
  actionButtonDanger: {
    backgroundColor: colors.grey[100],
  },
  actionButtonText: {
    ...typography.caption,
    fontWeight: '600',
  },
  actionButtonTextDisabled: {
    color: colors.text.tertiary,
  },
});
