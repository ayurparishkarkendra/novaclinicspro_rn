/**
 * Auth DTOs - Data Transfer Objects
 * Based on OpenAPI CurrentUserResponse schema
 */

/**
 * Current user response from /api/v1/auth/me
 */
export interface CurrentUserResponse {
  user_id: string;
  email: string;
  tenant_id: string | null;
  roles: string[];
  permissions: string[];
  is_org_admin: boolean;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Supabase session data
 */
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
  };
}
