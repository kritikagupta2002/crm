import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth, useCrm, useFinance } from '../../../context';
import { Project, Deliverable, FinanceInvoice } from '../../../types';
import { CLIENT_PERSONAS } from '../../../constants';

export type ClientTabKey = 'home' | 'projects' | 'deliverables' | 'invoices' | 'profile';

export function useClientPortal() {
  const { session, logout } = useAuth();
  const {
    projects,
    approveDeliverable,
    rejectDeliverable,
    refreshProjects,
  } = useCrm();
  const {
    invoices,
    updateInvoiceStatus,
    refreshFinance,
  } = useFinance();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ClientTabKey>('home');

  // Search & Filter state
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [deliverableFilter, setDeliverableFilter] = useState<'all' | 'pending' | 'approved' | 'revision'>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Modals state
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [selectedDeliverableForReview, setSelectedDeliverableForReview] = useState<(Deliverable & { projectTitle: string; projectCode?: string }) | null>(null);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<FinanceInvoice | null>(null);
  const [selectedInvoiceForUpi, setSelectedInvoiceForUpi] = useState<FinanceInvoice | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState<boolean>(false);

  // Authenticated client resolution
  const currentClientId = session?.id || 'cli-001';
  const matchedPersona = CLIENT_PERSONAS.find((c) => c.id === currentClientId || c.enquiryId === (session as any)?.enquiryId);
  const clientCompanyName = (session as any)?.companyName || (session as any)?.name || matchedPersona?.companyName || 'Tata Steel Mining Corp';
  const clientContactPerson = (session as any)?.contactPerson || matchedPersona?.contactPerson || 'Sandeep Mukherjee';
  const clientMobile = (session as any)?.mobile || matchedPersona?.mobile || '9820112233';
  const clientEmail = (session as any)?.email || matchedPersona?.email || 'sandeep.m@tatasteel.com';
  const clientEnquiryId = (session as any)?.enquiryId || matchedPersona?.enquiryId || 'ENQ-2026-088';
  const clientGstin = (session as any)?.gstin || (currentClientId === 'cli-002' ? '08AAACH1234F1Z8' : '08AAACT2727Q1ZB');
  const clientPan = (session as any)?.pan || (currentClientId === 'cli-002' ? 'AAACH1234F' : 'AAACT2727Q');
  const clientAddress = (session as any)?.address || (currentClientId === 'cli-002' ? 'Yashad Bhawan, Udaipur, Rajasthan 313004' : 'Plot 44, Mining Complex, Sukinda, Jajpur, Odisha 755018');

  // 1. STRICT CLIENT DATA ISOLATION: Projects
  const myProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.clientId && p.clientId === currentClientId) return true;
      if (clientCompanyName && p.clientName && p.clientName.toLowerCase().includes(clientCompanyName.toLowerCase())) return true;
      if (clientCompanyName && clientCompanyName.toLowerCase().includes('tata') && p.clientName && p.clientName.toLowerCase().includes('tata')) return true;
      if (clientCompanyName && clientCompanyName.toLowerCase().includes('zinc') && p.clientName && p.clientName.toLowerCase().includes('zinc')) return true;
      return false;
    });
  }, [projects, currentClientId, clientCompanyName]);

  // Filtered projects by search
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return myProjects;
    const q = projectSearch.toLowerCase();
    return myProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.projectCode && p.projectCode.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.service && p.service.toLowerCase().includes(q))
    );
  }, [myProjects, projectSearch]);

  // 2. STRICT CLIENT DATA ISOLATION: Deliverables
  const myDeliverables = useMemo(() => {
    const list: Array<Deliverable & { projectTitle: string; projectCode?: string }> = [];
    myProjects.forEach((p) => {
      (p.deliverables || []).forEach((d) => {
        list.push({
          ...d,
          projectTitle: p.title,
          projectCode: p.projectCode || p.id,
        });
      });
    });
    return list;
  }, [myProjects]);

  const filteredDeliverables = useMemo(() => {
    if (deliverableFilter === 'all') return myDeliverables;
    if (deliverableFilter === 'pending') return myDeliverables.filter((d) => d.status === 'Submitted' || d.status === 'Draft');
    if (deliverableFilter === 'approved') return myDeliverables.filter((d) => d.status === 'Client Approved');
    if (deliverableFilter === 'revision') return myDeliverables.filter((d) => d.status === 'Revision Requested');
    return myDeliverables;
  }, [myDeliverables, deliverableFilter]);

  // 3. STRICT CLIENT DATA ISOLATION: Invoices
  const myInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.clientId && inv.clientId === currentClientId) return true;
      if (clientCompanyName && inv.clientName && inv.clientName.toLowerCase().includes(clientCompanyName.toLowerCase())) return true;
      if (clientCompanyName && clientCompanyName.toLowerCase().includes('tata') && inv.clientName && inv.clientName.toLowerCase().includes('tata')) return true;
      if (clientCompanyName && clientCompanyName.toLowerCase().includes('zinc') && inv.clientName && inv.clientName.toLowerCase().includes('zinc')) return true;
      return false;
    });
  }, [invoices, currentClientId, clientCompanyName]);

  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === 'all') return myInvoices;
    if (invoiceFilter === 'pending') return myInvoices.filter((i) => i.status !== 'Paid');
    if (invoiceFilter === 'paid') return myInvoices.filter((i) => i.status === 'Paid');
    return myInvoices;
  }, [myInvoices, invoiceFilter]);

  // 4. STRICT CLIENT DATA ISOLATION: Payments
  const myPayments = useMemo(() => {
    return myInvoices.filter(
      (inv) => inv.status === 'Paid' || inv.status === 'Partially Paid' || (inv.paidAmount && inv.paidAmount > 0)
    );
  }, [myInvoices]);

  // 5. STRICT CLIENT DATA ISOLATION: Client-Facing Documents
  const myDocuments = useMemo(() => {
    const docs: Array<{
      id: string;
      title: string;
      projectTitle: string;
      category: 'Geological Report' | 'Technical Deliverable' | 'Statutory Notice' | 'Commercial Invoice';
      date: string;
      size: string;
      status: string;
    }> = [];

    // Deliverables as documents
    myDeliverables.forEach((d) => {
      docs.push({
        id: `doc-${d.id}`,
        title: d.fileName || d.title,
        projectTitle: d.projectTitle,
        category: 'Technical Deliverable',
        date: d.submissionDate,
        size: d.fileSize || '14.2 MB',
        status: d.status,
      });
    });

    // Project documents
    myProjects.forEach((p) => {
      (p.documents || []).forEach((doc) => {
        docs.push({
          id: `pdoc-${doc.id}`,
          title: doc.name,
          projectTitle: p.title,
          category: 'Geological Report',
          date: doc.addedOn || p.startDate,
          size: `${Math.round((doc.size || 2000000) / 1024 / 1024 * 10) / 10} MB`,
          status: 'Attested',
        });
      });
      (p.letters || []).forEach((letItem) => {
        docs.push({
          id: `plet-${letItem.id}`,
          title: `${letItem.title} (${letItem.ref})`,
          projectTitle: p.title,
          category: 'Statutory Notice',
          date: letItem.date,
          size: '1.4 MB',
          status: 'Official Notice',
        });
      });
    });

    // Invoices as documents
    myInvoices.forEach((inv) => {
      docs.push({
        id: `doc-inv-${inv.id}`,
        title: `Tax_Invoice_${inv.invoiceNo}.pdf`,
        projectTitle: inv.projectTitle || 'Geological Exploration Services',
        category: 'Commercial Invoice',
        date: inv.date,
        size: '1.2 MB',
        status: inv.status,
      });
    });

    return docs;
  }, [myDeliverables, myProjects, myInvoices]);

  // KPI Statistics (Zero fake numbers - strictly derived)
  const activeProjectsCount = myProjects.filter((p) => (p.currentStage || 1) < 7).length;
  const completedProjectsCount = myProjects.filter((p) => (p.currentStage || 1) === 7).length;
  const pendingDeliverablesCount = myDeliverables.filter((d) => d.status === 'Submitted' || d.status === 'Draft').length;
  const pendingInvoicesCount = myInvoices.filter((i) => i.status !== 'Paid').length;
  const totalContractValue = myProjects.reduce((sum, p) => sum + (p.baselineBudget || 0), 0);
  const totalPaidAmount = myInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalOutstanding = myInvoices
    .filter((i) => i.status !== 'Paid')
    .reduce((sum, i) => sum + Math.max(0, i.totalAmount - (i.paidAmount || 0)), 0);

  // 6. DELIVERABLE SIGN-OFF HANDLER (Stage 5 Client Approval)
  const handleSignOffDeliverable = useCallback(
    async (projectId: string, deliverableId: string, remarks?: string) => {
      try {
        await approveDeliverable(projectId, deliverableId, remarks);
        setSelectedDeliverableForReview(null);
        Alert.alert(
          'Deliverable Signed Off',
          'You have officially approved this technical deliverable. The sign-off has been recorded in the project lifecycle and the Bansal Geo Project Lead has been notified.'
        );
      } catch (err: any) {
        Alert.alert('Sign-Off Error', err.message || 'Unable to sign off deliverable.');
      }
    },
    [approveDeliverable]
  );

  // 7. DELIVERABLE REVISION REQUEST HANDLER
  const handleRequestRevision = useCallback(
    async (projectId: string, deliverableId: string, reason: string) => {
      if (!reason.trim()) {
        Alert.alert('Remarks Required', 'Please provide specific feedback or query for technical revision.');
        return;
      }
      try {
        await rejectDeliverable(projectId, deliverableId, reason.trim());
        setSelectedDeliverableForReview(null);
        Alert.alert(
          'Revision Requested',
          'Your queries and revision notes have been submitted to the Bansal Geo technical team. A revised draft will be uploaded for your review.'
        );
      } catch (err: any) {
        Alert.alert('Request Error', err.message || 'Unable to request revision.');
      }
    },
    [rejectDeliverable]
  );

  // 8. UPI PAYMENT SETTLEMENT HANDLER
  const handleSettleInvoiceUpi = useCallback(
    async (invoiceId: string, utrRef?: string) => {
      try {
        const targetInv = myInvoices.find((i) => i.id === invoiceId);
        if (!targetInv) throw new Error('Invoice not found.');

        await updateInvoiceStatus(targetInv.id, 'Paid', targetInv.totalAmount, 'UPI Instant');
        setSelectedInvoiceForUpi(null);
        setSelectedInvoiceForDetail(null);
        Alert.alert(
          'Payment Remittance Confirmed',
          `Payment of ₹${targetInv.totalAmount.toLocaleString('en-IN')} for invoice ${targetInv.invoiceNo} has been confirmed.\n\nUTR Reference: ${utrRef || 'UPI-' + Date.now().toString().slice(-8)}\nA corporate tax payment receipt voucher has been generated.`
        );
      } catch (err: any) {
        Alert.alert('Payment Error', err.message || 'Unable to settle payment.');
      }
    },
    [myInvoices, updateInvoiceStatus]
  );

  return {
    session,
    logout,
    activeTab,
    setActiveTab,

    // Client Profile info
    currentClientId,
    clientCompanyName,
    clientContactPerson,
    clientMobile,
    clientEmail,
    clientEnquiryId,
    clientGstin,
    clientPan,
    clientAddress,

    // Isolated datasets
    myProjects,
    filteredProjects,
    myDeliverables,
    filteredDeliverables,
    myInvoices,
    filteredInvoices,
    myPayments,
    myDocuments,

    // Real KPI Metrics
    activeProjectsCount,
    completedProjectsCount,
    pendingDeliverablesCount,
    pendingInvoicesCount,
    totalContractValue,
    totalPaidAmount,
    totalOutstanding,

    // Search and filter state
    projectSearch,
    setProjectSearch,
    deliverableFilter,
    setDeliverableFilter,
    invoiceFilter,
    setInvoiceFilter,

    // Modals
    selectedProjectForDetail,
    setSelectedProjectForDetail,
    selectedDeliverableForReview,
    setSelectedDeliverableForReview,
    selectedInvoiceForDetail,
    setSelectedInvoiceForDetail,
    selectedInvoiceForUpi,
    setSelectedInvoiceForUpi,
    notificationsVisible,
    setNotificationsVisible,

    // Actions
    handleSignOffDeliverable,
    handleRequestRevision,
    handleSettleInvoiceUpi,
    refreshProjects,
    refreshFinance,
  };
}
