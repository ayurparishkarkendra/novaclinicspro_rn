/**
 * Client Detail Layout
 * Provides nested routing for client-specific pages
 */

import { Stack } from 'expo-router';

export default function ClientDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="episodes" />
      <Stack.Screen name="casesheets/index" />
      <Stack.Screen name="casesheets/new" />
      <Stack.Screen name="casesheets/[casesheetId]/index" />
      <Stack.Screen name="casesheets/[casesheetId]/edit" />
      <Stack.Screen name="prescriptions/index" />
      <Stack.Screen name="prescriptions/new" />
      <Stack.Screen name="prescriptions/[prescriptionId]/index" />
      <Stack.Screen name="prescriptions/[prescriptionId]/edit" />
      <Stack.Screen name="treatment-sheets/index" />
      <Stack.Screen name="treatment-sheets/[treatmentSheetId]/index" />
    </Stack>
  );
}
