/**
 * Clinic Admin Index Route
 * Redirects to the dashboard (clinic-admin.tsx at root)
 */

import { Redirect } from 'expo-router';

export default function ClinicAdminIndex() {
  // This redirects to the main dashboard
  // The actual dashboard is at /app/clinic-admin.tsx (root level)
  return <Redirect href="/clinic-admin" />;
}
