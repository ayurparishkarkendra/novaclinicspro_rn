/**
 * SetupWizardFlow
 * Clinic preparation flow with stepper, navigation, and embedded step screens
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, BackHandler, AppState, AppStateStatus } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useDemoStatusQuery, useSubmitStepMutation } from '../../data/repositories/onboarding.repository.impl';
import { createTenantSubscriptionApi, getSubscriptionPlansApi, SubscriptionPlanInfo } from '../../data/datasources/onboarding.api';
import { WizardStepper } from '../components/WizardStepper';
import { OfflineBanner } from '../components/OfflineBanner';
import { DemoStatusBanner } from '../components/DemoStatusBanner';
import { StepCard } from '../components/StepCard';
import { ClinicProfileScreen } from './steps/ClinicProfileScreen';
import { BillingSetupScreen } from './steps/BillingSetupScreen';
import { PaymentSetupScreen } from './steps/PaymentSetupScreen';
import { GoLiveScreen } from './steps/GoLiveScreen';
import { getPreparationStepDisplayName, SERVICE_CATALOGUE_ALIASES, ServiceCatalogueAlias } from '../../constants/stepAliases';
import {
  hydrateWizardDraftFromStorage,
  resetWizardDraftStorage,
  syncWizardDraftToStorage,
  useWizardStore,
} from '../stores/wizard.store';
import { useTranslation } from '../../../../core/localization/useTranslation';
import { useJourneyFoundation } from '../hooks/useJourneyFoundation';

interface Step {
  code: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'blocked';
  order: number;
}

const getVisibleStepSignature = (visibleSteps?: string[] | null) =>
  visibleSteps && visibleSteps.length > 0 ? visibleSteps.join('|') : null;

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
  const { t } = useTranslation();
  const netInfo = useNetInfo();
  const router = useRouter();
  const { tenantId: tenantIdParam } = useLocalSearchParams<{ tenantId: string }>();
  const { currentUser, isAuthenticated } = useAuth();

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
  const [showProgressUpdatedNotice, setShowProgressUpdatedNotice] = useState(false);
  const currentStepSaveHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundStepSignatureRef = useRef<string | null>(null);
  const latestVisibleStepsSignatureRef = useRef<string | null>(null);
  const currentStep = steps[currentStepIndex];
  const submitMutation = useSubmitStepMutation(tenantId, currentStep?.code || '');
  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;
  const isNextPending = isHandlingNext || submitMutation.isPending;
  const isNextDisabled = isNextPending || isOffline;

  // Fetch onboarding status - only if tenantId is available
  const {
    data: statusData,
    isLoading,
    error,
    refetch,
    journey,
  } = useJourneyFoundation(tenantId, {
    enabled: !!tenantId, // Only fetch if tenantId exists
  });
  const { data: demoStatusData } = useDemoStatusQuery(tenantId, {
    enabled: !!tenantId && currentUser?.applicationStatus === 'onboarding',
    retry: false,
  });
  const readyToStartStep = statusData?.per_step_validation?.go_live_checklist;
  const readyToStartStepIndex = steps.findIndex(step => step.code === 'go_live_checklist');
  const canOpenReadyToStartChecklist = readyToStartStepIndex >= 0 && readyToStartStep?.actionable === true;

  useEffect(() => {
    if (tenantId) {
      setWizardTenantId(tenantId);
    }
  }, [tenantId, setWizardTenantId]);

  useEffect(() => {
    void hydrateWizardDraftFromStorage();

    let syncTimeout: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = useWizardStore.subscribe(
      state => state.stepDrafts,
      () => {
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }

        syncTimeout = setTimeout(() => {
          void syncWizardDraftToStorage();
        }, 500);
      }
    );

    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      unsubscribe();
    };
  }, []);

  // Refetch status when screen comes into focus (after navigating back from
  // external screens). refetch() bypasses the query's `enabled` guard and
  // always dispatches — guard explicitly so a focus event during/after
  // logout can't fire an authenticated request with no JWT.
  useFocusEffect(
    React.useCallback(() => {
      if (tenantId && isAuthenticated) {
        refetch();
      }
    }, [tenantId, isAuthenticated, refetch])
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
        latestVisibleStepsSignatureRef.current = getVisibleStepSignature(statusData.visible_steps);
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
            name: getPreparationStepDisplayName(stepCode, t),
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
  }, [statusData, hasManuallyNavigated, tenantId, t]);

  useEffect(() => {
    setShowProgressUpdatedNotice(false);
  }, [currentStepIndex]);

  const persistDraftOnLifecyclePause = useCallback(async () => {
    backgroundStepSignatureRef.current = latestVisibleStepsSignatureRef.current;

    if (!useWizardStore.getState().isDirty) {
      return;
    }

    await syncWizardDraftToStorage();
  }, []);

  const hydrateDraftAndRefreshStatus = useCallback(async () => {
    await hydrateWizardDraftFromStorage();

    if (!tenantId || !isAuthenticated) {
      return;
    }

    const previousSignature = backgroundStepSignatureRef.current;
    const result = await refetch();
    const refreshedStatus = (result as { data?: typeof statusData })?.data;
    const refreshedSignature = getVisibleStepSignature(
      refreshedStatus?.visible_steps ?? statusData?.visible_steps
    );

    latestVisibleStepsSignatureRef.current = refreshedSignature;
    setShowProgressUpdatedNotice(
      Boolean(previousSignature && refreshedSignature && previousSignature !== refreshedSignature)
    );
  }, [tenantId, isAuthenticated, refetch, statusData]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (nextAppState === 'inactive' || nextAppState === 'background') {
        void persistDraftOnLifecyclePause();
        return;
      }

      if (
        nextAppState === 'active' &&
        (previousAppState === 'inactive' || previousAppState === 'background')
      ) {
        void hydrateDraftAndRefreshStatus();
      }
    });

    return () => subscription.remove();
  }, [hydrateDraftAndRefreshStatus, persistDraftOnLifecyclePause]);

  const handleNext = async () => {
    if (isSubmittingRef.current || isNextPending || isOffline) {
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
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('onboarding.progressiveExperience.flow.saveProgressError'));
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
    if (!tenantId || isSettingUpSubscription || isOffline) {
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
      Alert.alert(t('common.error'), t('onboarding.progressiveExperience.flow.refreshProgressError'));
    }
  };

  const handlePrevious = useCallback(async () => {
    // Mark that user has manually navigated
    setHasManuallyNavigated(true);

    await syncWizardDraftToStorage();

    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStepIndex > 0) {
        void handlePrevious();
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
    setShowProgressUpdatedNotice(false);
    Alert.alert(
      t('onboarding.progressiveExperience.flow.exitTitle'),
      t('onboarding.progressiveExperience.flow.exitMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.close'), onPress: () => router.replace(`/clinic-admin?tenantId=${tenantId}`) },
      ]
    );
  };

  const navigateToStep = useCallback((stepCode: string) => {
    const stepIndex = steps.findIndex(step => step.code === stepCode);
    if (stepIndex < 0) {
      return false;
    }

    setHasManuallyNavigated(true);
    setShowProgressUpdatedNotice(false);
    setCurrentStepIndex(stepIndex);
    return true;
  }, [steps]);

  const handleContinueSetupFromBanner = useCallback(() => {
    const targetStep = statusData?.next_recommended_step;
    if (targetStep && navigateToStep(targetStep)) {
      return;
    }

    const firstActionableStep = steps.find(step => step.status !== 'completed' && step.status !== 'blocked');
    if (firstActionableStep) {
      navigateToStep(firstActionableStep.code);
    }
  }, [navigateToStep, statusData?.next_recommended_step, steps]);

  const handleReadyToStartFromBanner = useCallback(() => {
    if (canOpenReadyToStartChecklist) {
      navigateToStep('go_live_checklist');
    }
  }, [canOpenReadyToStartChecklist, navigateToStep]);

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
            {t('onboarding.progressiveExperience.flow.treatmentsDescription')}
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
              {t('onboarding.progressiveExperience.flow.operatingHoursDescription')}
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
              {t('onboarding.progressiveExperience.flow.roomsDescription')}
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
              {t('onboarding.progressiveExperience.flow.staffDescription')}
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
              {t('onboarding.progressiveExperience.flow.inventoryTitle')}
            </Text>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              {t('onboarding.progressiveExperience.flow.inventoryDescription')}
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
              {t('onboarding.progressiveExperience.flow.subscriptionTitle')}
            </Text>
            <Text style={[theme.typography.body1, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              {t('onboarding.progressiveExperience.flow.subscriptionDescription')}
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
                  opacity: isSettingUpSubscription || isOffline ? 0.7 : 1,
                },
              ]}
              disabled={isSettingUpSubscription || isOffline}
              accessibilityState={{ disabled: isSettingUpSubscription || isOffline }}
              accessibilityLabel={
                isOffline
                  ? t('onboarding.progressiveExperience.offline.submitDisabled')
                  : t('onboarding.progressiveExperience.flow.reviewSubscription')
              }
              onPress={handleSetupSubscriptionPayment}
            >
              {isSettingUpSubscription ? (
                <ActivityIndicator color={theme.colors.text.onPrimary} />
              ) : (
                <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
                  {t('onboarding.progressiveExperience.flow.reviewSubscription')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'go_live_checklist':
        return (
          <GoLiveScreen
            tenantId={tenantId || ''}
            onComplete={() => {
              void resetWizardDraftStorage();
              router.replace(`/clinic-admin?tenantId=${tenantId}`);
            }}
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
          {t('onboarding.progressiveExperience.flow.loadingPreparation')}
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
          {t('onboarding.progressiveExperience.flow.loadPreparationFailed')}
        </Text>
        {error && (
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.sm, textAlign: 'center' }]}>
            {error.message || 'Unknown error'}
          </Text>
        )}
        {!error && steps.length === 0 && (
          <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.sm, textAlign: 'center' }]}>
            {t('onboarding.progressiveExperience.flow.noPreparationSteps')}
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
            {t('onboarding.progressiveExperience.flow.prepareYourClinic')}
          </Text>
          <TouchableOpacity onPress={handleExit}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stepper */}
      <WizardStepper steps={steps} currentStepIndex={currentStepIndex} />

      <OfflineBanner isOffline={isOffline} />

      {demoStatusData && (
        <View style={{ marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.md }}>
          <DemoStatusBanner
            demoExpiresAt={demoStatusData.demo_expires_at}
            trialExpiresAt={demoStatusData.trial_expires_at}
            isDemoExpired={demoStatusData.is_demo_expired}
            isTrialExpired={demoStatusData.is_trial_expired}
            onExtendDemo={handleContinueSetupFromBanner}
            onTransitionToLive={handleReadyToStartFromBanner}
            isExtendDisabled={isNextPending}
            isTransitionDisabled={isNextPending || !canOpenReadyToStartChecklist}
          />
        </View>
      )}

      {showProgressUpdatedNotice && (
        <View
          accessibilityRole="text"
          style={[
            styles.progressUpdatedNotice,
            {
              backgroundColor: theme.colors.feedback.warningLight,
              borderColor: theme.colors.feedback.warning,
              marginHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.md,
              padding: theme.spacing.md,
              borderRadius: theme.spacing.sm,
            },
          ]}
        >
          <Ionicons name="information-circle" size={20} color={theme.colors.feedback.warning} />
          <Text
            style={[
              theme.typography.body2,
              {
                color: theme.colors.text.primary,
                marginLeft: theme.spacing.sm,
                flex: 1,
              },
            ]}
          >
            {t('onboarding.progressiveExperience.flow.progressUpdatedNotice')}
          </Text>
        </View>
      )}

      {/* Step Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }}>
        {journey?.availability === 'available' && journey.cards.length > 0 && (
          <View accessibilityRole="list">
            {journey.cards.map(card => (
              <StepCard
                key={`${card.cardId}:${card.stepCode}`}
                journeyCard={card}
                onPress={() => navigateToStep(card.destination.stepCode)}
              />
            ))}
          </View>
        )}
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
              opacity: isNextDisabled ? 0.7 : 1,
              cursor: isNextDisabled ? ('not-allowed' as any) : ('pointer' as any),
            },
          ]}
          onPress={handleNext}
          disabled={isNextDisabled}
          accessibilityState={{ disabled: isNextDisabled }}
          accessibilityLabel={
            isOffline
              ? t('onboarding.progressiveExperience.offline.submitDisabled')
              : currentStepIndex === steps.length - 1
                ? t('onboarding.progressiveExperience.flow.readyToStart')
                : t('common.next')
          }
        >
          {isNextPending ? (
            <ActivityIndicator size="small" color={theme.colors.text.onPrimary} />
          ) : (
            <>
              <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary, marginRight: theme.spacing.xs }]}>
                {currentStepIndex === steps.length - 1 ? t('onboarding.progressiveExperience.flow.readyToStart') : t('common.next')}
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
  progressUpdatedNotice: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
