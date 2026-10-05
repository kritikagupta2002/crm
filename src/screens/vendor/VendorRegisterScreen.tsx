import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  Search,
  Check,
  Briefcase,
  Landmark,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { isValidPan, isValidGstin } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import {
  WORK_CATEGORIES,
  COMPANY_TYPES,
  LEGAL_STATUS,
  PREFERENCE_CATEGORIES,
  STATES,
} from '../../constants/vendor';

interface VendorRegisterScreenProps {
  navigation: any;
}

export const VendorRegisterScreen: React.FC<VendorRegisterScreenProps> = ({ navigation }) => {
  const { submitVendorApplication, vendorApplications } = useCrm();

  const [mode, setMode] = useState<'register' | 'track'>('register');
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successAppId, setSuccessAppId] = useState<string | null>(null);

  const [trackId, setTrackId] = useState('');
  const [trackMobile, setTrackMobile] = useState('');
  const [trackedApp, setTrackedApp] = useState<any | null>(null);
  const [trackError, setTrackError] = useState('');

  const [firmName, setFirmName] = useState('');
  const [companyType, setCompanyType] = useState('Private Limited');
  const [regNo, setRegNo] = useState('');
  const [yearOfInc, setYearOfInc] = useState(new Date().getFullYear().toString());
  const [legalStatus, setLegalStatus] = useState('Active');
  const [preferential, setPreferential] = useState(false);
  const [preferenceCategory, setPreferenceCategory] = useState('Micro & Small Enterprise (MSE)');
  const [preferenceNo, setPreferenceNo] = useState('');

  const [contactTitle, setContactTitle] = useState('Mr.');
  const [contactName, setContactName] = useState('');
  const [contactDesignation, setContactDesignation] = useState('Managing Director');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Rajasthan');
  const [pincode, setPincode] = useState('');

  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Diamond Core Drilling (Surface / Underground)']);
  const [experienceYears, setExperienceYears] = useState('5');
  const [turnover, setTurnover] = useState('25000000');

  const [pan, setPan] = useState('');
  const [gstRegistered, setGstRegistered] = useState(true);
  const [gstin, setGstin] = useState('');

  const [bankName, setBankName] = useState('State Bank of India');
  const [branch, setBranch] = useState('Commercial Branch, Jaipur');
  const [accountNo, setAccountNo] = useState('');
  const [confirmAccountNo, setConfirmAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [attachedDocs, setAttachedDocs] = useState<Array<{ id: string; kind: string; name: string; size: number }>>([
    { id: 'doc-1', kind: 'PAN Card Copy', name: 'PAN_Card_Attested.pdf', size: 1200000 },
    { id: 'doc-2', kind: 'GST Registration Certificate', name: 'GST_Certificate_Form_REG06.pdf', size: 1400000 },
    { id: 'doc-3', kind: 'Cancelled Cheque', name: 'Cancelled_Cheque_Leaf.pdf', size: 900000 },
  ]);

  const [declaration, setDeclaration] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        Alert.alert('Selection Required', 'At least one work category must remain selected.');
        return;
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleNextStep = () => {
    setErrors([]);
    if (step === 1) {
      if (!firmName.trim()) {
        setErrors(['Company / Firm Legal Name is required.']);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!contactName.trim() || !contactMobile.trim() || !contactEmail.trim()) {
        setErrors(['Contact name, 10-digit mobile number, and email are required.']);
        return;
      }
      if (contactMobile.replace(/[^0-9]/g, '').length < 10) {
        setErrors(['Please enter a valid 10-digit mobile number.']);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!addressLine.trim() || !city.trim() || !pincode.trim()) {
        setErrors(['Address line, city, and 6-digit pincode are required.']);
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (selectedCategories.length === 0) {
        setErrors(['Select at least one work category of specialization.']);
        return;
      }
      setStep(5);
    } else if (step === 5) {
      const cleanPan = pan.trim().toUpperCase();
      if (!cleanPan || !isValidPan(cleanPan)) {
        setErrors(['Enter a valid 10-character alphanumeric PAN (e.g. ABCDE1234F).']);
        return;
      }
      if (gstRegistered) {
        const cleanGst = gstin.trim().toUpperCase();
        if (!cleanGst || !isValidGstin(cleanGst)) {
          setErrors(['Enter a valid 15-character GSTIN (e.g. 08ABCDE1234F1Z5).']);
          return;
        }
      }
      setStep(6);
    } else if (step === 6) {
      if (!accountNo.trim() || accountNo !== confirmAccountNo) {
        setErrors(['Account numbers do not match or are empty.']);
        return;
      }
      const cleanIfsc = ifsc.trim().toUpperCase();
      if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        setErrors(['Enter a valid 11-character bank IFSC code (e.g. SBIN0001234).']);
        return;
      }
      setStep(7);
    }
  };

  const handleFinalSubmit = async () => {
    if (!declaration) {
      Alert.alert('Statutory Declaration', 'Please accept the declaration stating all submitted details are true and authentic.');
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationPayload = {
        firm: {
          name: firmName.trim(),
          companyType,
          regNo: regNo.trim() || 'REG-' + Date.now().toString().slice(-6),
          partners: contactName,
          year: yearOfInc,
          nature: 'Subcontractor / Laboratory',
          legalStatus,
          category: selectedCategories[0],
          preferential,
          preference: preferential ? preferenceCategory : undefined,
          preferenceNo: preferential ? preferenceNo : undefined,
        },
        work: {
          categories: selectedCategories,
          areas: city + ', ' + state,
          experience: `${experienceYears} years in mining/geological contracts`,
          accreditation: 'Statutory Registered',
          turnover: `₹${(Number(turnover) / 100000).toFixed(1)} Lakhs`,
        },
        address: {
          line: addressLine.trim(),
          city: city.trim(),
          state,
          pincode: pincode.trim(),
        },
        contact: {
          title: contactTitle,
          name: contactName.trim(),
          designation: contactDesignation,
          mobile: contactMobile.replace(/[^0-9]/g, '').slice(-10),
          email: contactEmail.trim().toLowerCase(),
        },
        tax: {
          pan: pan.trim().toUpperCase(),
          gstRegistered,
          gstin: gstRegistered ? gstin.trim().toUpperCase() : '',
          composition: false,
          msmeRegistered: preferential,
          msmeUdyam: preferenceNo,
        },
        bank: {
          holder: firmName.trim(),
          bank: bankName.trim(),
          branch: branch.trim(),
          accountNo: accountNo.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          type: 'Current',
        },
        documents: attachedDocs,
      };

      const newApp = await submitVendorApplication(applicationPayload);
      setSuccessAppId(newApp.id);
    } catch (e: any) {
      Alert.alert('Registration Error', e.message || 'Unable to submit vendor application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSearch = () => {
    setTrackError('');
    setTrackedApp(null);
    if (!trackId.trim() || !trackMobile.trim()) {
      setTrackError('Please enter both Application Number and Mobile Number.');
      return;
    }
    const cleanNo = trackId.trim().toUpperCase();
    const cleanMob = trackMobile.replace(/[^0-9]/g, '').slice(-10);

    const found = vendorApplications.find(
      (a) =>
        a.id.toUpperCase() === cleanNo &&
        a.contact.mobile.replace(/[^0-9]/g, '').slice(-10) === cleanMob
    );

    if (found) {
      setTrackedApp(found);
    } else {
      setTrackError(`No application found for ID "${cleanNo}" and mobile ending with ...${cleanMob.slice(-4)}.`);
    }
  };

  if (successAppId) {
    return (
      <ScreenContainer
        scrollable
        header={<AppHeader title="Registration Submitted" showBack onBack={() => navigation.goBack()} />}
      >
        <Card style={styles.successCard}>
          <CheckCircle2 size={54} color={colors.success} style={{ alignSelf: 'center', marginBottom: spacing.md }} />
          <Text style={styles.successTitle}>Application Enrolled Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your vendor application has been logged into the compliance review register.
          </Text>

          <View style={styles.appNumberBox}>
            <Text style={styles.appNumberLabel}>Application Reference Number</Text>
            <Text style={styles.appNumberVal}>{successAppId}</Text>
          </View>

          <Text style={styles.successInstruction}>
            Our Procurement Committee will inspect your PAN, GSTIN, and Bank credentials. You can track this application anytime using your reference ID and registered mobile number.
          </Text>

          <Button
            title="Track Status Now"
            variant="primary"
            style={{ marginBottom: spacing.sm }}
            onPress={() => {
              setTrackId(successAppId);
              setTrackMobile(contactMobile);
              setSuccessAppId(null);
              setMode('track');
              handleTrackSearch();
            }}
          />

          <Button
            title="Return to Vendor Workspace"
            variant="outline"
            onPress={() => navigation.navigate('VendorWorkspaceHome')}
          />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="Vendor Onboarding"
          subtitle="Empanellment & Statutory Registration Wizard"
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
          onPress={() => setMode('register')}
        >
          <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>
            New Registration
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, mode === 'track' && styles.modeBtnActive]}
          onPress={() => setMode('track')}
        >
          <Text style={[styles.modeBtnText, mode === 'track' && styles.modeBtnTextActive]}>
            Track Application
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'track' ? (
        <View style={styles.trackSection}>
          <Card style={styles.card}>
            <Text style={styles.sectionHeading}>Application Status Tracker</Text>
            <Text style={styles.sectionSub}>
              Enter your assigned Application ID (e.g. VR-2026-012) and 10-digit mobile number.
            </Text>

            <Text style={styles.fieldLabel}>APPLICATION NUMBER</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. VR-2026-012"
              placeholderTextColor={colors.textMuted}
              value={trackId}
              onChangeText={setTrackId}
              autoCapitalize="characters"
            />

            <Text style={styles.fieldLabel}>REGISTERED MOBILE NUMBER</Text>
            <TextInput
              style={styles.textInput}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={trackMobile}
              onChangeText={setTrackMobile}
              maxLength={10}
            />

            {trackError ? <Text style={styles.errorText}>{trackError}</Text> : null}

            <Button
              title="Search Application"
              variant="primary"
              style={{ marginTop: spacing.md }}
              onPress={handleTrackSearch}
            />
          </Card>

          {trackedApp && (
            <Card style={styles.card}>
              <View style={styles.trackHeader}>
                <View>
                  <Text style={styles.trackAppId}>{trackedApp.id}</Text>
                  <Text style={styles.trackFirmName}>{trackedApp.firm.name}</Text>
                </View>
                <StatusBadge status={trackedApp.status} size="medium" />
              </View>

              <View style={styles.trackInfoRow}>
                <Text style={styles.trackInfoLabel}>Submitted On:</Text>
                <Text style={styles.trackInfoVal}>{trackedApp.submittedAt?.slice(0, 10)}</Text>
              </View>

              <View style={styles.trackInfoRow}>
                <Text style={styles.trackInfoLabel}>Specialization:</Text>
                <Text style={styles.trackInfoVal}>{trackedApp.work.categories.join(', ')}</Text>
              </View>

              {trackedApp.vendorId && (
                <View style={styles.enrolledBox}>
                  <CheckCircle2 size={20} color={colors.success} />
                  <View style={{ marginLeft: spacing.xs }}>
                    <Text style={styles.enrolledLabel}>Empanelled Vendor ID</Text>
                    <Text style={styles.enrolledVal}>{trackedApp.vendorId}</Text>
                  </View>
                </View>
              )}

              {trackedApp.note && (
                <View style={styles.noteBox}>
                  <AlertCircle size={18} color={colors.warning} />
                  <Text style={styles.noteText}>{trackedApp.note}</Text>
                </View>
              )}

              {trackedApp.reason && (
                <View style={[styles.noteBox, { backgroundColor: colors.dangerBg }]}>
                  <AlertCircle size={18} color={colors.danger} />
                  <Text style={[styles.noteText, { color: colors.dangerText }]}>{trackedApp.reason}</Text>
                </View>
              )}
            </Card>
          )}
        </View>
      ) : (
        <View style={styles.wizardSection}>
          <View style={styles.stepperWrap}>
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <View key={s} style={styles.stepIndicatorCol}>
                <View
                  style={[
                    styles.stepCircle,
                    s === step && styles.stepCircleActive,
                    s < step && styles.stepCircleDone,
                  ]}
                >
                  {s < step ? (
                    <Check size={14} color={colors.surface} />
                  ) : (
                    <Text style={[styles.stepNum, s === step && styles.stepNumActive]}>{s}</Text>
                  )}
                </View>
                <Text style={styles.stepTitle}>
                  {s === 1
                    ? 'Firm'
                    : s === 2
                    ? 'Contact'
                    : s === 3
                    ? 'Address'
                    : s === 4
                    ? 'Work'
                    : s === 5
                    ? 'Tax'
                    : s === 6
                    ? 'Bank'
                    : 'Review'}
                </Text>
              </View>
            ))}
          </View>

          {errors.length > 0 && (
            <View style={styles.errorBanner}>
              {errors.map((err, i) => (
                <Text key={i} style={styles.errorBannerText}>
                  • {err}
                </Text>
              ))}
            </View>
          )}

          {step === 1 && (
            <Card style={styles.card}>
              <Text style={styles.stepHeading}>Step 1: Legal Entity & Enterprise</Text>

              <Text style={styles.fieldLabel}>LEGAL ENTITY / FIRM NAME *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Apex Core Drilling Pvt Ltd"
                placeholderTextColor={colors.textMuted}
                value={firmName}
                onChangeText={setFirmName}
              />

              <Text style={styles.fieldLabel}>ORGANIZATION CONSTITUTION</Text>
              <View style={styles.chipRow}>
                {COMPANY_TYPES.map((ct) => (
                  <TouchableOpacity
                    key={ct}
                    style={[styles.smallChip, companyType === ct && styles.smallChipSelected]}
                    onPress={() => setCompanyType(ct)}
                  >
                    <Text style={[styles.smallChipText, companyType === ct && styles.smallChipTextSelected]}>
                      {ct}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>REGISTRATION / CIN NUMBER</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. U14200RJ2019PTC065432"
                placeholderTextColor={colors.textMuted}
                value={regNo}
                onChangeText={setRegNo}
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>MSME / Preferential Procurement</Text>
                  <Text style={styles.switchSub}>Registered under Micro, Small & Medium Enterprises Development Act</Text>
                </View>
                <Switch value={preferential} onValueChange={setPreferential} />
              </View>

              {preferential && (
                <>
                  <Text style={styles.fieldLabel}>UDYAM REGISTRATION NUMBER</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="UDYAM-RJ-14-0012345"
                    placeholderTextColor={colors.textMuted}
                    value={preferenceNo}
                    onChangeText={setPreferenceNo}
                  />
                </>
              )}
            </Card>
          )}

          {step === 2 && (
            <Card style={styles.card}>
              <Text style={styles.stepHeading}>Step 2: Key Personnel & Communications</Text>

              <Text style={styles.fieldLabel}>AUTHORIZED SIGNATORY NAME *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rajesh Kumar Sharma"
                placeholderTextColor={colors.textMuted}
                value={contactName}
                onChangeText={setContactName}
              />

              <Text style={styles.fieldLabel}>OFFICIAL DESIGNATION</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Managing Partner / Director"
                placeholderTextColor={colors.textMuted}
                value={contactDesignation}
                onChangeText={setContactDesignation}
              />

              <Text style={styles.fieldLabel}>REGISTERED MOBILE (FOR SMS/OTP) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={contactMobile}
                onChangeText={setContactMobile}
                maxLength={10}
              />

              <Text style={styles.fieldLabel}>OFFICIAL EMAIL (FOR TENDER NOTICES) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="tender@apexdrilling.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={contactEmail}
                onChangeText={setContactEmail}
              />
            </Card>
          )}

          {step === 3 && (
            <Card style={styles.card}>
              <Text style={styles.stepHeading}>Step 3: Registered Office Address</Text>

              <Text style={styles.fieldLabel}>STREET / BUILDING / INDUSTRIAL AREA *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Plot 42, RIICO Industrial Area"
                placeholderTextColor={colors.textMuted}
                value={addressLine}
                onChangeText={setAddressLine}
              />

              <Text style={styles.fieldLabel}>CITY / DISTRICT *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Jaipur"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />

              <Text style={styles.fieldLabel}>STATE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Rajasthan"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />

              <Text style={styles.fieldLabel}>PINCODE *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 302013"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={pincode}
                onChangeText={setPincode}
                maxLength={6}
              />
            </Card>
          )}

          {step === 4 && (
            <Card style={styles.card}>
              <Text style={styles.stepHeading}>Step 4: Specialized Work Capabilities</Text>
              <Text style={styles.sectionSub}>Select the domains your firm is equipped to quote for.</Text>

              <View style={styles.categoriesWrap}>
                {WORK_CATEGORIES.map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryCheckCard, isChecked && styles.categoryCheckCardActive]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                        {isChecked && <Check size={12} color={colors.surface} />}
                      </View>
                      <Text style={[styles.categoryCheckText, isChecked && styles.categoryCheckTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          )}

          {step === 5 && (
            <Card style={styles.card}>
              <Text style={styles.stepHeading}>Step 5: Statutory Tax Identification</Text>

              <Text style={styles.fieldLabel}>PERMANENT ACCOUNT NUMBER (PAN) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ABCDE1234F"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={pan}
                onChangeText={setPan}
                maxLength={10}
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>GST Registered</Text>
                  <Text style={styles.switchSub}>Enterprise is registered under Goods and Services Tax</Text>
                </View>
                <Switch value={gstRegistered} onValueChange={setGstRegistered} />
              </View>

              {gstRegistered && (
                <>
                  <Text style={styles.fieldLabel}>GSTIN REGISTRATION NUMBER *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="08ABCDE1234F1Z5"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    value={gstin}
                    onChangeText={setGstin}
                    maxLength={15}
                  />
                </>
              )}
            </Card>
          )}

          {step === 6 && (
            <Card style={styles.card}>
              <Text style={styles.stepHeading}>Step 6: Bank Settlement Details</Text>
              <Text style={styles.sectionSub}>All milestone contract disbursements will be credited here.</Text>

              <Text style={styles.fieldLabel}>BANK NAME *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="State Bank of India / HDFC Bank"
                placeholderTextColor={colors.textMuted}
                value={bankName}
                onChangeText={setBankName}
              />

              <Text style={styles.fieldLabel}>BRANCH NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Industrial Area Branch, Jaipur"
                placeholderTextColor={colors.textMuted}
                value={branch}
                onChangeText={setBranch}
              />

              <Text style={styles.fieldLabel}>ACCOUNT NUMBER *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 38492019482"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                secureTextEntry
                value={accountNo}
                onChangeText={setAccountNo}
              />

              <Text style={styles.fieldLabel}>CONFIRM ACCOUNT NUMBER *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter bank account number"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={confirmAccountNo}
                onChangeText={setConfirmAccountNo}
              />

              <Text style={styles.fieldLabel}>IFSC ROUTING CODE *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="SBIN0001234"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={ifsc}
                onChangeText={setIfsc}
                maxLength={11}
              />
            </Card>
          )}

          {step === 7 && (
            <Card style={styles.card}>
              <Text style={styles.stepHeading}>Step 7: Verification & Declaration</Text>

              <Text style={styles.fieldLabel}>ATTACHED COMPLIANCE PROOFS</Text>
              {attachedDocs.map((doc) => (
                <View key={doc.id} style={styles.docItem}>
                  <FileText size={18} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: spacing.xs }}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text style={styles.docKind}>{doc.kind}</Text>
                  </View>
                  <CheckCircle2 size={16} color={colors.success} />
                </View>
              ))}

              <View style={styles.declarationWrap}>
                <TouchableOpacity
                  style={styles.checkboxTouch}
                  onPress={() => setDeclaration(!declaration)}
                >
                  <View style={[styles.checkbox, declaration && styles.checkboxActive]}>
                    {declaration && <Check size={12} color={colors.surface} />}
                  </View>
                  <Text style={styles.declarationText}>
                    I solemnly affirm that the statutory particulars, GSTIN, PAN, and Bank accounts declared above are genuine. Any false submission shall result in immediate debarment.
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          <View style={styles.navRow}>
            {step > 1 && (
              <Button
                title="Previous"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => setStep(step - 1)}
              />
            )}

            {step < 7 ? (
              <Button
                title="Continue"
                variant="primary"
                style={{ flex: 1 }}
                onPress={handleNextStep}
              />
            ) : (
              <Button
                title={isSubmitting ? 'Submitting...' : 'Submit Application'}
                variant="primary"
                style={{ flex: 1 }}
                disabled={isSubmitting}
                onPress={handleFinalSubmit}
              />
            )}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  modeBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  trackSection: {
    gap: spacing.md,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  errorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trackAppId: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  trackFirmName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  trackInfoRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  trackInfoLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    width: 110,
  },
  trackInfoVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
    flex: 1,
  },
  enrolledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  enrolledLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.successText,
  },
  enrolledVal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.successText,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  noteText: {
    fontSize: typography.fontSizes.xs,
    color: colors.warningText,
    flex: 1,
  },
  wizardSection: {
    paddingBottom: spacing.xxl,
  },
  stepperWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: 2,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepNum: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
  },
  stepNumActive: {
    color: colors.surface,
  },
  stepTitle: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    fontSize: typography.fontSizes.xs,
    color: colors.dangerText,
    lineHeight: 18,
  },
  stepHeading: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  smallChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surfaceMuted,
  },
  smallChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  smallChipText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  smallChipTextSelected: {
    color: colors.surface,
    fontWeight: typography.fontWeights.bold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
    marginTop: spacing.sm,
  },
  switchLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  switchSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  categoriesWrap: {
    gap: spacing.xs,
  },
  categoryCheckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface,
  },
  categoryCheckCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryCheckText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  categoryCheckTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.semibold,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  docName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  docKind: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  declarationWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  declarationText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  successCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  successTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  appNumberBox: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  appNumberLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeights.bold,
    marginBottom: 4,
  },
  appNumberVal: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
  },
  successInstruction: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
