/**
 * Complete Setup Wizard Use Case
 * Handles completion of setup wizard and tenant creation
 */

import { IOnboardingRepository } from '../repositories/onboarding.repository';

export interface CompleteSetupWizardResult {
  success: boolean;
  tenantId?: string;
  message?: string;
  error?: string;
}

export class CompleteSetupWizardUseCase {
  constructor(private repository: IOnboardingRepository) {}

  async execute(applicationId: string): Promise<CompleteSetupWizardResult> {
    try {
      if (!applicationId || applicationId.trim() === '') {
        return {
          success: false,
          error: 'Application ID is required',
        };
      }

      // Business logic: Verify application is approved before completing setup
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
          error: `Setup wizard can only be completed for approved applications. Current status: ${application.status}`,
        };
      }

      // Business logic: Check setup progress
      const progress = await this.repository.getSetupWizardProgress(applicationId);
      
      if (progress.completion_percentage < 100) {
        return {
          success: false,
          error: `Setup is not complete. Current progress: ${progress.completion_percentage}%. Please complete all required steps.`,
        };
      }

      // Complete the setup wizard
      const result = await this.repository.completeSetupWizard(applicationId);

      if (!result.tenant_id) {
        return {
          success: false,
          error: 'Failed to complete setup wizard',
        };
      }

      return {
        success: true,
        tenantId: result.tenant_id,
        message: 'Setup completed successfully! Your clinic is now ready to use.',
      };
    } catch (error) {
      console.error('[CompleteSetupWizardUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete setup wizard',
      };
    }
  }
}
