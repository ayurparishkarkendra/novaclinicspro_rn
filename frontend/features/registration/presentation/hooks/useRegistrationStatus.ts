/**
 * useRegistrationStatus Hook
 * Fetches and manages registration status
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getRegistrationStatusApi } from '../../data/datasources/registration.api';
import { RegistrationStatusResponse } from '../../data/models/registration.dtos';

export const registrationStatusKeys = {
  all: ['registration-status'] as const,
  status: (userId: string) => [...registrationStatusKeys.all, userId] as const,
};

/**
 * Hook to get registration status
 */
export const useRegistrationStatus = (
  userId: string,
  options?: Omit<UseQueryOptions<RegistrationStatusResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RegistrationStatusResponse, Error>({
    queryKey: registrationStatusKeys.status(userId),
    queryFn: async () => {
      try {
        return await getRegistrationStatusApi(userId);
      } catch (error: any) {
        console.error('[useRegistrationStatus] Error:', error);
        throw new Error(
          error.response?.data?.detail || 
          'Failed to fetch registration status. Please try again.'
        );
      }
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
    ...options,
  });
};
