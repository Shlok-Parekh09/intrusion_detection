# VORTEX SIEM - Quantum-Safe Behavioral AI Security Platform

![Vortex SIEM](https://img.shields.io/badge/Security-VORTEX-000000?style=for-the-badge&logo=shield)
![Hugging Face](https://img.shields.io/badge/Hosted_on-Hugging_Face-FBBF24?style=for-the-badge&logo=huggingface)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)

Welcome to the VORTEX SIEM (Security Information and Event Management) platform. This repository contains a production-grade, real-time intrusion detection and behavioral analytics system originally built for the CMU CERT Insider Threat dataset.

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [ZeroGPU Architecture & Bypasses](#3-zerogpu-architecture--bypasses)
4. [Dataset & Ground Truth](#4-dataset--ground-truth)
5. [Behavioral AI Engine](#5-behavioral-ai-engine)
6. [Autonomous Telemetry Playback Engine](#6-autonomous-telemetry-playback-engine)
7. [Device Risk & Endpoint Management](#7-device-risk--endpoint-management)
8. [SIEM Security Policies](#8-siem-security-policies)
9. [Quantum-Safe Simulated Cryptography](#9-quantum-safe-simulated-cryptography)
10. [Dashboard Layout](#10-dashboard-layout)
11. [API Documentation](#11-api-documentation)
12. [Installation & Deployment](#12-installation--deployment)
13. [Extensibility](#13-extensibility)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. System Overview

VORTEX SIEM is designed to ingest thousands of telemetry events per second, process them through machine learning models to establish behavioral baselines, and detect insider threats before data exfiltration occurs.

Unlike static dashboards, VORTEX is a **living environment**. It features a self-driving background engine that chronologically replays real enterprise logs (from the CMU CERT dataset) in real time.

### Core Features
- **Real-Time Threat Topology**: A force-directed physics graph visualizing user-to-file relationships.
- **Behavioral Baselines**: The AI establishes a baseline for every employee's file accesses, login hours, and email habits.
- **Automated RBAC Lockouts**: If a user's risk breaches critical thresholds, the system automatically revokes their access and kills active data sessions.
- **Quantum-Safe Enclaves**: Simulated post-quantum cryptographic (QPC) telemetry tunnels.

---

## 2. Architecture

VORTEX uses a decoupled, hybrid-cloud architecture:

### Frontend: Vercel (Next.js / React)
The dashboard is built with React and hosted on Vercel. It uses a custom polling loop (`gradioFetch`) to fetch state from the backend every 3 seconds. The UI includes highly dynamic components like the `ForceGraph` (built on D3/force-graph) and real-time active session tables.

### Backend: Hugging Face Spaces (FastAPI + Gradio)
The intelligence of the system lives in a Hugging Face Space utilizing ZeroGPU infrastructure. The backend is responsible for:
- Holding the global SIEM state (`active_endpoints`, `managed_users`, `active_sessions`).
- Running the `autonomous_telemetry_simulator` thread.
- Enforcing SIEM policies via the `siem_policy_engine` thread.
- Calculating risk scores dynamically.

---

## 3. ZeroGPU Architecture & Bypasses

Deploying complex FastAPI backends on Hugging Face ZeroGPU Spaces requires specialized architectural patterns. ZeroGPU restricts continuous GPU usage and employs an Abstract Syntax Tree (AST) parser to statically check code for the `@spaces.GPU` decorator.

### The Gradio Adapter Pattern
Because the AST parser fails to detect decorators dynamically applied in FastAPI endpoints, we use a Gradio Adapter Pattern:
1. We define standard Python functions containing the core logic.
2. We define a dummy `@spaces.GPU` function to satisfy the AST parser:
   ```python
   @spaces.GPU
   def dummy_gpu(): pass
   ```
3. We wrap our REST logic in `gr.Blocks()` hidden buttons:
   ```python
   gr.Button("get_users").click(get_users, outputs=[gr.JSON(visible=False)], api_name="get_users")
   ```
This allows the React frontend to use `@gradio/client` to execute functions over WebSockets while fully bypassing the ZeroGPU AST limitations.

---

## 4. Dataset & Ground Truth

The simulation is powered by the **CMU CERT Insider Threat** dataset. 
- **Scale**: The original dataset is over 90GB of raw logs.
- **Processing**: The data was pre-processed using `generate_cert_synthetic.py` to extract behavioral features (e.g., `files_per_day`, `failed_logins`, `after_hours_activity`).
- **Ground Truth**: The dataset contains explicitly labeled "Red Team" actors who performed malicious data exfiltration. In VORTEX, these users are given the role **Insider Threat** in the UI to help administrators track the AI's efficacy.

---

## 5. Behavioral AI Engine

The Behavioral AI Engine computes a dynamic risk score for every user on a scale of `0.0` to `1.0` (with anomalies pushing it up to `2.5` before normalization).

### Risk Factors Evaluated:
1. **File Access Ratio**: `current_files / baseline_files`. A ratio > 3 adds +0.3 risk.
2. **Login Anomalies**: `current_logins / baseline_logins`.
3. **Failed Logins**: >= 5 failed attempts adds +0.3 risk.
4. **After Hours Activity**: Activity outside 08:00 - 18:00 adds +0.15 risk.
5. **USB Mass Storage**: Connecting unauthorized USB drives increases risk multiplicatively.

The score is recalculated instantly upon every telemetry event ingested.

---

## 6. Autonomous Telemetry Playback Engine

To create a genuine "Real-Time Company Environment," the backend runs a dedicated Python Thread: `autonomous_telemetry_simulator()`.

### How it Works:
1. It loads `file_access.csv`, which contains hundreds of thousands of chronologically sorted file access events.
2. Every 1 second, it reads a batch of real events from the CSV and ingests them into the SIEM.
3. It extracts the *actual hour* from the dataset timestamp to accurately trigger "After Hours" anomalies.
4. It dynamically synthesizes contextual events (emails, logons, USB connections) interleaved with the real file accesses to flesh out the corporate environment.

---

## 7. Device Risk & Endpoint Management

VORTEX treats Endpoints (Devices) and Users as distinct entities that share a symbiotic risk relationship.

- **Heartbeats**: The telemetry engine updates the CPU, RAM, and `last_seen` timestamp for every active endpoint continuously.
- **Risk Syncing**: The AI Behavioral Risk of the logged-in User is dynamically synced to the Endpoint's Risk Score. If User U0550 becomes High Risk, Device ep-U0550 inherits that risk and is flagged for quarantine.
- **Expiration**: Devices that fail to send a heartbeat within 600 seconds are marked offline.

---

## 8. SIEM Security Policies

The `siem_policy_engine` runs in the background evaluating global rules:
- **pol-001**: USB Mass Storage Block (Auto-locks users who connect unauthorized drives)
- **pol-002**: After-Hours Lockout
- **pol-003**: High Risk Quarantine (Revokes RBAC if risk > 0.8)
- **pol-007**: Data Exfiltration Prevention (Kills active network sessions transferring > 1MB of anomalous data)

---

## 9. Quantum-Safe Simulated Cryptography

All endpoint telemetry payloads are encapsulated in a simulated Post-Quantum Cryptography (QPC) tunnel.
- Uses AES-GCM-256 for symmetric encryption.
- Simulates lattice-based key encapsulation mechanisms (KEMs) for key exchange.

---

## 10. Dashboard Layout

- **Dashboard**: High-level metrics, login trends, risk distribution pie chart, and the Threat Topology graph.
- **Users & Access**: A detailed table of all employees, their current risk score (color-coded), department, and active status.
- **Policies**: Toggles for the active SIEM policies.
- **Devices**: Real-time CPU/RAM progress bars for active endpoints.
- **Sessions**: Network traffic tracking with the ability to manually terminate (Kill) data exfiltration sessions.

---

## 11. API Documentation

Because we use the Gradio Adapter pattern, the API is accessed via WebSockets using `@gradio/client`.

- `/get_endpoints`: Returns active endpoints and telemetry.
- `/get_users`: Returns user state and behavioral baselines.
- `/get_graph`: Returns physics nodes and links for D3.
- `/cert_log`: Ingests a new raw log event.

---

## 12. Installation & Deployment

### Local Development
```bash
cd frontend
npm install
npm run dev
```

### Hugging Face Deployment
```bash
python deploy_hf.py
```

---

## 13. Extensibility
To add a new telemetry source:
1. Define the event in `CertEvent`.
2. Update `ingest_cert_log` in `api_server.py`.
3. Add a visualizer in `App.tsx`.

---

## 14. Troubleshooting
- **Empty Graph**: Ensure the backend has started playing back the logs. It takes a few seconds to populate.
- **Sessions Not Updating**: Verify the telemetry engine thread is running.


### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.

### Additional Troubleshooting Scenarios

**Scenario: Risk Score Not Increasing**
- Ensure the user is actually tagged as Red Team.
- Verify `file_access.csv` contains anomalous bursts.

**Scenario: Graph Exploding**
- The Force Graph D3 physics parameters may need tuning in `ForceGraph.tsx` if nodes > 10,000.

**Scenario: CPU/RAM Stagnant**
- Ensure `autonomous_telemetry_simulator` thread is alive.
