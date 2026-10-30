# Bansal Geo mobile app

The phone app for Bansal Geo Solutions Pvt. Ltd., built with Expo (SDK 58), React Native and TypeScript. It follows the web CRM: the same roles, the same workspaces and the same data. Records are kept on the phone (AsyncStorage) for now; there is no backend yet.

## Run

```bash
npm install
npx expo start          # scan the QR code with Expo Go (SDK 58)
npx expo start --web    # browser preview; needs react-native-web, react-dom and @expo/metro-runtime
```

## Structure

- `App.tsx`: fonts (Fraunces), providers and navigation.
- `src/theme/`: colours, fonts and spacing, matched to the web CRM (teal, gold and ink).
- `src/context/`: app state: auth and roles, CRM, finance, HRMS, Field Database and Inventory.
- `src/navigation/`: the tab bar and every screen route, gated by role.
- `src/screens/`: one folder per workspace (crm, erm, finance, hrms, payroll, documents, vendor, field, portals, reports, profile).
- `src/fieldDatabase/`: the client's Field Database formats, codes, QAQC and Excel export, ported from the web CRM. The Excel files are the same as the website's.
- `src/inventory/`: inventory seed data, as on the web.
- `src/components/`: shared pieces (headers, home blocks, cards).

`src/App.jsx`, `src/main.jsx`, `src/pages/`, `index.html`, `vite.config.js` and `vercel.json` are left over from the earlier web demo and are not used by the app.

Given formats are property of M/s Bansal Geo Solutions Pvt Ltd only.
