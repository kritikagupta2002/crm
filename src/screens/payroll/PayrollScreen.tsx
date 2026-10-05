import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer, AppHeader, SegmentedControl } from '../../components/common';
import { BadgeIndianRupee, FileText } from 'lucide-react-native';
import { usePayroll } from './usePayroll';
import {
  styles,
  PayrollOverviewTab,
  PayrollStructuresTab,
  PayrollProcessTab,
  PayrollHistoryTab,
  EditSalaryStructureModal,
} from './components';

export const PayrollScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    isHrOrAdmin,
    activeTab,
    setActiveTab,
    selectedCycle,
    setSelectedCycle,
    isProcessing,
    processSuccess,
    setProcessSuccess,
    lastProcessedRun,
    structureSearch,
    setStructureSearch,
    selectedDeptFilter,
    setSelectedDeptFilter,
    editingStructure,
    setEditingStructure,
    editBasic,
    setEditBasic,
    editHra,
    setEditHra,
    editConveyance,
    setEditConveyance,
    editSpecial,
    setEditSpecial,
    editSite,
    setEditSite,
    editPt,
    setEditPt,
    editTds,
    setEditTds,
    editError,
    isSavingStructure,
    activeStaff,
    totalMonthlyGross,
    totalNetTakeHome,
    totalMonthlyDeductions,
    cycleWorkingDays,
    processRosterPreview,
    previewBatchGross,
    previewBatchDeductions,
    previewBatchNet,
    filteredStructures,
    departmentsList,
    handleOpenEditStructure,
    computedEditGross,
    computedEditEpf,
    computedEditEsi,
    computedEditDeductions,
    computedEditNet,
    handleSaveStructure,
    handleExecutePayroll,
    payrollRuns,
  } = usePayroll();

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Payroll & Compensation"
          subtitle="Statutory computation, PF, ESI, PT, and salary disbursals"
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
          rightAction={
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Payslips')}
            >
              <FileText size={16} color="#0D9488" />
              <Text style={styles.headerBtnText}>Payslips</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      
      <View style={styles.tabsWrap}>
        <SegmentedControl
          options={['Overview', 'Structures', 'Process', 'History']}
          selectedIndex={
            activeTab === 'overview'
              ? 0
              : activeTab === 'structures'
              ? 1
              : activeTab === 'process'
              ? 2
              : 3
          }
          onSelect={(idx) => {
            const tabs: ('overview' | 'structures' | 'process' | 'history')[] = [
              'overview',
              'structures',
              'process',
              'history',
            ];
            setActiveTab(tabs[idx]);
          }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'overview' && (
          <PayrollOverviewTab
            totalMonthlyGross={totalMonthlyGross}
            totalNetTakeHome={totalNetTakeHome}
            totalMonthlyDeductions={totalMonthlyDeductions}
            activeStaffCount={activeStaff.length}
            isHrOrAdmin={isHrOrAdmin}
            payrollRuns={payrollRuns}
            onOpenProcessTab={() => setActiveTab('process')}
            onOpenStructuresTab={() => setActiveTab('structures')}
            onOpenHistoryTab={() => setActiveTab('history')}
            onNavigatePayslips={() => navigation.navigate('Payslips')}
          />
        )}

        {activeTab === 'structures' && (
          <PayrollStructuresTab
            structureSearch={structureSearch}
            setStructureSearch={setStructureSearch}
            selectedDeptFilter={selectedDeptFilter}
            setSelectedDeptFilter={setSelectedDeptFilter}
            departmentsList={departmentsList}
            filteredStructures={filteredStructures}
            isHrOrAdmin={isHrOrAdmin}
            onEditStructure={handleOpenEditStructure}
          />
        )}

        {activeTab === 'process' && (
          <PayrollProcessTab
            processSuccess={processSuccess}
            setProcessSuccess={setProcessSuccess}
            lastProcessedRun={lastProcessedRun}
            activeStaffCount={activeStaff.length}
            selectedCycle={selectedCycle}
            setSelectedCycle={setSelectedCycle}
            cycleWorkingDays={cycleWorkingDays}
            previewBatchGross={previewBatchGross}
            previewBatchDeductions={previewBatchDeductions}
            previewBatchNet={previewBatchNet}
            processRosterPreview={processRosterPreview}
            isHrOrAdmin={isHrOrAdmin}
            isProcessing={isProcessing}
            onExecutePayroll={handleExecutePayroll}
            onNavigatePayslips={() => navigation.navigate('Payslips')}
          />
        )}

        {activeTab === 'history' && (
          <PayrollHistoryTab
            payrollRuns={payrollRuns}
            onNavigatePayslips={() => navigation.navigate('Payslips')}
          />
        )}
      </ScrollView>

      <EditSalaryStructureModal
        editingStructure={editingStructure}
        onClose={() => setEditingStructure(null)}
        editBasic={editBasic}
        setEditBasic={setEditBasic}
        editHra={editHra}
        setEditHra={setEditHra}
        editConveyance={editConveyance}
        setEditConveyance={setEditConveyance}
        editSpecial={editSpecial}
        setEditSpecial={setEditSpecial}
        editSite={editSite}
        setEditSite={setEditSite}
        editPt={editPt}
        setEditPt={setEditPt}
        editTds={editTds}
        setEditTds={setEditTds}
        editError={editError}
        isSavingStructure={isSavingStructure}
        computedEditGross={computedEditGross}
        computedEditEpf={computedEditEpf}
        computedEditEsi={computedEditEsi}
        computedEditDeductions={computedEditDeductions}
        computedEditNet={computedEditNet}
        onSaveStructure={handleSaveStructure}
      />
    </ScreenContainer>
  );
};
