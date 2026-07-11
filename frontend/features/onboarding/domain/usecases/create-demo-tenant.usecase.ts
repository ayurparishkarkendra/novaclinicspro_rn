/**
 * Create Demo Tenant Use Case
 * Handles creation of a demo tenant for approved applications
 */

import { IOnboardingRepository } from '../repositories/onboarding.repository';

export interface CreateDemoTenantResult {
  success: boolean;
  demoTenantId?: string;
  demoUrl?: string;
  expiresAt?: string;
  durationDays?: number;
  message?: string;
  error?: string;
}

export class CreateDemoTenantUseCase {
  constructor(private repository: IOnboardingRepository) {}

  async execute(applicationId: string): Promise<CreateDemoTenantResult> {
    try {
      if (!applicationId || applicationId.trim() === '') {
        return {
          success: false,
          error: 'Application ID is required',
        };
      }

      // Business logic: Verify application is approved before creating demo
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
          error: `Demo tenant can only be created for approved applications. Current status: ${application.status}`,
        };
      }

      // Create demo tenant
      const demoResult = await this.repository.createDemoTenant({ application_id: applicationId });

      return {
        success: true,
        demoTenantId: demoResult.demo_tenant_id,
        demoUrl: demoResult.demo_url,
        expiresAt: demoResult.expires_at,
        durationDays: demoResult.duration_days,
        message: `Demo tenant created successfully! You have ${demoResult.duration_days} days to explore the platform.`,
      };
    } catch (error) {
      console.error('[CreateDemoTenantUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create demo tenant',
      };
    }
  }
}
