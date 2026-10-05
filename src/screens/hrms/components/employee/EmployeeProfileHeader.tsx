import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Phone, Mail, CheckCircle2, Edit2 } from 'lucide-react-native';
import { AppHeader, StatusBadge } from '../../../../components';
import { colors } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeeProfileHeaderProps {
  emp: any;
  initials: string;
  isHrOrAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
  onCall: (phone?: string) => void;
  onEmail: (email?: string) => void;
}

export const EmployeeProfileHeader: React.FC<EmployeeProfileHeaderProps> = ({
  emp,
  initials,
  isHrOrAdmin,
  onBack,
  onEdit,
  onCall,
  onEmail,
}) => {
  return (
    <>
      <AppHeader
        title={emp.name}
        subtitle={`${emp.employeeId} • ${emp.employment?.designation || 'Specialist'}`}
        showBack
        onBack={onBack}
        rightAction={
          isHrOrAdmin ? (
            <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
              <Edit2 size={16} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.heroBanner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.heroInfo}>
          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{emp.name}</Text>
            {emp.kyc?.status === 'Verified' && (
              <View style={styles.kycVerifiedBadge}>
                <CheckCircle2 size={12} color={colors.success} />
                <Text style={styles.kycVerifiedText}>KYC</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroDesig}>{emp.employment?.designation || 'Staff'}</Text>
          <Text style={styles.heroDept}>{emp.employment?.department || 'Exploration'}</Text>

          <View style={styles.heroBadges}>
            <View style={styles.empIdPill}>
              <Text style={styles.empIdPillText}>{emp.employeeId}</Text>
            </View>
            <StatusBadge status={emp.employment?.status || 'Active'} size="small" />
            <Text style={styles.roleText}>{(emp.role || 'employee').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.heroContactStrip}>
          {emp.phone ? (
            <TouchableOpacity style={styles.contactCircle} onPress={() => onCall(emp.phone)}>
              <Phone size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
          {emp.email ? (
            <TouchableOpacity style={styles.contactCircle} onPress={() => onEmail(emp.email)}>
              <Mail size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </>
  );
};
