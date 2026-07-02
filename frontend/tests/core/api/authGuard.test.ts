/**
 * Phase 1 · T-A.4 (FR-A5, design.md §6.2) — Verifies the shared
 * "logging out" flag (core/api/authGuard.ts) and its wiring into
 * axiosClient.ts's request interceptor.
 *
 * authGuard.ts itself is a plain module with no env-var/native
 * dependencies, so it's imported and exercised directly. axiosClient.ts is
 * verified via source inspection instead — the same established technique
 * used by tests/core/api/observability.test.ts (T-0.7), since importing
 * the real axiosClient.ts requires build-time Supabase/API-base-URL env
 * values not settable at test runtime.
 */
import fs from 'fs';
import path from 'path';
import { setLoggingOut, isLoggingOut } from '../../../core/api/authGuard';

describe('authGuard (T-A.4)', () => {
  afterEach(() => {
    setLoggingOut(false); // don't leak state into other test files
  });

  it('defaults to false', () => {
    expect(isLoggingOut()).toBe(false);
  });

  it('reflects whatever was last set, synchronously', () => {
    setLoggingOut(true);
    expect(isLoggingOut()).toBe(true);
    setLoggingOut(false);
    expect(isLoggingOut()).toBe(false);
  });
});

describe('axiosClient request interceptor wiring to authGuard (T-A.4, source inspection)', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../../core/api/axiosClient.ts'),
    'utf8'
  );

  it('imports isLoggingOut from authGuard', () => {
    expect(source).toContain("import { isLoggingOut } from './authGuard';");
  });

  it('checks isLoggingOut() before the supabase.auth.getSession() call in the request interceptor, and skips attaching Authorization when true', () => {
    const interceptorStart = source.indexOf('axiosClient.interceptors.request.use(');
    const interceptorEnd = source.indexOf('\n);', interceptorStart);
    const body = source.slice(interceptorStart, interceptorEnd);

    const guardIndex = body.indexOf('if (isLoggingOut())');
    const getSessionIndex = body.indexOf('supabase.auth.getSession()');
    expect(guardIndex).toBeGreaterThan(-1);
    expect(getSessionIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(getSessionIndex);

    // The getSession()/Authorization-attaching branch must be the `else` of
    // the isLoggingOut() check, not merely appearing somewhere after it.
    const guardBlock = body.slice(guardIndex, getSessionIndex);
    expect(guardBlock).toContain('} else {');
    expect(guardBlock).not.toContain('config.headers.Authorization');
  });
});
