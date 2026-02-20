/**
 * PendingReviewScreen
 * Displays waiting state for application under review
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useApplicationDetailQuery } from '../../data/repositories/onboarding.repository.impl';
import { useOnboardingStore } from '../providers/onboarding.store';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';

export function PendingReviewScreen() {
  const theme = useClinicTheme();
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { setCurrentApplicationId } = useOnboardingStore();

  const { data, isLoading, error, refetch } = useApplicationDetailQuery(
    applicationId || '',
    { enabled: !!applicationId }
  );

  // Set current application ID in store
  useEffect(() => {
    if (applicationId) {
      setCurrentApplicationId(applicationId);
    }
  }, [applicationId, setCurrentApplicationId]);

  // Check if application is actually approved (backend bug workaround)
  useEffect(() => {
    if (data) {
      console.log('[PendingReviewScreen] Application data:', {
        status: data.status,
        autoApprovalEligible: data.auto_approval_result?.eligible,
        approvedComponents: data.approved_components?.length,
      });

      // WORKAROUND: Backend returns status="pending_review" even for auto-approved applications
      // Check if auto_approval_result.eligible is true, which means it was actually approved
      if (data.auto_approval_result?.eligible === true || 
          data.status?.toUpperCase() === 'APPROVED') {
        console.log('[PendingReviewScreen] Application is actually approved, redirecting to choice screen');
        router.replace(`/onboarding/choice?applicationId=${applicationId}`);
      }
    }
  }, [data, applicationId, router]);

  if (isLoading) {
    return <LoadingScreen message="Loading application details..." />;
  }

  if (error) {
    return <ErrorScreen message={error.message} onRetry={refetch} />;
  }

  if (!data) {
    return <ErrorScreen message="Application not found" />;
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <View style={[styles.iconContainer, { marginBottom: theme.spacing.lg }]}>
        <Ionicons 
          name="time-outline" 
          size={80} 
          color={theme.colors.feedback.warning} 
        />
      </View>

      <Text style={[
        styles.title, 
        theme.typography.h3, 
        { 
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm 
        }
      ]}>
        Application Under Review
      </Text>

      <Text style={[
        styles.subtitle, 
        theme.typography.body1, 
        { 
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.xl 
        }
      ]}>
        Your application for {data.tenant_name} is being reviewed by our team.
      </Text>

      <View style={[
        styles.infoCard, 
        { 
          backgroundColor: theme.colors.surface.default,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md 
        }
      ]}>
        <View style={[styles.infoRow, { marginBottom: 12 }]}>
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
            Application ID
          </Text>
          <Text style={[theme.typography.body2, { color: theme.colors.text.primary }]}>
            {data.id.substring(0, 8)}...
          </Text>
        </View>
        <View style={[styles.infoRow, { marginBottom: 12 }]}>
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
            Submitted
          </Text>
          <Text style={[theme.typography.body2, { color: theme.colors.text.primary }]}>
            {new Date(data.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
            Status
          </Text>
          <Text style={[theme.typography.body2, { color: theme.colors.feedback.warning }]}>
            Pending Review
          </Text>
        </View>
      </View>

      <View style={[
        styles.timelineCard, 
        { 
          backgroundColor: theme.colors.surface.default,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.lg 
        }
      ]}>
        <Text style={[
          theme.typography.h6, 
          { 
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.md 
          }
        ]}>
          What happens next?
        </Text>
        <View style={[styles.timelineItem, { marginBottom: theme.spacing.sm }]}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.feedback.success} />
          <Text style={[
            theme.typography.body2, 
            { 
              color: theme.colors.text.secondary,
              marginLeft: 12 
            }
          ]}>
            Application submitted
          </Text>
        </View>
        <View style={[styles.timelineItem, { marginBottom: theme.spacing.sm }]}>
          <Ionicons name="time-outline" size={24} color={theme.colors.feedback.warning} />
          <Text style={[
            theme.typography.body2, 
            { 
              color: theme.colors.text.secondary,
              marginLeft: 12 
            }
          ]}>
            Under review (1-2 business days)
          </Text>
        </View>
        <View style={styles.timelineItem}>
          <Ionicons name="ellipse-outline" size={24} color={theme.colors.border.default} />
          <Text style={[
            theme.typography.body2, 
            { 
              color: theme.colors.text.disabled,
              marginLeft: 12 
            }
          ]}>
            Approval & setup
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button, 
          { 
            backgroundColor: theme.colors.primary.default,
            padding: theme.spacing.md 
          }
        ]}
        onPress={() => router.replace('/')}
      >
        <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
          Back to Home
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineCard: {
    width: '100%',
    borderRadius: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
  },
});
