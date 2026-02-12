/**
 * Super Admin Layout
 * Handles routing for all super admin screens
 * 
 * Route structure:
 * - index.tsx -> /super-admin
 * - tenants/index.tsx -> /super-admin/tenants
 * - applications/index.tsx -> /super-admin/applications
 * - billing/index.tsx -> /super-admin/billing
 * - system-settings.tsx -> /super-admin/system-settings
 */

import { Stack } from 'expo-router';
import { colors } from '../../core/theme/colors';

export default function SuperAdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.paper },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="tenants/index" />
      <Stack.Screen name="tenants/create" />
      <Stack.Screen name="tenants/[tenantId]" />
      <Stack.Screen name="applications/index" />
      <Stack.Screen name="applications/[applicationId]" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="system-settings" />
    </Stack>
  );
}
