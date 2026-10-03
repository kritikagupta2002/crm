# BANSAL GEO CRM/HRMS MOBILE MIGRATION
## Expense Management Feature Parity Matrix

This document provides a comprehensive mapping between the existing web application's Expense Management module (`crm/src/hrms/modules/expenses/`) and the newly migrated React Native mobile implementation (`mobile/src/screens/expenses/` and `mobile/src/services/expense.service.ts`).

---

### 1. Source-to-Mobile Mapping

| Web Source File | Mobile Screen | Mobile Component | Business Rule Preserved | Validation & Logic | Role Access | Persistence Key | Status |
|---|---|---|---|---|---|---|---|
| `ExpenseDashboard.jsx`, `ExpenseListPage.jsx` | `ExpensesScreen.tsx` | `AppHeader`, `Card`, `StatusBadge`, `Input`, `EmptyState`, `ReceiptPreviewModal` | Real-time KPI aggregation (Total Claimed, Approved, Under Query, Settled), status segmentation | Zero-fake data; dynamic aggregation from active claims; search across staff, project, category | Employee (Own claims only), HR/Admin (All company claims), Accountant (Claims ready for settlement) | `@bgspl_expenses`, `@bgspl_queries` | ✅ 100% Complete |
| `ExpenseClaimFormModal.jsx`, `NewExpensePage.jsx` | `ExpenseClaimScreen.tsx` | `Card`, `Input`, `Button`, `CategoryChips`, `ProjectChips`, `AttachmentPicker`, `PreviewModal` | Employee lodging of field expenses, standard 4 categories, receipt attachment | Amount > 0, Date $\le$ today, Description $\ge 10$ chars, Project required, Duplicate detection | All authenticated staff | `@bgspl_expenses` | ✅ 100% Complete |
| `ExpenseReview.jsx`, `ExpenseApprovalsPage.jsx` | `ExpenseReviewScreen.tsx` | `Card`, `StatusBadge`, `Button`, `Modal`, `HistoryTimeline`, `ReceiptViewer` | HR adjudication: Full approval, Partial approval with deduction, Rejection, Query trigger | Strict over-approval protection ($Approved \le Requested$), non-negative approved amount, audit history recording | HR, Admin | `@bgspl_expenses` | ✅ 100% Complete |
| `ExpenseQueries.jsx` | `ExpenseQueriesScreen.tsx` | `Card`, `StatusBadge`, `Input`, `Button`, `Modal`, `EmptyState` | Interactive clarification thread between HR auditor and employee | Query $\ge 5$ chars, reply $\ge 3$ chars; re-submission resets claim to `Pending` on SAME record (no duplicate claim) | Employee (Own queries), HR/Admin (All queries) | `@bgspl_queries`, `@bgspl_expenses` | ✅ 100% Complete |
| `ExpenseSettlement.jsx` | `ExpenseSettlementScreen.tsx` | `Card`, `Input`, `Button`, `ModeChips`, `LedgerPreviewBox` | Disbursement execution for Approved / Partially Approved claims with UTR recording | UTR $\ge 4$ chars, valid settlement date $\le$ today, payable amount strictly equals approved amount | Accountant, Admin | `@bgspl_expenses`, `@bgspl_vouchers` | ✅ 100% Complete |
| `expense.service.js` | `expense.service.ts` | `ExpenseService` | Canonical schema, duplicate detection, approval math, query lifecycle, settlement, voucher creation | Service-layer validation, idempotency guards, double-entry voucher posting | System-wide | `@bgspl_expenses`, `@bgspl_queries`, `@bgspl_vouchers` | ✅ 100% Complete |

---

### 2. Preserved Business Rules & Validation

1. **Expense Categories:**
   - Strictly preserved canonical categories:
     - `Travel & Conveyance`
     - `Lodging & Accommodation`
     - `Food & Meals`
     - `Field Supplies`

2. **Amount Validation:**
   - Claim amount must be numeric and strictly $> 0$.
   - Negative, zero, or `NaN` claims are blocked with immediate inline error feedback.

3. **Date Validation:**
   - Incurred date is required.
   - Future expense dates ($date > today$) are strictly blocked.

4. **Description Validation:**
   - Detailed justification is required.
   - Minimum length: 10 characters. Live character counter provided.

5. **Duplicate Claim Detection:**
   - Blocks submission if a claim with identical `employeeId`, `date`, `category`, and `amount` already exists in pending or approved status.

6. **Receipt Attachment:**
   - Supported natively with file picker simulation, file name, file size, and MIME type metadata.
   - Provides pre-submission image/document preview and ability to remove or replace receipt before submission.
   - Post-submission receipt viewer modal available to both employee and HR auditor.

7. **Status Lifecycle Transitions:**
   - Initial State: `Pending`
   - Full Approval: HR approves $100\%$ requested amount $\to$ `status = 'Approved'`, `approvedAmount = requestedAmount`, `rejectedAmount = 0`.
   - Partial Approval: HR sanctions $0 < approved < requested \to$ `status = 'Partially Approved'`, `approvedAmount = sanctioned`, `rejectedAmount = requested - sanctioned`.
   - Over-Approval Protection: Any attempt to enter $Approved > Requested$ is blocked at UI and service layers with clear error messaging.
   - Rejection: HR rejects $\to$ `status = 'Rejected'`, `approvedAmount = 0`, `rejectedAmount = requested`. Auditor remarks recorded.
   - Settlement: Accountant settles $\to$ `status = 'Settled'`, `settlementStatus = 'Settled'`.

8. **Clarification Query Workflow:**
   - HR auditor enters clarification message ($\ge 5$ characters) $\to$ Claim status becomes `Queried`, `queryStatus = 'Query Raised'`.
   - Claim displays clarification alert banner and appears in employee's query inbox.
   - Employee enters clarification reply ($\ge 3$ characters).
   - Upon submission, claim status returns to `Pending` for re-audit.
   - The claim remains connected to the **SAME** expense record; **NO DUPLICATE CLAIM** is created.
   - Audit trail stores chronological thread: Auditor query, employee reply, actor identities, and timestamps.

9. **Settlement & Disbursement Workflow:**
   - Only `Approved` or `Partially Approved` claims can be settled.
   - Active queries (`queryStatus === 'Query Raised'`) strictly block settlement.
   - Already settled claims are idempotently blocked from duplicate disbursement.
   - Requires valid Disbursement Reference / UTR ($\ge 4$ characters).
   - Supported payment modes: `Bank Transfer`, `UPI`, `Cheque`.
   - Settlement date must be $\le today$.
   - Settled amount is strictly the `approvedAmount`.

10. **Finance Integration Boundary:**
    - Settlement automatically executes cross-module voucher creation into `@bgspl_vouchers` in `mobileStorage`:
      - **Debit**: `5001 - Field Exploration Direct Expense ({category})`
      - **Credit**: `1002 - HDFC Bank Corporate A/c ({paymentMode})`
      - **Amount**: `exp.settledAmount`
      - **Narration**: `Disbursement of claim {expenseNumber} to {employeeName} ({category}) - UTR: {utrRef}`
      - **Reference**: `exp.id`
    - Idempotency guard prevents duplicate vouchers if settlement is re-evaluated.
    - Preserves boundary without fabricating a fake Finance UI.

11. **Strict Employee Data Isolation:**
    - Regular employees (`role === 'employee'`) strictly see only their own claims and queries.
    - Other employees' claims, amounts, descriptions, review remarks, receipts, and settlements are inaccessible.
    - HR and Admin have organization-wide visibility to audit and query claims.
    - Accountant has organization-wide visibility into approved claims ready for settlement.

---

### 3. Verification & Automated Test Results

Tested via automated test suite `mobile/scripts/test-expense-reimbursement-parity.js`:
- ✅ Test 1: Employee opens Expenses list
- ✅ Test 2: Employee submits valid Travel claim
- ✅ Test 3: Claim saved as Pending
- ✅ Test 4: Invalid negative or zero amount blocked
- ✅ Test 5: Future date blocked
- ✅ Test 6: Description under 10 characters blocked
- ✅ Test 7: Receipt attached and persisted
- ✅ Test 8: HR sees correct claim
- ✅ Test 9: HR fully approves
- ✅ Test 10: HR partially approves (Approved = ₹6,000, Rejected = ₹4,000)
- ✅ Test 11: Over-approval (> requested) blocked
- ✅ Test 12: HR raises query
- ✅ Test 13: Claim becomes Queried
- ✅ Test 14: Employee responds to query
- ✅ Test 15: Re-submission resets status to Pending on SAME record without duplicate
- ✅ Test 16: Accountant sees approved claim
- ✅ Test 17: Valid settlement changes claim to Settled
- ✅ Test 18: Settlement reference, payment mode, and date persist
- ✅ Test 19: Finance integration posts Payment Voucher with matching amount
- ✅ Test 20: Strict data isolation: employee cannot see other employees' claims
- ✅ Test 21: Persistence across app restarts
- **Result: 21 / 21 Expense tests PASSED**

---

### 4. Known Boundaries & Limitations

- **Frontend-Only**: No remote REST/GraphQL backend is used; data persists via `AsyncStorage` (`mobileStorage`).
- **Finance Module Boundary**: The double-entry payment voucher is written directly to `@bgspl_vouchers` so it is ready for the future Finance migration phase; no fake Finance dashboard UI was introduced.
- **Physical Receipt Storage**: Receipts are represented by simulated metadata and preview data URLs rather than uploading to a remote S3/GCS bucket.
