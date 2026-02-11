/**
 * Bootstrap Session Use Case
 * Orchestrates initial session setup on app start
 */

import { supabase } from '../../../../core/api/supabaseClient';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthUserSession } from '../entities/auth.entity';

export interface BootstrapSessionResult {
  authenticated: boolean;
  session: AuthUserSession | null;
  error?: string;
}

export class BootstrapSessionUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(): Promise<BootstrapSessionResult> {
    try {
      // Check if we have a valid Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return {
          authenticated: false,
          session: null,
          error: error?.message || 'No active session',
        };
      }

      // Fetch user context from backend
      const userSession = await this.authRepository.getCurrentUser();

      return {
        authenticated: true,
        session: userSession,
      };
    } catch (error) {
      return {
        authenticated: false,
        session: null,
        error: error instanceof Error ? error.message : 'Session bootstrap failed',
      };
    }
  }
}
