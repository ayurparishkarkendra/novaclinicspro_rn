/**
 * RBAC Theme Hook
 * Provides Ayurveda-themed RBAC-specific colors and styles
 */

import { colors } from '../../../../core/theme/colors';

export const rbacColors = {
  // Primary colors - herbal green
  primary: {
    main: '#2F6F4E',
    light: '#4A9B70',
    dark: '#1E4D35',
    bg: '#E8F5EE',
  },
  // Secondary colors - warm earthy
  secondary: {
    main: '#C28A4B',
    light: '#D9A86C',
    dark: '#A67036',
    bg: '#FFF8F0',
  },
  // Background - soft cream
  background: {
    default: '#F8F4EC',
    paper: '#FFFFFF',
    elevated: '#FFFCF8',
  },
  // Role colors
  roles: {
    system: '#6366F1', // indigo for system roles
    custom: '#2F6F4E', // green for custom roles
    inactive: '#9CA3AF', // grey for inactive
  },
  // Permission module colors
  modules: {
    CORE: '#3B82F6',
    CLINICAL_DOCUMENTS: '#10B981',
    INVENTORY: '#F59E0B',
    BILLING: '#8B5CF6',
    APPOINTMENTS: '#EC4899',
    REPORTS: '#06B6D4',
    SETTINGS: '#6B7280',
    OTHER: '#9CA3AF',
  },
  // Action colors
  actions: {
    assigned: '#10B981',
    removed: '#EF4444',
    updated: '#F59E0B',
    expired: '#6B7280',
  },
  // Status colors
  status: {
    active: '#10B981',
    inactive: '#6B7280',
    expired: '#EF4444',
    pending: '#F59E0B',
  },
  // Feedback
  feedback: {
    success: '#059669',
    error: '#DC2626',
    warning: '#D97706',
    info: '#2563EB',
  },
  // Text
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    tertiary: '#9CA3AF',
    light: '#FFFFFF',
  },
  // Border
  border: {
    light: '#E5E7EB',
    main: '#D1D5DB',
    dark: '#9CA3AF',
  },
};

export const useRbacTheme = () => {
  return {
    colors: rbacColors,
    // Get module color
    getModuleColor: (module: string): string => {
      return rbacColors.modules[module as keyof typeof rbacColors.modules] || rbacColors.modules.OTHER;
    },
    // Get action color
    getActionColor: (action: string): string => {
      return rbacColors.actions[action as keyof typeof rbacColors.actions] || rbacColors.actions.updated;
    },
    // Get status color
    getStatusColor: (isActive: boolean, isExpired?: boolean): string => {
      if (isExpired) return rbacColors.status.expired;
      return isActive ? rbacColors.status.active : rbacColors.status.inactive;
    },
    // Get role type color
    getRoleTypeColor: (isSystem: boolean, isActive: boolean): string => {
      if (!isActive) return rbacColors.roles.inactive;
      return isSystem ? rbacColors.roles.system : rbacColors.roles.custom;
    },
  };
};
