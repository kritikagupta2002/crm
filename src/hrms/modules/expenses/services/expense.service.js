import { storage } from '@/core/storage/storage';
import { financeService } from '@/modules/finance/services/finance.service';

const dispatchNotification = (notif) => {
    try {
        const notifs = storage.getNotifications();
        const item = {
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: 'Just now',
            read: false,
            ...notif,
        };
        storage.setNotifications([item, ...notifs]);
    } catch {
        // non-blocking
    }
};

export const expenseService = {
    getExpenses: async () => {
        return new Promise(resolve => setTimeout(() => resolve(storage.getExpenses()), 80));
    },

    getExpenseById: async (id) => {
        const list = storage.getExpenses();
        const found = list.find((e) => e.id === id || e.expenseNumber === id);
        return new Promise(resolve => setTimeout(() => resolve(found || null), 50));
    },

    submitExpense: async (data) => {
        // 1. Service-Layer Validation
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
        const today = new Date().toLocaleDateString('en-CA');
        if (data.date > today) {
            throw new Error('Expense date cannot be in the future.');
        }

        if (!data.category || !data.category.trim()) {
            throw new Error('Expense category is required.');
        }

        if (!data.project || !data.project.trim()) {
            throw new Error('Assigned project or client block is required.');
        }

        if (!data.description || data.description.trim().length < 10) {
            throw new Error('Justification description must be at least 10 characters.');
        }

        const list = storage.getExpenses();

        // 2. Duplicate Detection
        const isDuplicate = list.some((e) => 
            e.employeeId === data.employeeId &&
            e.date === data.date &&
            e.category?.toLowerCase() === data.category?.toLowerCase() &&
            Number(e.requestedAmount || e.amount) === amount &&
            e.status !== 'Rejected' &&
            e.financeStatus !== 'Rejected'
        );

        if (isDuplicate) {
            throw new Error(`Duplicate claim detected: A claim for ₹${amount.toLocaleString('en-IN')} in '${data.category}' on ${data.date} has already been submitted.`);
        }

        // 3. Assemble complete canonical data structure
        const expNum = `EXP-BGS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
        const newExp = {
            id: `exp-${Date.now()}`,
            expenseNumber: expNum,
            employeeId: data.employeeId,
            employeeName: data.employeeName || 'Staff Member',
            department: data.department || 'Operations',
            category: data.category,
            requestedAmount: amount,
            approvedAmount: 0,
            rejectedAmount: 0,
            amount: amount, // legacy compatibility
            date: data.date,
            project: data.project,
            description: data.description.trim(),
            receiptFileName: data.receiptFileName || null,
            receiptFileSize: data.receiptFileSize || null,
            receiptFileType: data.receiptFileType || null,
            receiptUrl: data.receiptUrl || data.receiptDataUrl || null,
            receiptDataUrl: data.receiptDataUrl || data.receiptUrl || null,
            status: 'Pending',
            submittedOn: today,
            // HR Verification fields
            hrStatus: 'Pending',
            hrApprovedAmount: 0,
            hrRejectedAmount: 0,
            hrReviewer: null,
            hrReviewedOn: null,
            hrRemarks: '',
            approvedBy: null, // legacy
            reviewedOn: null, // legacy
            remarks: '', // legacy
            // Finance Review fields
            financeStatus: 'None',
            financeReviewer: null,
            financeReviewedOn: null,
            financeRemarks: '',
            // Query fields
            queryStatus: 'No Query',
            queryId: null,
            queryRaisedBy: null,
            queryRaisedOn: null,
            queryMessage: null,
            queryResponse: null,
            queryRespondedOn: null,
            queryResolvedOn: null,
            queryAttachment: null,
            // Settlement fields
            settlementStatus: 'None',
            settledAmount: 0,
            settlementDate: null,
            settledOn: null,
            settledBy: null,
            settlementReference: null,
            // Complete Audit History
            auditHistory: [
                {
                    id: `aud-${Date.now()}-sub`,
                    stage: 'Submission',
                    action: 'Claim Submitted',
                    actor: data.employeeName || 'Staff Member',
                    timestamp: new Date().toISOString(),
                    details: `Expense claim of ₹${amount.toLocaleString('en-IN')} submitted under ${data.category} (${data.project}).`,
                }
            ],
        };

        storage.setExpenses([newExp, ...list]);

        // Notification 1: Employee submits Expense
        dispatchNotification({
            type: 'Expense',
            targetRole: 'hr',
            title: 'New Expense Claim Submitted',
            message: `${newExp.employeeName} submitted an expense claim of ₹${amount.toLocaleString('en-IN')} for ${newExp.category} (${newExp.project}).`,
            actionLink: '/hr/expenses/approvals',
        });

        return new Promise(resolve => setTimeout(() => resolve(newExp), 120));
    },

    reviewExpense: async (id, reviewData, legacyReviewer, legacyRemarks) => {
        const list = storage.getExpenses();
        const item = list.find((e) => e.id === id || e.expenseNumber === id);
        if (!item) {
            throw new Error(`Expense claim with ID ${id} not found.`);
        }

        if (item.settlementStatus === 'Settled' || item.status === 'Settled') {
            throw new Error('Cannot modify a claim that has already been settled.');
        }

        let approvedAmount = 0;
        let reviewerName = 'Dr. Amit Kumar Bansal';
        let remarks = '';
        let targetStatus = '';

        const req = Number(item.requestedAmount !== undefined ? item.requestedAmount : item.amount || 0);

        if (typeof reviewData === 'object' && reviewData !== null) {
            reviewerName = reviewData.reviewerName || reviewerName;
            remarks = reviewData.remarks || '';

            if (reviewData.approvedAmount !== undefined) {
                approvedAmount = Number(reviewData.approvedAmount);
                if (isNaN(approvedAmount) || approvedAmount < 0) {
                    throw new Error('Approved amount cannot be negative.');
                }
                if (approvedAmount > req) {
                    throw new Error(`Approved amount (₹${approvedAmount.toLocaleString('en-IN')}) cannot exceed requested amount (₹${req.toLocaleString('en-IN')}).`);
                }

                if (approvedAmount === req) {
                    targetStatus = 'Approved';
                } else if (approvedAmount === 0) {
                    targetStatus = 'Rejected';
                } else {
                    targetStatus = 'Partially Approved';
                }
            } else if (reviewData.status) {
                targetStatus = reviewData.status;
                approvedAmount = targetStatus === 'Approved' ? req : 0;
            }
        } else if (typeof reviewData === 'string') {
            targetStatus = reviewData;
            reviewerName = legacyReviewer || reviewerName;
            remarks = legacyRemarks || '';
            approvedAmount = targetStatus === 'Approved' ? req : 0;
        }

        const today = new Date().toLocaleDateString('en-CA');
        const rejectedAmt = Math.max(0, req - approvedAmount);

        item.requestedAmount = req;
        item.amount = req;
        item.approvedAmount = approvedAmount;
        item.rejectedAmount = rejectedAmt;
        item.hrApprovedAmount = approvedAmount;
        item.hrRejectedAmount = rejectedAmt;

        item.hrStatus = targetStatus || (approvedAmount === req ? 'Approved' : approvedAmount === 0 ? 'Rejected' : 'Partially Approved');
        item.status = item.hrStatus;
        item.hrReviewer = reviewerName;
        item.approvedBy = reviewerName;
        item.hrReviewedOn = today;
        item.reviewedOn = today;
        item.hrRemarks = remarks;
        item.remarks = remarks;

        if (!Array.isArray(item.auditHistory)) {
            item.auditHistory = [];
        }

        if (item.hrStatus === 'Approved' || item.hrStatus === 'Partially Approved') {
            item.financeStatus = 'Pending Review';
            item.settlementStatus = 'Pending';
            item.queryStatus = 'No Query';

            item.auditHistory.push({
                id: `aud-${Date.now()}-hr`,
                stage: 'HR Verification',
                action: `HR ${item.hrStatus}`,
                actor: reviewerName,
                timestamp: new Date().toISOString(),
                remarks,
                details: `HR approved payable amount ₹${approvedAmount.toLocaleString('en-IN')}; rejected ₹${rejectedAmt.toLocaleString('en-IN')}. Forwarded to Finance for verification.`,
            });

            // Notification 3 / 4: HR approves or partially approves -> To Employee
            dispatchNotification({
                type: 'Expense',
                targetRole: 'employee',
                title: `Expense Claim ${item.hrStatus}`,
                message: `Claim ${item.expenseNumber} was ${item.hrStatus.toLowerCase()} by HR for ₹${approvedAmount.toLocaleString('en-IN')}.`,
                actionLink: '/hr/expenses',
            });

            // Notification 6: Finance receives review request
            dispatchNotification({
                type: 'Finance',
                targetRole: 'hr',
                title: 'Finance Verification Required',
                message: `Claim ${item.expenseNumber} (${item.employeeName} - ₹${approvedAmount.toLocaleString('en-IN')}) requires Finance verification.`,
                actionLink: '/finance/claims',
            });
        } else {
            // HR Rejected
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
                details: `Claim rejected by HR. Justification: ${remarks || 'None provided'}`,
            });

            // Notification 5: HR rejects -> To Employee
            dispatchNotification({
                type: 'Expense',
                targetRole: 'employee',
                title: 'Expense Claim Rejected',
                message: `Claim ${item.expenseNumber} was rejected by HR: ${remarks || 'Outside policy'}`,
                actionLink: '/hr/expenses',
            });
        }

        storage.setExpenses([...list]);
        return new Promise(resolve => setTimeout(() => resolve(item), 100));
    },

    financeApprove: async (id, reviewData = {}) => {
        const list = storage.getExpenses();
        const item = list.find((e) => e.id === id || e.expenseNumber === id);
        if (!item) {
            throw new Error(`Expense claim with ID ${id} not found.`);
        }

        if (item.hrStatus !== 'Approved' && item.hrStatus !== 'Partially Approved') {
            throw new Error(`Cannot approve in Finance: Claim has not been approved by HR (Current HR status: ${item.hrStatus}).`);
        }

        if (item.queryStatus === 'Query Raised') {
            throw new Error('Cannot approve claim while an outstanding query is awaiting employee response. Resolve the query first.');
        }

        if (item.settlementStatus === 'Settled' || item.status === 'Settled') {
            throw new Error('This claim has already been settled.');
        }

        const today = new Date().toLocaleDateString('en-CA');
        const reviewer = reviewData.reviewerName || 'Finance & Accounts';
        const remarks = reviewData.remarks || 'Audited against project ledger and approved for disbursement';

        item.financeStatus = 'Approved';
        item.financeReviewer = reviewer;
        item.financeReviewedOn = today;
        item.financeRemarks = remarks;
        item.settlementStatus = 'Pending';

        if (!Array.isArray(item.auditHistory)) {
            item.auditHistory = [];
        }

        item.auditHistory.push({
            id: `aud-${Date.now()}-fin`,
            stage: 'Finance Review',
            action: 'Finance Approved',
            actor: reviewer,
            timestamp: new Date().toISOString(),
            remarks,
            details: `Finance verified documentation and cleared payable amount ₹${Number(item.hrApprovedAmount || item.approvedAmount).toLocaleString('en-IN')} for settlement.`,
        });

        storage.setExpenses([...list]);

        // Notification 9: Finance approves
        dispatchNotification({
            type: 'Finance',
            targetRole: 'employee',
            title: 'Finance Verification Approved',
            message: `Finance verified claim ${item.expenseNumber} for ₹${Number(item.hrApprovedAmount || item.approvedAmount).toLocaleString('en-IN')}. Ready for disbursement.`,
            actionLink: '/hr/expenses',
        });

        return new Promise(resolve => setTimeout(() => resolve(item), 100));
    },

    financeReject: async (id, reviewData = {}) => {
        const list = storage.getExpenses();
        const item = list.find((e) => e.id === id || e.expenseNumber === id);
        if (!item) {
            throw new Error(`Expense claim with ID ${id} not found.`);
        }

        if (item.settlementStatus === 'Settled' || item.status === 'Settled') {
            throw new Error('Cannot reject a claim that has already been settled.');
        }

        const today = new Date().toLocaleDateString('en-CA');
        const reviewer = reviewData.reviewerName || 'Finance & Accounts';
        const remarks = reviewData.remarks || 'Rejected during Finance documentation audit';

        item.financeStatus = 'Rejected';
        item.status = 'Rejected';
        item.financeReviewer = reviewer;
        item.financeReviewedOn = today;
        item.financeRemarks = remarks;
        item.settlementStatus = 'None';

        if (!Array.isArray(item.auditHistory)) {
            item.auditHistory = [];
        }

        item.auditHistory.push({
            id: `aud-${Date.now()}-fin`,
            stage: 'Finance Review',
            action: 'Finance Rejected',
            actor: reviewer,
            timestamp: new Date().toISOString(),
            remarks,
            details: `Finance rejected claim during audit: ${remarks}`,
        });

        storage.setExpenses([...list]);

        // Notification 10: Finance rejects
        dispatchNotification({
            type: 'Finance',
            targetRole: 'employee',
            title: 'Expense Claim Rejected by Finance',
            message: `Claim ${item.expenseNumber} was rejected during Finance audit: ${remarks}`,
            actionLink: '/hr/expenses',
        });

        return new Promise(resolve => setTimeout(() => resolve(item), 100));
    },

    raiseQuery: async (id, queryData = {}) => {
        const list = storage.getExpenses();
        const item = list.find((e) => e.id === id || e.expenseNumber === id);
        if (!item) {
            throw new Error(`Expense claim with ID ${id} not found.`);
        }

        if (!queryData.message || queryData.message.trim().length < 5) {
            throw new Error('Query message must be at least 5 characters explaining what clarification is required.');
        }

        if (item.settlementStatus === 'Settled' || item.status === 'Settled') {
            throw new Error('Cannot raise query on an already settled claim.');
        }

        const now = new Date().toISOString();
        const queryId = `QRY-EXP-${Date.now().toString().slice(-6)}`;
        const raisedBy = queryData.raisedBy || 'Finance & Accounts Officer';

        item.queryStatus = 'Query Raised';
        item.queryId = queryId;
        item.queryRaisedBy = raisedBy;
        item.queryRaisedOn = now;
        item.queryMessage = queryData.message.trim();
        item.queryResponse = null;
        item.queryRespondedOn = null;
        item.queryResolvedOn = null;

        if (!Array.isArray(item.auditHistory)) {
            item.auditHistory = [];
        }

        item.auditHistory.push({
            id: `aud-${Date.now()}-qry`,
            stage: 'Finance Query',
            action: 'Query Raised',
            actor: raisedBy,
            timestamp: now,
            remarks: queryData.message.trim(),
            details: `Finance raised query: "${queryData.message.trim()}". Settlement blocked until resolved.`,
        });

        storage.setExpenses([...list]);

        // Notification 7: Finance raises query -> To Employee
        dispatchNotification({
            type: 'Finance',
            targetRole: 'employee',
            title: 'Clarification Required on Expense Claim',
            message: `Finance raised a query on claim ${item.expenseNumber}: "${queryData.message.trim()}"`,
            actionLink: '/hr/expenses',
        });

        return new Promise(resolve => setTimeout(() => resolve(item), 100));
    },

    respondQuery: async (id, responseData = {}) => {
        const list = storage.getExpenses();
        const item = list.find((e) => e.id === id || e.expenseNumber === id);
        if (!item) {
            throw new Error(`Expense claim with ID ${id} not found.`);
        }

        if (item.queryStatus !== 'Query Raised') {
            throw new Error(`No active query awaiting response on claim ${item.expenseNumber} (Current query status: ${item.queryStatus}).`);
        }

        if (!responseData.response || responseData.response.trim().length < 3) {
            throw new Error('Please enter a response to clarify the query.');
        }

        const now = new Date().toISOString();
        const responder = responseData.respondedBy || item.employeeName;

        item.queryStatus = 'Employee Responded';
        item.queryResponse = responseData.response.trim();
        item.queryRespondedOn = now;
        if (responseData.attachment) {
            item.queryAttachment = responseData.attachment;
        }

        if (!Array.isArray(item.auditHistory)) {
            item.auditHistory = [];
        }

        item.auditHistory.push({
            id: `aud-${Date.now()}-resp`,
            stage: 'Employee Response',
            action: 'Query Responded',
            actor: responder,
            timestamp: now,
            remarks: responseData.response.trim(),
            details: `Employee submitted response: "${responseData.response.trim()}".`,
        });

        storage.setExpenses([...list]);

        // Notification 8: Employee responds -> To Finance
        dispatchNotification({
            type: 'Finance',
            targetRole: 'hr',
            title: 'Query Response Received',
            message: `${item.employeeName} submitted response on claim ${item.expenseNumber}. Ready for re-review.`,
            actionLink: '/finance/claims',
        });

        return new Promise(resolve => setTimeout(() => resolve(item), 100));
    },

    resolveQuery: async (id, resolverData = {}) => {
        const list = storage.getExpenses();
        const item = list.find((e) => e.id === id || e.expenseNumber === id);
        if (!item) {
            throw new Error(`Expense claim with ID ${id} not found.`);
        }

        if (item.queryStatus !== 'Employee Responded' && item.queryStatus !== 'Query Raised') {
            throw new Error(`Cannot resolve query: status is already '${item.queryStatus}'.`);
        }

        const now = new Date().toISOString();
        const resolver = resolverData.resolvedBy || 'Finance & Accounts';

        item.queryStatus = 'Resolved';
        item.queryResolvedOn = now;

        if (!Array.isArray(item.auditHistory)) {
            item.auditHistory = [];
        }

        item.auditHistory.push({
            id: `aud-${Date.now()}-res`,
            stage: 'Finance Query',
            action: 'Query Resolved',
            actor: resolver,
            timestamp: now,
            remarks: resolverData.remarks || 'Clarification verified and accepted',
            details: `Finance reviewed clarification and marked query resolved.`,
        });

        storage.setExpenses([...list]);
        return new Promise(resolve => setTimeout(() => resolve(item), 100));
    },

    settleExpense: async (id, settlementData = {}) => {
        const list = storage.getExpenses();
        const item = list.find((e) => e.id === id || e.expenseNumber === id);
        if (!item) {
            throw new Error(`Expense claim with ID ${id} not found.`);
        }

        // Rule 1: HR Approval Check
        if (item.hrStatus !== 'Approved' && item.hrStatus !== 'Partially Approved') {
            throw new Error(`Settlement Blocked: HR must approve the claim before settlement. Current HR status: ${item.hrStatus || item.status}`);
        }

        // Rule 2: Finance Review Approval Check
        if (item.financeStatus !== 'Approved') {
            throw new Error(`Settlement Blocked: Claim must be verified and approved by Finance first. Current Finance status: ${item.financeStatus}`);
        }

        // Rule 3: Query Outstanding Check
        if (item.queryStatus === 'Query Raised') {
            throw new Error('Settlement Blocked: Cannot settle claim while an active query is outstanding.');
        }

        // Rule 4: Already Settled Check (Idempotency)
        if (item.settlementStatus === 'Settled' || item.status === 'Settled') {
            throw new Error(`Claim ${item.expenseNumber} has already been settled and disbursed.`);
        }

        // Rule 5: Payable amount is STRICTLY HR Approved Amount
        const payableAmount = Number(item.hrApprovedAmount !== undefined ? item.hrApprovedAmount : item.approvedAmount || 0);
        if (payableAmount <= 0) {
            throw new Error('Cannot settle a claim with ₹0 approved payable amount.');
        }

        const today = new Date().toLocaleDateString('en-CA');
        const settlementRef = typeof settlementData === 'string'
            ? settlementData
            : (settlementData?.settlementReference || `STL-EXP-${Date.now().toString().slice(-6)}`);
        const settledBy = typeof settlementData === 'object' && settlementData?.settledBy
            ? settlementData.settledBy
            : 'Finance & Accounts';
        const settlementDate = typeof settlementData === 'object' && settlementData?.settlementDate ? settlementData.settlementDate : today;

        // REQUIREMENT 11: FINANCE WRITE INTEGRITY & FAILURE HANDLING
        // Post transaction and journal entry FIRST. If either fails, do NOT mark claim as Settled.
        try {
            // Check idempotency in finance ledger to prevent duplicate entries
            const existingTxns = await financeService.getTransactions();
            const alreadyHasTxn = existingTxns.some(t => t.referenceDoc === item.expenseNumber);

            if (!alreadyHasTxn) {
                await financeService.recordTransaction({
                    type: 'Payment',
                    partyName: item.employeeName,
                    referenceDoc: item.expenseNumber,
                    paymentMode: settlementData.paymentMode || 'Direct Bank Transfer (NEFT)',
                    bankAccount: settlementData.bankAccount || 'HDFC Corporate Current A/c - 5020001892',
                    amount: payableAmount,
                    status: 'Completed',
                    remarks: `Settlement disbursement for expense claim ${item.expenseNumber} (${item.category} - ${item.project})`,
                    date: settlementDate,
                });

                await financeService.createAccountingEntry({
                    entryNumber: `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    date: settlementDate,
                    entryType: 'Payment Voucher',
                    reference: item.expenseNumber,
                    debitAccount: `5001 - Field Exploration Direct Expense (${item.category})`,
                    debitAmount: payableAmount,
                    creditAccount: '1002 - HDFC Bank Corporate A/c (Disbursement)',
                    creditAmount: payableAmount,
                    status: 'Posted',
                    narration: `Direct claim reimbursement settlement for ${item.employeeName} (${item.expenseNumber})`,
                });
            }
        } catch (finErr) {
            // If finance write fails, DO NOT mark claim as Settled!
            console.error('Critical Finance synchronization failure during expense settlement:', finErr);
            throw new Error(`Finance ledger write failed: ${finErr.message || 'Unknown error'}. Claim remains pending and was NOT marked settled.`);
        }

        // ONLY AFTER SUCCESSFUL FINANCE TRANSACTION: Mark claim Settled
        item.status = 'Settled';
        item.settlementStatus = 'Settled';
        item.settledAmount = payableAmount;
        item.settledOn = settlementDate;
        item.settlementDate = settlementDate;
        item.settledBy = settledBy;
        item.settlementReference = settlementRef;

        if (!Array.isArray(item.auditHistory)) {
            item.auditHistory = [];
        }

        item.auditHistory.push({
            id: `aud-${Date.now()}-stl`,
            stage: 'Settlement',
            action: 'Claim Settled',
            actor: settledBy,
            timestamp: new Date().toISOString(),
            details: `Settled and disbursed ₹${payableAmount.toLocaleString('en-IN')} via ${settlementRef}. Accounting entry posted to ledger.`,
        });

        storage.setExpenses([...list]);

        // Notification 11: Claim settled -> To Employee
        dispatchNotification({
            type: 'Finance',
            targetRole: 'employee',
            title: 'Expense Claim Settled',
            message: `Claim ${item.expenseNumber} has been settled. ₹${payableAmount.toLocaleString('en-IN')} disbursed via ${settlementRef}.`,
            actionLink: '/hr/expenses',
        });

        return new Promise(resolve => setTimeout(() => resolve(item), 100));
    },

    updateExpenseStatus: async (id, status, remarks, approvedAmount) => {
        return expenseService.reviewExpense(id, {
            status,
            remarks,
            approvedAmount: approvedAmount !== undefined ? approvedAmount : (status === 'Approved' ? undefined : 0)
        });
    }
};
