/**
 * SetupWizardFlow
 * Complete setup wizard with stepper, navigation, and embedded step screens
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, BackHandler } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useOnboardingStatusQuery, useSubmitStepMutation } from '../../data/repositories/onboarding.repository.impl';
import { createTenantSubscriptionApi, getSubscriptionPlansApi, SubscriptionPlanInfo } from '../../data/datasources/onboarding.api';
import { WizardStepper } from '../components/WizardStepper';
import { ClinicProfileScreen } from './steps/ClinicProfileScreen';
import { BillingSetupScreen } from './steps/BillingSetupScreen';
import { PaymentSetupScreen } from './steps/PaymentSetupScreen';
import { GoLiveScreen } from './steps/GoLiveScreen';
import { SERVICE_CATALOGUE_ALIASES, ServiceCatalogueAlias } from '../../constants/stepAliases';
import { useWizardStore } from '../stores/wizard.store';

interface Step {
  code: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'blocked';
  order: number;
}

const createSubmissionId = () => {
  const cryptoRandomUUID = globalThis.crypto?.randomUUID;
  if (cryptoRandomUUID) {
    return cryptoRandomUUID.call(globalThis.crypto);
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export function SetupWizardFlow() {
  const theme = useClinicTheme();
  const router = useRouter();
  const { tenantId: tenantIdParam } = useLocalSearchParams<{ tenantId: string }>();
  const { currentUser } = useAuth();

  // Use tenantId from URL params, or fall back to currentUser's tenantId
  const tenantId = tenantIdParam || currentUser?.tenantId || '';
  const setWizardTenantId = useWizardStore(state => state.setTenantId);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);
  const [isHandlingNext, setIsHandlingNext] = useState(false);
  const [isSettingUpSubscription, setIsSettingUpSubscription] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState('BASIC');
  const currentStepSaveHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  const currentStep = steps[currentStepIndex];
  const submitMutation = useSubmitStepMutation(tenantId, currentStep?.code || '');
  const isNextPending = isHandlingNext || submitMutation.isPending;

  // Fetch onboarding status - only if tenantId is available
  const { data: statusData, isLoading, error, refetch } = useOnboardingStatusQuery(tenantId, {
    enabled: !!tenantId, // Only fetch if tenantId exists
  });

  useEffect(() => {
    if (tenantId) {
      setWizardTenantId(tenantId);
    }
  }, [tenantId, setWizardTenantId]);

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
        // visible_steps is empty/null — this should not happen post-FR-097 fix.
        // Log at error severity so monitoring/alerting catches any regression.
        // Neither case is a transient timing race — the backend returns synchronously —
        // so an empty response is always a real problem, not a "still generating" state.
        console.error(
          '[SetupWizardFlow] visible_steps is empty/null for tenant',
          tenantId,
          '— this indicates either an FR-097 template-generation regression or a ' +
          'tenant whose template was never seeded. The status response was:',
          statusData
        );
      }
    } else {
      console.log('[SetupWizardFlow] No status data available');
    }
  }, [statusData, hasManuallyNavigated, tenantId]);

  const handleNext = async () => {
    if (isSubmittingRef.current || isNextPending) {
      return;
    }

    isSubmittingRef.current = true;
    const submissionId = createSubmissionId();
    submissionIdRef.current = submissionId;

    // Mark that user has manually navigated
    setHasManuallyNavigated(true);
    setIsHandlingNext(true);

    try {
      // If current step has a save handler, call it first
      if (currentStepSaveHandlerRef.current) {
        console.log('[SetupWizardFlow] Calling save handler for current step');
        await currentStepSaveHandlerRef.current();
        if (submissionIdRef.current !== submissionId) {
          return;
        }
        // Save handler calls handleStepComplete, which refetches before advancing.
        console.log('[SetupWizardFlow] Save handler completed successfully');
        return;
      }

      // No save handler - this is an external step (operating_hours, staff, treatments, etc.)
      // Submit empty data to mark step as complete
      console.log('[SetupWizardFlow] No save handler, checking if external step needs submission');
      console.log('[SetupWizardFlow] Current step:', currentStep);

      if (currentStep) {
        console.log('[SetupWizardFlow] External step detected, submitting to backend:', currentStep.code);
        await submitMutation.mutateAsync(
          {
            idempotencyKey: submissionId,
            data: {}, // Empty data for external steps
            mark_complete: true,
          },
          {
            onSuccess: () => {
              if (submissionIdRef.current !== submissionId) {
                return;
              }
            },
            onError: () => {
              if (submissionIdRef.current !== submissionId) {
                return;
              }
            },
          }
        );
        if (submissionIdRef.current !== submissionId) {
          return;
        }
        console.log('[SetupWizardFlow] External step submitted successfully');
      }

      // Refresh status to get latest data before advancing.
      console.log('[SetupWizardFlow] Refetching status after step submission');
      await refetch();
      if (submissionIdRef.current !== submissionId) {
        return;
      }

      if (currentStepIndex < steps.length - 1) {
        console.log('[SetupWizardFlow] Advancing to next step');
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // All steps complete - go to dashboard
        console.log('[SetupWizardFlow] All steps complete, redirecting to dashboard');
        router.replace(`/clinic-admin?tenantId=${tenantId}`);
      }
    } catch (error) {
      if (submissionIdRef.current !== submissionId) {
        return;
      }
      console.error('[SetupWizardFlow] Error submitting step:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save step progress. Please try again.');
    } finally {
      if (submissionIdRef.current === submissionId) {
        setIsHandlingNext(false);
        isSubmittingRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (currentStep?.code !== 'subscription_payment' || subscriptionPlans.length > 0) {
      return;
    }

    let isMounted = true;
    getSubscriptionPlansApi()
      .then(result => {
        if (!isMounted) {
          return;
        }
        const paidPlans = result.plans.filter(plan => plan.plan_code !== 'FREE');
        setSubscriptionPlans(paidPlans.length > 0 ? paidPlans : result.plans);
        const defaultPlan = paidPlans.find(plan => plan.plan_code === 'BASIC') || paidPlans[0] || result.plans[0];
        if (defaultPlan) {
          setSelectedSubscriptionPlan(defaultPlan.plan_code);
        }
      })
      .catch(error => {
        console.error('[SetupWizardFlow] Failed to load subscription plans:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [currentStep?.code, subscriptionPlans.length]);

  const handleSetupSubscriptionPayment = async () => {
    if (!tenantId || isSettingUpSubscription) {
      return;
    }

    setIsSettingUpSubscription(true);
    try {
      const result = await createTenantSubscriptionApi(tenantId, {
        plan_code: selectedSubscriptionPlan,
        billing_cycle: 'monthly',
      });

      const planCode = result.plan_code || selectedSubscriptionPlan;
      const billingCycle = result.billing_cycle || 'monthly';
      const provider = result.provider || 'manual';

      if (result.checkout_url) {
        await WebBrowser.openBrowserAsync(result.checkout_url);
        await submitMutation.mutateAsync({
          idempotencyKey: createSubmissionId(),
          data: {
            subscription_id: result.subscription_id,
            plan_code: planCode,
            billing_cycle: billingCycle,
            provider,
            provider_subscription_id: result.provider_subscription_id,
            checkout_started: true,
          },
          mark_complete: true,
        });
        await handleStepComplete();
        return;
      }

      if (result.requires_internal_payment_setup || provider === 'manual') {
        Alert.alert(
          'Payment Provider Not Configured',
          'Subscription payment must be completed in a real payment provider checkout. Please configure a supported provider such as Razorpay, Stripe, or PayPal, then try again.'
        );
        return;
      }

      await submitMutation.mutateAsync({
        idempotencyKey: createSubmissionId(),
        data: {
          subscription_id: result.subscription_id,
          plan_code: planCode,
          billing_cycle: billingCycle,
          provider,
          provider_subscription_id: result.provider_subscription_id,
          checkout_started: false,
        },
        mark_complete: true,
      });

      await handleStepComplete();
    } catch (error: any) {
      console.error('[SetupWizardFlow] Subscription payment setup failed:', error);
      Alert.alert('Payment Setup Failed', error?.message || 'Unable to set up subscription payment. Please try again.');
    } finally {
      setIsSettingUpSubscription(false);
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

    try {
      // Refetch status before navigation so the next step renders from fresh status.
      console.log('[SetupWizardFlow] Step completed, refetching status before advance...');
      await refetch();

      // Auto-advance to next step only after refetch resolves.
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStepIndex(nextIndex);
      }
    } catch (error) {
      console.error('[SetupWizardFlow] Error refetching after step complete:', error);
      Alert.alert('Error', 'Failed to refresh setup progress. Please try again.');
    }
  };

  const handlePrevious = useCallback(() => {
    // Mark that user has manually navigated
    setHasManuallyNavigated(true);

    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStepIndex > 0) {
        handlePrevious();
      }

      return true;
    });

    return () => subscription.remove();
  }, [currentStepIndex, handlePrevious]);

  useEffect(() => {
    return () => {
      submissionIdRef.current = null;
      isSubmittingRef.current = false;
    };
  }, []);

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

    // Service-catalogue aliases all redirect to the Treatments management screen.
    // See SERVICE_CATALOGUE_ALIASES for the full list (Design Property 5, Req 2 AC-2).
    if (SERVICE_CATALOGUE_ALIASES.includes(currentStep.code as ServiceCatalogueAlias)) {
      return (
        <View style={{ padding: theme.spacing.lg }}>
          <Text style={[theme.typography.h5, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
            Treatments & Therapies
          </Text>
          <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
            Configure your Ayurvedic treatments and therapy services in the full management screen. After adding items, return here to continue setup.
          </Text>
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: theme.spacing.sm, alignItems: 'center', marginBottom: theme.spacing.md }]}
            onPress={() => router.push('/clinic-admin/settings/treatments')}
          >
            <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
              Go to Treatments Management
            </Text>
          </TouchableOpacity>
          <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
            Click Next after adding at least one treatment
          </Text>
        </View>
      );
    }

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
              Configure your clinic operating hours in the full management screen. After setting your hours, return here to continue setup.
            </Text>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: theme.spacing.sm, alignItems: 'center', marginBottom: theme.spacing.md }]}
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
        return (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.h5, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Rooms & Therapy Beds
            </Text>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              Configure your treatment rooms and therapy beds in the full management screen. After adding items, return here to continue setup.
            </Text>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: theme.spacing.sm, alignItems: 'center', marginBottom: theme.spacing.md }]}
              onPress={() => router.push('/clinic-admin/settings/rooms')}
            >
              <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
                Go to Rooms Management
              </Text>
            </TouchableOpacity>
            <Text style={[theme.typography.caption, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
              Click Next after adding at least one room
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
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: theme.spacing.sm, alignItems: 'center', marginBottom: theme.spacing.md }]}
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
              style={[styles.linkButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, borderRadius: theme.spacing.sm, alignItems: 'center', marginBottom: theme.spacing.md }]}
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
              Choose a subscription plan and start the payment setup.
            </Text>
            <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
              {subscriptionPlans.map(plan => {
                const isSelected = selectedSubscriptionPlan === plan.plan_code;
                return (
                  <TouchableOpacity
                    key={plan.plan_code}
                    style={{
                      borderWidth: 1,
                      borderColor: isSelected ? theme.colors.primary.default : theme.colors.border.default,
                      backgroundColor: isSelected ? theme.colors.primary.light : theme.colors.background.elevated,
                      padding: theme.spacing.md,
                      borderRadius: theme.spacing.sm,
                    }}
                    onPress={() => setSelectedSubscriptionPlan(plan.plan_code)}
                  >
                    <Text style={[theme.typography.subtitle1, { color: theme.colors.text.primary }]}>
                      {plan.name}
                    </Text>
                    <Text style={[theme.typography.body2, { color: theme.colors.text.secondary }]}>
                      ₹{plan.base_price.toLocaleString('en-IN')} / month
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[
                styles.linkButton,
                {
                  backgroundColor: theme.colors.primary.default,
                  padding: theme.spacing.md,
                  borderRadius: theme.spacing.sm,
                  alignItems: 'center',
                  opacity: isSettingUpSubscription ? 0.7 : 1,
                },
              ]}
              disabled={isSettingUpSubscription}
              onPress={handleSetupSubscriptionPayment}
            >
              {isSettingUpSubscription ? (
                <ActivityIndicator color={theme.colors.text.onPrimary} />
              ) : (
                <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
                  Set Up Payment
                </Text>
              )}
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
            onRegisterSaveHandler={registerSaveHandler}
          />
        );

      default:
        return (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary }]}>
              Step {currentStep.code} is not yet implemented.
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
          style={[styles.retryButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, marginTop: theme.spacing.lg, borderRadius: theme.spacing.sm }]}
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
              borderRadius: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: currentStepIndex === 0 || isNextPending ? 0.5 : 1,
              cursor: currentStepIndex === 0 || isNextPending ? ('not-allowed' as any) : ('pointer' as any),
            },
          ]}
          onPress={handlePrevious}
          disabled={currentStepIndex === 0 || isNextPending}
          accessibilityState={{ disabled: currentStepIndex === 0 || isNextPending }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
          <Text style={[theme.typography.button, { color: theme.colors.text.primary, marginLeft: theme.spacing.xs }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: theme.colors.primary.default,
              padding: theme.spacing.md,
              borderRadius: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: isNextPending ? 0.7 : 1,
              cursor: isNextPending ? ('not-allowed' as any) : ('pointer' as any),
            },
          ]}
          onPress={handleNext}
          disabled={isNextPending}
          accessibilityState={{ disabled: isNextPending }}
        >
          {isNextPending ? (
            <ActivityIndicator size="small" color={theme.colors.text.onPrimary} />
          ) : (
            <>
              <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary, marginRight: theme.spacing.xs }]}>
                {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.onPrimary} />
            </>
          )}
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
