import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {
  User,
  ShieldCheck,
  Headphones,
  Phone,
  PlusCircle,
  Lock,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { Project } from '../../../types';

interface ClientProfileTabProps {
  clientId: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  enquiryId: string;
  gstin: string;
  pan: string;
  address: string;
  projects: Project[];
  totalContractValue: number;
  totalPaidAmount: number;
  totalOutstanding: number;
  onLogout: () => void;
  onNavigateToEnquiry?: () => void;
}

export function ClientProfileTab({
  clientId,
  companyName,
  contactPerson,
  mobile,
  email,
  enquiryId,
  gstin,
  pan,
  address,
  projects,
  totalContractValue,
  totalPaidAmount,
  totalOutstanding,
  onLogout,
  onNavigateToEnquiry,
}: ClientProfileTabProps) {
  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out of Client Portal',
      'Are you sure you want to terminate this executive client session? You will need your Enquiry ID and registered mobile number to sign in again.',
      [
        { text: 'Stay Signed In', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const handleCallSupport = () => {
    Alert.alert(
      'Bansal Geo Key Account Liaison',
      'Contact your dedicated exploration relationship manager:\n\nPhone: +91 98201 12233\nEmail: client.desk@bansalgeo.com\nDesk Hours: Mon - Sat 08:00 - 20:00 IST',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Desk',
          onPress: () => Linking.openURL('tel:+919820112233').catch(() => {}),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Executive Corporate Identity Card */}
      <View style={styles.identityCard}>
        <View style={styles.identityTopRow}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {companyName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.identityTextWrap}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active Client Account</Text>
            </View>
            <Text style={styles.companyName} numberOfLines={2}>
              {companyName}
            </Text>
            <Text style={styles.clientCode}>
              Client ID: {clientId.toUpperCase()} • Enquiry #{enquiryId}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.identityStatsRow}>
          <View style={styles.identityStatItem}>
            <Text style={styles.identityStatLabel}>Projects</Text>
            <Text style={styles.identityStatValue}>{projects.length}</Text>
          </View>
          <View style={styles.statVerticalDivider} />
          <View style={styles.identityStatItem}>
            <Text style={styles.identityStatLabel}>Contract Volume</Text>
            <Text style={styles.identityStatValue}>
              ₹{(totalContractValue / 100000).toFixed(1)}L
            </Text>
          </View>
          <View style={styles.statVerticalDivider} />
          <View style={styles.identityStatItem}>
            <Text style={styles.identityStatLabel}>Outstanding</Text>
            <Text
              style={[
                styles.identityStatValue,
                { color: totalOutstanding > 0 ? clientTheme.colors.crimson : clientTheme.colors.emerald },
              ]}
            >
              ₹{(totalOutstanding / 1000).toFixed(0)}K
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Primary Executive Contact */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <User size={22} color={clientTheme.colors.navy} />
          <Text style={styles.sectionTitle}>Authorized Representative</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contact Person</Text>
          <Text style={styles.infoValue}>{contactPerson}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Registered Mobile</Text>
          <Text style={styles.infoValue}>+91 {mobile}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Official Email</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>
      </View>

      {/* 3. Statutory & Mining Compliance Profile */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <ShieldCheck size={22} color={clientTheme.colors.navy} />
          <Text style={styles.sectionTitle}>Statutory & Tax Identity</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>GSTIN</Text>
          <Text style={[styles.infoValue, styles.monoText]}>{gstin}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>PAN</Text>
          <Text style={[styles.infoValue, styles.monoText]}>{pan}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Registered Mining Facility / Address</Text>
          <Text style={styles.addressValue}>{address}</Text>
        </View>
      </View>

      {/* 4. Dedicated Bansal Geo Liaison */}
      <View style={styles.liaisonCard}>
        <View style={styles.liaisonHeader}>
          <View style={styles.liaisonIconWrap}>
            <Headphones size={24} color={clientTheme.colors.teal} />
          </View>
          <View style={styles.liaisonTextWrap}>
            <Text style={styles.liaisonTitle}>Bansal Geo Account Desk</Text>
            <Text style={styles.liaisonSubtitle}>Dedicated Mining & Exploration Liaison</Text>
          </View>
        </View>
        <Text style={styles.liaisonDesc}>
          Have queries about core drilling status, geophysical assays, or need to request additional borehole footage?
        </Text>
        <TouchableOpacity style={styles.liaisonBtn} activeOpacity={0.85} onPress={handleCallSupport}>
          <Phone size={18} color={clientTheme.colors.surface} />
          <Text style={styles.liaisonBtnText}>Contact Project Liaison Desk</Text>
        </TouchableOpacity>
      </View>

      {/* 5. New Exploration Scope / Enquiry Link */}
      {onNavigateToEnquiry && (
        <TouchableOpacity
          style={styles.enquiryCard}
          activeOpacity={0.85}
          onPress={onNavigateToEnquiry}
        >
          <View style={styles.enquiryLeft}>
            <View style={styles.enquiryIconWrap}>
              <PlusCircle size={24} color={clientTheme.colors.gold} />
            </View>
            <View>
              <Text style={styles.enquiryTitle}>New Exploration Scope?</Text>
              <Text style={styles.enquirySubtitle}>Submit a new drilling or geophysical enquiry</Text>
            </View>
          </View>
          <ChevronRight size={20} color={clientTheme.colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* 6. Security & Data Isolation Notice */}
      <View style={styles.securityBox}>
        <Lock size={18} color={clientTheme.colors.teal} />
        <Text style={styles.securityText}>
          Enterprise Isolation: Your project data, borehole coordinates, and financial vouchers are strictly isolated and protected under corporate non-disclosure.
        </Text>
      </View>

      {/* 7. Sign Out Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.85}
        onPress={handleConfirmLogout}
      >
        <LogOut size={20} color={clientTheme.colors.crimson} />
        <Text style={styles.logoutBtnText}>Sign Out of Client Portal</Text>
      </TouchableOpacity>

      <Text style={styles.versionFooter}>
        Bansal Geo Mobile Client Portal • v2.6.0 • ISO 9001:2015
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: clientTheme.colors.sandstone,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  identityCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: clientTheme.colors.surface,
    letterSpacing: 1,
  },
  identityTextWrap: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: clientTheme.colors.emeraldSubtle,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: clientTheme.radius.full,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: clientTheme.colors.emerald,
  },
  statusText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '700',
    color: clientTheme.colors.emeraldDark,
  },
  companyName: {
    fontSize: clientTheme.typography.titleLg,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    lineHeight: 24,
  },
  clientCode: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: clientTheme.colors.sandstoneBorder,
    marginVertical: 14,
  },
  identityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identityStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  identityStatLabel: {
    fontSize: 12,
    color: clientTheme.colors.textMuted,
    fontWeight: '600',
  },
  identityStatValue: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    marginTop: 2,
  },
  statVerticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: clientTheme.colors.sandstoneBorder,
  },
  sectionCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: clientTheme.colors.sandstoneBorder,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoCol: {
    paddingVertical: 2,
    gap: 4,
  },
  infoLabel: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '700',
    color: clientTheme.colors.textPrimary,
  },
  monoText: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  liaisonCard: {
    backgroundColor: clientTheme.colors.tealSubtle,
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#99f6e4',
    gap: 12,
  },
  liaisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liaisonIconWrap: {
    width: 44,
    height: 44,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liaisonTextWrap: {
    flex: 1,
  },
  liaisonTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.tealDark,
  },
  liaisonSubtitle: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.tealDark,
    fontWeight: '500',
  },
  liaisonDesc: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    lineHeight: 20,
  },
  liaisonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: clientTheme.colors.teal,
    height: 48,
    borderRadius: clientTheme.radius.md,
  },
  liaisonBtnText: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '700',
    color: clientTheme.colors.surface,
  },
  enquiryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
  },
  enquiryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  enquiryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enquiryTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  enquirySubtitle: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    marginTop: 2,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: clientTheme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  securityText: {
    flex: 1,
    fontSize: clientTheme.typography.badge,
    color: clientTheme.colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.crimsonSubtle,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginTop: 8,
  },
  logoutBtnText: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '700',
    color: clientTheme.colors.crimson,
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: clientTheme.typography.badge,
    color: clientTheme.colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
});
