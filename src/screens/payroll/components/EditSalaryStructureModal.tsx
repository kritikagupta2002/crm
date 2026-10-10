import React from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';
import { Button } from '../../../components/common';
import { colors, spacing } from '../../../theme';
import { SalaryStructure } from '../../../types';
import { styles } from './payrollStyles';

interface EditSalaryStructureModalProps {
  editingStructure: SalaryStructure | null;
  onClose: () => void;
  editBasic: string;
  setEditBasic: (val: string) => void;
  editHra: string;
  setEditHra: (val: string) => void;
  editConveyance: string;
  setEditConveyance: (val: string) => void;
  editSpecial: string;
  setEditSpecial: (val: string) => void;
  editSite: string;
  setEditSite: (val: string) => void;
  editPt: string;
  setEditPt: (val: string) => void;
  editTds: string;
  setEditTds: (val: string) => void;
  editError: string | null;
  isSavingStructure: boolean;
  computedEditGross: number;
  computedEditEpf: number;
  computedEditEsi: number;
  computedEditDeductions: number;
  computedEditNet: number;
  onSaveStructure: () => void;
}

export const EditSalaryStructureModal: React.FC<EditSalaryStructureModalProps> = ({
  editingStructure,
  onClose,
  editBasic,
  setEditBasic,
  editHra,
  setEditHra,
  editConveyance,
  setEditConveyance,
  editSpecial,
  setEditSpecial,
  editSite,
  setEditSite,
  editPt,
  setEditPt,
  editTds,
  setEditTds,
  editError,
  isSavingStructure,
  computedEditGross,
  computedEditEpf,
  computedEditEsi,
  computedEditDeductions,
  computedEditNet,
  onSaveStructure,
}) => {
  return (
    <Modal statusBarTranslucent
      visible={!!editingStructure}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Adjust Compensation</Text>
              <Text style={styles.modalSubtitle}>
                {editingStructure?.employeeName} ({editingStructure?.employeeId})
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {editError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={colors.semantic.danger} />
                <Text style={styles.errorText}>{editError}</Text>
              </View>
            ) : null}

            <Text style={styles.modalSectionTitle}>MONTHLY EARNINGS (₹)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Basic Salary</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={editBasic}
                onChangeText={setEditBasic}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>House Rent Allowance (HRA)</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={editHra}
                onChangeText={setEditHra}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Conveyance Allowance</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={editConveyance}
                onChangeText={setEditConveyance}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Allowance</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={editSpecial}
                onChangeText={setEditSpecial}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Site / Field Duty Allowance</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={editSite}
                onChangeText={setEditSite}
              />
            </View>

            <Text style={[styles.modalSectionTitle, { marginTop: spacing.md }]}>
              STATUTORY DEDUCTIONS (₹)
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Professional Tax (PT)</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={editPt}
                onChangeText={setEditPt}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tax Deducted at Source (TDS)</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={editTds}
                onChangeText={setEditTds}
              />
            </View>

            <View style={styles.computedBox}>
              <Text style={styles.computedTitle}>CALCULATED COMPENSATION</Text>
              <View style={styles.computedRow}>
                <Text style={styles.computedLabel}>Gross Monthly:</Text>
                <Text style={styles.computedVal}>₹{computedEditGross.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.computedRow}>
                <Text style={styles.computedLabel}>EPF Contribution (12%):</Text>
                <Text style={styles.computedVal}>₹{computedEditEpf.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.computedRow}>
                <Text style={styles.computedLabel}>ESI Contribution:</Text>
                <Text style={styles.computedVal}>₹{computedEditEsi.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.computedRow}>
                <Text style={styles.computedLabel}>Total Deductions:</Text>
                <Text style={[styles.computedVal, { color: colors.semantic.danger }]}>
                  -₹{computedEditDeductions.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.computedRow, styles.computedRowNet]}>
                <Text style={styles.computedNetLabel}>Net Take-Home:</Text>
                <Text style={styles.computedNetVal}>₹{computedEditNet.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Save Structure"
              variant="primary"
              loading={isSavingStructure}
              onPress={onSaveStructure}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
