/**
 * Treatment Sheets Layout
 */

import { Stack } from 'expo-router';

export default function TreatmentSheetsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[treatmentSheetId]/index" />
      <Stack.Screen name="[treatmentSheetId]/schedule" />
      <Stack.Screen name="orders" />
    </Stack>
  );
}
