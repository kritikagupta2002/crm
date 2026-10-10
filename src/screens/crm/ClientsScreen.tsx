import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  CheckCircle2,
  UserPlus,
  IndianRupee,
  Search,
  Plus,
  ArrowRight,
  MapPin,
  Briefcase,
  Phone,
  User,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import {
  ScreenContainer,
  AppHeader,
  Card,
  StatusBadge,
  Input,
  EmptyState,
} from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';

interface ClientsScreenProps {
  navigation: any;
}

const ONBOARDING_STEP_KEYS = ['kyc', 'leaseDocs', 'kickoff', 'teamAssigned', 'portal'];

const formatINR = (n: number) => {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const getCompanyInitials = (name: string) => {
  if (!name) return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const themes = [
    { bg: '#0F172A', text: '#FFFFFF', border: '#334155' }, // Deep Slate
    { bg: '#0D9488', text: '#FFFFFF', border: '#0F766E' }, // Teal
    { bg: '#1E3A8A', text: '#FFFFFF', border: '#1D4ED8' }, // Blue
    { bg: '#701A75', text: '#FFFFFF', border: '#86198F' }, // Purple
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
};

export const ClientsScreen: React.FC<ClientsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { leads, clients } = useCrm();

  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Onboarding'>('All');

  const masterClients = useMemo(() => {
    const list: any[] = [];
    const wonLeads = leads.filter((l) => l.stage === 'Won');

    wonLeads.forEach((l) => {
      const isComplete = ONBOARDING_STEP_KEYS.every(
        (k) => (l.onboarding as any)?.[k]
      );
      list.push({
        id: l.id,
        name: l.company,
        contactPerson: l.contactPerson || l.contactName || 'Corporate Contact',
        phone: l.phone,
        email: l.email,
        location: l.location || 'Rajasthan',
        service: l.serviceDetail || l.title || 'Core Exploration & Resource Estimation',
        businessValue: l.quoteValue || l.estimatedValue || 0,
        owner: l.assignedTo || 'Vikram Patel',
        clientSince: l.wonOn || l.createdAt?.split('T')[0] || '2026-02-15',
        status: isComplete ? 'Active' : 'Under Onboarding',
        activeProjectsCount: 1,
        leadId: l.id,
        rawLead: l,
      });
    });

    clients.forEach((c) => {
      if (!list.some((it) => it.name.toLowerCase() === c.name.toLowerCase())) {
        const matchedLead = leads.find(
          (l) =>
            l.company.toLowerCase() === c.name.toLowerCase() ||
            c.name.toLowerCase().includes(l.company.toLowerCase()) ||
            l.company.toLowerCase().includes(c.name.toLowerCase())
        );

        list.push({
          id: c.id,
          name: c.name,
          contactPerson:
            c.contactPerson ||
            matchedLead?.contactName ||
            matchedLead?.contactPerson ||
            'Debashis Sen (VP - Mining)',
          phone: c.phone || matchedLead?.phone || '',
          email: c.email || matchedLead?.email || '',
          location: c.location || c.state || matchedLead?.location || 'Rajasthan',
          service:
            matchedLead?.serviceDetail ||
            matchedLead?.title ||
            'Core Exploration & Geotechnical Logging',
          businessValue: c.totalValue || matchedLead?.quoteValue || 0,
          owner: matchedLead?.assignedTo || (c.id === 'cli-002' ? 'Vikram Patel' : 'Dr. Rajesh Bansal'),
          clientSince: c.createdAt || '2026-01-10',
          status: c.contractStatus || 'Active',
          activeProjectsCount: c.activeProjectsCount || 2,
          leadId: c.leadId || matchedLead?.id || c.id,
          rawLead: matchedLead || null,
        });
      }
    });

    return list;
  }, [leads, clients]);

  const states = useMemo(() => {
    const s = new Set<string>();
    masterClients.forEach((c) => {
      if (c.location) s.add(c.location.split(',')[0].trim());
    });
    return ['All', ...Array.from(s)];
  }, [masterClients]);

  const totalClients = masterClients.length;
  const activeCount = masterClients.filter((c) => c.status === 'Active').length;
  const onboardingCount = totalClients - activeCount;
  const totalBusinessSum = masterClients.reduce((sum, c) => sum + (c.businessValue || 0), 0);

  const q = search.trim().toLowerCase();
  const visibleClients = masterClients.filter((c) => {
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.service.toLowerCase().includes(q) ||
      c.owner.toLowerCase().includes(q);

    const matchesState = selectedState === 'All' || c.location.includes(selectedState);
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Active' && c.status === 'Active') ||
      (selectedStatus === 'Onboarding' && (c.status === 'Onboarding' || c.status === 'Under Onboarding'));

    return matchesSearch && matchesState && matchesStatus;
  });

  return (
    <ScreenContainer
      scrollable={false}
      noPadding
      header={
        <AppHeader
          title="Client Master Directory"
          subtitle={`${masterClients.length} corporate concessionaires & clients`}
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('ClientOnboarding')}
            >
              <Plus size={20} color={colors.textInverse} />
            </TouchableOpacity>
          }
        />
      }
    >
      {/* 1. Interactive KPI Metrics Strip */}
      <View style={styles.metricsStrip}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.metricItem, selectedStatus === 'All' && styles.metricItemActive]}
          onPress={() => setSelectedStatus('All')}
        >
          <Text style={styles.metricVal}>{totalClients}</Text>
          <Text style={styles.metricLbl}>Total</Text>
        </TouchableOpacity>

        <View style={styles.metricDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.metricItem, selectedStatus === 'Active' && styles.metricItemActive]}
          onPress={() => setSelectedStatus('Active')}
        >
          <Text style={[styles.metricVal, { color: colors.success }]}>{activeCount}</Text>
          <Text style={styles.metricLbl}>Active</Text>
        </TouchableOpacity>

        <View style={styles.metricDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.metricItem, selectedStatus === 'Onboarding' && styles.metricItemActive]}
          onPress={() => setSelectedStatus('Onboarding')}
        >
          <Text style={[styles.metricVal, { color: colors.warning }]}>{onboardingCount}</Text>
          <Text style={styles.metricLbl}>Onboarding</Text>
        </TouchableOpacity>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: colors.primary }]}>{formatINR(totalBusinessSum)}</Text>
          <Text style={styles.metricLbl}>Pipeline</Text>
        </View>
      </View>

      {/* 2. Search Input */}
      <Input
        placeholder="Search client, contact person, location..."
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={16} color={colors.textMuted} />}
        containerStyle={styles.searchBar}
      />

      {/* 3. Clearly Labeled Filter Chips */}
      <View style={styles.filtersRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <Text style={styles.filterGroupLabel}>Status:</Text>
          {(['All', 'Active', 'Onboarding'] as const).map((st) => {
            const isActive = selectedStatus === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedStatus(st)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {st === 'All' ? 'All Status' : st}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.chipDivider} />

          <Text style={styles.filterGroupLabel}>State:</Text>
          {states.slice(0, 6).map((st) => {
            const isActive = selectedState === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedState(st)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {st === 'All' ? 'All Locations' : st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Client Cards List */}
      {visibleClients.length === 0 ? (
        <EmptyState
          title="No Clients Found"
          description="No client matches the active search query or filter selection."
          icon={<Building2 size={44} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={visibleClients}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 50, 84) },
          ]}
          renderItem={({ item }) => {
            const initials = getCompanyInitials(item.name);
            const avatarColor = getAvatarColor(item.name);

            return (
              <Card
                style={styles.card}
                onPress={() =>
                  navigation.navigate('ClientDetail', {
                    clientId: item.id,
                    clientName: item.name,
                  })
                }
              >
                {/* Header: Company Avatar, Name, Contact & Status Badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeftWrap}>
                    <View
                      style={[
                        styles.companyAvatar,
                        { backgroundColor: avatarColor.bg, borderColor: avatarColor.border },
                      ]}
                    >
                      <Text style={[styles.companyAvatarText, { color: avatarColor.text }]}>
                        {initials}
                      </Text>
                    </View>

                    <View style={styles.titleCol}>
                      <Text style={styles.clientName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.contactRow}>
                        <User size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
                        <Text style={styles.contactName} numberOfLines={1}>
                          {item.contactPerson}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <StatusBadge status={item.status} size="sm" />
                </View>

                {/* Scope & Location Metadata */}
                <View style={styles.scopeBox}>
                  <View style={styles.infoRow}>
                    <MapPin size={12} color={colors.textMuted} />
                    <Text style={styles.infoText}>{item.location}</Text>
                    <View style={styles.projectPill}>
                      <Layers size={10} color="#0D9488" style={{ marginRight: 2 }} />
                      <Text style={styles.projectPillText}>
                        {item.activeProjectsCount} {item.activeProjectsCount === 1 ? 'Project' : 'Projects'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Briefcase size={12} color={colors.textMuted} />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {item.service}
                    </Text>
                  </View>
                </View>

                {/* Footer: Portfolio Value, Owner Pill, and 360 Profile CTA */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.label}>BUSINESS</Text>
                    <Text style={styles.valText}>{formatINR(item.businessValue)}</Text>
                  </View>

                  <View style={styles.ownerBadge}>
                    <Text style={styles.ownerLabel}>Lead: </Text>
                    <Text style={styles.ownerVal} numberOfLines={1}>
                      {item.owner}
                    </Text>
                  </View>

                  <View style={styles.linkRow}>
                    <Text style={styles.linkText}>360° Profile</Text>
                    <ArrowRight size={13} color={colors.primary} />
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  metricItemActive: {
    backgroundColor: '#F0FDFA',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border.default,
  },
  searchBar: {
    marginBottom: spacing.xs,
  },
  filtersRow: {
    marginBottom: spacing.xs,
  },
  chipsScroll: {
    gap: 6,
    paddingVertical: 2,
    alignItems: 'center',
    paddingRight: spacing.xl,
  },
  filterGroupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    marginRight: 2,
  },
  chip: {
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  chipDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.borderMedium,
    marginHorizontal: 4,
  },
  listContent: {
    paddingBottom: spacing.huge,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 13,
    ...shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  companyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  companyAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleCol: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 19,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  contactName: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scopeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 9,
    gap: 5,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    flex: 1,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  projectPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  valText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
    maxWidth: '45%',
  },
  ownerLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  ownerVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
