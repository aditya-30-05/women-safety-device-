
# 🛡️ Women Safety Device – Secure Web Application 🚨

A modern, secure, and user-friendly **Women Safety Web Application** built to provide
quick emergency assistance using an SOS system.  
The project focuses on **security, reliability, and real-world usability**.

---

## 📌 Problem Statement

Women often face unsafe situations where immediate help is required.
Existing solutions are either slow, unreliable, or lack strong security.

---

## 💡 Solution

This project provides a **digital women safety system** where a user can:
- Trigger an **SOS emergency alert**
- Securely authenticate and access the system
- View emergency-related UI in real time
- Extend the system to IoT devices and backend APIs

---

## ✨ Key Features

- 🚨 SOS Emergency Button
- 🗺️ **Real-time Location Tracking with Google Maps**
- 📍 Live Location Sharing
- 🔐 Secure Authentication (Context API)
- 🧠 Session Management
- 🎨 Responsive & Clean UI
- ⚡ Fast performance using Vite
- 🛡️ Security-focused project structure

---

## 🧱 Project Architecture

```text
Frontend (React + TS)
   |
   |── AuthContext (Security Layer)
   |── Pages & UI Components
   |--- src/components 
   |--- src/pages 
               
Backend
   ├── Supabase (Database & Auth)
   ├── Location History Tracking
   └── Emergency Alert System

Future Scope
   ├── Backend APIs (Node / Express)
   └── IoT Device Integration (ESP32 / GPS)

safe-haven-web/
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
│ └─ ... # Other source files
│
├─ public/ # Static assets like images, icons
├─ package.json # NPM dependencies & scripts
├─ INFINITE_LOADING_FIX.md # Bug fix notes
├─ lint_results.txt # Linting results
└─ README.md # Project info (this file)

---







 
