/**
 * ChoiceScreen
 * Allows users to choose between Demo or Setup Wizard after approval
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../../features/auth/presentation/hooks/useAuth';
import { authRepository } from '../../../../features/auth/data/repositories/auth.repository.impl';
import { useApplicationDetailQuery, useCreateDemoTenantMutation } from '../../data/repositories/onboarding.repository.impl';
import { useOnboardingStore } from '../providers/onboarding.store';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';

export function ChoiceScreen() {
  const theme = useClinicTheme();
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { setCurrentApplicationId, setIsSubmitting, isSubmitting } = useOnboardingStore();
  const { refreshSession, currentUser } = useAuth();

  const { data: application, isLoading, error, refetch } = useApplicationDetailQuery(
    applicationId || '',
    { enabled: !!applicationId }
  );

  const createDemoMutation = useCreateDemoTenantMutation();

  useEffect(() => {
    if (applicationId) {
      setCurrentApplicationId(applicationId);
    }
  }, [applicationId, setCurrentApplicationId]);

  // CRITICAL: If user has application_status === 'onboarding', redirect to wizard immediately
  // Do not show the choice page (setup vs demo) when status is 'onboarding'
  useEffect(() => {
    if (currentUser?.applicationStatus === 'onboarding') {
      console.log('[ChoiceScreen] User has onboarding status, redirecting to wizard');
      router.replace('/onboarding/wizard-flow');
    }
  }, [currentUser, router]);

  const handleStartDemo = async () => {
    if (!applicationId) return;

    try {
      setIsSubmitting(true);
      const demoResult = await createDemoMutation.mutateAsync({ application_id: applicationId });
      
      console.log('[ChoiceScreen] Demo created:', demoResult);
      
      const durationDays = demoResult.duration_days || 7;
      const tenantId = demoResult.tenant_id || demoResult.demo_tenant_id;
      
      console.log('[ChoiceScreen] Tenant ID from demo response:', tenantId);
      
      // CRITICAL: Backend has updated Supabase metadata, now refresh JWT to get tenant_id
      console.log('[ChoiceScreen] Refreshing session to get updated JWT with tenant_id...');
      
      try {
        await refreshSession();
        console.log('[ChoiceScreen] Session refreshed successfully');
        
        // Additional delay to ensure axios interceptor gets the new token
        console.log('[ChoiceScreen] Waiting for token to be available in all API clients...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify token has tenant_id
        const userSession = await authRepository.getCurrentUser();
        console.log('[ChoiceScreen] User session after refresh:', {
          tenantId: userSession.tenantId,
          email: userSession.email,
        });
        
        if (userSession.tenantId) {
          console.log('[ChoiceScreen] ✅ Token has tenant_id, API calls will work');
        } else {
          console.warn('[ChoiceScreen] ⚠️ Token still missing tenant_id, using X-Tenant-ID header workaround');
        }
      } catch (refreshError) {
        console.error('[ChoiceScreen] Token refresh failed:', refreshError);
        console.warn('[ChoiceScreen] Continuing with X-Tenant-ID header workaround');
      }
      
      // Show success message and navigate
      Alert.alert(
        'Demo Created!',
        `Your demo clinic is ready with sample data. You can explore the features or complete the setup wizard. Demo expires in ${durationDays} days.`,
        [
          {
            text: 'Start Setup',
            onPress: () => {
              console.log('[ChoiceScreen] Navigating to setup wizard with tenant:', tenantId);
              router.replace(`/onboarding/setup-wizard?tenantId=${tenantId}`);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('[ChoiceScreen] Error in handleStartDemo:', error);
      Alert.alert('Error', error.message || 'Unable to create demo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupWizard = async () => {
    if (!applicationId) return;

    try {
      setIsSubmitting(true);
      
      // Create demo tenant first (required since direct setup not implemented)
      const demoResult = await createDemoMutation.mutateAsync({ application_id: applicationId });
      
      console.log('[ChoiceScreen] Demo created for setup:', demoResult);
      
      const tenantId = demoResult.tenant_id || demoResult.demo_tenant_id;
      
      // CRITICAL: Backend has updated Supabase metadata, now refresh JWT to get tenant_id
      console.log('[ChoiceScreen] Refreshing session to get updated JWT with tenant_id...');
      
      try {
        await refreshSession();
        console.log('[ChoiceScreen] Session refreshed successfully');
        
        // Additional delay to ensure axios interceptor gets the new token
        console.log('[ChoiceScreen] Waiting for token to be available in all API clients...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify token has tenant_id
        const userSession = await authRepository.getCurrentUser();
        console.log('[ChoiceScreen] User session after refresh:', {
          tenantId: userSession.tenantId,
          email: userSession.email,
        });
        
        if (userSession.tenantId) {
          console.log('[ChoiceScreen] ✅ Token has tenant_id, API calls will work');
        } else {
          console.warn('[ChoiceScreen] ⚠️ Token still missing tenant_id, using X-Tenant-ID header workaround');
        }
      } catch (refreshError) {
        console.error('[ChoiceScreen] Token refresh failed:', refreshError);
        console.warn('[ChoiceScreen] Continuing with X-Tenant-ID header workaround');
      }
      
      console.log('[ChoiceScreen] Navigating to setup wizard with tenant:', tenantId);
      
      // Navigate directly to setup wizard
      router.replace(`/onboarding/setup-wizard?tenantId=${tenantId}`);
    } catch (error: any) {
      console.error('[ChoiceScreen] Error in handleSetupWizard:', error);
      Alert.alert('Error', error.message || 'Unable to start setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (error) {
    return <ErrorScreen message={error.message} onRetry={refetch} />;
  }

  if (!application) {
    return <ErrorScreen message="Application not found" />;
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <View style={[styles.header, { marginBottom: theme.spacing.xl }]}>
        <Ionicons 
          name="checkmark-circle" 
          size={80} 
          color={theme.colors.feedback.success} 
        />
        <Text style={[
          theme.typography.h3, 
          { 
            color: theme.colors.text.primary,
            marginTop: theme.spacing.md,
            textAlign: 'center' 
          }
        ]}>
          Application Approved!
        </Text>
        <Text style={[
          theme.typography.body1, 
          { 
            color: theme.colors.text.secondary,
            marginTop: theme.spacing.sm,
            textAlign: 'center' 
          }
        ]}>
          {application.tenant_name}
        </Text>
      </View>

      <Text style={[
        theme.typography.h5, 
        { 
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.lg,
          textAlign: 'center' 
        }
      ]}>
        How would you like to proceed?
      </Text>

      {/* Option 1: Setup Wizard */}
      <TouchableOpacity
        style={[
          styles.optionCard,
          {
            backgroundColor: theme.colors.surface.default,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.colors.primary.default,
          }
        ]}
        onPress={handleSetupWizard}
        disabled={isSubmitting}
      >
        <View style={[styles.optionHeader, { marginBottom: theme.spacing.sm }]}>
          <Ionicons name="rocket" size={32} color={theme.colors.primary.default} />
          <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
            <Text style={[theme.typography.h6, { color: theme.colors.text.primary }]}>
              Setup My Clinic
            </Text>
            <Text style={[
              theme.typography.caption, 
              { 
                color: theme.colors.primary.default,
                fontWeight: '600' 
              }
            ]}>
              RECOMMENDED
            </Text>
          </View>
        </View>
        <Text style={[
          theme.typography.body2, 
          { 
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.sm 
          }
        ]}>
          Create your permanent clinic immediately
        </Text>
        <View style={styles.featureList}>
          <View style={[styles.featureItem, { marginBottom: 4 }]}>
            <Ionicons name="checkmark" size={16} color={theme.colors.feedback.success} />
            <Text style={[
              theme.typography.caption, 
              { 
                color: theme.colors.text.secondary,
                marginLeft: 8 
              }
            ]}>
              No time limit
            </Text>
          </View>
          <View style={[styles.featureItem, { marginBottom: 4 }]}>
            <Ionicons name="checkmark" size={16} color={theme.colors.feedback.success} />
            <Text style={[
              theme.typography.caption, 
              { 
                color: theme.colors.text.secondary,
                marginLeft: 8 
              }
            ]}>
              Full access to all features
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark" size={16} color={theme.colors.feedback.success} />
            <Text style={[
              theme.typography.caption, 
              { 
                color: theme.colors.text.secondary,
                marginLeft: 8 
              }
            ]}>
              Production-ready
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Option 2: Demo Mode - Hidden when application_status is 'onboarding' */}
      {currentUser?.applicationStatus !== 'onboarding' && (
        <TouchableOpacity
          style={[
            styles.optionCard,
            {
              backgroundColor: theme.colors.surface.default,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.xl,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border.default,
            }
          ]}
          onPress={handleStartDemo}
          disabled={isSubmitting}
        >
          <View style={[styles.optionHeader, { marginBottom: theme.spacing.sm }]}>
            <Ionicons name="flask" size={32} color={theme.colors.secondary.default} />
            <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
              <Text style={[theme.typography.h6, { color: theme.colors.text.primary }]}>
                Try Demo First
              </Text>
              <Text style={[
                theme.typography.caption, 
                { 
                  color: theme.colors.secondary.default,
                  fontWeight: '600' 
                }
              ]}>
                EXPLORE FEATURES
              </Text>
            </View>
          </View>
          <Text style={[
            theme.typography.body2, 
            { 
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.sm 
            }
          ]}>
            Test the platform with sample data
          </Text>
          <View style={styles.featureList}>
            <View style={[styles.featureItem, { marginBottom: 4 }]}>
              <Ionicons name="time" size={16} color={theme.colors.feedback.warning} />
              <Text style={[
                theme.typography.caption, 
                { 
                  color: theme.colors.text.secondary,
                  marginLeft: 8 
                }
              ]}>
                7-day trial period
              </Text>
            </View>
            <View style={[styles.featureItem, { marginBottom: 4 }]}>
              <Ionicons name="eye" size={16} color={theme.colors.secondary.default} />
              <Text style={[
                theme.typography.caption, 
                { 
                  color: theme.colors.text.secondary,
                  marginLeft: 8 
                }
              ]}>
                Explore all features
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="swap-horizontal" size={16} color={theme.colors.secondary.default} />
              <Text style={[
                theme.typography.caption, 
                { 
                  color: theme.colors.text.secondary,
                  marginLeft: 8 
                }
              ]}>
                Convert to live anytime
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {isSubmitting && (
        <View style={[styles.loadingOverlay, { marginTop: theme.spacing.md }]}>
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
            Creating your demo clinic...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  optionCard: {
    // Styles set inline with theme
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureList: {
    // Container for features
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingOverlay: {
    alignItems: 'center',
  },
});
