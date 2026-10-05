import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
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
} from 'lucide-react-native';
import {
  ScreenContainer,
  AppHeader,
  Card,
  StatusBadge,
  Input,
  StatCard,
  EmptyState,
} from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
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

export const ClientsScreen: React.FC<ClientsScreenProps> = ({ navigation }) => {
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
        contactPerson: l.contactPerson,
        phone: l.phone,
        email: l.email,
        location: l.location || 'Rajasthan',
        service: l.serviceDetail || l.title,
        businessValue: l.quoteValue || l.estimatedValue || 0,
        owner: l.assignedTo || 'Senior Geologist',
        clientSince: l.wonOn || l.createdAt?.split('T')[0] || '2026-02-15',
        status: isComplete ? 'Active' : 'Onboarding',
        leadId: l.id,
        rawLead: l,
      });
    });

    clients.forEach((c) => {
      if (!list.some((it) => it.name.toLowerCase() === c.name.toLowerCase())) {
        list.push({
          id: c.id,
          name: c.name,
          contactPerson: 'Corporate Contact',
          phone: c.phone || '',
          email: c.email || '',
          location: c.state || 'Rajasthan',
          service: 'Core Exploration & Resource Estimation',
          businessValue: c.totalValue || 0,
          owner: 'Senior Geologist',
          clientSince: c.createdAt || '2026-01-10',
          status: c.contractStatus || 'Active',
          leadId: c.leadId || c.id,
          rawLead: null,
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
      c.service.toLowerCase().includes(q);

    const matchesState = selectedState === 'All' || c.location.includes(selectedState);
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;

    return matchesSearch && matchesState && matchesStatus;
  });

  return (
    <ScreenContainer
      scrollable={false}
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
      <View style={styles.kpiGrid}>
        <StatCard
          label="Total Clients"
          value={totalClients}
          subtext="Won commercial accounts"
          icon={<Building2 size={20} color={colors.info} />}
          tone="info"
        />
        <StatCard
          label="Active"
          value={activeCount}
          subtext="Onboarding complete"
          icon={<CheckCircle2 size={20} color={colors.success} />}
          tone="good"
        />
        <StatCard
          label="Onboarding"
          value={onboardingCount}
          subtext="Pending KYC & docs"
          icon={<UserPlus size={20} color={colors.warning} />}
          tone="attention"
        />
        <StatCard
          label="Total Business"
          value={formatINR(totalBusinessSum)}
          subtext="Before GST"
          icon={<IndianRupee size={20} color={colors.success} />}
          tone="good"
        />
      </View>

      <Input
        placeholder="Search client, contact person, location..."
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={16} color={colors.textMuted} />}
        containerStyle={styles.searchBar}
      />

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {(['All', 'Active', 'Onboarding'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, selectedStatus === st && styles.chipActive]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text style={[styles.chipText, selectedStatus === st && styles.chipTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.chipDivider} />

          {states.slice(0, 5).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, selectedState === st && styles.chipActive]}
              onPress={() => setSelectedState(st)}
            >
              <Text style={[styles.chipText, selectedState === st && styles.chipTextActive]}>
                {st === 'All' ? 'All Locations' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {visibleClients.length === 0 ? (
        <EmptyState
          title="No Clients Found"
          description="No client matches the active search query or filter selection."
          icon={<Building2 size={48} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={visibleClients}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() =>
                navigation.navigate('ClientDetail', {
                  clientId: item.id,
                  clientName: item.name,
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleCol}>
                  <Text style={styles.clientName}>{item.name}</Text>
                  <Text style={styles.contactName}>{item.contactPerson}</Text>
                </View>
                <StatusBadge status={item.status} size="sm" />
              </View>

              <View style={styles.infoRow}>
                <MapPin size={14} color={colors.textMuted} />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>

              <View style={styles.infoRow}>
                <Briefcase size={14} color={colors.textMuted} />
                <Text style={styles.infoText} numberOfLines={1}>{item.service}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.label}>Business Value</Text>
                  <Text style={styles.valText}>{formatINR(item.businessValue)}</Text>
                </View>

                <View style={styles.rightCol}>
                  <Text style={styles.ownerText}>Owner: {item.owner}</Text>
                  <View style={styles.linkRow}>
                    <Text style={styles.linkText}>360° Profile</Text>
                    <ArrowRight size={14} color={colors.primary} />
                  </View>
                </View>
              </View>
            </Card>
          )}
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
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
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  chipDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.borderMedium,
    marginHorizontal: 4,
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  clientName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  contactName: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  valText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  ownerText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
});
