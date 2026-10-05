import React from 'react';
import { View, Text } from 'react-native';
import { Card, StatusBadge } from '../../../../components';
import { styles } from './employeeDetailStyles';

interface EmployeeExpensesTabProps {
  empExpenses: any[];
  empReimbursements: any[];
}

export const EmployeeExpensesTab: React.FC<EmployeeExpensesTabProps> = ({
  empExpenses,
  empReimbursements,
}) => {
  return (
    <View style={styles.tabSection}>
      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Expense Claims</Text>
        {empExpenses.length === 0 ? (
          <Text style={styles.emptyNote}>No expense claims filed.</Text>
        ) : (
          empExpenses.map(exp => (
            <View key={exp.id} style={styles.claimRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.claimCategory}>{exp.category} - {exp.project}</Text>
                <Text style={styles.claimDesc}>{exp.description}</Text>
                <Text style={styles.claimDate}>{exp.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.claimAmount}>₹{exp.requestedAmount?.toLocaleString()}</Text>
                <StatusBadge status={exp.status} size="small" />
              </View>
            </View>
          ))
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Travel Reimbursements</Text>
        {empReimbursements.length === 0 ? (
          <Text style={styles.emptyNote}>No travel reimbursement claims filed.</Text>
        ) : (
          empReimbursements.map(reim => (
            <View key={reim.id} style={styles.claimRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.claimCategory}>{reim.tripPurpose}</Text>
                <Text style={styles.claimDesc}>{reim.origin} → {reim.destination}</Text>
                <Text style={styles.claimDate}>{reim.departureDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.claimAmount}>₹{reim.totalClaimAmount?.toLocaleString()}</Text>
                <StatusBadge status={reim.status} size="small" />
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );
};
