/**
 * Treatment Proposals Repository Implementation
 * React Query hooks for treatment proposal management
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  createProposalApi,
  getProposalsByEpisodeApi,
  getProposalByIdApi,
  updateProposalApi,
  declineProposalApi,
  canCreateProposalApi,
  canEditProposalApi,
  canScheduleProposalApi,
} from '../datasources/proposals.api';
import {
  TreatmentProposal,
  ProposalCreateDTO,
  ProposalUpdateDTO,
  ProposalDeclineDTO,
  RuleEvaluationResult,
} from '../models/treatmentProposals.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const proposalKeys = {
  all: ['proposals'] as const,
  lists: () => [...proposalKeys.all, 'list'] as const,
  list: (tenantId: string, episodeId: string) =>
    [...proposalKeys.lists(), tenantId, episodeId] as const,
  details: () => [...proposalKeys.all, 'detail'] as const,
  detail: (tenantId: string, proposalId: string) =>
    [...proposalKeys.details(), tenantId, proposalId] as const,
  canCreate: (tenantId: string, episodeId: string) =>
    [...proposalKeys.all, 'can-create', tenantId, episodeId] as const,
  canEdit: (tenantId: string, proposalId: string) =>
    [...proposalKeys.all, 'can-edit', tenantId, proposalId] as const,
  canSchedule: (tenantId: string, proposalId: string) =>
    [...proposalKeys.all, 'can-schedule', tenantId, proposalId] as const,
};

// ============================================
// PROPOSAL QUERY HOOKS
// ============================================

/**
 * Hook to fetch proposals by episode ID
 */
export const useProposalsByEpisodeQuery = (
  tenantId: string,
  episodeId: string,
  options?: Omit<UseQueryOptions<{ proposals: TreatmentProposal[]; total: number }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: proposalKeys.list(tenantId, episodeId),
    queryFn: () => getProposalsByEpisodeApi(tenantId, episodeId),
    enabled: !!tenantId && !!episodeId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

/**
 * Hook to fetch a single proposal by ID
 */
export const useProposalDetailQuery = (
  tenantId: string,
  proposalId: string,
  options?: Omit<UseQueryOptions<TreatmentProposal>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: proposalKeys.detail(tenantId, proposalId),
    queryFn: () => getProposalByIdApi(tenantId, proposalId),
    enabled: !!tenantId && !!proposalId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

/**
 * Hook to check if user can create a proposal
 */
export const useCanCreateProposalQuery = (
  tenantId: string,
  episodeId: string,
  options?: Omit<UseQueryOptions<RuleEvaluationResult>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: proposalKeys.canCreate(tenantId, episodeId),
    queryFn: () => canCreateProposalApi(tenantId, episodeId),
    enabled: !!tenantId && !!episodeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to check if user can edit a proposal
 */
export const useCanEditProposalQuery = (
  tenantId: string,
  proposalId: string,
  options?: Omit<UseQueryOptions<RuleEvaluationResult>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: proposalKeys.canEdit(tenantId, proposalId),
    queryFn: () => canEditProposalApi(tenantId, proposalId),
    enabled: !!tenantId && !!proposalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to check if user can schedule a proposal
 */
export const useCanScheduleProposalQuery = (
  tenantId: string,
  proposalId: string,
  options?: Omit<UseQueryOptions<RuleEvaluationResult>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: proposalKeys.canSchedule(tenantId, proposalId),
    queryFn: () => canScheduleProposalApi(tenantId, proposalId),
    enabled: !!tenantId && !!proposalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 403 permission errors
      if (error?.status === 403 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

// ============================================
// PROPOSAL MUTATION HOOKS
// ============================================

/**
 * Hook to create a new proposal
 */
export const useCreateProposalMutation = (
  tenantId: string,
  options?: UseMutationOptions<TreatmentProposal, Error, ProposalCreateDTO>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProposalCreateDTO) => createProposalApi(tenantId, payload),
    onSuccess: (data, variables) => {
      // Invalidate proposals list for this episode
      queryClient.invalidateQueries({
        queryKey: proposalKeys.list(tenantId, variables.episode_id),
      });
      // Invalidate all proposal lists
      queryClient.invalidateQueries({
        queryKey: proposalKeys.lists(),
      });
    },
    ...options,
  });
};

/**
 * Hook to update a proposal
 */
export const useUpdateProposalMutation = (
  tenantId: string,
  proposalId: string,
  options?: UseMutationOptions<TreatmentProposal, Error, ProposalUpdateDTO>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProposalUpdateDTO) => updateProposalApi(tenantId, proposalId, payload),
    onSuccess: (data) => {
      // Invalidate this proposal's detail
      queryClient.invalidateQueries({
        queryKey: proposalKeys.detail(tenantId, proposalId),
      });
      // Invalidate proposals list for this episode
      if (data.episode_id) {
        queryClient.invalidateQueries({
          queryKey: proposalKeys.list(tenantId, data.episode_id),
        });
      }
      // Invalidate all proposal lists
      queryClient.invalidateQueries({
        queryKey: proposalKeys.lists(),
      });
      // Invalidate can-edit check
      queryClient.invalidateQueries({
        queryKey: proposalKeys.canEdit(tenantId, proposalId),
      });
    },
    ...options,
  });
};

/**
 * Hook to decline a proposal
 */
export const useDeclineProposalMutation = (
  tenantId: string,
  proposalId: string,
  options?: UseMutationOptions<TreatmentProposal, Error, ProposalDeclineDTO>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProposalDeclineDTO) => declineProposalApi(tenantId, proposalId, payload),
    onSuccess: (data) => {
      // Invalidate this proposal's detail
      queryClient.invalidateQueries({
        queryKey: proposalKeys.detail(tenantId, proposalId),
      });
      // Invalidate proposals list for this episode
      if (data.episode_id) {
        queryClient.invalidateQueries({
          queryKey: proposalKeys.list(tenantId, data.episode_id),
        });
      }
      // Invalidate all proposal lists
      queryClient.invalidateQueries({
        queryKey: proposalKeys.lists(),
      });
      // Invalidate permission checks
      queryClient.invalidateQueries({
        queryKey: proposalKeys.canEdit(tenantId, proposalId),
      });
      queryClient.invalidateQueries({
        queryKey: proposalKeys.canSchedule(tenantId, proposalId),
      });
    },
    ...options,
  });
};
