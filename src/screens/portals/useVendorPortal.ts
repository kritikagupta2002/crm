import { useState } from 'react';
import { Alert } from 'react-native';
import { useCrm, useAuth } from '../../context';
import { Tender, WorkOrder, SealedBid } from '../../types';
import { tenderPhase } from '../../constants/vendor';
import { PortalTab } from './components/VendorPortalHeader';

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

  const [activeTab, setActiveTab] = useState<PortalTab>('home');
  const [tenderSearch, setTenderSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [selectedWoForDelivery, setSelectedWoForDelivery] = useState<WorkOrder | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [selectedWoForBilling, setSelectedWoForBilling] = useState<WorkOrder | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billRemarks, setBillRemarks] = useState('');

  const [askModalVisible, setAskModalVisible] = useState(false);
  const [selectedTenderForAsk, setSelectedTenderForAsk] = useState<Tender | null>(null);
  const [questionText, setQuestionText] = useState('');

  const vendorName =
    session?.accountType === 'vendor' ? (session as any).name : 'Apex Drilling Services';
  const vendorCode =
    session?.accountType === 'vendor' ? (session as any).vendorId : 'VEND-001';
  const currentVendor = vendors.find((v) => v.id === vendorCode) || {
    id: vendorCode,
    name: vendorName,
    contactPerson: 'Mr. Rajesh Verma',
    phone: '9829012345',
    email: 'rajesh@apexdrilling.in',
    workCategory: 'Drilling & Boring',
    rating: 4.8,
    approvalStatus: 'approved' as const,
    pan: 'ABCDE1234F',
    gstin: '08ABCDE1234F1Z5',
    bankDetails: {
      accountNumber: '912010045678912',
      ifscCode: 'HDFC0000123',
      bankName: 'HDFC Bank, MI Road Jaipur',
    },
    msmeRegistrationNo: 'UDYAM-RJ-14-0012345',
    address: 'Plot 45, Vishwakarma Industrial Area, Jaipur, Rajasthan 302013',
  };

  const myWorkOrders = workOrders.filter((w) => w.vendorId === vendorCode);
  const myBids: { tender: Tender; bid: SealedBid }[] = [];
  tenders.forEach((t) => {
    const b = t.sealedBids.find((bid) => bid.vendorId === vendorCode);
    if (b) {
      myBids.push({ tender: t, bid: b });
    }
  });

  const openTenders = tenders.filter((t) => tenderPhase(t) === 'Open');
  const freshTenders = openTenders.filter(
    (t) => !myBids.some((b) => b.tender.id === t.id)
  );
  const waitingOrders = myWorkOrders.filter((w) =>
    ['Issued', 'Started', 'Delivered'].includes(w.currentStage)
  );
  const totalPaid = myWorkOrders.reduce(
    (sum, w) => sum + (w.paidAmount || 0),
    0
  );
  const totalContract = myWorkOrders.reduce(
    (sum, w) => sum + (w.contractValue || 0),
    0
  );

  const handleStartWork = (wo: WorkOrder) => {
    Alert.alert(
      'Confirm Mobilization',
      `Confirm that fieldwork and equipment mobilization for ${wo.woNumber} (${wo.projectTitle}) has officially started?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Start',
          onPress: async () => {
            try {
              await startWorkOrder(
                wo.id,
                'Mobilization confirmed by contractor via portal'
              );
              Alert.alert(
                'Work Started',
                `Order ${wo.woNumber} is now marked as Started.`
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update stage');
            }
          },
        },
      ]
    );
  };

  const handleOpenDelivery = (wo: WorkOrder) => {
    setSelectedWoForDelivery(wo);
    setDeliveryNotes('');
    setAttachedFiles(['Field_Survey_Log_v1.pdf', 'Core_Drilling_Photos.zip']);
    setDeliveryModalVisible(true);
  };

  const handleSubmitDelivery = async () => {
    if (!selectedWoForDelivery) return;
    if (!deliveryNotes.trim()) {
      Alert.alert(
        'Validation Error',
        'Please enter completion notes describing delivered fieldwork.'
      );
      return;
    }
    try {
      await deliverWorkOrder(selectedWoForDelivery.id, {
        notes: deliveryNotes.trim(),
        files: attachedFiles.map((fn, idx) => ({
          id: `proof-${Date.now()}-${idx}`,
          name: fn,
          size: '2.4 MB',
        })),
      });
      setDeliveryModalVisible(false);
      Alert.alert(
        'Delivery Submitted',
        'Your field deliverables and survey log have been submitted to Project Management.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record delivery');
    }
  };

  const handleOpenBilling = (wo: WorkOrder) => {
    setSelectedWoForBilling(wo);
    setInvoiceNo(
      `INV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
    );
    const remainingCeiling = wo.contractValue - (wo.paidAmount || 0);
    setBillAmount(
      String(Math.min(remainingCeiling, Math.round(wo.contractValue * 0.4)))
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
      selectedWoForBilling.contractValue -
      (selectedWoForBilling.paidAmount || 0);
    if (amt > remainingCeiling) {
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
        notes: billRemarks.trim(),
      });
      setBillingModalVisible(false);
      Alert.alert(
        'Invoice Submitted',
        'Invoice has been uploaded and queued for 3-way verification by Accounts.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit bill');
    }
  };

  const handleWithdrawBid = (tender: Tender) => {
    Alert.alert(
      'Withdraw Sealed Bid',
      `Are you sure you want to withdraw your bid for ${tender.tenderNo}? You can lodge a modified bid as long as the submission deadline is open.`,
      [
        { text: 'No, Keep Bid', style: 'cancel' },
        {
          text: 'Withdraw Bid',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdrawBid(tender.id, vendorCode, vendorName);
              Alert.alert(
                'Bid Withdrawn',
                'Your sealed bid has been withdrawn from escrow.'
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to withdraw bid');
            }
          },
        },
      ]
    );
  };

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
        vendorCode,
        vendorName,
        questionText.trim()
      );
      setAskModalVisible(false);
      Alert.alert(
        'Query Submitted',
        'Your question has been forwarded to the Project Lead & Tender Committee.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit clarification');
    }
  };

  const filteredTenders = tenders.filter((t) => {
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

  return {
    logout,
    activeTab,
    setActiveTab,
    tenderSearch,
    setTenderSearch,
    selectedCategory,
    setSelectedCategory,
    filteredTenders,
    vendorName,
    vendorCode,
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
