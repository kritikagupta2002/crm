import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  ArrowRight,
  UserPlus,
  KanbanSquare,
  List,
  X,
  MessageCircle,
  XCircle,
  CheckCircle2,
  Calendar,
  Building,
  Briefcase,
  AlertTriangle,
  Inbox,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, Input, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency, normalisePhone, isValidIndianMobile, isValidEmail } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { Lead, LeadStage } from '../../types';

interface LeadsScreenProps {
  navigation: any;
}

const ALL_STAGES = ['All', 'New Enquiry', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const SERVICES = [
  'All',
  'Mineral Exploration & Resources',
  'Mineral Economics & Valuation',
  'Environment, Community & Permitting',
  'Mine Planning & Prefeasibility Study',
  'Hydrogeology & Groundwater',
  'Remote Sensing, GIS & Aerial Mapping',
  'Geotechnical Services',
];

const leadKeyExtractor = (item: Lead) => item.id;

const openDialer = (ph: string) => {
  Linking.openURL(`tel:+91${normalisePhone(ph)}`);
};

const openWhatsApp = (ph: string, name: string) => {
  const text = encodeURIComponent(`Hello ${name}, this is Bansal Geosurveys regarding your exploration enquiry.`);
  Linking.openURL(`whatsapp://send?phone=91${normalisePhone(ph)}&text=${text}`);
};

export const LeadsScreen: React.FC<LeadsScreenProps> = ({ navigation }) => {
  const { leads, addLead, updateLeadStage } = useCrm();

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedStageTab, setSelectedStageTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [losingLeadId, setLosingLeadId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState<string>('');

  const [clientType, setClientType] = useState<'Company' | 'Individual'>('Company');
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [service, setService] = useState('Mineral Exploration & Resources');
  const [serviceDetail, setServiceDetail] = useState('Resource Estimation');
  const [mineral, setMineral] = useState('Base Metals (Lead-Zinc)');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [assignedTo, setAssignedTo] = useState('Vikram Patel');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!company.trim()) errors.company = 'Company name is required';
    if (!contactName.trim()) errors.contactName = 'Contact person is required';
    const normPhone = normalisePhone(phone);
    if (!isValidIndianMobile(normPhone)) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (estimatedValue && Number(estimatedValue) <= 0) {
      errors.estimatedValue = 'Enter a positive amount';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateLead = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await addLead({
        title: `${company.trim()} - ${serviceDetail}`,
        company: company.trim(),
        contactName: contactName.trim(),
        contactPerson: contactName.trim(),
        clientType,
        phone: normalisePhone(phone),
        email: email.trim() || 'contact@client.com',
        location: location.trim() || 'Rajasthan',
        service,
        serviceDetail,
        mineral,
        priority,
        estimatedValue: Number(estimatedValue) || 1500000,
        stage: 'New Enquiry' as LeadStage,
        assignedTo,
        description: description.trim() || 'Exploration lead created via mobile app.',
        notes: description.trim() || 'Initial client intake created.',
      });

      setShowAddModal(false);
      resetForm();
      Alert.alert('Lead Created', 'New exploration lead has been registered.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompany('');
    setContactName('');
    setPhone('');
    setEmail('');
    setLocation('');
    setEstimatedValue('');
    setDescription('');
    setFormErrors({});
  };

  const handleMarkLost = useCallback(async () => {
    if (!losingLeadId) return;
    if (!lostReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason why this lead was lost.');
      return;
    }
    try {
      await updateLeadStage(losingLeadId, 'Lost', { lostReason: lostReason.trim() });
      setLosingLeadId(null);
      setLostReason('');
      Alert.alert('Lead Updated', 'Lead has been marked as Lost.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update lead.');
    }
  }, [losingLeadId, lostReason, updateLeadStage]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const stageMatch =
        selectedStageTab === 'All' ||
        l.stage === selectedStageTab ||
        (selectedStageTab === 'New Enquiry' && l.stage === 'New');

      const serviceMatch = selectedService === 'All' || l.service === selectedService;

      const q = searchQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        l.company.toLowerCase().includes(q) ||
        l.contactName?.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.phone.includes(q);

      return stageMatch && serviceMatch && searchMatch;
    });
  }, [leads, selectedStageTab, selectedService, searchQuery]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: leads.length };
    for (const l of leads) {
      const s = l.stage === 'New' ? 'New Enquiry' : l.stage;
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [leads]);

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Leads & Pipeline"
          subtitle={`${filteredLeads.length} leads in commercial funnel`}
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            <View style={styles.headerRightRow}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setViewMode(viewMode === 'list' ? 'board' : 'list')}
              >
                {viewMode === 'list' ? (
                  <KanbanSquare size={18} color={colors.primary} />
                ) : (
                  <List size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerAddBtn}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={18} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          }
        />
      }
    >
      <View style={styles.searchBarRow}>
        <Input
          placeholder="Search company, contact, phone, ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={16} color={colors.textMuted} />}
          containerStyle={styles.searchInput}
        />
        <TouchableOpacity
          style={[styles.filterBtn, selectedService !== 'All' ? styles.filterBtnActive : null]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={selectedService !== 'All' ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.stageTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageTabsContent}>
          {ALL_STAGES.map((s) => {
            const count = stageCounts[s] || 0;
            const isSelected = selectedStageTab === s;

            return (
              <TouchableOpacity
                key={s}
                activeOpacity={0.8}
                onPress={() => setSelectedStageTab(s)}
                style={[styles.stageChip, isSelected ? styles.stageChipSelected : null]}
              >
                <Text style={[styles.stageChipText, isSelected ? styles.stageChipTextSelected : null]}>
                  {s} <Text style={styles.stageCountBadge}>({count})</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={filteredLeads}
          keyExtractor={leadKeyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Inbox size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Leads Found</Text>
              <Text style={styles.emptySubtitle}>No matching enquiries for this filter.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card
              style={styles.leadCard}
              onPress={() => navigation.navigate('LeadDetail', { leadId: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.companyCol}>
                  <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
                  <Text style={styles.leadIdText}>{item.id} • {item.assignedTo}</Text>
                </View>
                <StatusBadge status={item.stage} size="sm" />
              </View>

              <Text style={styles.leadTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.serviceText}>{item.serviceDetail || item.service || 'Exploration Survey'}</Text>

              <View style={styles.contactBar}>
                <View style={styles.contactCol}>
                  <Text style={styles.contactPerson}>{item.contactPerson || item.contactName}</Text>
                  <Text style={styles.phoneText}>+91 {normalisePhone(item.phone)}</Text>
                </View>
                <View style={styles.contactActionButtons}>
                  <TouchableOpacity
                    style={styles.iconAction}
                    onPress={() => openDialer(item.phone)}
                  >
                    <Phone size={15} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconAction, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
                    onPress={() => openWhatsApp(item.phone, item.contactName)}
                  >
                    <MessageCircle size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.valLabel}>EST. VALUE</Text>
                  <Text style={styles.valAmount}>
                    {formatCurrency(item.quoteValue || item.estimatedValue)}
                  </Text>
                </View>

                <View style={styles.footerActions}>
                  {item.stage === 'Qualified' && (
                    <TouchableOpacity
                      style={styles.convertBtn}
                      onPress={() => navigation.navigate('LeadConversion', { leadId: item.id })}
                    >
                      <UserPlus size={14} color={colors.textInverse} />
                      <Text style={styles.convertBtnText}>Convert</Text>
                    </TouchableOpacity>
                  )}

                  {item.stage !== 'Won' && item.stage !== 'Lost' && (
                    <TouchableOpacity
                      style={styles.markLostBtn}
                      onPress={() => setLosingLeadId(item.id)}
                    >
                      <XCircle size={14} color={colors.danger} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => navigation.navigate('LeadDetail', { leadId: item.id })}
                  >
                    <Text style={styles.detailsBtnText}>Details</Text>
                    <ArrowRight size={13} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardScroll}>
          {ALL_STAGES.filter((s) => s !== 'All').map((stageName) => {
            const stageLeads = leads.filter(
              (l) => l.stage === stageName || (stageName === 'New Enquiry' && l.stage === 'New')
            );

            return (
              <View key={stageName} style={styles.boardColumn}>
                <View style={styles.boardColHeader}>
                  <Text style={styles.boardColTitle}>{stageName}</Text>
                  <View style={styles.boardCountBadge}>
                    <Text style={styles.boardCountText}>{stageLeads.length}</Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.boardColList}>
                  {stageLeads.map((item) => (
                    <Card
                      key={item.id}
                      style={styles.boardCard}
                      onPress={() => navigation.navigate('LeadDetail', { leadId: item.id })}
                    >
                      <Text style={styles.boardCardCompany} numberOfLines={1}>{item.company}</Text>
                      <Text style={styles.boardCardService} numberOfLines={1}>{item.serviceDetail || item.service}</Text>
                      <Text style={styles.boardCardVal}>{formatCurrency(item.quoteValue || item.estimatedValue)}</Text>
                      <Text style={styles.boardCardOwner}>{item.assignedTo}</Text>
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <Text style={styles.boardEmptyText}>No leads</Text>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={showFilterModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.filterModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Service</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {SERVICES.map((srv) => (
                <TouchableOpacity
                  key={srv}
                  style={[styles.serviceOption, selectedService === srv ? styles.serviceOptionActive : null]}
                  onPress={() => {
                    setSelectedService(srv);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[styles.serviceOptionText, selectedService === srv ? styles.serviceOptionTextActive : null]}>
                    {srv}
                  </Text>
                  {selectedService === srv && <CheckCircle2 size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddModal} animationType="slide">
        <ScreenContainer
          scrollable
          header={
            <AppHeader
              title="Add New Enquiry"
              subtitle="Register prospecting exploration lead"
              showBack
              onBack={() => setShowAddModal(false)}
            />
          }
        >
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Client Type</Text>
            <View style={styles.typeRow}>
              {(['Company', 'Individual'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, clientType === t ? styles.typeBtnActive : null]}
                  onPress={() => setClientType(t)}
                >
                  <Text style={[styles.typeBtnText, clientType === t ? styles.typeBtnTextActive : null]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={clientType === 'Company' ? 'Company Name *' : 'Client Name *'}
              placeholder="e.g. Hindustan Zinc Ltd"
              value={company}
              onChangeText={setCompany}
              error={formErrors.company}
            />

            <Input
              label="Contact Person *"
              placeholder="e.g. Rajesh Maloo"
              value={contactName}
              onChangeText={setContactName}
              error={formErrors.contactName}
            />

            <Input
              label="10-Digit Mobile Number *"
              placeholder="e.g. 9829011223"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              error={formErrors.phone}
            />

            <Input
              label="Email Address"
              placeholder="e.g. r.maloo@hzl.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={formErrors.email}
            />

            <Input
              label="Location / State"
              placeholder="e.g. Bhilwara, Rajasthan"
              value={location}
              onChangeText={setLocation}
            />

            <Input
              label="Mineral of Interest"
              placeholder="e.g. Base Metals, Copper, Gold, Iron Ore"
              value={mineral}
              onChangeText={setMineral}
            />

            <Input
              label="Estimated Value (₹)"
              placeholder="e.g. 4200000"
              value={estimatedValue}
              onChangeText={setEstimatedValue}
              keyboardType="numeric"
              error={formErrors.estimatedValue}
            />

            <Input
              label="Scope & Requirements"
              placeholder="Project description, core drilling depth, survey line-km..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Create Exploration Lead"
              size="lg"
              onPress={handleCreateLead}
              loading={isSubmitting}
              style={{ marginTop: spacing.md, marginBottom: spacing.huge }}
            />
          </View>
        </ScreenContainer>
      </Modal>

      <Modal visible={Boolean(losingLeadId)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.lostModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Lead as Lost</Text>
              <TouchableOpacity onPress={() => setLosingLeadId(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.lostModalDesc}>
              Please capture why this lead could not be converted (e.g. price higher than competitor, client postponed exploration, technical scope mismatch):
            </Text>

            <Input
              placeholder="Enter reason for losing this enquiry..."
              value={lostReason}
              onChangeText={setLostReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.lostActionRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setLosingLeadId(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Lost"
                variant="danger"
                size="sm"
                onPress={handleMarkLost}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBtn: {
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  headerAddBtn: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  stageTabsContainer: {
    marginVertical: spacing.xs,
  },
  stageTabsContent: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  stageChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stageChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stageChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  stageChipTextSelected: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  stageCountBadge: {
    fontSize: typography.fontSizes.xxs,
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  leadCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  companyCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  companyName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  leadIdText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 2,
  },
  leadTitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  serviceText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.sm,
  },
  contactBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  contactCol: {
    flex: 1,
  },
  contactPerson: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  phoneText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 2,
  },
  contactActionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  valLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.bold,
  },
  valAmount: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  convertBtnText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textInverse,
  },
  markLostBtn: {
    padding: 6,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  detailsBtnText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  boardScroll: {
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
  boardColumn: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  boardColHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  boardColTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  boardCountBadge: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  boardCountText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  boardColList: {
    maxHeight: 500,
  },
  boardCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  boardCardCompany: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  boardCardService: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
  },
  boardCardVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
  },
  boardCardOwner: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  boardEmptyText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  filterModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  serviceOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  serviceOptionText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  serviceOptionTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  formContainer: {
    paddingBottom: spacing.huge,
  },
  formLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  typeBtnText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  typeBtnTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  lostModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  lostModalDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  lostActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
