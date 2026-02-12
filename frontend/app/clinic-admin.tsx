/**
 * Clinic Admin Route Redirect
 * Redirects to the clinic-admin folder index
 */

import { Redirect } from 'expo-router';

export default function ClinicAdminRedirect() {
  return <Redirect href="/clinic-admin/" />;
}
