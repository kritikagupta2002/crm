# Bansal Geo HRMS & Attendance Portal

React (Vite) frontend and Express + PostgreSQL API for attendance, leave, employee records and payroll at
Bansal Geo Solutions Pvt. Ltd.

## Run locally

```bash
npm install
cp .env.example server/.env      # then fill in values; use PORT=5050 on macOS
npm run server                   # API on http://localhost:5050
npm run dev                      # web app on http://localhost:5173 (proxies /api to the API)
```

Set `VITE_API_PROXY` if your API runs on another address.

## Tests

```bash
npm test     # starts a throwaway API with temporary data; never touches the real database
```

## Attendance rules

- Punch in and out only inside the office boundary (GPS within ±100 m), or from the office's public IP
  (`OFFICE_IPS`) on PCs without GPS. Work done elsewhere is recorded by HR as a correction.
- Leave uses working days only (weekly off from the person's shift, holidays from Leave settings).
- Payroll deducts loss of pay for working days with no attendance and no approved leave, counted from the
  first day attendance was recorded in the portal.
- All dates are India time (`TZ`, default Asia/Kolkata).

## Operations

- The API keeps a cached copy of the data and refreshes it from PostgreSQL every minute; send `SIGHUP`
  (`kill -HUP <pid>`) to reload at once after running a script.
- A request answers only after its database writes succeed; on a failed write the change is undone and the
  client is asked to retry.

## Accounts and sign-in

People sign in with their work email and password. Roles (Managing Director, Director, Super Admin, Manager,
Employee) are stored on the account by the server; nobody can choose their own role.

- `npm run users:issue-passwords` gives every active account a new temporary password and writes them once to
  `server/credentials.local.csv` (git-ignored). Pass e-mails to reset only those accounts. Share privately, then
  delete the file. Everyone must set their own password at first sign-in.
- New employees created from **Add Employee** get a login automatically; HR sees the temporary password once.

## Data

PostgreSQL is the only store in production. `npm run db:purge-demo` (dry run) and
`npm run db:purge-demo -- --apply` remove the old demo records after writing a backup to `server/backups/`.

## Security notes

- Every API route except sign-in requires a valid token; tokens are revoked on sign-out and password change.
- Self-service users can only read and change their own attendance, leave, documents and profile.
- Never commit `.env` files, `server/data/`, `server/backups/` or credential CSVs (all git-ignored).
