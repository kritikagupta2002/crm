import React from 'react';
import { View, Text } from 'react-native';
import { FileSpreadsheet, Clock } from 'lucide-react-native';
import { Card, StatusBadge, Button, EmptyState } from '../../../components';
import { colors, spacing } from '../../../theme';
import { WorkOrder } from '../../../types';
import { styles } from './vendorPortalStyles';

interface VendorWorkOrdersTabProps {
  myWorkOrders: WorkOrder[];
  handleStartWork: (wo: WorkOrder) => void;
  handleOpenDelivery: (wo: WorkOrder) => void;
  handleOpenBilling: (wo: WorkOrder) => void;
  navigation: any;
}

export const VendorWorkOrdersTab: React.FC<VendorWorkOrdersTabProps> = ({
  myWorkOrders,
  handleStartWork,
  handleOpenDelivery,
  handleOpenBilling,
  navigation,
}) => {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Subcontract Lifecycle</Text>
        <Text style={styles.sectionSub}>
          Manage execution from mobilization through milestone invoicing
        </Text>
      </View>

      {myWorkOrders.length === 0 ? (
        <EmptyState
          title="No Awarded Subcontracts"
          message="No active work orders have been assigned to your contractor code."
          icon={<FileSpreadsheet size={40} color={colors.text.tertiary} />}
        />
      ) : (
        myWorkOrders.map((wo) => {
          const totalPaid = wo.paidAmount || 0;
          const percentPaid = Math.min(
            100,
            Math.round((totalPaid / wo.contractValue) * 100)
          );

          return (
            <Card
              key={wo.id}
              style={styles.orderCard}
              onPress={() =>
                navigation.navigate('WorkOrderDetail', { woId: wo.id })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.woCode}>{wo.woNumber}</Text>
                <StatusBadge status={wo.currentStage} size="small" />
              </View>

              <Text style={styles.woTitle}>{wo.projectTitle}</Text>
              <Text style={styles.woScope}>
                {wo.scope || (wo as any).scopeOfWork || 'Fieldwork and testing'}
              </Text>

              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${percentPaid}%` }]}
                  />
                </View>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressSub}>
                    Disbursed: ₹{(totalPaid / 100000).toFixed(2)}L of ₹
                    {(wo.contractValue / 100000).toFixed(2)}L
                  </Text>
                  <Text style={styles.progressPct}>{percentPaid}%</Text>
                </View>
              </View>

              <View style={styles.stageNoteBox}>
                <Clock size={14} color={colors.primary} />
                <Text style={styles.stageNoteText}>
                  {wo.currentStage === 'Issued' &&
                    'Work order issued. Please confirm field mobilization to start.'}
                  {wo.currentStage === 'Started' &&
                    'Work is in progress. Submit survey reports/core logs upon field completion.'}
                  {wo.currentStage === 'Delivered' &&
                    'Fieldwork delivered. Submit milestone tax invoice for verification.'}
                  {wo.currentStage === 'Billed' &&
                    'Invoice under 3-way reconciliation (PO vs Field Report vs Bill).'}
                  {wo.currentStage === 'Verified' &&
                    'Approved by Accounts team. Awaiting bank transfer (RTGS/NEFT).'}
                  {wo.currentStage === 'Paid' &&
                    'Payment disbursed in full. Electronic receipt posted.'}
                </Text>
              </View>

              <View style={styles.orderActionsRow}>
                {wo.currentStage === 'Issued' && (
                  <Button
                    title="Confirm Mobilization"
                    variant="primary"
                    size="small"
                    onPress={() => handleStartWork(wo)}
                    style={{ flex: 1 }}
                  />
                )}
                {wo.currentStage === 'Started' && (
                  <Button
                    title="Submit Field Delivery"
                    variant="primary"
                    size="small"
                    onPress={() => handleOpenDelivery(wo)}
                    style={{ flex: 1 }}
                  />
                )}
                {wo.currentStage === 'Delivered' && (
                  <Button
                    title="Submit Invoice"
                    variant="primary"
                    size="small"
                    onPress={() => handleOpenBilling(wo)}
                    style={{ flex: 1 }}
                  />
                )}
                <Button
                  title="View Full Ledger"
                  variant="outline"
                  size="small"
                  onPress={() =>
                    navigation.navigate('WorkOrderDetail', { woId: wo.id })
                  }
                />
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
};
