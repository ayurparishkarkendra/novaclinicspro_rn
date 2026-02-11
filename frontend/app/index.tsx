import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../core/theme/colors';
import { spacing } from '../core/theme/spacing';
import { typography } from '../core/theme/typography';

export default function Index() {
  const router = useRouter();

  const dashboards = [
    {
      id: 'super-admin',
      title: 'Super Admin',
      subtitle: 'System-wide management',
      icon: 'shield-checkmark' as const,
      color: colors.primary.main,
      route: '/super-admin',
    },
    {
      id: 'clinic-admin',
      title: 'Clinic Admin',
      subtitle: 'Clinic operations & staff',
      icon: 'business' as const,
      color: colors.success.main,
      route: '/clinic-admin',
    },
    {
      id: 'doctor',
      title: 'Doctor',
      subtitle: 'Patient consultations',
      icon: 'medical' as const,
      color: colors.info.main,
      route: '/doctor',
    },
    {
      id: 'therapist',
      title: 'Therapist',
      subtitle: 'Therapy sessions & plans',
      icon: 'heart' as const,
      color: colors.error.main,
      route: '/therapist',
    },
    {
      id: 'theme-demo',
      title: 'Theme System Demo',
      subtitle: 'Multi-clinic theming',
      icon: 'color-palette' as const,
      color: colors.secondary.main,
      route: '/theme-demo',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="medical" size={40} color={colors.primary.main} />
        </View>
        <Text style={styles.title}>NovaClinicsPro</Text>
        <Text style={styles.subtitle}>Healthcare Management Platform</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Dashboard</Text>
          <Text style={styles.sectionSubtitle}>
            Choose your role to access the appropriate dashboard
          </Text>

          <View style={styles.dashboardGrid}>
            {dashboards.map((dashboard) => (
              <TouchableOpacity
                key={dashboard.id}
                style={styles.dashboardCard}
                onPress={() => router.push(dashboard.route as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: dashboard.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={dashboard.icon}
                    size={32}
                    color={dashboard.color}
                  />
                </View>
                <View style={styles.dashboardInfo}>
                  <Text style={styles.dashboardTitle}>{dashboard.title}</Text>
                  <Text style={styles.dashboardSubtitle}>
                    {dashboard.subtitle}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Platform Features</Text>
          <View style={styles.featuresList}>
            {[
              { icon: 'people', text: 'Client Management' },
              { icon: 'calendar', text: 'Appointments & Therapy Plans' },
              { icon: 'document-text', text: 'Prescriptions & Case Sheets' },
              { icon: 'cube', text: 'Inventory Management' },
              { icon: 'person', text: 'Staff Management' },
              { icon: 'bar-chart', text: 'Analytics & Reports' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name={feature.icon as any}
                    size={20}
                    color={colors.primary.main}
                  />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
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
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  dashboardGrid: {
    gap: spacing.md,
  },
  dashboardCard: {
    backgroundColor: colors.background.default,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dashboardInfo: {
    flex: 1,
  },
  dashboardTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: 4,
  },
  dashboardSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  featuresSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '500',
  },
});
