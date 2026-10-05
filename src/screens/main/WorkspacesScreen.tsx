import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
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
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useFinance } from '../../context/FinanceContext';
import { ALL_WORKSPACES, WorkspaceConfig } from '../../constants';
import { WorkspaceId } from '../../types';

interface WorkspacesScreenProps {
  navigation: any;
}

const getWorkspaceIcon = (iconName: string, color: string) => {
  switch (iconName) {
    case 'Users':
      return <Users size={22} color={color} strokeWidth={2.2} />;
    case 'FolderKanban':
      return <FolderKanban size={22} color={color} strokeWidth={2.2} />;
    case 'Building2':
      return <Building2 size={22} color={color} strokeWidth={2.2} />;
    case 'FileText':
      return <FileText size={22} color={color} strokeWidth={2.2} />;
    case 'Clock':
      return <Clock size={22} color={color} strokeWidth={2.2} />;
    case 'Receipt':
      return <Receipt size={22} color={color} strokeWidth={2.2} />;
    case 'Landmark':
      return <Landmark size={22} color={color} strokeWidth={2.2} />;
    case 'BarChart3':
    default:
      return <BarChart3 size={22} color={color} strokeWidth={2.2} />;
  }
};

export const WorkspacesScreen: React.FC<WorkspacesScreenProps> = ({ navigation }) => {
  const { role, hasWorkspace } = useAuth();
  const { projects, leads, tenders } = useCrm();
  const { invoices } = useFinance();
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'commercial' | 'field' | 'corporate'>('all');

  const getRecordCountBadge = (id: WorkspaceId) => {
    switch (id) {
      case 'crm':
        return `${leads.length} Leads`;
      case 'erm':
        return `${projects.length} Projects`;
      case 'vendor':
        return `${tenders.length} Tenders`;
      case 'documents':
        return 'CAD Vault';
      case 'hrms':
        return 'Muster Live';
      case 'expenses':
        return 'Claims Active';
      case 'finance':
        return `${invoices.length} Invoices`;
      case 'mis':
        return 'BI Analytics';
      default:
        return 'Active';
    }
  };

  const handleWorkspacePress = React.useCallback((wsId: WorkspaceId) => {
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
  }, [navigation]);

  const permittedWorkspaces = React.useMemo(
    () => ALL_WORKSPACES.filter((ws) => hasWorkspace(ws.id)),
    [hasWorkspace]
  );

  const filteredWorkspaces = React.useMemo(() => {
    return permittedWorkspaces.filter((ws) => {
      if (categoryFilter === 'commercial') return ['crm', 'vendor', 'finance'].includes(ws.id);
      if (categoryFilter === 'field') return ['erm', 'documents'].includes(ws.id);
      if (categoryFilter === 'corporate') return ['hrms', 'expenses', 'mis'].includes(ws.id);
      return true;
    });
  }, [permittedWorkspaces, categoryFilter]);

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="Operational Modules"
          subtitle={`${permittedWorkspaces.length} modules available for ${role.toUpperCase()}`}
          badge="Enterprise Launcher"
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* Category Filter Pills (Horizontally Scrollable for all screen widths) */}
      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsRow}
        >
          {(
            [
              { id: 'all', label: `All (${permittedWorkspaces.length})` },
              { id: 'commercial', label: 'Commercial' },
              { id: 'field', label: 'Field Ops' },
              { id: 'corporate', label: 'Corporate' },
            ] as const
          ).map((cat) => {
            const isActive = categoryFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.7}
                onPress={() => setCategoryFilter(cat.id)}
                style={[styles.catPill, isActive && styles.catPillActive]}
              >
                <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Modules Launcher Group */}
      <View style={styles.launcherCard}>
        {filteredWorkspaces.map((ws, index) => {
          const isLast = index === filteredWorkspaces.length - 1;
          const countBadge = getRecordCountBadge(ws.id);

          return (
            <TouchableOpacity
              key={ws.id}
              activeOpacity={0.7}
              onPress={() => handleWorkspacePress(ws.id)}
              style={[styles.launcherRow, !isLast && styles.rowBorder]}
            >
              <View style={[styles.iconBox, { backgroundColor: ws.color + '12' }]}>
                {getWorkspaceIcon(ws.iconName, ws.color)}
              </View>

              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text
                    style={styles.titleText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.88}
                  >
                    {ws.title}
                  </Text>
                  {countBadge ? (
                    <View style={[styles.countPill, { backgroundColor: ws.color + '12' }]}>
                      <Text style={[styles.countText, { color: ws.color }]}>
                        {countBadge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.descText} numberOfLines={1}>
                  {ws.subtitle}
                </Text>
              </View>

              <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pillsWrapper: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingRight: spacing.sm,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  catPillActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  /* Launcher Group Card */
  launcherCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.huge,
    ...shadows.xs,
  },
  launcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md - 1,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md - 2,
  },
  infoCol: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
  },
  countText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  descText: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 15,
  },
});
