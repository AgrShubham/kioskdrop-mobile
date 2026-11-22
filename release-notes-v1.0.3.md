## 🚀 KioskDrop Enterprise v1.0.3 — Post-Launch Login Window & Dynamic RBAC

> **Standalone Android Production Release (`versionName: 1.0.3`, `versionCode: 4`)**  
> *Pre-configured with Zero-Setup Cloud Backend: `https://kioskdrop-mobile-production.up.railway.app`*

---

### 🌟 What's New in v1.0.3

#### 1. 🔐 Post-Launch Enterprise Login Authentication Window
- **Seamless Boot Transition:** Immediately follows the choreographed 4-stage kinetic logo boot sequence. If no active session token exists (or user logged out), the sleek **Login Authentication Window** is presented before exposing the application tabs.
- **Mode 1 — Corporate Credentials:**
  - Corporate Email input (e.g. `aarav.sharma@enterprise.corp`, `priya.patel@enterprise.corp`).
  - Corporate Password / Master PIN with toggleable visibility eye icon.
  - Form validation with descriptive error alerts.
- **Mode 2 — 1-Tap Quick Demo Personas (Evaluator Ready):**
  - Instant authentication cards for testing and evaluation:
    - **Aarav Sharma:** `Sales & Strategic Accounts` (Role: `EMPLOYEE`, Badge: `RFID-EMP-8821`).
    - **Priya Patel:** `Enterprise Infrastructure & AV Operations` (Role: `IT_ADMIN`, Badge: `RFID-IT-0042`).
    - **Vikram Malhotra:** `Corporate Procurement & FinOps` (Role: `FINOPS_AUDITOR`, Badge: `RFID-FIN-1109`).
- **Mode 3 — RFID Badge Reader Simulation:**
  - Interactive NFC/RFID badge reader pad with manual input and 1-tap quick presets (`EMP-8821`, `IT-0042`, `FIN-1109`).
- **Biometric Quick Unlock:**
  - Hardware-accelerated Face ID / Fingerprint sensor unlock via `expo-local-authentication`.
- **Integrated Server Ping & Host Bar:**
  - Real-time latency ping test button (e.g., `24ms latency • 6 rooms synced`).
  - Server URL target switcher to test against local LAN or cloud backend.

---

#### 2. 🛡️ Role-Based Access Control (RBAC) & Power Gating

| Capability / Module | `EMPLOYEE` (Aarav) | `IT_ADMIN` (Priya) | `FINOPS_AUDITOR` (Vikram) |
| :--- | :---: | :---: | :---: |
| **Home Gateway (`/`)** | Personalized AV Requests | Fleet Health & Telemetry | Financial Audit Overview |
| **Rapid-Drop Request (`/request`)** | Full Access (Scan & Triage)| Full Access | Read-Only / Demo |
| **Smart Locker Kiosk (`/kiosk`)** | 6-Digit PIN Pickup & Return | PIN + RFID + Master Override | Audit View / PIN Pickup |
| **Command Center Tab (`/admin`)** | **HIDDEN FROM TAB BAR** | **VISIBLE (Full Superuser)** | **VISIBLE (Audit Scoped)** |
| **USB Zero-Trust Whitelist Toggle** | Denied | **Allowed (Instant Quarantine)** | Read-Only |
| **B2B Purchase Order Authorization** | Denied | **Allowed (Full PO Issuance)** | Denied (Read-Only) |
| **Hardware Reception Barcode Intake**| Denied | **Allowed (Stock Empty Bays)** | Denied |
| **Customs Duty (HSN) Calculator** | Denied | Full Access | **Full Access** |
| **CGST Rule 46 Card Ledger** | Denied | Full Access | **Audit & ERP Sync View** |
| **ITSM Webhook Simulation / Replay** | Denied | **Allowed (ServiceNow/Zendesk)**| Denied |

- **Navigation Guarding:** For `EMPLOYEE`, the Command Center tab is completely removed from the bottom tab bar (`href: null`).
- **Direct Route Protection:** If an unprivileged user navigates to `/admin`, the screen enforces role restriction and prevents unauthorized data retrieval.
- **Sign Out Action:** Added to `PersonaServerSheet.tsx`, cleanly invalidating SecureStore credentials and returning the user to the Login screen.

---

#### 3. 🧪 Quality Assurance & Test Verification

- **Backend Test Suite (Vitest):** `45 passed (45)` including new tests in `test/auth.test.ts` verifying `/api/auth/login`, `/api/auth/logout`, RFID badges, and unauthenticated states.
- **Mobile Test Suite (Jest):** `28 passed (28)` including new tests in `mobile/__tests__/auth-login.test.tsx` verifying `LoginScreen`, credentials, demo persona switcher, and RFID tap.
- **TypeScript Typecheck:** `0 errors` across both Next.js App Router and React Native mobile app (`tsc --noEmit`).

---

### 📦 APK Technical Specifications

- **File Name:** `kioskdrop-enterprise-v1.0.3.apk`
- **Version:** `1.0.3` (`versionCode: 4`)
- **Package ID:** `com.kioskdrop.enterprise`
- **File Size:** `123,942,109` bytes (~118 MB)
- **SHA-256 Checksum:** `2C9E9944DE63E72D7A5206B3FCB7573631355BB7CB30771870C407D262C8D076`
- **Signature:** Android APK Signature Scheme v2 Verified
- **Engine:** React Native 0.88 + Hermes V11 bytecode runtime + React 19 + Expo 58

---

### 📲 Installation & Quick Start

1. Download **`kioskdrop-enterprise-v1.0.3.apk`** below.
2. Install on any Android device or emulator (`adb install -r kioskdrop-enterprise-v1.0.3.apk`).
3. Launch the app: experience the kinetic opening sequence, followed by the **Login Authentication Window**!
4. Use the **Quick Demo** tab to switch between **Aarav (Employee)**, **Priya (IT Admin)**, and **Vikram (FinOps)** to see the role-tailored feature sets in real time!

