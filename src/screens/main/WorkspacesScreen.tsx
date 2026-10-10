import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../utils/responsive';
import {
  Users,
  FolderKanban,
  Building2,
  FileText,
  Clock,
  Receipt,
  Landmark,
  BarChart3,
  Compass,
  ChevronRight,
  Search,
  X,
  Mountain,
  Database,
  Crown,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useFinance } from '../../context/FinanceContext';
import { useHrms } from '../../context/HrmsContext';
import { WorkspaceId } from '../../types';

interface WorkspacesScreenProps {
  navigation: any;
}

interface WorkspaceItemData {
  id: WorkspaceId;
  title: string;
  subtitle: string;
  breadcrumbs: string;
  tags: string[];
  metrics: { label: string; value: string }[];
  badge: string;
  badgeBg: string;
  badgeTextColor: string;
  group: 'field' | 'commercial' | 'corporate' | 'intelligence';
  iconColor: string;
  iconBg: string;
  route: string;
}

interface WorkspaceGroup {
  key: string;
  title: string;
  icon: React.ReactNode;
  itemCountLabel: string;
  items: WorkspaceItemData[];
}

export const WorkspacesScreen: React.FC<WorkspacesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmall, isCompact, isTablet } = useResponsive();

  const { role, hasWorkspace, canonicalRole } = useAuth();
  const { leads, projects, tenders, vendors, govtDocuments } = useCrm();
  const { invoices } = useFinance();
  const { employees, expenses } = useHrms();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'field' | 'commercial' | 'corporate' | 'intelligence'>('all');

  const getWorkspaceIcon = (id: WorkspaceId, color: string) => {
    switch (id) {
      case 'field_database':
        return <Compass size={24} color={color} strokeWidth={2.3} />;
      case 'erm':
        return <FolderKanban size={24} color={color} strokeWidth={2.3} />;
      case 'crm':
        return <Users size={24} color={color} strokeWidth={2.3} />;
      case 'vendor':
        return <Building2 size={24} color={color} strokeWidth={2.3} />;
      case 'finance':
        return <Landmark size={24} color={color} strokeWidth={2.3} />;
      case 'expenses':
        return <Receipt size={24} color={color} strokeWidth={2.3} />;
      case 'hrms':
        return <Clock size={24} color={color} strokeWidth={2.3} />;
      case 'documents':
        return <FileText size={24} color={color} strokeWidth={2.3} />;
      case 'mis':
      default:
        return <BarChart3 size={24} color={color} strokeWidth={2.3} />;
    }
  };

  const allWorkspaces: WorkspaceItemData[] = useMemo(() => [
    // 1. Field & Exploration
    {
      id: 'field_database',
      title: 'Field Database',
      subtitle: 'Geological Field Logs & Sampling',
      breadcrumbs: 'Mapping  |  Sampling  |  Drilling  |  Dispatch',
      tags: ['Geological Mapping', 'Sampling Logs', 'Core Drilling', 'Assay Dispatch'],
      metrics: [
        { label: 'Field Logs', value: '10 Logs' },
        { label: 'Core Depth', value: '1,420 M' },
        { label: 'Assay Labs', value: 'NABL Tracked' },
      ],
      badge: '10 Logs',
      badgeBg: '#fff7ed',
      badgeTextColor: '#c2410c',
      group: 'field',
      iconColor: '#b45309',
      iconBg: '#fef3c7',
      route: 'FieldDatabaseHome',
    },
    {
      id: 'erm',
      title: 'ERM',
      subtitle: 'Projects & Field Operations',
      breadcrumbs: 'Projects  |  Tasks  |  Team  |  Inventory',
      tags: ['Mining Projects', 'Universal Tasks', 'Field Team', 'Drill Rigs'],
      metrics: [
        { label: 'Mining Blocks', value: `${projects.length > 0 ? projects.length : 5} Blocks` },
        { label: 'Execution', value: '68% Live' },
        { label: 'Field Staff', value: '12 Active' },
      ],
      badge: `${projects.length > 0 ? projects.length : 5} Projects`,
      badgeBg: '#ecfdf5',
      badgeTextColor: '#059669',
      group: 'field',
      iconColor: '#059669',
      iconBg: '#ecfdf5',
      route: 'ErmWorkspaceHome',
    },

    // 2. Commercial & Supply Chain
    {
      id: 'crm',
      title: 'CRM',
      subtitle: 'Client & Sales Operations',
      breadcrumbs: 'Leads  |  Follow-ups  |  Quotations  |  Client Approval',
      tags: ['Leads & Enquiries', 'Quotations', 'PO Approval', 'Client KYC'],
      metrics: [
        { label: 'Active Leads', value: `${leads.length > 0 ? leads.length : 3} Enquiries` },
        { label: 'Proposals', value: '4 Sent' },
        { label: 'Pipeline', value: '₹1.85 Cr' },
      ],
      badge: `${leads.length > 0 ? leads.length : 3} Leads`,
      badgeBg: '#eff6ff',
      badgeTextColor: '#2563eb',
      group: 'commercial',
      iconColor: '#2563eb',
      iconBg: '#eff6ff',
      route: 'CrmWorkspaceHome',
    },
    {
      id: 'vendor',
      title: 'Vendor',
      subtitle: 'Vendors & Procurement',
      breadcrumbs: 'Vendor Applications  |  Tenders  |  Subcontracts',
      tags: ['Contractor Gate', 'Live Tenders', 'Sealed Bids', 'Work Orders'],
      metrics: [
        { label: 'Vendors', value: `${vendors.length || 8} Active` },
        { label: 'Open Tenders', value: `${tenders.length || 3} Live` },
        { label: 'Bidding Gate', value: 'Sealed & Safe' },
      ],
      badge: `${vendors.length || tenders.length ? vendors.length || tenders.length : 8} Vendors`,
      badgeBg: '#fffbeb',
      badgeTextColor: '#b45309',
      group: 'commercial',
      iconColor: '#d97706',
      iconBg: '#fefce8',
      route: 'VendorWorkspaceHome',
    },

    // 3. Corporate & Finance
    {
      id: 'finance',
      title: 'Finance',
      subtitle: 'Finance & Accounting',
      breadcrumbs: 'Invoices  |  Receivables  |  Payments  |  GST & Tax',
      tags: ['Tax Invoices', 'Receivables', 'Vouchers', 'GST & TDS'],
      metrics: [
        { label: 'Invoices', value: `${invoices.length > 0 ? invoices.length : 5} Invoices` },
        { label: 'Receivables', value: '₹38.2 L' },
        { label: 'Tax Filings', value: '100% Filed' },
      ],
      badge: `${invoices.length > 0 ? invoices.length : 5} Invoices`,
      badgeBg: '#ecfdf5',
      badgeTextColor: '#059669',
      group: 'corporate',
      iconColor: '#059669',
      iconBg: '#ecfdf5',
      route: 'FinanceDashboard',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      subtitle: 'Expense & Reimbursement',
      breadcrumbs: 'Expenses  |  Approvals  |  Reimbursements',
      tags: ['Field Claims', 'Manager Review', 'Settlement', 'Reimbursement'],
      metrics: [
        { label: 'Pending Claims', value: `${expenses.length > 0 ? expenses.length : 2} Claims` },
        { label: 'Reimbursed', value: '₹42,500' },
        { label: 'Audit SLA', value: '24-Hour Gate' },
      ],
      badge: `${expenses.length > 0 ? expenses.length : 2} Claims`,
      badgeBg: '#fff7ed',
      badgeTextColor: '#ea580c',
      group: 'corporate',
      iconColor: '#ea580c',
      iconBg: '#fff7ed',
      route: 'Expenses',
    },
    {
      id: 'hrms',
      title: 'HRMS',
      subtitle: 'People & Attendance',
      breadcrumbs: 'Employees  |  Attendance  |  Leave  |  Payroll',
      tags: ['Staff Directory', 'Live Attendance', 'Leave Approvals', 'Monthly Payroll'],
      metrics: [
        { label: 'Total Staff', value: `${employees.length > 0 ? employees.length : 87} Active` },
        { label: 'Present Today', value: '42 Present' },
        { label: 'On Leave', value: '6 Staff' },
      ],
      badge: `${employees.length > 0 ? employees.length : 5} Staff`,
      badgeBg: '#eff6ff',
      badgeTextColor: '#2563eb',
      group: 'corporate',
      iconColor: '#2563eb',
      iconBg: '#eff6ff',
      route: 'HrmsOverview',
    },
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'Document Management',
      breadcrumbs: 'Documents  |  Scan Inbox  |  Dispatch Register',
      tags: ['Govt Letters', 'Scan Verification', 'Dispatch Register', '4-Eyes Guard'],
      metrics: [
        { label: 'Govt Records', value: `${govtDocuments.length > 0 ? govtDocuments.length : 14} Files` },
        { label: 'Dispatches', value: '9 In Transit' },
        { label: 'Verification', value: '4-Eyes Guard' },
      ],
      badge: `${govtDocuments.length > 0 ? govtDocuments.length : 14} Docs`,
      badgeBg: '#faf5ff',
      badgeTextColor: '#9333ea',
      group: 'corporate',
      iconColor: '#9333ea',
      iconBg: '#faf5ff',
      route: 'DocumentWorkspaceHome',
    },

    // 4. Intelligence & Governance
    {
      id: 'mis',
      title: 'MIS',
      subtitle: 'Reports & Intelligence',
      breadcrumbs: 'Executive Reports  |  HR Settings  |  Business Intelligence',
      tags: ['Executive BI', 'Operational Telemetry', 'Financial P&L', 'HR Compliance'],
      metrics: [
        { label: 'BI Cockpit', value: 'Live 2026' },
        { label: 'Export Modes', value: 'PDF & Excel' },
        { label: 'Audit Log', value: 'Immutable' },
      ],
      badge: 'BI',
      badgeBg: '#fff1f2',
      badgeTextColor: '#e11d48',
      group: 'intelligence',
      iconColor: '#e11d48',
      iconBg: '#fff1f2',
      route: 'MisReports',
    },
  ], [
    projects.length,
    leads.length,
    vendors.length,
    tenders.length,
    invoices.length,
    expenses.length,
    employees.length,
    govtDocuments.length,
  ]);

  const groupedWorkspaces = useMemo(() => {
    const permitted = allWorkspaces.filter((ws) => hasWorkspace(ws.id));
    let filtered = permitted;

    if (activeCategory !== 'all') {
      if (activeCategory === 'field') {
        filtered = filtered.filter((ws) => ws.group === 'field');
      } else if (activeCategory === 'commercial') {
        filtered = filtered.filter((ws) => ws.group === 'commercial');
      } else if (activeCategory === 'corporate') {
        filtered = filtered.filter((ws) => ws.group === 'corporate');
      } else if (activeCategory === 'intelligence') {
        filtered = filtered.filter((ws) => ws.group === 'intelligence');
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (ws) =>
          ws.title.toLowerCase().includes(q) ||
          ws.subtitle.toLowerCase().includes(q) ||
          ws.breadcrumbs.toLowerCase().includes(q)
      );
    }

    const groups: WorkspaceGroup[] = [
      {
        key: 'field',
        title: 'FIELD & GEOLOGICAL OPERATIONS',
        icon: <Mountain size={15} color="#0f172a" strokeWidth={2.4} />,
        itemCountLabel: `${filtered.filter((w) => w.group === 'field').length} Modules`,
        items: filtered.filter((w) => w.group === 'field'),
      },
      {
        key: 'commercial',
        title: 'COMMERCIAL & SUPPLY CHAIN',
        icon: <Users size={15} color="#0f172a" strokeWidth={2.4} />,
        itemCountLabel: `${filtered.filter((w) => w.group === 'commercial').length} Modules`,
        items: filtered.filter((w) => w.group === 'commercial'),
      },
      {
        key: 'corporate',
        title: 'CORPORATE & FINANCIAL MANAGEMENT',
        icon: <Database size={15} color="#0f172a" strokeWidth={2.4} />,
        itemCountLabel: `${filtered.filter((w) => w.group === 'corporate').length} Modules`,
        items: filtered.filter((w) => w.group === 'corporate'),
      },
      {
        key: 'intelligence',
        title: 'EXECUTIVE INTELLIGENCE & GOVERNANCE',
        icon: <BarChart3 size={15} color="#0f172a" strokeWidth={2.4} />,
        itemCountLabel: `${filtered.filter((w) => w.group === 'intelligence').length} Module`,
        items: filtered.filter((w) => w.group === 'intelligence'),
      },
    ];

    return groups.filter((g) => g.items.length > 0);
  }, [allWorkspaces, hasWorkspace, activeCategory, searchQuery]);

  const totalPermitted = useMemo(() => {
    return allWorkspaces.filter((ws) => hasWorkspace(ws.id)).length;
  }, [allWorkspaces, hasWorkspace]);

  const handleWorkspaceSelect = (route: string) => {
    navigation.navigate(route);
  };

  const roleBadgeLabel = useMemo(() => {
    switch (canonicalRole) {
      case 'director':
        return 'DIRECTOR';
      case 'manager':
        return 'MANAGER';
      case 'employee':
        return 'EMPLOYEE';
      case 'finance_master':
        return 'FINANCE MASTER';
      case 'accounts_executive':
        return 'ACCOUNTS EXEC';
      case 'super_admin':
      default:
        return 'SUPER ADMIN';
    }
  }, [canonicalRole]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={[{ width: '100%' }, isTablet && styles.tabletContainer]}>
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.headerTitle}>Workspaces</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {totalPermitted} Authorized Modules
            </Text>
          </View>
          <View style={styles.rolePill}>
            <Crown size={12} color="#d97706" strokeWidth={2.4} style={{ marginRight: 4 }} />
            <Text style={styles.rolePillText}>{roleBadgeLabel}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workspaces & modules..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={15} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'field', label: 'Field & Geo' },
            { id: 'commercial', label: 'Commercial' },
            { id: 'corporate', label: 'Corporate' },
            { id: 'intelligence', label: 'MIS & Reports' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.7}
                onPress={() => setActiveCategory(cat.id as any)}
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
      </View>

      {/* Workspaces Explorer Group */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && { paddingHorizontal: 10 },
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {groupedWorkspaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No matching modules</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search query or filter</Text>
          </View>
        ) : (
          groupedWorkspaces.map((grp) => (
            <View key={grp.key} style={styles.groupSection}>
              {/* Group Header Row */}
              <View style={styles.groupHeaderRow}>
                <View style={styles.groupHeaderLeft}>
                  {grp.icon}
                  <Text style={styles.groupHeaderTitle}>{grp.title}</Text>
                </View>
                <Text style={styles.groupCountText}>{grp.itemCountLabel}</Text>
              </View>

              {/* Group Items Cards */}
              <View style={styles.cardsList}>
                {grp.items.map((ws) => (
                  <TouchableOpacity
                    key={ws.id}
                    activeOpacity={0.8}
                    onPress={() => handleWorkspaceSelect(ws.route)}
                    style={styles.expansiveCard}
                  >
                    {/* Top Row: Icon + Title + Live Badge + Arrow */}
                    <View style={styles.cardTopRow}>
                      <View style={[styles.iconBox, { backgroundColor: ws.iconBg }]}>
                        {getWorkspaceIcon(ws.id, ws.iconColor)}
                      </View>

                      <View style={styles.infoCol}>
                        <View style={styles.titleRow}>
                          <Text style={styles.titleText}>{ws.title}</Text>
                          <View style={[styles.countBadge, { backgroundColor: ws.badgeBg }]}>
                            <Text style={[styles.countBadgeText, { color: ws.badgeTextColor }]}>
                              {ws.badge}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.descText} numberOfLines={1}>
                          {ws.subtitle}
                        </Text>
                      </View>

                      <View style={styles.arrowCircle}>
                        <ChevronRight size={16} color="#0b2545" strokeWidth={2.4} />
                      </View>
                    </View>

                    {/* Middle Row: Workflow Chips Strip */}
                    <View style={styles.tagsRow}>
                      {ws.tags.map((tag, tIdx) => (
                        <View key={tIdx} style={styles.tagPill}>
                          <Text style={styles.tagPillText} numberOfLines={1}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Bottom Row: Live KPI Mini Metrics Footer */}
                    <View style={styles.metricsFooter}>
                      {ws.metrics.map((m, mIdx) => (
                        <React.Fragment key={mIdx}>
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel} numberOfLines={1}>{m.label}</Text>
                            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{m.value}</Text>
                          </View>
                          {mIdx < ws.metrics.length - 1 && (
                            <View style={styles.metricDivider} />
                          )}
                        </React.Fragment>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabletContainer: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  rolePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
    paddingRight: 16,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catPillActive: {
    backgroundColor: '#0b2545',
    borderColor: '#0b2545',
  },
  catPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 110,
  },
  groupSection: {
    marginBottom: 18,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  groupHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 0.7,
  },
  groupCountText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  cardsList: {
    gap: 12,
  },
  expansiveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    padding: 15,
    ...shadows.xs,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    paddingRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  descText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  metricsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  metricDivider: {
    width: 1.2,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});
