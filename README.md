# 🏢 Property Rent - Automated AI Calling & Multi-Channel Rent Collection Engine

An automated property management and rent collection platform equipped with **AI Voice Calling**, **WhatsApp Alerts**, **SMS Notifications**, a **Smart Anti-Blocking Caller ID Rotation Pool**, and an **Instant Mark-As-Paid Kill Switch**.

---

## 🌟 Key Features

1. **Owner Dashboard & Property Manager**:
   - Manage properties, units, tenant names, mobile numbers, rent amounts, due dates, and grace periods.
   - Real-time collection metrics, overdue alerts, and revenue progress.

2. **Smart Anti-Blocking Caller ID Rotation Pool (DID Pool)**:
   - Prevents tenants and spam filtering apps (Truecaller, Google Dialer, iOS) from blocking your collection calls.
   - Automatically switches numbers between sequential call attempts to the same tenant.

3. **Multi-Channel Automated Escalation Pipeline**:
   - **T-3 Days**: Friendly WhatsApp reminder heads-up.
   - **T-0 (Due Day)**: Official WhatsApp & SMS invoice notice with UPI / payment links.
   - **T+1 Day (Overdue)**: First courtesy AI Voice Call + WhatsApp notice.
   - **T+3 Days (Overdue)**: Escalated AI Voice Call from a fresh rotated line + SMS.
   - **T+5 Days (Critical)**: Urgent voice notice + final WhatsApp demand.

4. **Instant Mark-As-Paid Kill Switch**:
   - The instant an owner clicks **"Mark as Paid"**, all automated calls, WhatsApp notices, and SMS queues are **immediately stopped**.
   - An automated WhatsApp Payment Receipt & Confirmation is dispatched to the tenant.

5. **Interactive In-App AI Voice & WhatsApp Simulator**:
   - Test calls inside your browser with realistic Web Audio telephone ringtones and AI speech synthesis.
   - Preview formatted WhatsApp chat receipts.

---

## 🚀 How to Run Locally

### 1. Start the Backend API & Automation Cron
Open a terminal in the project directory:
```bash
cd backend
npm install
npm run dev
```
The Backend API and Cron Scheduler will start on `http://localhost:5000`.

### 2. Start the Frontend UI
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000` (or the URL Vite provides).

---

## 🚢 Production Deployment & Telecom Setup Guide

### 1. Deploying the Code
- **Render.com / Railway / Fly.io (Recommended)**:
  - Create a **Web Service** pointing to the `backend/` directory (`npm start`).
  - Create a **Static Site** pointing to the `frontend/` directory (`npm run build` with publish directory `dist`).
- **VPS (Ubuntu / DigitalOcean / Hostinger)**:
  - Run the backend using `pm2 start src/server.js`.
  - Serve the frontend `dist` directory using Nginx.

### 2. Setting Up 3-5 Anti-Blocking Phone Numbers
- Sign up on **Twilio**, **Exotel**, or **Tata Tele Cloud**.
- Purchase 3 to 5 virtual phone numbers in your region (~$1/month each).
- Add these numbers into the **"Caller ID Pool"** tab in the app.
- The built-in rotation algorithm handles the rest!

### 3. Connecting Meta WhatsApp Cloud API (Free 1,000 Messages/Month)
- Go to [developers.facebook.com](https://developers.facebook.com) and create a WhatsApp Business app.
- Get your **Phone Number ID** and **Access Token**.
- Enter them into the **Settings** modal in this app.

### 4. Connecting AI Voice Calling (Twilio Voice / Vapi.ai / Bland.ai)
- For human-like conversational voice agents, sign up at [Vapi.ai](https://vapi.ai) or [Twilio Voice](https://www.twilio.com/voice).
- Enter your API key in the **Settings** modal and toggle off "Simulation Mode".

---

## 📁 Project Architecture

```
c:\project rent\
├── backend\
│   ├── src\
│   │   ├── config\db.js             # Relational JSON database engine & seed data
│   │   ├── services\
│   │   │   ├── numberPoolService.js # Anti-blocking caller ID rotation algorithm
│   │   │   ├── telecomService.js    # AI Voice, WhatsApp & SMS dispatcher
│   │   │   └── automationService.js # Schedule rules evaluator & Mark-as-Paid Kill Switch
│   │   ├── routes\apiRoutes.js      # REST API endpoints
│   │   └── server.js                # Express app & daily 09:00 AM Cron scheduler
│   └── package.json
├── frontend\
│   ├── src\
│   │   ├── components\
│   │   │   ├── DashboardMetrics.jsx       # Financial KPIs & collection rate
│   │   │   ├── TenantsSection.jsx         # Tenant roster, dues & Mark-as-Paid
│   │   │   ├── PropertiesSection.jsx      # Property & unit management
│   │   │   ├── AntiBlockingPool.jsx       # Rotated DID line manager & spam health
│   │   │   ├── AutomationEngine.jsx       # Dunning schedule rules & script editor
│   │   │   ├── LogsSection.jsx            # Activity & call audit trail
│   │   │   ├── LivePhoneSimulatorModal.jsx# Interactive smartphone UI & browser speech AI
│   │   │   ├── WhatsAppPreviewModal.jsx   # WhatsApp chat bubble preview
│   │   │   ├── SettingsModal.jsx          # Owner profile & telecom API keys
│   │   │   └── DeployGuideModal.jsx       # Complete production deployment walkthrough
│   │   ├── services\api.js                # Frontend API client
│   │   ├── App.jsx                        # Main application controller
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
└── README.md
```
