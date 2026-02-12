/**
 * Room Entity
 * Domain model for clinic rooms
 */

export type RoomType = 'therapy' | 'consultation' | 'examination' | 'treatment' | 'procedure';

export interface Room {
  id: string;
  tenantId: string;
  name: string;
  capacity: number;
  roomType: RoomType | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Transform DTO to entity
 */
export const toRoomEntity = (dto: {
  id: string;
  tenant_id: string;
  name: string;
  capacity: number;
  room_type: RoomType | null;
  is_active: boolean;
  created_at: string;
}): Room => ({
  id: dto.id,
  tenantId: dto.tenant_id,
  name: dto.name,
  capacity: dto.capacity,
  roomType: dto.room_type,
  isActive: dto.is_active,
  createdAt: new Date(dto.created_at),
});

/**
 * Get room type display info
 */
export const getRoomTypeInfo = (roomType: RoomType | null): { label: string; color: string } => {
  const types: Record<RoomType, { label: string; color: string }> = {
    therapy: { label: 'Therapy', color: '#10B981' },
    consultation: { label: 'Consultation', color: '#3B82F6' },
    examination: { label: 'Examination', color: '#8B5CF6' },
    treatment: { label: 'Treatment', color: '#F59E0B' },
    procedure: { label: 'Procedure', color: '#EF4444' },
  };
  
  if (!roomType) return { label: 'General', color: '#6B7280' };
  return types[roomType] || { label: roomType, color: '#6B7280' };
};
