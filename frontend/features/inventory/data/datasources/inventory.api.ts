/**
 * Inventory API
 * Handles all HTTP calls for inventory management
 *
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  InventoryCreateRequest,
  InventoryUpdateRequest,
  StockAdjustmentRequest,
  BatchCreateRequest,
  BatchUpdateRequest,
  AlertAcknowledgeRequest,
  InventoryItemResponse,
  InventoryListResponse,
  MovementResponse,
  MovementsListResponse,
  BatchResponse,
  BatchesListResponse,
  AlertsListResponse,
  ListInventoryParams,
  ListMovementsParams,
  ListBatchesParams,
  ListAlertsParams,
} from '../models/inventory.dtos';

// ============================================
// INVENTORY ITEMS
// ============================================

/**
 * List inventory items
 * GET /api/v1/clinic/{tenant_id}/inventory
 */
export const listInventoryItemsApi = async (
  tenantId: string,
  params?: ListInventoryParams
): Promise<InventoryListResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/inventory`,
    { params }
  );
  return response.data;
};

/**
 * Get a single inventory item
 * GET /api/v1/clinic/{tenant_id}/inventory/{item_id}
 */
export const getInventoryItemApi = async (
  tenantId: string,
  itemId: string
): Promise<InventoryItemResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/inventory/${itemId}`
  );
  return response.data;
};

/**
 * Create a new inventory item
 * POST /api/v1/clinic/{tenant_id}/inventory
 */
export const createInventoryItemApi = async (
  tenantId: string,
  payload: InventoryCreateRequest
): Promise<InventoryItemResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/inventory`,
    payload
  );
  return response.data;
};

/**
 * Update an inventory item
 * PATCH /api/v1/clinic/{tenant_id}/inventory/{item_id}
 */
export const updateInventoryItemApi = async (
  tenantId: string,
  itemId: string,
  payload: InventoryUpdateRequest
): Promise<InventoryItemResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/inventory/${itemId}`,
    payload
  );
  return response.data;
};

/**
 * Delete an inventory item
 * DELETE /api/v1/clinic/{tenant_id}/inventory/{item_id}
 */
export const deleteInventoryItemApi = async (
  tenantId: string,
  itemId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/clinic/${tenantId}/inventory/${itemId}`
  );
};

// ============================================
// STOCK ADJUSTMENTS & MOVEMENTS
// ============================================

/**
 * Adjust stock for an inventory item
 * POST /api/v1/clinic/{tenant_id}/inventory/{item_id}/adjust-stock
 */
export const adjustInventoryStockApi = async (
  tenantId: string,
  itemId: string,
  payload: StockAdjustmentRequest
): Promise<MovementResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/inventory/${itemId}/adjust-stock`,
    payload
  );
  return response.data;
};

/**
 * List inventory movements for an item
 * GET /api/v1/clinic/{tenant_id}/inventory/{item_id}/movements
 */
export const listInventoryMovementsApi = async (
  tenantId: string,
  itemId: string,
  params?: ListMovementsParams
): Promise<MovementsListResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/inventory/${itemId}/movements`,
    { params }
  );
  return response.data;
};

// ============================================
// BATCHES
// ============================================

/**
 * List batches for an inventory item
 * GET /api/v1/clinic/{tenant_id}/inventory/{item_id}/batches
 */
export const listInventoryBatchesApi = async (
  tenantId: string,
  itemId: string,
  params?: ListBatchesParams
): Promise<BatchesListResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/inventory/${itemId}/batches`,
    { params }
  );
  return response.data;
};

/**
 * Create a new batch for an inventory item
 * POST /api/v1/clinic/{tenant_id}/inventory/{item_id}/batches
 */
export const createInventoryBatchApi = async (
  tenantId: string,
  itemId: string,
  payload: BatchCreateRequest
): Promise<BatchResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/inventory/${itemId}/batches`,
    payload
  );
  return response.data;
};

/**
 * Update a batch
 * PATCH /api/v1/clinic/{tenant_id}/inventory/batches/{batch_id}
 */
export const updateInventoryBatchApi = async (
  tenantId: string,
  batchId: string,
  payload: BatchUpdateRequest
): Promise<BatchResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/inventory/batches/${batchId}`,
    payload
  );
  return response.data;
};

// ============================================
// ALERTS
// ============================================

/**
 * List inventory alerts
 * GET /api/v1/clinic/{tenant_id}/inventory/alerts
 */
export const listInventoryAlertsApi = async (
  tenantId: string,
  params?: ListAlertsParams
): Promise<AlertsListResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/inventory/alerts`,
    { params }
  );
  return response.data;
};

/**
 * Acknowledge inventory alerts
 * POST /api/v1/clinic/{tenant_id}/inventory/alerts/acknowledge
 */
export const acknowledgeInventoryAlertsApi = async (
  tenantId: string,
  payload: AlertAcknowledgeRequest
): Promise<void> => {
  await axiosClient.post(
    `/api/v1/clinic/${tenantId}/inventory/alerts/acknowledge`,
    payload
  );
};

// ============================================
// SEARCH
// ============================================

/**
 * Search inventory by medicine name, expiry date, batch number, or sku number
 * GET /api/v1/clinic/{tenant_id}/inventory/search
 * 
 * @param tenantId - Clinic tenant ID
 * @param query - Search query (medicine name, batch, sku, etc.)
 * @param limit - Optional limit for results
 */
export const searchInventoryApi = async (
  tenantId: string,
  query: string,
  limit?: number
): Promise<InventoryListResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/inventory/search`,
    { params: { query, limit } }
  );
  return response.data;
};
