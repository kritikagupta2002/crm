import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X, User, Calendar, Clock, Phone, RotateCcw } from 'lucide-react-native';
import { Input, Button } from '../../../../components';
import { colors } from '../../../../theme';
import { LeaveBalance, LeaveRequest } from '../../../../types';
import { SkippedDateItem } from '../../../../utils/workingDays';
import { styles } from './leaveStyles';

interface LeaveApplyModalProps {
  visible: boolean;
  onClose: () => void;
  activeEmpName: string;
  activeEmpId: string;
  selectedType: string;
  setSelectedType: (type: string) => void;
  leaveBalances: LeaveBalance[];
  myEmployeeRequests: LeaveRequest[];
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  calculatedDays: number;
  projectedRemaining: number;
  skippedDates: SkippedDateItem[];
  isInvertedDate: boolean;
  isClLimitExceeded: boolean;
  isMaxDurationExceeded: boolean;
  isOverQuota: boolean;
  availableToApply: number;
  overlappingRequest: LeaveRequest | null;
  onAutoAdjustDates: () => void;
  reason: string;
  setReason: (reason: string) => void;
  contactPhone: string;
  setContactPhone: (phone: string) => void;
  isSubmitting: boolean;
  isBlockedByValidation: boolean;
  onSubmit: () => void;
}

export const LeaveApplyModal: React.FC<LeaveApplyModalProps> = ({
  visible,
  onClose,
  activeEmpName,
  activeEmpId,
  selectedType,
  setSelectedType,
  leaveBalances,
  myEmployeeRequests,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  calculatedDays,
  projectedRemaining,
  skippedDates,
  isInvertedDate,
  isClLimitExceeded,
  isMaxDurationExceeded,
  isOverQuota,
  availableToApply,
  overlappingRequest,
  onAutoAdjustDates,
  reason,
  setReason,
  contactPhone,
  setContactPhone,
  isSubmitting,
  isBlockedByValidation,
  onSubmit,
}) => {
  return (
    <Modal statusBarTranslucent visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.applyModalBox}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Apply for Leave</Text>
              <Text style={styles.modalSubtitle}>Statutory working-day engine & quota validation</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.applyFormScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.applicantInfoBanner}>
              <User size={15} color={colors.primary} />
              <Text style={styles.applicantInfoText}>
                Applicant: <Text style={{ fontWeight: '700' }}>{activeEmpName}</Text> ({activeEmpId})
              </Text>
            </View>

            <Text style={styles.inputLabel}>Leave Type & Statutory Category</Text>
            <View style={styles.typeSelectorWrap}>
              {[
                'Casual Leave (CL)',
                'Sick Leave (SL)',
                'Earned / Privilege Leave (EL)',
                'Compensatory Off (CO)',
                'Field Duty Leave (FDL)',
                'Maternity / Paternity Leave',
              ].map((lt) => {
                const b = leaveBalances.find((bal) => bal.leaveType === lt);
                const ltPending = myEmployeeRequests
                  .filter((r) => r.status === 'Pending' && r.leaveType === lt)
                  .reduce((sum, r) => sum + (Number(r.requestedDays || r.days) || 0), 0);
                const total = b ? b.totalAllocated : lt.includes('Maternity') ? 180 : 12;
                const used = b ? b.used : 0;
                const avail = Math.max(0, total - used - ltPending);
                const isSelected = selectedType === lt;

                return (
                  <TouchableOpacity
                    key={lt}
                    style={[styles.typeSelectCard, isSelected && styles.typeSelectCardActive]}
                    onPress={() => setSelectedType(lt)}
                  >
                    <View style={styles.typeCardHeader}>
                      <Text style={[styles.typeSelectTitle, isSelected && styles.typeSelectTitleActive]}>
                        {lt.split('(')[0].trim()}
                      </Text>
                      <Text style={[styles.typeAvailBadge, isSelected && styles.typeAvailBadgeActive]}>
                        {avail}d avail
                      </Text>
                    </View>
                    <Text style={styles.typeCodeSub}>
                      {lt.includes('CL')
                        ? 'Max 3 consecutive days'
                        : lt.includes('EL')
                        ? 'Min 7 days advance notice'
                        : lt.includes('SL')
                        ? 'Physician rest & recovery'
                        : lt.includes('FDL')
                        ? 'R&R post field tour'
                        : lt.includes('CO')
                        ? 'Weekend/Holiday credit'
                        : 'Statutory 26 weeks'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dateInputsRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Start Date (YYYY-MM-DD)"
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-10-12"
                  leftIcon={<Calendar size={16} color={colors.text.secondary} />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="End Date (YYYY-MM-DD)"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="2026-10-14"
                  leftIcon={<Calendar size={16} color={colors.text.secondary} />}
                />
              </View>
            </View>

            <View
              style={[
                styles.engineBanner,
                isBlockedByValidation ? styles.engineBannerError : styles.engineBannerSuccess,
              ]}
            >
              <View style={styles.engineHeader}>
                <View style={styles.engineTitleRow}>
                  <Clock size={16} color={isBlockedByValidation ? colors.semantic.danger : colors.semantic.success} />
                  <Text
                    style={[
                      styles.engineTitle,
                      { color: isBlockedByValidation ? colors.semantic.danger : colors.semantic.success },
                    ]}
                  >
                    {isInvertedDate
                      ? 'Invalid Date Chronology'
                      : `${calculatedDays} Working Day${calculatedDays === 1 ? '' : 's'} Computed`}
                  </Text>
                </View>
                <Text style={styles.projectedBalText}>
                  Projected Quota: {projectedRemaining}d
                </Text>
              </View>

              {skippedDates.length > 0 && (
                <View style={styles.skippedWrap}>
                  <Text style={styles.skippedTitle}>
                    Excluded (Does NOT consume leave quota):
                  </Text>
                  <View style={styles.skippedChipsRow}>
                    {skippedDates.map((item, idx) => (
                      <View key={idx} style={styles.skippedChip}>
                        <Text style={styles.skippedChipText}>
                          {item.date} ({item.reason})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {isInvertedDate && (
                <Text style={styles.errorAlertText}>
                  End date cannot be earlier than start date.
                </Text>
              )}

              {calculatedDays === 0 && !isInvertedDate && (
                <Text style={styles.warningAlertText}>
                  Selected date range contains 0 working days. Weekends and national holidays do not consume leave balance.
                </Text>
              )}

              {isClLimitExceeded && (
                <Text style={styles.errorAlertText}>
                  Casual Leave (CL) cannot exceed 3 consecutive working days per BGSPL policy. Please apply for Earned Leave (EL) for extended durations.
                </Text>
              )}

              {isMaxDurationExceeded && (
                <Text style={styles.errorAlertText}>
                  Single leave application cannot exceed 30 working days. Please submit in separate phases.
                </Text>
              )}

              {isOverQuota && (
                <Text style={styles.errorAlertText}>
                  Insufficient balance: You have {availableToApply} day(s) available to apply, but requested {calculatedDays} day(s).
                </Text>
              )}

              {overlappingRequest && (
                <View style={styles.overlapBox}>
                  <Text style={styles.errorAlertText}>
                    Overlapping Request: You already have a {overlappingRequest.status} {overlappingRequest.leaveType} application ({overlappingRequest.startDate} to {overlappingRequest.endDate}).
                  </Text>
                  <TouchableOpacity style={styles.autoAdjustBtn} onPress={onAutoAdjustDates}>
                    <RotateCcw size={12} color="#FFFFFF" />
                    <Text style={styles.autoAdjustBtnText}>Auto-Adjust Dates</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Input
              label="Reason / Purpose of Leave (Min 10 characters)"
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Attending family function and personal work in hometown"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.charCountText}>
              {reason.trim().length} / 500 characters
            </Text>

            <Input
              label="Emergency Contact Phone During Absence"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+91 98290 10044"
              leftIcon={<Phone size={16} color={colors.text.secondary} />}
            />

            <View style={styles.formActionButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Application"
                variant="primary"
                loading={isSubmitting}
                disabled={isBlockedByValidation}
                onPress={onSubmit}
                style={{ flex: 1.5 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
