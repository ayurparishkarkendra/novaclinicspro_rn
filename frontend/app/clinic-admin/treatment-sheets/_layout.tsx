/**
 * Treatment Sheets Layout
 */

import { Stack } from 'expo-router';

export default function TreatmentSheetsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[treatmentSheetId]" />
    </Stack>
  );
}
