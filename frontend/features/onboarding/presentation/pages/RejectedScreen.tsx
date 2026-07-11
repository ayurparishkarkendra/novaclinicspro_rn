/**
 * RejectedScreen
 * Displays rejection status and allows resubmission
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

export function RejectedScreen() {
  const theme = useClinicTheme();
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { setCurrentApplicationId } = useOnboardingStore();

  const { data, isLoading, error, refetch } = useApplicationDetailQuery(
    applicationId || '',
    { enabled: !!applicationId }
  );

  useEffect(() => {
    if (applicationId) {
      setCurrentApplicationId(applicationId);
    }
  }, [applicationId, setCurrentApplicationId]);

  if (isLoading) {
    return <LoadingScreen message="Loading application details..." />;
  }

  if (error) {
    return <ErrorScreen message={error.message} onRetry={refetch} />;
  }

  if (!data) {
    return <ErrorScreen message="Application not found" />;
  }

  const rejectionReason = data.auto_approval_result?.reason || 'Application did not meet approval criteria';
  const riskFactors = data.auto_approval_result?.risk_factors || [];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <View style={[styles.iconContainer, { marginBottom: theme.spacing.lg }]}>
        <Ionicons 
          name="close-circle-outline" 
          size={80} 
          color={theme.colors.feedback.error} 
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
        Application Not Approved
      </Text>

      <Text style={[
        styles.subtitle, 
        theme.typography.body1, 
        { 
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.xl 
        }
      ]}>
        Your application for {data.tenant_name} requires some improvements before approval.
      </Text>

      {/* Rejection Reason */}
      <View style={[
        styles.reasonCard, 
        { 
          backgroundColor: theme.colors.feedback.errorLight,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.lg,
          borderRadius: 8 
        }
      ]}>
        <View style={[styles.reasonHeader, { marginBottom: theme.spacing.sm }]}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.feedback.error} />
          <Text style={[
            theme.typography.h6, 
            { 
              color: theme.colors.text.primary,
              marginLeft: theme.spacing.sm 
            }
          ]}>
            Reason
          </Text>
        </View>
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
          {rejectionReason}
        </Text>
      </View>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <View style={[
          styles.factorsCard, 
          { 
            backgroundColor: theme.colors.surface.default,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            borderRadius: 8 
          }
        ]}>
          <Text style={[
            theme.typography.h6, 
            { 
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md 
            }
          ]}>
            Issues to Address
          </Text>
          {riskFactors.map((factor, index) => (
            <View 
              key={index} 
              style={[
                styles.factorItem, 
                { marginBottom: theme.spacing.sm }
              ]}
            >
              <Ionicons 
                name="alert-circle-outline" 
                size={20} 
                color={theme.colors.feedback.warning} 
              />
              <Text style={[
                theme.typography.body2, 
                { 
                  color: theme.colors.text.secondary,
                  marginLeft: theme.spacing.sm,
                  flex: 1 
                }
              ]}>
                {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Next Steps */}
      <View style={[
        styles.nextStepsCard, 
        { 
          backgroundColor: theme.colors.feedback.infoLight,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.xl,
          borderRadius: 8 
        }
      ]}>
        <View style={[styles.nextStepsHeader, { marginBottom: theme.spacing.sm }]}>
          <Ionicons name="bulb-outline" size={24} color={theme.colors.feedback.info} />
          <Text style={[
            theme.typography.h6, 
            { 
              color: theme.colors.text.primary,
              marginLeft: theme.spacing.sm 
            }
          ]}>
            What You Can Do
          </Text>
        </View>
        <Text style={[
          theme.typography.body2, 
          { 
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.sm 
          }
        ]}>
          1. Review and improve your application information
        </Text>
        <Text style={[
          theme.typography.body2, 
          { 
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.sm 
          }
        ]}>
          2. Provide complete and authentic business details
        </Text>
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
          3. Resubmit your application for review
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={[
        styles.supportCard, 
        { 
          backgroundColor: theme.colors.feedback.infoLight,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          borderRadius: 8 
        }
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <Ionicons name="information-circle" size={24} color={theme.colors.feedback.info} />
          <Text style={[
            theme.typography.h6, 
            { 
              color: theme.colors.text.primary,
              marginLeft: theme.spacing.sm 
            }
          ]}>
            Need Help?
          </Text>
        </View>
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
          Since your account is already created, you cannot modify the application details yourself. 
          Please contact our support team to update your application information.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.secondaryButton, 
          { 
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.default,
            borderRadius: 8 
          }
        ]}
        onPress={() => router.replace('/')}
      >
        <Text style={[theme.typography.button, { color: theme.colors.text.primary }]}>
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
  reasonCard: {
    // Styles set inline with theme
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorsCard: {
    // Styles set inline with theme
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nextStepsCard: {
    // Styles set inline with theme
  },
  supportCard: {
    // Styles set inline with theme
  },
  nextStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
  },
});
