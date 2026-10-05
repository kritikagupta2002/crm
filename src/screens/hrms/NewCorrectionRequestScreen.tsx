import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppHeader, Card, Button } from '../../components/common';
import { Calendar, Clock, FileEdit, AlertCircle, CheckCircle2 } from 'lucide-react-native';

export const NewCorrectionRequestScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { submitCorrection } = useHrms();
  const { session } = useAuth();

  const activeEmpId = (session as any)?.employeeId || 'BGS-2023-044';
  const activeEmpName = (session as any)?.name || 'Team Member';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const defaultDateStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

  const [date, setDate] = useState<string>(route?.params?.defaultDate || defaultDateStr);
  const [currentIn, setCurrentIn] = useState('10:15 AM');
  const [currentOut, setCurrentOut] = useState('06:00 PM');
  const [requestedIn, setRequestedIn] = useState('09:15 AM');
  const [requestedOut, setRequestedOut] = useState('06:30 PM');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setPresetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  const handleSubmit = async () => {
    if (!date.trim()) {
      Alert.alert('Validation Error', 'Please specify the date of incident.');
      return;
    }
    if (!requestedIn.trim() || !requestedOut.trim()) {
      Alert.alert('Validation Error', 'Please specify both requested punch in and punch out times.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please specify the reason for correction.');
      return;
    }
    if (reason.trim().length < 10) {
      Alert.alert(
        'Validation Error',
        'Please provide a detailed justification (at least 10 characters).'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await submitCorrection(
        date.trim(),
        requestedIn.trim(),
        requestedOut.trim(),
        reason.trim(),
        currentIn.trim(),
        currentOut.trim()
      );
      Alert.alert(
        'Request Submitted',
        'Attendance correction request submitted to manager/HR for review.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit correction request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title="Apply for Punch Correction"
        subtitle="Submit biometric attendance regularization for sign-off"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <View style={styles.applicantBanner}>
            <View style={styles.applicantIcon}>
              <FileEdit size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.applicantName}>{activeEmpName}</Text>
              <Text style={styles.applicantId}>{activeEmpId} • Regularization Request</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Date of Incident <Text style={styles.reqStar}>*</Text>
            </Text>
            <View style={styles.inputWrap}>
              <Calendar size={16} color={colors.text.tertiary} />
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
            <View style={styles.presetRow}>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setPresetDate(0)}>
                <Text style={styles.presetBtnText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setPresetDate(1)}>
                <Text style={styles.presetBtnText}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setPresetDate(2)}>
                <Text style={styles.presetBtnText}>2 Days Ago</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setPresetDate(3)}>
                <Text style={styles.presetBtnText}>3 Days Ago</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionSubtitle}>CURRENT LOGGED PUNCH (IF ANY)</Text>

          <View style={styles.rowTwoCols}>
            <View style={styles.col}>
              <Text style={styles.label}>Currently Logged In</Text>
              <View style={styles.inputWrap}>
                <Clock size={16} color={colors.text.tertiary} />
                <TextInput
                  style={styles.textInput}
                  value={currentIn}
                  onChangeText={setCurrentIn}
                  placeholder="10:15 AM"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Currently Logged Out</Text>
              <View style={styles.inputWrap}>
                <Clock size={16} color={colors.text.tertiary} />
                <TextInput
                  style={styles.textInput}
                  value={currentOut}
                  onChangeText={setCurrentOut}
                  placeholder="06:00 PM"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />
          <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>
            REQUESTED CORRECTED PUNCH *
          </Text>

          <View style={styles.rowTwoCols}>
            <View style={styles.col}>
              <Text style={styles.label}>
                Corrected Punch In <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={[styles.inputWrap, styles.inputWrapActive]}>
                <Clock size={16} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  value={requestedIn}
                  onChangeText={setRequestedIn}
                  placeholder="09:15 AM"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>
                Corrected Punch Out <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={[styles.inputWrap, styles.inputWrapActive]}>
                <Clock size={16} color={colors.primary} />
                <TextInput
                  style={styles.textInput}
                  value={requestedOut}
                  onChangeText={setRequestedOut}
                  placeholder="06:30 PM"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Detailed Reason & Justification <Text style={styles.reqStar}>*</Text>
            </Text>
            <TextInput
              style={styles.textarea}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              placeholder="e.g. Drone field takeoff in Bhilwara had poor cell reception; biometric couldn't sync until 10:45 AM / Core logging drill hole pit extension."
              placeholderTextColor={colors.text.tertiary}
            />
            <Text style={styles.helperText}>
              Min. 10 characters required. Provide specific rig, site, or project details for swift sign-off.
            </Text>
          </View>

          <View style={styles.actionWrap}>
            <Button
              title={isSubmitting ? 'Submitting Regularization...' : 'Submit Regularization'}
              variant="primary"
              size="large"
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.sm,
  },
  applicantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: spacing.lg,
  },
  applicantIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  applicantId: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  reqStar: {
    color: colors.semantic.danger,
    fontWeight: typography.fontWeights.bold,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    height: 44,
    gap: spacing.xs,
  },
  inputWrapActive: {
    borderColor: colors.primary,
    backgroundColor: '#F8FAFC',
  },
  textInput: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  presetBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  presetBtnText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.md,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  col: {
    flex: 1,
  },
  textarea: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    padding: spacing.sm,
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    lineHeight: 14,
  },
  actionWrap: {
    marginTop: spacing.md,
  },
  submitBtn: {
    width: '100%',
    borderRadius: radius.lg,
  },
});
