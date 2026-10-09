import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AlertCircle, ShieldAlert } from 'lucide-react-native';
import { AppHeader, Button } from '../../components';
import { colors, spacing } from '../../theme';
import { useEmployeeDetail } from './useEmployeeDetail';
import {
  styles,
  EmployeeProfileHeader,
  EmployeeTabBar,
  EmployeeOverviewTab,
  EmployeePersonalTab,
  EmployeeJobTab,
  EmployeeAttendanceTab,
  EmployeeLeaveTab,
  EmployeeSalaryTab,
  EmployeeExpensesTab,
  EmployeePerformanceTab,
  EmployeeExitTab,
  EmployeeDocumentsTab,
} from './components/employee';

export const EmployeeDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const employeeId = route?.params?.employeeId || 'EMP-2024-001';
  const {
    emp,
    activeEmployeeId,
    isHrOrAdmin,
    canAccessThisProfile,
    canViewSalary,
    activeTab,
    setActiveTab,
    tabs,
    initials,
    tenureYears,
    totalAvailableLeaves,
    empLeaveBalances,
    empLeaves,
    empAttendance,
    salaryStructure,
    empPayslips,
    empExpenses,
    empReimbursements,
    empAppraisals,
    empExit,
    empDocuments,
    handleCall,
    handleEmail,
  } = useEmployeeDetail(employeeId);

  if (!emp) {
    return (
      <View style={styles.container}>
        <AppHeader title="Employee Profile" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={colors.text.tertiary} />
          <Text style={styles.errorTitle}>Employee Not Found</Text>
          <Text style={styles.errorMessage}>
            No staff record matches identifier "{employeeId}".
          </Text>
          <Button
            title="Return to Directory"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </View>
    );
  }

  if (!canAccessThisProfile) {
    return (
      <View style={styles.container}>
        <AppHeader title="Staff Profile" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <ShieldAlert size={56} color={colors.warning} />
          <Text style={styles.errorTitle}>Privacy Protected Record</Text>
          <Text style={styles.errorMessage}>
            You do not have administrative authorization to inspect other employees' private records,
            salaries, or statutory KYC documents.
          </Text>
          <Button
            title="Open My Own Profile"
            variant="primary"
            onPress={() =>
              navigation.replace('EmployeeDetail', { employeeId: activeEmployeeId })
            }
            style={{ marginTop: spacing.xl, width: '100%' }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EmployeeProfileHeader
        emp={emp}
        initials={initials}
        isHrOrAdmin={isHrOrAdmin}
        onBack={() => navigation.goBack()}
        onEdit={() => navigation.navigate('EditEmployee', { employeeId: emp.id })}
        onCall={handleCall}
        onEmail={handleEmail}
      />

      <EmployeeTabBar
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'overview' && (
          <EmployeeOverviewTab
            emp={emp}
            tenureYears={tenureYears}
            totalAvailableLeaves={totalAvailableLeaves}
            empAttendanceLength={empAttendance.length}
            onCall={handleCall}
          />
        )}

        {activeTab === 'personal' && <EmployeePersonalTab emp={emp} />}

        {activeTab === 'job' && <EmployeeJobTab emp={emp} />}

        {activeTab === 'attendance' && (
          <EmployeeAttendanceTab empAttendance={empAttendance} />
        )}

        {activeTab === 'leave' && (
          <EmployeeLeaveTab
            empLeaveBalances={empLeaveBalances}
            empLeaves={empLeaves}
          />
        )}

        {activeTab === 'salary' && canViewSalary && (
          <EmployeeSalaryTab
            emp={emp}
            salaryStructure={salaryStructure}
            empPayslips={empPayslips}
          />
        )}

        {activeTab === 'expenses' && (
          <EmployeeExpensesTab
            empExpenses={empExpenses}
            empReimbursements={empReimbursements}
          />
        )}

        {activeTab === 'performance' && (
          <EmployeePerformanceTab empAppraisals={empAppraisals} />
        )}

        {activeTab === 'exit' && empExit && (
          <EmployeeExitTab empExit={empExit} />
        )}

        {activeTab === 'documents' && (
          <EmployeeDocumentsTab
            emp={emp}
            empDocuments={empDocuments}
            onNavigateDocuments={(empId) =>
              navigation.navigate('EmployeeDocuments', { employeeId: empId })
            }
          />
        )}
      </ScrollView>
    </View>
  );
};
