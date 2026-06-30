/**
 * Shared React Query client.
 *
 * Exported as a singleton (rather than only living inside app/_layout.tsx) so
 * that non-component code — e.g. the logout() flow in useAuth — can cancel
 * in-flight queries and clear the cache when the session ends. Without this,
 * cached/active queries (most often ones re-triggered via an explicit
 * `refetch()` from a `useFocusEffect`, which bypasses each query's `enabled`
 * guard) can fire authenticated requests after the JWT has already been
 * cleared, producing "Authorization header required" 401s right after logout.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Only retry on network errors, not on business errors (401, 403, 404)
      retry: (failureCount, error: any) => {
        // Don't retry on authentication/authorization errors
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors (network issues, 500s)
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Errors are handled in UI components, not via a global query-level
      // onError — that callback was removed from query defaultOptions in
      // React Query v5 (still valid on mutations below).
    },
    mutations: {
      // Don't show global error notifications - errors are handled in UI
      onError: () => {
        // Errors are displayed in the UI
      },
    },
  },
});
