import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, Button, Input } from '../../components';
import { ExpenseCategory } from '../../types';
import {
  IndianRupee,
  Calendar,
  FileText,
  Upload,
  CheckCircle2,
  Paperclip,
  Trash2,
  Eye,
  AlertCircle,
  Briefcase,
  Layers,
  X,
} from 'lucide-react-native';

const STANDARD_PROJECTS = [
  'Bhilwara Lead-Zinc Exploration Block',
  'Sukinda Chromite Geotechnical Study',
  'Korba Coalfield Core Drilling Rig 04',
  'Kolar Gold Belt IP/Resistivity Survey',
  'Corporate Head Office Operations',
];

interface AttachedReceipt {
  name: string;
  size: number;
  type: string;
  uri: string;
}

export const ExpenseClaimScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { submitExpense } = useHrms();
  const { session } = useAuth();

  const [category, setCategory] = useState<ExpenseCategory>('Travel & Conveyance');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [project, setProject] = useState(STANDARD_PROJECTS[0]);
  const [description, setDescription] = useState('');
  const [attachedReceipt, setAttachedReceipt] = useState<AttachedReceipt | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    amount?: string;
    date?: string;
    description?: string;
    project?: string;
    general?: string;
  }>({});

  const categories: ExpenseCategory[] = [
    'Travel & Conveyance',
    'Lodging & Accommodation',
    'Food & Meals',
    'Field Supplies',
  ];

  const handlePickReceipt = (sampleName: string, sizeKb: number) => {
    setAttachedReceipt({
      name: sampleName,
      size: sizeKb * 1024,
      type: sampleName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      uri: `file:///storage/emulated/0/Download/${sampleName}`,
    });
    setPickerModalOpen(false);
  };

  const handleRemoveReceipt = () => {
    setAttachedReceipt(null);
  };

  const validateForm = (): boolean => {
    const errs: typeof errors = {};
    const amt = parseFloat(requestedAmount);

    if (!requestedAmount || isNaN(amt) || amt <= 0) {
      errs.amount = 'Claim amount must be a positive number greater than ₹0.';
    }

    if (!date) {
      errs.date = 'Expense incurred date is required.';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (date > today) {
        errs.date = 'Expense date cannot be in the future.';
      }
    }

    if (!project || !project.trim()) {
      errs.project = 'Project allocation is required.';
    }

    if (!description || description.trim().length < 10) {
      errs.description = 'Justification description must be at least 10 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLodgeClaim = async () => {
    if (!validateForm()) {
      return;
    }

    const amt = parseFloat(requestedAmount);

    try {
      setIsSubmitting(true);
      setErrors({});

      await submitExpense({
        category,
        requestedAmount: amt,
        amount: amt,
        date: date.trim(),
        project: project.trim(),
        description: description.trim(),
        receiptFileName: attachedReceipt?.name,
        receiptFileSize: attachedReceipt?.size,
        receiptFileType: attachedReceipt?.type,
        receiptUrl: attachedReceipt?.uri,
      });

      Alert.alert(
        'Expense Claim Submitted',
        `Your expense claim of ₹${amt.toLocaleString('en-IN')} for ${category} has been submitted as Pending and logged into the HR & Finance audit queue.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to submit expense claim.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Lodge Expense Claim"
        subtitle="Staff reimbursement & field receipts"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          {errors.general && (
            <View style={styles.errorAlert}>
              <AlertCircle size={16} color={colors.semantic.error} />
              <Text style={styles.errorAlertText}>{errors.general}</Text>
            </View>
          )}

          <Text style={styles.label}>Expense Category *</Text>
          <View style={styles.categoryChips}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, category === c && styles.catChipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.catText, category === c && styles.catTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Input
              label="Monetary Amount Claimed (INR ₹) *"
              placeholder="e.g. 4500"
              keyboardType="numeric"
              value={requestedAmount}
              onChangeText={(val) => {
                setRequestedAmount(val);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              leftIcon={<IndianRupee size={16} color={colors.text.secondary} />}
              error={errors.amount}
            />
          </View>

          <View style={styles.inputGroup}>
            <Input
              label="Incurred Date (YYYY-MM-DD) *"
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={(val) => {
                setDate(val);
                if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              leftIcon={<Calendar size={16} color={colors.text.secondary} />}
              error={errors.date}
            />
            <Text style={styles.helperText}>Must be today or a past date. Future dates are blocked.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Associated Project / Exploration Site *</Text>
            <View style={styles.projectChips}>
              {STANDARD_PROJECTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.projChip, project === p && styles.projChipActive]}
                  onPress={() => {
                    setProject(p);
                    if (errors.project) setErrors((prev) => ({ ...prev, project: undefined }));
                  }}
                >
                  <Briefcase size={12} color={project === p ? '#FFFFFF' : colors.text.secondary} />
                  <Text style={[styles.projChipText, project === p && styles.projChipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.project && <Text style={styles.inlineError}>{errors.project}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Input
              label="Business Purpose / Justification (Min 10 chars) *"
              placeholder="e.g. Fuel expenses for borehole logging transit in Bhilwara block BH-07..."
              value={description}
              onChangeText={(val) => {
                setDescription(val);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              multiline
              numberOfLines={3}
              error={errors.description}
            />
            <Text style={styles.charCountText}>
              {description.length}/10 characters minimum
            </Text>
          </View>

          <Text style={styles.label}>Tax Invoice / Bill / Receipt Voucher</Text>
          {attachedReceipt ? (
            <View style={styles.attachedContainer}>
              <View style={styles.attachedInfo}>
                <Paperclip size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachedName} numberOfLines={1}>
                    {attachedReceipt.name}
                  </Text>
                  <Text style={styles.attachedMeta}>
                    {(attachedReceipt.size / 1024).toFixed(1)} KB • {attachedReceipt.type}
                  </Text>
                </View>
              </View>

              <View style={styles.attachedActions}>
                <TouchableOpacity
                  style={styles.attachedIconBtn}
                  onPress={() => setPreviewModalOpen(true)}
                >
                  <Eye size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attachedIconBtn, { backgroundColor: `${colors.semantic.error}15` }]}
                  onPress={handleRemoveReceipt}
                >
                  <Trash2 size={16} color={colors.semantic.error} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.attachmentBox}
              onPress={() => setPickerModalOpen(true)}
              activeOpacity={0.7}
            >
              <Upload size={22} color={colors.primary} />
              <Text style={styles.attachPlaceholderText}>Attach Scanned Tax Receipt / Bill</Text>
              <Text style={styles.attachSubText}>Supports JPG, PNG, PDF up to 10 MB</Text>
            </TouchableOpacity>
          )}

          <Button
            title="Submit Expense Claim"
            variant="primary"
            loading={isSubmitting}
            onPress={handleLodgeClaim}
            style={{ marginTop: spacing.lg }}
          />
        </Card>
      </ScrollView>

      <Modal visible={pickerModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Document / Receipt</Text>
              <TouchableOpacity onPress={() => setPickerModalOpen(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.pickerSub}>Select a sample verified receipt from device storage:</Text>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => handlePickReceipt('HPCL_Fuel_Bhilwara_Bill_4850.jpg', 320)}
            >
              <FileText size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerOptName}>HPCL_Fuel_Bhilwara_Bill_4850.jpg</Text>
                <Text style={styles.pickerOptMeta}>320 KB • Image Receipt</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => handlePickReceipt('Hotel_Regency_Lodging_Tax_Invoice.pdf', 680)}
            >
              <FileText size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerOptName}>Hotel_Regency_Lodging_Tax_Invoice.pdf</Text>
                <Text style={styles.pickerOptMeta}>680 KB • GST Tax Invoice</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => handlePickReceipt('Field_Sample_Boxes_Hardware_CashMemo.jpg', 245)}
            >
              <FileText size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerOptName}>Field_Sample_Boxes_Hardware_CashMemo.jpg</Text>
                <Text style={styles.pickerOptMeta}>245 KB • Vendor Cash Memo</Text>
              </View>
            </TouchableOpacity>

            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setPickerModalOpen(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={previewModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.previewModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Preview</Text>
              <TouchableOpacity onPress={() => setPreviewModalOpen(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.previewBox}>
              <CheckCircle2 size={44} color={colors.semantic.success} />
              <Text style={styles.previewDocTitle}>{attachedReceipt?.name}</Text>
              <Text style={styles.previewDocMeta}>
                {attachedReceipt?.type} • {attachedReceipt ? (attachedReceipt.size / 1024).toFixed(1) : 0} KB
              </Text>
              <Text style={styles.previewNotice}>
                Valid digital voucher attached to claim payload.
              </Text>
            </View>

            <Button
              title="Close Preview"
              variant="secondary"
              onPress={() => setPreviewModalOpen(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.md,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  catChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  charCountText: {
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  projectChips: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: spacing.xs,
  },
  projChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  projChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  projChipText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  projChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inlineError: {
    fontSize: 11,
    color: colors.semantic.error,
    marginTop: 2,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.semantic.error}15`,
    borderColor: `${colors.semantic.error}40`,
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  errorAlertText: {
    ...typography.caption,
    color: colors.semantic.error,
    fontWeight: '600',
    flex: 1,
  },
  attachmentBox: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  attachPlaceholderText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  attachSubText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  attachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  attachedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  attachedName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  attachedMeta: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  attachedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  attachedIconBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  pickerModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 420,
    padding: spacing.md,
  },
  previewModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  pickerSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pickerOptName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pickerOptMeta: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  previewBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  previewDocTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  previewDocMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  previewNotice: {
    fontSize: 11,
    color: colors.semantic.success,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
});
