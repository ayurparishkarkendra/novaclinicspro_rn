/**
 * Onboarding Status Entity Tests
 */

import {
  mapOnboardingStatusToDomain,
  OnboardingStatus,
} from '../../features/onboarding/domain/entities/onboarding-status.entity';
import { OnboardingStatusResponse } from '../../features/onboarding/data/models/onboarding.dtos';

describe('Onboarding Status Entity Mapper', () => {
  const mockResponse: OnboardingStatusResponse = {
    tenant_id: 'test-tenant-123',
    template_id: 'template-456',
    clinic_type: 'ayurveda',
    total_steps: 8,
    completed_steps: 3,
    in_progress_steps: 1,
    pending_steps: 4,
    blocked_steps: 0,
    completion_percentage: 37.5,
    current_step: 'staff_setup',
    next_recommended_step: 'treatment_rooms',
    is_ready_to_go_live: false,
    per_step_validation: {
      clinic_profile: {
        step_code: 'clinic_profile',
        status: 'completed',
        is_complete: true,
        is_valid: true,
        issues: [],
        blocked_reason: null,
        action_url_template: '/clinic/{tenant_id}/profile',
        entity_type: 'clinic_profile',
        icon: 'building',
        category: 'basic_setup',
        visible: true,
        actionable: true,
      },
      staff_setup: {
        step_code: 'staff_setup',
        status: 'in_progress',
        is_complete: false,
        is_valid: false,
        issues: [
          {
            severity: 'blocker',
            error_key: 'STAFF_MIN_COUNT_NOT_MET',
            resolved_message: 'At least 1 staff member is required',
            entity: 'staff',
            field: null,
          },
        ],
        blocked_reason: 'At least 1 staff member is required',
        action_url_template: '/clinic/{tenant_id}/staff',
        entity_type: 'staff',
        icon: 'people',
        category: 'resources',
        visible: true,
        actionable: true,
      },
    },
    visible_steps: ['clinic_profile', 'staff_setup'],
    actionable_steps: ['clinic_profile', 'staff_setup'],
  };

  it('maps DTO to domain entity correctly', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);

    expect(result.tenantId).toBe('test-tenant-123');
    expect(result.clinicType).toBe('ayurveda');
    expect(result.totalSteps).toBe(8);
    expect(result.completedSteps).toBe(3);
    expect(result.completionPercentage).toBe(37.5);
    expect(result.currentStep).toBe('staff_setup');
    expect(result.nextRecommendedStep).toBe('treatment_rooms');
    expect(result.isReadyToGoLive).toBe(false);
  });

  it('converts snake_case to camelCase', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);

    expect(result).toHaveProperty('tenantId');
    expect(result).toHaveProperty('clinicType');
    expect(result).toHaveProperty('totalSteps');
    expect(result).toHaveProperty('completedSteps');
    expect(result).toHaveProperty('completionPercentage');
    expect(result).toHaveProperty('currentStep');
    expect(result).toHaveProperty('nextRecommendedStep');
    expect(result).toHaveProperty('isReadyToGoLive');
  });

  it('maps per_step_validation to steps Map', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);

    expect(result.steps).toBeInstanceOf(Map);
    expect(result.steps.size).toBe(2);
    expect(result.steps.has('clinic_profile')).toBe(true);
    expect(result.steps.has('staff_setup')).toBe(true);
  });

  it('maps step validation correctly', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);
    const staffStep = result.steps.get('staff_setup');

    expect(staffStep).toBeDefined();
    expect(staffStep?.code).toBe('staff_setup');
    expect(staffStep?.status).toBe('in_progress');
    expect(staffStep?.isComplete).toBe(false);
    expect(staffStep?.isValid).toBe(false);
    expect(staffStep?.blockedReason).toBe('At least 1 staff member is required');
    expect(staffStep?.entityType).toBe('staff');
    expect(staffStep?.icon).toBe('people');
    expect(staffStep?.category).toBe('resources');
    expect(staffStep?.isVisible).toBe(true);
    expect(staffStep?.isActionable).toBe(true);
  });

  it('replaces {tenant_id} in action URL template', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);
    const clinicProfileStep = result.steps.get('clinic_profile');

    expect(clinicProfileStep?.actionUrl).toBe('/clinic/test-tenant-123/profile');
  });

  it('maps validation issues correctly', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);
    const staffStep = result.steps.get('staff_setup');

    expect(staffStep?.issues).toHaveLength(1);
    expect(staffStep?.issues[0]).toEqual({
      severity: 'blocker',
      errorKey: 'STAFF_MIN_COUNT_NOT_MET',
      message: 'At least 1 staff member is required',
      entity: 'staff',
      field: null,
    });
  });

  it('maps visible and actionable steps arrays', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);

    expect(result.visibleSteps).toEqual(['clinic_profile', 'staff_setup']);
    expect(result.actionableSteps).toEqual(['clinic_profile', 'staff_setup']);
  });

  it('handles null current step', () => {
    const responseWithNullStep = {
      ...mockResponse,
      current_step: null as any,
    };

    const result = mapOnboardingStatusToDomain(responseWithNullStep);

    expect(result.currentStep).toBeNull();
  });

  it('handles null next recommended step', () => {
    const responseWithNullNext = {
      ...mockResponse,
      next_recommended_step: null as any,
    };

    const result = mapOnboardingStatusToDomain(responseWithNullNext);

    expect(result.nextRecommendedStep).toBeNull();
  });

  it('handles empty per_step_validation', () => {
    const responseWithEmptySteps = {
      ...mockResponse,
      per_step_validation: {},
    };

    const result = mapOnboardingStatusToDomain(responseWithEmptySteps);

    expect(result.steps.size).toBe(0);
  });

  it('handles steps with no issues', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);
    const clinicProfileStep = result.steps.get('clinic_profile');

    expect(clinicProfileStep?.issues).toEqual([]);
  });

  it('handles steps with null blocked reason', () => {
    const result = mapOnboardingStatusToDomain(mockResponse);
    const clinicProfileStep = result.steps.get('clinic_profile');

    expect(clinicProfileStep?.blockedReason).toBeNull();
  });
});
