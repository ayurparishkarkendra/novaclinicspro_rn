/**
 * Therapist Dashboard Route
 * Entry point for the therapist dashboard at /therapist
 * 
 * This file renders the TherapistDashboardScreen from the therapistDashboard feature module
 * following clean architecture patterns.
 */

import React from 'react';
import { TherapistDashboardScreen } from '../features/therapistDashboard';

export default function TherapistDashboardRoute() {
  return <TherapistDashboardScreen />;
}
