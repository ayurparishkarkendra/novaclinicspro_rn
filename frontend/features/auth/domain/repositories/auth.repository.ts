/**
 * Auth Repository Interface
 * Defines contract for auth data operations
 */

import { AuthUserSession } from '../entities/auth.entity';

export interface AuthRepository {
  /**
   * Get current user session from backend
   */
  getCurrentUser(): Promise<AuthUserSession>;
}
