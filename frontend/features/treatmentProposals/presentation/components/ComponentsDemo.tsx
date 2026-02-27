/**
 * Components Demo Screen
 * Visual demonstration of all shared UI components
 * This can be used for manual testing and visual verification
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import {
  ProposalStatusBadge,
  TreatmentSheetStatusBadge,
  RowStatusBadge,
  CostDisplay,
  ProgressBar,
  ConfirmationDialog,
} from './index';
import {
  ProposalStatus,
  TreatmentSheetStatus,
  RowStatus,
} from '../../data/models/treatmentProposals.dtos';

// ============================================
// COMPONENT
// ============================================

export const ComponentsDemo: React.FC = () => {
  const theme = useClinicTheme();
  const [showDialog, setShowDialog] = useState(false);
  const [showDestructiveDialog, setShowDestructiveDialog] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Treatment Proposals Components Demo
      </Text>

      {/* Proposal Status Badges */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Proposal Status Badges
        </Text>
        <View style={styles.row}>
          <ProposalStatusBadge status={ProposalStatus.PROPOSED} />
          <ProposalStatusBadge status={ProposalStatus.ACCEPTED} />
        </View>
        <View style={styles.row}>
          <ProposalStatusBadge status={ProposalStatus.DECLINED} />
          <ProposalStatusBadge status={ProposalStatus.EXPIRED} />
        </View>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Small size:</Text>
        <View style={styles.row}>
          <ProposalStatusBadge status={ProposalStatus.PROPOSED} size="small" />
          <ProposalStatusBadge status={ProposalStatus.ACCEPTED} size="small" />
        </View>
      </View>

      {/* Treatment Sheet Status Badges */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Treatment Sheet Status Badges
        </Text>
        <View style={styles.row}>
          <TreatmentSheetStatusBadge status={TreatmentSheetStatus.DRAFT} />
          <TreatmentSheetStatusBadge status={TreatmentSheetStatus.SCHEDULED} />
        </View>
        <View style={styles.row}>
          <TreatmentSheetStatusBadge status={TreatmentSheetStatus.IN_PROGRESS} />
          <TreatmentSheetStatusBadge status={TreatmentSheetStatus.COMPLETED} />
        </View>
        <View style={styles.row}>
          <TreatmentSheetStatusBadge status={TreatmentSheetStatus.PAUSED} />
          <TreatmentSheetStatusBadge status={TreatmentSheetStatus.CANCELLED} />
        </View>
      </View>

      {/* Row Status Badges */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Row Status Badges
        </Text>
        <View style={styles.row}>
          <RowStatusBadge status={RowStatus.PENDING} />
          <RowStatusBadge status={RowStatus.IN_PROGRESS} />
        </View>
        <View style={styles.row}>
          <RowStatusBadge status={RowStatus.COMPLETED} />
          <RowStatusBadge status={RowStatus.CANCELLED} />
        </View>
      </View>

      {/* Cost Display */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Cost Display
        </Text>
        <CostDisplay amount={18000} currency="INR" label="Package Cost" />
        <View style={styles.spacer} />
        <CostDisplay min={15000} max={20000} currency="INR" label="Estimated" />
        <View style={styles.spacer} />
        <CostDisplay amount={18000} currency="INR" label="Total" inline />
        <View style={styles.spacer} />
        <CostDisplay label="Not Set" />
      </View>

      {/* Progress Bar */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Progress Bar
        </Text>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Simple percentage:
        </Text>
        <ProgressBar progress={38} />
        <View style={styles.spacer} />
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          With count:
        </Text>
        <ProgressBar progress={38} completed={8} total={21} showCount countLabel="days" />
        <View style={styles.spacer} />
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Different progress levels:
        </Text>
        <ProgressBar progress={25} completed={5} total={21} showCount countLabel="days" />
        <View style={styles.spacer} />
        <ProgressBar progress={75} completed={16} total={21} showCount countLabel="days" />
        <View style={styles.spacer} />
        <ProgressBar progress={100} completed={21} total={21} showCount countLabel="days" />
      </View>

      {/* Confirmation Dialog */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Confirmation Dialog
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary.default }]}
          onPress={() => setShowDialog(true)}
        >
          <Text style={styles.buttonText}>Show Normal Dialog</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.feedback.error }]}
          onPress={() => setShowDestructiveDialog(true)}
        >
          <Text style={styles.buttonText}>Show Destructive Dialog</Text>
        </TouchableOpacity>
      </View>

      {/* Dialogs */}
      <ConfirmationDialog
        visible={showDialog}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action?"
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        onConfirm={() => {
          setShowDialog(false);
          console.log('Confirmed');
        }}
        onCancel={() => setShowDialog(false)}
      />

      <ConfirmationDialog
        visible={showDestructiveDialog}
        title="Cancel Treatment Series"
        message="Are you sure you want to cancel this treatment series? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
        destructive
        requireReason
        reasonPlaceholder="Enter cancellation reason"
        onConfirm={(reason) => {
          setShowDestructiveDialog(false);
          console.log('Cancelled with reason:', reason);
        }}
        onCancel={() => setShowDestructiveDialog(false)}
      />
    </ScrollView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spacer: {
    height: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
