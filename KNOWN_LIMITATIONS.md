# Architectural Known Limitations & Future Infrastructure Dependencies
## Bansal Geo CRM, HRMS & ERM Mobile Application (React Native / Expo)

> **Document Status**: Production Readiness Engineering  
> **Target Release**: v1.0.0  
> **Architecture Paradigm**: Frontend-Only Local Persistence Sandbox  
> **Last Updated**: October 2026

---

## 1. Architectural Scope & Explicit Non-Claims

This document transparently records architectural characteristics and structural dependencies inherent to the **frontend/local-persistence** design of the current mobile application.

In strict compliance with project governance guidelines:
- **No Cloud Backend**: The application does **not** connect to a live remote backend server, REST API, or GraphQL service.
- **No Firebase / Cloud Datastore**: The application does **not** sync data to Google Firebase, AWS DynamoDB, Supabase, or PostgreSQL.
- **No APNs / FCM Push Server**: The application does **not** register device tokens with Apple Push Notification Service (APNs) or Firebase Cloud Messaging (FCM).
- **No Multi-User Cloud Real-Time Collaboration**: Changes made on one device do not automatically synchronize to another device over the air.

---

## 2. Detailed Technical Limitations

### 2.1 Storage & Data Persistence Architecture
- **Engine**: Local persistence is powered by `@react-native-async-storage/async-storage` for structured JSON entities and `expo-file-system` / `expo-sharing` for binary document/KYC attachments.
- **Device Confinement**: All records (Leads, Deals, Geological Projects, Invoices, Vouchers, Staff Profiles, Attendance Punches, Leave Applications, and KYC credentials) are stored strictly within the sandboxed application directory of the local device.
- **App Uninstall Behavior**: Uninstalling the mobile application or clearing app data via Android OS Settings will erase the local database.
- **Backup & Restore**: Without a centralized cloud backend, automated off-device backup is subject to OS-level cloud backup (e.g., Google Drive backup for Android if enabled at the OS level).

### 2.2 In-App Notifications vs Native Remote Push
- **Current Capability**: In-app notifications are generated synchronously by the local event-dispatch engine (`notification.service.ts` and `NotificationContext.tsx`). Triggers include:
  - Quotation director approval / rejection
  - Leave application review & muster backfill
  - Expense and reimbursement queries / settlements
  - Tender allotment & purchase order issuances
- **Future Dependency**: Real-time push notifications when the application is terminated or backgrounded require a remote notification dispatch server, APNs certificates, and FCM project credentials.

### 2.3 Biometric Attendance & Geotagging
- **Current Capability**: Attendance punch-in utilizes mobile device geolocation metadata capture (`Field Mobile Geotag Check-in`), timestamp generation, shift validation, late grace calculation, and live muster aggregation.
- **Limitation**: Native hardware fingerprint scanner / face-unlock authentication is not coupled directly to biometric clock-in devices (e.g., eSSL or Mantra hardware terminals used at mining sites). Interfacing with physical biometric hardware requires an on-premise hardware IoT bridge or cloud attendance API.

### 2.4 Document Management & Attachment Storage
- **Current Capability**: Attachments (PDFs, JPEGs, PNGs) picked via document picker or camera are compressed, sanitized, and stored securely in the app's sandboxed `FileSystem.documentDirectory + 'bgs_attachments/'`.
- **Limitation**: Document files are stored on device storage. Generating signed public URLs or cross-device cloud downloads requires an S3-compatible cloud object store (e.g., AWS S3, Cloudflare R2, MinIO).

### 2.5 Multi-Device Concurrency & Conflict Resolution
- **Current Capability**: Single-device ACID-like serialization using in-memory state locks and asynchronous storage writes.
- **Limitation**: If two users log into different devices, changes do not synchronize between them. Migration to multi-user enterprise operations requires introducing an event-sourced REST/GraphQL backend with optimistic locking and sync conflict resolution algorithms.

### 2.6 Native Release APK / AAB Generation
- **Current Capability**: Full production bundle (`index.android.bundle`) compiles cleanly with Metro and Hermes. Android application ID (`com.bansalgeo.crm`), versionCode (`1`), permissions, and asset resources are configured in `app.json`.
- **Limitation**: Generating a signed production `.aab` (Android App Bundle) or `.apk` requires:
  1. An EAS (Expo Application Services) account with configured build credentials (`eas.json`), OR
  2. Local Android build tools (Android SDK, NDK, JDK 17, and a production release keystore file `bgs-release-key.keystore`).

---

## 3. Recommended Roadmap for Cloud Evolution (Post-v1.0.0)

When the enterprise authorizes Phase 2 Cloud Backend Infrastructure, the following step-by-step additions should be executed:
1. **Backend Integration**: Replace `mobileStorage` method implementations with authenticated HTTP/gRPC clients pointing to the centralized CRM/HRMS backend.
2. **Push Notifications**: Provision Firebase Cloud Messaging (FCM) credentials, install `expo-notifications`, and register device push tokens during session authentication.
3. **Cloud Document Vault**: Wire `attachmentStorage.service.ts` to upload binary files to private S3 buckets with pre-signed GET/PUT URLs.
4. **Offline Sync Queue**: Implement a persistent sync queue (e.g., WatermelonDB or Redux Offline) to buffer offline field records and sync when connectivity resumes.
