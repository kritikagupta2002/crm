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
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <Button
              title={cancelText}
              variant="outline"
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
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.md,
  },
  title: {
    fontSize: 16,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
