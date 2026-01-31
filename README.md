# 🛡️ SafeHer: Advanced Women Safety Ecosystem

SafeHer is a state-of-the-art, full-stack safety application designed to provide women with a comprehensive security toolkit. Beyond a simple SOS button, SafeHer integrates real-time tracking, AI-powered threat prediction, discreet evidence collection, and a robust stealth mode to ensure user safety even in the most critical situations.

---

## 🚀 Project Overview


### The Purpose
In an increasingly unpredictable world, personal safety is a paramount concern. **SafeHer** was built to empower women with technology that works seamlessly during emergencies, provides proactive safety measures, and ensures that evidence is secured even if the device is offline or compromised.

### The Problem It Solves
- **Delayed Assistance:** Traditional methods can be slow. SafeHer uses real-time WebSockets to broadcast SOS alerts instantly.
- **Detection Risk:** If an attacker sees a safety app, they may compromise the device. SafeHer includes a **Stealth Mode** that disguises the app as a common utility.
- **Evidence Loss:** Critical evidence (photos/audio) is often lost if a device is taken or internet is cut. SafeHer's **Silent Evidence Collection** works offline and captures data discreetly.
- **Proactive Safety:** Instead of just reacting, SafeHer uses **Threat Prediction** to alert users about potentially unsafe zones.

---

## 🧠 Complete Feature List

### 👩‍💻 User-Side Features
- **🚨 One-Tap SOS:** Instant emergency broadcast with real-time location.
- **🕵️ Stealth Mode:** Disguise the app as a Calculator, Music Player, or Settings menu.
- **📸 Silent Evidence Collection:** Discreetly capture photos, audio, video, and location coordinates.
- **🗺️ Journey Tracking:** Real-time monitoring of your route with live updates to trusted contacts.
- **🔐 End-to-End Encryption:** Your SOS data and evidence are encrypted locally with a password only you know.
- **👥 Help Network:** Access a community of nearby helpers and emergency services.
- **🧠 Threat Prediction:** Interactive map visualizing unsafe zones based on historical and real-time data.
- **📶 Offline Mode:** Collect evidence and log movements without an active internet connection; data syncs automatically when back online.

### 🛠️ Admin/Security Side Features
- **📊 Alert Dashboard:** Real-time monitoring of active SOS broadcasts.
- **📍 Live Tracking Console:** View the exact path and current location of users in distress.
- **📁 Evidence Vault:** Secure access to synced evidence for legal follow-up (encrypted).
- **🛡️ Security Management:** Control safety parameters and verify emergency contacts.

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** [React 18](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Iconography:** [Lucide React](https://lucide.dev/)
- **Maps:** [Google Maps JavaScript API](https://developers.google.com/maps) & [Mapbox GL](https://www.mapbox.com/)
- **State Management:** [TanStack Query (React Query)](https://tanstack.com/query/latest) & React Context API
<<<<<<< HEAD

### Backend & Database
- **Primary Backend:** [NestJS](https://nestjs.com/) (SOS WebSocket Gateway)
- **Real-time Engine:** [Socket.io](https://socket.io/)
- **Database/Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Serverless:** Supabase Edge Functions (Deno)

### Security & Safety
- **Encryption:** Web Crypto API for local E2EE.
- **Auth:** Supabase Auth (Email/Password, Google OAuth).
- **Persistence:** LocalStorage for offline-first capabilities.
=======

### Backend & Database
- **Primary Backend:** [NestJS](https://nestjs.com/) (SOS WebSocket Gateway)
- **Real-time Engine:** [Socket.io](https://socket.io/)
- **Database/Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Serverless:** Supabase Edge Functions (Deno)

### Security & Safety
- **Encryption:** Web Crypto API for local E2EE.
- **Auth:** Supabase Auth (Email/Password, Google OAuth).
- **Persistence:** LocalStorage for offline-first capabilities.

---

## 🧩 System Architecture

SafeHer follows a decentralized yet highly synchronized architecture:

1.  **Client (Frontend):** Runs the main UI, handles local encryption, manages offline evidence storage, and initiates Geolocation tracking.
2.  **Real-time Gateway (NestJS):** A dedicated server handling high-frequency WebSocket connections for SOS broadcasts, ensuring sub-second delivery to the help network.
3.  **Data Layer (Supabase):** Stores user profiles, encrypted evidence, trusted contacts, and historical safety data.
4.  **Integration Services:** Google Maps for visualization and Supabase Edge Functions for background tasks like threat analysis.

**Data Flow:**
`Action Trigger (SOS)` → `Local Encryption` → `WebSocket Broadcast (NestJS)` → `Database Persistence (Supabase)` → `Notification Delivery`

---


## 📁 Project Structure

```text
├── .agent/              # Agent workflows and configurations
├── server/              # NestJS Backend (Real-time SOS Gateway)
│   ├── src/sos/        # WebSocket logic for emergency alerts
│   └── main.ts         # Gateway entry point
├── supabase/            # Supabase configuration & migrations
│   ├── migrations/      # SQL schema definitions
│   └── functions/       # Edge functions for threat prediction
├── src/
│   ├── components/      # Core UI modules (StealthMode, SOSButton, etc.)
│   ├── contexts/        # Auth and Google Maps integration contexts
│   ├── hooks/           # Custom React hooks for security & state
│   ├── lib/             # Utility functions (Encryption, API clients)
│   ├── pages/           # Main application views (Dashboard, Auth, Profile)
│   └── integrations/    # Supabase & external tool clients
└── public/              # Static assets and PWA icons
---

## 🧩 System Architecture

SafeHer follows a decentralized yet highly synchronized architecture:

1.  **Client (Frontend):** Runs the main UI, handles local encryption, manages offline evidence storage, and initiates Geolocation tracking.
2.  **Real-time Gateway (NestJS):** A dedicated server handling high-frequency WebSocket connections for SOS broadcasts, ensuring sub-second delivery to the help network.
3.  **Data Layer (Supabase):** Stores user profiles, encrypted evidence, trusted contacts, and historical safety data.
4.  **Integration Services:** Google Maps for visualization and Supabase Edge Functions for background tasks like threat analysis.

**Data Flow:**
`Action Trigger (SOS)` → `Local Encryption` → `WebSocket Broadcast (NestJS)` → `Database Persistence (Supabase)` → `Notification Delivery`

---

## 📁 Project Structure

```text
├── .agent/              # Agent workflows and configurations
├── server/              # NestJS Backend (Real-time SOS Gateway)
│   ├── src/sos/        # WebSocket logic for emergency alerts
│   └── main.ts         # Gateway entry point
├── supabase/            # Supabase configuration & migrations
│   ├── migrations/      # SQL schema definitions
│   └── functions/       # Edge functions for threat prediction
├── src/
│   ├── components/      # Core UI modules (StealthMode, SOSButton, etc.)
│   ├── contexts/        # Auth and Google Maps integration contexts
│   ├── hooks/           # Custom React hooks for security & state
│   ├── lib/             # Utility functions (Encryption, API clients)
│   ├── pages/           # Main application views (Dashboard, Auth, Profile)
│   └── integrations/    # Supabase & external tool clients
└── public/              # Static assets and PWA icons
```

safe-haven-web-1/
│
├─ src/
│ ├─ components/
│ │ ├─ MockMap.tsx # Mock map component for testing Google Maps integration
│ │ └─ ... # Other UI components
│ │
│ ├─ contexts/
│ │ └─ GoogleMapsContext.tsx # Context provider for Google Maps API
│ │
│ ├─ lib/
│ │ └─ googleMapsLoader.ts # Utility to load Google Maps API
│ │
│ ├─ networking/
│ │ ├─ apiClient.ts # Axios/fetch setup for API calls
│ │ └─ endpoints.ts # API endpoint definitions
│ │
│ ├─ auth/
│ │ ├─ jwtUtils.ts # JWT token generation, verification functions
│ │ └─ authMiddleware.ts # Middleware for protected routes
│ │
│ └─ ... # Other source files
│
├─ backend/
│ ├─ controllers/ # Business logic for endpoints
│ ├─ models/ # Database models
│ ├─ routes/ # Express routes
│ └─ server.js # Backend server entry point
│
├─ public/ # Static assets like images, icons
├─ package.json # NPM dependencies & scripts
├─ INFINITE_LOADING_FIX.md # Bug fix notes
├─ lint_results.txt # Linting results
└─ README.md # Project info (this file)
---
---

## 🔐 Security Implementation

- **Stealth Disguise:** Dynamically changes document title, favicon, and UI layout to mimic harmless apps like "Calculator" or "Notes."
- **Local E2EE:** Uses the user's master password to derive a cryptographic key that encrypts all media/notes before they touch the server.
- **Offline Reliability:** Evidence is stored in an encrypted queue within the browser and only synced when a secure connection is established.
- **Secure Auth:** Multi-factor authentication support via Supabase, with hardened session management to prevent unauthorized access.

---

## 🧪 Testing & Performance

- **Production Optimized:** Built with Vite for rapid load times and minimized bundle sizes.
- **PWA Ready:** SafeHer can be installed on mobile devices directly from the browser, ensuring it's always accessible on the home screen.
- **Scalability:** The NestJS gateway is designed to handle thousands of concurrent WebSocket connections, critical for city-wide safety networks.

---

*Made with ❤️ for the safety and empowerment of women everywhere.*
=======





 
