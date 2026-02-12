/**
 * Templates Repository Implementation
 * React Query hooks for document templates management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplateMerge,
} from '../datasources/templates.api';
import {
  templatesKeys,
  TemplateCreate,
  TemplateUpdate,
  TemplateType,
} from '../models/templates.dtos';

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Query hook for listing templates
 */
export const useTemplatesListQuery = (
  tenantId: string,
  filters?: { type?: TemplateType },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: templatesKeys.list(tenantId, filters),
    queryFn: () => listTemplates(tenantId, filters),
    enabled: options?.enabled !== false && !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Query hook for getting a specific template
 */
export const useTemplateQuery = (
  tenantId: string,
  templateId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: templatesKeys.detail(tenantId, templateId),
    queryFn: () => getTemplate(tenantId, templateId),
    enabled: options?.enabled !== false && !!tenantId && !!templateId,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Mutation hook for creating a template
 */
export const useCreateTemplateMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TemplateCreate) => createTemplate(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.lists() });
    },
  });
};

/**
 * Mutation hook for updating a template
 */
export const useUpdateTemplateMutation = (tenantId: string, templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TemplateUpdate) => updateTemplate(tenantId, templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templatesKeys.detail(tenantId, templateId) });
    },
  });
};

/**
 * Mutation hook for deleting a template
 */
export const useDeleteTemplateMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(tenantId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.lists() });
    },
  });
};

/**
 * Mutation hook for previewing template merge
 */
export const usePreviewTemplateMergeMutation = () => {
  return useMutation({
    mutationFn: ({
      templateId,
      mergeData,
    }: {
      templateId: string;
      mergeData: Record<string, any>;
    }) => previewTemplateMerge(templateId, mergeData),
  });
};
