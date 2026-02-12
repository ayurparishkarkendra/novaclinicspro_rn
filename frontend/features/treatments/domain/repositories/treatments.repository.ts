/**
 * Treatments Repository Interface
 * Domain contract for treatment operations
 */

import { Treatment, DoshaBenefits } from '../entities/treatment.entity';

export interface CreateTreatmentPayload {
  code: string;
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  basePrice?: number | null;
  price?: number | null;
  doshaBenefits?: DoshaBenefits | null;
  contraindications?: string | null;
  metadata?: Record<string, any> | null;
}

export interface UpdateTreatmentPayload {
  code?: string | null;
  name?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  basePrice?: number | null;
  price?: number | null;
  doshaBenefits?: DoshaBenefits | null;
  contraindications?: string | null;
  metadata?: Record<string, any> | null;
  isActive?: boolean | null;
}

export interface ListTreatmentsFilter {
  isActive?: boolean;
  code?: string;
  skip?: number;
  limit?: number;
}

export interface PaginatedTreatments {
  items: Treatment[];
  total: number;
  skip: number;
  limit: number;
}

export interface TreatmentsRepository {
  list(tenantId: string, filter?: ListTreatmentsFilter): Promise<PaginatedTreatments>;
  get(tenantId: string, treatmentId: string): Promise<Treatment>;
  create(tenantId: string, payload: CreateTreatmentPayload): Promise<Treatment>;
  update(tenantId: string, treatmentId: string, payload: UpdateTreatmentPayload): Promise<Treatment>;
  delete(tenantId: string, treatmentId: string): Promise<void>;
}
