import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { EmptyState } from '../../components';
import { CalendarCheck } from 'lucide-react-native';
import { colors } from '../../theme';
import { useLeave } from './useLeave';
import {
  styles,
  LeaveHeader,
  LeaveBalanceSummary,
  LeaveFilterBar,
  LeaveRequestCard,
  LeaveApplyModal,
  LeaveDetailModal,
} from './components/leave';

export const LeaveScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    isHrOrAdmin,
    activeEmpId,
    activeEmpName,
    activeEmpDept,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedRequest,
    isDetailModalOpen,
    isCancelling,
    showApplyModal,
    setShowApplyModal,
    selectedType,
    setSelectedType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reason,
    setReason,
    contactPhone,
    setContactPhone,
    isSubmitting,
    displayedRequests,
    pendingApprovalsCount,
    leaveBalances,
    myEmployeeRequests,
    calculatedDays,
    skippedDates,
    projectedRemaining,
    availableToApply,
    isInvertedDate,
    isOverQuota,
    isClLimitExceeded,
    isMaxDurationExceeded,
    overlappingRequest,
    isBlockedByValidation,
    handleAutoAdjustDates,
    handleApply,
    handleCancelRequest,
    handleOpenDetail,
    handleCloseDetail,
    leaves,
  } = useLeave();

  return (
    <View style={styles.container}>
      <LeaveHeader
        isHrOrAdmin={isHrOrAdmin}
        pendingApprovalsCount={pendingApprovalsCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalLeavesCount={leaves.length}
        onBack={() => navigation.goBack()}
        onNavigateApprovals={() => navigation.navigate('LeaveApprovals')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LeaveBalanceSummary
          activeTab={activeTab}
          leaveBalances={leaveBalances}
        />

        <LeaveFilterBar
          onOpenApply={() => setShowApplyModal(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'company' ? 'STAFF LEAVE APPLICATIONS' : 'MY RECENT APPLICATIONS'}
          </Text>
          <Text style={styles.recordsCount}>{displayedRequests.length} records</Text>
        </View>

        {displayedRequests.length === 0 ? (
          <EmptyState
            title="No Leave Applications"
            message={
              searchQuery || statusFilter !== 'All'
                ? 'No leave requests match the selected filters.'
                : 'No leave applications submitted yet.'
            }
            icon={<CalendarCheck size={44} color={colors.text.tertiary} />}
          />
        ) : (
          displayedRequests.map((item) => (
            <View key={item.id}>
              <LeaveRequestCard
                item={item}
                activeEmpId={activeEmpId}
                activeTab={activeTab}
                onPress={() => handleOpenDetail(item)}
              />
            </View>
          ))
        )}
      </ScrollView>

      <LeaveApplyModal
        visible={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        activeEmpName={activeEmpName}
        activeEmpId={activeEmpId}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        leaveBalances={leaveBalances}
        myEmployeeRequests={myEmployeeRequests}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        calculatedDays={calculatedDays}
        projectedRemaining={projectedRemaining}
        skippedDates={skippedDates}
        isInvertedDate={isInvertedDate}
        isClLimitExceeded={isClLimitExceeded}
        isMaxDurationExceeded={isMaxDurationExceeded}
        isOverQuota={isOverQuota}
        availableToApply={availableToApply}
        overlappingRequest={overlappingRequest}
        onAutoAdjustDates={handleAutoAdjustDates}
        reason={reason}
        setReason={setReason}
        contactPhone={contactPhone}
        setContactPhone={setContactPhone}
        isSubmitting={isSubmitting}
        isBlockedByValidation={isBlockedByValidation}
        onSubmit={handleApply}
      />

      <LeaveDetailModal
        visible={isDetailModalOpen}
        request={selectedRequest}
        onClose={handleCloseDetail}
        activeEmpDept={activeEmpDept}
        activeEmpId={activeEmpId}
        isHrOrAdmin={isHrOrAdmin}
        isCancelling={isCancelling}
        onCancelRequest={handleCancelRequest}
        onNavigateApprovals={() => {
          handleCloseDetail();
          navigation.navigate('LeaveApprovals');
        }}
      />
    </View>
  );
};
