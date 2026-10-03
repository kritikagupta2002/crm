# Production Release Checklist
## Bansal Geo CRM, HRMS & ERM Mobile Application

> **Version**: 1.0.0 (Build 1)  
> **Target OS**: Android (API 24+) & iOS (13.4+)  
> **Framework**: React Native 0.76.7 / Expo SDK 52  
> **Sign-off Date**: October 2026

---

## 1. Application Configuration Audit

- [x] **App Name**: `Bansal Geo CRM` (Configured in `app.json`)
- [x] **App Slug**: `bansal-geo-mobile`
- [x] **Semantic Version**: `1.0.0`
- [x] **Android Application ID (Package)**: `com.bansalgeo.crm`
- [x] **Android Version Code**: `1`
- [x] **iOS Bundle Identifier**: `com.bansalgeo.crm`
- [x] **Orientation**: `portrait` locked
- [x] **User Interface Style**: Adaptive light mode with dark enterprise accents (`#0F172A`)
- [x] **Predictive Back Gestures**: Disabled in Android to prevent unintended state loss during multi-step forms

---

## 2. Static Asset Verification

- [x] **App Launcher Icon**: `assets/icon.png` (1024x1024 px PNG)
- [x] **Android Adaptive Icon (Foreground)**: `assets/android-icon-foreground.png`
- [x] **Android Adaptive Icon (Background)**: `assets/android-icon-background.png` (`#0F172A`)
- [x] **Android Monochrome Icon**: `assets/android-icon-monochrome.png`
- [x] **Splash Screen Asset**: `assets/splash-icon.png` (Configured with `#0F172A` background)
- [x] **Web Favicon**: `assets/favicon.png`

---

## 3. Android Permissions & Privacy Compliance

- [x] **Camera**: `android.permission.CAMERA` (Required for geotag check-in and KYC document capture)
- [x] **Storage Read**: `android.permission.READ_EXTERNAL_STORAGE` (Required for document picker and invoice/slip sharing)
- [x] **Excessive Permissions Stripped**:
  - No `ACCESS_BACKGROUND_LOCATION`
  - No `READ_CONTACTS` / `WRITE_CONTACTS`
  - No `READ_SMS` / `RECEIVE_SMS`
  - No `RECORD_AUDIO`

---

## 4. Security & Role-Based Access Control (RBAC)

- [x] **Role Permission Matrix**: Enforces 5 distinct system roles (`admin`, `hr`, `manager`, `accountant`, `employee`)
- [x] **Portal Isolation**:
  - Client accounts isolated to `ClientPortalScreen`
  - Vendor accounts isolated to `VendorPortalScreen`
  - Unauthorized direct deep links blocked
- [x] **Employee Self-Service Isolation**:
  - Regular staff cannot access the company-wide Staff Directory
  - Regular staff cannot inspect other employees' private salaries, payslips, or KYC records
  - Staff attempts to open other employee profiles are blocked with privacy shield dialogs
- [x] **Financial Governance**:
  - Ledger, Vouchers, Invoices, TDS, and GST modules guarded by `hasRole(['Admin', 'Accountant'])`
  - Strict 4-eyes separation on CRM quotations and document approvals

---

## 5. Storage Architecture & Resilience

- [x] **Persistence Engine**: Key-value JSON storage via `@react-native-async-storage/async-storage`
- [x] **Attachment Storage Engine**: Sandboxed filesystem via `expo-file-system` and `expo-sharing`
- [x] **Separation of Concerns**: CRM EDMS and HRMS KYC Vault operate under distinct storage namespaces
- [x] **Cold Start & Restart Recovery**: State survives complete mobile app termination and reboot
- [x] **Cross-Module Side Effects**:
  - Staff onboarding automatically provisions leave quotas, default shift, and salary structures
  - Approved leave synchronously updates live attendance muster to `On Leave`
  - Approved expense claims synchronously create financial payment vouchers upon settlement

---

## 6. Form Validation & Data Integrity

- [x] **Positive Amounts**: Enforced across leads, quotes, invoices, bills, expenses, and vouchers
- [x] **Negative / Zero Amount Guards**: Throws explicit validation errors
- [x] **Date Chronology**: Rejects inverted date ranges (End Date < Start Date)
- [x] **Policy Quota Limits**: Casual Leave restricted to maximum 3 consecutive days
- [x] **Attachment Ceilings**: Document uploads restricted to 10 MB maximum
- [x] **File Format Whitelist**: Restricted to `.pdf`, `.png`, `.jpg`, `.jpeg`

---

## 7. Automated QA & Parity Suites

- [x] **TypeScript Strict Check**: `npx tsc --noEmit` passed with 0 errors
- [x] **Integration QA Suite**: `scripts/test-full-integration-qa.js` (17/17 passed)
- [x] **HR Documents Parity Suite**: `scripts/test-hr-documents-parity.js` (36/36 passed)
- [x] **Payroll Parity Suite**: `scripts/test-payroll-parity.js` (47/47 passed)
- [x] **Expense & Reimbursement Suite**: `scripts/test-expense-reimbursement-parity.js` (34/34 passed)
- [x] **Leave Parity Suite**: `scripts/test-leave-parity.js` (14/14 passed)
- [x] **Shift & Roster Parity Suite**: `scripts/test-shift-roster-parity.js` (31/31 passed)
- [x] **Total Automated Mobile Assertions**: **179/179 PASSED (100%)**

---

## 8. Mobile UX & Viewport Adaptability

- [x] **Tested Form Factors**: 320px, 360px, 375px, 390px, 412px widths
- [x] **Responsive Cards**: All lists utilize vertical stacking and native cards
- [x] **Touch Target Compliance**: Minimum 44x44 dp touch targets for buttons and interactive controls
- [x] **Loading & Empty States**: Every screen features loading spinners and styled empty state vectors
- [x] **Offline Export**: RFC 4180 CSV export and native QR code generator rendering without web-specific DOM dependencies

---

## 9. Production Release Prerequisites (External Blockers)

To generate a store-ready signed APK or Google Play AAB:
1. **Google Play Developer Account**: Organization account registration.
2. **Production Keystore**:
   ```bash
   keytool -genkey -v -keystore bgs-release.keystore -alias bgs-key -keyalg RSA -keysize 2048 -validity 10000
   ```
3. **EAS Build Configuration**: Initialize `eas.json` with cloud build profiles or execute local Gradle release build (`npx expo run:android --variant release`).
