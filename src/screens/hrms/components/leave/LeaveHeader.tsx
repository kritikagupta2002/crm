import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShieldCheck, User, FileText } from 'lucide-react-native';
import { AppHeader } from '../../../../components';
import { colors } from '../../../../theme';
import { styles } from './leaveStyles';

interface LeaveHeaderProps {
  isHrOrAdmin: boolean;
  pendingApprovalsCount: number;
  activeTab: 'my' | 'company';
  setActiveTab: (tab: 'my' | 'company') => void;
  totalLeavesCount: number;
  onBack: () => void;
  onNavigateApprovals: () => void;
}

export const LeaveHeader: React.FC<LeaveHeaderProps> = ({
  isHrOrAdmin,
  pendingApprovalsCount,
  activeTab,
  setActiveTab,
  totalLeavesCount,
  onBack,
  onNavigateApprovals,
}) => {
  return (
    <>
      <AppHeader
        title="Leave Management"
        subtitle="Quotas, working day engine & history"
        showBack
        onBack={onBack}
        rightAction={
          isHrOrAdmin ? (
            <TouchableOpacity
              style={styles.approvalsHeaderBtn}
              onPress={onNavigateApprovals}
            >
              <ShieldCheck size={16} color="#FFFFFF" />
              <Text style={styles.approvalsHeaderText}>Queue</Text>
              {pendingApprovalsCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingApprovalsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isHrOrAdmin && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my')}
          >
            <User size={14} color={activeTab === 'my' ? colors.primary : colors.text.tertiary} />
            <Text style={[styles.tabButtonText, activeTab === 'my' && styles.tabButtonTextActive]}>
              My Balance & Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'company' && styles.tabButtonActive]}
            onPress={() => setActiveTab('company')}
          >
            <FileText size={14} color={activeTab === 'company' ? colors.primary : colors.text.tertiary} />
            <Text style={[styles.tabButtonText, activeTab === 'company' && styles.tabButtonTextActive]}>
              All Staff Requests ({totalLeavesCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};
