/**
 * Templates API
 * Data source for document templates endpoints
 * 
 * Note: The current backend may not have full templates CRUD.
 * This implementation provides the interface for when it's available.
 */

import axiosClient from '../../../../core/api/axiosClient';
import {
  TemplateResponse,
  TemplatesListResponse,
  TemplateCreate,
  TemplateUpdate,
  PreviewMergeRequest,
  PreviewMergeResponse,
  TemplateType,
} from '../models/templates.dtos';

const API_BASE = '/api/v1';

// ============================================
// API FUNCTIONS
// ============================================

/**
 * List all templates for a tenant
 */
export const listTemplates = async (
  tenantId: string,
  filters?: { type?: TemplateType }
): Promise<TemplatesListResponse> => {
  try {
    const response = await axiosClient.get<TemplateResponse[]>(
      `${API_BASE}/clinic/${tenantId}/templates`,
      { params: filters }
    );
    return {
      items: response.data,
      total: response.data.length,
    };
  } catch (error: any) {
    // If endpoint doesn't exist yet, return empty
    if (error?.response?.status === 404) {
      return { items: [], total: 0 };
    }
    throw error;
  }
};

/**
 * Get a specific template
 */
export const getTemplate = async (
  tenantId: string,
  templateId: string
): Promise<TemplateResponse> => {
  const response = await axiosClient.get<TemplateResponse>(
    `${API_BASE}/clinic/${tenantId}/templates/${templateId}`
  );
  return response.data;
};

/**
 * Create a new template
 */
export const createTemplate = async (
  tenantId: string,
  data: TemplateCreate
): Promise<TemplateResponse> => {
  const response = await axiosClient.post<TemplateResponse>(
    `${API_BASE}/clinic/${tenantId}/templates`,
    data
  );
  return response.data;
};

/**
 * Update a template
 */
export const updateTemplate = async (
  tenantId: string,
  templateId: string,
  data: TemplateUpdate
): Promise<TemplateResponse> => {
  const response = await axiosClient.patch<TemplateResponse>(
    `${API_BASE}/clinic/${tenantId}/templates/${templateId}`,
    data
  );
  return response.data;
};

/**
 * Delete a template
 */
export const deleteTemplate = async (
  tenantId: string,
  templateId: string
): Promise<void> => {
  await axiosClient.delete(`${API_BASE}/clinic/${tenantId}/templates/${templateId}`);
};

/**
 * Preview template merge with sample data
 */
export const previewTemplateMerge = async (
  templateId: string,
  mergeData: Record<string, any>
): Promise<PreviewMergeResponse> => {
  const response = await axiosClient.post<PreviewMergeResponse>(
    `${API_BASE}/templates/${templateId}/preview-merge`,
    { template_id: templateId, merge_data: mergeData }
  );
  return response.data;
};

/**
 * Get template validation rules
 */
export const getTemplateValidation = async (
  templateId: string
): Promise<Record<string, any>> => {
  const response = await axiosClient.get<Record<string, any>>(
    `${API_BASE}/templates/${templateId}/validation`
  );
  return response.data;
};
