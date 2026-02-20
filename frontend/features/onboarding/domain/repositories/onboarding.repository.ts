/**
 * Onboarding Repository Interface
 * Defines the contract for onboarding data operations
 */

import {
  ApplicationDetailResponse,
  ValidationReportResponse,
  ApplicationImprovementRequest,
  ApplicationImprovementResponse,
  DemoCreateRequest,
  DemoCreateResponse,
  DemoStatusResponse,
  SetupWizardContextResponse,
  SetupWizardProgressResponse,
} from '../../data/models/onboarding.dtos';

export interface IOnboardingRepository {
  getApplicationDetail(applicationId: string): Promise<ApplicationDetailResponse>;
  getValidationReport(applicationId: string): Promise<ValidationReportResponse>;
  improveApplication(
    applicationId: string, 
    data: ApplicationImprovementRequest
  ): Promise<ApplicationImprovementResponse>;
  resubmitApplication(applicationId: string): Promise<ApplicationDetailResponse>;
  createDemoTenant(data: DemoCreateRequest): Promise<DemoCreateResponse>;
  getDemoStatus(demoTenantId: string): Promise<DemoStatusResponse>;
  transitionDemoToLive(demoTenantId: string): Promise<{ tenant_id: string; tenant_url: string }>;
  getSetupWizardContext(applicationId: string): Promise<SetupWizardContextResponse>;
  getSetupWizardProgress(applicationId: string): Promise<SetupWizardProgressResponse>;
  completeSetupWizard(applicationId: string): Promise<{ tenant_id: string }>;
}
