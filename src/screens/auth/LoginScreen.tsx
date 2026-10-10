import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  ImageBackground,
  useWindowDimensions,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../utils/responsive';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  User,
  Users,
  Phone,
  FileText,
  Check,
  ChevronDown,
  ChevronRight,
  Crown,
  Briefcase,
  UserCheck,
  Landmark,
  CreditCard,
  X,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import {
  TEAM_PERSONAS,
  CANONICAL_ROLE_LIST,
  EMPLOYEE_MEMBERS,
  CanonicalRoleItem,
  EmployeeTeamMember,
  WORKSPACE_ACCESS,
} from '../../constants';
import { TeamRole, CanonicalRole, UserSession } from '../../types';

const loginHeaderImg = require('../../../assets/login-header.jpg');

const ROLE_META_DATA: Record<CanonicalRole, {
  icon: any;
  iconColor: string;
  bgColor: string;
  badgeLabel: string;
}> = {
  super_admin: {
    icon: Crown,
    iconColor: '#d97706',
    bgColor: '#fef3c7',
    badgeLabel: 'Board',
  },
  director: {
    icon: Briefcase,
    iconColor: '#4f46e5',
    bgColor: '#e0e7ff',
    badgeLabel: 'Exec',
  },
  manager: {
    icon: Users,
    iconColor: '#0d9488',
    bgColor: '#ccfbf1',
    badgeLabel: 'Ops & HR',
  },
  employee: {
    icon: UserCheck,
    iconColor: '#059669',
    bgColor: '#d1fae5',
    badgeLabel: 'Field Team',
  },
  finance_master: {
    icon: Landmark,
    iconColor: '#7c3aed',
    bgColor: '#ede9fe',
    badgeLabel: 'Treasury',
  },
  accounts_executive: {
    icon: CreditCard,
    iconColor: '#0284c7',
    bgColor: '#e0f2fe',
    badgeLabel: 'Accounts',
  },
};

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { isSmall, isCompact, isTablet } = useResponsive();

  const { loginTeam, loginCanonical, loginClient, loginVendor } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'client' | 'vendor'>('admin');
  const [roleLayoutMode, setRoleLayoutMode] = useState<'grid' | 'rail'>('grid');
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);

  const [selectedRoleKey, setSelectedRoleKey] = useState<CanonicalRole>('super_admin');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeTeamMember>(EMPLOYEE_MEMBERS[0]);
  const [showManualLogin, setShowManualLogin] = useState<boolean>(false);

  const [emailOrMobile, setEmailOrMobile] = useState('kritika.gupta@bansalgeo.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Portals state
  const [portalId, setPortalId] = useState('ENQ-2026-088');
  const [portalMobile, setPortalMobile] = useState('9820112233');

  const switchTab = (tab: 'admin' | 'client' | 'vendor') => {
    setActiveTab(tab);
    setErrorMessage('');
    if (tab === 'client') {
      if (!portalId || portalId === 'VND-2026-014') setPortalId('ENQ-2026-088');
      if (!portalMobile || portalMobile === '9811223344') setPortalMobile('9820112233');
    } else if (tab === 'vendor') {
      if (!portalId || portalId === 'ENQ-2026-088') setPortalId('VND-2026-014');
      if (!portalMobile || portalMobile === '9820112233') setPortalMobile('9811223344');
    }
  };

  const handleSelectRole = (item: CanonicalRoleItem) => {
    setErrorMessage('');
    if (item.key === 'employee') {
      setSelectedRoleKey('employee');
      setEmailOrMobile(selectedEmployee.email);
      setShowEmployeeModal(true);
      return;
    }
    setSelectedRoleKey(item.key);
    setEmailOrMobile(item.email);
    setShowRoleModal(false);
  };

  const handleSelectEmployee = (emp: EmployeeTeamMember) => {
    setSelectedEmployee(emp);
    setSelectedRoleKey('employee');
    setEmailOrMobile(emp.email);
    setShowEmployeeModal(false);
    setShowRoleModal(false);
  };

  const handleSignIn = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      if (activeTab === 'admin') {
        if (showManualLogin) {
          let targetRole: TeamRole = 'admin';
          const trimmed = emailOrMobile.trim().toLowerCase();
          if (trimmed.includes('hr') || trimmed.includes('kavita') || trimmed.includes('pooja.joshi')) {
            targetRole = 'hr';
          } else if (trimmed.includes('account') || trimmed.includes('pooja.sharma') || trimmed.includes('ramesh')) {
            targetRole = 'accountant';
          } else if (trimmed.includes('lead') || trimmed.includes('sunita') || trimmed.includes('vikram')) {
            targetRole = 'lead';
          } else if (trimmed.includes('gupta') || trimmed.includes('employee') || trimmed.includes('rohit') || trimmed.includes('suresh')) {
            targetRole = 'employee';
          }
          await loginTeam(targetRole);
        } else {
          if (selectedRoleKey === 'employee') {
            const empUserSession: UserSession = {
              id: selectedEmployee.id,
              employeeId: `BGS-2023-${selectedEmployee.id.replace('emp-', '')}`,
              name: selectedEmployee.name,
              email: selectedEmployee.email,
              accountType: 'team',
              role: 'employee',
              canonicalRole: 'employee',
              hrmsRole: 'employee',
              designation: selectedEmployee.designation,
              department: selectedEmployee.department,
              workspaces: WORKSPACE_ACCESS.employee,
            };
            await loginCanonical('employee', empUserSession);
          } else {
            await loginCanonical(selectedRoleKey);
          }
        }
      } else if (activeTab === 'client') {
        if (!portalId.trim() || !portalMobile.trim()) {
          setErrorMessage('Please enter both Enquiry ID and Registered Mobile.');
          setIsSubmitting(false);
          return;
        }
        await loginClient(portalId, portalMobile);
      } else if (activeTab === 'vendor') {
        if (!portalId.trim() || !portalMobile.trim()) {
          setErrorMessage('Please enter both Vendor ID and Registered Mobile.');
          setIsSubmitting(false);
          return;
        }
        await loginVendor(portalId, portalMobile);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRoleConfig = CANONICAL_ROLE_LIST.find((r) => r.key === selectedRoleKey) || CANONICAL_ROLE_LIST[0];
  const activeMeta = ROLE_META_DATA[selectedRoleKey] || ROLE_META_DATA.super_admin;
  const ActiveIcon = activeMeta.icon;

  const getAdminButtonLabel = () => {
    if (isSubmitting) return 'Authenticating...';
    if (showManualLogin) return 'Sign In';
    return 'Continue';
  };

  const headerHeight = Math.max(Math.round(height * 0.32), 265);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Scenic Mountain & Excavator Hero Banner */}
        <ImageBackground
          source={loginHeaderImg}
          style={[styles.heroBanner, { height: headerHeight }]}
          resizeMode="cover"
        />

        {/* Welcome Back Card - Clean, Focused, Extra Rounded */}
        <View
          style={[
            styles.cardContainer,
            isTablet && styles.cardContainerTablet,
            isCompact && { paddingHorizontal: 14 },
            {
              minHeight: height - headerHeight + 38,
              paddingBottom: Math.max(insets.bottom + 24, 40),
            },
          ]}
        >
          {/* Subtle Top Handle Pill */}
          <View style={styles.handlePill} />

          {/* Title & Subtitle at TOP */}
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>
            {activeTab === 'admin'
              ? 'Select your executive persona to access portal'
              : activeTab === 'client'
                ? 'Sign in to your client exploration portal'
                : 'Sign in to vendor & contractor portal'}
          </Text>

          {/* 3-Portal Switcher Segmented Control Bar */}
          <View style={styles.portalTabsContainer}>
            {/* Tab 1: Bansal Geo Internal Portal */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => switchTab('admin')}
              style={[
                styles.portalTab,
                activeTab === 'admin' ? styles.portalTabActive : styles.portalTabInactive,
              ]}
            >
              <User
                size={16}
                color={activeTab === 'admin' ? '#ffffff' : '#475569'}
                strokeWidth={2.2}
                style={styles.tabIcon}
              />
              <View style={styles.tabTextCol}>
                <Text
                  style={[
                    styles.tabTitleText,
                    activeTab === 'admin' ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Bansal Geo
                </Text>
                <Text
                  style={[
                    styles.tabSubText,
                    activeTab === 'admin' ? styles.tabSubActive : styles.tabSubInactive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Internal Portal
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider between Tab 1 and Tab 2 (when Tab 3 is active) */}
            {activeTab === 'vendor' && <View style={styles.tabDivider} />}

            {/* Tab 2: Client Portal */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => switchTab('client')}
              style={[
                styles.portalTab,
                activeTab === 'client' ? styles.portalTabActive : styles.portalTabInactive,
              ]}
            >
              <Users
                size={16}
                color={activeTab === 'client' ? '#ffffff' : '#475569'}
                strokeWidth={2.2}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabSingleLineText,
                  activeTab === 'client' ? styles.tabTextActive : styles.tabTextInactive,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Client Portal
              </Text>
            </TouchableOpacity>

            {/* Divider between Tab 2 and Tab 3 (when Tab 1 is active) */}
            {activeTab === 'admin' && <View style={styles.tabDivider} />}

            {/* Tab 3: Vendor Portal */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => switchTab('vendor')}
              style={[
                styles.portalTab,
                activeTab === 'vendor' ? styles.portalTabActive : styles.portalTabInactive,
              ]}
            >
              <Building2
                size={16}
                color={activeTab === 'vendor' ? '#ffffff' : '#475569'}
                strokeWidth={2.2}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabSingleLineText,
                  activeTab === 'vendor' ? styles.tabTextActive : styles.tabTextInactive,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Vendor Portal
              </Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          {activeTab === 'admin' ? (
            <View style={styles.adminPortalContainer}>
              {/* Concise Role Section Header */}
              <View style={styles.conciseHeaderBar}>
                <View style={styles.conciseHeaderLeft}>
                  <Sparkles size={13} color="#0b2545" strokeWidth={2.4} />
                  <Text style={styles.conciseHeaderTitle}>SELECT ROLE</Text>
                </View>

                {/* View Mode Toggle: All 6 (Compact Grid) vs Scroll Bar */}
                <View style={styles.conciseToggleGroup}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setRoleLayoutMode('grid')}
                    style={[
                      styles.conciseToggleBtn,
                      roleLayoutMode === 'grid' && styles.conciseToggleBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.conciseToggleText,
                        roleLayoutMode === 'grid' && styles.conciseToggleTextActive,
                      ]}
                    >
                      All 6
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setRoleLayoutMode('rail')}
                    style={[
                      styles.conciseToggleBtn,
                      roleLayoutMode === 'rail' && styles.conciseToggleBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.conciseToggleText,
                        roleLayoutMode === 'rail' && styles.conciseToggleTextActive,
                      ]}
                    >
                      Scroll Bar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* MODE 1: COMPACT 2-COLUMN SINGLE-LINE MINI CHIPS */}
              {roleLayoutMode === 'grid' ? (
                <View style={styles.conciseGridContainer}>
                  {CANONICAL_ROLE_LIST.map((item) => {
                    const isSelected = selectedRoleKey === item.key;
                    const meta = ROLE_META_DATA[item.key];
                    const IconComp = meta.icon;

                    return (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.75}
                        onPress={() => handleSelectRole(item)}
                        style={[
                          styles.conciseChip,
                          isSelected ? styles.conciseChipSelected : styles.conciseChipUnselected,
                        ]}
                      >
                        <View
                          style={[
                            styles.conciseIconCircle,
                            isSelected
                              ? styles.conciseIconCircleSelected
                              : { backgroundColor: meta.bgColor },
                          ]}
                        >
                          <IconComp
                            size={13}
                            color={isSelected ? '#ffffff' : meta.iconColor}
                            strokeWidth={2.4}
                          />
                        </View>

                        <Text
                          style={[
                            styles.conciseChipText,
                            isSelected && styles.conciseChipTextSelected,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          {item.title}
                        </Text>

                        {isSelected ? (
                          <View style={styles.conciseCheckBadge}>
                            <Check size={10} color="#ffffff" strokeWidth={3.5} />
                          </View>
                        ) : item.key === 'employee' ? (
                          <ChevronDown size={12} color="#94a3b8" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                /* MODE 2: ULTRA-CONCISE HORIZONTAL CAPSULE RAIL */
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.conciseRailScroll}
                >
                  {CANONICAL_ROLE_LIST.map((item) => {
                    const isSelected = selectedRoleKey === item.key;
                    const meta = ROLE_META_DATA[item.key];
                    const IconComp = meta.icon;

                    return (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.75}
                        onPress={() => handleSelectRole(item)}
                        style={[
                          styles.concisePill,
                          isSelected ? styles.concisePillSelected : styles.concisePillUnselected,
                        ]}
                      >
                        <View
                          style={[
                            styles.conciseIconCircle,
                            isSelected
                              ? styles.conciseIconCircleSelected
                              : { backgroundColor: meta.bgColor },
                          ]}
                        >
                          <IconComp
                            size={13}
                            color={isSelected ? '#ffffff' : meta.iconColor}
                            strokeWidth={2.4}
                          />
                        </View>

                        <Text
                          style={[
                            styles.concisePillText,
                            isSelected && styles.concisePillTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>

                        {isSelected ? (
                          <View style={styles.conciseCheckBadge}>
                            <Check size={10} color="#ffffff" strokeWidth={3.5} />
                          </View>
                        ) : item.key === 'employee' ? (
                          <ChevronDown size={12} color="#94a3b8" style={{ marginLeft: 3 }} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Ultra-Slim Persona Summary Strip */}
              <View style={styles.personaStrip}>
                <View style={styles.personaStripLeft}>
                  <View style={styles.personaDot} />
                  <Text style={styles.personaStripLabel}>Active:</Text>
                  <Text style={styles.personaStripName} numberOfLines={1}>
                    {selectedRoleKey === 'employee'
                      ? selectedEmployee.name
                      : activeRoleConfig.personName}
                  </Text>
                </View>

                {selectedRoleKey === 'employee' ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowEmployeeModal(true)}
                    style={styles.personaSwitchBtn}
                  >
                    <Text style={styles.personaSwitchBtnText}>Switch Member</Text>
                    <ChevronDown size={11} color="#0b2545" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.personaBadgePill}>
                    <Text style={styles.personaBadgeText}>{activeMeta.badgeLabel}</Text>
                  </View>
                )}
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignIn}
                disabled={isSubmitting}
                style={styles.signInBtn}
              >
                <Text style={styles.signInBtnText}>{getAdminButtonLabel()}</Text>
                <ArrowRight size={18} color="#ffffff" strokeWidth={2.4} />
              </TouchableOpacity>

              {/* Optional Custom Credentials Toggle */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowManualLogin(!showManualLogin)}
                style={styles.manualLoginToggle}
              >
                <Text style={styles.manualLoginToggleText}>
                  {showManualLogin
                    ? 'Hide custom email & password'
                    : 'Sign in with custom email & password'}
                </Text>
                <ChevronDown
                  size={13}
                  color="#64748b"
                  style={showManualLogin ? { transform: [{ rotate: '180deg' }] } : undefined}
                />
              </TouchableOpacity>

              {!showManualLogin && (
                <View style={styles.secureBottomBadge}>
                  <Lock size={11} color="#94a3b8" />
                  <Text style={styles.secureBottomText}>
                    Bansal Geo Solutions • Encrypted Enterprise Portal
                  </Text>
                </View>
              )}

              {/* Manual Email & Password Input Section (when toggled) */}
              {showManualLogin && (
                <View style={styles.manualLoginForm}>
                  <View style={styles.inputContainer}>
                    <Mail size={19} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Email or Mobile Number"
                      placeholderTextColor="#94a3b8"
                      value={emailOrMobile}
                      onChangeText={setEmailOrMobile}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Lock size={19} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Password"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? (
                        <EyeOff size={19} color="#64748b" />
                      ) : (
                        <Eye size={19} color="#64748b" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      Alert.alert(
                        'Reset Password',
                        'Self-service password recovery instructions sent to registered company email.'
                      )
                    }
                    style={styles.forgotBtn}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            /* Client and Vendor Portals Form */
            <View>
              <View style={styles.inputGroup}>
                {activeTab === 'vendor' && (
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setPortalId('VND-2026-014');
                        setPortalMobile('9811223344');
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                        borderRadius: 6,
                        backgroundColor: portalId === 'VND-2026-014' ? '#e0f2fe' : '#f1f5f9',
                        borderWidth: 1,
                        borderColor: portalId === 'VND-2026-014' ? '#0284c7' : '#cbd5e1',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: portalId === 'VND-2026-014' ? '#0369a1' : '#475569' }}>
                        Apex Drilling
                      </Text>
                      <Text style={{ fontSize: 9, color: '#64748b' }}>VND-2026-014</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setPortalId('VND-2026-022');
                        setPortalMobile('9899112233');
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                        borderRadius: 6,
                        backgroundColor: portalId === 'VND-2026-022' ? '#e0f2fe' : '#f1f5f9',
                        borderWidth: 1,
                        borderColor: portalId === 'VND-2026-022' ? '#0284c7' : '#cbd5e1',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: portalId === 'VND-2026-022' ? '#0369a1' : '#475569' }}>
                        Geotech Assay
                      </Text>
                      <Text style={{ fontSize: 9, color: '#64748b' }}>VND-2026-022</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  {activeTab === 'client' ? (
                    <FileText size={19} color="#64748b" style={styles.inputIcon} />
                  ) : (
                    <Building2 size={19} color="#64748b" style={styles.inputIcon} />
                  )}
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      activeTab === 'client'
                        ? 'Enquiry ID / File No (e.g. ENQ-2026-088)'
                        : 'Vendor ID (e.g. VND-2026-014)'
                    }
                    placeholderTextColor="#94a3b8"
                    value={portalId}
                    onChangeText={setPortalId}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Phone size={19} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Registered Mobile Number"
                    placeholderTextColor="#94a3b8"
                    value={portalMobile}
                    onChangeText={setPortalMobile}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Primary Sign In Button for Client/Vendor */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignIn}
                disabled={isSubmitting}
                style={styles.signInBtn}
              >
                <Text style={styles.signInBtnText}>
                  {isSubmitting
                    ? 'Authenticating...'
                    : activeTab === 'client'
                      ? 'Access Client Portal'
                      : 'Access Vendor Portal'}
                </Text>
                <ArrowRight size={18} color="#ffffff" strokeWidth={2.4} />
              </TouchableOpacity>

              {/* Client/Vendor Helper Section */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {activeTab === 'client' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PublicEnquiry')}
                  style={styles.helperCard}
                >
                  <View style={styles.helperIconBox}>
                    <FileText size={19} color="#0284c7" strokeWidth={2.2} />
                  </View>
                  <View style={styles.helperTextCol}>
                    <Text style={styles.helperTitle}>Need a Geological Survey?</Text>
                    <Text style={styles.helperSubtitle}>
                      Submit a new exploration enquiry online
                    </Text>
                  </View>
                  <ArrowRight size={18} color="#0284c7" strokeWidth={2.4} />
                </TouchableOpacity>
              )}

              {activeTab === 'vendor' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('VendorRegister')}
                  style={styles.helperCard}
                >
                  <View style={styles.helperIconBox}>
                    <Building2 size={19} color="#059669" strokeWidth={2.2} />
                  </View>
                  <View style={styles.helperTextCol}>
                    <Text style={styles.helperTitle}>New Contractor / Firm?</Text>
                    <Text style={styles.helperSubtitle}>
                      Register firm or track vendor application
                    </Text>
                  </View>
                  <ArrowRight size={18} color="#059669" strokeWidth={2.4} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 1. Modal: Role Switcher Bottom Sheet */}
      <Modal statusBarTranslucent
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setShowRoleModal(false)}
          />
          <View style={[styles.modalSheetContainer, { paddingBottom: Math.max(insets.bottom + 20, 28) }]}>
            <View style={styles.modalHandlePill} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Switch Portal Role</Text>
                <Text style={styles.modalSubtitle}>Select an authorized executive persona</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRoleModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {CANONICAL_ROLE_LIST.map((item) => {
                const isSelected = selectedRoleKey === item.key;
                const meta = ROLE_META_DATA[item.key];
                const IconComp = meta.icon;
                const displayName =
                  item.key === 'employee' && isSelected ? selectedEmployee.name : item.personName;

                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.75}
                    onPress={() => handleSelectRole(item)}
                    style={[
                      styles.modalRoleItem,
                      isSelected ? styles.modalRoleItemSelected : styles.modalRoleItemUnselected,
                    ]}
                  >
                    <View style={[styles.modalRoleIconBox, { backgroundColor: meta.bgColor }]}>
                      <IconComp size={20} color={meta.iconColor} strokeWidth={2.4} />
                    </View>
                    <View style={styles.modalRoleInfoCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.modalRoleTitle, isSelected && styles.modalRoleTitleSelected]}>
                          {item.title}
                        </Text>
                        <View style={styles.modalRolePill}>
                          <Text style={styles.modalRolePillText}>{meta.badgeLabel}</Text>
                        </View>
                      </View>
                      <Text style={styles.modalRoleSubtitle}>{item.subtitle}</Text>
                      <Text style={[styles.modalRolePerson, isSelected && styles.modalRolePersonSelected]}>
                        {displayName}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={styles.modalSelectedCheck}>
                        <Check size={14} color="#ffffff" strokeWidth={3} />
                      </View>
                    ) : (
                      <ChevronRight size={18} color="#cbd5e1" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Modal: Employee Team Member Picker */}
      <Modal statusBarTranslucent
        visible={showEmployeeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setShowEmployeeModal(false)}
          />
          <View style={[styles.modalSheetContainer, { paddingBottom: Math.max(insets.bottom + 20, 28) }]}>
            <View style={styles.modalHandlePill} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Select Field Employee</Text>
                <Text style={styles.modalSubtitle}>6 Active Team Members • Geology & Field Ops</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEmployeeModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {EMPLOYEE_MEMBERS.map((emp) => {
                const isThisEmpSelected = selectedEmployee.id === emp.id;
                return (
                  <TouchableOpacity
                    key={emp.id}
                    activeOpacity={0.75}
                    onPress={() => handleSelectEmployee(emp)}
                    style={[
                      styles.modalEmployeeRow,
                      isThisEmpSelected && styles.modalEmployeeRowSelected,
                    ]}
                  >
                    <View style={[styles.empAvatarCircle, isThisEmpSelected && styles.empAvatarCircleSelected]}>
                      <Text style={[styles.empAvatarInitials, isThisEmpSelected && styles.empAvatarInitialsSelected]}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.modalEmpName, isThisEmpSelected && styles.modalEmpNameSelected]}>
                        {emp.name}
                      </Text>
                      <Text style={styles.modalEmpDesig}>{emp.designation}</Text>
                      <Text style={styles.modalEmpDept}>{emp.department}</Text>
                    </View>
                    {isThisEmpSelected ? (
                      <View style={styles.modalSelectedCheck}>
                        <Check size={14} color="#ffffff" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={styles.modalRadioUnchecked} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061a32',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* Hero Banner */
  heroBanner: {
    width: '100%',
  },

  /* Welcome Back Card Container */
  cardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    marginTop: -38,
    paddingHorizontal: 22,
    paddingTop: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0b2545',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 12,
  },
  cardContainerTablet: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 38,
    marginBottom: 40,
  },
  handlePill: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },

  /* 3-Portal Switcher Segmented Control */
  portalTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 3.5,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  portalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 3,
    borderRadius: 12,
    minHeight: 44,
  },
  portalTabActive: {
    backgroundColor: '#0b2545',
    shadowColor: '#0b2545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  portalTabInactive: {
    backgroundColor: 'transparent',
  },
  tabIcon: {
    marginRight: 5,
  },
  tabTextCol: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  tabTitleText: {
    fontSize: 10.5,
    fontWeight: '800',
    lineHeight: 12.5,
    letterSpacing: -0.2,
  },
  tabSubText: {
    fontSize: 9.2,
    fontWeight: '600',
    lineHeight: 11.2,
    letterSpacing: -0.2,
  },
  tabSingleLineText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabTextInactive: {
    color: '#334155',
  },
  tabSubActive: {
    color: '#e2e8f0',
  },
  tabSubInactive: {
    color: '#64748b',
  },
  tabDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 1,
  },

  /* Typography */
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 18,
  },

  /* Error Box */
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12.5,
    color: '#b91c1c',
    fontWeight: '600',
  },

  /* Input Fields */
  inputGroup: {
    gap: 12,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: '#0f172a',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 16,
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },

  /* Primary Sign In Button */
  signInBtn: {
    backgroundColor: '#0b2545',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0b2545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },

  /* Admin Portal & Switch Role Container */
  adminPortalContainer: {
    marginTop: 6,
    marginBottom: 8,
  },
  conciseHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  conciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conciseHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0b2545',
    letterSpacing: 0.8,
  },
  conciseToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  conciseToggleBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  conciseToggleBtnActive: {
    backgroundColor: '#0b2545',
  },
  conciseToggleText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
  },
  conciseToggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  /* Concise 2-Column Mini Chips */
  conciseGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 12,
  },
  conciseChip: {
    width: '48.5%',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  conciseChipSelected: {
    backgroundColor: '#0b2545',
    borderColor: '#0b2545',
    shadowColor: '#0b2545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  conciseChipUnselected: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  conciseIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  conciseIconCircleSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  conciseChipText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: -0.2,
  },
  conciseChipTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  conciseCheckBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },

  /* Concise Horizontal Capsule Rail */
  conciseRailScroll: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 2,
    marginBottom: 8,
  },
  concisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1.2,
  },
  concisePillSelected: {
    backgroundColor: '#0b2545',
    borderColor: '#0b2545',
    shadowColor: '#0b2545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  concisePillUnselected: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  concisePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginRight: 2,
  },
  concisePillTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },

  /* Concise Persona Info Strip */
  personaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 9,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  personaStripLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  personaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  personaStripLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
  },
  personaStripName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  personaBadgePill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  personaBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  personaSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginLeft: 4,
  },
  personaSwitchBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0b2545',
  },
  secureBottomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 14,
    paddingVertical: 4,
  },
  secureBottomText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.2,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 26, 50, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    flex: 1,
  },
  modalSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  modalHandlePill: {
    width: 40,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginBottom: 10,
  },
  modalRoleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  modalRoleItemSelected: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: '#0d9488',
  },
  modalRoleItemUnselected: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalRoleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalRoleInfoCol: {
    flex: 1,
  },
  modalRoleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalRoleTitleSelected: {
    color: '#0f766e',
  },
  modalRolePill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  modalRolePillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  modalRoleSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  modalRolePerson: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  modalRolePersonSelected: {
    color: '#0f766e',
    fontWeight: '700',
  },
  modalSelectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Modal Employee Rows */
  modalEmployeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  modalEmployeeRowSelected: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: '#0d9488',
  },
  empAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarCircleSelected: {
    backgroundColor: '#ccfbf1',
  },
  empAvatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  empAvatarInitialsSelected: {
    color: '#0f766e',
  },
  modalEmpName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalEmpNameSelected: {
    color: '#0f766e',
  },
  modalEmpDesig: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    marginTop: 1,
  },
  modalEmpDept: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  modalRadioUnchecked: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },

  /* Manual Login Toggle & Fields */
  manualLoginToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  manualLoginToggleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
  },
  manualLoginForm: {
    marginTop: 10,
    gap: 12,
  },

  /* Helper Action Cards (for Client & Vendor) */
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  helperIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helperTextCol: {
    flex: 1,
  },
  helperTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  helperSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1.5,
  },
});
