# BANSAL GEO CRM/HRMS MOBILE MIGRATION
## Travel & Field Reimbursement Feature Parity Matrix

This document provides a comprehensive mapping between the existing web application's Reimbursement module (`crm/src/hrms/modules/reimbursement/`) and the newly migrated React Native mobile implementation (`mobile/src/screens/expenses/ReimbursementScreen.tsx` and `mobile/src/services/reimbursement.service.ts`).

---

### 1. Source-to-Mobile Mapping

| Web Source File | Mobile Screen | Mobile Component | Business Rule Preserved | Validation & Logic | Role Access | Persistence Key | Status |
|---|---|---|---|---|---|---|---|
| `ReimbursementDashboard.jsx`, `ReimbursementListPage.jsx` | `ReimbursementScreen.tsx` | `AppHeader`, `Card`, `StatusBadge`, `TabBar`, `EmptyState` | Allowance claim management, role-based tabs (All Claims, Pending Review, Settlement) | Dynamic filtering, zero fake records, search across employee, category, and remarks | Employee (Own claims only), HR (Pending review queue), Accountant (Approved claims queue) | `@bgspl_reimbursements` | ✅ 100% Complete |
| `ReimbursementClaimModal.jsx`, `ReimbursementListPage.jsx` | `ReimbursementScreen.tsx` (`BuilderModal`) | `Modal`, `Input`, `CatChips`, `RatePresets`, `TierPicker`, `Switch`, `Button` | Transparent formula calculation for Vehicle Mileage and Daily Allowance, Client-Billable toggle | KM > 0, Days > 0, Rate > 0, Date $\le$ today, Remarks $\ge 5$ chars, Duplicate detection | All authenticated staff | `@bgspl_reimbursements` | ✅ 100% Complete |
| `reimbursement.service.js` (`reviewClaim`) | `ReimbursementScreen.tsx` (`ReviewModal`) | `Modal`, `Input`, `Button`, `StatusBadge` | Multi-tier adjudication: Full approval, Partial approval with deduction, Rejection with remarks | Strict over-approval protection ($Approved \le Claimed$), non-negative approved amount | HR, Admin | `@bgspl_reimbursements` | ✅ 100% Complete |
| `reimbursement.service.js` (`raiseQuery`, `respondQuery`) | `ReimbursementScreen.tsx`, `reimbursement.service.ts` | `ReimbursementService` | Clarification query thread on claim; re-submission resets status to `Pending` on SAME record | Query $\ge 5$ chars, reply $\ge 3$ chars, no duplicate claim created | Employee (Own claims), HR/Admin | `@bgspl_reimbursements` | ✅ 100% Complete |
| `reimbursement.service.js` (`settleClaim`) | `ReimbursementScreen.tsx` (`SettlementModal`) | `Modal`, `Input`, `Button`, `ModeChips`, `LedgerNotice` | Disbursement execution for Approved / Partially Approved claims with UTR recording | UTR $\ge 4$ chars, valid settlement date $\le$ today, payable amount strictly equals approved amount | Accountant, Admin | `@bgspl_reimbursements`, `@bgspl_vouchers` | ✅ 100% Complete |
| `reimbursement.service.js` | `reimbursement.service.ts` | `ReimbursementService` | Canonical schema, mileage math, DA hardship tiers, client-billable tagging, voucher creation | Service-layer validation, idempotency guards, double-entry voucher posting | System-wide | `@bgspl_reimbursements`, `@bgspl_vouchers` | ✅ 100% Complete |

---

### 2. Preserved Business Rules & Validation

1. **Reimbursement Concepts & Categories:**
   - **Vehicle Mileage Allowance (`Vehicle Mileage`):**
     - Formula: $\text{Calculated Claim Amount} = \text{Kilometers Driven} \times \text{Applicable Rate Per KM}$.
     - Configured tariff rates from source:
       - Four-Wheeler / Field Jeep: ₹12/KM
       - Two-Wheeler / Bike: ₹6/KM
     - Both KM and Rate/KM are validated strictly $> 0$.
     - Live formula preview displayed transparently in UI: `KM × ₹RATE = ₹TOTAL`.
   - **Field Deployment Daily Allowance (DA) (`Field Deployment Daily Allowance (DA)`):**
     - Supported Remote Site Hardship Tiers:
       - **Tier 1 - HQ / Metro Transit**: ₹800/day
       - **Tier 2 - District Site / Camp**: ₹1,200/day
       - **Tier 3 - Remote Rig / Forest Camp**: ₹1,500/day
     - Formula: $\text{Calculated Claim Amount} = \text{Days} \times \text{Tier Rate}$.
     - Both Days and Rate/day are validated strictly $> 0$.
     - Live formula preview displayed transparently in UI: `Days × ₹RATE = ₹TOTAL`.
   - **Remote Site Hardship Allowance (`Remote Site Hardship`):**
     - Tiered remote field hardship per diem.
   - **Mobile & Internet Allowance (`Mobile & Internet`):**
     - Incurred communication allowance capped to standard corporate policy limit (₹2,500/month).

2. **Client-Billable Tagging:**
   - Preserves source client-billable property.
   - Provided via clear native switch toggle: `Client-Billable Tag` (Charge back directly to exploration client project account).
   - Displayed with visual verification badge on claim card.

3. **Date & Remarks Validation:**
   - Incurred date required and strictly $\le today$. Future claim dates are blocked.
   - Justification remarks required with a minimum of 5 characters.

4. **Duplicate Claim Detection:**
   - Blocks submission if a claim with identical `employeeId`, `category`, `date`, and `amount` already exists in pending or approved status.

5. **Multi-Tier Review & Over-Approval Protection:**
   - Full Approval: Approves $100\%$ claimed amount $\to$ `status = 'Approved'`, `approvedAmount = claimed`, `rejectedAmount = 0`.
   - Partial Approval: Sanctions permissible amount $0 < approved < claimed \to$ `status = 'Partially Approved'`, `approvedAmount = sanctioned`, `rejectedAmount = claimed - sanctioned`.
   - Over-Approval Protection: $Approved > Claimed$ is blocked with clear reviewer error feedback.
   - Rejection: Marks `status = 'Rejected'`, `approvedAmount = 0`, `rejectedAmount = claimed`. Reviewer notes recorded.

6. **Settlement & Finance Ledger Integration:**
   - Only `Approved` or `Partially Approved` claims can be settled.
   - Requires valid Disbursement Reference / UTR ($\ge 4$ characters).
   - Supported payment modes: `Bank Transfer`, `UPI`, `Cheque`.
   - Settlement date must be $\le today$.
   - Settled amount is strictly the `approvedAmount`.
   - Automatically posts double-entry Payment Voucher to `@bgspl_vouchers` in `mobileStorage`:
     - **Debit**: `5100 - Employee Allowance & Welfare ({category})`
     - **Credit**: `1002 - HDFC Bank Corporate A/c ({paymentMode})`
     - **Amount**: `claim.settledAmount`
     - **Narration**: `Disbursement for allowance claim {claimId} ({employeeName} - {category}) - Ref: {utrRef}`
     - **Reference**: `claim.id`
   - Idempotency guard prevents duplicate vouchers.

7. **Strict Employee Data Isolation:**
   - Regular employees (`role === 'employee'`) strictly see only their own reimbursement claims.
   - Other employees' mileage, amounts, site visits, remarks, review outcomes, and disbursements are completely segregated.
   - HR and Admin have organization-wide visibility to review claims.
   - Accountant has organization-wide visibility into approved claims ready for settlement.

---

### 3. Verification & Automated Test Results

Tested via automated test suite `mobile/scripts/test-expense-reimbursement-parity.js`:
- ✅ Test 22: Employee creates mileage claim
- ✅ Test 23: KM × rate calculation is correct (250 KM × ₹12 = ₹3,000)
- ✅ Test 24: Invalid/zero mileage blocked
- ✅ Test 25: Employee creates field deployment DA claim
- ✅ Test 26: Hardship tier/rate calculation follows source (5 days × ₹1,200 = ₹6,000)
- ✅ Test 27: Mobile & Internet allowance works according to source
- ✅ Test 28: Client-billable tagging preserved
- ✅ Test 29: Multi-tier review works (HR approval stage)
- ✅ Test 30: Invalid approval amount (> claimed amount) blocked
- ✅ Test 31: Approved & Partially approved claims reach settlement
- ✅ Test 32: Reimbursement settlement is persisted
- ✅ Test 33: Reimbursement settlement posts voucher to Finance ledger boundary
- ✅ Test 34: Strict data isolation: employee only sees own reimbursement claims
- **Result: 13 / 13 Reimbursement tests PASSED**

---

### 4. Known Boundaries & Limitations

- **Frontend-Only**: No remote REST/GraphQL backend is used; data persists via `AsyncStorage` (`mobileStorage`).
- **Finance Module Boundary**: Payment vouchers are written to `@bgspl_vouchers` so they can be consumed when Finance is migrated; no fake Finance dashboard UI was created.
- **Physical Mileage Logs**: Mileage calculations rely on employee-entered kilometers and standard company vehicle tariffs.
