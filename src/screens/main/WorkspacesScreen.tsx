import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Users,
  FolderKanban,
  Building2,
  FileText,
  Clock,
  Receipt,
  Landmark,
  BarChart3,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { ALL_WORKSPACES, WorkspaceConfig } from '../../constants';
import { WorkspaceId } from '../../types';

interface WorkspacesScreenProps {
  navigation: any;
}

export const WorkspacesScreen: React.FC<WorkspacesScreenProps> = ({ navigation }) => {
  const { role, hasWorkspace } = useAuth();

  const getIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'Users':
        return <Users size={24} color={color} />;
      case 'FolderKanban':
        return <FolderKanban size={24} color={color} />;
      case 'Building2':
        return <Building2 size={24} color={color} />;
      case 'FileText':
        return <FileText size={24} color={color} />;
      case 'Clock':
        return <Clock size={24} color={color} />;
      case 'Receipt':
        return <Receipt size={24} color={color} />;
      case 'Landmark':
        return <Landmark size={24} color={color} />;
      case 'BarChart3':
      default:
        return <BarChart3 size={24} color={color} />;
    }
  };

  const handleWorkspacePress = (wsId: WorkspaceId) => {
    switch (wsId) {
      case 'crm':
        navigation.navigate('CrmDashboard');
        break;
      case 'erm':
        navigation.navigate('ErmDashboard');
        break;
      case 'vendor':
        navigation.navigate('VendorWorkspaceHome');
        break;
      case 'documents':
        navigation.navigate('DocumentWorkspaceHome');
        break;

      case 'hrms':
        navigation.navigate('HrmsOverview');
        break;
      case 'expenses':
        navigation.navigate('Expenses');
        break;
      case 'finance':
        navigation.navigate('FinanceDashboard');
        break;
      case 'mis':
        navigation.navigate('MisReports');
        break;
    }
  };

  const permittedWorkspaces = ALL_WORKSPACES.filter((ws) => hasWorkspace(ws.id));

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="Operational Workspaces"
          subtitle={`Access granted for role: ${role.toUpperCase()}`}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      <View style={styles.rbacNotice}>
        <ShieldCheck size={18} color={colors.primary} />
        <Text style={styles.rbacNoticeText}>
          Role-Based Access: Showing {permittedWorkspaces.length} of 8 enterprise workspaces.
        </Text>
      </View>

      <View style={styles.grid}>
        {permittedWorkspaces.map((ws) => (
          <TouchableOpacity
            key={ws.id}
            activeOpacity={0.8}
            onPress={() => handleWorkspacePress(ws.id)}
            style={styles.cardWrapper}
          >
            <Card style={styles.workspaceCard}>
              <View style={[styles.iconContainer, { backgroundColor: ws.color + '15' }]}>
                {getIcon(ws.iconName, ws.color)}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.title}>{ws.title}</Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {ws.subtitle}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  rbacNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  rbacNoticeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.medium,
  },
  grid: {
    gap: spacing.sm,
  },
  cardWrapper: {
    marginBottom: spacing.xs,
  },
  workspaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
