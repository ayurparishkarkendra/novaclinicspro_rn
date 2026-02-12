/**
 * Rooms Repository Interface
 * Domain contract for room operations
 */

import { Room, RoomType } from '../entities/room.entity';

export interface CreateRoomPayload {
  name: string;
  capacity?: number;
  roomType?: RoomType | null;
}

export interface UpdateRoomPayload {
  name?: string | null;
  capacity?: number | null;
  roomType?: RoomType | null;
  isActive?: boolean | null;
}

export interface ListRoomsFilter {
  isActive?: boolean;
  roomType?: RoomType;
  skip?: number;
  limit?: number;
}

export interface PaginatedRooms {
  items: Room[];
  total: number;
  skip: number;
  limit: number;
}

export interface RoomsRepository {
  list(tenantId: string, filter?: ListRoomsFilter): Promise<PaginatedRooms>;
  get(tenantId: string, roomId: string): Promise<Room>;
  create(tenantId: string, payload: CreateRoomPayload): Promise<Room>;
  update(tenantId: string, roomId: string, payload: UpdateRoomPayload): Promise<Room>;
  delete(tenantId: string, roomId: string): Promise<void>;
}
