import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import {
  Building2,
  Star,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Landmark,
  Briefcase,
  Eye,
  EyeOff,
  Calendar,
  Layers,
  Percent,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';

interface VendorDetailScreenProps {
  route: { params: { vendorId: string } };
  navigation: any;
}

export const VendorDetailScreen: React.FC<VendorDetailScreenProps> = ({ route, navigation }) => {
  const { vendors, workOrders, tenders } = useCrm();
  const vendorId = route?.params?.vendorId || vendors[0]?.id;
  const { role, can } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'banking'>('profile');
  const [showFullBank, setShowFullBank] = useState<boolean>(false);

  const vendor = vendors.find((v) => v.id === vendorId);

  const isFinanceOfficer = (role as any) === 'accountant' || (role as any) === 'director' || (role as any) === 'admin';
  const isAuthorizedManager = (role as any) === 'director' || (role as any) === 'tender_manager' || (role as any) === 'admin';

  const vendorWorkOrders = useMemo(() => {
    if (!vendor) return [];
    return workOrders.filter(
      (wo) => wo.vendorId === vendor.id || wo.vendor === vendor.name || wo.vendorName === vendor.name
    );
  }, [vendor, workOrders]);

  const vendorTenders = useMemo(() => {
    if (!vendor) return [];
    return tenders.filter((t) =>
      t.sealedBids.some((b) => b.vendorId === vendor.id && b.status !== 'Withdrawn')
    );
  }, [vendor, tenders]);

  if (!vendor) {
    return (
      <ScreenContainer
        scrollable={false}
        header={
          <AppHeader
            title="Vendor Profile"
            showBack
            onBack={() => navigation.goBack()}
          />
        }
      >
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundText}>Vendor not found or enrolled under a different ID.</Text>
          <Button title="Back to Vendors" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  const totalContract = vendorWorkOrders.reduce((sum, wo) => sum + (wo.contractValue || wo.amount || 0), 0);
  const totalBilled = vendorWorkOrders.reduce((sum, wo) => sum + (wo.billedAmount || 0), 0);
  const totalPaid = vendorWorkOrders.reduce((sum, wo) => sum + (wo.paidAmount || 0), 0);
  const totalDue = totalBilled - totalPaid;

  const contactName = vendor.contact || vendor.contactPerson || 'Point of Contact';
  const location = vendor.place || (vendor.address ? `${vendor.address.city}, ${vendor.address.state}` : 'Rajasthan, India');
  const tdsSection = typeof vendor.tds === 'object' ? vendor.tds.section : '194C';
  const tdsRate = typeof vendor.tds === 'object' ? vendor.tds.rate : typeof vendor.tds === 'number' ? vendor.tds : 0.02;

  const handleCall = () => {
    if (vendor.phone) Linking.openURL(`tel:${vendor.phone}`);
  };

  const handleEmail = () => {
    if (vendor.email) Linking.openURL(`mailto:${vendor.email}`);
  };

  const maskAccountNo = (acc: string) => {
    if (!acc) return 'Not Provided';
    if (showFullBank && isFinanceOfficer) return acc;
    return `•••• •••• ${acc.slice(-4)}`;
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title={vendor.name}
          subtitle={`Vendor Register ID: ${vendor.id || vendor.vendorCode}`}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card style={styles.profileCard}>
        <View style={styles.topRow}>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{vendor.id || vendor.vendorCode}</Text>
            {vendor.msme && (
              <View style={styles.msmeChip}>
                <Text style={styles.msmeChipText}>MSME {vendor.msme}</Text>
              </View>
            )}
          </View>
          <StatusBadge
            status={vendor.empanelledStatus || 'Active'}
            size="small"
          />
        </View>

        <Text style={styles.vendorTitle}>{vendor.name}</Text>
        <Text style={styles.workDescription}>{vendor.work || vendor.category || 'Specialized Subcontractor'}</Text>

        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textMuted} />
          <Text style={styles.locationText}>{location}</Text>
          {vendor.since && (
            <>
              <Text style={styles.bullet}>•</Text>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={styles.locationText}>Enrolled {vendor.since}</Text>
            </>
          )}
        </View>

        <View style={styles.commRow}>
          <TouchableOpacity style={styles.commBtn} onPress={handleCall}>
            <Phone size={16} color={colors.primary} />
            <Text style={styles.commBtnText}>{vendor.phone || 'Call'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.commBtn} onPress={handleEmail}>
            <Mail size={16} color={colors.primary} />
            <Text style={styles.commBtnText} numberOfLines={1}>
              {vendor.email || 'Email'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
            Profile & Scope
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'banking' && styles.tabBtnActive]}
          onPress={() => setActiveTab('banking')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'banking' && styles.tabBtnTextActive]}>
            Compliance & Bank
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'orders' && styles.tabBtnTextActive]}>
            Subcontracts ({vendorWorkOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'profile' && (
        <>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Financial Exposure & Orders</Text>
            <View style={styles.statGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Contract Ceiling</Text>
                <Text style={styles.statVal}>{formatCurrency(totalContract)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Billed To Date</Text>
                <Text style={styles.statVal}>{formatCurrency(totalBilled)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Disbursed Paid</Text>
                <Text style={[styles.statVal, { color: colors.success }]}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Pending Payables</Text>
                <Text style={[styles.statVal, { color: totalDue > 0 ? colors.warning : colors.textPrimary }]}>
                  {formatCurrency(totalDue)}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Key Contact & Operations</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Primary Point of Contact</Text>
              <Text style={styles.infoValue}>{contactName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{vendor.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email ID</Text>
              <Text style={styles.infoValue}>{vendor.email}</Text>
            </View>
            {vendor.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Operating Office</Text>
                <Text style={styles.infoValue}>
                  {vendor.address.line}, {vendor.address.city}, {vendor.address.state} - {vendor.address.pincode}
                </Text>
              </View>
            )}
          </Card>
        </>
      )}

      {activeTab === 'banking' && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tax & Statutory Compliance</Text>

          <View style={styles.complianceBox}>
            <View style={styles.compRow}>
              <Text style={styles.compLabel}>GSTIN REGISTRATION</Text>
              <Text style={styles.compValue}>{vendor.gstin || 'Unregistered / Exempt'}</Text>
            </View>
            <View style={styles.compRow}>
              <Text style={styles.compLabel}>PERMANENT ACCOUNT NUMBER (PAN)</Text>
              <Text style={styles.compValue}>{vendor.pan || 'Not On File'}</Text>
            </View>
            <View style={styles.compRow}>
              <Text style={styles.compLabel}>TDS WITHHOLDING CATEGORY</Text>
              <Text style={styles.compValue}>
                Section {tdsSection} @ {(tdsRate * 100).toFixed(1)}%
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Bank Settlement Account</Text>

          {vendor.bank ? (
            <View style={styles.bankCard}>
              <View style={styles.bankHeader}>
                <Landmark size={20} color={colors.primary} />
                <Text style={styles.bankName}>{vendor.bank.name || 'Core Commercial Bank'}</Text>
              </View>

              <View style={styles.compRow}>
                <Text style={styles.compLabel}>ACCOUNT NUMBER</Text>
                <View style={styles.accountMaskRow}>
                  <Text style={styles.compValue}>{maskAccountNo(vendor.bank.accountNo)}</Text>
                  {isFinanceOfficer && (
                    <TouchableOpacity
                      onPress={() => setShowFullBank(!showFullBank)}
                      style={styles.eyeBtn}
                    >
                      {showFullBank ? (
                        <EyeOff size={16} color={colors.primary} />
                      ) : (
                        <Eye size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.compRow}>
                <Text style={styles.compLabel}>IFSC ROUTING CODE</Text>
                <Text style={styles.compValue}>{vendor.bank.ifsc}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.mutedNote}>No bank records configured for electronic disbursement.</Text>
          )}
        </Card>
      )}

      {activeTab === 'orders' && (
        <View style={styles.ordersTab}>
          {vendorWorkOrders.length === 0 ? (
            <Card style={styles.sectionCard}>
              <Text style={styles.mutedNote}>
                No subcontract work orders awarded to this contractor yet.
              </Text>
              {isAuthorizedManager && (
                <Button
                  title="View Open Tenders"
                  variant="outline"
                  size="small"
                  style={{ marginTop: spacing.sm }}
                  onPress={() => navigation.navigate('Tenders')}
                />
              )}
            </Card>
          ) : (
            vendorWorkOrders.map((wo) => (
              <TouchableOpacity
                key={wo.id}
                style={styles.woCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('WorkOrderDetail', { woId: wo.id })}
              >
                <View style={styles.woTop}>
                  <Text style={styles.woNumber}>{wo.woNumber}</Text>
                  <StatusBadge status={wo.currentStage} size="small" />
                </View>
                <Text style={styles.woTitle}>{wo.projectTitle}</Text>
                <Text style={styles.woScope} numberOfLines={2}>
                  {wo.work || 'Geological Exploration Subcontract'}
                </Text>

                <View style={styles.woFinRow}>
                  <View>
                    <Text style={styles.woFinLabel}>Contract Value</Text>
                    <Text style={styles.woFinVal}>{formatCurrency(wo.contractValue || wo.amount || 0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.woFinLabel}>Paid Amount</Text>
                    <Text style={[styles.woFinVal, { color: colors.success }]}>
                      {formatCurrency(wo.paidAmount || 0)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  profileCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0d9488',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  msmeChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  msmeChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  vendorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  workDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  bullet: {
    fontSize: 13,
    color: '#94a3b8',
    marginHorizontal: 4,
  },
  commRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  commBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdfa',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  commBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f766e',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabBtnActive: {
    backgroundColor: '#0d9488',
  },
  tabBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  sectionCard: {
    padding: 16,
    marginBottom: spacing.sm,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 13.5,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  complianceBox: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    padding: 14,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  compRow: {
    paddingVertical: 5,
  },
  compLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 3,
  },
  compValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  bankCard: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    padding: 16,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  accountMaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyeBtn: {
    padding: 4,
  },
  mutedNote: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  ordersTab: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  woCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  woTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  woNumber: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  woTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  woScope: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  woFinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  woFinLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  woFinVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
});
