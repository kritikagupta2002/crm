import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../../../../components';
import { colors } from '../../../../theme';
import { LeaveBalance } from '../../../../types';
import { styles } from './leaveStyles';

interface LeaveBalanceSummaryProps {
  activeTab: 'my' | 'company';
  leaveBalances: LeaveBalance[];
}

export const LeaveBalanceSummary: React.FC<LeaveBalanceSummaryProps> = ({
  activeTab,
  leaveBalances,
}) => {
  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'company' ? 'ORGANIZATION POLICY QUOTAS' : 'MY LEAVE BALANCES'}
        </Text>
        <Text style={styles.sectionSubtitle}>FY 2026</Text>
      </View>

      <View style={styles.balanceGrid}>
        {leaveBalances.map((bal) => {
          const avail = bal.available ?? Math.max(0, bal.totalAllocated - bal.used);
          const total = bal.totalAllocated ?? bal.allocated ?? 12;
          const pct = Math.min(100, Math.round((bal.used / total) * 100));

          return (
            <Card key={bal.leaveType} style={styles.balanceCard}>
              <View style={styles.balCardHeader}>
                <Text style={styles.balTitle} numberOfLines={1}>
                  {bal.leaveType.split('(')[0].trim()}
                </Text>
                <View style={[styles.colorDot, { backgroundColor: bal.color || colors.primary }]} />
              </View>

              <View style={styles.balNumbersRow}>
                <Text style={styles.balAvailableNum}>{avail}</Text>
                <Text style={styles.balTotalNum}>/ {total}d</Text>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: bal.color || colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.balCardFooter}>
                <Text style={styles.balFooterText}>{bal.used}d used</Text>
                {bal.pending > 0 && (
                  <Text style={styles.balPendingText}>({bal.pending}d pend)</Text>
                )}
              </View>
            </Card>
          );
        })}
      </View>
    </>
  );
};
