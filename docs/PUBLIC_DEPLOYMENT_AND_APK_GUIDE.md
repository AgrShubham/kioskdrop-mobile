# 🌐 Public Multi-Location Deployment & Standalone APK (v1.0.1) Guide

> **Goal:** Deploy the KioskDrop Enterprise backend to a secure public HTTPS endpoint so distributed users can run the app anywhere over 5G/4G or external Wi-Fi, and bake that public URL into a zero-configuration Android APK (`v1.0.1`).

---

## Table of Contents
1. [Overview & Problem Context](#1-overview--problem-context)
2. [Step 1: Deploy the Backend to a Public HTTPS Host](#step-1-deploy-the-backend-to-a-public-https-host)
   - [Option A: Railway.app (Recommended — 3-Minute 1-Click Container)](#option-a-railwayapp-recommended--3-minute-1-click-container)
   - [Option B: Render.com (Managed Docker + Persistent Disk)](#option-b-rendercom-managed-docker--persistent-disk)
   - [Option C: Ubuntu VPS (DigitalOcean / AWS EC2 / Hetzner)](#option-c-ubuntu-vps-digitalocean--aws-ec2--hetzner)
   - [Option D: Free Cloudflare Tunnel (Instant Test from Local PC)](#option-d-free-cloudflare-tunnel-instant-test-from-local-pc)
3. [Step 2: Choose Your Mobile Access & Auth Model](#step-2-choose-your-mobile-access--auth-model)
   - [Model A: 1-Click Persona Switcher (Ideal for Demos & Testing)](#model-a-1-click-persona-switcher-ideal-for-demos--testing)
   - [Model B: Production Authentication (Email/Password & RBAC)](#model-b-production-authentication-emailpassword--rbac)
4. [Step 3: Baking the Live URL into Standalone APK (v1.0.1)](#step-3-baking-the-live-url-into-standalone-apk-v101)
5. [Summary Checklist: What to Provide Next](#summary-checklist-what-to-provide-next)

---

## 1. Overview & Problem Context

When running the standalone Android APK (`v1.0.0`) on a **physical device connected to cellular (5G/4G) or external Wi-Fi**:
- The default fallback URL (`http://10.0.2.2:3000`) is **only reachable inside an Android Studio Emulator on the host PC**.
- Local network addresses (like `http://192.168.1.x:3000`) **only work if both the PC and the phone are on the exact same Wi-Fi router**.
- For users in **different offices, cities, or mobile connections**, the app requires a **publicly reachable HTTPS backend** (e.g. `https://kioskdrop-production.up.railway.app`).

### Key Architectural Strengths of the Backend
- **Stateful Node.js Runtime:** Powers persistent Server-Sent Events (SSE) telemetry at `/api/telemetry/stream` with a 15-second heartbeat.
- **SQLite WAL on Persistent Volume:** Self-contained database with zero external DB dependencies, running atomic bay reservations and tamper-evident SHA-256 custody chains.
- **Dual Session Authentication:** Supports both web browser session cookies and mobile `Authorization: Bearer <HMAC-token>` headers with timing-safe validation.
- **Pre-Configured CORS:** Next.js Route Handlers allow native cross-origin mobile API and SSE calls.

---

## Step 1: Deploy the Backend to a Public HTTPS Host

Choose one of the four options below:

### Option A: Railway.app (Recommended — 3-Minute 1-Click Container)

Railway is the easiest cloud platform for Docker containers requiring persistent storage and live Server-Sent Events.

1. **Sign Up / Log In:**
   - Go to [railway.app](https://railway.app) and sign in with your GitHub account.

2. **Deploy Repository:**
   - Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
   - Select your repository: `AgrShubham/kioskdrop-mobile` (or `kioskdrop-enterprise`).
   - Select branch: **`main`**.
   - Railway will automatically detect the root `Dockerfile`.

3. **Attach Persistent Storage (Critical for SQLite):**
   - Click on the newly created deployment card.
   - Go to **Settings** $\rightarrow$ scroll down to **Volumes**.
   - Click **Add Volume**.
   - Set **Mount Path** to: `/app/prisma`
   - *This ensures your seeded rooms, hardware SKUs, and reservations persist across restarts.*

4. **Add Environment Variables:**
   - Go to the **Variables** tab and click **New Variable** (or **RAW Editor**):
     ```env
     NODE_ENV=production
     DATABASE_URL=file:/app/prisma/dev.db
     SESSION_SECRET=kioskdrop-prod-session-entropy-secret-key-32chars
     SERVER_PIN_PEPPER=kioskdrop-prod-pin-pepper-entropy-secret-key-32chars
     WEBHOOK_SIGNING_SECRET=kioskdrop-prod-webhook-hmac-sha256-signing-secret
     RESERVATION_TTL_MINUTES=10
     RETURN_DUE_HOURS=4
     PORT=3000
     ```

5. **Generate Public HTTPS Domain:**
   - Go to **Settings** $\rightarrow$ **Networking**.
   - Click **Generate Domain**.
   - Railway will provide a public URL like:
     `https://kioskdrop-mobile-production.up.railway.app`

6. **Verify the Deployment:**
   - Open in your browser: `https://YOUR_DOMAIN.up.railway.app/api/rooms`
   - You should see a JSON response with the 4 pre-seeded meeting rooms (`Executive Boardroom 4B`, `Innovation Lab 4A`, etc.).

---

### Option B: Render.com (Managed Docker + Persistent Disk)

1. **Sign Up / Log In:**
   - Go to [render.com](https://render.com) and log in with GitHub.

2. **Create New Web Service:**
   - Click **New +** $\rightarrow$ **Web Service**.
   - Connect repository `AgrShubham/kioskdrop-mobile`, branch **`main`**.
   - Environment: Select **Docker**.

3. **Add Persistent Disk:**
   - Scroll to **Disks** $\rightarrow$ Click **Add Disk**:
     - **Name:** `kioskdrop-db`
     - **Mount Path:** `/app/prisma`
     - **Size:** `1 GB`

4. **Set Environment Variables:**
   - Under **Environment Variables**, add:
     - `DATABASE_URL` = `file:/app/prisma/dev.db`
     - `NODE_ENV` = `production`
     - `SESSION_SECRET` = `kioskdrop-prod-session-entropy-secret-key-32chars`
     - `SERVER_PIN_PEPPER` = `kioskdrop-prod-pin-pepper-entropy-secret-key-32chars`
     - `WEBHOOK_SIGNING_SECRET` = `kioskdrop-prod-webhook-hmac-sha256-signing-secret`
     - `PORT` = `3000`

5. **Deploy:**
   - Click **Create Web Service**.
   - Render will build the Dockerfile and output your public URL:
     `https://kioskdrop-enterprise.onrender.com`

---

### Option C: Ubuntu VPS (DigitalOcean / AWS EC2 / Hetzner)

If you have a Linux cloud server ($4–$6/mo):

1. **SSH into the Server:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **Clone & Launch with Docker Compose:**
   ```bash
   git clone https://github.com/AgrShubham/kioskdrop-mobile.git
   cd kioskdrop-mobile
   git checkout main
   
   # Copy environment variables
   cp .env.example .env
   
   # Build and run detached
   docker compose up -d --build
   ```

3. **Configure Nginx Reverse Proxy with Free SSL (Let's Encrypt):**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```
   Add `/etc/nginx/sites-available/kioskdrop`:
   ```nginx
   server {
       listen 80;
       server_name kiosk.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # Essential for real-time SSE stream buffering
           proxy_buffering off;
           proxy_cache off;
           proxy_read_timeout 86400s;
       }
   }
   ```
   Enable and issue certificate:
   ```bash
   sudo ln -s /etc/nginx/sites-available/kioskdrop /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d kiosk.yourdomain.com
   ```

---

### Option D: Free Cloudflare Tunnel (Instant Test from Local PC)

If you want to immediately test multi-location access from real phones worldwide **without paying for cloud hosting or moving databases**:

1. **Keep Next.js running locally on your PC:**
   ```powershell
   npx next dev -H 0.0.0.0 -p 3000
   ```

2. **Install and run Cloudflare Tunnel:**
   - Install using winget (Windows):
     ```powershell
     winget install Cloudflare.cloudflared
     ```
   - Start an instant HTTPS tunnel:
     ```powershell
     cloudflared tunnel --url http://localhost:3000
     ```

3. **Get the Public URL:**
   - Cloudflare will print a live public HTTPS URL in your terminal:
     `https://random-words-1234.trycloudflare.com`
   - Any phone on 5G anywhere in the world can immediately access this URL!

---

## Step 2: Choose Your Mobile Access & Auth Model

Before generating the `v1.0.1` APK, decide which access model fits your current objective:

### Model A: 1-Click Persona Switcher (Ideal for Demos & Testing)
* **How it works:**
  - Users install the app, and they are immediately logged in as **Aarav Sharma (Employee)**.
  - Tapping **`EMP ▾`** in the top header lets them switch in 1 tap to **Priya Patel (IT Admin)** or **Vikram Malhotra (FinOps Auditor)**.
  - When switching, the backend issues an HMAC-signed Bearer session token stored securely in `expo-secure-store`.
* **Who it is for:**
  - Product demos, hackathons, thesis defense, investor presentations, and team testing.
* **Benefits:**
  - Zero login friction; evaluators can test all three workflows (Hardware Triage, IoT Keypad/Unlock, and Command Center) in seconds without typing passwords.

### Model B: Production Authentication (Email/Password & RBAC)
* **How it works:**
  - A dedicated Login screen appears on first launch.
  - Users enter corporate email and password (or scan physical employee RFID badges).
  - Regular employees only have access to triage and pickup.
  - Access to `/admin` (Zero-Trust USB Whitelist, Customs Duty calculator, Zaggle/Happay restock POs) strictly requires `IT_ADMIN` or `FINOPS_AUDITOR` role credentials.
* **Who it is for:**
  - Real corporate deployment in an enterprise office.

> **Recommendation:** If you are sharing the APK with testers, team members, or evaluators to demonstrate the app, **Model A (1-Click Switcher)** is significantly faster and smoother.

---

## Step 3: Baking the Live URL into Standalone APK (v1.0.1)

Once you provide the public HTTPS URL (e.g., `https://kioskdrop-mobile-production.up.railway.app`), the following steps will be executed to build and publish the new APK:

### 1. Update Client Presets & Env Configuration
In `mobile/src/constants/presets.ts`:
```typescript
export const API_URL_PRESETS: ApiPreset[] = [
  {
    id: "production-cloud",
    label: "Production Cloud",
    subtitle: "KioskDrop Live Server",
    url: "https://YOUR_PUBLIC_URL",
  },
  // ...
];
```
In `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://YOUR_PUBLIC_URL
```

### 2. Build the Standalone APK
- **Locally via Gradle:**
  ```powershell
  cd mobile
  $env:CI = "1"
  npx expo prebuild --platform android --clean
  cd android
  .\gradlew.bat assembleRelease "-PreactNativeArchitectures=arm64-v8a,x86_64" --max-workers=2 --no-daemon
  ```
  *(Output: `mobile/android/app/build/outputs/apk/release/app-release.apk`)*

- **Or via EAS Cloud:**
  ```powershell
  cd mobile
  npx eas-cli build --platform android --profile preview
  ```

### 3. Verification & GitHub Release
- Verify APK signatures and capabilities:
  ```powershell
  apksigner verify --verbose app-release.apk
  aapt2 dump badging app-release.apk
  ```
- Publish new GitHub Release `v1.0.1`:
  ```powershell
  gh release create v1.0.1 ./app-release.apk --title "v1.0.1 - Public Cloud Paired Standalone APK" --notes "Pre-configured for live HTTPS backend pairing."
  ```

---

## Summary Checklist: What to Provide Next

To proceed with building `v1.0.1`:

1. [ ] **Deploy the backend** using **Railway (Option A)**, **Render (Option B)**, **VPS (Option C)**, or **Cloudflare Tunnel (Option D)**.
2. [ ] **Verify the URL:** Open `https://YOUR_URL/api/rooms` in a browser and confirm it returns JSON.
3. [ ] **Share the URL:** Provide the `https://...` URL in chat.
4. [ ] **Confirm Auth Preference:** Confirm whether you want to:
   - **Keep 1-Click Role Switcher** (Ready immediately for multi-user demo evaluation), OR
   - **Add Real Login/Auth** (Requires adding login UI & auth tables first).

Once you share the URL and choice, the agent will update the mobile app configuration, build the `v1.0.1` APK, and publish it directly to GitHub Releases.

