/**
 * Application Entity
 * Domain model for clinic applications
 */

export interface Application {
  id: string;
  tenantId?: string;
  tenantName: string;
  status: ApplicationStatus;
  businessProfile?: BusinessProfile;
  contactDetails?: ContactDetails;
  autoApprovalResult?: AutoApprovalResult;
  approvedComponents?: string[];
  validationErrors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationStatus = 
  | 'DRAFT' 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'ACTIVE';

export interface BusinessProfile {
  businessName?: string;
  businessType?: string;
  taxId?: string;
  registrationNumber?: string;
}

export interface ContactDetails {
  primaryContact: {
    name: string;
    phone: string;
    email: string;
  };
  clinicAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export interface AutoApprovalResult {
  eligible: boolean;
  riskScore: number;
  riskFactors: string[];
  reason?: string;
}
