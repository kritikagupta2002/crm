import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { Button } from './Button';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <Button
              title={cancelText}
              variant="secondary"
              size="md"
              onPress={onCancel}
              disabled={loading}
              style={styles.cancelBtn}
            />
            <Button
              title={confirmText}
              variant={confirmVariant}
              size="md"
              onPress={onConfirm}
              loading={loading}
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 22,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
