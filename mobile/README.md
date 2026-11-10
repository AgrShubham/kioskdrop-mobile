# KioskDrop Enterprise Mobile (React Native / Expo)

Cross-platform iOS, Android, and Expo Web companion app for **KioskDrop Enterprise Zero-Trust AV Operations & FinOps**, backed directly by the Next.js 14 API (`/api/*`) and Prisma ORM at the repository root.

---

## Prerequisites

- **Node.js & npm** (same toolchain used by the root Next.js workspace)
- **Expo Go** on a physical iOS or Android device (for instant LAN preview without native compilation)
- **Android Studio + Android SDK / Emulator** (`adb` on `PATH`) for Android virtual device testing
- **macOS + Xcode** *(optional, required only for local iOS Simulator builds; on Windows use Expo Go on a physical iPhone or EAS Cloud Build)*

---

## Architecture Highlights

- **Navigation (`expo-router`):** Typed file-based routing under `app/(tabs)/` (`index`, `request`, `kiosk`, `admin`) plus the native camera modal `app/scanner.tsx` and unmatched route fallback `app/+not-found.tsx`. Custom deep-link scheme: `kioskdrop://`.
- **Stateless Bearer Auth (`src/lib/storage.ts`, `src/lib/api.ts`):** `POST /api/session/role` returns a signed HMAC session `token`, encrypted inside `expo-secure-store` (with AsyncStorage fallback on Expo Web) and attached as `Authorization: Bearer <token>` on every API and SSE call.
- **4-Tier API URL Resolver (`src/lib/env.ts`):**
  1. Saved override in Zustand (`apiBaseUrlOverride`, configurable live in **Persona & Server Config -> Server Connection**)
  2. `EXPO_PUBLIC_API_URL` environment variable
  3. Automatic Expo Go LAN host extraction (`Constants.expoConfig.hostUri` -> `http://<LAN-IP>:3000`)
  4. Platform default (`http://10.0.2.2:3000` on Android, `http://localhost:3000` on iOS/Web)
- **Hermes-Safe Real-Time Telemetry (`src/hooks/useTelemetrySSE.ts`):** Uses `react-native-sse` (since Hermes lacks DOM `EventSource` and `BroadcastChannel`), supports `Last-Event-ID` replay, pauses when `AppState` backgrounds, reconnects with exponential backoff (`2s -> 15s`), invalidates affected React Query keys, and triggers error haptics on `SECURITY_MISMATCH_ALARM`.
- **Dual Theme Parity (`src/lib/theme.ts`, `tailwind.config.js`):** **Obsidian & Electric Sapphire** Dark Mode and **Executive Crisp** Light Mode with `minHeight >= 44pt` (`>= 48pt` keypad) touch targets and phone/tablet responsive grids.

---

## Running Backend + Mobile Together (Two Terminals)

### Terminal 1 — Start the Next.js API Server (Repository Root)

> **Branch note (`experimental` vs `main`):** On the `experimental` branch (`prisma/schema.prisma` uses SQLite), prefix Prisma/Next commands with `DATABASE_URL="file:./dev.db"`. On `main` (PostgreSQL), use your `.env` Neon connection string without the SQLite override.

```powershell
# From repository root:
$env:DATABASE_URL="file:./dev.db"

npx prisma generate
npx prisma db push
npm run db:seed

# Bind on 0.0.0.0 so physical phones and Android emulators on your LAN can connect:
npx next dev -H 0.0.0.0 -p 3000
```

Wait until Next.js reports listening on port `3000`.

### Terminal 2 — Start Expo (`/mobile`)

```powershell
Set-Location mobile
npm install
npm start
```

Interactive Metro shortcuts:
- Press **`a`** — Launch in a running Android Emulator (`http://10.0.2.2:3000`)
- Press **`i`** — Launch in iOS Simulator *(macOS only, `http://localhost:3000`)*
- Press **`w`** — Launch Expo Web in desktop browser (`http://localhost:8081` -> CORS-enabled `http://localhost:3000`)
- **Scan QR Code** — Launch on physical Android / iOS device via **Expo Go** (`http://<PC-LAN-IP>:3000`)

Direct scripts:
- `npm run android`
- `npm run ios`
- `npm run web`

---

## Networking & Firewall Guide

| Target | Resolved API URL | Notes |
| :--- | :--- | :--- |
| **Android Emulator** | `http://10.0.2.2:3000` | Special emulator loopback to host `127.0.0.1`. Optionally run `adb reverse tcp:3000 tcp:3000` to use `http://localhost:3000`. |
| **Physical Phone (Expo Go)** | `http://<YOUR-PC-LAN-IP>:3000` | Auto-detected from Metro `hostUri`. Ensure host PC & phone share the same Wi-Fi and port `3000` is permitted through Windows Firewall. |
| **iOS Simulator (macOS)** | `http://localhost:3000` | Direct loopback to Next.js dev server. |
| **Expo Web Browser** | `http://localhost:3000` | Supported via `/api/:path*` CORS headers in root `next.config.js`. |
| **Production / Preview Demo** | `https://kioskdrop-enterprise.vercel.app` | Switchable anytime inside the app without restarting Expo (`Persona Chip -> Server Connection`). Live SSE updates require a stateful Node server (`localhost` / `LAN IP`). |

Allow inbound TCP `3000` in an elevated PowerShell prompt on Windows if physical devices time out:

```powershell
New-NetFirewallRule -DisplayName "KioskDrop Nextjs Dev 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

Verify connectivity inside the app via **Header Persona Chip (`EMP` / `ADM` / `FIN`) -> Server Connection -> Test Ping**.

---

## Deep-Link CLI Testing

With an Android Emulator or USB device connected via `adb`:

```powershell
Set-Location mobile

# Open Rapid-Drop Triage pre-selected to Boardroom 4B:
npx uri-scheme open "kioskdrop://request?room=Boardroom-4B&floor=4" --android

# Open Smart Locker Kiosk pre-filled for Floor 4 Hub:
npx uri-scheme open "kioskdrop://kiosk?locker=lkr_floor4&bay=1&pin=123456" --android
```

*(On macOS for iOS Simulator, replace `--android` with `--ios`.)*

---

## Running Automated Tests & Health Checks

### Mobile Quality Checks (`/mobile`)

```powershell
Set-Location mobile
npx tsc --noEmit                  # Strict TypeScript check (app, src, __tests__)
npm test                          # All 5 Jest + RNTL test suites (--watchAll=false --watchman=false)
npx expo-doctor                   # Expo SDK 58 dependency & config health checks
npx expo export --platform web    # Metro bundler & CSS compilation smoke check
```

### Root Backend Regression Suite (Repository Root)

```powershell
$env:DATABASE_URL="file:./dev.db"
npm run typecheck
npm run lint
npm run test                      # Root 39/39 Vitest suite
```

---

## Building Standalone APKs / App Store Archives (EAS Build)

Build profiles are preconfigured in [`eas.json`](eas.json):

```powershell
Set-Location mobile

# 1. Authenticate with Expo Application Services
npx eas-cli login

# 2. Build an installable internal-distribution Android .apk:
npx eas-cli build --platform android --profile preview

# 3. Development client build (for custom native debugging):
npx eas-cli build --platform all --profile development

# 4. Production App Store / Play Store build:
npx eas-cli build --platform all --profile production
```

For standalone preview builds distributed off-LAN, configure a reachable HTTPS backend URL in `.env` (`EXPO_PUBLIC_API_URL`) or inside the in-app **Server Connection** sheet.

