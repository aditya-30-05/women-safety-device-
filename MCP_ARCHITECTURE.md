# SafeHer MCP Intelligence Layer: System Architecture & Design

This document outlines the architecture for the **SafeHer MCP (Model Context Protocol)** integration. This layer provides an AI-driven "Safety Intelligence Agent" that operates in parallel to the core safety-critical systems.

## 1. System Philosophy: "Intelligence, Not Control"
- **Zero-Coupling:** The core SOS, Tracking, and Auth flows are independent of the MCP layer. If the AI service is offline, SafeHer remains 100% functional.
- **Safety-Critical Isolation:** AI cannot trigger SOS alerts or modify emergency states. It serves as an advisory and analytical layer only.
- **Privacy First:** Data passed to LLMs via MCP is anonymized or filtered at the tool level.

---

## 2. Architecture Overview

### ASCII Representation
```text
┌──────────────────────────────────────────────────────────────────────────┐
│                          CORE SAFEHER WEB APP (React)                    │
│  ┌────────────────────────┐         ┌──────────────────────────────────┐  │
│  │   Real-time Tracking   │         │    SOS / Emergency System       │  │
│  └───────────┬────────────┘         └────────────────┬─────────────────┘  │
│              │                                       │                    │
└──────────────┼───────────────────────────────────────┼────────────────────┘
               │                                       │
               │         ┌─────────────────────────────▼─────────┐
               │         │        SUPABASE DATABASE              │
               └─────────►  (Alerts, History, Unsafe Zones)      │
                         └─────────────────┬─────────────────────┘
                                           │
                                           │ (READ-ONLY EVENT STREAM)
                                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     MCP INTELLIGENCE LAYER (Standalone)                  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                       MCP SERVER (Node.js/TS)                      │  │
│  │   ┌────────────────────┐      ┌──────────────────────────────┐     │  │
│  │   │  Safety Intelligence│      │       Permissioned Tools      │     │  │
│  │   │        Agent        │◄────►│  (Read-only, Audited Logs)   │     │  │
│  │   └────────────────────┘      └──────────────┬───────────────┘     │  │
│  └──────────────────────────────────────────────┼─────────────────────┘  │
└─────────────────────────────────────────────────┼────────────────────────┘
                                                  │
                                                  ▼
                                       AI Insights & Summaries
                                    (Dashboard Visualization Only)
```

---

## 3. Deployment & Folder Structure

### Service Structure (`/mcp-server`)
```text
mcp-server/
├── src/
│   ├── index.ts           # MCP Server Initialization (Stdio/SSE)
│   ├── agents/
│   │   └── safety-agent.ts# Safety Intelligence Logic
│   ├── tools/
│   │   ├── sos-analyzer.ts# Tool: get_live_sos_snapshot
│   │   ├── clusters.ts    # Tool: analyze_location_clusters
│   │   └── risk-scores.ts # Tool: generate_risk_scores
│   ├── security/
│   │   ├── auditor.ts     # Tool-level logging & validation
│   │   └── sanitizer.ts   # PII Anonymization layer
│   └── services/
│       └── supabase.ts    # Filtered DB client
├── package.json
└── tsconfig.json
```

---

## 4. MCP Tools Specification

| Tool Name | Input | Output | Security Boundary |
|-----------|-------|--------|-------------------|
| `get_live_sos_snapshot` | `timeframe: string` | Aggregated SOS counts & severity | No PII; Read-only metadata |
| `analyze_location_clusters` | `radius: number` | Geo-JSON of alert hotspots | Anonymized coordinates |
| `generate_risk_scores` | `route: GeoCoord[]` | Score (1-10) based on history | External API + DB history |
| `build_admin_summary` | `alert_id: string` | AI narrative of incident | Admin-only; Encrypted transport |
| `threat_zone_insights` | `min_reports: number` | Suggested 'Unsafe Zones' | Suggestion only; No auto-write |

---

## 5. Security & Safety Model
- **RBAC for Tools:** Only authorized 'Admin' tokens can call `build_admin_summary`.
- **Anonymization Filter:** The `sanitizer.ts` layer automatically strips names and exact geolocations unless the session has explicit 'Evidence Viewer' clearance.
- **Rate Limiting:** MCP tools are limited to 10 calls/min to prevent database scraping.
- **Decision Silence:** The AI is architecturally barred from writing to the `emergency_alerts` table.

---

## 6. Data Movement Paths
1. **Telemetry Ingress:** `Client Browser` ──> `GPS/Alert Data` ──> `Supabase DB`.
2. **Intelligence Trigger:** `Admin/User` ──> `Prompt` ──> `LLM Client`.
3. **Context Retrieval:** `LLM Client` ──> `MCP Tool Request` ──> `MCP Server`.
4. **Data Sourcing:** `MCP Server` ──> `Sanitized Query` ──> `Supabase DB`.
5. **Insight Egress:** `MCP Server` ──> `Anonymized Metadata` ──> `LLM Context` ──> `User Interface`.

---

## 7. Failure Scenarios & Safety Fallbacks

| Scenario | Impact | Fallback Mechanism |
|----------|--------|---------------------|
| MCP Server Timeout | Intelligence Widget Spinner | UI displays "Analyitcs Offline"; no impact on SOS. |
| API Rate Limit Hit | Delayed AI Summary | Queued retry for non-critical tools; direct DB access for Admin. |
| AI Hallucination | False Risk Score | User manual override; mandatory "AI Generated" warning labels. |
| Network Partition | AI Insights hidden | Local state cache (React Query) shows last known data. |

---

## 7. Demo & Hackathon Boost

### 🏆 2–3 MCP-Powered Demo Features
1. **Dynamic Threat Clustering:** Instead of static unsafe zones, the AI analyzes the "velocity" of alerts. If 3 SOS calls happen in the same square kilometer in 2 hours, the MCP tool `threat_zone_insights` automatically flags it to admins as a "Critical Emerging Cluster."
2. **AI Safety Scorecard:** When a user starts a Journey, the MCP Agent reads the path and generates a "Safety Confidence Score" (1-100) based on historical data, time of day, and community help network density along that path.
3. **Admin Incident Recap:** Instead of scrolling through logs, the Admin clicks an alert and the MCP Agent uses `build_admin_summary` to provide a 3-sentence situation report: *"Active SOS at 10:15 PM in Park Street. User has 2 trusted contacts nearby. Historically, this area is low-risk but has seen a 20% spike in alerts this week."*

### 🎤 30-Second Hackathon Script
> "SafeHer is built for 100% reliability. Our core safety-critical system handles SOS and tracking via a robust Supabase backend that works even in low-signal environments.
>
> But we went a step further. We've integrated a **Model Context Protocol (MCP)** intelligence layer. This is a parallel AI service that 'oversees' the data. It analyzes SOS patterns, predicts emerging clusters, and provides safety scoring—all without ever being allowed to touch the critical emergency code.
>
> It’s a safety-first AI architecture: Intelligence that enhances, but never risks, the actual safety net. If the AI fails, the SOS button still works. That’s production-ready safety-critical engineering."

---

## 8. Professional README Section

### 🤖 AI & MCP Intelligence Layer

The **SafeHer Intelligence Layer** is an advanced analytical service built on the **Model Context Protocol (MCP)**. It acts as a parallel "Brain" that processes safety data to provide proactive insights without compromising the core emergency system.

#### 🛡️ Safety Isolation & Guarantees
- **Parallel Execution:** The MCP server is a standalone service. The main app's safety-critical features (SOS, GPS Tracking, Evidence) bypass the AI layer to ensure 0% latency and 100% reliability during emergencies.
- **Read-Only Intelligence:** The AI agent is architecturally blocked from triggering SOS alerts or modifying database state. It is an **Insight-Only** layer.
- **Permissioned Analysis:** Sensitive data is never sent to the LLM without passing through an on-premise sanitization and PII-removal filter.

#### 🧠 Agent Responsibilities
- **Pattern Matching:** Identifying rising crime or harassment trends in specific neighborhoods.
- **Severity Scoring:** Helping responders prioritize alerts based on historical context.
- **Route Optimization:** Suggesting safer alternatives based on real-time help-network density.
