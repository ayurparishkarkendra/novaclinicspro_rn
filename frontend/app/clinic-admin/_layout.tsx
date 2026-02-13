/**
 * Clinic Admin Layout
 * Handles routing for all clinic admin screens
 * Protected by authentication - requires login
 */

import { Stack } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { ProtectedRoute } from '../../core/components/ProtectedRoute';

export default function ClinicAdminLayout() {
  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.paper },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="staff" />
        <Stack.Screen name="staff/[staffId]" />
        <Stack.Screen name="staff/leave" />
        <Stack.Screen name="clients" />
        <Stack.Screen name="clients/[clientId]" />
        <Stack.Screen name="appointments" />
        <Stack.Screen name="appointments/[appointmentId]" />
        <Stack.Screen name="treatment-sessions" />
        <Stack.Screen name="treatment-sessions/[sessionId]" />
        <Stack.Screen name="treatment-sheets" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="settings/global" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="bulk-upload" />
        <Stack.Screen name="billing" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="analytics/revenue" />
        <Stack.Screen name="analytics/users" />
        <Stack.Screen name="analytics/performance" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="branding" />
      </Stack>
    </ProtectedRoute>
  );
}
