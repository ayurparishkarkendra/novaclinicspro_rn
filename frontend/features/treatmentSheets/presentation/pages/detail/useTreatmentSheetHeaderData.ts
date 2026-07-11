import { useEffect, useState } from 'react';
import { axiosClient } from '../../../../../core/api/axiosClient';
import { ClientEntity, HeaderEntity } from './types';

export const useTreatmentSheetHeaderData = (tenantId: string, episodeId?: string | null) => {
  const [episodeData, setEpisodeData] = useState<HeaderEntity | null>(null);
  const [clientData, setClientData] = useState<ClientEntity | null>(null);
  const [isLoadingHeaderData, setIsLoadingHeaderData] = useState(false);

  useEffect(() => {
    const fetchHeaderData = async () => {
      if (!episodeId || !tenantId) return;

      setIsLoadingHeaderData(true);
      try {
        const episodeResponse = await axiosClient.get(
          `/api/v1/clinic/${tenantId}/episodes/${episodeId}`
        );
        setEpisodeData(episodeResponse.data);

        if (episodeResponse.data.client_id) {
          const clientResponse = await axiosClient.get(
            `/api/v1/clinic/${tenantId}/clients/${episodeResponse.data.client_id}`
          );
          setClientData(clientResponse.data);
        }
      } catch (error) {
        console.error('[TreatmentSheet] Failed to fetch header data:', error);
      } finally {
        setIsLoadingHeaderData(false);
      }
    };

    fetchHeaderData();
  }, [episodeId, tenantId]);

  return { episodeData, clientData, isLoadingHeaderData };
};
