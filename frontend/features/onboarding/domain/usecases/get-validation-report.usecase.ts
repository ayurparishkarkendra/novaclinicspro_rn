/**
 * Get Validation Report Use Case
 * Retrieves validation report for an application
 */

import { IOnboardingRepository } from '../repositories/onboarding.repository';

export interface ValidationIssue {
  field: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  example?: string;
}

export interface ValidationReportResult {
  success: boolean;
  overallScore?: number;
  validationErrors?: ValidationIssue[];
  missingFields?: ValidationIssue[];
  formatIssues?: ValidationIssue[];
  priorityFixes?: string[];
  error?: string;
}

export class GetValidationReportUseCase {
  constructor(private repository: IOnboardingRepository) {}

  async execute(applicationId: string): Promise<ValidationReportResult> {
    try {
      if (!applicationId || applicationId.trim() === '') {
        return {
          success: false,
          error: 'Application ID is required',
        };
      }

      const report = await this.repository.getValidationReport(applicationId);

      if (!report) {
        return {
          success: false,
          error: 'Validation report not found',
        };
      }

      // Business logic: Determine if application is ready for resubmission
      const isReadyForResubmission = report.overall_score >= 0.7;

      return {
        success: true,
        overallScore: report.overall_score,
        validationErrors: report.validation_errors,
        missingFields: report.missing_fields,
        formatIssues: report.format_issues,
        priorityFixes: report.priority_fixes,
      };
    } catch (error) {
      console.error('[GetValidationReportUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch validation report',
      };
    }
  }
}
