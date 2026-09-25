# Bansal Geo CRM — handoff summary

For a new chat taking over this project. Read this first, then `README.md` (short, partly outdated).
Last updated: 25 Sep 2026 (HRMS & Finance merged in — see §10).

---

## 1. What this is

A **front-end demo** of a CRM + ERM + portals for **Bansal Geo Solutions Pvt. Ltd.** (mining / geology consultancy, Jaipur; real site: bansalgeo.com — use it for facts only, never its design).
It is for showing the client before real development. **No backend**: all data is mock data; changes made in the demo are kept in the browser's `localStorage`.

- Stack: **React 19 + Vite + plain JavaScript (.jsx/.js, NOT TypeScript)**, react-router-dom 7, recharts, lucide-react icons, oxlint.
- Code style: single quotes, no semicolons, short comments that explain *why*, same idiom as the surrounding code.
- Run: `npm install`, `npm run dev` (port 5173), `npm run build`, `npm run lint`.
- `.claude/launch.json` has the `crm-dev` preview config.
- Deployed: Netlify `incandescent-marigold-cefd9f.netlify.app` and Vercel `crm-kritika23.vercel.app`.
  - `public/_redirects` and `vercel.json` send every URL to `index.html` (without them `/login`, `/portal` gave 404).
  - Vercel still shows a **Vercel login page to other people** because *Settings → Deployment Protection → Vercel Authentication → "Require Log In"* is ON. The user must switch it off and Save (their earlier Save attempt didn't stick). Nothing in the code causes it.

Requirements come from two Excel files in the user's Downloads: **"Software Requirements - Amit Sir.xlsx"** (27 work packages) and **"Vendor_Quote_Evaluation_Sheet_v2.xlsx"** (scope A1–E3, 4 workflow flowcharts, an "Odoo vs Custom" sheet). openpyxl is not installed; read them with a zip/xml script.

---

## 2. How the user works (important)

- The user writes **Hinglish** (Hindi in Latin script + English) and usually wants answers in Hinglish.
- **Discuss before building.** For a new feature or spec: explain the plan and ask questions; **don't write code until they say "start"** (or "bana do", "theek karo", "haan kar do").
- **Keep screens simple but rich**: no AI tells (uppercase eyebrow labels, filler subtitles under every title, fake badges), don't go minimal either. Each figure shown in one place only. Colour code everywhere: blue = new/info, amber = needs attention, red = overdue/lost, green = won/on track (`.tone-*` classes in `index.css`, `stageColors.js`).
- Design: light theme, deep teal `#1F6F78` + gold `#C8943A`, navy text, serif headings (Fraunces) + Inter, contour lines, mountain illustration in the sidebar.
- **Don't add extra roles** (keep the 8 below).
- **Don't touch Nikhil's modules** (everything under `src/hrms/`, `scripts/build-hrms-css.py` and his test scripts): work only on our own CRM, ERM, vendor and portal code. If our change would need something in `src/hrms`, ask the user first.
- The user tests in their own browser; screenshots from them are the ground truth.
- Commit/push: the user does it themselves; give them the commands. Everything since commit `e6bf29f` is **uncommitted** (vendor registration + responsive CSS). They should commit before more work.

---

## 3. App map

Sidebar has 3 accordion sections (`src/components/layout/navigation.js`):

- **CRM Workspace:** Dashboard `/`, Leads & Enquiries `/leads` (+ `/leads/:id`), Follow-ups, Quotations & Proposals, Client Approval, Client Onboarding, Client Master `/clients`, **Client Questions** `/questions`, Reports (Sales / Projects / P&L views).
- **ERM Workspace:** ERM Dashboard `/erm`, Projects `/projects` (+ `/projects/:id` with Overview / Tasks / Field Work / Documents / History tabs; Govt Letters card with a **Scan inbox** tab lives on `/projects`), Tasks, Team, My Tasks (Field Member only).
- **Vendor Workspace:** **Vendor Applications** `/vendor-applications`, **Tenders** `/tenders`, Subcontracts `/subcontracts` (moved here from ERM).
- Profile menu: Switch role (demo), Settings (Admin), Audit log, **Sent messages** `/messages`, Reset demo data, Sign out.

Outside the team layout: `/login` (Team / Client / Vendor tabs), `/portal` (client portal; team preview `/portal?lead=ID`), `/vendor/*` (vendor portal, its own layout: Home, My Account, My Documents, Active Tenders search, My Tenders, My Active Bids, Clarification, Tender Status, My Bids History, My Withdrawn Bids, Work Orders, Payments; tender page + bid at `/vendor/tenders/:id`), `/vendor/register` (public vendor registration + `?track` status check), `/enquiry` (public enquiry form).

Workflow: enquiry → quotation → accepted → Client Approval (PO, advance, agreement) → Won → Onboarding → project in ERM (7 stages: Allocation → Planning → Task assignment → Field & report work → Govt submission → Final approval → Project closure) → subcontracts (issued → started → delivered → bill → 3-way check → payment with TDS).

---

## 4. Roles and permissions (RBAC)

All in `src/context/crm.js`:

- `ROLE_ACCESS` — which pages each role opens, `masked` (no ₹ amounts: Coordinator, Team Lead, Field Member), `pnl`, `bank`, `brief` (short line in the profile menu).
- `ROLE_USERS` — demo person per role: Admin Kritika Gupta, Management Dr. Amit Kumar Bansal, Sales P. Joshi, Project Coordinator A. Singh, Team Lead Dr. Sunita Meena, Finance Chhavi Bansal, Accountant N. Jain (renamed in the HRMS merge so each is also in the HR employee master). **Field Member is per person**: all 6 of the field team (`data/staff.js`) can sign in (picked in Switch role or on the login page); the store's `user` / `fieldMember` say who. Each sees only their own My Tasks.
- `PERMISSIONS` + `useAccess().may(action)` — who may **change** things (a role that can open a page but isn't listed sees it read-only):
  - `sales` Admin, Sales · `contact` Admin, Sales, Coordinator · `payments` Admin, Finance, Accountant · `onboarding` Admin, Coordinator · `projects` Admin, Coordinator, Team Lead · `vendors` Admin only.
  - Checklist steps carry `by` and use `useAccess().locked(step)` ("Marked by Accounts").
  - ERM stage hand-overs: `canActOn(role, stage)` in `utils/projects.js`. Subcontract steps: `BILL_ROLES` / `WORK_ROLES`.
  - **Management sees everything and changes nothing.**
- Settings → Team & Access shows a "Can change" column generated from these tables.
- **Every new button must check one of these.** Every rupee on screen goes through `useMoney()`.
- Known open item: the **Switch role** menu is visible to every role (a field member could switch to Admin). Proposed: show it only to the Admin (preview) and make others sign out/in. User hasn't decided.

---

## 5. Key features built (beyond basic CRM/ERM)

- **Client portal**: projects with 7 stages, approvals, govt letters, documents, payments (UPI QR, report payment → Accounts verifies), quotation accept / request changes, "Ask a question", "Latest updates" feed (only real client-facing events; private team files never appear there).
- **Client questions**: routed by topic (`utils/questions.js`): Billing → Accounts; Project → Coordinator + that project's Team Lead once Won (Sales before); Documents → Coordinator (Sales before Won); Other → Sales. Answered in the `/questions` inbox, on the enquiry page (always-visible "Client questions" section, amber tab badge), lead drawer and Client Master. Leads list shows a "💬 1 question" tag.
- **Documents**: team uploads on an enquiry are **private until shared** (share switch "Team only / Client can see"); client uploads show a "New" tag and a "N new" tab badge.
- **Automations** (`utils/automations.js`, Settings → Automations): events send WhatsApp/email automatically — letter received (with scan), filed with authority, approval step, project closed, quotation, payment receipt, question answered, document shared, task assigned (to the field member), vendor approved / sent back / rejected. Demo **records** them in the outbox (`/messages`, with past messages seeded by `utils/seededMessages.js`); real sending needs the WhatsApp Business API + mail server.
- **Scan inbox** (WP6): scans from the NAS scanner folder (`data/scans.js`) wait in Projects → Govt Letters → Scan inbox; "File to project" links a scan to a project and approval step.
- **Notifications (bell)**: role-scoped — Field Member gets own new/due/late tasks; Team Lead only their projects; payments only to Accounts; vendor registrations only to Admin.
- **Vendor portal + subcontracts**: vendor sees own work orders, uploads delivery and bill; team does 3-way check; Finance releases payment with TDS 194C/194J.
- **Responsive**: checked at 320–1920 px; touch-screen rules (`@media (pointer: coarse)` at the end of `index.css`) give 36–40 px tap targets and 16 px inputs.

---

## 6. Vendor module (all three phases built)

Agreed with the user (modelled on eProc Rajasthan's bidder enrollment and tender pages):

- **Phase 1 — DONE (uncommitted):** public registration `/vendor/register` (firm, work categories, address, contact, PAN/GSTIN, bank with confirm, documents, declaration; validation in `utils/vendorChecks.js`); status check + "correct and resubmit"; Admin page `/vendor-applications` with automatic checks (formats, GSTIN↔PAN↔state, required docs, duplicates) and **Approve** (new vendor ID `VN-xx`, suggested TDS, email + WhatsApp) / **Send back for changes** (note, email) / **Reject** (reason, email). Seed data: `data/vendorApplications.js` (4 applications). Vendor login stays **vendor ID + registered mobile**.
- **Phase 2 + 3 — DONE (25 Sep 2026, in `bpspl`):** Tenders.
  - Admin page `/tenders` (Vendor Workspace, badge = tenders to decide): **New tender** form after eProc's tender page (title, project, kind of work, location/pincode, scope, pre-qualification, tender category, form of contract, estimate + "vendors see the estimate", EMD optional, period, bid validity, close/open date-time, pre-bid meeting, documents). Publishing tells **every approved vendor** (email + WhatsApp).
  - Bids stay **sealed** until bidding closes (count only); the Admin can **close bidding now** (with a confirm). Then bids show lowest first (L1, L2 …, % vs estimate); a bid opens to its details, papers and history. **Shortlist** or **Reject** (reason + note, emailed); a shortlisted bid can be **Approved & allotted**: choose the project and due date → work order `SC-…` in Subcontracts, other open bids become **Not selected**; every bidder is told.
  - Vendor portal: tabs **Open works** (all open tenders, not filtered by category; "New" tag) / **My bids** / **Work orders**, and a **bell** (new works, shortlisted, allotted, rejected with reason, not selected). `/vendor/tenders/:id` = eProc-style page (basic details, fee & EMD, work item, critical dates, documents, inviting authority) with the **bid form** (amount + GST, days, start date, validity, method, EMD reference, documents, declaration); revisable until closing.
  - Code: `data/tenders.js` (3 seeded tenders + 5 bids, dates relative to today), `utils/tenders.js` (phase, validation, vendor notices), store actions `publishTender`, `closeBidding`, `submitBid`, `decideBid`, `allotBid` (changes kept in `tenders` / `bids`), automations `tenderPublished`, `bidReceived`, `bidShortlisted`, `bidRejected`, `bidAllotted`, `bidNotSelected`; pages `pages/vendors/TendersPage.jsx`, `pages/vendor/VendorTenderPage.jsx`, `pages/vendor/VendorShell.jsx` (portal top bar + bell). Admin decides (`may('vendors')`); Management sees read-only.
  - Selection basis is still the Admin's judgement (no automatic L1).
- **Vendor portal redone after eProc's bidder screens (25 Sep 2026):** `pages/vendor/VendorShell.jsx` (`VendorLayout` — the app's own `Sidebar` with a vendor menu, always expanded; top bar with last login, bell, firm, sign out), `VendorAccountPages.jsx` (Home, My Account, My Documents), `VendorBidPages.jsx` (Search Active Tenders with eProc's search fields + save to My Tenders, My Tenders, My Active Bids with **withdraw**, **Clarification**, Tender Status with eProc's "tender stage", My Bids History, My Withdrawn Bids), `VendorWorkPages.jsx` (Work Orders, Payments). Store: `withdrawBid` (can't bid again on that tender), `clarifications` / `askClarification` / `answerClarification` (answers shown to every bidder without the firm's name; Admin answers in the Tenders drawer; bell + badge), `savedTenders` / `toggleSavedTender`; `signInVendor` keeps the previous login. `Sidebar` takes `nav`, `counts`, `expanded`. While bids are sealed, the activity log / bell / audit name the bidder only as "A bidder (sealed)" (`SEALED_BIDDER` in the provider); the bid itself keeps the firm for the Admin once bidding closes.
- **Demo data for every vendor page (25 Sep 2026):** `data/tenders.js` also seeds 5 earlier allotted tenders (TN-2026-011/014/016/017/018, each with bids not selected, rejected with a reason or withdrawn), one more open tender (TN-2026-024, no bids yet), more clarifications, saved tenders per vendor (`SEEDED_SAVED_TENDERS`) and the allotted tenders' work orders at different stages (`SEEDED_TENDER_ORDERS`; the provider places them under a running project, by the `forProject` name hint, then service line, and merges them into `projectEdits`, so Subcontracts and the vendor's Work Orders / Payments show them). `data/vendors.js` has `VENDOR_REGISTRATION_DOCS` for the six original vendors (My Documents). Every demo vendor (VN-01…VN-06) now has content on all 11 vendor pages.

---

## 7. Other pending items (from the gap review)

- Switch role visible only to Admin (RBAC).
- Client portal invite link opens the team tab (`/login?tab=client` not supported yet); client OTP login (mock).
- Separate technical proposal document (ask the user if needed).
- Sent messages: delivery status/resend, CSV export, reminder automations (payment due, quotation expiring, task due tomorrow), team-facing messages.
- ERM project Documents tab doesn't show the client's own uploads ("From the client" section) — proposed.
- README is outdated. P&L demo project Satpura shows a 7% margin (user to decide).
- Modules not started: leases (separate module). HRMS, attendance, expenses, reimbursement, payroll and finance came from Nikhil's branch (§10).

---

## 8. Code map (where things live)

- `src/context/CrmProvider.jsx` — the store: all actions (leads, quotations, projects, tasks, letters, scans, payments, questions, documents, vendors, vendor applications) and `sendAuto()` for automations. Demo changes in `localStorage` key `bansal-crm-demo:v2`; roles/sessions in `bansal-crm:role`, `bansal-crm:session`, `bansal-crm:client-session`, `bansal-crm:vendor-session`, `bansal-crm:field-member`. "Reset demo data" clears the changes.
- `src/context/crm.js` — `ROLE_ACCESS`, `ROLE_USERS`, `PERMISSIONS`, `useAccess`, `useMoney`, `DEFAULT_SETTINGS`.
- `src/data/` — mock data generated **relative to today's date** (leads shift stage as the date moves): `mockData.js`, `projects.js`, `staff.js`, `vendors.js`, `queries.js`, `scans.js`, `vendorApplications.js`.
- `src/utils/` — `projects.js` (clientProjects, clientUpdates, canActOn), `workflow.js` (quotes, seeded dates), `clientHistory.js`, `automations.js`, `seededMessages.js`, `questions.js`, `vendorChecks.js`, `payments.js`, `workOrders.js`.
- Shared UI: `components/common/SideDrawer.jsx` (right drawer), `KpiCard`, `Checklist` (supports `locked`), `RoleLink` (plain text when the role can't open the page).

---

## 9. Lessons / gotchas

- **Rewind caution:** a conversation rewind only restores files changed with Write/Edit, not files patched by Bash/Python scripts — a mixed restore once left the tree half-old and broken (it was recovered by replaying the transcript in a sandbox).
- Some files have **CRLF** line endings (the ones patched by Python); big edits were done with small Python patch scripts that assert the old text exists.
- The browser pane in this setup is often hidden: screenshots can crop or time out, viewport emulation is unreliable, animations may freeze mid-way. For layout checks, load the app in an `iframe` of an exact width and measure with JS; switch off animations inside the frame.
- `npm run dev` servers started outside the preview tool block port 5173; restart with the `crm-dev` preview config.
- After every change: `npm run lint` and `npm run build`, then test the flow in the browser, then reset the demo data (remove test records named `ZZTEST…`).

---

## 10. HRMS & Finance (merged from Nikhil's `nikhil` branch, 25 Sep 2026)

Nikhil built a separate app (HRMS + Finance, Tailwind-style classes, own login, sidebar, dark mode). It was merged **into this app** in the `bpspl` folder on the Desktop, branch `merge-hrms` (the `crm` folder and `main` were not touched). His git history has nothing in common with `main`, so the files were brought in by hand under `src/hrms/`.

- **One app, one login, one design.** His pages render inside our `AppLayout` (our sidebar, top bar, profile menu). His login, sidebar, top bar, notifications dropdown, role switch, roles & permissions page and dark mode were dropped.
- **Routes:** his paths moved under `/hr/...` (`/hr`, `/hr/leave`, `/hr/payroll`, …) because `/team`, `/reports` and `/settings` clashed with ours; Finance stays at `/finance/...`. Route table: `src/hrms/HrmsRoutes.jsx` (lazy pages); wrapper: `src/hrms/HrmsShell.jsx`. Sidebar groups follow Nikhil's four modules — **HRMS & Attendance**, **Expense & Reimbursement**, **Finance & Accounting**, **MIS & Reports** — in `navigation.js` (his Roles & Permissions page is replaced by the CRM's eight roles in Settings). The open group is the one with the closest matching link. A long open menu fades the sidebar mountain out (`is-crowded` in `Sidebar.jsx`).
- **Roles (no new ones):** `src/hrms/bridge.js` — Admin and Management are HR ("hr"); everyone else gets HR self-service (own attendance, leave, payslips, expenses, documents). `ROLE_ACCESS` has `HR_SELF`, `HR_TEAM`, `FINANCE_BOOKS` and `FINANCE_REPORTS`; `pageOf` looks one level deeper for `/hr/*` and `/finance/*`. Finance books: Admin, Management, Finance, Accountant; financial reports and budget are not for the Accountant (E2). His `AuthContext` / `RoleContext` now read our `useCrm()` user and role.
- **Design:** his shared components (`Button`, `Card`, `PageHeader`, `StatCard`, `Badge`, `Avatar`) render our classes (`.btn`, `.card`, `.page-header`, `.stat-card`, `.pill.status-pill` + tone). Long filler page descriptions and breadcrumbs are not shown. Photos (Unsplash) replaced by initials.
- **CSS:** `src/hrms/hrms.css` is **generated** by `python scripts/build-hrms-css.py` from his CSS files: every rule scoped to `.hrms`, dark mode dropped, keyframes prefixed `hr-`, his copy of our theme left out, element resets wrapped in `:where()` so our classes win. Re-run the script after editing any CSS under `src/hrms`. Hand-written glue: `src/hrms/hrms-overrides.css`. Vite alias `@` → `src/hrms` (his imports).
- **Data:** his demo data stays in its own `localStorage` keys (`bgspl_*`); his "reset" no longer wipes the CRM's data. Staff renamed so our role users exist in the HR employee master (Pooja Singhania → Kritika Gupta, Neha Chundawat → Ravi Gurjar, Sunita Meena → Dr. Sunita Meena; our Management → Dr. Amit Kumar Bansal, Finance → Chhavi Bansal, Team Lead → Dr. Sunita Meena) and records added for P. Joshi, A. Singh, N. Jain. The attendance register is generated for the last 4 weeks up to today.
- **Fixed from his side:** dashboard "Present today" counted every register row (showed 110%); punches were all saved under one name; UTC dates (the wrong day before 5:30 am IST); duplicate row keys in Finance → Expense claims; unused imports.
- **Nikhil's tests:** `node scripts/comprehensive-audit.mjs` (19 checks, needs the dev server on port 5190) passes; `node scripts/test-suite.mjs` (expense & reimbursement) passes tests 1–14, then stops at test 15 because his reimbursement service now requires Finance approval before settlement and the test was never updated (same on his branch).
- **Still open:** his other seed data (leave, payroll, finance) has fixed September dates; HR/finance alerts are not in our bell yet; Finance "Vendor bills" / "Receivables" don't read our Subcontracts and client payments yet (two separate data sets); Management can edit in HR pages (his pages have no view-only mode); about 90 lint warnings remain in his pages (no errors).
