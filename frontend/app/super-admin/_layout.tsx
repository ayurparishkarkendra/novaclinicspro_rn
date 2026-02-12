/**
 * Super Admin Layout
 * Handles routing for all super admin screens
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
      <Stack.Screen name="tenants" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="billing" />
    </Stack>
  );
}
