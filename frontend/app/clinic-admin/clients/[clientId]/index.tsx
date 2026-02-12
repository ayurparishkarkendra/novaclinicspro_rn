/**
 * Client Detail Index
 * Re-exports the client detail screen
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ClientDetailScreen from '../[clientId]';

export default function ClientDetailIndex() {
  // This re-renders the client detail when navigating back
  return <ClientDetailScreen />;
}
