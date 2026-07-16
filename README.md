# VORTEX SIEM - Quantum-Safe Behavioral AI Security Platform

![Vortex SIEM](https://img.shields.io/badge/Security-VORTEX-000000?style=for-the-badge&logo=shield)
![Hugging Face](https://img.shields.io/badge/Hosted_on-Hugging_Face-FBBF24?style=for-the-badge&logo=huggingface)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)

Welcome to the **VORTEX SIEM** (Security Information and Event Management) platform, a production-grade, real-time intrusion detection and behavioral analytics system. Built as a comprehensive security intelligence solution, VORTEX leverages live machine learning anomaly detection to stop insider threats and data exfiltration in their tracks.

## 🚀 The Problem & Our Solution
Traditional SIEMs rely on static threshold alerts which suffer from alert fatigue and fail to detect sophisticated insider threats. 

**VORTEX** solves this by using a **Behavioral AI Engine** that continuously learns the normal baseline for every employee (login hours, file access frequency, email patterns). When an employee's behavior deviates from their historical baseline, the system automatically elevates their risk score and can autonomously quarantine the compromised endpoint.

## ✨ Key Features
- **Real-Time Threat Topology:** A live force-directed graph (D3) that visualizes user-to-file relationships and dynamically highlights suspicious lateral movement.
- **Behavioral AI Profiling:** Real-time risk scoring based on file access ratios, failed logins, after-hours activity, and unauthorized USB usage.
- **Automated RBAC Lockouts:** The SIEM policy engine automatically revokes user access and kills active network sessions if critical risk thresholds are breached.
- **Quantum-Safe Tunnels:** Emulates Post-Quantum Cryptography (QPC) telemetry pipelines to ensure data integrity.
- **Autonomous Playback Engine:** Uses the CMU CERT dataset as a backbone to simulate a live, breathing corporate environment with continuous background telemetry.

## 🏗️ Architecture & Tech Stack

VORTEX utilizes a highly decoupled, hybrid-cloud architecture to ensure scalability:

* **Frontend (Next.js / React / Vercel):** A high-performance, dark-mode dashboard built for Security Operations Center (SOC) analysts. Features real-time active session tracking, live logging feeds, and dynamic D3 topology mapping.
* **Backend (FastAPI / Gradio / Hugging Face Spaces):** The intelligence layer running on ZeroGPU infrastructure. It houses the `autonomous_telemetry_simulator` thread, enforcing SIEM policies, and continuously processing telemetry data into behavioral risk scores.
* **ZeroGPU Bypass Adapter:** Employs a custom Gradio WebSocket adapter pattern to bypass Hugging Face's AST restrictions, allowing continuous REST-like API performance on serverless GPUs.

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

## 📚 References & Datasets
This project was trained and simulated using the [CMU CERT Insider Threat Dataset](https://resources.sei.cmu.edu/library/asset-view.cfm?assetid=508099), a comprehensive collection of synthetic internal enterprise logs including logon, file, email, and device events. The dataset includes explicit ground-truth labels for "Red Team" actors performing data exfiltration, which VORTEX successfully isolates.

---
*Built for the Hackathon - Defending the digital frontier with Behavioral AI.*
