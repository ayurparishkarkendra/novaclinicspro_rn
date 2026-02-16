/**
 * Treatment Sheets Repository Interface
 */

import { TreatmentSheetEntity, TreatmentSheetStatus, TreatmentSheetRowEntity } from '../entities/treatmentSheet.entity';

export interface CreateTreatmentSheetParams {
  clientId: string;
  rows: Array<{
    treatmentId: string;
    quantity: number;
    unit?: string;
    scheduledDate?: string;
    assignedTherapistId?: string;
    notes?: string;
  }>;
  appointmentId?: string;
  encounterId?: string;
  treatmentPlanSummary?: string;
}

export interface UpdateTreatmentSheetRowParams {
  quantity?: number;
  unit?: string;
  scheduledDate?: string;
  assignedTherapistId?: string;
  notes?: string;
}

export interface CompleteTreatmentSheetRowParams {
  completedByStaffId?: string;
  notes?: string;
}

export interface TransitionStatusParams {
  status: TreatmentSheetStatus;
}

export interface PrintTreatmentSheetResult {
  content: string;
  contentType: 'text/html' | 'application/pdf';
  filename?: string;
}

export interface SyncTreatmentSheetResult {
  success: boolean;
  rowsAdded: number;
  rowsUpdated: number;
}

/**
 * Treatment Sheets Repository Interface
 */
export interface ITreatmentSheetsRepository {
  /**
   * Get a treatment sheet by ID
   */
  getById(treatmentSheetId: string): Promise<TreatmentSheetEntity>;

  /**
   * Create a new treatment sheet from a casesheet
   */
  createFromCasesheet(casesheetId: string, params: CreateTreatmentSheetParams): Promise<TreatmentSheetEntity>;

  /**
   * Create a simple treatment sheet (tenant-scoped)
   */
  create(tenantId: string, params: CreateTreatmentSheetParams): Promise<TreatmentSheetEntity>;

  /**
   * Transition treatment sheet status
   */
  transitionStatus(treatmentSheetId: string, params: TransitionStatusParams): Promise<TreatmentSheetEntity>;

  /**
   * Update a treatment sheet row
   */
  updateRow(rowId: string, params: UpdateTreatmentSheetRowParams): Promise<TreatmentSheetEntity>;

  /**
   * Complete a treatment sheet row
   */
  completeRow(rowId: string, params: CompleteTreatmentSheetRowParams): Promise<TreatmentSheetEntity>;

  /**
   * Sync treatment sheet with sessions
   */
  sync(treatmentSheetId: string): Promise<SyncTreatmentSheetResult>;

  /**
   * Print treatment sheet
   */
  print(treatmentSheetId: string): Promise<PrintTreatmentSheetResult>;

  /**
   * Archive (soft delete) a treatment sheet
   */
  archive(treatmentSheetId: string): Promise<void>;
}
