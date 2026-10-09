import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useCrm, useAuth } from '../../context';
import { Tender, WorkOrder, SealedBid } from '../../types';
import { tenderPhase } from '../../constants/vendor';
import { VendorNavTab } from './components/VendorBottomNav';

export const useVendorPortal = () => {
  const { session, logout } = useAuth();
  const {
    tenders,
    workOrders,
    vendors,
    clarifications,
    savedTenders,
    toggleSavedTender,
    withdrawBid,
    startWorkOrder,
    deliverWorkOrder,
    billWorkOrder,
    askClarification,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<VendorNavTab>('home');
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [tenderSearch, setTenderSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  // Delivery Modal State
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [selectedWoForDelivery, setSelectedWoForDelivery] = useState<WorkOrder | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  // Billing Modal State
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [selectedWoForBilling, setSelectedWoForBilling] = useState<WorkOrder | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billRemarks, setBillRemarks] = useState('');

  // Pre-bid Clarification State
  const [askModalVisible, setAskModalVisible] = useState(false);
  const [selectedTenderForAsk, setSelectedTenderForAsk] = useState<Tender | null>(null);
  const [questionText, setQuestionText] = useState('');

  // Authenticated vendor identity normalization
  const vendorName =
    session?.accountType === 'vendor'
      ? (session as any).vendorName || (session as any).name || 'Apex Drilling & Coring Pvt Ltd'
      : 'Apex Drilling & Coring Pvt Ltd';

  const vendorCode =
    session?.accountType === 'vendor'
      ? (session as any).vendorId || (session as any).id || 'VND-2026-014'
      : 'VND-2026-014';

  const vendorCategory =
    session?.accountType === 'vendor' ? (session as any).category : 'Drilling Contractor';

  // Vendor keys set to ensure robust multi-key matching (id, vendorId, vendorCode)
  const vendorKeys = useMemo(() => {
    const keys = new Set<string>();
    if (vendorCode) keys.add(vendorCode);
    if ((session as any)?.id) keys.add((session as any).id);
    if ((session as any)?.vendorId) keys.add((session as any).vendorId);
    // If persona is Apex Drilling, also allow alias VN-01 / ven-001
    if (vendorName.toLowerCase().includes('apex') || vendorCode === 'VND-2026-014' || vendorCode === 'ven-001') {
      keys.add('ven-001');
      keys.add('VND-2026-014');
      keys.add('VN-01');
    }
    return keys;
  }, [vendorCode, vendorName, session]);

  // Current vendor profile record
  const currentVendor = useMemo(() => {
    const found = vendors.find(
      (v) =>
        vendorKeys.has(v.id) ||
        vendorKeys.has(v.vendorCode || '') ||
        v.name.toLowerCase() === vendorName.toLowerCase()
    );
    if (found) return found;

    return {
      id: vendorCode,
      vendorCode: vendorCode,
      name: vendorName,
      contact: 'Harish Mehta',
      contactPerson: 'Harish Mehta',
      phone: (session as any)?.mobile || '9811223344',
      email: 'accounts@apexdrilling.in',
      workCategory: vendorCategory || 'Core Drilling & Subcontracting',
      work: vendorCategory || 'Core Drilling & Subcontracting',
      rating: 4.8,
      approvalStatus: 'approved' as const,
      empanelledStatus: 'Active',
      pan: 'AAKFR4521M',
      gstin: '08AAKFR4521M1Z3',
      bankDetails: {
        accountNumber: '3844 1102 7781',
        ifscCode: 'SBIN0001124',
        bankName: 'State Bank of India, Udaipur',
      },
      bank: {
        accountNo: '3844 1102 7781',
        ifsc: 'SBIN0001124',
        name: 'State Bank of India, Udaipur',
      },
      msmeRegistrationNo: 'UDYAM-RJ-14-0012345',
      address: 'Plot 45, Vishwakarma Industrial Area, Jaipur, Rajasthan 302013',
    };
  }, [vendors, vendorKeys, vendorCode, vendorName, vendorCategory, session]);

  // STRICT DATA ISOLATION: Only work orders belonging to authenticated vendor
  const myWorkOrders = useMemo(() => {
    return workOrders.filter(
      (w) =>
        vendorKeys.has(w.vendorId) ||
        (w.vendor && w.vendor.toLowerCase() === vendorName.toLowerCase()) ||
        (w.vendorName && w.vendorName.toLowerCase() === vendorName.toLowerCase())
    );
  }, [workOrders, vendorKeys, vendorName]);

  // STRICT DATA ISOLATION: Only bids belonging to authenticated vendor
  const myBids = useMemo(() => {
    const list: { tender: Tender; bid: SealedBid }[] = [];
    tenders.forEach((t) => {
      const b = t.sealedBids.find(
        (bid) =>
          vendorKeys.has(bid.vendorId) ||
          (bid.vendorName && bid.vendorName.toLowerCase() === vendorName.toLowerCase())
      );
      if (b) {
        list.push({ tender: t, bid: b });
      }
    });
    return list;
  }, [tenders, vendorKeys, vendorName]);

  const openTenders = useMemo(() => {
    return tenders.filter((t) => tenderPhase(t) === 'Open');
  }, [tenders]);

  const freshTenders = useMemo(() => {
    return openTenders.filter((t) => !myBids.some((b) => b.tender.id === t.id));
  }, [openTenders, myBids]);

  const waitingOrders = useMemo(() => {
    return myWorkOrders.filter((w) =>
      ['Issued', 'Started', 'Delivered'].includes(w.currentStage)
    );
  }, [myWorkOrders]);

  const totalPaid = useMemo(() => {
    return myWorkOrders.reduce((sum, w) => sum + (w.paidAmount || 0), 0);
  }, [myWorkOrders]);

  const totalContract = useMemo(() => {
    return myWorkOrders.reduce((sum, w) => sum + (w.contractValue || 0), 0);
  }, [myWorkOrders]);

  // Mobilization / Start
  const handleStartWork = (wo: WorkOrder) => {
    Alert.alert(
      'Confirm Mobilization',
      `Confirm that fieldwork and equipment mobilization for ${wo.woNumber || wo.id} (${wo.projectTitle}) has officially commenced on site?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Start',
          onPress: async () => {
            try {
              await startWorkOrder(
                wo.id,
                'Mobilization confirmed by contractor via portal.'
              );
              Alert.alert(
                'Work Order Started',
                `Subcontract ${wo.woNumber || wo.id} is now in "Started" stage.`
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update stage');
            }
          },
        },
      ]
    );
  };

  // Delivery Dialog
  const handleOpenDelivery = (wo: WorkOrder) => {
    setSelectedWoForDelivery(wo);
    setDeliveryNotes('');
    setAttachedFiles(['Field_Survey_Log_v1.pdf', 'Core_Drilling_Lithology_Photos.pdf']);
    setDeliveryModalVisible(true);
  };

  const handleSubmitDelivery = async () => {
    if (!selectedWoForDelivery) return;
    if (!deliveryNotes.trim()) {
      Alert.alert(
        'Validation Error',
        'Please enter completion notes describing delivered fieldwork meterage.'
      );
      return;
    }
    try {
      await deliverWorkOrder(selectedWoForDelivery.id, {
        notes: deliveryNotes.trim(),
        files: attachedFiles.map((fn, idx) => ({
          id: `proof-${Date.now()}-${idx}`,
          name: fn,
          size: 2400000,
        })),
      });
      setDeliveryModalVisible(false);
      Alert.alert(
        'Delivery Submitted',
        'Your field deliverables and lithology sheets have been submitted to Project Management for review.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record delivery');
    }
  };

  // Milestone Billing Dialog
  const handleOpenBilling = (wo: WorkOrder) => {
    setSelectedWoForBilling(wo);
    setInvoiceNo(
      `APX-INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
    );
    const remainingCeiling = (wo.contractValue || 0) - (wo.paidAmount || 0);
    setBillAmount(
      String(Math.min(remainingCeiling, Math.round((wo.contractValue || 0) * 0.4)))
    );
    setBillRemarks('');
    setBillingModalVisible(true);
  };

  const handleSubmitBill = async () => {
    if (!selectedWoForBilling) return;
    const amt = parseFloat(billAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid billing amount.');
      return;
    }
    const remainingCeiling =
      (selectedWoForBilling.contractValue || 0) -
      (selectedWoForBilling.paidAmount || 0);
    if (amt > remainingCeiling + 0.01) {
      Alert.alert(
        'Ceiling Violation',
        `Invoice amount ₹${amt.toLocaleString(
          'en-IN'
        )} exceeds remaining unbilled contract ceiling of ₹${remainingCeiling.toLocaleString(
          'en-IN'
        )}.`
      );
      return;
    }

    try {
      await billWorkOrder(selectedWoForBilling.id, {
        billNo: invoiceNo.trim() || `INV-${Date.now()}`,
        amount: amt,
        tdsRate: 0.02,
        notes: billRemarks.trim(),
      });
      setBillingModalVisible(false);
      Alert.alert(
        'Invoice Lodged',
        `Milestone bill ${invoiceNo.trim()} has been uploaded and queued for 3-way reconciliation.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit bill');
    }
  };

  // Bid Withdrawal
  const handleWithdrawBid = (tender: Tender) => {
    Alert.alert(
      'Withdraw Sealed Bid',
      `Are you sure you want to withdraw your bid for ${tender.tenderNo || tender.id}? You can lodge a revised quote as long as the tender remains open.`,
      [
        { text: 'Keep Bid', style: 'cancel' },
        {
          text: 'Withdraw Bid',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdrawBid(tender.id, vendorCode, vendorName);
              Alert.alert(
                'Bid Withdrawn',
                'Your sealed bid has been safely withdrawn from the dual-key chamber.'
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to withdraw bid');
            }
          },
        },
      ]
    );
  };

  // Pre-bid Clarifications
  const handleOpenClarification = (t: Tender) => {
    setSelectedTenderForAsk(t);
    setQuestionText('');
    setAskModalVisible(true);
  };

  const handleSubmitClarification = async () => {
    if (!selectedTenderForAsk || !questionText.trim()) {
      Alert.alert('Required', 'Please write your clarification query.');
      return;
    }
    try {
      await askClarification(
        selectedTenderForAsk.id,
        questionText.trim(),
        vendorCode,
        vendorName
      );
      setAskModalVisible(false);
      Alert.alert(
        'Inquiry Submitted',
        'Your question has been forwarded to the Bansal Geo Tender Evaluation Committee.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit clarification');
    }
  };

  // Search and filter tenders
  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      const title = (t.title || '').toLowerCase();
      const no = (t.tenderNo || t.id || '').toLowerCase();
      const cat = (t.category || t.tenderCategory || '').toLowerCase();
      const searchLower = tenderSearch.toLowerCase();
      const matchesSearch =
        title.includes(searchLower) ||
        no.includes(searchLower) ||
        cat.includes(searchLower);
      const matchesCat =
        selectedCategory === 'all' ||
        (t.category || t.tenderCategory) === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [tenders, tenderSearch, selectedCategory]);

  return {
    logout,
    activeTab,
    setActiveTab,
    notificationsVisible,
    setNotificationsVisible,
    tenderSearch,
    setTenderSearch,
    selectedCategory,
    setSelectedCategory,
    filteredTenders,
    vendorName,
    vendorCode,
    vendorCategory,
    currentVendor,
    myWorkOrders,
    myBids,
    openTenders,
    freshTenders,
    waitingOrders,
    totalPaid,
    totalContract,
    clarifications,
    savedTenders,
    toggleSavedTender,
    accountModalVisible,
    setAccountModalVisible,
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
    handleStartWork,
    handleOpenDelivery,
    handleOpenBilling,
    handleWithdrawBid,
    handleOpenClarification,
  };
};
