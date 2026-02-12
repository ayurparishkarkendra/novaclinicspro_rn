/**
 * Templates Route (Placeholder)
 * /clinic-admin/settings/templates
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardHeader } from '../../../core/components/DashboardHeader';
import { spacing } from '../../../core/theme/spacing';
import { typography } from '../../../core/theme/typography';

export default function TemplatesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Document Templates"
        subtitle="Manage templates"
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.comingSoon}>
          <Ionicons name="document-text-outline" size={64} color="#EC4899" />
          <Text style={styles.title}>Coming Soon</Text>
          <Text style={styles.subtitle}>
            Template management will be available in Phase 2.
          </Text>
          <Text style={styles.description}>
            You'll be able to manage:
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.featureText}>Casesheet templates</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.featureText}>Prescription formats</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.featureText}>Treatment sheets</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.featureText}>Invoice templates</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4EC',
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  comingSoon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    ...typography.h4,
    color: '#1F2937',
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body1,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body2,
    color: '#4B5563',
    marginBottom: spacing.sm,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featureText: {
    ...typography.body2,
    color: '#4B5563',
  },
});
