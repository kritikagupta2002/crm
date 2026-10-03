# BANSAL GEO CRM/HRMS MOBILE MIGRATION
## MIS / Dashboards / Analytics & Reports Feature Parity Matrix

This document provides a comprehensive mapping between the existing web application's MIS & Reporting dashboards (`src/pages/dashboard/`, `src/pages/reports/`, `src/hrms/modules/reports/`, and `src/hrms/modules/finance/pages/FinancialReportsPage.jsx`) and the newly migrated React Native mobile implementation (`mobile/src/screens/reports/MisReportsScreen.tsx` and `mobile/src/services/mis.service.ts`).

---

### 1. Source-to-Mobile Architecture Mapping

| Web Source File | Mobile Screen / Component | Functional Responsibility | Business Parity & Derivation Rules | Role Access | Export Support | Status |
|---|---|---|---|---|---|---|
| `src/pages/dashboard/DashboardPage.jsx`, `StatCards.jsx`, `LeadPipeline.jsx` | `MisReportsScreen.tsx` (`exec` Tab), `NativeBarChart.tsx` | CRM Executive Overview & Pipeline | Real-time calculation of Total Pipeline, Won Leads, Conversion %, 6-month Enquiries vs Won trend | Super Admin, Director, Manager, Sales | Native CSV Export via `expo-sharing` | ✅ 100% Complete |
| `src/pages/reports/PnlReport.jsx` | `MisReportsScreen.tsx` (`exec` Tab) | Board-Level Profitability & Margins | Gross Billings, Subcontractor Costs, EBITDA %, Working Capital Spread (clearly labeled as a projection) | Super Admin, Director, Finance Master | Native CSV Export via `expo-sharing` | ✅ 100% Complete |
| `src/pages/reports/ProjectReports.jsx`, `ErmDashboard.jsx` | `MisReportsScreen.tsx` (`projects` Tab) | Operations & 7-Stage Geological Lifecycle | Drilling Meters, Topographical Acreage, Deliverables Completion Rate, 7-Stage Project Distribution | Super Admin, Director, Project Manager, Lead Engineer | Native CSV Export via `expo-sharing` | ✅ 100% Complete |
| `src/hrms/modules/reports/pages/ReportsPage.jsx` (`attendance`) | `MisReportsScreen.tsx` (`workforce` Tab) | Workforce Muster & Biometric Compliance | **Zero Fake Numbers Engine**: `Absent = max(0, Staff - Present - Leave)`, department breakdown | Admin, HR, Manager | Native CSV Export via `expo-sharing` | ✅ 100% Complete |
| `src/hrms/modules/reports/pages/ReportsPage.jsx` (`leave`, `expenses`) | `MisReportsScreen.tsx` (`controls` Tab) | HR Controls & Compliance Audit | Leave Quota days utilized, Field expenses requested vs approved vs settled, travel reimbursements | Admin, HR, Accountant | Native CSV Export via `expo-sharing` | ✅ 100% Complete |
| `src/hrms/modules/finance/pages/FinancialReportsPage.jsx` | `MisReportsScreen.tsx` (`finance` Tab) | Invoicing, Payables & Statutory Tax | Client AR Invoicing, Collections, Vendor Payables, Estimated GST (18%) and TDS (2%) | Admin, Director, Accountant | Native CSV Export via `expo-sharing` | ✅ 100% Complete |
| `src/hrms/modules/documents/` vs `src/pages/documents/` | `MisReportsScreen.tsx` (`vault` Tab) | Document Vault Isolation & Compliance | Strict separation between CRM EDMS (NAS government letters) and HRMS KYC (Statutory employee credentials) | Admin, HR, Lead Engineer | Native CSV Export via `expo-sharing` | ✅ 100% Complete |

---

### 2. Derivation Formulas (Zero Fake Numbers Principle)

1. **Workforce Attendance Muster:**
   $$\text{Total Staff} = \text{Count of Employees where } \text{employment.status} == \text{'Active'}$$
   $$\text{Present Today} = \text{Count of Attendance Records for Today where } \text{status} \in \{\text{'Present'}, \text{'Field Duty'}\}$$
   $$\text{On Leave Today} = \text{Count of Approved Leaves covering Today}$$
   $$\text{Absent Today} = \max(0, \text{Total Staff} - \text{Present Today} - \text{On Leave Today})$$
   $$\text{Muster Compliance \%} = \frac{\text{Present Today}}{\text{Total Staff}} \times 100$$

2. **Lead Win Conversion Rate:**
   $$\text{Conversion Rate} = \frac{\text{Count of Leads with stage == 'Won'}}{\text{Total Leads Count}} \times 100$$

3. **EBITDA Operating Margin:**
   $$\text{Operating Spread} = \text{Gross Invoiced} - (\text{Subcontractor Costs} + \text{Settled Expenses} + \text{Settled Reimbursements})$$
   $$\text{EBITDA Margin \%} = \frac{\text{Operating Spread}}{\text{Gross Invoiced}} \times 100$$

4. **Projected Cash Flow Velocity (Derived Projection):**
   $$\text{Net Projected Spread} = \text{Uncollected Client Invoices} - \text{Unsettled Vendor Subcontract Bills}$$
   *(Explicitly labeled in the UI as a projected working capital velocity, not realized accounting net).*

5. **Deliverables Completion Rate:**
   $$\text{Completion Rate} = \frac{\text{Count of Delivered Milestone Deliverables}}{\text{Total Contracted Deliverables}} \times 100$$

---

### 3. Native Chart Implementations

The mobile application utilizes `react-native-svg` and native flexbox layouts without third-party heavy charting libraries:
- **`NativeBarChart` (`mobile/src/components/common/NativeCharts.tsx`):**
  - Renders multi-series bar charts (Enquiries vs Won) across 6-month historical intervals.
  - Automatic dynamic Y-axis scaling based on maximum values.
  - Dashed horizontal reference gridlines and color-coded legend indicators.
- **`NativeDistributionList` (`mobile/src/components/common/NativeCharts.tsx`):**
  - Renders horizontal progress distribution meters with percentage labels.
  - Applied across Project Service Mix, 7-Stage Geological Lifecycle, Department Staff Breakdown, and Leave Types.

---

### 4. Filter Dimensions

1. **Period Filter Ribbon:**
   - `All Time`
   - `This Month`
   - `Quarter`
   - `Year`
2. **Department Filter Pills:**
   - `All Departments`
   - `Geology & Mineral Exploration`
   - `Mining Operations`
   - `Surveying & Geomatics`
   - `Finance & Accounts`
   - `Administration & HR`

---

### 5. Traceable Drill-Down Navigation

Tapping any primary KPI card deep-links directly into the underlying operational screen:
- Revenue Pipeline / Win Conversion $\to$ `QuotesScreen` / `LeadsScreen`
- Active Projects $\to$ `ProjectsScreen`
- Pending Director Approvals $\to$ `ClientApprovalsScreen`
- Client Invoicing / Vendor Bills $\to$ `InvoicesScreen` / `VendorBillsScreen`
- Today's Muster $\to$ `AttendanceScreen` / `DailyAttendanceScreen`
- Pending Leaves $\to$ `LeaveScreen`
- Employee KYC Vault $\to$ `EmployeeDocumentsScreen`

---

### 6. Native CSV Export Behavior

- Generates structured, standard RFC 4180-compliant CSV content.
- Writes to local sandboxed storage via `expo-file-system/legacy`.
- Invokes native Android/iOS system share sheet via `expo-sharing` (`Sharing.shareAsync`).
- Users can open files directly in Microsoft Excel, Google Sheets, or share via WhatsApp, AirDrop, and Email.

---

### 7. Known Architectural Limitations

1. **Frontend-Only Persistence:** All MIS aggregations operate locally across `AsyncStorage` records. There is no remote central cloud database in this frontend-only migration phase.
2. **Native Push Notifications:** Background push notification alerts for critical MIS thresholds (e.g. EBITDA margin drop under 40% or muster drop under 70%) are not active; alerts are displayed visually through UI tone badges.
