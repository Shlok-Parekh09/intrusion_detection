# AI-Powered Insider Threat Detection System

## Overview
Detects insider threats using machine learning by analyzing user behavior, system access, and anomalies. Includes simulated logs, anomaly detection models, a combined dashboard, explainability tools, graph analysis, and red team simulation.

## Features
- Simulated and real log ingestion (user logins, file access, USB usage, emails)
- Feature engineering for behavioral, frequency, anomaly, graph, and NLP features
- Unsupervised anomaly detection (Isolation Forest, One-Class SVM, Autoencoder)
- Red team simulation to inject malicious behaviors
- Graph-based analysis (NetworkX, PyVis) for entity relationships and at-risk visualization
- Splunk-like SIEM Dashboard for anomaly review, user detail, interactive graph, and system explanation
- Explainability with SHAP (and LIME for compatible models)

## Setup
```bash
pip install -r requirements.txt
```

## Pipeline Execution
The project scripts are named sequentially for an easy pipeline execution:

1. **Simulate Basic Logs:** `python src/01_simulate_logs.py`
2. **Inject Red Team Events:** `python src/02_simulate_red_team.py`
3. **Basic Feature Engineering:** `python src/03_feature_engineering.py`
4. **NLP Email Features:** `python src/04_nlp_features.py`
5. **Merge Features:** `python src/05_merge_features.py`
6. **Train Models:** `python src/06_train_models.py`

*(Alternatively, you can integrate the CERT R4.2 dataset using `data/parse_cert_to_local.py` instead of step 1).*

## Launch Splunk-like Dashboard
```bash
streamlit run src/07_splunk_dashboard.py
```

## Dashboard Tabs
- **Anomaly Table:** Sortable, filterable SIEM-like table of users, anomaly scores, and red team flags
- **User Detail:** Feature and anomaly breakdown for selected user
- **At-Risk Graph:** Interactive PyVis graph of high-risk users and their connections
- **How Does It Work?:** Detailed explanation of the system's mathematics, algorithms, and design

## Advanced Features
- Graph-based features and visualization (NetworkX, PyVis)
- NLP features from email analysis
- Red team simulation for robust testing
- Explainability with SHAP (and LIME where supported)
