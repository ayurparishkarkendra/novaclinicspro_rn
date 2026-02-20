/**
 * Get Setup Wizard Context Use Case
 * Retrieves setup wizard context and pre-populated data
 */

import { IOnboardingRepository } from '../repositories/onboarding.repository';

export interface SetupWizardContext {
  applicationId: string;
  tenantName: string;
  prePopulatedData: {
    clinic_profile?: Record<string, any>;
    operating_hours?: Record<string, any>;
  };
  setupSteps: string[];
  estimatedTime: string;
}

export interface GetSetupWizardContextResult {
  success: boolean;
  context?: SetupWizardContext;
  error?: string;
}

export class GetSetupWizardContextUseCase {
  constructor(private repository: IOnboardingRepository) {}

  async execute(applicationId: string): Promise<GetSetupWizardContextResult> {
    try {
      if (!applicationId || applicationId.trim() === '') {
        return {
          success: false,
          error: 'Application ID is required',
        };
      }

      // Business logic: Verify application is approved
      const application = await this.repository.getApplicationDetail(applicationId);
      
      if (!application) {
        return {
          success: false,
          error: 'Application not found',
        };
      }

      if (application.status !== 'APPROVED') {
        return {
          success: false,
          error: `Setup wizard is only available for approved applications. Current status: ${application.status}`,
        };
      }

      // Get setup wizard context
      const context = await this.repository.getSetupWizardContext(applicationId);

      if (!context) {
        return {
          success: false,
          error: 'Setup wizard context not found',
        };
      }

      return {
        success: true,
        context: {
          applicationId: context.application_id,
          tenantName: context.tenant_name,
          prePopulatedData: context.pre_populated_data,
          setupSteps: context.setup_steps,
          estimatedTime: context.estimated_time,
        },
      };
    } catch (error) {
      console.error('[GetSetupWizardContextUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch setup wizard context',
      };
    }
  }
}
