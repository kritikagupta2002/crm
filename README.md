# Bansal Geo CRM (demo)

A front-end demo of the CRM for Bansal Geo Solutions Pvt. Ltd., built with React + JavaScript and Vite. All data is mock data; there is no backend yet.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint     # oxlint
```

## Structure

- `src/data/mockData.js` — seeded demo data (leads, follow-ups, option lists). Change `MONTHLY_PLAN` to reshape the numbers.
- `src/context/` — app state: `CrmProvider` (leads and follow-ups; enquiries added in the demo are kept in localStorage) and `PeriodProvider` (month / quarter / financial-year filter).
- `src/utils/dashboardStats.js` — every dashboard figure is calculated here from the data, so the totals always agree.
- `src/pages/dashboard/` — the dashboard page and its widgets.
- `src/components/` — layout (sidebar, top bar), the "Add New Enquiry" drawer, and shared pieces.
- Colours and fonts are CSS variables in `src/index.css`.
