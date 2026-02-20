/**
 * Onboarding Status Domain Entity
 * Clean domain representation of onboarding status
 */

import { OnboardingStatusResponse, StepValidationDTO, ValidationIssueDTO } from '../../data/models/onboarding.dtos';

export interface OnboardingStatus {
  tenantId: string;
  clinicType: string;
  totalSteps: number;
  completedSteps: number;
  completionPercentage: number;
  currentStep: string | null;
  nextRecommendedStep: string | null;
  isReadyToGoLive: boolean;
  steps: Map<string, StepStatus>;
  visibleSteps: string[];
  actionableSteps: string[];
}

export interface StepStatus {
  code: string;
  status: StepStatusType;
  isComplete: boolean;
  isValid: boolean;
  issues: Issue[];
  blockedReason: string | null;
  actionUrl: string;
  entityType: string;
  icon: string;
  category: string;
  isVisible: boolean;
  isActionable: boolean;
}

export type StepStatusType = 'completed' | 'in_progress' | 'not_started' | 'blocked';

export interface Issue {
  severity: 'blocker' | 'warning' | 'info';
  errorKey: string;
  message: string;
  entity: string | null;
  field: string | null;
}

/**
 * Map DTO to domain entity
 */
export const mapOnboardingStatusToDomain = (
  dto: OnboardingStatusResponse
): OnboardingStatus => {
  const stepsMap = new Map<string, StepStatus>();

  // Convert per_step_validation to Map
  Object.entries(dto.per_step_validation || {}).forEach(([stepCode, stepDto]) => {
    stepsMap.set(stepCode, mapStepValidationToDomain(stepDto, dto.tenant_id));
  });

  return {
    tenantId: dto.tenant_id,
    clinicType: dto.clinic_type,
    totalSteps: dto.total_steps,
    completedSteps: dto.completed_steps,
    completionPercentage: dto.completion_percentage,
    currentStep: dto.current_step || null,
    nextRecommendedStep: dto.next_recommended_step || null,
    isReadyToGoLive: dto.is_ready_to_go_live,
    steps: stepsMap,
    visibleSteps: dto.visible_steps || [],
    actionableSteps: dto.actionable_steps || [],
  };
};

/**
 * Map step validation DTO to domain
 */
const mapStepValidationToDomain = (
  dto: StepValidationDTO,
  tenantId: string
): StepStatus => {
  return {
    code: dto.step_code,
    status: dto.status,
    isComplete: dto.is_complete,
    isValid: dto.is_valid,
    issues: (dto.issues || []).map(mapIssueToDomain),
    blockedReason: dto.blocked_reason,
    actionUrl: dto.action_url_template.replace('{tenant_id}', tenantId),
    entityType: dto.entity_type,
    icon: dto.icon,
    category: dto.category,
    isVisible: dto.visible,
    isActionable: dto.actionable,
  };
};

/**
 * Map issue DTO to domain
 */
const mapIssueToDomain = (dto: ValidationIssueDTO): Issue => {
  return {
    severity: dto.severity,
    errorKey: dto.error_key,
    message: dto.resolved_message,
    entity: dto.entity,
    field: dto.field,
  };
};
