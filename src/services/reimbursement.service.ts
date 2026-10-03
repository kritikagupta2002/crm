import { mobileStorage } from '../storage';
import { ReimbursementClaim, ReimbursementCategory, ExpenseAuditEntry } from '../types';

export class ReimbursementService {
  async getAllClaims(employeeId?: string): Promise<ReimbursementClaim[]> {
    const claims = await mobileStorage.getReimbursements();
    if (employeeId) {
      return claims.filter((c) => c.employeeId === employeeId);
    }
    return claims;
  }

  async getClaimById(id: string): Promise<ReimbursementClaim | null> {
    const claims = await mobileStorage.getReimbursements();
    const found = claims.find((c) => c.id === id || c.claimId === id);
    return found || null;
  }

  async submitClaim(data: {
    employeeId: string;
    employeeName: string;
    department: string;
    project?: string;
    category: ReimbursementCategory;
    claimAmount?: number;
    amount?: number;
    kilometersDriven?: number;
    ratePerKm?: number;
    daDays?: number;
    daRate?: number;
    hardshipTier?: string;
    clientBillable?: boolean;
    date: string;
    remarks: string;
    receiptFileName?: string;
    receiptFileSize?: number;
    receiptFileType?: string;
    receiptUrl?: string;
    receiptDataUrl?: string;
  }): Promise<ReimbursementClaim> {
    // 1. Service-Layer Validation
    if (!data.employeeId || typeof data.employeeId !== 'string' || !data.employeeId.trim()) {
      throw new Error('Employee ID is required to file a reimbursement claim.');
    }

    if (!data.category) {
      throw new Error('Reimbursement category is required.');
    }

    let finalAmount = 0;

    // Mileage calculation logic: Kilometers Driven x Applicable Rate Per KM
    if (data.category === 'Vehicle Mileage') {
      const km = Number(data.kilometersDriven);
      const rate = Number(data.ratePerKm);
      if (isNaN(km) || km <= 0) {
        throw new Error('Vehicle Mileage requires a positive number of kilometers driven.');
      }
      if (isNaN(rate) || rate <= 0) {
        throw new Error('Valid rate per kilometer is required.');
      }
      finalAmount = km * rate;
    } else if (
      data.category === 'Field Deployment Daily Allowance (DA)' ||
      data.category === 'Travel Daily Allowance' ||
      data.category === 'Remote Site Hardship' ||
      data.category === 'Remote Hardship'
    ) {
      const days = Number(data.daDays);
      const rate = Number(data.daRate);
      if (isNaN(days) || days <= 0) {
        throw new Error('Daily allowance requires a positive number of site days.');
      }
      if (isNaN(rate) || rate <= 0) {
        throw new Error('Applicable daily allowance rate is required.');
      }
      finalAmount = days * rate;
    } else {
      // Mobile & Internet or other allowance
      const rawAmt = data.claimAmount !== undefined ? data.claimAmount : data.amount;
      finalAmount = Number(rawAmt);
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      throw new Error('Reimbursement claim amount must be a positive number greater than ₹0.');
    }

    const today = new Date().toISOString().split('T')[0];
    const claimDate = data.date || today;
    if (claimDate > today) {
      throw new Error('Reimbursement claim date cannot be in the future.');
    }

    if (!data.remarks || data.remarks.trim().length < 5) {
      throw new Error('Please provide at least 5 characters of justification/remarks.');
    }

    const list = await mobileStorage.getReimbursements();

    // 2. Duplicate Detection
    const isDuplicate = list.some(
      (r) =>
        r.employeeId === data.employeeId &&
        r.category?.toLowerCase() === data.category?.toLowerCase() &&
        r.date === claimDate &&
        Number(r.claimAmount) === finalAmount &&
        r.status !== 'Rejected' &&
        r.financeStatus !== 'Rejected'
    );

    if (isDuplicate) {
      throw new Error(
        `Duplicate claim detected: An allowance claim for ₹${finalAmount.toLocaleString('en-IN')} in '${data.category}' on ${claimDate} is already pending or approved.`
      );
    }

    const claimId = `RMB-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;
    const newClaim: ReimbursementClaim = {
      id: `reimb-${Date.now()}`,
      claimId,
      employeeId: data.employeeId,
      employeeName: data.employeeName || 'Staff Member',
      department: data.department || 'Operations',
      project: data.project || 'Field Exploration Unit',
      category: data.category,
      claimAmount: finalAmount,
      requestedAmount: finalAmount,
      approvedAmount: 0,
      rejectedAmount: 0,
      settledAmount: 0,
      date: claimDate,
      kilometersDriven: data.kilometersDriven ? Number(data.kilometersDriven) : undefined,
      ratePerKm: data.ratePerKm ? Number(data.ratePerKm) : undefined,
      daDays: data.daDays ? Number(data.daDays) : undefined,
      daRate: data.daRate ? Number(data.daRate) : undefined,
      hardshipTier: data.hardshipTier || undefined,
      clientBillable: Boolean(data.clientBillable),
      remarks: data.remarks.trim(),
      receiptFileName: data.receiptFileName || undefined,
      receiptFileSize: data.receiptFileSize || undefined,
      receiptFileType: data.receiptFileType || undefined,
      receiptUrl: data.receiptUrl || data.receiptDataUrl || undefined,
      receiptDataUrl: data.receiptDataUrl || data.receiptUrl || undefined,
      status: 'Pending',
      submittedOn: today,
      hrStatus: 'Pending',
      hrApprovedAmount: 0,
      hrRejectedAmount: 0,
      hrReviewer: undefined,
      hrReviewedOn: undefined,
      hrRemarks: '',
      financeStatus: 'None',
      queryStatus: 'No Query',
      settlementStatus: 'None',
      auditRemarks: '',
      auditHistory: [
        {
          id: `aud-${Date.now()}-sub`,
          stage: 'Submission',
          action: 'Claim Submitted',
          actor: data.employeeName || 'Staff Member',
          timestamp: new Date().toISOString(),
          details: `Reimbursement claim of ₹${finalAmount.toLocaleString('en-IN')} filed under ${data.category}.`,
        },
      ],
    };

    list.unshift(newClaim);
    await mobileStorage.setReimbursements(list);
    return newClaim;
  }

  async reviewClaim(
    id: string,
    reviewData: {
      status?: 'Approved' | 'Partially Approved' | 'Rejected';
      approvedAmount?: number;
      remarks?: string;
      reviewerName?: string;
    }
  ): Promise<ReimbursementClaim> {
    const list = await mobileStorage.getReimbursements();
    const item = list.find((r) => r.id === id || r.claimId === id);
    if (!item) {
      throw new Error(`Reimbursement claim with ID ${id} not found.`);
    }

    if (item.settlementStatus === 'Settled' || item.status === 'Settled') {
      throw new Error('Cannot modify a claim that has already been settled.');
    }

    const claimed = Number(item.claimAmount || item.requestedAmount || 0);
    const reviewerName = reviewData.reviewerName || 'HR Verification Officer';
    const remarks = reviewData.remarks || '';
    let targetStatus: 'Pending' | 'Approved' | 'Partially Approved' | 'Queried' | 'Rejected' | 'Settled' =
      reviewData.status || 'Approved';
    let approvedAmount = 0;

    if (reviewData.approvedAmount !== undefined) {
      approvedAmount = Number(reviewData.approvedAmount);
      if (isNaN(approvedAmount) || approvedAmount < 0) {
        throw new Error('Approved amount cannot be negative.');
      }
      if (approvedAmount > claimed) {
        throw new Error(
          `Approved amount (₹${approvedAmount.toLocaleString('en-IN')}) cannot exceed claimed amount (₹${claimed.toLocaleString('en-IN')}).`
        );
      }

      if (approvedAmount === claimed) {
        targetStatus = 'Approved';
      } else if (approvedAmount === 0) {
        targetStatus = 'Rejected';
      } else {
        targetStatus = 'Partially Approved';
      }
    } else {
      if (targetStatus === 'Approved') {
        approvedAmount = claimed;
      } else if (targetStatus === 'Partially Approved') {
        throw new Error('Please specify the partial amount approved.');
      } else {
        approvedAmount = 0;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const rejectedAmt = Math.max(0, claimed - approvedAmount);

    item.claimAmount = claimed;
    item.requestedAmount = claimed;
    item.approvedAmount = approvedAmount;
    item.rejectedAmount = rejectedAmt;
    item.hrApprovedAmount = approvedAmount;
    item.hrRejectedAmount = rejectedAmt;
    item.hrStatus = targetStatus as any;
    item.status = targetStatus;
    item.hrReviewer = reviewerName;
    item.hrReviewedOn = today;
    item.hrRemarks = remarks;
    item.auditRemarks = remarks;

    if (!Array.isArray(item.auditHistory)) {
      item.auditHistory = [];
    }

    if (targetStatus === 'Approved' || targetStatus === 'Partially Approved') {
      item.financeStatus = 'Pending Review';
      item.settlementStatus = 'Pending';
      item.queryStatus = 'No Query';

      item.auditHistory.push({
        id: `aud-${Date.now()}-hr`,
        stage: 'HR Verification',
        action: `HR ${targetStatus}`,
        actor: reviewerName,
        timestamp: new Date().toISOString(),
        remarks,
        details: `HR approved payable amount ₹${approvedAmount.toLocaleString('en-IN')}; rejected ₹${rejectedAmt.toLocaleString('en-IN')}.`,
      });
    } else {
      item.financeStatus = 'None';
      item.settlementStatus = 'None';
      item.queryStatus = 'No Query';

      item.auditHistory.push({
        id: `aud-${Date.now()}-hr`,
        stage: 'HR Verification',
        action: 'HR Rejected',
        actor: reviewerName,
        timestamp: new Date().toISOString(),
        remarks,
        details: `Allowance claim rejected by HR. Reason: ${remarks || 'Outside policy'}`,
      });
    }

    await mobileStorage.setReimbursements(list);
    return item;
  }

  async updateClaimStatus(
    id: string,
    status: 'Approved' | 'Partially Approved' | 'Rejected',
    approvedAmount?: number
  ): Promise<ReimbursementClaim> {
    return this.reviewClaim(id, {
      status,
      approvedAmount,
    });
  }

  async raiseQuery(
    claimId: string,
    queryMessage: string,
    raisedBy?: string
  ): Promise<ReimbursementClaim> {
    if (!queryMessage || queryMessage.trim().length < 5) {
      throw new Error('Query message must be at least 5 characters.');
    }

    const list = await mobileStorage.getReimbursements();
    const item = list.find((r) => r.id === claimId || r.claimId === claimId);
    if (!item) throw new Error(`Reimbursement claim with ID ${claimId} not found.`);

    if (item.settlementStatus === 'Settled' || item.status === 'Settled') {
      throw new Error('Cannot raise query on an already settled claim.');
    }

    const now = new Date().toISOString();
    const actor = raisedBy || 'HR & Audit Officer';

    item.status = 'Queried';
    item.queryStatus = 'Query Raised';
    item.queryRaisedBy = actor;
    item.queryRaisedOn = now;
    item.queryMessage = queryMessage.trim();
    item.queryResponse = undefined;
    item.queryRespondedOn = undefined;

    if (!Array.isArray(item.auditHistory)) {
      item.auditHistory = [];
    }

    item.auditHistory.push({
      id: `aud-${Date.now()}-qry`,
      stage: 'HR Query',
      action: 'Query Raised',
      actor,
      timestamp: now,
      remarks: queryMessage.trim(),
      details: `Clarification query raised: "${queryMessage.trim()}".`,
    });

    await mobileStorage.setReimbursements(list);
    return item;
  }

  async respondQuery(
    claimId: string,
    responseMessage: string,
    respondedBy?: string
  ): Promise<ReimbursementClaim> {
    if (!responseMessage || responseMessage.trim().length < 3) {
      throw new Error('Please enter at least 3 characters of clarification.');
    }

    const list = await mobileStorage.getReimbursements();
    const item = list.find((r) => r.id === claimId || r.claimId === claimId);
    if (!item) throw new Error(`Reimbursement claim with ID ${claimId} not found.`);

    const now = new Date().toISOString();
    const responder = respondedBy || item.employeeName;

    // Reset status to Pending for re-review without duplicate claim
    item.status = 'Pending';
    item.queryStatus = 'Employee Responded';
    item.queryResponse = responseMessage.trim();
    item.queryRespondedOn = now;

    if (!Array.isArray(item.auditHistory)) {
      item.auditHistory = [];
    }

    item.auditHistory.push({
      id: `aud-${Date.now()}-resp`,
      stage: 'Employee Response',
      action: 'Query Responded',
      actor: responder,
      timestamp: now,
      remarks: responseMessage.trim(),
      details: `Employee submitted response: "${responseMessage.trim()}". Claim reset to Pending for re-review.`,
    });

    await mobileStorage.setReimbursements(list);
    return item;
  }

  async settleClaim(
    id: string,
    settlementData:
      | string
      | {
          settlementReference: string;
          paymentMode?: 'Bank Transfer' | 'UPI' | 'Cheque';
          settlementDate?: string;
          settledBy?: string;
        }
  ): Promise<ReimbursementClaim> {
    const list = await mobileStorage.getReimbursements();
    const item = list.find((r) => r.id === id || r.claimId === id);
    if (!item) throw new Error(`Reimbursement claim with ID ${id} not found.`);

    // Rule 1: Approval Check
    if (item.status !== 'Approved' && item.status !== 'Partially Approved') {
      throw new Error(
        `Settlement Blocked: Claim must be Approved or Partially Approved first. Current status: ${item.status}`
      );
    }

    // Rule 2: Active Query Check
    if (item.queryStatus === 'Query Raised') {
      throw new Error('Settlement Blocked: Cannot settle claim while an active query is outstanding.');
    }

    // Rule 3: Already Settled (Idempotency)
    if (item.settlementStatus === 'Settled') {
      throw new Error(`Claim ${item.claimId || item.id} has already been settled and disbursed.`);
    }

    // Rule 4: Payable amount is strictly approvedAmount
    const payableAmount = Number(item.approvedAmount || item.hrApprovedAmount || 0);
    if (payableAmount <= 0) {
      throw new Error('Cannot settle a claim with ₹0 approved payable amount.');
    }

    const utrRef =
      typeof settlementData === 'string'
        ? settlementData.trim()
        : settlementData.settlementReference?.trim();

    if (!utrRef || utrRef.length < 4) {
      throw new Error('Valid bank disbursement reference / UTR is required (minimum 4 characters).');
    }

    const today = new Date().toISOString().split('T')[0];
    const settlementDate =
      typeof settlementData === 'object' && settlementData.settlementDate
        ? settlementData.settlementDate
        : today;

    if (settlementDate > today) {
      throw new Error('Settlement date cannot be in the future.');
    }

    const paymentMode =
      typeof settlementData === 'object' && settlementData.paymentMode
        ? settlementData.paymentMode
        : 'Bank Transfer';

    const settledBy =
      typeof settlementData === 'object' && settlementData.settledBy
        ? settlementData.settledBy
        : 'Finance & Accounts';

    // Cross-module side effect: post Payment Voucher to Finance ledger (with idempotency)
    const vouchers = await mobileStorage.getVouchers();
    const refDoc = item.claimId || item.id;
    const existingVoucher = vouchers.find(
      (v) => v.referenceId === refDoc || (v.referenceType === 'reimbursement' && v.referenceId === item.id)
    );

    if (!existingVoucher) {
      const voucherNum = `VCH-RMB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      vouchers.unshift({
        id: `vch-${Date.now()}`,
        voucherNumber: voucherNum,
        type: 'Payment Voucher',
        date: settlementDate,
        debitAccount: `5100 - Employee Allowance & Welfare (${item.category})`,
        creditAccount: `1002 - HDFC Bank Corporate A/c (${paymentMode})`,
        amount: payableAmount,
        narration: `Disbursement for allowance claim ${refDoc} (${item.employeeName} - ${item.category}) - Ref: ${utrRef}`,
        referenceType: 'reimbursement',
        referenceId: item.id,
      });
      await mobileStorage.setVouchers(vouchers);
    }

    // Mark claim settled
    item.status = 'Settled';
    item.settlementStatus = 'Settled';
    item.settledAmount = payableAmount;
    item.settlementReference = utrRef;
    item.settlementDate = settlementDate;
    item.paymentMode = paymentMode;
    item.settledBy = settledBy;

    if (!Array.isArray(item.auditHistory)) {
      item.auditHistory = [];
    }

    item.auditHistory.push({
      id: `aud-${Date.now()}-stl`,
      stage: 'Settlement',
      action: 'Claim Settled',
      actor: settledBy,
      timestamp: new Date().toISOString(),
      details: `Settled and disbursed ₹${payableAmount.toLocaleString('en-IN')} via ${paymentMode} (Ref: ${utrRef}). Payment voucher posted to finance ledger.`,
    });

    await mobileStorage.setReimbursements(list);
    return item;
  }
}

export const reimbursementService = new ReimbursementService();
