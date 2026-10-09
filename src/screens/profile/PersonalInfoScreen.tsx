import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  Heart,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Building2,
  Edit3,
  Save,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const drRajeshImg = require('../../../assets/dr-rajesh-bansal.jpg');

interface PersonalInfoScreenProps {
  navigation: any;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  super_admin: 'Super Admin',
  director: 'Director & Technical Head',
  manager: 'Operations & Exploration Manager',
  employee: 'Senior Field Geoscientist',
  finance_master: 'Chief Financial Controller',
  accounts_executive: 'Senior Accounts Officer',
};

export const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { session, canonicalRole } = useAuth();
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const defaultName = session && 'name' in session ? session.name : 'Dr. Rajesh Bansal';
  const defaultDesignation =
    canonicalRole === 'super_admin'
      ? 'Managing Director & Chief Geoscientist'
      : ROLE_DISPLAY_NAMES[canonicalRole] || 'Senior Technical Consultant';

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState('rajesh.bansal@bansalgeo.com');
  const [phone, setPhone] = useState('+91 98290 12345');
  const [designation, setDesignation] = useState(defaultDesignation);
  const [department, setDepartment] = useState('Mineral Exploration & Geophysics');
  const [employeeId, setEmployeeId] = useState('BGS-HQ-001');
  const [location, setLocation] = useState('Jaipur Corporate Office & Field Base');
  const [bloodGroup, setBloodGroup] = useState('O+ (Positive)');
  const [emergencyContact, setEmergencyContact] = useState('+91 94140 54321 (Spouse)');
  const [joiningDate, setJoiningDate] = useState('15 March 2012');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    setShowSavedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setShowSavedToast(false);
    }, 3000);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top App Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color="#0f172a" strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Personal Information</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Manage your corporate credentials</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.editActionBtn, isEditing && styles.saveActionBtn]}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          activeOpacity={0.8}
        >
          {isEditing ? (
            <>
              <Save size={16} color="#ffffff" strokeWidth={2.4} />
              <Text style={styles.saveActionText}>Save</Text>
            </>
          ) : (
            <>
              <Edit3 size={16} color="#0284c7" strokeWidth={2.2} />
              <Text style={styles.editActionText}>Edit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Toast */}
      {showSavedToast && (
        <View style={styles.toastCard}>
          <CheckCircle2 size={18} color="#059669" strokeWidth={2.4} />
          <Text style={styles.toastText}>Profile information updated successfully!</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Card with Avatar */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarContainer}>
            <Image source={drRajeshImg} style={styles.avatarImg} />
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={() =>
                Alert.alert('Change Profile Picture', 'Select photo from Gallery or Camera.')
              }
              activeOpacity={0.8}
            >
              <Camera size={14} color="#ffffff" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroInfoCol}>
            <Text style={styles.heroNameText}>{name}</Text>
            <Text style={styles.heroDesignationText}>{designation}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.rolePill}>
                <ShieldCheck size={12} color="#0284c7" strokeWidth={2.4} />
                <Text style={styles.rolePillText}>
                  {ROLE_DISPLAY_NAMES[canonicalRole] || 'Corporate Member'}
                </Text>
              </View>
              <View style={styles.empIdPill}>
                <Text style={styles.empIdPillText}>{employeeId}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 1: Basic Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>PRIMARY CONTACT DETAILS</Text>

          {/* Full Name */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <User size={18} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter full name"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{name}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Email Address */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <Mail size={18} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Official Email Address</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter official email"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{email}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Phone Number */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <Phone size={18} color="#0284c7" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter mobile number"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{phone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Section 2: Corporate & Department Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>ORGANIZATIONAL DETAILS</Text>

          {/* Designation */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <Briefcase size={18} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Designation</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={designation}
                  onChangeText={setDesignation}
                  placeholder="Enter designation"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{designation}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Department */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <Building2 size={18} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Department / Division</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="Enter department"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{department}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Base Location */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <MapPin size={18} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Station / Office Base</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter location"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{location}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Date of Joining */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <Calendar size={18} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Date of Joining</Text>
              <Text style={styles.fieldValue}>{joiningDate}</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Health & Emergency Contact */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>HEALTH & EMERGENCY CONTACT</Text>

          {/* Blood Group */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <Heart size={18} color="#dc2626" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Blood Group</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                  placeholder="e.g. O+ (Positive)"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{bloodGroup}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Emergency Contact */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <Phone size={18} color="#dc2626" strokeWidth={2.2} />
            </View>
            <View style={styles.fieldInputCol}>
              <Text style={styles.fieldLabel}>Emergency SOS Contact</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  placeholder="Emergency contact number and relation"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.fieldValue}>{emergencyContact}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.noteCard}>
          <ShieldCheck size={16} color="#0284c7" strokeWidth={2.2} />
          <Text style={styles.noteText}>
            Personal data is encrypted and securely stored in compliance with Bansal Geo
            Corporate Governance policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  saveActionBtn: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  editActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  saveActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0284c7',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  heroInfoCol: {
    flex: 1,
  },
  heroNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  heroDesignationText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  empIdPill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  empIdPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldInputCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  textInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0f9ff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 4,
  },
  noteText: {
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 17,
    fontWeight: '500',
    flex: 1,
  },
});
