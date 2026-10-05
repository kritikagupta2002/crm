import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../../../../components';
import { colors } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeeJobTabProps {
  emp: any;
}

export const EmployeeJobTab: React.FC<EmployeeJobTabProps> = ({ emp }) => {
  return (
    <View style={styles.tabSection}>
      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Organizational Placement</Text>
        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Corporate Department</Text>
            <Text style={[styles.dataValue, { color: colors.primary, fontWeight: '700' }]}>
              {emp.employment?.department || 'Geology & Mineral Exploration'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Designation Title</Text>
            <Text style={styles.dataValue}>
              {emp.employment?.designation || 'Field Geologist'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Designation Code</Text>
            <Text style={[styles.dataValue, styles.monoValue]}>
              {emp.employment?.designationCode || 'SR-GEO'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>System Access Role</Text>
            <Text style={styles.dataValue}>{(emp.role || 'employee').toUpperCase()}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Reporting Manager</Text>
            <Text style={styles.dataValue}>
              {emp.employment?.reportingManager || emp.employment?.managerName || 'Dr. Amit Kumar Bansal'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Joining Date</Text>
            <Text style={styles.dataValue}>{emp.employment?.joiningDate || '2022-01-10'}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Work Location</Text>
            <Text style={styles.dataValue}>{emp.employment?.workLocation || 'Jaipur HQ'}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Employment Status</Text>
            <Text style={styles.dataValue}>{emp.employment?.status || 'Active'}</Text>
          </View>
        </View>
      </Card>
    </View>
  );
};
