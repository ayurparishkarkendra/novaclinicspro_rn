/**
 * Client Episodes Page
 * Full-page view of all episodes for a client
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ClientEpisodesList } from '../../../../features/episodes/presentation/components/ClientEpisodesList';

export default function ClientEpisodesPage() {
  const { clientId, clientName } = useLocalSearchParams<{ 
    clientId: string;
    clientName?: string;
  }>();

  return (
    <ClientEpisodesList 
      clientId={clientId || ''} 
      clientName={clientName}
    />
  );
}
