/**
 * Clinical Services DTOs
 * Data Transfer Objects matching the Phase 2 backend's
 * app/api/v1/schemas/clinical_service.py (ClinicalServiceCreate/Response).
 *
 * R3A · T-B.4: this is the first frontend surface for Clinical Services
 * (Phase 2 design §9.E, ADR-P2-05) — no field here is invented; every field
 * mirrors the backend schema exactly. Per that schema's own binding rule, no
 * request accepts a client-supplied visit_id — the server resolves the
 * active Visit from appointment_id.
 */

/** Create Clinical Service request */
export interface ClinicalServiceCreateRequest {
  appointment_id: string;
  service_type: string;
  description?: string;
  delivered_by_staff_id?: string;
  delivered_at?: string;
}

/** Clinical Service response */
export interface ClinicalServiceResponse {
  id: string;
  tenant_id: string;
  visit_id: string;
  service_type: string;
  description: string | null;
  delivered_by_staff_id: string | null;
  delivered_at: string;
  created_at: string;
}
