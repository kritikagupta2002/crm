import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import {
  X,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react-native';
import { StatusBadge, Button } from '../../../../components';
import { colors } from '../../../../theme';
import { LeaveRequest } from '../../../../types';
import { formatDate } from '../../../../utils/workingDays';
import { styles } from './leaveStyles';

interface LeaveDetailModalProps {
  visible: boolean;
  request: LeaveRequest | null;
  onClose: () => void;
  activeEmpDept: string;
  activeEmpId: string;
  isHrOrAdmin: boolean;
  isCancelling: boolean;
  onCancelRequest: (reqId: string) => void;
  onNavigateApprovals: () => void;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  visible,
  request,
  onClose,
  activeEmpDept,
  activeEmpId,
  isHrOrAdmin,
  isCancelling,
  onCancelRequest,
  onNavigateApprovals,
}) => {
  if (!request) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.detailModalBox}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Leave Application Details</Text>
              <Text style={styles.modalSubtitle}>Reference: {request.id}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.detailHero}>
              <View>
                <Text style={styles.detailHeroType}>{request.leaveType}</Text>
                <Text style={styles.detailHeroDept}>
                  {request.employeeName} • {request.department || activeEmpDept}
                </Text>
              </View>
              <StatusBadge status={request.status as any} size="medium" />
            </View>

            <View style={styles.detailMetaGrid}>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Start Date</Text>
                <Text style={styles.detailMetaVal}>{formatDate(request.startDate)}</Text>
              </View>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>End Date</Text>
                <Text style={styles.detailMetaVal}>{formatDate(request.endDate)}</Text>
              </View>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Requested Duration</Text>
                <Text style={styles.detailMetaVal}>
                  {request.requestedDays || request.days} Working Days
                </Text>
              </View>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Submitted Date</Text>
                <Text style={styles.detailMetaVal}>
                  {formatDate(request.appliedOn || request.appliedAt)}
                </Text>
              </View>
            </View>

            {request.status === 'Partially Approved' && (
              <View style={styles.partialCard}>
                <View style={styles.partialCardCol}>
                  <Text style={styles.partialCardLabel}>Days Approved</Text>
                  <Text style={styles.partialCardValGreen}>{request.approvedDays} Days</Text>
                </View>
                <View style={styles.partialCardDivider} />
                <View style={styles.partialCardCol}>
                  <Text style={styles.partialCardLabel}>Days Declined</Text>
                  <Text style={styles.partialCardValRed}>{request.rejectedDays} Days</Text>
                </View>
              </View>
            )}

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionBlockTitle}>Applicant Justification</Text>
              <View style={styles.reasonCard}>
                <Text style={styles.reasonCardText}>"{request.reason}"</Text>
              </View>
            </View>

            {request.contactDuringLeave && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>Emergency Contact Phone</Text>
                <View style={styles.contactRow}>
                  <Phone size={14} color={colors.primary} />
                  <Text style={styles.contactText}>{request.contactDuringLeave}</Text>
                </View>
              </View>
            )}

            {request.status === 'Rejected' && request.rejectionReason && (
              <View style={styles.rejectionDetailBox}>
                <View style={styles.rejectionHeader}>
                  <AlertTriangle size={16} color={colors.semantic.danger} />
                  <Text style={styles.rejectionHeaderTitle}>Formal Rejection Reason</Text>
                </View>
                <Text style={styles.rejectionDetailBody}>
                  {request.rejectionReason}
                </Text>
                {request.approverName && (
                  <Text style={styles.adjudicatorSign}>
                    Adjudicated by: {request.approverName}
                  </Text>
                )}
              </View>
            )}

            {request.status === 'Approved' && (
              <View style={styles.approvalDetailBox}>
                <View style={styles.approvalHeader}>
                  <CheckCircle2 size={16} color={colors.semantic.success} />
                  <Text style={styles.approvalHeaderTitle}>Supervisor Approval Confirmed</Text>
                </View>
                <Text style={styles.approvalDetailBody}>
                  {request.approverComment || 'Approved in full. Attendance muster synchronized to On-Leave.'}
                </Text>
                <Text style={styles.adjudicatorSign}>
                  Approved by: {request.approverName || 'HR Administration'}
                </Text>
              </View>
            )}

            {request.status === 'Pending' && request.employeeId === activeEmpId && (
              <View style={styles.cancelActionWrap}>
                <Button
                  title="Withdraw / Cancel Application"
                  variant="danger"
                  loading={isCancelling}
                  onPress={() => onCancelRequest(request.id)}
                />
              </View>
            )}

            {request.status === 'Pending' && isHrOrAdmin && (
              <View style={styles.hrAdjudicateWrap}>
                <Button
                  title="Open in Approvals Queue"
                  variant="primary"
                  leftIcon={<ShieldCheck size={16} color="#FFFFFF" />}
                  onPress={onNavigateApprovals}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
