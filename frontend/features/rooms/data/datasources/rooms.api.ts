/**
 * Rooms API
 * Handles all HTTP calls for room management
 * 
 * IMPORTANT: All paths must start with /api/v1/...
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  RoomCreate,
  RoomUpdate,
  RoomResponse,
  ListRoomsParams,
  PaginatedRoomsResponse,
} from '../models/rooms.dtos';

/**
 * List rooms for a tenant
 * GET /api/v1/clinic/{tenant_id}/rooms
 */
export const listRoomsApi = async (
  tenantId: string,
  params?: ListRoomsParams
): Promise<PaginatedRoomsResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/rooms`,
    { params }
  );
  return response.data;
};

/**
 * Get a single room
 * GET /api/v1/clinic/{tenant_id}/rooms/{room_id}
 */
export const getRoomApi = async (
  tenantId: string,
  roomId: string
): Promise<RoomResponse> => {
  const response = await axiosClient.get(
    `/api/v1/clinic/${tenantId}/rooms/${roomId}`
  );
  return response.data;
};

/**
 * Create a room
 * POST /api/v1/clinic/{tenant_id}/rooms
 */
export const createRoomApi = async (
  tenantId: string,
  payload: RoomCreate
): Promise<RoomResponse> => {
  const response = await axiosClient.post(
    `/api/v1/clinic/${tenantId}/rooms`,
    payload
  );
  return response.data;
};

/**
 * Update a room
 * PATCH /api/v1/clinic/{tenant_id}/rooms/{room_id}
 */
export const updateRoomApi = async (
  tenantId: string,
  roomId: string,
  payload: RoomUpdate
): Promise<RoomResponse> => {
  const response = await axiosClient.patch(
    `/api/v1/clinic/${tenantId}/rooms/${roomId}`,
    payload
  );
  return response.data;
};

/**
 * Delete a room
 * DELETE /api/v1/clinic/{tenant_id}/rooms/{room_id}
 */
export const deleteRoomApi = async (
  tenantId: string,
  roomId: string
): Promise<void> => {
  await axiosClient.delete(
    `/api/v1/clinic/${tenantId}/rooms/${roomId}`
  );
};
