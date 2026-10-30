import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  FolderKanban,
  Building2,
  Users,
  Clock,
  FileCheck,
  FileSignature,
  Receipt,
  Store,
  CalendarDays,
  Wallet,
  Bell,
  AlertTriangle,
  MessageCircleQuestion,
} from 'lucide-react-native';
import { HomeHeader, HeroBanner } from '../../components/common';
import { StatGrid, ActionList, SectionTitle, Panel, SplitBar, inr, homeStyles, ActionItem, NOTICE_TONE, timeAgo } from '../../components/home/HomeBlocks';
import { colors, fonts } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { useFinance } from '../../context/FinanceContext';
import { useNotifications } from '../../context/NotificationContext';
import { misService } from '../../services';
import { questionsFor } from '../../utils/questions';
import {
  DirectorHomeScreen,
  ManagerHomeScreen,
  EmployeeHomeScreen,
  FinanceMasterHomeScreen,
  AccountsExecutiveHomeScreen,
} from '../roles';

interface HomeScreenProps {
  navigation: any;
}

/* Each role has its own home; this picks it. */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { canonicalRole } = useAuth();
  if (canonicalRole === 'director') return <DirectorHomeScreen navigation={navigation} />;
  if (canonicalRole === 'manager') return <ManagerHomeScreen navigation={navigation} />;
  if (canonicalRole === 'employee') return <EmployeeHomeScreen navigation={navigation} />;
  if (canonicalRole === 'finance_master') return <FinanceMasterHomeScreen navigation={navigation} />;
  if (canonicalRole === 'accounts_executive') return <AccountsExecutiveHomeScreen navigation={navigation} />;
  return <SuperAdminHome navigation={navigation} />;
};

const OPEN_STAGES = ['New Enquiry', 'New', 'Contacted', 'Qualified'];
const QUOTED_STAGES = ['Proposal Sent', 'Negotiation'];
const leadValue = (l: any) => l.quoteValue || l.estimatedValue || 0;

const SuperAdminHome: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { projects, leads, clients, quotes, vendorApplications } = useCrm();
  const { invoices, vendorBills } = useFinance();
  const { employees, leaves, expenses } = useHrms();
  const { notifications } = useNotifications();
  const [presentToday, setPresentToday] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    misService
      .getZeroFakeAttendanceMetrics()
      .then((m: any) => live && setPresentToday(m?.presentToday ?? null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const running = projects.filter((p) => p.status !== 'Completed');
  const awaiting = projects.filter((p) => p.status === 'Awaiting approval').length;

  const waiting = {
    clientApprovals: leads.filter((l) => l.quoteStatus === 'Accepted' && l.stage !== 'Won').length,
    quoteApprovals: quotes.filter((q) => q.status === 'Pending Approval').length,
    expenses: (expenses || []).filter((e) => e.status === 'Pending' || e.status === 'Queried').length,
    vendors: (vendorApplications || []).filter((a) => a.status === 'New' || a.status === 'Changes requested').length,
    leaves: (leaves || []).filter((l) => l.status === 'Pending').length,
    questions: questionsFor('super_admin', leads).filter((q) => q.status === 'Open').length,
  };
  const waitingTotal = Object.values(waiting).reduce((s, n) => s + n, 0);

  const pipeline = useMemo(() => {
    const sum = (stages: string[]) => leads.filter((l) => stages.includes(l.stage)).reduce((s, l) => s + leadValue(l), 0);
    return { open: sum(OPEN_STAGES), quoted: sum(QUOTED_STAGES), won: sum(['Won']) };
  }, [leads]);

  const receivables = invoices
    .filter((i) => i.status !== 'Paid')
    .reduce((s, i) => s + (i.totalAmount - (i.paidAmount || 0)), 0);
  const payables = vendorBills.filter((b) => b.status !== 'Paid').reduce((s, b) => s + b.totalAmount, 0);

  const count = (n: number, word: string): Pick<ActionItem, 'tag' | 'tone'> =>
    n > 0 ? { tag: `${n} ${word}`, tone: 'amber' } : { tag: 'Clear', tone: 'green' };

  const actions: ActionItem[] = [
    { key: 'ca', title: 'Client approvals', sub: 'PO, advance and agreement after a quote is accepted', Icon: FileCheck, ...count(waiting.clientApprovals, 'pending'), onPress: () => navigation.navigate('ClientApprovals') },
    { key: 'qa', title: 'Quotation approvals', sub: 'Quotes waiting for the director', Icon: FileSignature, ...count(waiting.quoteApprovals, 'pending'), onPress: () => navigation.navigate('QuoteApprovals') },
    { key: 'ex', title: 'Expense claims', sub: 'Field travel and site expenses', Icon: Receipt, ...count(waiting.expenses, 'claims'), onPress: () => navigation.navigate('Expenses') },
    { key: 'va', title: 'Vendor applications', sub: 'New vendors to approve', Icon: Store, ...count(waiting.vendors, 'new'), onPress: () => navigation.navigate('VendorApplications') },
    { key: 'cq', title: 'Client questions', sub: 'Asked on the client portal', Icon: MessageCircleQuestion, ...count(waiting.questions, 'waiting'), onPress: () => navigation.navigate('ClientQuestions') },
    { key: 'lv', title: 'Leave requests', sub: 'Team leave to approve', Icon: CalendarDays, ...count(waiting.leaves, 'pending'), onPress: () => navigation.navigate('LeaveApprovals') },
  ];

  return (
    <View style={homeStyles.root}>
      <HomeHeader navigation={navigation} searchTo="WorkspacesTab" />
      <ScrollView contentContainerStyle={homeStyles.body} showsVerticalScrollIndicator={false}>
        <HeroBanner
          title="Geology for a Better Tomorrow"
          caption={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        />

        <StatGrid
          items={[
            { label: 'Active projects', value: running.length, sub: awaiting ? `${awaiting} awaiting approval` : `${projects.length} in all`, Icon: FolderKanban, tone: 'teal', onPress: () => navigation.navigate('Projects') },
            { label: 'Clients', value: clients.length, sub: `${leads.filter((l) => OPEN_STAGES.includes(l.stage)).length} open enquiries`, Icon: Building2, tone: 'blue', onPress: () => navigation.navigate('Clients') },
            { label: 'Team', value: employees.length, sub: presentToday != null ? `${presentToday} present today` : undefined, Icon: Users, tone: 'green', onPress: () => navigation.navigate('EmployeeDirectory') },
            { label: 'Waiting for you', value: waitingTotal, sub: 'Approvals across modules', Icon: Clock, tone: waitingTotal ? 'amber' : 'green' },
          ]}
        />

        <SectionTitle title="Waiting for you" count={waitingTotal} />
        <ActionList items={actions} />

        <SectionTitle title="Sales pipeline" action="Leads" onAction={() => navigation.navigate('Leads')} />
        <Panel>
          <Text style={styles.bigValue}>{inr(pipeline.open + pipeline.quoted + pipeline.won)}</Text>
          <Text style={styles.bigLabel}>Value of all enquiries this year</Text>
          <View style={{ height: 12 }} />
          <SplitBar
            parts={[
              { label: 'Enquiries', value: pipeline.open, display: inr(pipeline.open), tone: 'blue' },
              { label: 'Quoted', value: pipeline.quoted, display: inr(pipeline.quoted), tone: 'amber' },
              { label: 'Won', value: pipeline.won, display: inr(pipeline.won), tone: 'green' },
            ]}
          />
        </Panel>

        <SectionTitle title="Money" action="Finance" onAction={() => navigation.navigate('FinanceDashboard')} />
        <View style={styles.moneyRow}>
          <TouchableOpacity style={styles.moneyCard} activeOpacity={0.8} onPress={() => navigation.navigate('Invoices')}>
            <Wallet size={16} color={colors.success} />
            <Text style={styles.moneyValue}>{inr(receivables)}</Text>
            <Text style={styles.moneyLabel}>To receive · {invoices.filter((i) => i.status !== 'Paid').length} invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moneyCard} activeOpacity={0.8} onPress={() => navigation.navigate('VendorBills')}>
            <Receipt size={16} color={colors.warning} />
            <Text style={styles.moneyValue}>{inr(payables)}</Text>
            <Text style={styles.moneyLabel}>To pay · {vendorBills.filter((b) => b.status !== 'Paid').length} bills</Text>
          </TouchableOpacity>
        </View>

        <SectionTitle title="Projects" action="All projects" onAction={() => navigation.navigate('Projects')} />
        <ActionList
          empty="No projects yet."
          items={running.slice(0, 4).map((p) => ({
            key: p.id,
            title: p.title || p.name || p.projectCode,
            sub: `${p.clientName} · ${p.stageName}`,
            Icon: FolderKanban,
            tone: p.status === 'Awaiting approval' ? 'amber' : 'teal',
            tag: p.status === 'Awaiting approval' ? 'Approval' : `Stage ${p.currentStage}`,
            onPress: () => navigation.navigate('ProjectDetail', { projectId: p.id }),
          }))}
        />

        <SectionTitle title="Recent activity" action="All" onAction={() => navigation.navigate('AlertsTab')} />
        <ActionList
          empty="No new activity."
          items={notifications.slice(0, 4).map((n) => {
            const t = NOTICE_TONE[n.type] || NOTICE_TONE.info;
            return { key: n.id, title: n.title, sub: [n.message, timeAgo(n.timestamp)].filter(Boolean).join(' · '), Icon: t.Icon || Bell, tone: t.tone };
          })}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bigValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.textPrimary },
  bigLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  moneyRow: { flexDirection: 'row', gap: 10 },
  moneyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    padding: 12,
    gap: 6,
  },
  moneyValue: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary },
  moneyLabel: { fontSize: 11.5, color: colors.textMuted },
});
