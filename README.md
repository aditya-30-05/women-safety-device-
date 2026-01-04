
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
   |
Backend
   ├── Supabase (Database & Auth)
   ├── Location History Tracking
   └── Emergency Alert System

Future Scope
   ├── Backend APIs (Node / Express)
   └── IoT Device Integration (ESP32 / GPS)

---

## 🗺️ Google Maps Setup

To enable location tracking with Google Maps:

1. Get a Google Maps API Key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Maps JavaScript API"
   - Create credentials (API Key)
   - Restrict the API key to your domain (recommended)

2. Add the API key to your environment:
   - Create a `.env` file in the root directory
   - Add: `VITE_GOOGLE_MAPS_API_KEY=your_api_key_here`

3. The map will automatically load when the API key is configured.

**Note:** The app will work without the API key, but the map visualization will not be available.
