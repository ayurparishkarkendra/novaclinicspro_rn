/**
 * Operating Hours Repository Interface
 * Domain contract for operating hours operations
 */

import { OperatingHour } from '../entities/operatingHour.entity';

export interface CreateOperatingHourPayload {
  dayOfWeek: number;
  isOpen: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  status?: string;
}

export interface UpdateOperatingHourPayload {
  dayOfWeek?: number | null;
  isOpen?: boolean | null;
  openTime?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  status?: string | null;
  isActive?: boolean | null;
}

export interface ListOperatingHoursFilter {
  isActive?: boolean;
  dayOfWeek?: number;
  skip?: number;
  limit?: number;
}

export interface PaginatedOperatingHours {
  items: OperatingHour[];
  total: number;
  skip: number;
  limit: number;
}

export interface OperatingHoursRepository {
  list(tenantId: string, filter?: ListOperatingHoursFilter): Promise<PaginatedOperatingHours>;
  get(tenantId: string, id: string): Promise<OperatingHour>;
  create(tenantId: string, payload: CreateOperatingHourPayload): Promise<OperatingHour>;
  update(tenantId: string, id: string, payload: UpdateOperatingHourPayload): Promise<OperatingHour>;
  delete(tenantId: string, id: string): Promise<void>;
}
