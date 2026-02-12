import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardHeader } from '../core/components/DashboardHeader';
import { StatCard } from '../core/components/StatCard';
import { QuickActionButton } from '../core/components/QuickActionButton';
import { colors } from '../core/theme/colors';
import { spacing } from '../core/theme/spacing';
import { typography } from '../core/theme/typography';
import { useAuth } from '../features/auth/presentation/hooks/useAuth';

export default function ClinicAdminDashboard() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Clinic Admin Dashboard"
        subtitle="Springfield Medical Center"
        userName={currentUser?.fullName || 'Dr. Sarah Johnson'}
        onNotificationPress={() => console.log('Notifications')}
        onProfilePress={() => console.log('Profile')}
        onLogoutPress={handleLogout}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clinic Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <StatCard
                title="Total Appointments"
                value="42"
                icon="calendar"
                color={colors.primary.main}
                trend={{ value: '+8 vs yesterday', isPositive: true }}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Active Staff"
                value="28"
                icon="people"
                color={colors.success.main}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Daily Revenue"
                value="$3,240"
                icon="cash"
                color={colors.warning.main}
                trend={{ value: '+15% vs avg', isPositive: true }}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Inventory Alerts"
                value="5"
                icon="warning"
                color={colors.error.main}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickActionButton
              icon="person-add"
              label="Add Staff"
              onPress={() => console.log('Add Staff')}
              color={colors.primary.main}
            />
            <QuickActionButton
              icon="calendar"
              label="Schedule"
              onPress={() => console.log('Schedule')}
              color={colors.secondary.main}
            />
            <QuickActionButton
              icon="bar-chart"
              label="Reports"
              onPress={() => console.log('Reports')}
              color={colors.info.main}
            />
            <QuickActionButton
              icon="cube"
              label="Inventory"
              onPress={() => console.log('Inventory')}
              color={colors.warning.main}
            />
            <QuickActionButton
              icon="card"
              label="Billing"
              onPress={() => console.log('Billing')}
              color={colors.success.main}
            />
            <QuickActionButton
              icon="settings"
              label="Settings"
              onPress={() => router.push('/clinic-admin/settings')}
              color={colors.text.secondary}
            />
          </View>
        </View>

        {/* Clinic Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Clinic Settings</Text>
            <TouchableOpacity onPress={() => router.push('/clinic-admin/settings')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Configure your clinic operations</Text>
          
          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => router.push('/clinic-admin/settings/operating-hours')}
          >
            <View style={[styles.settingsIcon, { backgroundColor: colors.primary.main + '15' }]}>
              <Ionicons name="time-outline" size={24} color={colors.primary.main} />
            </View>
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Operating Hours</Text>
              <Text style={styles.settingsDescription}>Set clinic open/close times</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => router.push('/clinic-admin/settings/rooms')}
          >
            <View style={[styles.settingsIcon, { backgroundColor: colors.info.main + '15' }]}>
              <Ionicons name="grid-outline" size={24} color={colors.info.main} />
            </View>
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Rooms & Resources</Text>
              <Text style={styles.settingsDescription}>Manage therapy rooms</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => router.push('/clinic-admin/settings/treatments')}
          >
            <View style={[styles.settingsIcon, { backgroundColor: colors.warning.main + '15' }]}>
              <Ionicons name="leaf-outline" size={24} color={colors.warning.main} />
            </View>
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Treatments & Services</Text>
              <Text style={styles.settingsDescription}>Configure Ayurvedic treatments</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Staff Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff Status</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {[
            {
              name: 'Dr. Michael Chen',
              role: 'Doctor',
              status: 'In Session',
              appointments: 8,
              available: false,
            },
            {
              name: 'Emily Rodriguez',
              role: 'Therapist',
              status: 'Available',
              appointments: 5,
              available: true,
            },
            {
              name: 'James Wilson',
              role: 'Pharmacist',
              status: 'Available',
              appointments: 0,
              available: true,
            },
          ].map((staff, index) => (
            <TouchableOpacity key={index} style={styles.staffCard}>
              <View style={styles.staffInfo}>
                <View
                  style={[
                    styles.staffAvatar,
                    {
                      backgroundColor: staff.available
                        ? colors.success.main + '20'
                        : colors.warning.main + '20',
                    },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={24}
                    color={staff.available ? colors.success.main : colors.warning.main}
                  />
                </View>
                <View style={styles.staffDetails}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <Text style={styles.staffRole}>{staff.role}</Text>
                  <Text style={styles.staffAppointments}>
                    {staff.appointments} appointments today
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: staff.available
                      ? colors.success.main + '20'
                      : colors.warning.main + '20',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: staff.available
                        ? colors.success.main
                        : colors.warning.main,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: staff.available
                        ? colors.success.main
                        : colors.warning.main,
                    },
                  ]}
                >
                  {staff.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inventory Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          {[
            { item: 'Paracetamol 500mg', stock: '45 units', level: 'Low' },
            { item: 'Ibuprofen 400mg', stock: '12 units', level: 'Critical' },
            { item: 'Bandages (Large)', stock: '28 units', level: 'Low' },
          ].map((item, index) => (
            <View key={index} style={styles.inventoryCard}>
              <View style={styles.inventoryInfo}>
                <Ionicons name="cube" size={20} color={colors.warning.main} />
                <View style={styles.inventoryDetails}>
                  <Text style={styles.inventoryName}>{item.item}</Text>
                  <Text style={styles.inventoryStock}>{item.stock}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.levelBadge,
                  {
                    backgroundColor:
                      item.level === 'Critical'
                        ? colors.error.main + '20'
                        : colors.warning.main + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelText,
                    {
                      color:
                        item.level === 'Critical'
                          ? colors.error.main
                          : colors.warning.main,
                    },
                  ]}
                >
                  {item.level}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Switch Dashboard</Text>
          <View style={styles.dashboardLinks}>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/super-admin')}
            >
              <Ionicons name="shield-checkmark" size={20} color={colors.primary.main} />
              <Text style={styles.dashboardLinkText}>Super Admin</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/doctor')}
            >
              <Ionicons name="medical" size={20} color={colors.success.main} />
              <Text style={styles.dashboardLinkText}>Doctor</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/therapist')}
            >
              <Ionicons name="heart" size={20} color={colors.error.main} />
              <Text style={styles.dashboardLinkText}>Therapist</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  viewAll: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  statsGrid: {
    gap: spacing.md,
  },
  statItem: {
    marginBottom: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  staffCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  staffInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  staffRole: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  staffAppointments: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusIndicator: {
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
  inventoryCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  inventoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  inventoryDetails: {
    flex: 1,
  },
  inventoryName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  inventoryStock: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    ...typography.caption,
    fontWeight: '600',
  },
  dashboardLinks: {
    gap: spacing.sm,
  },
  dashboardLink: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dashboardLinkText: {
    ...typography.body1,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
});
