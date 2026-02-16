/**
 * Patient Feedback Form Route
 * Public route for patients to submit feedback via token
 * Route: /feedback/[token]
 */

import React from 'react';
import { FeedbackFormScreen } from '../../features/feedback';

export default function FeedbackFormRoute() {
  return <FeedbackFormScreen />;
}
