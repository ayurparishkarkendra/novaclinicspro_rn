/**
 * Operating Hour Entity
 * Domain model for clinic operating hours
 */

export interface OperatingHour {
  id: string;
  tenantId: string;
  dayOfWeek: number; // 0-6 (Monday-Sunday)
  dayName: string;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform DTO to entity
 */
export const toOperatingHourEntity = (dto: {
  id: string;
  tenant_id: string;
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start: string | null;
  break_end: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}): OperatingHour => ({
  id: dto.id,
  tenantId: dto.tenant_id,
  dayOfWeek: dto.day_of_week,
  dayName: dto.day_name,
  isOpen: dto.is_open,
  openTime: dto.open_time,
  closeTime: dto.close_time,
  breakStart: dto.break_start,
  breakEnd: dto.break_end,
  status: dto.status,
  isActive: dto.is_active,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

/**
 * Check if operating hour has break time configured
 */
export const hasBreakTime = (hour: OperatingHour): boolean => {
  return hour.isOpen && !!hour.breakStart && !!hour.breakEnd;
};

/**
 * Get operating hours duration in minutes
 */
export const getOperatingDuration = (hour: OperatingHour): number => {
  if (!hour.isOpen || !hour.openTime || !hour.closeTime) return 0;
  
  const parseTime = (time: string): number => {
    const parts = time.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };
  
  let duration = parseTime(hour.closeTime) - parseTime(hour.openTime);
  
  // Subtract break time if exists
  if (hour.breakStart && hour.breakEnd) {
    duration -= (parseTime(hour.breakEnd) - parseTime(hour.breakStart));
  }
  
  return Math.max(0, duration);
};
