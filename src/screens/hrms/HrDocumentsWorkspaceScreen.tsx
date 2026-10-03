import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../context';
import { colors, spacing, typography, radius } from '../../theme';
import { AppHeader } from '../../components/common';
import { HrDocumentsScreen } from './HrDocumentsScreen';
import { EmployeeDocumentsScreen } from './EmployeeDocumentsScreen';
import { FileText, ShieldCheck, FolderCheck } from 'lucide-react-native';

export const HrDocumentsWorkspaceScreen: React.FC<{ route?: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const initialTab = route?.params?.initialTab || 'policies';
  const [activeTab, setActiveTab] = useState<'policies' | 'kyc'>(initialTab);
  const { hasRole } = useAuth();
  const isHrOrAdmin = hasRole(['Admin', 'HR']);

  return (
    <View style={styles.container}>
      <AppHeader
        title="HR Documents & KYC"
        subtitle="Corporate compliance guidelines & employee credentials"
        showBack
        onBack={() => navigation.goBack()}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {/* Segmented Workspace Tabs */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'policies' && styles.tabBtnActive]}
            onPress={() => setActiveTab('policies')}
            activeOpacity={0.8}
          >
            <FileText
              size={16}
              color={activeTab === 'policies' ? colors.primary : colors.text.secondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'policies' && styles.tabTextActive,
              ]}
            >
              Corporate Policies & SOPs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'kyc' && styles.tabBtnActive]}
            onPress={() => setActiveTab('kyc')}
            activeOpacity={0.8}
          >
            <ShieldCheck
              size={16}
              color={activeTab === 'kyc' ? colors.primary : colors.text.secondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'kyc' && styles.tabTextActive,
              ]}
            >
              {isHrOrAdmin ? 'Employee KYC Vault' : 'My Credentials'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Workspace Content */}
      <View style={styles.contentWrap}>
        {activeTab === 'policies' ? (
          <HrDocumentsScreen navigation={navigation} />
        ) : (
          <EmployeeDocumentsScreen route={route} navigation={navigation} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabBarWrap: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  tabBtnActive: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  contentWrap: {
    flex: 1,
  },
});
