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
          title="Operational Workspaces"
          subtitle={`Access granted for role: ${role.toUpperCase()}`}
          scenicBanner
          badge="Enterprise Directory"
          badgeIcon={<Layers size={11} color="#ffffff" strokeWidth={2.4} />}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      <View style={styles.rbacNotice}>
        <View style={styles.rbacIconGlow}>
          <ShieldCheck size={18} color="#0d9488" strokeWidth={2.4} />
        </View>
        <View style={styles.rbacTextCol}>
          <Text style={styles.rbacTitle}>Role-Based Access Verified</Text>
          <Text style={styles.rbacSubtitle}>
            Showing {permittedWorkspaces.length} of 8 authorized workspaces for {role.toUpperCase()}.
          </Text>
        </View>
      </View>

      <View style={styles.categoryPillsRow}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setCategoryFilter('all')}
          style={[styles.catPill, categoryFilter === 'all' && styles.catPillActive]}
        >
          <Text style={[styles.catPillText, categoryFilter === 'all' && styles.catPillTextActive]}>
            All Modules ({permittedWorkspaces.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setCategoryFilter('commercial')}
          style={[styles.catPill, categoryFilter === 'commercial' && styles.catPillActive]}
        >
          <Text style={[styles.catPillText, categoryFilter === 'commercial' && styles.catPillTextActive]}>
            Commercial
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setCategoryFilter('field')}
          style={[styles.catPill, categoryFilter === 'field' && styles.catPillActive]}
        >
          <Text style={[styles.catPillText, categoryFilter === 'field' && styles.catPillTextActive]}>
            Field Exploration
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setCategoryFilter('corporate')}
          style={[styles.catPill, categoryFilter === 'corporate' && styles.catPillActive]}
        >
          <Text style={[styles.catPillText, categoryFilter === 'corporate' && styles.catPillTextActive]}>
            Corporate
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {filteredWorkspaces.map((ws) => (
          <TouchableOpacity
            key={ws.id}
            activeOpacity={0.75}
            onPress={() => handleWorkspacePress(ws.id)}
            style={styles.cardWrapper}
          >
            <View style={styles.workspaceCard}>
              <View style={[styles.iconContainer, { backgroundColor: ws.color + '14' }]}>
                {getWorkspaceIcon(ws.iconName, ws.color)}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{ws.title}</Text>
                  <View style={[styles.countBadge, { backgroundColor: ws.color + '14' }]}>
                    <Text style={[styles.countBadgeText, { color: ws.color }]}>
                      {getRecordCountBadge(ws.id)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {ws.subtitle}
                </Text>
              </View>

              <View style={styles.chevronWrapper}>
                <ChevronRight size={18} color="#94a3b8" strokeWidth={2.4} />
              </View>
            </View>
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
    backgroundColor: '#ffffff',
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#99f6e4',
    ...shadows.sm,
  },
  rbacIconGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rbacTextCol: {
    flex: 1,
  },
  rbacTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e',
    letterSpacing: -0.1,
  },
  rbacSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  catPillActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  catPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  grid: {
    gap: spacing.xs,
  },
  cardWrapper: {
    marginBottom: spacing.xs + 2,
  },
  workspaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  chevronWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});
