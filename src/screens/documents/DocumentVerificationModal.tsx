import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Alert } from 'react-native';
import { useAuth, useCrm } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Button, Input } from '../../components';
import { DocumentItem } from '../../types';
import { ShieldAlert, ShieldCheck } from 'lucide-react-native';

interface DocumentVerificationModalProps {
  visible: boolean;
  document: DocumentItem | null;
  onClose: () => void;
  onVerified: () => void;
}

export const DocumentVerificationModal: React.FC<DocumentVerificationModalProps> = ({
  visible,
  document,
  onClose,
  onVerified,
}) => {
  const { session } = useAuth();
  const { verifyDocument } = useCrm();

  const [remarks, setRemarks] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!document) return null;

  const currentUserId = session?.accountType === 'team' ? (session as any).employeeId : 'UNKNOWN';
  const currentUserName = session?.accountType === 'team' ? (session as any).name : 'Active User';

  const isSelfUpload = document.uploadedBy === currentUserId;

  const handleVerify = async () => {
    if (isSelfUpload) {
      Alert.alert(
        'Four-Eyes Principle Violation',
        'Corporate compliance prohibits employees from verifying documents they uploaded themselves. Another authorized team member or Director must verify this document.'
      );
      return;
    }

    if (!remarks.trim()) {
      Alert.alert('Remarks Required', 'Please enter verification remarks certifying document authenticity.');
      return;
    }

    try {
      setIsVerifying(true);
      await verifyDocument(document.id, currentUserId, currentUserName, remarks.trim());
      Alert.alert('Document Verified', `${document.title} has been authenticated under compliance standards.`);
      onVerified();
      onClose();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Error occurred while verifying document.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal statusBarTranslucent visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ShieldCheck size={28} color={isSelfUpload ? colors.semantic.danger : colors.primary} />
            <Text style={styles.title}>Document Verification</Text>
          </View>

          <Text style={styles.docTitle}>{document.title}</Text>
          <Text style={styles.docMeta}>
            Doc #: {document.docNo} • Category: {document.category}
          </Text>
          <Text style={styles.docUploader}>
            Uploaded by: <Text style={{ fontWeight: '700' }}>{document.uploaderName}</Text> ({document.uploadedBy})
          </Text>

          {isSelfUpload ? (
            <View style={styles.errorBox}>
              <ShieldAlert size={20} color={colors.semantic.danger} />
              <View style={styles.errorTextWrap}>
                <Text style={styles.errorTitle}>Four-Eyes Principle Safeguard</Text>
                <Text style={styles.errorDesc}>
                  You cannot verify this record because you are recorded as the original uploader ({document.uploaderName}).
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <Input
                label="Compliance Verification Remarks"
                placeholder="Certify that original stamped copy was cross-checked..."
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title="Close"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            {!isSelfUpload && (
              <Button
                title="Verify Document"
                variant="primary"
                loading={isVerifying}
                onPress={handleVerify}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  docTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  docMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  docUploader: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: `${colors.semantic.danger}15`,
    borderColor: colors.semantic.danger,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  errorTextWrap: {
    flex: 1,
  },
  errorTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.semantic.danger,
    marginBottom: 2,
  },
  errorDesc: {
    ...typography.caption,
    color: colors.text.primary,
  },
  form: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
