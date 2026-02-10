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
import { DashboardHeader } from '../../core/components/DashboardHeader';
import { StatCard } from '../../core/components/StatCard';
import { QuickActionButton } from '../../core/components/QuickActionButton';
import { colors } from '../../core/theme/colors';
import { spacing } from '../../core/theme/spacing';
import { typography } from '../../core/theme/typography';

export default function DoctorDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Doctor Dashboard"
        subtitle="Welcome back, Doctor"
        userName="Dr. James Anderson"
        onNotificationPress={() => console.log('Notifications')}
        onProfilePress={() => console.log('Profile')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <StatCard
                title="Appointments"
                value="12"
                icon="calendar"
                color={colors.primary.main}
                trend={{ value: '4 completed', isPositive: true }}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Pending Prescriptions"
                value="7"
                icon="document-text"
                color={colors.warning.main}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Active Cases"
                value="28"
                icon="folder-open"
                color={colors.info.main}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Consultations"
                value="156"
                icon="people"
                color={colors.success.main}
                trend={{ value: 'This month', isPositive: true }}
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
              label="New Case"
              onPress={() => console.log('New Case')}
              color={colors.primary.main}
            />
            <QuickActionButton
              icon="document-text"
              label="Prescription"
              onPress={() => console.log('Prescription')}
              color={colors.success.main}
            />
            <QuickActionButton
              icon="search"
              label="Patient Search"
              onPress={() => console.log('Search')}
              color={colors.info.main}
            />
            <QuickActionButton
              icon="folder"
              label="Case Sheets"
              onPress={() => console.log('Cases')}
              color={colors.secondary.main}
            />
            <QuickActionButton
              icon="bar-chart"
              label="Reports"
              onPress={() => console.log('Reports')}
              color={colors.warning.main}
            />
            <QuickActionButton
              icon="time"
              label="Schedule"
              onPress={() => console.log('Schedule')}
              color={colors.text.secondary}
            />
          </View>
        </View>

        {/* Today's Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {[
            {
              patient: 'Robert Thompson',
              time: '10:00 AM',
              type: 'Follow-up',
              status: 'Upcoming',
              condition: 'Hypertension',
            },
            {
              patient: 'Maria Garcia',
              time: '10:30 AM',
              type: 'New Patient',
              status: 'Upcoming',
              condition: 'General Checkup',
            },
            {
              patient: 'David Lee',
              time: '11:00 AM',
              type: 'Consultation',
              status: 'Upcoming',
              condition: 'Diabetes Management',
            },
          ].map((appointment, index) => (
            <TouchableOpacity key={index} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.patientInfo}>
                  <View style={styles.patientAvatar}>
                    <Ionicons name="person" size={24} color={colors.primary.main} />
                  </View>
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientName}>{appointment.patient}</Text>
                    <Text style={styles.appointmentType}>{appointment.type}</Text>
                  </View>
                </View>
                <View style={styles.timeContainer}>
                  <Ionicons name="time" size={16} color={colors.primary.main} />
                  <Text style={styles.timeText}>{appointment.time}</Text>
                </View>
              </View>
              <View style={styles.appointmentFooter}>
                <View style={styles.conditionTag}>
                  <Ionicons name="medical" size={14} color={colors.info.main} />
                  <Text style={styles.conditionText}>{appointment.condition}</Text>
                </View>
                <TouchableOpacity style={styles.startButton}>
                  <Text style={styles.startButtonText}>Start</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.background.default} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Prescriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Prescriptions</Text>
          {[
            { patient: 'Emma Wilson', age: 45, reason: 'Post-surgery medication' },
            { patient: 'John Davis', age: 62, reason: 'Chronic pain management' },
            { patient: 'Lisa Brown', age: 38, reason: 'Infection treatment' },
          ].map((prescription, index) => (
            <TouchableOpacity key={index} style={styles.prescriptionCard}>
              <View style={styles.prescriptionInfo}>
                <View style={styles.prescriptionIcon}>
                  <Ionicons name="document-text" size={24} color={colors.warning.main} />
                </View>
                <View style={styles.prescriptionDetails}>
                  <Text style={styles.prescriptionPatient}>
                    {prescription.patient}, {prescription.age}y
                  </Text>
                  <Text style={styles.prescriptionReason}>{prescription.reason}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </TouchableOpacity>
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
              onPress={() => router.push('/clinic-admin')}
            >
              <Ionicons name="business" size={20} color={colors.success.main} />
              <Text style={styles.dashboardLinkText}>Clinic Admin</Text>
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
  appointmentCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  patientInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  appointmentType: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  conditionText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  startButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  prescriptionCard: {
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
  prescriptionInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  prescriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.warning.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  prescriptionDetails: {
    flex: 1,
  },
  prescriptionPatient: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  prescriptionReason: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  createButton: {
    backgroundColor: colors.warning.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  createButtonText: {
    ...typography.button,
    color: colors.background.default,
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
