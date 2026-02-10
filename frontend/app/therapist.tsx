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

export default function TherapistDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Therapist Dashboard"
        subtitle="Physical Therapy Center"
        userName="Emily Rodriguez"
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
                title="Sessions Today"
                value="8"
                icon="fitness"
                color={colors.primary.main}
                trend={{ value: '3 completed', isPositive: true }}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Active Therapy Plans"
                value="24"
                icon="calendar"
                color={colors.success.main}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Patients in Progress"
                value="32"
                icon="people"
                color={colors.info.main}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Completion Rate"
                value="87%"
                icon="checkmark-circle"
                color={colors.warning.main}
                trend={{ value: '+5% vs last week', isPositive: true }}
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
              label="New Plan"
              onPress={() => console.log('New Plan')}
              color={colors.primary.main}
            />
            <QuickActionButton
              icon="document-text"
              label="Session Notes"
              onPress={() => console.log('Notes')}
              color={colors.success.main}
            />
            <QuickActionButton
              icon="trending-up"
              label="Progress Report"
              onPress={() => console.log('Progress')}
              color={colors.info.main}
            />
            <QuickActionButton
              icon="search"
              label="Patient Search"
              onPress={() => console.log('Search')}
              color={colors.secondary.main}
            />
            <QuickActionButton
              icon="calendar"
              label="Schedule"
              onPress={() => console.log('Schedule')}
              color={colors.warning.main}
            />
            <QuickActionButton
              icon="stats-chart"
              label="Analytics"
              onPress={() => console.log('Analytics')}
              color={colors.text.secondary}
            />
          </View>
        </View>

        {/* Today's Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Sessions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {[
            {
              patient: 'Michael Johnson',
              time: '9:00 AM',
              type: 'Physical Therapy',
              session: 'Day 5/14',
              condition: 'Post-surgery rehab',
            },
            {
              patient: 'Sarah Williams',
              time: '10:00 AM',
              type: 'Occupational Therapy',
              session: 'Day 3/21',
              condition: 'Stroke recovery',
            },
            {
              patient: 'Tom Anderson',
              time: '11:00 AM',
              type: 'Physical Therapy',
              session: 'Day 12/14',
              condition: 'Sports injury',
            },
          ].map((session, index) => (
            <TouchableOpacity key={index} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.patientInfo}>
                  <View style={styles.patientAvatar}>
                    <Ionicons name="person" size={24} color={colors.primary.main} />
                  </View>
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientName}>{session.patient}</Text>
                    <Text style={styles.sessionType}>{session.type}</Text>
                  </View>
                </View>
                <View style={styles.timeContainer}>
                  <Ionicons name="time" size={16} color={colors.primary.main} />
                  <Text style={styles.timeText}>{session.time}</Text>
                </View>
              </View>
              <View style={styles.sessionFooter}>
                <View style={styles.sessionInfo}>
                  <View style={styles.progressTag}>
                    <Ionicons name="calendar" size={14} color={colors.info.main} />
                    <Text style={styles.progressText}>{session.session}</Text>
                  </View>
                  <Text style={styles.conditionText}>{session.condition}</Text>
                </View>
                <TouchableOpacity style={styles.startButton}>
                  <Text style={styles.startButtonText}>Start</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.background.default}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Therapy Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Multi-Day Therapy Plans</Text>
          {[
            {
              patient: 'Jennifer Martinez',
              plan: 'Lower Back Rehabilitation',
              progress: 65,
              daysCompleted: 9,
              totalDays: 14,
              nextSession: 'Tomorrow, 2:00 PM',
            },
            {
              patient: 'Robert Chen',
              plan: 'Shoulder Mobility Program',
              progress: 42,
              daysCompleted: 9,
              totalDays: 21,
              nextSession: 'Today, 3:00 PM',
            },
            {
              patient: 'Lisa Brown',
              plan: 'Knee Strength Training',
              progress: 85,
              daysCompleted: 12,
              totalDays: 14,
              nextSession: 'Tomorrow, 10:00 AM',
            },
          ].map((plan, index) => (
            <TouchableOpacity key={index} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planIconContainer}>
                  <Ionicons name="fitness" size={24} color={colors.success.main} />
                </View>
                <View style={styles.planDetails}>
                  <Text style={styles.planPatient}>{plan.patient}</Text>
                  <Text style={styles.planName}>{plan.plan}</Text>
                  <Text style={styles.nextSession}>Next: {plan.nextSession}</Text>
                </View>
              </View>
              <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>{plan.progress}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${plan.progress}%`,
                        backgroundColor:
                          plan.progress >= 70
                            ? colors.success.main
                            : plan.progress >= 40
                            ? colors.info.main
                            : colors.warning.main,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.daysInfo}>
                  Day {plan.daysCompleted} of {plan.totalDays}
                </Text>
              </View>
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
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/clinic-admin')}
            >
              <Ionicons name="business" size={20} color={colors.success.main} />
              <Text style={styles.dashboardLinkText}>Clinic Admin</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dashboardLink}
              onPress={() => router.push('/doctor')}
            >
              <Ionicons name="medical" size={20} color={colors.error.main} />
              <Text style={styles.dashboardLinkText}>Doctor</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.secondary}
              />
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
  sessionCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sessionHeader: {
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
  sessionType: {
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
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  progressTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.info.main,
    fontWeight: '600',
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
  planCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  planHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.success.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  planDetails: {
    flex: 1,
  },
  planPatient: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  planName: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  nextSession: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  progressValue: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.grey[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  daysInfo: {
    ...typography.caption,
    color: colors.text.secondary,
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
