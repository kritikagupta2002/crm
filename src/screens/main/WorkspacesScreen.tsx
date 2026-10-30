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
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { sampleRegister } from '../../fieldDatabase/utils/dispatch';
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
  ChevronLeft,
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
  const { leads, projects, tenders, vendors, govtDocuments, workOrders, dispatches } = useCrm();
  const { invoices, vendorBills } = useFinance();
  const { employees, expenses, leaves } = useHrms();

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

  const { fieldRecords, visible } = useFieldDatabase();
  const fdStats = useMemo(() => {
    const mine = visible(fieldRecords);
    return { records: mine.length, samples: sampleRegister(mine).length, batches: mine.filter((r: any) => r.section === 'dispatch-database').length };
  }, [fieldRecords, visible]);

  // The figures on each card, from the live records.
  const live = useMemo(() => {
    const value = (stages: string[]) => leads.filter((l) => stages.includes(l.stage)).reduce((s, l) => s + (l.quoteValue || l.estimatedValue || 0), 0);
    const lakh = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)} L`);
    const tasks = projects.flatMap((p) => p.tasks || []);
    return {
      running: projects.filter((p) => p.status !== 'Completed').length,
      openTasks: tasks.filter((t) => t.status !== 'Completed').length,
      quoted: leads.filter((l) => ['Proposal Sent', 'Negotiation'].includes(l.stage)).length,
      pipeline: lakh(value(['New Enquiry', 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation'])),
      openTenders: tenders.filter((t: any) => t.status === 'Open').length,
      workOrders: (workOrders || []).length,
      toReceive: lakh(invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.totalAmount - (i.paidAmount || 0), 0)),
      billsToPay: vendorBills.filter((b) => b.status !== 'Paid').length,
      claimsPending: (expenses || []).filter((e) => e.status === 'Pending' || e.status === 'Queried').length,
      settled: lakh((expenses || []).filter((e) => e.status === 'Settled').reduce((s, e) => s + (e.settledAmount || e.approvedAmount || 0), 0)),
      leavePending: (leaves || []).filter((l) => l.status === 'Pending').length,
      departments: new Set(employees.map((e: any) => e.department || e.employment?.department).filter(Boolean)).size,
      toVerify: (govtDocuments || []).filter((d: any) => d.stage === 'To verify' || d.stage === 'To authorize').length,
      dispatches: (dispatches || []).length,
    };
  }, [leads, projects, tenders, workOrders, invoices, vendorBills, expenses, leaves, employees, govtDocuments, dispatches]);

  const allWorkspaces: WorkspaceItemData[] = useMemo(() => [
    {
      id: 'field_database',
      title: 'Field Database',
      subtitle: 'Geological Field Logs & Sampling',
      breadcrumbs: 'Mapping  |  Sampling  |  Drilling  |  Dispatch',
      tags: ['Geological Mapping', 'Sampling Logs', 'Core Drilling', 'Assay Dispatch'],
      metrics: [
        { label: 'Records', value: `${fdStats.records}` },
        { label: 'Samples', value: `${fdStats.samples}` },
        { label: 'Lab batches', value: `${fdStats.batches}` },
      ],
      badge: `${fdStats.records} records`,
      badgeBg: '#f7ebd5',
      badgeTextColor: '#8a5a14',
      group: 'field',
      iconColor: '#9a5f0c',
      iconBg: '#fcf0dc',
      route: 'FieldDatabaseHome',
    },
    {
      id: 'erm',
      title: 'ERM',
      subtitle: 'Projects & Field Operations',
      breadcrumbs: 'Projects  |  Tasks  |  Team  |  Inventory',
      tags: ['Projects', 'Tasks', 'Team', 'Inventory'],
      metrics: [
        { label: 'Projects', value: `${projects.length}` },
        { label: 'Running', value: `${live.running}` },
        { label: 'Open tasks', value: `${live.openTasks}` },
      ],
      badge: `${projects.length} Projects`,
      badgeBg: '#e3f4ec',
      badgeTextColor: '#2e9e6b',
      group: 'field',
      iconColor: '#2e9e6b',
      iconBg: '#e3f4ec',
      route: 'ErmWorkspaceHome',
    },

    {
      id: 'crm',
      title: 'CRM',
      subtitle: 'Client & Sales Operations',
      breadcrumbs: 'Leads  |  Follow-ups  |  Quotations  |  Client Approval',
      tags: ['Leads & Enquiries', 'Quotations', 'PO Approval', 'Client KYC'],
      metrics: [
        { label: 'Enquiries', value: `${leads.length}` },
        { label: 'Quoted', value: `${live.quoted}` },
        { label: 'Pipeline', value: live.pipeline },
      ],
      badge: `${leads.length} Leads`,
      badgeBg: '#e6effa',
      badgeTextColor: '#2f6fb3',
      group: 'commercial',
      iconColor: '#2f6fb3',
      iconBg: '#e6effa',
      route: 'CrmWorkspaceHome',
    },
    {
      id: 'vendor',
      title: 'Vendor',
      subtitle: 'Vendors & Procurement',
      breadcrumbs: 'Vendor Applications  |  Tenders  |  Subcontracts',
      tags: ['Vendor Applications', 'Tenders', 'Sealed Bids', 'Work Orders'],
      metrics: [
        { label: 'Vendors', value: `${vendors.length}` },
        { label: 'Open tenders', value: `${live.openTenders}` },
        { label: 'Work orders', value: `${live.workOrders}` },
      ],
      badge: `${vendors.length} Vendors`,
      badgeBg: '#fcf0dc',
      badgeTextColor: '#9a5f0c',
      group: 'commercial',
      iconColor: '#c27a12',
      iconBg: '#fcf0dc',
      route: 'VendorWorkspaceHome',
    },

    {
      id: 'finance',
      title: 'Finance',
      subtitle: 'Finance & Accounting',
      breadcrumbs: 'Invoices  |  Receivables  |  Payments  |  GST & Tax',
      tags: ['Tax Invoices', 'Receivables', 'Vouchers', 'GST & TDS'],
      metrics: [
        { label: 'Invoices', value: `${invoices.length}` },
        { label: 'To receive', value: live.toReceive },
        { label: 'Bills to pay', value: `${live.billsToPay}` },
      ],
      badge: `${invoices.length} Invoices`,
      badgeBg: '#e3f4ec',
      badgeTextColor: '#2e9e6b',
      group: 'corporate',
      iconColor: '#2e9e6b',
      iconBg: '#e3f4ec',
      route: 'FinanceDashboard',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      subtitle: 'Expense & Reimbursement',
      breadcrumbs: 'Expenses  |  Approvals  |  Reimbursements',
      tags: ['Field Claims', 'Manager Review', 'Settlement', 'Reimbursement'],
      metrics: [
        { label: 'Claims', value: `${expenses.length}` },
        { label: 'Pending', value: `${live.claimsPending}` },
        { label: 'Settled', value: live.settled },
      ],
      badge: `${expenses.length} Claims`,
      badgeBg: '#f7ebd5',
      badgeTextColor: '#b07d27',
      group: 'corporate',
      iconColor: '#b07d27',
      iconBg: '#f7ebd5',
      route: 'Expenses',
    },
    {
      id: 'hrms',
      title: 'HRMS',
      subtitle: 'People & Attendance',
      breadcrumbs: 'Employees  |  Attendance  |  Leave  |  Payroll',
      tags: ['Employees', 'Attendance', 'Leave', 'Payroll'],
      metrics: [
        { label: 'Staff', value: `${employees.length}` },
        { label: 'Departments', value: `${live.departments}` },
        { label: 'Leave to approve', value: `${live.leavePending}` },
      ],
      badge: `${employees.length} Staff`,
      badgeBg: '#e6effa',
      badgeTextColor: '#2f6fb3',
      group: 'corporate',
      iconColor: '#2f6fb3',
      iconBg: '#e6effa',
      route: 'HrmsOverview',
    },
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'Document Management',
      breadcrumbs: 'Documents  |  Scan Inbox  |  Dispatch Register',
      tags: ['Govt Letters', 'Scan Inbox', 'Dispatch Register'],
      metrics: [
        { label: 'Govt letters', value: `${govtDocuments.length}` },
        { label: 'To check', value: `${live.toVerify}` },
        { label: 'Dispatches', value: `${live.dispatches}` },
      ],
      badge: `${govtDocuments.length} Docs`,
      badgeBg: '#f1f5f7',
      badgeTextColor: '#3d5a6c',
      group: 'corporate',
      iconColor: '#3d5a6c',
      iconBg: '#f1f5f7',
      route: 'DocumentWorkspaceHome',
    },

    {
      id: 'mis',
      title: 'MIS',
      subtitle: 'Reports',
      breadcrumbs: 'Sales  |  Projects  |  HR  |  Finance',
      tags: ['Sales', 'Projects', 'HR', 'Finance'],
      metrics: [
        { label: 'Pipeline', value: live.pipeline },
        { label: 'Projects', value: `${projects.length}` },
        { label: 'Staff', value: `${employees.length}` },
      ],
      badge: 'Reports',
      badgeBg: '#fbe5e4',
      badgeTextColor: '#d24c47',
      group: 'intelligence',
      iconColor: '#d24c47',
      iconBg: '#fbe5e4',
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
    fdStats,
    live,
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
        icon: <Mountain size={15} color="#0f2a3d" strokeWidth={2.4} />,
        itemCountLabel: `${filtered.filter((w) => w.group === 'field').length} Modules`,
        items: filtered.filter((w) => w.group === 'field'),
      },
      {
        key: 'commercial',
        title: 'COMMERCIAL & SUPPLY CHAIN',
        icon: <Users size={15} color="#0f2a3d" strokeWidth={2.4} />,
        itemCountLabel: `${filtered.filter((w) => w.group === 'commercial').length} Modules`,
        items: filtered.filter((w) => w.group === 'commercial'),
      },
      {
        key: 'corporate',
        title: 'CORPORATE & FINANCIAL MANAGEMENT',
        icon: <Database size={15} color="#0f2a3d" strokeWidth={2.4} />,
        itemCountLabel: `${filtered.filter((w) => w.group === 'corporate').length} Modules`,
        items: filtered.filter((w) => w.group === 'corporate'),
      },
      {
        key: 'intelligence',
        title: 'REPORTS',
        icon: <BarChart3 size={15} color="#0f2a3d" strokeWidth={2.4} />,
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
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={[{ width: '100%' }, isTablet && styles.tabletContainer]}>
        <View style={styles.headerTitleRow}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={22} color="#0f2a3d" strokeWidth={2.4} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.headerTitle}>Workspaces</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {totalPermitted} Authorized Modules
            </Text>
          </View>
          <View style={styles.rolePill}>
            <Crown size={12} color="#c27a12" strokeWidth={2.4} style={{ marginRight: 4 }} />
            <Text style={styles.rolePillText}>{roleBadgeLabel}</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Search size={16} color="#7c8b96" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workspaces & modules..."
            placeholderTextColor="#7c8b96"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={15} color="#627079" />
            </TouchableOpacity>
          ) : null}
        </View>

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
              <View style={styles.groupHeaderRow}>
                <View style={styles.groupHeaderLeft}>
                  {grp.icon}
                  <Text style={styles.groupHeaderTitle}>{grp.title}</Text>
                </View>
                <Text style={styles.groupCountText}>{grp.itemCountLabel}</Text>
              </View>

              <View style={styles.cardsList}>
                {grp.items.map((ws) => (
                  <TouchableOpacity
                    key={ws.id}
                    activeOpacity={0.8}
                    onPress={() => handleWorkspaceSelect(ws.route)}
                    style={styles.expansiveCard}
                  >
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
                        <ChevronRight size={16} color="#0f2a3d" strokeWidth={2.4} />
                      </View>
                    </View>

                    <View style={styles.tagsRow}>
                      {ws.tags.map((tag, tIdx) => (
                        <View key={tIdx} style={styles.tagPill}>
                          <Text style={styles.tagPillText} numberOfLines={1}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>

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
    backgroundColor: '#f4f7f8',
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
    borderBottomColor: '#edf1f3',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f4f7f8',
    borderWidth: 1,
    borderColor: '#e1e8eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 26,
    color: '#0f2a3d',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#627079',
    marginTop: 2,
    fontWeight: '600',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcf0dc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  rolePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#9a5f0c',
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf1f3',
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
    color: '#0f2a3d',
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
    borderColor: '#e1e8eb',
  },
  catPillActive: {
    backgroundColor: '#0f2a3d',
    borderColor: '#0f2a3d',
  },
  catPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4a5b68',
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
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: 0.7,
  },
  groupCountText: {
    fontSize: 12,
    color: '#627079',
    fontWeight: '700',
  },
  cardsList: {
    gap: 12,
  },
  expansiveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#e1e8eb',
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
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.3,
  },
  descText: {
    fontSize: 13,
    color: '#627079',
    fontWeight: '500',
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#edf1f3',
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
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#f4f7f8',
    borderWidth: 1,
    borderColor: '#e1e8eb',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4a5b68',
  },
  metricsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#edf1f3',
    paddingTop: 10,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#627079',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f2a3d',
    marginTop: 2,
  },
  metricDivider: {
    width: 1.2,
    height: 24,
    backgroundColor: '#e1e8eb',
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
    color: '#0f2a3d',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#627079',
    marginTop: 4,
  },
});
