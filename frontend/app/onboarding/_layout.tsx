/**
 * Onboarding Layout
 * Layout for onboarding flow screens
 */

import { Stack } from 'expo-router';
import { useClinicTheme } from '../../core/theme/useClinicTheme';

export default function OnboardingLayout() {
  const theme = useClinicTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface.default,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          ...theme.typography.h6,
        },
      }}
    >
      <Stack.Screen 
        name="choice" 
        options={{ title: 'Get Started' }} 
      />
      <Stack.Screen 
        name="pending-review" 
        options={{ title: 'Application Status' }} 
      />
      <Stack.Screen 
        name="setup-wizard" 
        options={{ title: 'Setup Wizard' }} 
      />
      <Stack.Screen 
        name="wizard-flow" 
        options={{ 
          title: 'Clinic Setup',
          headerShown: false, // Hide header since wizard has its own
        }} 
      />
      <Stack.Screen 
        name="step-detail" 
        options={{ title: 'Step Details' }} 
      />
      <Stack.Screen 
        name="rejected" 
        options={{ title: 'Application Rejected' }} 
      />
      <Stack.Screen 
        name="improve" 
        options={{ title: 'Improve Application' }} 
      />
    </Stack>
  );
}
