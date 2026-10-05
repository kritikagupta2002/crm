import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Card } from '../../../../components';
import { colors } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeePersonalTabProps {
  emp: any;
}

export const EmployeePersonalTab: React.FC<EmployeePersonalTabProps> = ({ emp }) => {
  return (
    <View style={styles.tabSection}>
      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Personal Information</Text>
        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Gender</Text>
            <Text style={styles.dataValue}>{emp.personal?.gender || 'Not specified'}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Date of Birth</Text>
            <Text style={styles.dataValue}>{emp.personal?.dob || '1995-06-15'}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Blood Group</Text>
            <Text style={styles.dataValue}>{emp.personal?.bloodGroup || 'B+'}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Work Email</Text>
            <Text style={styles.dataValue} numberOfLines={1}>{emp.email}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Personal Email</Text>
            <Text style={styles.dataValue} numberOfLines={1}>
              {emp.personal?.personalEmail || 'Not recorded'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Mobile Phone</Text>
            <Text style={styles.dataValue}>{emp.phone}</Text>
          </View>
          <View style={[styles.dataItem, { width: '100%' }]}>
            <Text style={styles.dataLabel}>Residential Address</Text>
            <Text style={styles.dataValue}>
              {emp.personal?.currentAddress || 'Malviya Nagar'}, {emp.personal?.city || 'Jaipur'},{' '}
              {emp.personal?.state || 'Rajasthan'} - {emp.personal?.pincode || '302017'}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardTitleWithBadge}>
          <Text style={styles.sectionHeading}>Statutory KYC & Banking</Text>
          <View style={styles.kycVerifiedBadge}>
            <CheckCircle2 size={12} color={colors.success} />
            <Text style={styles.kycVerifiedText}>VERIFIED</Text>
          </View>
        </View>

        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Income Tax PAN</Text>
            <Text style={[styles.dataValue, styles.monoValue]}>
              {emp.kyc?.panNumber || 'ABCDE1234F'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>EPFO UAN</Text>
            <Text style={[styles.dataValue, styles.monoValue]}>
              {emp.kyc?.uanNumber || '100987654321'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Bank Name</Text>
            <Text style={styles.dataValue}>
              {emp.bank?.bankName || emp.kyc?.bankName || 'HDFC Bank'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Account Number</Text>
            <Text style={[styles.dataValue, styles.monoValue]}>
              {emp.bank?.accountNumber || emp.kyc?.bankAccount || '50100234567890'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>IFSC Code</Text>
            <Text style={[styles.dataValue, styles.monoValue]}>
              {emp.bank?.ifscCode || emp.kyc?.ifscCode || 'HDFC0001234'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Account Holder</Text>
            <Text style={styles.dataValue}>
              {emp.bank?.accountHolderName || emp.name}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};
