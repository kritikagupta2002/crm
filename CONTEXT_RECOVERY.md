# Context recovery — Bansal Geo CRM

Everything done on this project so far, in order, with the decisions behind it. Use it to restore context in a new chat.
Pair it with **`HANDOFF.md`** (current state, code map, rules). Last updated: 24 Sep 2026.

**How to resume in a new chat:** "Read `CONTEXT_RECOVERY.md` and `HANDOFF.md`, check `git status`, then wait for my instruction." Don't start building until the user says "start" (or "bana do / theek karo / haan kar do").

---

## 0. The project in one paragraph

A front-end-only demo (React 19 + Vite, **plain JavaScript**, mock data, changes kept in `localStorage`) of a CRM, an ERM (project management) and client/vendor portals for **Bansal Geo Solutions Pvt. Ltd.**, a mining/geology consultancy in Jaipur. Its purpose is to show the client before real development. Requirements: "Software Requirements - Amit Sir.xlsx" (27 work packages) and "Vendor_Quote_Evaluation_Sheet_v2.xlsx" (scope A1–E3 + 4 flowcharts). The user writes in Hinglish.

---

## 1. Timeline

### 19 Sep 2026 — start, CRM
- The user pasted a full spec; the first attempt to scaffold was stopped: **"first we only talk; when I say start, then build."** This became a standing rule.
- Converted to plain JS (no TypeScript). Design direction chosen by the user from their own reference: **light, deep teal #1F6F78 + gold #C8943A, navy text, serif headings**, Bansal Geo logo; dark/earthy and pastel concepts were rejected.
- Dashboard built; the user said it got "very very complicated" after extra explanation widgets were added → removed. Then "should not look AI-built" → a minimal version was rejected as "too simple". Accepted balance: keep the rich design, remove only AI tells (uppercase eyebrows, filler subtitles, fake badges). Each figure shown once; colour code blue/amber/red/green.
- All CRM pages built: Dashboard, Leads & Enquiries (list, board, drawer, details page), Follow-ups, Quotations (builder, revisions, letterhead PDF), Client Approval, Client Onboarding, Client Master, Reports (CSV), Settings. Top bar with global search, notifications, "View as" role switch; WhatsApp share links; duplicate-enquiry warning. Real facts (7 services) taken from bansalgeo.com — never its theme.

### 21 Sep — portal, roles, ERM plan
- Mock login (team role / client enquiry ID + mobile) and **client portal** (projects, work milestones, govt approvals and letters, quotation accept / request changes, documents, updates feed).
- Roles: Admin, Sales, Project Coordinator, Team Lead, Accountant (+ Field Member later); amounts masked for Coordinator/Team Lead.
- Shareable **Design System artifact** made from the CSS (claude.ai artifact) for people building other modules; `theme/` folder = copy-paste theme kit.
- **ERM plan** agreed: same app, second sidebar section "ERM Workspace", stages from sheet C1 (Allocation → Planning → Task assignment → Field & report work → Govt submission → Final approval), later a 7th stage "Project closure" after the user shared a 10-step flowchart ("build properly, don't change the design pattern").

### 22 Sep — ERM finished
- All ERM phases: project detail (Overview / Tasks / Field Work / Documents / History), New Project, field visits with files, govt submission form, project report PDF, Tasks, Team, ERM Reports, My Tasks (mobile, Field Member), Govt Letters, Work Orders/Subcontracts, stage permissions (`canActOn`), ERM notifications, 7 stages in the client portal. Sidebar trimmed on the user's OK. Committed to git.

### 23 Sep — this long chat, part 1
1. Read README, recalled status. Read both Excel files; mapped all 27 work packages (done / partly / not started) — saved to memory.
2. A previous session had built: gap fixes from the requirements review — portal fixes, scanned letters linked to approval steps, vendor register + subcontract 3-way check with TDS, **vendor portal**, **Management and Finance roles**, **audit log**, **P&L report** (hidden from junior Accountant), multi-service enquiries (ServicePicker), public enquiry page with attachments/thank-you screen, separate team/client/vendor sessions, cross-tab sync.
3. **Broken tree after a restore**: the user rewound the conversation; only files changed with Write/Edit were restored, Bash/Python-patched ones weren't → build failed. **Recovered** by replaying the old session's transcript in a sandbox copy, verifying the ~30 untouched files matched byte-for-byte, and copying back the 14 lost files.
4. Bugs fixed: portal "Latest updates" missing accepted/advance/confirmed; impossible date order for recently won deals (`seededWonOn`); web enquiry now gets a next-working-day call follow-up; Field Member could see others' tasks; vendor bill needs file (hint added); audit log count.
5. Design glitches fixed: pipeline chevron labels cut by the arrow, follow-up titles truncated at 1366 px, stage strip line over dots during animation, clipped file names / next steps / authority names.
6. **Profile menu redesigned** twice ("isse sahi se banao", "ajeeb lag raha hai"): now one-line rows "Role · person ✓", "Switch role" label, grouped actions.
7. **RBAC for actions** ("sabko role ke hisaab se hi dikhe, extra role mat add karna"): `PERMISSIONS` table, read-only for others, Management view-only, checklist steps locked per owner, Finance/Accountant dashboard shows "Advance Due" instead of sales follow-ups, Settings shows "Can change".
8. **Field Member per person** (user: "sirf ek hi field member kyu rakha?"): all 6 field staff can sign in; each sees only own tasks. Field tasks seeded for authority site inspections.
9. Pending list shared; user picked items **2, 4, 5, 6** → built: **scan inbox** (NAS scanner folder → file to project), **automations** (WhatsApp/email on events, Settings → Automations) with **Sent messages** outbox, **field team / Team Lead notifications** scoped to their own work.
10. Role menu shows a short "what this role can do" line. Sent messages page seeded with 40 past messages so it isn't empty.
11. Client questions: user couldn't find where they appear → section always visible on the enquiry page (first in Activity tab, empty-state line), amber tab badge, "💬 1 question" tag in Leads list/board, also in the lead drawer.
12. "Anything the client sends that a role can't see, or vice versa?" → fixed: **team uploads private until shared** (was a leak), **questions routed by topic** with a `/questions` inbox (Billing → Accounts, Project → Coordinator + project's Team Lead, etc.), "New from client" badge on documents.

### 24 Sep — this chat, part 2
13. Handoff/audit: found a **second leak** (client "Latest updates" showed names of private team uploads and deletions) and that client documents don't reach the ERM project team — **reported, not yet fixed** (user asked about Vercel next).
14. **Vercel**: others see a Vercel login page — not our code; *Deployment Protection → Vercel Authentication → Require Log In* is on. User must turn it off and Save (not yet saved). **Netlify**: `/login` gave 404 → added `public/_redirects` and `vercel.json` (user committed them).
15. **Responsive for all devices**: audited every page at 320–1920 px (iframe method); fixed Subcontracts stat card at 320 px, hidden radios widening the enquiry drawer, touch-size controls and 16 px inputs on touch screens, tables scroll instead of squashing, IDs don't wrap, tab scrollbars hidden, header buttons full width on phones, compact My Tasks figures.
16. **Vendor module** (modelled on eproc.rajasthan.gov.in bidder enrollment + tender detail pages; the tender search is behind a captcha, not bypassed). Decisions: vendor ID + mobile login; Admin alone approves; Send back for changes + Reject with emailed reason; per-tender "show estimated value" option; no tender fee, EMD optional/off; **bid selection basis deferred — Admin approves/rejects each bid**; new sidebar section **Vendor Workspace** (Vendor Applications, Tenders, Subcontracts moved from ERM); 3 phases.
    - **Phase 1 built and tested**: `/vendor/register` (8-part form, validation, documents, declaration, application number, status check, correct & resubmit), `/vendor-applications` (tabs, automatic checks incl. duplicates and GSTIN↔PAN↔state, Approve → `VN-xx` + suggested TDS + email/WhatsApp, Send back, Reject), bell + outbox + audit log. Verified end to end; demo data reset.
17. `HANDOFF.md` and this file written.

---

## 2. Where things stand now

- **Uncommitted** since commit `e6bf29f`: vendor Phase 1 + responsive CSS + these two docs. The user should run `git add src HANDOFF.md CONTEXT_RECOVERY.md`, commit, push.
- Build and lint pass. Demo data in the test browser is reset.
- **Next agreed step:** vendor **Phase 2 — Tenders** (publish works with eProc-style fields, notify approved vendors of that category, vendors bid from the portal, bids sealed until closing). Then **Phase 3** (Admin approves/rejects bids; allot → work order in Subcontracts; notify vendors). Ask before starting.
- **Open items not yet done:** second client-feed leak (private uploads/deletions in "Latest updates"); client uploads not shown in ERM project Documents; Switch role visible to all roles; client invite link / OTP; proposal document question; messages delivery status/export/reminders; README update; P&L 7% margin project; HRMS/payroll/finance/leases modules later.

---

## 3. Standing rules (short)

- Discuss first, build on "start". Hinglish replies. Plain JS, single quotes, no semicolons, comments explain why.
- Rich but uncluttered, no AI tells, colour code blue/amber/red/green, each figure once. Teal + gold light design.
- Keep the 8 roles; every new action goes through `PERMISSIONS` / `canActOn` / `BILL_ROLES`; every ₹ through `useMoney()`.
- After changes: lint, build, test in the browser (iframe for widths), reset demo data, then give the user the commit commands.
- Memory files for this project live in `C:\Users\user\.claude\projects\C--Users-user-Desktop-crm\memory\` (index `MEMORY.md`).
