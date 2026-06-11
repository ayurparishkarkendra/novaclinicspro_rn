/**
 * Schedule Plan Route
 * /clinic-admin/treatment-sheets/[treatmentSheetId]/schedule
 *
 * Admin bulk-scheduling screen for a treatment order.
 * Deep-linked from the Treatment Orders worklist "Schedule Plan" button.
 */

import React from 'react';
import { BulkSchedulePlanScreen } from '../../../../features/treatmentSheets/presentation/pages/BulkSchedulePlanScreen';

export default function SchedulePlanRoute() {
  return <BulkSchedulePlanScreen />;
}
