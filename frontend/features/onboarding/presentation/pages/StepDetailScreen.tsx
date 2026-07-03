/**
 * StepDetailScreen
 * Generic step detail screen that routes to specific step implementations
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { PaymentSetupScreen } from './steps/PaymentSetupScreen';
import { BillingSetupScreen } from './steps/BillingSetupScreen';
import { ClinicProfileScreen } from './steps/ClinicProfileScreen';
import { OperatingHoursScreen } from './steps/OperatingHoursScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { StepProgressHeader } from '../components/StepProgressHeader';
import { useOnboardingStatusQuery } from '../../data/repositories/onboarding.repository.impl';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { getPreparationStepDisplayName, SERVICE_CATALOGUE_ALIASES } from '../../constants/stepAliases';

export function StepDetailScreen() {
  const theme = useClinicTheme();
  const router = useRouter();
  const { tenantId, stepCode } = useLocalSearchParams<{ 
    tenantId: string; 
    stepCode: string;
  }>();

  // Fetch onboarding status to get all steps
  const { data: statusData, isLoading, error } = useOnboardingStatusQuery(tenantId || '');

  // Handle redirects for steps that need full management screens
  useEffect(() => {
    if (!stepCode || !tenantId) return;

    const redirectSteps: Record<string, string> = {
      // service catalogue — all aliases point to the same screen
      ...Object.fromEntries(
        SERVICE_CATALOGUE_ALIASES.map(code => [code, '/clinic-admin/settings/treatments'])
      ),
      // rooms
      rooms_and_therapy_beds: '/clinic-admin/settings/rooms',
      treatment_rooms: '/clinic-admin/settings/rooms',
      // staff
      staff_and_roles: '/clinic-admin/staff',
      staff_setup: '/clinic-admin/staff',
      staff_members: '/clinic-admin/staff',
      // inventory
      inventory_setup: '/clinic-admin/inventory',
    };

    const redirectPath = redirectSteps[stepCode];
    if (redirectPath) {
      console.log(`[StepDetailScreen] Redirecting ${stepCode} to ${redirectPath}`);
      router.replace(redirectPath as Href);
    }
  }, [stepCode, tenantId, router]);

  if (!tenantId || !stepCode) {
    return <ErrorScreen message="Missing required parameters" />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.default, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary.default} />
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.md }]}>
          Loading step...
        </Text>
      </View>
    );
  }

  if (error) {
    return <ErrorScreen message="Failed to load step information" />;
  }

  // Convert steps map to array for progress header
 const steps = statusData?.per_step_validation
  ? Object.entries(statusData.per_step_validation).map(([code, step], index) => ({
      code: step.step_code,
      name: getPreparationStepDisplayName(code),
      status: step.status,
      order: index + 1,
    }))
  : [];


  // Route to specific step implementation
  const renderStepContent = () => {
    switch (stepCode) {
      // Clinic Profile - Updates tenant basic info
      case 'clinic_profile':
        return <ClinicProfileScreen tenantId={tenantId} />;
      
      // Operating Hours - Use dedicated operating hours screen
      case 'operating_hours':
        return <OperatingHoursScreen tenantId={tenantId} />;
      
      // These steps redirect to full management screens (handled in useEffect)
      case 'rooms_and_therapy_beds':
      case 'treatment_rooms':
      case 'treatments_and_therapies':
      case 'services_and_specialities':
      case 'services':
      case 'services_offered':
      case 'treatment_services':
      case 'staff_and_roles':
      case 'staff_setup':
      case 'staff_members':
      case 'inventory_setup':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg }}>
            <ActivityIndicator size="large" color={theme.colors.primary.default} />
            <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.md }]}>
              Redirecting to management screen...
            </Text>
          </View>
        );
      
      // Financials and Tax - Use billing screen
      case 'financials_and_tax':
      case 'billing_setup':
      case 'billing_settings':
        return <BillingSetupScreen tenantId={tenantId} />;
      
      // Payment Methods (if separate from financials)
      case 'payment_setup':
      case 'payment_methods':
        return <PaymentSetupScreen tenantId={tenantId} />;
      
      // Ready to Start Checklist - Final step
      case 'go_live_checklist':
        return (
          <ErrorScreen 
            message="Ready to Start Checklist - This step confirms your clinic is ready to start. Finish the previous preparation steps first."
          />
        );
      
      default:
        return (
          <ErrorScreen 
            message={`Step "${stepCode}" is not implemented yet. This step will be available soon.`} 
          />
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
      {steps.length > 0 && (
        <StepProgressHeader
          steps={steps}
          currentStepCode={stepCode}
          tenantId={tenantId}
        />
      )}
      {renderStepContent()}
    </View>
  );
}
