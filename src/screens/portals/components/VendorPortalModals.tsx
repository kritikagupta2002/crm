import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { X, FileText } from 'lucide-react-native';
import { Button } from '../../../components';
import { colors, spacing } from '../../../theme';
import { WorkOrder, Tender } from '../../../types';
import { styles } from './vendorPortalStyles';

interface VendorPortalModalsProps {
  accountModalVisible: boolean;
  setAccountModalVisible: (v: boolean) => void;
  currentVendor: any;

  deliveryModalVisible: boolean;
  setDeliveryModalVisible: (v: boolean) => void;
  selectedWoForDelivery: WorkOrder | null;
  deliveryNotes: string;
  setDeliveryNotes: (v: string) => void;
  attachedFiles: string[];
  setAttachedFiles: (files: string[]) => void;
  handleSubmitDelivery: () => void;

  billingModalVisible: boolean;
  setBillingModalVisible: (v: boolean) => void;
  selectedWoForBilling: WorkOrder | null;
  invoiceNo: string;
  setInvoiceNo: (v: string) => void;
  billAmount: string;
  setBillAmount: (v: string) => void;
  billRemarks: string;
  setBillRemarks: (v: string) => void;
  handleSubmitBill: () => void;

  askModalVisible: boolean;
  setAskModalVisible: (v: boolean) => void;
  selectedTenderForAsk: Tender | null;
  questionText: string;
  setQuestionText: (v: string) => void;
  handleSubmitClarification: () => void;
}

export const VendorPortalModals: React.FC<VendorPortalModalsProps> = ({
  accountModalVisible,
  setAccountModalVisible,
  currentVendor,
  deliveryModalVisible,
  setDeliveryModalVisible,
  selectedWoForDelivery,
  deliveryNotes,
  setDeliveryNotes,
  attachedFiles,
  setAttachedFiles,
  handleSubmitDelivery,
  billingModalVisible,
  setBillingModalVisible,
  selectedWoForBilling,
  invoiceNo,
  setInvoiceNo,
  billAmount,
  setBillAmount,
  billRemarks,
  setBillRemarks,
  handleSubmitBill,
  askModalVisible,
  setAskModalVisible,
  selectedTenderForAsk,
  questionText,
  setQuestionText,
  handleSubmitClarification,
}) => {
  return (
    <>
      <Modal visible={accountModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Contractor Profile</Text>
                <Text style={styles.modalSub}>Verified Banking & Compliance Record</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAccountModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>FIRM IDENTITY</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Vendor Code</Text>
                  <Text style={styles.profileVal}>{currentVendor.id}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Legal Firm Name</Text>
                  <Text style={styles.profileVal}>{currentVendor.name}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>PAN Card</Text>
                  <Text style={styles.profileVal}>{currentVendor.pan}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>GSTIN</Text>
                  <Text style={styles.profileVal}>{currentVendor.gstin}</Text>
                </View>
                {(currentVendor as any).msmeRegistrationNo || (currentVendor as any).msme ? (
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>MSME Reg. No</Text>
                    <Text style={styles.profileVal}>
                      {(currentVendor as any).msmeRegistrationNo || (currentVendor as any).msme}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>BANKING DETAILS (FOR ELECTRONIC RTGS/NEFT)</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Bank Name</Text>
                  <Text style={styles.profileVal}>
                    {(currentVendor as any).bankDetails?.bankName || (currentVendor as any).bank?.name}
                  </Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Account Number</Text>
                  <Text style={styles.profileVal}>
                    {'•'.repeat(8)}
                    {((currentVendor as any).bankDetails?.accountNumber || (currentVendor as any).bank?.accountNo)?.slice(-4) || '7890'}
                  </Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>IFSC Code</Text>
                  <Text style={styles.profileVal}>
                    {(currentVendor as any).bankDetails?.ifscCode || (currentVendor as any).bank?.ifsc}
                  </Text>
                </View>
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>CONTACT PERSON</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Authorized Rep</Text>
                  <Text style={styles.profileVal}>{currentVendor.contactPerson}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Mobile</Text>
                  <Text style={styles.profileVal}>+91 {currentVendor.phone}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileVal}>{currentVendor.email}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="primary"
                onPress={() => setAccountModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deliveryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Fieldwork Delivery</Text>
                <Text style={styles.modalSub}>{selectedWoForDelivery?.woNumber}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDeliveryModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={styles.inputLabel}>Field Completion Notes *</Text>
              <TextInput
                style={[styles.textInput, { height: 80 }]}
                multiline
                placeholder="Describe completed boreholes, depths drilled, samples gathered, or test results..."
                placeholderTextColor={colors.text.tertiary}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
              />

              <Text style={styles.inputLabel}>Attached Field Proofs & Survey Sheets</Text>
              {attachedFiles.map((fn, idx) => (
                <View key={idx} style={styles.fileChipRow}>
                  <FileText size={14} color={colors.primary} />
                  <Text style={styles.fileNameText}>{fn}</Text>
                </View>
              ))}

              <Button
                title="Attach Additional Files"
                variant="outline"
                size="small"
                onPress={() =>
                  setAttachedFiles([
                    ...attachedFiles,
                    `Field_Data_Sheet_${Date.now().toString().slice(-4)}.csv`,
                  ])
                }
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setDeliveryModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Delivery"
                variant="primary"
                onPress={handleSubmitDelivery}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={billingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Submit Milestone Bill</Text>
                <Text style={styles.modalSub}>{selectedWoForBilling?.woNumber}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBillingModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={styles.inputLabel}>Tax Invoice Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. INV/2026/0124"
                placeholderTextColor={colors.text.tertiary}
                value={invoiceNo}
                onChangeText={setInvoiceNo}
              />

              <Text style={styles.inputLabel}>Billing Amount (₹) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="Amount in Rupees"
                placeholderTextColor={colors.text.tertiary}
                value={billAmount}
                onChangeText={setBillAmount}
              />

              {selectedWoForBilling && (
                <Text style={styles.ceilingHint}>
                  Remaining Contract Ceiling: ₹
                  {(
                    selectedWoForBilling.contractValue -
                    (selectedWoForBilling.paidAmount || 0)
                  ).toLocaleString('en-IN')}
                </Text>
              )}

              <Text style={styles.inputLabel}>Remarks / Milestone Reference</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                multiline
                placeholder="Milestone description or payment reference notes..."
                placeholderTextColor={colors.text.tertiary}
                value={billRemarks}
                onChangeText={setBillRemarks}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setBillingModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Lodge Bill"
                variant="primary"
                onPress={handleSubmitBill}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={askModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ask Pre-Bid Clarification</Text>
                <Text style={styles.modalSub}>{selectedTenderForAsk?.tenderNo}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAskModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <Text style={styles.inputLabel}>Your Technical Query *</Text>
              <TextInput
                style={[styles.textInput, { height: 100 }]}
                multiline
                placeholder="Please state specific clause, BOQ item, or soil depth clarification..."
                placeholderTextColor={colors.text.tertiary}
                value={questionText}
                onChangeText={setQuestionText}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setAskModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Send Query"
                variant="primary"
                onPress={handleSubmitClarification}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
