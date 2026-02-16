/**
 * Prescriptions Repository Interface
 * Defines the contract for prescription data operations
 */

import { PrescriptionEntity, PrescriptionStatus, PrescriptionData, ShareChannel } from '../entities/prescription.entity';

export interface ListPrescriptionsParams {
  skip?: number;
  limit?: number;
  clientId?: string;
  status?: PrescriptionStatus;
  fromDate?: string;
  toDate?: string;
}

export interface PrescriptionsListResult {
  items: PrescriptionEntity[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreatePrescriptionParams {
  clientId: string;
  prescriptionData: PrescriptionData;
  appointmentId?: string;
  issuedByStaffId?: string;
  notes?: string;
  nextVisitDays?: number;
  sourceDocumentId?: string;
  sourceDocumentType?: string;
  repeatPreviousPrescriptionId?: string;
}

export interface UpdatePrescriptionParams {
  prescriptionData?: PrescriptionData;
  appointmentId?: string;
  issuedByStaffId?: string;
  notes?: string;
  status?: PrescriptionStatus;
  signedByStaffId?: string;
  isActive?: boolean;
}

export interface SharePrescriptionParams {
  channel: ShareChannel;
  recipientPhone?: string;
  recipientEmail?: string;
  customMessage?: string;
  prescriptionPdfUrl?: string;
}

export interface SharePrescriptionResult {
  success: boolean;
  channel: ShareChannel;
  prescriptionId: string;
  clientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  error?: string;
}

/**
 * Prescriptions Repository Interface
 */
export interface IPrescriptionsRepository {
  /**
   * List prescriptions (tenant-scoped, can filter by client)
   */
  list(tenantId: string, params?: ListPrescriptionsParams): Promise<PrescriptionsListResult>;

  /**
   * Get a single prescription by ID
   */
  getById(tenantId: string, prescriptionId: string): Promise<PrescriptionEntity>;

  /**
   * Create a new prescription
   */
  create(tenantId: string, params: CreatePrescriptionParams): Promise<PrescriptionEntity>;

  /**
   * Update an existing prescription
   */
  update(tenantId: string, prescriptionId: string, params: UpdatePrescriptionParams): Promise<PrescriptionEntity>;

  /**
   * Delete a prescription
   */
  delete(tenantId: string, prescriptionId: string): Promise<void>;

  /**
   * Share a signed prescription
   */
  share(tenantId: string, prescriptionId: string, params: SharePrescriptionParams): Promise<SharePrescriptionResult>;
}
