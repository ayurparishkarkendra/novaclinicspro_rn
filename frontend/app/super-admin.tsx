import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

export default function SuperAdminDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Super Admin Dashboard"
        subtitle="System Overview"
        userName="Admin"
        onNotificationPress={() => console.log('Notifications')}
        onProfilePress={() => console.log('Profile')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System-wide Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <StatCard
                title="Total Clinics"
                value="47"
                icon="business"
                color={colors.primary.main}
                trend={{ value: '+5 this month', isPositive: true }}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Active Subscriptions"
                value="45"
                icon="checkmark-circle"
                color={colors.success.main}
                trend={{ value: '95.7% active', isPositive: true }}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Total Revenue"
                value="$127.5K"
                icon="cash"
                color={colors.warning.main}
                trend={{ value: '+12% vs last month', isPositive: true }}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Total Patients"
                value="8,492"
                icon="people"
                color={colors.info.main}
                trend={{ value: '+342 this month', isPositive: true }}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickActionButton
              icon="add-circle"
              label="Onboard Clinic"
              onPress={() => console.log('Onboard')}
              color={colors.primary.main}
            />
            <QuickActionButton
              icon="business"
              label="Manage Clinics"
              onPress={() => console.log('Manage')}
              color={colors.secondary.main}
            />
            <QuickActionButton
              icon="card"
              label="Subscriptions"
              onPress={() => console.log('Subscriptions')}
              color={colors.success.main}
            />
            <QuickActionButton
              icon="bar-chart"
              label="Analytics"
              onPress={() => console.log('Analytics')}
              color={colors.info.main}
            />
            <QuickActionButton
              icon="settings"
              label="System Config"
              onPress={() => console.log('Settings')}
              color={colors.warning.main}
            />
            <QuickActionButton
              icon="people"
              label="User Management"
              onPress={() => console.log('Users')}
              color={colors.error.main}
            />
          </View>
        </View>

        {/* Recent Clinic Onboarding */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Clinic Onboarding</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {[
            {
              name: 'Central Healthcare Clinic',
              location: 'New York, NY',
              status: 'Completed',
              date: 'Jan 15, 2025',
            },
            {
              name: 'Wellness Therapy Center',
              location: 'Los Angeles, CA',
              status: 'In Progress',
              date: 'Jan 14, 2025',
            },
            {
              name: 'Advanced Rehab Institute',
              location: 'Chicago, IL',
              status: 'Pending',
              date: 'Jan 13, 2025',
            },
          ].map((clinic, index) => (
            <TouchableOpacity key={index} style={styles.clinicCard}>
              <View style={styles.clinicInfo}>
                <View style={styles.clinicIconContainer}>
                  <Ionicons
                    name="business"
                    size={24}
                    color={colors.primary.main}
                  />
                </View>
                <View style={styles.clinicDetails}>
                  <Text style={styles.clinicName}>{clinic.name}</Text>
                  <Text style={styles.clinicLocation}>{clinic.location}</Text>
                  <Text style={styles.clinicDate}>{clinic.date}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      clinic.status === 'Completed'
                        ? colors.success.main + '20'
                        : clinic.status === 'In Progress'
                        ? colors.warning.main + '20'
                        : colors.grey[200],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        clinic.status === 'Completed'
                          ? colors.success.main
                          : clinic.status === 'In Progress'
                          ? colors.warning.main
                          : colors.text.secondary,
                    },
                  ]}
                >
                  {clinic.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation to Other Dashboards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Switch Dashboard</Text>
          <View style={styles.dashboardLinks}>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/clinic-admin')}
            >
              <Ionicons name="business" size={20} color={colors.primary.main} />
              <Text style={styles.dashboardLinkText}>Clinic Admin</Text>
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
  clinicCard: {
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
  clinicInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  clinicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  clinicDetails: {
    flex: 1,
  },
  clinicName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  clinicLocation: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  clinicDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
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
