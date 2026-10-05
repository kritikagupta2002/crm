import { mobileStorage } from '../storage';
import { ExpenseClaim, ExpenseQuery, ExpenseCategory, ExpenseStatus } from '../types';

export class ExpenseService {
  async getAllExpenses(employeeId?: string): Promise<ExpenseClaim[]> {
    const expenses = await mobileStorage.getExpenses();
    if (employeeId) {
      return expenses.filter((e) => e.employeeId === employeeId);
    }
    return expenses;
  }

  async getExpenseById(id: string): Promise<ExpenseClaim | null> {
    const expenses = await mobileStorage.getExpenses();
    const found = expenses.find((e) => e.id === id || e.expenseNumber === id);
    return found || null;
  }

  async submitExpense(data: {
    employeeId: string;
    employeeName: string;
    department: string;
    category: ExpenseCategory;
    requestedAmount: number;
    amount?: number;
    date: string;
    project: string;
    description: string;
    receiptFileName?: string;
    receiptFileSize?: number;
    receiptFileType?: string;
    receiptUrl?: string;
    receiptDataUrl?: string;
  }): Promise<ExpenseClaim> {
    if (!data.employeeId || typeof data.employeeId !== 'string' || !data.employeeId.trim()) {
      throw new Error('Employee ID is required to file an expense claim.');
    }

    const rawAmount = data.requestedAmount !== undefined ? data.requestedAmount : data.amount;
    const amount = Number(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense claim amount must be a positive number greater than ₹0.');
    }

    if (!data.date) {
      throw new Error('Expense date is required.');
    }
    const today = new Date().toISOString().split('T')[0];
    if (data.date > today) {
      throw new Error('Expense date cannot be in the future.');
    }

    if (!data.category) {
      throw new Error('Expense category is required.');
    }

    if (!data.project || !data.project.trim()) {
      throw new Error('Assigned project or client block is required.');
    }

    if (!data.description || data.description.trim().length < 10) {
      throw new Error('Justification description must be at least 10 characters.');
    }

    const list = await mobileStorage.getExpenses();

    const isDuplicate = list.some(
      (e) =>
        e.employeeId === data.employeeId &&
        e.date === data.date &&
        e.category?.toLowerCase() === data.category?.toLowerCase() &&
        Number(e.requestedAmount || e.amount) === amount &&
        e.status !== 'Rejected' &&
        e.financeStatus !== 'Rejected'
    );

    if (isDuplicate) {
      throw new Error(
        `Duplicate claim detected: A claim for ₹${amount.toLocaleString('en-IN')} in '${data.category}' on ${data.date} has already been submitted.`
      );
    }

    const expNum = `EXP-BGS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newExp: ExpenseClaim = {
      id: `exp-${Date.now()}`,
      expenseNumber: expNum,
      employeeId: data.employeeId,
      employeeName: data.employeeName || 'Staff Member',
      department: data.department || 'Operations',
      category: data.category,
      requestedAmount: amount,
      amount: amount,
      approvedAmount: 0,
      rejectedAmount: 0,
      settledAmount: 0,
      date: data.date,
      project: data.project.trim(),
      description: data.description.trim(),
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
      receiptFileName: data.receiptFileName || undefined,
      receiptFileSize: data.receiptFileSize || undefined,
      receiptFileType: data.receiptFileType || undefined,
      receiptUrl: data.receiptUrl || data.receiptDataUrl || undefined,
      receiptDataUrl: data.receiptDataUrl || data.receiptUrl || undefined,
      auditRemarks: '',
      auditHistory: [
        {
          id: `aud-${Date.now()}-sub`,
          stage: 'Submission',
          action: 'Claim Submitted',
          actor: data.employeeName || 'Staff Member',
          timestamp: new Date().toISOString(),
          details: `Expense claim of ₹${amount.toLocaleString('en-IN')} submitted under ${data.category} (${data.project}).`,
        },
      ],
    };

    list.unshift(newExp);
    await mobileStorage.setExpenses(list);
    return newExp;
  }

  async reviewExpense(
    id: string,
    reviewData: {
      status?: 'Approved' | 'Partially Approved' | 'Rejected';
      approvedAmount?: number;
      remarks?: string;
      reviewerName?: string;
    }
  ): Promise<ExpenseClaim> {
    const list = await mobileStorage.getExpenses();
    const item = list.find((e) => e.id === id || e.expenseNumber === id);
    if (!item) {
      throw new Error(`Expense claim with ID ${id} not found.`);
    }

    if (item.settlementStatus === 'Settled' || item.status === 'Settled') {
      throw new Error('Cannot modify a claim that has already been settled.');
    }

    const req = Number(item.requestedAmount !== undefined ? item.requestedAmount : item.amount || 0);
    const reviewerName = reviewData.reviewerName || 'HR Verification Officer';
    const remarks = reviewData.remarks || '';
    let targetStatus: ExpenseStatus = reviewData.status || 'Approved';
    let approvedAmount = 0;

    if (reviewData.approvedAmount !== undefined) {
      approvedAmount = Number(reviewData.approvedAmount);
      if (isNaN(approvedAmount) || approvedAmount < 0) {
        throw new Error('Approved amount cannot be negative.');
      }
      if (approvedAmount > req) {
        throw new Error(
          `Approved amount (₹${approvedAmount.toLocaleString('en-IN')}) cannot exceed requested amount (₹${req.toLocaleString('en-IN')}).`
        );
      }

      if (approvedAmount === req) {
        targetStatus = 'Approved';
      } else if (approvedAmount === 0) {
        targetStatus = 'Rejected';
      } else {
        targetStatus = 'Partially Approved';
      }
    } else {
      if (targetStatus === 'Approved') {
        approvedAmount = req;
      } else if (targetStatus === 'Partially Approved') {
        throw new Error('Please specify the partial amount approved.');
      } else {
        approvedAmount = 0;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const rejectedAmt = Math.max(0, req - approvedAmount);

    item.requestedAmount = req;
    item.amount = req;
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
        details: `Claim rejected by HR. Reason: ${remarks || 'Outside policy'}`,
      });
    }

    await mobileStorage.setExpenses(list);
    return item;
  }

  async updateExpenseStatus(
    id: string,
    status: 'Approved' | 'Partially Approved' | 'Rejected',
    remarks: string,
    approvedAmount?: number
  ): Promise<ExpenseClaim> {
    return this.reviewExpense(id, {
      status,
      remarks,
      approvedAmount,
    });
  }

  async raiseQuery(
    expenseId: string,
    employeeId: string,
    queryMessage: string,
    raisedBy?: string
  ): Promise<ExpenseQuery> {
    if (!queryMessage || queryMessage.trim().length < 5) {
      throw new Error('Query message must be at least 5 characters explaining what clarification is required.');
    }

    const expenses = await mobileStorage.getExpenses();
    const exp = expenses.find((e) => e.id === expenseId || e.expenseNumber === expenseId);
    if (!exp) throw new Error(`Expense claim with ID ${expenseId} not found.`);

    if (exp.settlementStatus === 'Settled' || exp.status === 'Settled') {
      throw new Error('Cannot raise query on an already settled claim.');
    }

    const now = new Date().toISOString();
    const queryId = `QRY-EXP-${Date.now().toString().slice(-6)}`;
    const actor = raisedBy || 'HR & Audit Officer';

    exp.status = 'Queried';
    exp.queryStatus = 'Query Raised';
    exp.queryId = queryId;
    exp.queryRaisedBy = actor;
    exp.queryRaisedOn = now;
    exp.queryMessage = queryMessage.trim();
    exp.queryResponse = undefined;
    exp.queryRespondedOn = undefined;

    if (!Array.isArray(exp.auditHistory)) {
      exp.auditHistory = [];
    }

    exp.auditHistory.push({
      id: `aud-${Date.now()}-qry`,
      stage: 'HR Query',
      action: 'Query Raised',
      actor,
      timestamp: now,
      remarks: queryMessage.trim(),
      details: `Clarification query raised: "${queryMessage.trim()}". Action required by employee.`,
    });

    await mobileStorage.setExpenses(expenses);

    const queries = await mobileStorage.getQueries();
    const newQuery: ExpenseQuery = {
      id: queryId,
      expenseId: exp.id,
      employeeId: exp.employeeId,
      employeeName: exp.employeeName,
      queryMessage: queryMessage.trim(),
      status: 'Open',
      createdAt: now,
      raisedBy: actor,
    };
    queries.unshift(newQuery);
    await mobileStorage.setQueries(queries);

    return newQuery;
  }

  async respondQuery(
    queryIdOrExpenseId: string,
    responseMessage: string,
    respondedBy?: string
  ): Promise<void> {
    if (!responseMessage || responseMessage.trim().length < 3) {
      throw new Error('Please enter at least 3 characters of clarification.');
    }

    const queries = await mobileStorage.getQueries();
    const query = queries.find(
      (q) => q.id === queryIdOrExpenseId || q.expenseId === queryIdOrExpenseId
    );

    const expenses = await mobileStorage.getExpenses();
    const exp = expenses.find(
      (e) => e.id === (query?.expenseId || queryIdOrExpenseId) || e.expenseNumber === queryIdOrExpenseId
    );

    if (!exp) {
      throw new Error('Corresponding expense claim not found.');
    }

    const now = new Date().toISOString();
    const responder = respondedBy || exp.employeeName;

    if (query) {
      query.responseMessage = responseMessage.trim();
      query.status = 'Resolved';
      query.repliedAt = now;
      await mobileStorage.setQueries(queries);
    }

    exp.status = 'Pending';
    exp.queryStatus = 'Employee Responded';
    exp.queryResponse = responseMessage.trim();
    exp.queryRespondedOn = now;

    if (!Array.isArray(exp.auditHistory)) {
      exp.auditHistory = [];
    }

    exp.auditHistory.push({
      id: `aud-${Date.now()}-resp`,
      stage: 'Employee Response',
      action: 'Query Responded',
      actor: responder,
      timestamp: now,
      remarks: responseMessage.trim(),
      details: `Employee submitted clarification: "${responseMessage.trim()}". Claim reset to Pending for re-review.`,
    });

    await mobileStorage.setExpenses(expenses);
  }

  async resolveQuery(queryId: string, responseMessage: string): Promise<void> {
    return this.respondQuery(queryId, responseMessage);
  }

  async settleExpense(
    id: string,
    settlementData:
      | string
      | {
          settlementReference: string;
          paymentMode?: 'Bank Transfer' | 'UPI' | 'Cheque';
          settlementDate?: string;
          settledBy?: string;
        }
  ): Promise<ExpenseClaim> {
    const list = await mobileStorage.getExpenses();
    const exp = list.find((e) => e.id === id || e.expenseNumber === id);
    if (!exp) throw new Error(`Expense claim with ID ${id} not found.`);

    if (exp.status !== 'Approved' && exp.status !== 'Partially Approved') {
      throw new Error(
        `Settlement Blocked: Claim must be Approved or Partially Approved by HR first. Current status: ${exp.status}`
      );
    }

    if (exp.queryStatus === 'Query Raised') {
      throw new Error('Settlement Blocked: Cannot settle claim while an active query is outstanding.');
    }

    if (exp.settlementStatus === 'Settled') {
      throw new Error(`Claim ${exp.expenseNumber || exp.id} has already been settled and disbursed.`);
    }

    const payableAmount = Number(exp.approvedAmount || exp.hrApprovedAmount || 0);
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

    const vouchers = await mobileStorage.getVouchers();
    const refDoc = exp.expenseNumber || exp.id;
    const existingVoucher = vouchers.find((v) => v.referenceId === refDoc || v.referenceType === 'expense' && v.referenceId === exp.id);

    if (!existingVoucher) {
      const voucherNum = `VCH-EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      vouchers.unshift({
        id: `vch-${Date.now()}`,
        voucherNumber: voucherNum,
        type: 'Payment Voucher',
        date: settlementDate,
        debitAccount: `5001 - Field Exploration Direct Expense (${exp.category})`,
        creditAccount: `1002 - HDFC Bank Corporate A/c (${paymentMode})`,
        amount: payableAmount,
        narration: `Disbursement for expense claim ${refDoc} (${exp.employeeName} - ${exp.category}) - Ref: ${utrRef}`,
        referenceType: 'expense',
        referenceId: exp.id,
      });
      await mobileStorage.setVouchers(vouchers);
    }

    exp.status = 'Settled';
    exp.settlementStatus = 'Settled';
    exp.settledAmount = payableAmount;
    exp.settlementReference = utrRef;
    exp.settlementDate = settlementDate;
    exp.paymentMode = paymentMode;
    exp.settledBy = settledBy;

    if (!Array.isArray(exp.auditHistory)) {
      exp.auditHistory = [];
    }

    exp.auditHistory.push({
      id: `aud-${Date.now()}-stl`,
      stage: 'Settlement',
      action: 'Claim Settled',
      actor: settledBy,
      timestamp: new Date().toISOString(),
      details: `Settled and disbursed ₹${payableAmount.toLocaleString('en-IN')} via ${paymentMode} (Ref: ${utrRef}). Payment voucher posted to finance ledger.`,
    });

    await mobileStorage.setExpenses(list);
    return exp;
  }
}

export const expenseService = new ExpenseService();
