# KIOSKDROP ENTERPRISE — TEAM COMMUNICATION & PROJECT CONTEXT GUIDE
> **Purpose:** Provide this context file to Google Gemini (or any AI assistant) to instantly generate executive-grade, technically accurate, and professional communications for your team members, engineering colleagues, design leads, project managers, and internship mentors at Ricoz.

---

## 🤖 SYSTEM PROMPT FOR GEMINI
*(Copy and paste this section directly into Gemini to initialize its persona and understanding)*

```text
You are an Executive Technical Communication Assistant and Lead Software Engineer advisor for the KioskDrop Enterprise project (developed during the Ricoz Internship).

Your job is to help me communicate professionally, clearly, and persuasively with:
1. My Engineering Team & Technical Peers (architecture, PRs, technical decisions, bug fixes, APIs).
2. Project Managers & Internship Mentors at Ricoz (milestone updates, progress reports, deliverables, timelines).
3. Product & UI/UX Designers (design system alignment, user journeys, interaction patterns).
4. QA & DevOps Engineers (testing suites, release verification, build artifacts, rollback strategies).

Tone & Communication Standards:
- Confident, articulate, professional, and respectful.
- Precise with technical details (mentioning exact version numbers, architecture patterns, cryptographic hashes, and business impact).
- Solution-oriented: Highlight progress, clearly explain the rationale behind design/architecture decisions, and present clear next steps.
- Adaptable format: Format outputs cleanly with GitHub-style markdown, bulleted summaries, or formal email formatting based on what I request.
```

---

## 📌 1. EXECUTIVE PROJECT OVERVIEW

### What is KioskDrop Enterprise?
**KioskDrop Enterprise** is an automated conference room Audio/Visual (AV) hardware smart-locker and micro-logistics platform. 

### Problem It Solves
In modern corporate offices and enterprise campuses, conference room equipment failures (broken USB-C converters, missing HDMI dongles, uncalibrated video wall splitters, drained presentation clickers) cause high-value meeting delays averaging 12–18 minutes. Traditional IT helpdesk ticketing is too slow.

### The Solution: "Zero-Trust Micro-Logistics"
1. **Instant QR Triage (<60 seconds):** An employee in a conference room scans a door QR code on their mobile phone, selects their AV symptom, and instantly receives a 6-digit dynamic PIN to unlock the nearest floor locker compartment.
2. **Automated 12-Bay IoT Locker Bank:** Self-contained floor locker banks equipped with 12V mechanical solenoid actuators, IR break-beam presence sensors, and 5V/3A smart charging continuity.
3. **Zero-Trust Hardware Isolation:** Pre-whitelisted USB Vendor IDs (VID) and Product IDs (PID) to eliminate "BadUSB" firmware attacks and unauthorized peripheral spoofing.
4. **Statutory FinOps & Indian Customs Governance:** Real-time Indian customs tariff calculations (HSN 85437099), CGST Rule 46 corporate purchase order ledgers (Happay, Zaggle), and automated SAP S/4HANA ERP replenishment sync.

---

## 🛠️ 2. SYSTEM ARCHITECTURE & TECH STACK

- **Mobile Application:** React Native / Expo (SDK 52), Expo Router (File-based navigation), NativeWind / Tailwind CSS, Expo LocalAuthentication (Biometrics), Lucide Icons, Haptics, AsyncStorage.
- **Web Application:** Next.js 14 (App Router), React 18, TypeScript 5.5, Tailwind CSS 3.4, Recharts (Data Visualizations), Web Audio API (tactile solenoid audio simulation).
- **Backend & APIs:** Next.js Route Handlers (`/api/auth/*`, `/api/session/*`, `/api/lockers`, `/api/admin/*`, `/api/telemetry`), Server-Sent Events (SSE) telemetry bus, HMAC-SHA256 signed session tokens with `httpOnly` secure cookies.
- **Data Persistence:** Prisma ORM with SQLite (Local Development) & PostgreSQL (Lakebase / Cloud Production).
- **Target OS & Distribution:** Android 9.0+ APK (`v1.0.3`, Build 4), Cross-platform Responsive Web (Desktop, Tablet, Mobile).

---

## 🏆 3. MAJOR MILESTONES & RECENT DELIVERABLES COMPLETED

When briefing the team or mentors, refer to these completed milestones:

### 1. KioskDrop Enterprise Mobile App Release (`v1.0.3`)
- **Version:** `v1.0.3` (`versionCode: 4`).
- **Release Artifact:** Production release APK compiled (`kioskdrop-enterprise-v1.0.3.apk`, size: `118.2 MB`).
- **Cryptographic Checksum:** SHA-256 `2C9E9944DE63E72D7A5206B3FCB7573631355BB7CB30771870C407D262C8D076`.
- **Public GitHub Release:** Tagged and published on GitHub Releases (`https://github.com/AgrShubham/kioskdrop-mobile/releases/tag/v1.0.3`).

### 2. Comprehensive Brand Identity Suite (`brand-assets/`)
- Geometric KD Monogram (`|>`) with signature 45° kinetic drop chevron representing instant locker compartment solenoid dispatch.
- Standardized color system in `brand-guide.json`:
  - **Obsidian Dark Canvas:** `#070A10`
  - **Slate Elevated Card:** `#0F172A`
  - **Pure White Contrast:** `#FFFFFF`
  - **Sapphire Blue (Primary Accent / Employee Tone):** `#2563EB`
  - **Cyber Sky (Kinetic Pulse / Telemetry Sync):** `#38BDF8`
  - **Emerald Zero-Trust (Unlocked / IT Admin Tone):** `#10B981`
  - **Amber Quarantine (Active Reservation / FinOps Tone):** `#F59E0B`
  - **Crimson Alarm (Tamper / 403 Forbidden Tone):** `#EF4444`
- Delivered complete vector SVGs, high-resolution PNGs (1024x1024, 512x512, 192x192), Android adaptive icon layers, and full brand documentation (`README.md`).

### 3. Kinetic Boot Sequence & Splash Screen
- 4-Stage animation sequence mirroring aerospace telemetry startup:
  - **Stage 1 (0–480ms):** Elastic entrance of the KD Monogram.
  - **Stage 2 (380–630ms):** Chevron Drop flash with Cyber Sky aura.
  - **Stage 3 (450–900ms):** Staggered reveal of "KioskDrop Enterprise" brand lockup.
  - **Stage 4 (1300–1750ms):** Aperture zoom dismiss into the application.
- Live hardware telemetry stream: `[SYS_INIT]`, `[IOT_SYNC]`, `[SEC_PASS]`, `[FLEET_OK]`.
- Single-run per session memory gate (`sessionStorage.getItem('kioskdrop_boot_shown')`) and instant `Escape` key skip support.

### 4. Hardware Loading Radar & Zero-CLS Skeletons
- Pulsing dual concentric radar rings with a 2200ms rotating dashed indicator and hardware subsystem code pill (`[IOT_SOLENOID_DISPATCH]`, `[RFID_AUTHENTICATING]`).
- Shimmer skeleton placeholders eliminating Cumulative Layout Shift (CLS) on slow connections.

### 5. Enterprise Authentication & Role-Based Access Control (RBAC)
- Multi-Tab Authentication window (`/login` page & universal modal):
  - **Tab 1: Corporate Credentials** (Email + password with show/hide toggle).
  - **Tab 2: 1-Tap Quick Demo Switcher** (Instant role switching for demos and testing).
  - **Tab 3: RFID Badge Reader Simulation** (Simulated physical employee badge tap).
  - **Biometrics & Server Latency:** WebAuthn / LocalAuthentication trigger and live millisecond ping benchmark.
- **Strict Role-Based Access Control (RBAC):**
  - `EMPLOYEE` (Aarav Sharma): Access to Rapid-Drop AV triage, meeting room QR scanner, and 6-digit locker pickup PIN. Navigation bar **completely hides** the Command Center. Direct navigation to `/admin` renders a cyber-industrial **403 Forbidden Access Violation** screen.
  - `IT_ADMIN` (Priya Patel): Superuser with Zero-Trust USB Whitelist management, B2B procurement replenishment PO authorization, and emergency solenoid override.
  - `FINOPS_AUDITOR` (Vikram Malhotra): Read-only statutory compliance, Indian customs HSN tariff calculations, and CGST Rule 46 corporate card audit ledgers.

### 6. Website Upgrade Master Plan (`KIOSKDROP_WEBSITE_UPGRADE_PLAN.md`)
- Detailed 47 KB architectural blueprint created for the web portal.
- Full parity roadmap ensuring the web portal matches all mobile `v1.0.3` capabilities.
- Adds dedicated Mobile App Showcase & Download Center (CSS phone frame mockup, direct APK download, SHA-256 verification hash, and scan-to-sideload dynamic QR code).
- Upgraded 12-bay locker bank simulator with Web Audio API dual-frequency (120Hz/800Hz) mechanical solenoid release sound.

---

## 👥 4. KEY DEMO PERSONAS & TEST CREDENTIALS

| Persona Name | Role | Email | Password | RFID Badge ID | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Aarav Sharma** | `EMPLOYEE` | `aarav.sharma@enterprise.corp` | `kiosk2026` | `RFID-EMP-8821` | Sales & BD. Room 4B QR scan, symptom reporting, 6-digit pickup PIN. |
| **Priya Patel** | `IT_ADMIN` | `priya.patel@enterprise.corp` | `kiosk2026` | `RFID-IT-0042` | AV Infrastructure Ops. USB Zero-Trust Whitelist, PO release, emergency override. |
| **Vikram Malhotra** | `FINOPS_AUDITOR` | `vikram.malhotra@enterprise.corp` | `kiosk2026` | `RFID-FIN-1109` | Corporate Procurement. Customs HSN 85437099 audits, Zaggle/Happay ledgers. |

---

## 💬 5. READY-TO-USE COMMUNICATION SCENARIOS & PROMPTS

When you need Gemini to write a specific message for your team, choose one of these prompts:

---

### Scenario A: Daily Standup / Slack / Teams Update
**Copy this prompt to Gemini:**
> *"Draft a concise, bulleted Daily Standup update for our engineering Slack channel. Mention that we have successfully tagged and released Mobile v1.0.3 (Build 4) on GitHub, finalized the complete brand asset suite in `brand-assets/`, and established the comprehensive website upgrade plan (`KIOSKDROP_WEBSITE_UPGRADE_PLAN.md`) to bring web parity with our mobile app's 4-stage splash, 3-mode login, and strict RBAC."*

---

### Scenario B: Weekly Internship Status Report (For Mentors / Supervisors at Ricoz)
**Copy this prompt to Gemini:**
> *"Draft a formal and comprehensive weekly internship status report for my project mentor and supervisor at Ricoz. Highlight the delivery of the KioskDrop Enterprise Mobile App v1.0.3 APK release, the production-grade zero-trust RBAC architecture (with separate Employee, IT Admin, and FinOps personas), the newly standardized brand identity suite, and our roadmap for upgrading the web portal. Keep it professional, structured, and metric-driven."*

---

### Scenario C: Release Announcement Email (v1.0.3 Mobile APK + Brand Suite)
**Copy this prompt to Gemini:**
> *"Draft a release announcement email to send to the internal team and QA. Announce the release of KioskDrop Enterprise Mobile v1.0.3 (Build 4). Include the APK download details (118.2 MB), the verified SHA-256 cryptographic checksum (`2C9E9944DE63E72D7A5206B3FCB7573631355BB7CB30771870C407D262C8D076`), key features included (kinetic splash boot, multi-tab login, RFID simulation, strict RBAC navigation), and a note about the newly consolidated brand assets."*

---

### Scenario D: Architectural Justification / Design Decision Explanation
**Copy this prompt to Gemini:**
> *"Help me reply to a team member who asked why we introduced three different login modes (Credentials, 1-Tap Quick Demo, and RFID Tap) instead of just standard username and password, and why we hide the Command Center tab completely for Employees rather than just disabling buttons. Frame the response using zero-trust security principles, enterprise user experience, and practical demo capabilities."*

---

### Scenario E: Web Upgrade Handover Brief for Developers / Autonomous Agent
**Copy this prompt to Gemini:**
> *"Write a clear architectural briefing for the developers or agent who will execute `KIOSKDROP_WEBSITE_UPGRADE_PLAN.md`. Summarize the 6 execution phases, emphasize our zero-error tolerance, detail the Web Audio API solenoid release implementation, and explain how the mobile app showcase with APK download and QR code sideload should be integrated on the landing page."*

---

## 📖 6. GLOSSARY & KEY DOMAIN CONCEPTS

- **MTTR (Mean Time to Resolution):** Target <15 seconds from QR scan to locker compartment unlock.
- **Solenoid Actuator:** 12V mechanical pulse lock that pops the compartment door open upon entering a valid 6-digit PIN or tapping an authorized RFID badge.
- **IR Break-Beam Sensor:** Optical infrared sensor inside each bay detecting physical presence of equipment to prevent premature closure.
- **BadUSB Mitigation:** Zero-Trust hardware isolation preventing rogue microcontroller payloads from executing unauthorized HID commands.
- **HSN Code 85437099:** Indian statutory Harmonized System of Nomenclature code for electrical machines and apparatus with individual functions (AV signal converters), subject to Basic Customs Duty (BCD) + Social Welfare Surcharge (SWS) + Integrated GST (IGST).
- **Rule 46 CGST Tax Invoicing:** Compliance requirement ensuring corporate tax invoices reflect valid GSTIN, HSN, and itemized landed costs.

