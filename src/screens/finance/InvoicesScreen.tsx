import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
  Share,
  Switch,
} from 'react-native';
import { useFinance, useAuth, useCrm } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  AppHeader,
  Card,
  StatusBadge,
  Button,
  Input,
  EmptyState,
  InvoiceQrCode,
} from '../../components';
import { FinanceInvoice, Client, InvoiceItem } from '../../types';
import { generateInvoiceUpiLink, COMPANY_BANK_DETAILS } from '../../utils/payments';
import { formatDate } from '../../utils/date';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Receipt,
  Search,
  Plus,
  IndianRupee,
  Calendar,
  Share2,
  CheckCircle2,
  Eye,
  X,
  Building,
  CreditCard,
  QrCode,
  Trash2,
  ArrowUpRight,
  Clock,
} from 'lucide-react-native';

const statusOptions = ['All', 'Paid', 'Pending', 'Partially Paid', 'Overdue', 'Draft'];
const invoiceKeyExtractor = (item: FinanceInvoice) => item.id;

export const InvoicesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { invoices, createInvoice, updateInvoiceStatus } = useFinance();
  const { clients } = useCrm();
  const { hasRole } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(null);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [isInterState, setIsInterState] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [notes, setNotes] = useState('Payment by RTGS/NEFT to HDFC Bank Jaipur Corporate Account.');
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      description: 'Diamond Core Drilling Logging & Core Sampling',
      quantity: 500,
      unitRate: 850,
      amount: 425000,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = hasRole(['Admin', 'Accountant', 'admin', 'accountant']);

  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      const firstActive = clients.find((c) => c.contractStatus === 'Active' || (c as any).status === 'Active');
      if (firstActive) {
        setSelectedClientId(firstActive.id);
        if (firstActive.state && firstActive.state.toLowerCase() !== 'rajasthan') {
          setIsInterState(true);
        }
      }
    }
  }, [clients, selectedClientId]);

  const activeClients = useMemo(() => {
    return clients.filter((c) => c.contractStatus === 'Active' || (c as any).status === 'Active');
  }, [clients]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const c = clients.find((item) => item.id === clientId);
    if (c) {
      if (c.state && c.state.toLowerCase() !== 'rajasthan') {
        setIsInterState(true);
      } else {
        setIsInterState(false);
      }
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: string | number) => {
    const next = [...lineItems];
    const current = { ...next[index], [field]: val };
    if (field === 'quantity' || field === 'unitRate') {
      const q = field === 'quantity' ? Number(val) : current.quantity;
      const r = field === 'unitRate' ? Number(val) : current.unitRate;
      current.amount = (q || 0) * (r || 0);
    }
    next[index] = current;
    setLineItems(next);

    const totalBase = next.reduce((sum, it) => sum + (it.amount || 0), 0);
    setBaseAmount(String(totalBase));
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unitRate: 10000,
        amount: 10000,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    const next = lineItems.filter((_, i) => i !== index);
    setLineItems(next);
    const totalBase = next.reduce((sum, it) => sum + (it.amount || 0), 0);
    setBaseAmount(String(totalBase));
  };

  const computedBase =
    lineItems.length > 0
      ? lineItems.reduce((sum, it) => sum + (it.amount || 0), 0)
      : parseFloat(baseAmount) || 0;

  const computedGst = Math.round((computedBase * taxRate) / 100);
  const computedTotal = computedBase + computedGst;

  const filteredInvoices = useMemo(() => {
    const s = search.toLowerCase();
    const st = selectedStatus.toLowerCase();
    return invoices.filter((inv) => {
      const invNo = (inv.invoiceNo || inv.invoiceNumber || '').toLowerCase();
      const clName = (inv.clientName || '').toLowerCase();
      const prj = (inv.projectTitle || '').toLowerCase();
      const matchesSearch = !s || invNo.includes(s) || clName.includes(s) || prj.includes(s);

      const matchesStatus =
        selectedStatus === 'All' ||
        inv.status.toLowerCase() === st ||
        (selectedStatus === 'Pending' && inv.status === 'Unpaid');

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, selectedStatus]);

  const totalInvoicedAmount = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    [invoices]
  );
  const pendingReceivablesAmount = useMemo(
    () => invoices.filter((i) => i.status !== 'Paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    [invoices]
  );
  const clearedPaidAmount = useMemo(
    () => invoices.filter((i) => i.status === 'Paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    [invoices]
  );

  const handleCreateInvoice = async () => {
    if (!selectedClientId) {
      Alert.alert('Validation Error', 'Please select an active commercial client.');
      return;
    }

    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) {
      Alert.alert('Validation Error', 'Selected client not found in CRM client directory.');
      return;
    }

    if (client.contractStatus !== 'Active' && (client as any).status !== 'Active') {
      Alert.alert('Inactive Client', `Client "${client.name}" is inactive. Invoices can only be issued to active clients.`);
      return;
    }

    if (computedBase <= 0) {
      Alert.alert('Validation Error', 'Base taxable amount must be strictly greater than ₹0.');
      return;
    }

    if (!projectTitle.trim()) {
      Alert.alert('Validation Error', 'Please specify the project title or exploration scope.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createInvoice({
        clientId: client.id,
        clientName: client.name,
        clientGstin: client.gstin,
        clientEmail: client.email,
        billingAddress: client.billingAddress,
        projectTitle: projectTitle.trim(),
        baseAmount: computedBase,
        preTaxAmount: computedBase,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        taxRate,
        isInterState,
        items: lineItems,
        paymentTerms,
        notes,
      });

      setShowAddModal(false);
      setProjectTitle('');
      Alert.alert(
        'Invoice Generated',
        `Tax Invoice ${created.invoiceNo} generated for ₹${created.totalAmount.toLocaleString(
          'en-IN'
        )}. Double-entry Sales Journal voucher posted.`
      );
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Could not create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = useCallback(
    async (inv: FinanceInvoice) => {
      Alert.alert(
        'Confirm Receipt',
        `Mark Invoice ${inv.invoiceNo} as Paid? This will record ₹${inv.totalAmount.toLocaleString(
          'en-IN'
        )} as received and post a Bank Receipt Voucher.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Paid',
            style: 'default',
            onPress: async () => {
              try {
                await updateInvoiceStatus(inv.id, 'Paid');
                if (selectedInvoice && selectedInvoice.id === inv.id) {
                  setSelectedInvoice({ ...selectedInvoice, status: 'Paid', paidAmount: selectedInvoice.totalAmount });
                }
                Alert.alert('Status Updated', `Invoice ${inv.invoiceNo} marked as Paid.`);
              } catch (e: any) {
                Alert.alert('Error', e.message || 'Failed to update invoice status.');
              }
            },
          },
        ]
      );
    },
    [updateInvoiceStatus, selectedInvoice]
  );

  const handleShareDocument = useCallback(async (inv: FinanceInvoice) => {
    try {
      const summary =
        `TAX INVOICE: ${inv.invoiceNo}\n` +
        `Bansal Geo Services Pvt Ltd (GSTIN: ${COMPANY_BANK_DETAILS.gstin})\n\n` +
        `Billed To: ${inv.clientName}\n` +
        (inv.clientGstin ? `GSTIN: ${inv.clientGstin}\n` : '') +
        `Project: ${inv.projectTitle}\n` +
        `Dated: ${inv.date} | Due: ${inv.dueDate}\n\n` +
        `Taxable Base: ₹${inv.baseAmount.toLocaleString('en-IN')}\n` +
        (inv.igst > 0
          ? `IGST (18%): ₹${inv.igst.toLocaleString('en-IN')}\n`
          : `CGST (9%): ₹${inv.cgst.toLocaleString('en-IN')}\nSGST (9%): ₹${inv.sgst.toLocaleString(
              'en-IN'
            )}\n`) +
        `Total Invoice Due: ₹${inv.totalAmount.toLocaleString('en-IN')}\n` +
        `Status: ${inv.status}\n\n` +
        `Remittance UPI: ${COMPANY_BANK_DETAILS.upiId}\n` +
        `Bank: ${COMPANY_BANK_DETAILS.bankName} | A/C: ${COMPANY_BANK_DETAILS.accountNumber} | IFSC: ${COMPANY_BANK_DETAILS.ifscCode}`;

      await Share.share({
        title: `Invoice ${inv.invoiceNo} - Bansal Geo`,
        message: summary,
      });
    } catch (e: any) {
      console.error('Share error:', e);
    }
  }, []);

  const renderInvoiceCard = ({ item }: { item: FinanceInvoice }) => {
    const isInterStateSupply = item.igst > 0;
    const taxLabel = isInterStateSupply ? `IGST (18%)` : `CGST (9%) + SGST (9%)`;
    const taxVal = item.igst > 0 ? item.igst : item.cgst + item.sgst;

    return (
      <Card style={styles.card} onPress={() => setSelectedInvoice(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.invNumberWrap}>
            <Text style={styles.invNumber}>{item.invoiceNo}</Text>
            {isInterStateSupply ? (
              <View style={styles.interStateTag}>
                <Text style={styles.interStateText}>Inter-State</Text>
              </View>
            ) : (
              <View style={styles.intraStateTag}>
                <Text style={styles.intraStateText}>Intra-State</Text>
              </View>
            )}
          </View>
          <StatusBadge status={item.status} size="small" />
        </View>

        <Text style={styles.clientName}>{item.clientName}</Text>
        {item.clientGstin && <Text style={styles.gstinText}>GSTIN: {item.clientGstin}</Text>}
        <Text style={styles.projectTitle} numberOfLines={1}>
          {item.projectTitle}
        </Text>

        <View style={styles.finGrid}>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>TAXABLE BASE</Text>
            <Text style={styles.finValue}>₹{item.baseAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>TAX (GST)</Text>
            <Text style={styles.finValue}>₹{taxVal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>TOTAL DUE</Text>
            <Text style={[styles.finValue, { color: colors.primary, fontWeight: '700' }]}>
              ₹{item.totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.datesRow}>
            <Text style={styles.dateText}>
              Dated: {formatDate(item.date || item.invoiceDate || (item as any).createdAt) || '—'}
            </Text>
            <Text style={styles.dateText}>
              Due: {formatDate(item.dueDate || (item as any).due_date) || '—'}
            </Text>
          </View>
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.qrBtn}
              onPress={() => setSelectedInvoice(item)}
            >
              <QrCode size={14} color={colors.primary} />
              <Text style={styles.qrBtnText}>QR</Text>
            </TouchableOpacity>
            {canManage && item.status !== 'Paid' && (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => handleMarkPaid(item)}
              >
                <Text style={styles.payBtnText}>Mark Paid</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Client Tax Invoices"
        subtitle="Accounts receivable, GST invoicing & remittance QR"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          canManage ? (
            <TouchableOpacity
              style={styles.addHeaderBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addHeaderText}>New Invoice</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by invoice #, client, project..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterScroll}
      >
        {statusOptions.map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, selectedStatus === st && styles.filterChipActive]}
            onPress={() => setSelectedStatus(st)}
          >
            <Text
              style={[styles.filterChipText, selectedStatus === st && styles.filterChipTextActive]}
            >
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredInvoices}
        keyExtractor={invoiceKeyExtractor}
        renderItem={renderInvoiceCard}
        ListHeaderComponent={
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiCardTotal]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxTotal]}>
                    <Receipt size={16} color="#0284c7" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeTotal}>
                    <Text style={styles.kpiBadgeTextTotal}>18% GST</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={styles.kpiValText}>₹{(totalInvoicedAmount / 100000).toFixed(1)} L</Text>
                  <ArrowUpRight size={15} color="#0284c7" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Total Invoiced</Text>
                <Text style={styles.kpiSubText}>Gross sales ledger</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardPending]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPending]}>
                    <Clock size={16} color="#ea580c" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePending}>
                    <Text style={styles.kpiBadgeTextPending}>Urgent</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#ea580c' }]}>
                    ₹{(pendingReceivablesAmount / 100000).toFixed(1)} L
                  </Text>
                  <ArrowUpRight size={15} color="#ea580c" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Receivables Due</Text>
                <Text style={styles.kpiSubText}>Pending collections</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiCardPaid]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPaid]}>
                    <CheckCircle2 size={16} color="#16a34a" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgePaid}>
                    <Text style={styles.kpiBadgeTextPaid}>Received</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#16a34a' }]}>
                    ₹{(clearedPaidAmount / 100000).toFixed(1)} L
                  </Text>
                  <ArrowUpRight size={15} color="#16a34a" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Cleared Remittance</Text>
                <Text style={styles.kpiSubText}>Bank settled receipts</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardCount]}>
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxCount]}>
                    <CreditCard size={16} color="#7c3aed" strokeWidth={2.4} />
                  </View>
                  <View style={styles.kpiBadgeCount}>
                    <Text style={styles.kpiBadgeTextCount}>Active</Text>
                  </View>
                </View>
                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValText, { color: '#7c3aed' }]}>{invoices.length}</Text>
                  <ArrowUpRight size={15} color="#7c3aed" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiTitleText}>Tax Invoices</Text>
                <Text style={styles.kpiSubText}>All corporate ledgers</Text>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 32, 60) }]}
        ListEmptyComponent={
          <EmptyState
            title="No Invoices Found"
            message={
              search
                ? 'No invoices match your search criteria.'
                : 'No client tax invoices recorded in the ledger.'
            }
            icon={<Receipt size={40} color={colors.text.tertiary} />}
          />
        }
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Issue Exploration Tax Invoice</Text>
                <Text style={styles.modalSub}>
                  GST-compliant invoice with line items & auto-sales journal
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.formSectionTitle}>1. ACTIVE CLIENT (CRM DATA)</Text>
              <View style={styles.clientPickerContainer}>
                {activeClients.length === 0 ? (
                  <Text style={styles.noActiveClientsText}>
                    No active clients found in CRM. Invoices require an active contract.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientChipsScroll}>
                    {activeClients.map((cl) => {
                      const isSelected = cl.id === selectedClientId;
                      return (
                        <TouchableOpacity
                          key={cl.id}
                          style={[styles.clientChip, isSelected && styles.clientChipActive]}
                          onPress={() => handleClientChange(cl.id)}
                        >
                          <Text
                            style={[styles.clientChipText, isSelected && styles.clientChipTextActive]}
                          >
                            {cl.name}
                          </Text>
                          <Text
                            style={[styles.clientChipSub, isSelected && styles.clientChipSubActive]}
                          >
                            {cl.state} • {cl.contractStatus}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              <Text style={styles.formSectionTitle}>2. PROJECT & TAX NATURE</Text>
              <Input
                label="Project Exploration Scope"
                placeholder="e.g. Bhilwara Lead-Zinc Exploration Phase 2"
                value={projectTitle}
                onChangeText={setProjectTitle}
              />

              <View style={styles.taxToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Inter-State Supply (IGST 18%)</Text>
                  <Text style={styles.toggleSub}>
                    {isInterState ? 'IGST 18% applies (Outside Rajasthan)' : 'CGST 9% + SGST 9% applies (Rajasthan)'}
                  </Text>
                </View>
                <Switch
                  value={isInterState}
                  onValueChange={setIsInterState}
                  trackColor={{ false: '#CBD5E1', true: colors.primary }}
                />
              </View>

              <View style={styles.lineItemHeaderRow}>
                <Text style={styles.formSectionTitle}>3. LINE ITEMS (SERVICES)</Text>
                <TouchableOpacity onPress={handleAddLineItem} style={styles.addItemBtn}>
                  <Plus size={14} color={colors.primary} />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {lineItems.map((item, idx) => (
                <View key={item.id} style={styles.lineItemCard}>
                  <Input
                    placeholder="Description (e.g. Core drilling logging)"
                    value={item.description}
                    onChangeText={(v) => handleItemChange(idx, 'description', v)}
                  />
                  <View style={styles.qtyRateRow}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Qty"
                        keyboardType="numeric"
                        value={String(item.quantity)}
                        onChangeText={(v) => handleItemChange(idx, 'quantity', v)}
                      />
                    </View>
                    <View style={{ flex: 2 }}>
                      <Input
                        label="Unit Rate (₹)"
                        keyboardType="numeric"
                        value={String(item.unitRate)}
                        onChangeText={(v) => handleItemChange(idx, 'unitRate', v)}
                      />
                    </View>
                    <View style={styles.itemTotalCol}>
                      <Text style={styles.itemTotalLabel}>Amount</Text>
                      <Text style={styles.itemTotalVal}>₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    {lineItems.length > 1 && (
                      <TouchableOpacity
                        style={styles.delItemBtn}
                        onPress={() => handleRemoveLineItem(idx)}
                      >
                        <Trash2 size={16} color={colors.semantic.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.computationBox}>
                <View style={styles.compRow}>
                  <Text style={styles.compLabel}>Taxable Base:</Text>
                  <Text style={styles.compVal}>₹{computedBase.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.compRow}>
                  <Text style={styles.compLabel}>
                    GST ({taxRate}% {isInterState ? 'IGST' : 'CGST+SGST'}):
                  </Text>
                  <Text style={styles.compVal}>₹{computedGst.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.compRow, styles.compTotalRow]}>
                  <Text style={styles.compTotalLabel}>Total Invoice Amount:</Text>
                  <Text style={styles.compTotalVal}>₹{computedTotal.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Generate Invoice"
                  onPress={handleCreateInvoice}
                  loading={isSubmitting}
                  style={{ flex: 2 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {selectedInvoice && (
        <Modal
          visible={!!selectedInvoice}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setSelectedInvoice(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '94%', paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedInvoice.invoiceNo}</Text>
                  <Text style={styles.modalSub}>Official Tax Invoice Document</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.detailDocContent,
                  { paddingBottom: Math.max(insets.bottom + 32, 48) },
                ]}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.docCompanyHeader}>
                  <Text style={styles.docCompanyName}>BANSAL GEO SERVICES PVT LTD</Text>
                  <Text style={styles.docCompanySub}>Jaipur Corporate HQ, C-Scheme, Jaipur, Rajasthan</Text>
                  <Text style={styles.docCompanyGstin}>GSTIN: {COMPANY_BANK_DETAILS.gstin} | PAN: {COMPANY_BANK_DETAILS.pan}</Text>
                </View>

                <View style={styles.docBillTo}>
                  <Text style={styles.billToLabel}>BILLED TO:</Text>
                  <Text style={styles.billToName}>{selectedInvoice.clientName}</Text>
                  {selectedInvoice.clientGstin && (
                    <Text style={styles.billToGstin}>GSTIN: {selectedInvoice.clientGstin}</Text>
                  )}
                  {selectedInvoice.billingAddress && (
                    <Text style={styles.billToAddress}>{selectedInvoice.billingAddress}</Text>
                  )}
                  <Text style={styles.docProjectTitle}>Project: {selectedInvoice.projectTitle}</Text>
                  <View style={styles.docDatesRow}>
                    <Text style={styles.docDate}>
                      Invoice Date: {formatDate(selectedInvoice.date || selectedInvoice.invoiceDate || (selectedInvoice as any).createdAt) || '—'}
                    </Text>
                    <Text style={styles.docDate}>
                      Due Date: {formatDate(selectedInvoice.dueDate || (selectedInvoice as any).due_date) || '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.tableBox}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHCell, { flex: 2 }]}>Service Item</Text>
                    <Text style={[styles.tableHCell, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.tableHCell, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                    <Text style={[styles.tableHCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                  </View>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((it, idx) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{it.description}</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{it.quantity}</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                          ₹{it.unitRate.toLocaleString('en-IN')}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>
                          ₹{it.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{selectedInvoice.projectTitle}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>1</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                        ₹{selectedInvoice.baseAmount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>
                        ₹{selectedInvoice.baseAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.docTotalsBox}>
                  <View style={styles.docTotRow}>
                    <Text style={styles.docTotLabel}>Pre-Tax Subtotal:</Text>
                    <Text style={styles.docTotVal}>₹{selectedInvoice.baseAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  {selectedInvoice.igst > 0 ? (
                    <View style={styles.docTotRow}>
                      <Text style={styles.docTotLabel}>Integrated GST (IGST 18%):</Text>
                      <Text style={styles.docTotVal}>₹{selectedInvoice.igst.toLocaleString('en-IN')}</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.docTotRow}>
                        <Text style={styles.docTotLabel}>Central GST (CGST 9%):</Text>
                        <Text style={styles.docTotVal}>₹{selectedInvoice.cgst.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.docTotRow}>
                        <Text style={styles.docTotLabel}>State GST (SGST 9%):</Text>
                        <Text style={styles.docTotVal}>₹{selectedInvoice.sgst.toLocaleString('en-IN')}</Text>
                      </View>
                    </>
                  )}
                  <View style={[styles.docTotRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>TOTAL INVOICE DUE:</Text>
                    <Text style={styles.grandTotalVal}>
                      ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.qrSectionCard}>
                  <Text style={styles.qrSectionTitle}>INSTANT UPI REMITTANCE QR</Text>
                  <Text style={styles.qrSectionSub}>
                    Scan with any Indian UPI app (BHIM / GPay / PhonePe / Paytm)
                  </Text>
                  <View style={styles.qrWrapper}>
                    <InvoiceQrCode
                      value={generateInvoiceUpiLink(
                        selectedInvoice.invoiceNo,
                        selectedInvoice.totalAmount,
                        selectedInvoice.clientName
                      )}
                      size={180}
                      darkColor="#0f2a3d"
                    />
                  </View>
                  <Text style={styles.upiIdText}>Payee VPA: {COMPANY_BANK_DETAILS.upiId}</Text>
                  <Text style={styles.bankDirectText}>
                    Direct RTGS/NEFT: {COMPANY_BANK_DETAILS.bankName} • A/C: {COMPANY_BANK_DETAILS.accountNumber} • IFSC: {COMPANY_BANK_DETAILS.ifscCode}
                  </Text>
                </View>

                <View style={styles.docActionButtons}>
                  <Button
                    title="Share / Print"
                    variant="outline"
                    icon={<Share2 size={16} color={colors.primary} />}
                    onPress={() => handleShareDocument(selectedInvoice)}
                    style={{ flex: 1 }}
                  />
                  {canManage && selectedInvoice.status !== 'Paid' && (
                    <Button
                      title="Mark as Paid"
                      icon={<CheckCircle2 size={16} color="#ffffff" />}
                      onPress={() => handleMarkPaid(selectedInvoice)}
                      style={{ flex: 1.2 }}
                    />
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterScrollView: {
    flexGrow: 0,
    marginBottom: spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    gap: spacing.xs,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  kpiGrid: {
    gap: 10,
    marginBottom: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 118,
  },
  kpiCardTotal: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbeafe',
  },
  kpiCardPending: {
    backgroundColor: '#fffaf5',
    borderColor: '#fed7aa',
  },
  kpiCardPaid: {
    backgroundColor: '#f5fdfb',
    borderColor: '#ccfbf1',
  },
  kpiCardCount: {
    backgroundColor: '#faf7ff',
    borderColor: '#f3e8ff',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxTotal: {
    backgroundColor: '#eff6ff',
  },
  kpiIconBoxPending: {
    backgroundColor: '#fff7ed',
  },
  kpiIconBoxPaid: {
    backgroundColor: '#f0fdf4',
  },
  kpiIconBoxCount: {
    backgroundColor: '#f5f3ff',
  },
  kpiBadgeTotal: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  kpiBadgeTextTotal: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgePending: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  kpiBadgeTextPending: {
    color: '#ea580c',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgePaid: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  kpiBadgeTextPaid: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgeCount: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
  },
  kpiBadgeTextCount: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiValText: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  kpiSubText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  invNumberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  invNumber: {
    ...typography.labelLarge,
    fontWeight: '700',
    color: colors.primary,
  },
  interStateTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  interStateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  intraStateTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  intraStateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  clientName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  gstinText: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  projectTitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  finGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
  },
  finItem: {
    flex: 1,
  },
  finLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  finValue: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  datesRow: {
    gap: 2,
  },
  dateText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: '#E0F2FE',
  },
  qrBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  payBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  addHeaderText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    width: '100%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.titleMedium,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalSub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  formContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  formSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
  },
  clientPickerContainer: {
    gap: spacing.xs,
  },
  noActiveClientsText: {
    ...typography.caption,
    color: colors.semantic.danger,
    fontStyle: 'italic',
  },
  clientChipsScroll: {
    flexDirection: 'row',
  },
  clientChip: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 140,
  },
  clientChipActive: {
    backgroundColor: '#F0FDFA',
    borderColor: colors.primary,
  },
  clientChipText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  clientChipTextActive: {
    color: colors.primary,
  },
  clientChipSub: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  clientChipSubActive: {
    color: colors.primary,
  },
  taxToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  toggleLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  toggleSub: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  lineItemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addItemText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  lineItemCard: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  qtyRateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  itemTotalCol: {
    flex: 1.5,
    alignItems: 'flex-end',
    paddingBottom: 8,
  },
  itemTotalLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  itemTotalVal: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
  },
  delItemBtn: {
    padding: 8,
  },
  computationBox: {
    backgroundColor: '#F0FDFA',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: spacing.xs,
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  compVal: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  compTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#99F6E4',
    paddingTop: spacing.xs,
    marginTop: 2,
  },
  compTotalLabel: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.primary,
  },
  compTotalVal: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  detailDocContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  docCompanyHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingBottom: spacing.sm,
  },
  docCompanyName: {
    ...typography.titleMedium,
    fontWeight: '800',
    color: colors.primary,
  },
  docCompanySub: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  docCompanyGstin: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  docBillTo: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 2,
  },
  billToLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
  },
  billToName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  billToGstin: {
    fontSize: 11,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  billToAddress: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  docProjectTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  docDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  docDate: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  tableBox: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    padding: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  tableHCell: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  tableRow: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  tableCell: {
    fontSize: 11,
    color: colors.text.primary,
  },
  docTotalsBox: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  docTotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  docTotLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  docTotVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    ...typography.bodyMedium,
    fontWeight: '800',
    color: colors.primary,
  },
  grandTotalVal: {
    ...typography.titleSmall,
    fontWeight: '800',
    color: colors.primary,
  },
  qrSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.xs,
  },
  qrSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  qrSectionSub: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  qrWrapper: {
    marginVertical: spacing.sm,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  upiIdText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  bankDirectText: {
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  docActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
