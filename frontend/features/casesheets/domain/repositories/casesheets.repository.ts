/**
 * Casesheets Repository Interface
 * Defines the contract for casesheet data operations
 */

import { CasesheetEntity, CasesheetStatus, CasesheetData } from '../entities/casesheet.entity';

export interface ListCasesheetsParams {
  skip?: number;
  limit?: number;
  status?: CasesheetStatus;
  fromDate?: string;
  toDate?: string;
}

export interface CasesheetsListResult {
  items: CasesheetEntity[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateCasesheetParams {
  clinicType: string;
  dataJson: CasesheetData;
  templateId?: string;
  appointmentId?: string;
  encounterId?: string;
}

export interface UpdateCasesheetParams {
  dataJson: CasesheetData;
}

export interface TransitionStatusParams {
  status: CasesheetStatus;
}

export interface PrintCasesheetResult {
  content: string;
  contentType: 'text/html' | 'application/pdf';
  filename?: string;
}

/**
 * Casesheets Repository Interface
 */
export interface ICasesheetsRepository {
  /**
   * List casesheets for a client
   */
  list(tenantId: string, clientId: string, params?: ListCasesheetsParams): Promise<CasesheetsListResult>;

  /**
   * Get a single casesheet by ID
   */
  getById(tenantId: string, casesheetId: string): Promise<CasesheetEntity>;

  /**
   * Create a new casesheet
   */
  create(tenantId: string, clientId: string, params: CreateCasesheetParams): Promise<CasesheetEntity>;

  /**
   * Update an existing casesheet
   */
  update(tenantId: string, casesheetId: string, params: UpdateCasesheetParams): Promise<CasesheetEntity>;

  /**
   * Transition casesheet status
   */
  transitionStatus(tenantId: string, casesheetId: string, params: TransitionStatusParams): Promise<CasesheetEntity>;

  /**
   * Print casesheet
   */
  print(tenantId: string, casesheetId: string): Promise<PrintCasesheetResult>;

  /**
   * Archive (soft delete) a casesheet
   */
  archive(tenantId: string, casesheetId: string): Promise<void>;
}
