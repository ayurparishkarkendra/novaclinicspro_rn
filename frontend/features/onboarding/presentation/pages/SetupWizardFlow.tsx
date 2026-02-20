/**
 * SetupWizardFlow
 * Complete setup wizard with stepper, navigation, and embedded step screens
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useOnboardingStatusQuery } from '../../data/repositories/onboarding.repository.impl';
import { submitStepDataApi } from '../../data/datasources/onboarding.api';
import { WizardStepper } from '../components/WizardStepper';
import { ClinicProfileScreen } from './steps/ClinicProfileScreen';
import { BillingSetupScreen } from './steps/BillingSetupScreen';
import { PaymentSetupScreen } from './steps/PaymentSetupScreen';
import { GoLiveScreen } from './steps/GoLiveScreen';

interface Step {
  code: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'blocked';
  order: number;
}

export function SetupWizardFlow() {
  const theme = useClinicTheme();
  const router = useRouter();
  const { tenantId: tenantIdParam } = useLocalSearchParams<{ tenantId: string }>();
  const { currentUser } = useAuth();
  
  // Use tenantId from URL params, or fall back to currentUser's tenantId
  const tenantId = tenantIdParam || currentUser?.tenantId || '';
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);
  const currentStepSaveHandlerRef = useRef<(() => Promise<void>) | null>(null);

  // Fetch onboarding status
  const { data: statusData, isLoading, error, refetch } = useOnboardingStatusQuery(tenantId);

  // Refetch status when screen comes into focus (after navigating back from external screens)
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    if (statusData) {
      console.log('[SetupWizardFlow] Status data received:', {
        totalSteps: statusData.total_steps,
        completedSteps: statusData.completed_steps,
        visibleSteps: statusData.visible_steps,
        nextRecommendedStep: statusData.next_recommended_step,
      });
      console.log('[SetupWizardFlow] Full status data:', JSON.stringify(statusData, null, 2));

      // Use visible_steps array from backend
      if (statusData.visible_steps && statusData.visible_steps.length > 0) {
        const stepsArray = statusData.visible_steps.map((stepCode, index) => {
          // Get actual status from per_step_validation if available
          const stepValidation = statusData.per_step_validation?.[stepCode];
          const actualStatus = stepValidation?.status || 
            (index < (statusData.completed_steps || 0) ? 'completed' : 'not_started');
          
          console.log(`[SetupWizardFlow] Step ${stepCode}:`, {
            index,
            completedSteps: statusData.completed_steps,
            hasValidation: !!stepValidation,
            validationStatus: stepValidation?.status,
            finalStatus: actualStatus,
          });
          
          return {
            code: stepCode,
            name: stepCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            status: actualStatus,
            order: index + 1,
          };
        });
        
        console.log('[SetupWizardFlow] Steps array:', stepsArray);
        console.log('[SetupWizardFlow] per_step_validation:', statusData.per_step_validation);
        setSteps(stepsArray);

        // Only auto-navigate if user hasn't manually navigated
        if (!hasManuallyNavigated) {
          // Find the FIRST not_started step (this is the actual next step)
          const firstIncompleteIndex = stepsArray.findIndex(s => s.status === 'not_started');
          
          if (firstIncompleteIndex >= 0) {
            console.log('[SetupWizardFlow] Setting current step index to first incomplete:', firstIncompleteIndex);
            setCurrentStepIndex(firstIncompleteIndex);
          } else {
            // All steps complete - go to last step (go-live)
            console.log('[SetupWizardFlow] All steps complete, going to last step');
            setCurrentStepIndex(stepsArray.length - 1);
          }
        } else {
          console.log('[SetupWizardFlow] User has manually navigated, keeping current position');
        }
      } else {
        console.log('[SetupWizardFlow] No visible_steps in response');
      }
    } else {
      console.log('[SetupWizardFlow] No status data available');
    }
  }, [statusData, hasManuallyNavigated]);

  const handleNext = async () => {
    // Mark that user has manually navigated
    setHasManuallyNavigated(true);
    
    // If current step has a save handler, call it first
    if (currentStepSaveHandlerRef.current) {
      try {
        console.log('[SetupWizardFlow] Calling save handler for current step');
        await currentStepSaveHandlerRef.current();
        // Save handler will call handleStepComplete which advances to next step
        // So we don't need to do anything else here
        console.log('[SetupWizardFlow] Save handler completed successfully');
        return;
      } catch (error) {
        console.error('[SetupWizardFlow] Error saving step:', error);
        // Don't advance if save failed
        return;
      }
    }
    
    // No save handler - this is an external step (operating_hours, staff, treatments, etc.)
    // Submit empty data to mark step as complete
    const currentStep = steps[currentStepIndex];
    console.log('[SetupWizardFlow] No save handler, checking if external step needs submission');
    console.log('[SetupWizardFlow] Current step:', currentStep);
    
    if (currentStep) {
      console.log('[SetupWizardFlow] External step detected, submitting to backend:', currentStep.code);
      try {
        await submitStepDataApi(tenantId, currentStep.code, {
          data: {}, // Empty data for external steps
          mark_complete: true,
        });
        console.log('[SetupWizardFlow] External step submitted successfully');
      } catch (error) {
        console.error('[SetupWizardFlow] Error submitting external step:', error);
        Alert.alert('Error', 'Failed to save step progress. Please try again.');
        return;
      }
    }
    
    // Refresh status to get latest data
    console.log('[SetupWizardFlow] Refetching status after step submission');
    await refetch();
    
    if (currentStepIndex < steps.length - 1) {
      console.log('[SetupWizardFlow] Advancing to next step');
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // All steps complete - go to dashboard
      console.log('[SetupWizardFlow] All steps complete, redirecting to dashboard');
      router.replace(`/clinic-admin?tenantId=${tenantId}`);
    }
  };

  // Callback for steps to register their save handler
  const registerSaveHandler = useCallback((handler: (() => Promise<void>) | null) => {
    console.log('[SetupWizardFlow] Registering save handler:', handler ? 'function' : 'null');
    currentStepSaveHandlerRef.current = handler;
  }, []);

  const handleStepComplete = async () => {
    // Mark that user has manually navigated FIRST (to prevent auto-jump during refetch)
    setHasManuallyNavigated(true);
    
    // Auto-advance to next step BEFORE refetch
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStepIndex(nextIndex);
    }
    
    // Refetch status after navigation
    console.log('[SetupWizardFlow] Step completed, refetching status...');
    await refetch();
  };

  const handlePrevious = () => {
    // Mark that user has manually navigated
    setHasManuallyNavigated(true);
    
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Setup?',
      'You can continue setup later from the dashboard.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => router.replace(`/clinic-admin?tenantId=${tenantId}`) },
      ]
    );
  };

  const renderStepContent = () => {
    if (steps.length === 0) return null;

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return null;

    // Render appropriate screen based on step code
    switch (currentStep.code) {
      case 'clinic_profile':
        return <ClinicProfileScreen 
          tenantId={tenantId || ''} 
          isWizardMode={true} 
          onSuccess={handleStepComplete}
          onRegisterSaveHandler={registerSaveHandler}
        />;
      
      case 'operating_hours':
        return (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.h5, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Operating Hours
            </Text>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              Configure your clinic's operating hours in the full management screen. After setting your hours, return here to continue setup.
            </Text>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: 8, alignItems: 'center', marginBottom: theme.spacing.md }]}
              onPress={() => router.push('/clinic-admin/settings/operating-hours')}
            >
              <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
                Go to Operating Hours Management
              </Text>
            </TouchableOpacity>
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
              Click Next after setting your operating hours
            </Text>
          </View>
        );
      
      case 'rooms_and_therapy_beds':
      case 'treatment_rooms':
      case 'treatments_and_therapies':
      case 'services_and_specialities':
        return (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.h5, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              {currentStep.code === 'treatments_and_therapies' || currentStep.code === 'services_and_specialities' 
                ? 'Treatments & Therapies' 
                : 'Rooms & Therapy Beds'}
            </Text>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              Configure your {currentStep.code === 'treatments_and_therapies' || currentStep.code === 'services_and_specialities'
                ? 'Ayurvedic treatments and therapy services' 
                : 'treatment rooms and therapy beds'} in the full management screen. After adding items, return here to continue setup.
            </Text>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: 8, alignItems: 'center', marginBottom: theme.spacing.md }]}
              onPress={() => router.push(
                currentStep.code === 'treatments_and_therapies' || currentStep.code === 'services_and_specialities'
                  ? '/clinic-admin/settings/treatments' 
                  : '/clinic-admin/settings/rooms'
              )}
            >
              <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
                Go to {currentStep.code === 'treatments_and_therapies' || currentStep.code === 'services_and_specialities'
                  ? 'Treatments' 
                  : 'Rooms'} Management
              </Text>
            </TouchableOpacity>
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
              Click Next after adding at least one {currentStep.code === 'treatments_and_therapies' || currentStep.code === 'services_and_specialities'
                ? 'treatment' 
                : 'room'}
            </Text>
          </View>
        );
      
      case 'staff_and_roles':
      case 'staff_setup':
      case 'staff_members':
        return (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.h5, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Staff & Roles
            </Text>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              Add staff members and assign roles & permissions in the full management screen. After adding staff, return here to continue setup.
            </Text>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: 8, alignItems: 'center', marginBottom: theme.spacing.md }]}
              onPress={() => router.push('/clinic-admin/staff')}
            >
              <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
                Go to Staff Management
              </Text>
            </TouchableOpacity>
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
              Click Next after adding at least one staff member
            </Text>
          </View>
        );
      
      case 'inventory_setup':
        return (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.h5, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Inventory Setup
            </Text>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              Set up your herbal medicines and supplies inventory in the full management screen. After adding inventory items, return here to continue setup.
            </Text>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: 8, alignItems: 'center', marginBottom: theme.spacing.md }]}
              onPress={() => router.push('/clinic-admin/inventory')}
            >
              <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
                Go to Inventory Management
              </Text>
            </TouchableOpacity>
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
              Click Next after adding inventory items
            </Text>
          </View>
        );
      
      case 'financials_and_tax':
      case 'billing_setup':
      case 'billing_settings':
        return <BillingSetupScreen 
          tenantId={tenantId || ''} 
          isWizardMode={true} 
          onSuccess={handleStepComplete}
          onRegisterSaveHandler={registerSaveHandler}
        />;
      
      case 'payment_setup':
      case 'payment_methods':
        return <PaymentSetupScreen 
          tenantId={tenantId || ''} 
          isWizardMode={true} 
          onSuccess={handleStepComplete}
          onRegisterSaveHandler={registerSaveHandler}
        />;
      
      case 'subscription_payment':
        return (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.h5, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Subscription Payment
            </Text>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              Enter your payment details to activate your subscription.
            </Text>
            <View style={{ backgroundColor: theme.colors.feedback.warningLight, padding: theme.spacing.md, borderRadius: 8, marginBottom: theme.spacing.lg }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary }]}>
                ⚠️ Payment integration is required before going live. Please contact support to set up your subscription.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: 8, alignItems: 'center' }]}
              onPress={() => Alert.alert('Coming Soon', 'Payment integration will be available soon. For now, you can proceed with the setup.')}
            >
              <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
                Set Up Payment
              </Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'go_live_checklist':
        return (
          <GoLiveScreen
            tenantId={tenantId || ''}
            onComplete={() => router.replace(`/clinic-admin?tenantId=${tenantId}`)}
            completedSteps={statusData?.completed_steps || 0}
            totalSteps={statusData?.total_steps || 0}
            allSteps={steps}
            isWizardMode={true}
          />
        );
      
      default:
        return (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary }]}>
              Step "{currentStep.code}" is not yet implemented.
            </Text>
          </View>
        );
    }
  };

  if (!tenantId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.default, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[theme.typography.body1, { color: theme.colors.feedback.error }]}>
          Missing tenant ID
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.default, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.default} />
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.md }]}>
          Loading setup wizard...
        </Text>
      </View>
    );
  }

  if (error || steps.length === 0) {
    console.log('[SetupWizardFlow] Error or no steps:', { error, stepsLength: steps.length, statusData });
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.default, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg }]}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.feedback.error} />
        <Text style={[theme.typography.h6, { color: theme.colors.text.primary, marginTop: theme.spacing.md, textAlign: 'center' }]}>
          Unable to load setup wizard
        </Text>
        {error && (
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.sm, textAlign: 'center' }]}>
            {error.message || 'Unknown error'}
          </Text>
        )}
        {!error && steps.length === 0 && (
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.sm, textAlign: 'center' }]}>
            No setup steps found. The backend may not have generated steps for your clinic type yet.
          </Text>
        )}
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, marginTop: theme.spacing.lg, borderRadius: 8 }]}
          onPress={() => refetch()}
        >
          <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface.default, padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border.default }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[theme.typography.h5, { color: theme.colors.text.primary }]}>
            Setup Your Clinic
          </Text>
          <TouchableOpacity onPress={handleExit}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stepper */}
      <WizardStepper steps={steps} currentStepIndex={currentStepIndex} />

      {/* Step Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface.default, padding: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border.default, flexDirection: 'row', justifyContent: 'space-between' }]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: currentStepIndex === 0 ? theme.colors.surface.elevated : theme.colors.surface.default,
              borderWidth: 1,
              borderColor: theme.colors.border.default,
              padding: theme.spacing.md,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: currentStepIndex === 0 ? 0.5 : 1,
              cursor: currentStepIndex === 0 ? ('not-allowed' as any) : ('pointer' as any),
            },
          ]}
          onPress={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
          <Text style={[theme.typography.button, { color: theme.colors.text.primary, marginLeft: 4 }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: theme.colors.primary.default,
              padding: theme.spacing.md,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              cursor: 'pointer' as any,
            },
          ]}
          onPress={handleNext}
        >
          <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary, marginRight: 4 }]}>
            {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // Styles set inline with theme
  },
  content: {
    flex: 1,
  },
  footer: {
    // Styles set inline with theme
  },
  navButton: {
    // Styles set inline with theme
  },
  linkButton: {
    // Styles set inline with theme
  },
  retryButton: {
    // Styles set inline with theme
  },
});
