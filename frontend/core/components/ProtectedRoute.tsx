/**
 * Protected Route Component
 * Wraps routes that require authentication and optionally specific roles
 * Redirects to login if not authenticated
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../features/auth/presentation/providers/auth.store';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required roles to access this route (optional - if not provided, just checks authentication) */
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, currentUser } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log('[ProtectedRoute] Not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }

    // If roles are required, check if user has appropriate role
    // Note: We no longer redirect here - we show access denied in the render
    if (allowedRoles && allowedRoles.length > 0 && currentUser) {
      const userRoles = currentUser.roles || [];
      const userRole = (currentUser as any).role;
      const allUserRoles = [...userRoles, userRole].filter(Boolean).map(r => r.toLowerCase());
      
      // Also check for isOrgAdmin flag
      if (currentUser.isOrgAdmin) {
        allUserRoles.push('super_admin', 'org_admin', 'system_admin');
      }
      
      const hasRequiredRole = allowedRoles.some(role => 
        allUserRoles.includes(role.toLowerCase())
      );

      if (!hasRequiredRole) {
        console.log('[ProtectedRoute] User lacks required role:', { required: allowedRoles, has: allUserRoles });
        // Don't redirect - let render show access denied
      }
    }
  }, [isAuthenticated, isLoading, currentUser, allowedRoles, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.text}>Redirecting to login...</Text>
      </View>
    );
  }

  // Check role access
  if (allowedRoles && allowedRoles.length > 0 && currentUser) {
    const userRoles = currentUser.roles || [];
    const userRole = (currentUser as any).role;
    const allUserRoles = [...userRoles, userRole].filter(Boolean).map(r => r.toLowerCase());
    
    // Also check for isOrgAdmin flag
    if (currentUser.isOrgAdmin) {
      allUserRoles.push('super_admin', 'org_admin', 'system_admin');
    }
    
    const hasRequiredRole = allowedRoles.some(role => 
      allUserRoles.includes(role.toLowerCase())
    );

    if (!hasRequiredRole) {
      return (
        <View style={styles.container}>
          <Ionicons name="lock-closed" size={64} color={colors.error.main} />
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.text}>You don't have permission to access this page.</Text>
          <Text style={styles.roleInfo}>Your roles: {userRoles.length > 0 ? userRoles.join(', ') : 'None assigned'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.primary.main} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.xl,
  },
  text: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.h4,
    color: colors.error.main,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  roleInfo: {
    ...typography.body2,
    color: colors.text.disabled,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main + '15',
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  backButtonText: {
    ...typography.button,
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
});

export default ProtectedRoute;
