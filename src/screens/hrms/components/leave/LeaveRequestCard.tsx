import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, ChevronRight, AlertCircle } from 'lucide-react-native';
import { Card, StatusBadge } from '../../../../components';
import { colors } from '../../../../theme';
import { LeaveRequest } from '../../../../types';
import { formatDate } from '../../../../utils/workingDays';
import { styles } from './leaveStyles';

interface LeaveRequestCardProps {
  item: LeaveRequest;
  activeEmpId: string;
  activeTab: 'my' | 'company';
  onPress: () => void;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
  item,
  activeEmpId,
  activeTab,
  onPress,
}) => {
  const isOwned = item.employeeId === activeEmpId;
  const reqDays = item.requestedDays || item.days || 1;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.typePill,
                {
                  backgroundColor: item.leaveType.includes('Casual')
                    ? '#3B82F618'
                    : item.leaveType.includes('Sick')
                    ? '#10B98118'
                    : item.leaveType.includes('Earned')
                    ? '#F59E0B18'
                    : item.leaveType.includes('Compensatory')
                    ? '#8B5CF618'
                    : item.leaveType.includes('Field')
                    ? '#06B6D418'
                    : '#EC489918',
                },
              ]}
            >
              <Text
                style={[
                  styles.typePillText,
                  {
                    color: item.leaveType.includes('Casual')
                      ? '#2563EB'
                      : item.leaveType.includes('Sick')
                      ? '#059669'
                      : item.leaveType.includes('Earned')
                      ? '#D97706'
                      : item.leaveType.includes('Compensatory')
                      ? '#7C3AED'
                      : item.leaveType.includes('Field')
                      ? '#0891B2'
                      : '#DB2777',
                  },
                ]}
              >
                {item.leaveType.split('(')[0].trim()}
              </Text>
            </View>

            {(!isOwned || activeTab === 'company') && (
              <Text style={styles.applicantBadge}>
                {item.employeeName} ({item.employeeId})
              </Text>
            )}
          </View>

          <StatusBadge status={item.status as any} size="small" />
        </View>

        <View style={styles.dateRow}>
          <Calendar size={14} color={colors.text.secondary} />
          <Text style={styles.dateSpan}>
            {formatDate(item.startDate)} → {formatDate(item.endDate)}
          </Text>
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>
              {reqDays} {reqDays === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>

        {item.status === 'Partially Approved' && (
          <View style={styles.partialBanner}>
            <Text style={styles.partialText}>
              Approved: {item.approvedDays}d • Rejected: {item.rejectedDays}d
            </Text>
          </View>
        )}

        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason}
        </Text>

        {item.status === 'Rejected' && item.rejectionReason && (
          <View style={styles.rejectionBox}>
            <AlertCircle size={13} color={colors.semantic.danger} />
            <Text style={styles.rejectionText} numberOfLines={2}>
              Reason: {item.rejectionReason}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.submittedOnText}>
            Applied {formatDate(item.appliedOn || item.appliedAt)}
          </Text>
          <View style={styles.viewDetailLink}>
            <Text style={styles.viewDetailText}>View Details</Text>
            <ChevronRight size={13} color={colors.primary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
