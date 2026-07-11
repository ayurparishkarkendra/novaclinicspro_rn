/**
 * Get Demo Status Use Case
 * Retrieves the current status of a demo tenant
 */

import { IOnboardingRepository } from '../repositories/onboarding.repository';

export interface DemoStatus {
  demoTenantId: string;
  status: 'active' | 'expired' | 'transitioned';
  expiresAt: string;
  daysRemaining: number;
  demoUrl: string;
}

export interface GetDemoStatusResult {
  success: boolean;
  demoStatus?: DemoStatus;
  isExpiringSoon?: boolean; // Less than 3 days remaining
  isExpired?: boolean; // Demo has expired
  canTransition?: boolean; // Active and not expired
  shouldCompleteSetup?: boolean; // Expired, should go to setup wizard
  error?: string;
}

export class GetDemoStatusUseCase {
  constructor(private repository: IOnboardingRepository) {}

  async execute(demoTenantId: string): Promise<GetDemoStatusResult> {
    try {
      if (!demoTenantId || demoTenantId.trim() === '') {
        return {
          success: false,
          error: 'Demo tenant ID is required',
        };
      }

      const status = await this.repository.getDemoStatus(demoTenantId);

      if (!status) {
        return {
          success: false,
          error: 'Demo tenant not found',
        };
      }

      // Business logic: Determine if demo is expiring soon
      const isExpiringSoon = status.days_remaining <= 3 && status.days_remaining > 0;

      // Business logic: Determine if demo has expired
      const isExpired = status.status === 'expired' || status.days_remaining <= 0;

      // Business logic: Determine if demo can be transitioned to live
      const canTransition = status.status === 'active' && status.days_remaining > 0;

      // Business logic: If expired, user should complete setup wizard instead
      const shouldCompleteSetup = isExpired && status.status !== 'transitioned';

      return {
        success: true,
        demoStatus: {
          demoTenantId: status.demo_tenant_id,
          status: status.status,
          expiresAt: status.expires_at,
          daysRemaining: status.days_remaining,
          demoUrl: status.demo_url,
        },
        isExpiringSoon,
        isExpired,
        canTransition,
        shouldCompleteSetup,
      };
    } catch (error) {
      console.error('[GetDemoStatusUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch demo status',
      };
    }
  }
}
