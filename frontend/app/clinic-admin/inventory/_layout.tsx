import { Stack } from 'expo-router';

export default function InventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[itemId]" />
      <Stack.Screen name="[itemId]/edit" />
      <Stack.Screen name="create" />
      <Stack.Screen name="adjust" />
      <Stack.Screen name="alerts" />
    </Stack>
  );
}
