# VORTEX SIEM - Quantum-Safe Behavioral AI Security Platform

![Vortex SIEM](https://img.shields.io/badge/Security-VORTEX-000000?style=for-the-badge&logo=shield)
![Hugging Face](https://img.shields.io/badge/Hosted_on-Hugging_Face-FBBF24?style=for-the-badge&logo=huggingface)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)

Welcome to the **VORTEX SIEM** (Security Information and Event Management) platform. Built as a comprehensive security intelligence solution for the modern enterprise, VORTEX leverages live machine learning anomaly detection to stop insider threats, lateral movement, and data exfiltration in their tracks.

---

## 🎯 The Problem & Our Solution

### The Problem
Traditional SIEMs rely on static threshold alerts (e.g., "Alert if 5 failed logins occur"). These outdated rules suffer from massive alert fatigue, fail to adapt to employee habits, and are easily bypassed by sophisticated insider threats who "fly under the radar." 

### Our Solution
**VORTEX** solves this by using a **Behavioral AI Engine** that continuously learns the normal baseline for every individual employee—their login hours, file access frequency, and daily patterns. When an employee's behavior deviates from their historical baseline, the system automatically elevates their risk score. If the risk reaches critical levels, the system autonomously quarantines the compromised endpoint without waiting for human intervention.

### 🌟 Unique Selling Proposition (USP)
Unlike standard dashboard mockups, VORTEX is a **Live Simulation Environment**. Powered by the CMU CERT Insider Threat dataset, the platform runs an autonomous background engine that chronologically replays hundreds of thousands of real enterprise logs in real time. It perfectly demonstrates an active corporate network actively catching ground-truth Red Team actors.

---

## ✨ Key Features & Capabilities
- **Real-Time Threat Topology (D3.js):** A live physics-based force-directed graph that visually maps user-to-file relationships. It instantly highlights suspicious lateral movement when a user accesses restricted files.
- **Dynamic Risk Profiling:** Real-time behavioral risk scoring dynamically evaluates file access ratios, failed logins, after-hours activity, and unauthorized USB usage.
- **Automated RBAC Lockouts (Zero Trust):** The SIEM policy engine autonomously revokes user access and kills active network sessions the second critical risk thresholds are breached.
- **Quantum-Safe Telemetry:** Emulates Post-Quantum Cryptography (QPC) telemetry pipelines to ensure data transit integrity against future decryption attacks.
- **Live Endpoint Monitoring:** Tracks active devices, streaming their CPU, RAM, and encryption status directly to the SOC dashboard.

---

## 🏗️ Architecture & Tech Stack

VORTEX utilizes a highly decoupled, hybrid-cloud architecture optimized for high-throughput telemetry ingestion and real-time visualization.

### Tech Stack
* **Frontend:** React 19, TypeScript, Vite, Recharts (Data Viz), React-Force-Graph-2D (Topology), CSS Variables (Theming).
* **Backend:** Python 3.10, FastAPI, Gradio, NetworkX (Graph Mathematics), Pandas (Data processing).
* **Hosting / Cloud:** Vercel (Edge UI Delivery), Hugging Face Spaces (ZeroGPU compute backbone).

### Architectural Breakdown
1. **The Intelligence Layer (Hugging Face Backend):** 
   - Houses the `autonomous_telemetry_simulator` thread, which continuously processes raw log data into behavioral risk scores.
   - Computes advanced mathematics for the graph topology using `NetworkX` before shipping the nodes/edges to the client.
   - Enforces global SIEM policies dynamically on a localized state matrix.
2. **The ZeroGPU Bypass Adapter:** 
   - Hugging Face ZeroGPU serverless architectures restrict standard continuous FastAPI polling. VORTEX employs a custom Gradio WebSocket adapter pattern to bypass AST restrictions, allowing continuous REST-like API performance over WebSockets on serverless GPUs.
3. **The Presentation Layer (Vercel Frontend):** 
   - A high-performance, dark-mode dashboard built for Security Operations Center (SOC) analysts.
   - Implements a resilient `gradioFetch` polling loop that synchronizes the UI with the backend's fast-moving telemetry state every second.

---

## 🛠️ Installation & Deployment

### Local Development
To run the frontend dashboard locally:
```bash
cd frontend
npm install
npm run dev
```

### Backend Deployment (Hugging Face)
To deploy the backend engine to your Hugging Face Space:
```bash
python deploy_hf.py
```

---

## 📚 References & Datasets
This project was trained and simulated using the [CMU CERT Insider Threat Dataset](https://resources.sei.cmu.edu/library/asset-view.cfm?assetid=508099), a comprehensive collection of synthetic internal enterprise logs including logon, file, email, and device events. The dataset includes explicit ground-truth labels for "Red Team" actors performing data exfiltration, which VORTEX successfully isolates.

---
*Built for the Hackathon - Defending the digital frontier with Behavioral AI.*
