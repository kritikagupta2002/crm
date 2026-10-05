import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { AppHeader } from '../../components';
import { useShiftRoster } from './useShiftRoster';
import {
  styles,
  ShiftSelfServiceView,
  ShiftKpiBar,
  ShiftTabBar,
  ShiftMasterList,
  ShiftAssignmentList,
  ShiftModals,
} from './components/shifts';

export const ShiftsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    isHRAdmin,
    myShift,
    weeklyRoster,
    shifts,
    shiftAssignments,
    employees,
    activeTab,
    setActiveTab,
    refreshing,
    onRefresh,
    search,
    setSearch,
    selectedDeptFilter,
    setSelectedDeptFilter,
    departmentsList,
    filteredShifts,
    filteredAssignments,
    showShiftModal,
    setShowShiftModal,
    editingShift,
    shiftName,
    setShiftName,
    shiftCode,
    setShiftCode,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    breakDuration,
    setBreakDuration,
    gracePeriod,
    setGracePeriod,
    weeklyOff,
    setWeeklyOff,
    location,
    setLocation,
    shiftStatus,
    setShiftStatus,
    description,
    setDescription,
    shiftErrors,
    handleSaveShift,
    handleOpenCreateShift,
    handleOpenEditShift,
    handleDeleteShift,
    showAssignModal,
    setShowAssignModal,
    assignEmpId,
    setAssignEmpId,
    assignShiftId,
    setAssignShiftId,
    effectiveFrom,
    setEffectiveFrom,
    assignWeeklyOff,
    setAssignWeeklyOff,
    handleOpenAssignModal,
    handleSaveAssignment,
  } = useShiftRoster();

  if (!isHRAdmin) {
    return (
      <ShiftSelfServiceView
        navigation={navigation}
        myShift={myShift}
        weeklyRoster={weeklyRoster}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Shift Management"
        subtitle="Shift rosters for Jaipur HQ, Bhilwara mine, & drone field campaigns"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={
              activeTab === 'shifts'
                ? handleOpenCreateShift
                : handleOpenAssignModal
            }
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.headerActionText}>
              {activeTab === 'shifts' ? 'New Shift' : 'Assign'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ShiftKpiBar
        shiftsCount={shifts.length}
        activeShiftsCount={shifts.filter((s) => s.status === 'Active').length}
        assignedStaffCount={shiftAssignments.length}
        onMonthlyRosterPress={() => navigation.navigate('MonthlyRoster')}
      />

      <ShiftTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shiftsCount={shifts.length}
        assignmentsCount={shiftAssignments.length}
        search={search}
        setSearch={setSearch}
        selectedDeptFilter={selectedDeptFilter}
        setSelectedDeptFilter={setSelectedDeptFilter}
        departmentsList={departmentsList}
      />

      {activeTab === 'shifts' ? (
        <ShiftMasterList
          filteredShifts={filteredShifts}
          refreshing={refreshing}
          onRefresh={onRefresh}
          handleOpenCreateShift={handleOpenCreateShift}
          handleOpenEditShift={handleOpenEditShift}
          handleDeleteShift={handleDeleteShift}
        />
      ) : (
        <ShiftAssignmentList
          filteredAssignments={filteredAssignments}
          refreshing={refreshing}
          onRefresh={onRefresh}
          handleOpenAssignModal={handleOpenAssignModal}
        />
      )}

      <ShiftModals
        showShiftModal={showShiftModal}
        setShowShiftModal={setShowShiftModal}
        editingShift={editingShift}
        shiftName={shiftName}
        setShiftName={setShiftName}
        shiftCode={shiftCode}
        setShiftCode={setShiftCode}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        breakDuration={breakDuration}
        setBreakDuration={setBreakDuration}
        gracePeriod={gracePeriod}
        setGracePeriod={setGracePeriod}
        weeklyOff={weeklyOff}
        setWeeklyOff={setWeeklyOff}
        location={location}
        setLocation={setLocation}
        shiftStatus={shiftStatus}
        setShiftStatus={setShiftStatus}
        description={description}
        setDescription={setDescription}
        shiftErrors={shiftErrors}
        handleSaveShift={handleSaveShift}
        showAssignModal={showAssignModal}
        setShowAssignModal={setShowAssignModal}
        assignEmpId={assignEmpId}
        setAssignEmpId={setAssignEmpId}
        assignShiftId={assignShiftId}
        setAssignShiftId={setAssignShiftId}
        effectiveFrom={effectiveFrom}
        setEffectiveFrom={setEffectiveFrom}
        assignWeeklyOff={assignWeeklyOff}
        setAssignWeeklyOff={setAssignWeeklyOff}
        employees={employees}
        shifts={shifts}
        handleSaveAssignment={handleSaveAssignment}
      />
    </View>
  );
};
