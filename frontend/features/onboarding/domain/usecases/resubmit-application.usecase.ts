/**
 * Resubmit Application Use Case
 * Handles resubmission of improved application
 */

import { IOnboardingRepository } from '../repositories/onboarding.repository';
import { ApplicationDetailResponse } from '../../data/models/onboarding.dtos';

export interface ResubmitApplicationResult {
  success: boolean;
  application?: ApplicationDetailResponse;
  message?: string;
  error?: string;
}

export class ResubmitApplicationUseCase {
  constructor(private repository: IOnboardingRepository) {}

  async execute(applicationId: string): Promise<ResubmitApplicationResult> {
    try {
      if (!applicationId || applicationId.trim() === '') {
        return {
          success: false,
          error: 'Application ID is required',
        };
      }

      // Business logic: Verify application exists before resubmission
      const existingApplication = await this.repository.getApplicationDetail(applicationId);
      
      if (!existingApplication) {
        return {
          success: false,
          error: 'Application not found',
        };
      }

      // Business logic: Check if application is in a resubmittable state
      if (existingApplication.status !== 'REJECTED' && existingApplication.status !== 'DRAFT') {
        return {
          success: false,
          error: `Application cannot be resubmitted. Current status: ${existingApplication.status}`,
        };
      }

      // Resubmit the application
      const updatedApplication = await this.repository.resubmitApplication(applicationId);

      return {
        success: true,
        application: updatedApplication,
        message: 'Application resubmitted successfully. You will be notified once reviewed.',
      };
    } catch (error) {
      console.error('[ResubmitApplicationUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resubmit application',
      };
    }
  }
}
