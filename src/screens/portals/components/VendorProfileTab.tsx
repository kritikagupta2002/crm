import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Building2,
  HardHat,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Landmark,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  LogOut,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { vendorTheme } from './vendorTheme';

interface VendorProfileTabProps {
  vendorName: string;
  vendorCode: string;
  currentVendor: any;
  onLogout: () => void;
  navigation: any;
}

export const VendorProfileTab: React.FC<VendorProfileTabProps> = ({
  vendorName,
  vendorCode,
  currentVendor,
  onLogout,
  navigation,
}) => {
  // Mask sensitive bank account number
  const rawAcct = currentVendor?.bank?.accountNo || currentVendor?.bankDetails?.accountNumber || '3844 1102 7781';
  const cleanAcct = rawAcct.replace(/\s+/g, '');
  const maskedAcct =
    cleanAcct.length > 4
      ? '•••• •••• •••• ' + cleanAcct.slice(-4)
      : '•••• •••• •••• 7781';

  // Vendor statutory documents
  const documents = [
    {
      id: 'doc-gst',
      name: 'GST_Registration_Certificate_REG06.pdf',
      type: 'Statutory GST',
      status: 'Verified',
      uploadedDate: '12 Jun 2024',
    },
    {
      id: 'doc-pan',
      name: 'PAN_Card_Corporate_Attested.pdf',
      type: 'Income Tax',
      status: 'Verified',
      uploadedDate: '12 Jun 2024',
    },
    {
      id: 'doc-msme',
      name: 'MSME_Udyam_Registration.pdf',
      type: 'MSME / Udyam',
      status: 'Verified',
      uploadedDate: '15 Jul 2024',
    },
    {
      id: 'doc-cheque',
      name: 'Bank_Cancelled_Cheque_Mandate.pdf',
      type: 'Bank Mandate',
      status: 'Verified',
      uploadedDate: '12 Jun 2024',
    },
    {
      id: 'doc-dgms',
      name: 'DGMS_Wireline_Safety_Compliance.pdf',
      type: 'Technical Safety',
      status: 'Active',
      uploadedDate: '20 Jan 2025',
    },
  ];

  const handleDownloadDoc = (docName: string) => {
    Alert.alert('Download Document', `Initiated secure download of ${docName}. File is attested.`);
  };

  return (
    <View style={styles.container}>
      {/* 1. VENDOR PROFILE HEADER CARD */}
      <View style={styles.headerCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarBox}>
            <HardHat size={32} color={vendorTheme.colors.navy} strokeWidth={2.4} />
          </View>
          <View style={styles.headerDetails}>
            <Text style={styles.vendorNameText}>{vendorName}</Text>
            <Text style={styles.vendorCodeText}>Vendor ID: {vendorCode}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.empanelledBadge}>
                <ShieldCheck size={14} color={vendorTheme.colors.tealDark} strokeWidth={2.4} />
                <Text style={styles.empanelledBadgeText}>
                  {currentVendor?.empanelledStatus || 'Empanelled Grade-A'}
                </Text>
              </View>
              <View style={styles.kycBadge}>
                <CheckCircle2 size={14} color={vendorTheme.colors.emerald} strokeWidth={2.4} />
                <Text style={styles.kycBadgeText}>KYC Attested</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 2. BUSINESS INFORMATION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Building2 size={18} color={vendorTheme.colors.navy} />
          <Text style={styles.sectionTitle}>Business Information</Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Operating Category</Text>
          <Text style={styles.fieldValue}>
            {currentVendor?.workCategory || currentVendor?.work || 'Core Drilling & Subcontracting'}
          </Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Entity Structure</Text>
          <Text style={styles.fieldValue}>Private Limited Company</Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>MSME / Udyam Reg.</Text>
          <Text style={styles.fieldValueMono}>
            {currentVendor?.msmeRegistrationNo || 'UDYAM-RJ-14-0012345'}
          </Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Operating Concession</Text>
          <Text style={styles.fieldValue}>Rajasthan & Central India</Text>
        </View>

        <View style={[styles.rowField, { borderBottomWidth: 0 }]}>
          <Text style={styles.fieldLabel}>Contractor Rating</Text>
          <View style={styles.ratingWrap}>
            <Text style={styles.ratingVal}>★ {currentVendor?.rating || '4.8'}</Text>
            <Text style={styles.ratingMuted}> / 5.0 (Top Tier)</Text>
          </View>
        </View>
      </View>

      {/* 3. CONTACT INFORMATION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <User size={18} color={vendorTheme.colors.navy} />
          <Text style={styles.sectionTitle}>Contact & Signatory</Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Authorized Person</Text>
          <Text style={styles.fieldValue}>
            {currentVendor?.contactPerson || currentVendor?.contact || 'Harish Mehta'}
          </Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Designation</Text>
          <Text style={styles.fieldValue}>Managing Director</Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Registered Mobile</Text>
          <Text style={styles.fieldValue}>
            +91 {currentVendor?.phone || '9811223344'}
          </Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Official Email</Text>
          <Text style={styles.fieldValue}>
            {currentVendor?.email || 'accounts@apexdrilling.in'}
          </Text>
        </View>

        <View style={[styles.rowField, { borderBottomWidth: 0 }]}>
          <Text style={styles.fieldLabel}>Registered Base</Text>
          <Text style={[styles.fieldValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
            {currentVendor?.address || 'Plot 45, Vishwakarma Industrial Area, Jaipur, Rajasthan 302013'}
          </Text>
        </View>
      </View>

      {/* 4. STATUTORY & TAX COMPLIANCE */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <ShieldCheck size={18} color={vendorTheme.colors.navy} />
          <Text style={styles.sectionTitle}>Tax & Statutory Compliance</Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Corporate PAN</Text>
          <Text style={styles.fieldValueMono}>
            {currentVendor?.pan || 'AAKFR4521M'}
          </Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>GSTIN (Active)</Text>
          <Text style={styles.fieldValueMono}>
            {currentVendor?.gstin || '08AAKFR4521M1Z3'}
          </Text>
        </View>

        <View style={[styles.rowField, { borderBottomWidth: 0 }]}>
          <Text style={styles.fieldLabel}>Income Tax Mandate</Text>
          <View style={styles.tdsPill}>
            <Text style={styles.tdsPillText}>Section 194C @ 2%</Text>
          </View>
        </View>
      </View>

      {/* 5. BANK ACCOUNT INFORMATION (MASKED) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Landmark size={18} color={vendorTheme.colors.navy} />
          <Text style={styles.sectionTitle}>Bank Account (Remittance)</Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Bank Name</Text>
          <Text style={styles.fieldValue}>
            {currentVendor?.bank?.name || currentVendor?.bankDetails?.bankName || 'State Bank of India'}
          </Text>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>Account Number</Text>
          <View style={styles.maskedAcctRow}>
            <Lock size={14} color={vendorTheme.colors.textMuted} />
            <Text style={styles.fieldValueMono}>{maskedAcct}</Text>
          </View>
        </View>

        <View style={styles.rowField}>
          <Text style={styles.fieldLabel}>IFSC Code</Text>
          <Text style={styles.fieldValueMono}>
            {currentVendor?.bank?.ifsc || currentVendor?.bankDetails?.ifscCode || 'SBIN0001124'}
          </Text>
        </View>

        <View style={[styles.rowField, { borderBottomWidth: 0 }]}>
          <Text style={styles.fieldLabel}>Remittance Mode</Text>
          <Text style={styles.fieldValue}>Direct Electronic RTGS / NEFT</Text>
        </View>
      </View>

      {/* 6. VENDOR STATUTORY DOCUMENTS */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FileText size={18} color={vendorTheme.colors.navy} />
          <Text style={styles.sectionTitle}>Attested Documents & Files</Text>
        </View>

        {documents.map((doc, idx) => (
          <View
            key={doc.id}
            style={[
              styles.docRow,
              idx === documents.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.docLeft}>
              <Text style={styles.docName} numberOfLines={1}>
                {doc.name}
              </Text>
              <Text style={styles.docMeta}>
                {doc.type} • Uploaded {doc.uploadedDate}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDownloadDoc(doc.name)}
              style={styles.docDownloadBtn}
            >
              <Download size={15} color={vendorTheme.colors.navy} />
              <Text style={styles.docDownloadText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* 7. APPLICATION TRACKING & REGISTRATION HELPER */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('VendorRegister')}
        style={styles.trackApplicationCard}
      >
        <View style={styles.trackIconWrap}>
          <ShieldCheck size={22} color="#0d9488" />
        </View>
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>Track Registration / Update Application</Text>
          <Text style={styles.trackSub}>
            Check status of new categories, empanelment renewals, or compliance amendments
          </Text>
        </View>
        <ChevronRight size={20} color={vendorTheme.colors.teal} />
      </TouchableOpacity>

      {/* 8. SIGN OUT ACTION */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onLogout}
        style={styles.signOutBtn}
      >
        <LogOut size={18} color={vendorTheme.colors.crimson} strokeWidth={2.4} />
        <Text style={styles.signOutText}>Sign Out of Vendor Portal</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  headerCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    marginBottom: 14,
    ...vendorTheme.shadows.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerDetails: {
    flex: 1,
  },
  vendorNameText: {
    fontSize: 18.5,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
    letterSpacing: -0.2,
  },
  vendorCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: vendorTheme.colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  empanelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.tealSubtle,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
    gap: 5,
  },
  empanelledBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: vendorTheme.colors.tealDark,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.emeraldSubtle,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 5,
  },
  kycBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: vendorTheme.colors.emerald,
  },
  sectionCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    marginBottom: 14,
    ...vendorTheme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: vendorTheme.colors.sandstoneBorder,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
    letterSpacing: 0.1,
  },
  rowField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: vendorTheme.colors.textMuted,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: vendorTheme.colors.graphite,
  },
  fieldValueMono: {
    fontSize: 13.5,
    fontWeight: '700',
    color: vendorTheme.colors.graphite,
    fontFamily: 'monospace',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingVal: {
    fontSize: 14,
    fontWeight: '800',
    color: vendorTheme.colors.amberDark,
  },
  ratingMuted: {
    fontSize: 12.5,
    fontWeight: '600',
    color: vendorTheme.colors.textMuted,
  },
  tdsPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tdsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: vendorTheme.colors.amberDark,
  },
  maskedAcctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docLeft: {
    flex: 1,
    marginRight: 12,
  },
  docName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: vendorTheme.colors.graphite,
  },
  docMeta: {
    fontSize: 11.5,
    color: vendorTheme.colors.textMuted,
    marginTop: 3,
  },
  docDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 5,
  },
  docDownloadText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: vendorTheme.colors.navy,
  },
  trackApplicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.tealSubtle,
    borderRadius: vendorTheme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 14,
    ...vendorTheme.shadows.sm,
  },
  trackIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.tealDark,
  },
  trackSub: {
    fontSize: 11.5,
    color: '#0f766e',
    marginTop: 2,
    lineHeight: 16,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    height: 48,
    borderRadius: vendorTheme.radius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  signOutText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: vendorTheme.colors.crimson,
  },
});
