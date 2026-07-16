from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
import networkx as nx
import base64
import json
import time
import random
import threading
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

app = FastAPI(title="Quantum-Secure Enterprise SIEM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = 'data'
SHARED_QUANTUM_SAFE_KEY = b'12345678901234567890123456789012'

# ═══════════════════════════════════════════════════════════════════
# In-memory state
# ═══════════════════════════════════════════════════════════════════
active_endpoints = {}
live_events = []

# Managed users with behavioral analytics
managed_users = {}




# Security policies
security_policies = [
    {"id": "pol-001", "name": "Zero Trust Endpoint Validation", "enabled": True, "scope": "All Endpoints", "enforcement": "Mandatory", "category": "Access Control", "violations": 0},
    {"id": "pol-002", "name": "Privileged Session Recording", "enabled": True, "scope": "Admin Accounts", "enforcement": "Mandatory", "category": "Monitoring", "violations": 0},
    {"id": "pol-003", "name": "USB Device Restriction", "enabled": True, "scope": "All Users", "enforcement": "Block", "category": "Data Protection", "violations": 3},
    {"id": "pol-004", "name": "After-Hours Access Alert", "enabled": True, "scope": "Non-Admin Users", "enforcement": "Alert", "category": "Behavior", "violations": 2},
    {"id": "pol-005", "name": "Multi-Factor Authentication", "enabled": True, "scope": "All Accounts", "enforcement": "Mandatory", "category": "Authentication", "violations": 1},
    {"id": "pol-006", "name": "QPC Key Rotation (24h)", "enabled": True, "scope": "System", "enforcement": "Automated", "category": "Cryptography", "violations": 0},
    {"id": "pol-007", "name": "Data Exfiltration Prevention", "enabled": True, "scope": "All Endpoints", "enforcement": "Block + Alert", "category": "Data Protection", "violations": 5},
    {"id": "pol-008", "name": "Excessive File Access Detection", "enabled": True, "scope": "All Users", "enforcement": "Alert + Lock", "category": "Behavior", "violations": 4},
    {"id": "pol-009", "name": "Failed Login Threshold (5/hr)", "enabled": True, "scope": "All Accounts", "enforcement": "Lock Account", "category": "Authentication", "violations": 2},
    {"id": "pol-010", "name": "Privileged Escalation Monitoring", "enabled": True, "scope": "All Users", "enforcement": "Alert + Review", "category": "Access Control", "violations": 1},
]

# Active sessions tracking
active_sessions = {}


class TelemetryPayload(BaseModel):
    agent_id: str
    qpc_payload: str

class UserAction(BaseModel):
    action: str  # lock, unlock, investigate, revoke_access, force_mfa
    reason: Optional[str] = None

class PolicyToggle(BaseModel):
    enabled: bool

class SessionAction(BaseModel):
    action: str  # kill, flag

class CertEvent(BaseModel):
    user_id: str
    event_type: str  # 'logon', 'file', 'email', 'usb'
    action: str
    details: str


def qpc_decrypt(encrypted_payload_b64: str) -> dict:
    try:
        raw = base64.b64decode(encrypted_payload_b64)
        nonce = raw[:12]
        ct = raw[12:]
        aesgcm = AESGCM(SHARED_QUANTUM_SAFE_KEY)
        pt = aesgcm.decrypt(nonce, ct, None)
        return json.loads(pt.decode('utf-8'))
    except Exception as e:
        print(f"QPC Decryption Failed: {e}")
        return {}

def load_dataset():
    # Use the pre-packaged local data files to bypass Hugging Face API downtimes
    import os
    
    # Check if we are running in the backend_hf directory or root directory
    base_dir = "data"
    if not os.path.exists(base_dir) and os.path.exists("backend_hf/data"):
        base_dir = "backend_hf/data"
        
    feat_path = os.path.join(base_dir, "merged_features.csv")
    scores_path = os.path.join(base_dir, "anomaly_scores.csv")
    file_path = os.path.join(base_dir, "file_access.csv")
    
    features = pd.read_csv(feat_path)
    scores = pd.read_csv(scores_path)
    file_access = pd.read_csv(file_path, parse_dates=['access_time'])
    file_access = file_access.sort_values(by='access_time').reset_index(drop=True)
    
    df = pd.merge(features, scores, on='user')
    if 'is_red_team_x' in df.columns:
        df['is_red_team'] = df['is_red_team_x']
    return df, file_access
    return df, file_access

# ═══════════════════════════════════════════════════════════════════
# Initialize Data from Hugging Face
# ═══════════════════════════════════════════════════════════════════

global_df = None
global_attrs = {}
live_graph_edges = []
login_trends_by_hour = {str(i).zfill(2): {"successful": 0, "failed": 0} for i in range(24)}

try:
    global_df, initial_file_access = load_dataset()
    roles = ["Software Engineer", "HR Manager", "Financial Analyst", "System Admin", "Data Scientist", "Sales Executive", "Marketing Specialist", "Product Manager", "Pentester", "ML Engineer", "DevOps Engineer", "Frontend Developer", "Backend Developer", "Security Analyst"]
    departments = ["Engineering", "Human Resources", "Finance", "IT", "Data Analytics", "Sales", "Marketing", "Product", "Cybersecurity", "Operations"]
    groups = ["Staff", "Management", "Contractor", "Executive", "Freelancer"]
    access_levels = ["Standard", "Privileged", "Admin", "Restricted"]

    for _, row in global_df.iterrows():
        uid = str(row['user'])
        is_red = bool(row.get('is_red_team', 0))
        managed_users[uid] = {
            "id": uid, "name": uid, "role": random.choice(roles) if not is_red else "Insider Threat",
            "group": random.choice(groups), "department": random.choice(departments), "access_level": random.choice(access_levels),
            "status": "active", "mfa": True, "risk_score": 0.0,
            "login_count_today": 0, # Start at 0 for live simulation
            "failed_logins_today": 0,
            "files_accessed_today": 0, # Start at 0
            "email_count_today": 0,
            "after_hours_activity": False,
            "usb_attempts": 0, 
            "last_login": time.time() - random.randint(100, 3600),
            "behavioral_baseline": {"avg_files": 15, "avg_logins": 2, "avg_hours": 8},
        }
        
        anomaly = max(row['isolation_forest'], row['oneclass_svm'], row['autoencoder'])
        global_attrs[uid] = {
            'anomaly': anomaly,
            'red_team': is_red,
            'high_risk': (anomaly > 1.5) or is_red
        }
        
    # Pre-select exactly 30 users to be online "early birds" to simulate morning login organically
    initial_uids = random.sample(list(managed_users.keys()), min(30, len(managed_users)))
    for uid in initial_uids:
        ep_id = f"ep-{uid}"
        active_endpoints[ep_id] = {
            "agent_id": ep_id,
            "timestamp": time.time(),
            "cpu": random.randint(10, 80),
            "ram": random.randint(20, 90),
            "net_conns": random.randint(5, 50),
            "risk_score": managed_users[uid]["risk_score"],
            "status": "SECURE",
            "last_seen": time.time() - random.randint(0, 20)
        }
        active_sessions[ep_id] = {
            "id": f"sess-{len(active_sessions)+1:04d}",
            "agent_id": ep_id,
            "started": time.time() - random.randint(60, 3600),
            "last_activity": time.time() - random.randint(0, 60),
            "status": "active",
            "protocol": "QPC-AES-256",
            "bytes_transferred": random.randint(1024, 1024000),
        }
        live_events.append({
            "time": time.time() - random.randint(60, 3600),
            "agent_id": ep_id,
            "message": f"Successful Logon by {uid}",
            "severity": "INFO",
            "category": "system",
        })
        managed_users[uid]["login_count_today"] += 1
        
    print(f"Successfully loaded {len(managed_users)} users from Hugging Face. Pre-started {len(active_endpoints)} endpoints.")
except Exception as e:
    print(f"Failed to initialize dataset: {e}")


def _compute_behavioral_risk(user: dict) -> float:
    """AI-driven behavioral risk scoring."""
    baseline = user.get("behavioral_baseline", {})
    risk = 0.0
    
    # File access anomaly
    avg_files = baseline.get("avg_files", 20)
    if avg_files > 0:
        file_ratio = user["files_accessed_today"] / avg_files
        if file_ratio > 3: risk += 0.3
        elif file_ratio > 2: risk += 0.15
        elif file_ratio > 1.5: risk += 0.05
    
    # Login anomaly
    avg_logins = baseline.get("avg_logins", 4)
    if avg_logins > 0:
        login_ratio = user["login_count_today"] / avg_logins
        if login_ratio > 3: risk += 0.2
        elif login_ratio > 2: risk += 0.1
    
    # Failed logins
    if user["failed_logins_today"] >= 5: risk += 0.3
    elif user["failed_logins_today"] >= 3: risk += 0.15
    elif user["failed_logins_today"] >= 1: risk += 0.05
    
    # After hours
    if user["after_hours_activity"]: risk += 0.15
    
    # USB attempts
    if user["usb_attempts"] > 0: risk += 0.1 * user["usb_attempts"]
    
    # No MFA is risky
    if not user["mfa"]: risk += 0.1
    
    # Privileged accounts get extra scrutiny
    if user["access_level"] == "Privileged": risk *= 1.2
    
    return min(round(risk, 2), 1.0)


def _add_event(agent_id: str, message: str, severity: str = "INFO", category: str = "system"):
    live_events.append({
        "time": time.time(),
        "agent_id": agent_id,
        "message": message,
        "severity": severity,
        "category": category,
    })
    if len(live_events) > 200:
        live_events.pop(0)


# ═══════════════════════════════════════════════════════════════════
# Telemetry Ingestion
# ═══════════════════════════════════════════════════════════════════

@app.post("/api/v1/telemetry/ingest")
def ingest_telemetry(payload: TelemetryPayload):
    data = qpc_decrypt(payload.qpc_payload)
    if not data:
        raise HTTPException(status_code=400, detail="QPC Decapsulation Failed")
    
    risk_score = 0.5
    is_red = data.get('is_red_team', False)
    if is_red or data.get('files_per_day', 0) > 1000:
        risk_score = 2.5
    
    agent_state = {
        "agent_id": data.get("agent_id"),
        "timestamp": data.get("timestamp"),
        "cpu": data.get("cpu_percent"),
        "ram": data.get("ram_percent"),
        "net_conns": data.get("network_connections"),
        "risk_score": risk_score,
        "status": "LOCKED" if risk_score > 1.5 else "SECURE",
        "last_seen": time.time()
    }
    
    active_endpoints[payload.agent_id] = agent_state
    
    # Track session
    if payload.agent_id not in active_sessions:
        active_sessions[payload.agent_id] = {
            "id": f"sess-{len(active_sessions)+1:04d}",
            "agent_id": payload.agent_id,
            "started": time.time(),
            "last_activity": time.time(),
            "status": "active",
            "protocol": "QPC-AES-256",
            "bytes_transferred": 0,
        }
    active_sessions[payload.agent_id]["last_activity"] = time.time()
    active_sessions[payload.agent_id]["bytes_transferred"] += random.randint(1024, 65536)
    
    if risk_score > 1.5:
        _add_event(payload.agent_id, "CRITICAL: Anomalous behavior detected. RBAC lockout initiated.", "CRITICAL", "threat")
    else:
        _add_event(payload.agent_id, "QPC heartbeat verified. Telemetry nominal.", "INFO", "telemetry")

    return {"status": "success", "risk_score": risk_score, "rbac_action": agent_state["status"]}

@app.post("/api/v1/telemetry/cert_log")
def ingest_cert_log(event: CertEvent):
    uid = event.user_id
    if uid not in managed_users:
        return {"status": "ignored", "reason": "unknown_user"}
        
    user = managed_users[uid]
    
    # Process event
    if event.event_type == "logon":
        user["login_count_today"] += 1
        user["last_login"] = time.time()
        
        # Track for the login trends chart based on real time
        current_hour = str(time.localtime().tm_hour).zfill(2)
        
        if "fail" in event.action.lower():
            user["failed_logins_today"] += 1
            login_trends_by_hour[current_hour]["failed"] += 1
            _add_event(f"ep-{uid}", f"Failed Logon attempt by {uid}", "WARNING", "Authentication")
        else:
            login_trends_by_hour[current_hour]["successful"] += 1
            _add_event(f"ep-{uid}", f"Successful Logon by {uid}", "INFO", "Authentication")
            
    elif event.event_type == "file":
        user["files_accessed_today"] += 1
        # Add to graph
        file_name = event.details or f"file_{random.randint(1,1000)}.txt"
        live_graph_edges.append((uid, file_name))
        
        # Log a small percentage of normal file accesses to the live feed so it looks busy but readable
        if random.random() < 0.05:
            _add_event(f"ep-{uid}", f"File Accessed: {file_name}", "INFO", "File System")
            
        # Keep graph manageable (max 250 edges to prevent frontend D3 physics explosion but keep it smooth)
        if len(live_graph_edges) > 250:
            live_graph_edges.pop(0)
            
    elif event.event_type == "email":
        user["email_count_today"] += 1
        _add_event(f"ep-{uid}", f"Email sent by {uid} to {event.details}", "INFO", "Network")
        
    elif event.event_type == "usb":
        if event.action.lower() == "connect":
            user["usb_attempts"] += 1
            _add_event(f"ep-{uid}", f"USB Drive Connected by {uid}", "WARNING", "Data Protection")

    # Flag after-hours activity (assuming real-time streaming means current time is after hours for simulation)
    # For now, we'll randomly flag off-hour activity if it's a red team user
    if user["role"] == "Insider Threat" and random.random() < 0.05:
        user["after_hours_activity"] = True
        
    # Bump endpoint last seen so it stays active
    ep_id = f"ep-{uid}"
    if ep_id in active_endpoints:
        active_endpoints[ep_id]["last_seen"] = time.time()
        active_endpoints[ep_id]["cpu"] = random.randint(10, 80)
        active_endpoints[ep_id]["ram"] = random.randint(20, 90)
        
    # Re-evaluate risk immediately
    risk = _compute_behavioral_risk(user)
    user["risk_score"] = risk
    
    # Log significant anomalies directly
    if risk > 0.8 and user["status"] == "active":
        _add_event("SYSTEM", f"CRITICAL: User {uid} reached critical risk score {risk}!", "CRITICAL", "Behavior")
        
    return {"status": "success", "new_risk": risk}

# ═══════════════════════════════════════════════════════════════════
# Live Endpoints & Events
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/v1/endpoints")
def get_endpoints():
    now = time.time()
    active = [ep for ep in active_endpoints.values() if now - ep["last_seen"] < 30]
    return active

@app.get("/api/v1/events")
def get_events(category: Optional[str] = None, severity: Optional[str] = None, limit: int = 50):
    filtered = live_events
    if category:
        filtered = [e for e in filtered if e.get("category") == category]
    if severity:
        filtered = [e for e in filtered if e["severity"] == severity]
    return sorted(filtered, key=lambda x: x["time"], reverse=True)[:limit]

@app.get("/api/v1/trends/logins")
def get_login_trends():
    trends = []
    # Return data from the last 8 hours
    current_hour = time.localtime().tm_hour
    for i in range(7, -1, -1):
        h = (current_hour - i) % 24
        h_str = str(h).zfill(2)
        trends.append({
            "time": f"{h_str}:00",
            "successful": login_trends_by_hour[h_str]["successful"],
            "failed": login_trends_by_hour[h_str]["failed"]
        })
    return trends


# ═══════════════════════════════════════════════════════════════════
# User Management (Insider Threat Control)
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/v1/users")
def get_users():
    users = []
    for uid, u in managed_users.items():
        u_copy = dict(u)
        u_copy["risk_score"] = _compute_behavioral_risk(u)
        users.append(u_copy)
    return sorted(users, key=lambda x: x["risk_score"], reverse=True)

@app.get("/api/v1/users/{user_id}")
def get_user(user_id: str):
    if user_id not in managed_users:
        raise HTTPException(status_code=404, detail="User not found")
    u = dict(managed_users[user_id])
    u["risk_score"] = _compute_behavioral_risk(u)
    return u

@app.post("/api/v1/users/{user_id}/action")
def user_action(user_id: str, body: UserAction):
    if user_id not in managed_users:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = managed_users[user_id]
    action = body.action
    reason = body.reason or "Administrative action"
    
    if action == "lock":
        user["status"] = "locked"
        _add_event("SYSTEM", f"Account LOCKED: {user['name']} ({user_id}). Reason: {reason}", "CRITICAL", "access_control")
        return {"status": "locked", "message": f"Account {user_id} locked"}
    
    elif action == "unlock":
        user["status"] = "active"
        _add_event("SYSTEM", f"Account UNLOCKED: {user['name']} ({user_id}). Reason: {reason}", "WARNING", "access_control")
        return {"status": "active", "message": f"Account {user_id} unlocked"}
    
    elif action == "investigate":
        user["status"] = "under_investigation"
        _add_event("SYSTEM", f"Investigation started: {user['name']} ({user_id}). {reason}", "WARNING", "investigation")
        return {"status": "under_investigation", "message": f"Investigation started for {user_id}"}
    
    elif action == "revoke_access":
        user["status"] = "revoked"
        user["access_level"] = "None"
        _add_event("SYSTEM", f"All access REVOKED: {user['name']} ({user_id}). {reason}", "CRITICAL", "access_control")
        return {"status": "revoked", "message": f"Access revoked for {user_id}"}
    
    elif action == "force_mfa":
        user["mfa"] = True
        _add_event("SYSTEM", f"MFA forced on: {user['name']} ({user_id}). {reason}", "INFO", "authentication")
        return {"status": "mfa_enabled", "message": f"MFA enforced for {user_id}"}
        
    elif action == "update_access":
        level = body.reason or "Standard"
        user["access_level"] = level
        _add_event("SYSTEM", f"Access level for {user['name']} updated to {level}", "WARNING", "access_control")
        return {"status": "access_updated", "message": f"Access level updated to {level}"}
    
    elif action == "reset_risk":
        user["failed_logins_today"] = 0
        user["usb_attempts"] = 0
        user["after_hours_activity"] = False
        user["files_accessed_today"] = int(user["behavioral_baseline"]["avg_files"])
        user["login_count_today"] = int(user["behavioral_baseline"]["avg_logins"])
        _add_event("SYSTEM", f"Risk indicators reset: {user['name']} ({user_id})", "INFO", "access_control")
        return {"status": "reset", "message": f"Risk indicators reset for {user_id}"}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


# ═══════════════════════════════════════════════════════════════════
# Policy Management
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/v1/policies")
def get_policies():
    return security_policies

class NewPolicy(BaseModel):
    name: str
    category: str
    scope: str
    enforcement: str

@app.post("/api/v1/policies")
def add_policy(body: NewPolicy):
    new_pol = {
        "id": f"pol-{len(security_policies)+1:03d}",
        "name": body.name,
        "enabled": True,
        "scope": body.scope,
        "enforcement": body.enforcement,
        "category": body.category,
        "violations": 0
    }
    security_policies.append(new_pol)
    _add_event("SYSTEM", f"New policy added: {body.name}", "INFO", "policy")
    return {"status": "ok", "policy": new_pol}

@app.post("/api/v1/policies/{policy_id}/toggle")
def toggle_policy(policy_id: str, body: PolicyToggle):
    for pol in security_policies:
        if pol["id"] == policy_id:
            pol["enabled"] = body.enabled
            action = "enabled" if body.enabled else "disabled"
            _add_event("SYSTEM", f"Policy {action}: {pol['name']}", "WARNING", "policy")
            return {"status": "ok", "policy": pol}
    raise HTTPException(status_code=404, detail="Policy not found")


# ═══════════════════════════════════════════════════════════════════
# Session Management
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/v1/sessions")
def get_sessions():
    now = time.time()
    sessions = []
    for sid, s in active_sessions.items():
        s_copy = dict(s)
        s_copy["duration_seconds"] = int(now - s["started"])
        s_copy["idle_seconds"] = int(now - s["last_activity"])
        sessions.append(s_copy)
    return sorted(sessions, key=lambda x: x["last_activity"], reverse=True)

@app.post("/api/v1/sessions/{agent_id}/kill")
def kill_session(agent_id: str):
    if agent_id in active_sessions:
        active_sessions[agent_id]["status"] = "killed"
        _add_event("SYSTEM", f"Session terminated: {agent_id}", "WARNING", "session")
        if agent_id in active_endpoints:
            del active_endpoints[agent_id]
        return {"status": "killed", "agent_id": agent_id}
    raise HTTPException(status_code=404, detail="Session not found")


# ═══════════════════════════════════════════════════════════════════
# Analytics (AI Behavioral Analysis)
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/v1/analytics/risk-summary")
def risk_summary():
    """Get risk distribution across all users."""
    users = []
    risk_levels = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for uid, u in managed_users.items():
        risk = _compute_behavioral_risk(u)
        if risk >= 0.8: risk_levels["critical"] += 1
        elif risk >= 0.5: risk_levels["high"] += 1
        elif risk >= 0.3: risk_levels["medium"] += 1
        else: risk_levels["low"] += 1
        users.append({"id": uid, "name": u["name"], "risk": risk, "role": u["role"]})
    
    return {
        "distribution": risk_levels,
        "users": sorted(users, key=lambda x: x["risk"], reverse=True),
        "total_users": len(managed_users),
        "total_threats": risk_levels["critical"] + risk_levels["high"],
    }

@app.get("/api/v1/analytics/behavior/{user_id}")
def user_behavior(user_id: str):
    """Detailed behavioral analysis for a user."""
    if user_id not in managed_users:
        raise HTTPException(status_code=404, detail="User not found")
    u = managed_users[user_id]
    baseline = u["behavioral_baseline"]
    
    return {
        "user_id": user_id,
        "name": u["name"],
        "risk_score": _compute_behavioral_risk(u),
        "anomalies": {
            "file_access": {
                "current": u["files_accessed_today"],
                "baseline": baseline["avg_files"],
                "deviation": round((u["files_accessed_today"] - baseline["avg_files"]) / max(baseline["avg_files"], 1) * 100, 1),
                "flagged": u["files_accessed_today"] > baseline["avg_files"] * 2,
            },
            "login_activity": {
                "current": u["login_count_today"],
                "baseline": baseline["avg_logins"],
                "failed": u["failed_logins_today"],
                "flagged": u["login_count_today"] > baseline["avg_logins"] * 2 or u["failed_logins_today"] >= 3,
            },
            "after_hours": {
                "detected": u["after_hours_activity"],
                "flagged": u["after_hours_activity"],
            },
            "usb_attempts": {
                "count": u["usb_attempts"],
                "flagged": u["usb_attempts"] > 0,
            },
            "mfa_status": {
                "enabled": u["mfa"],
                "flagged": not u["mfa"],
            },
        },
    }


# ═══════════════════════════════════════════════════════════════════
# Graph / Anomaly Data (existing endpoints)
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/anomalies")
def get_anomalies(model: str = "isolation_forest", min_score: float = 0.0):
    try:
        df, _ = load_dataset()
        df_filtered = df[df[model] >= min_score].copy()
        df_sorted = df_filtered.sort_values(model, ascending=False).head(100)
        df_sorted = df_sorted.where(pd.notnull(df_sorted), None)
        return {
            "total": len(df),
            "anomalies": len(df[df[model] > 1.5]),
            "red_team_flags": int(df['is_red_team'].sum()),
            "data": df_sorted.to_dict(orient="records")
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/graph")
def get_graph():
    try:
        attrs = global_attrs
        G = nx.Graph()
            
        for u, f in live_graph_edges:
            G.add_edge(u, f, type='access')
        
        # Return all nodes instead of filtering
        nodes = []
        for n in G.nodes():
            n_type = "user" if n in attrs else "file"
            risk = attrs[n]['anomaly'] if n in attrs else 0
            is_red = bool(attrs[n]['red_team']) if n in attrs else False
            nodes.append({
                "id": str(n), "label": str(n), "type": n_type,
                "risk": risk, "is_red": is_red
            })
        edges = [{"source": str(u), "target": str(v)} for u, v in G.edges()]
        return {"nodes": nodes, "links": edges}
    except Exception as e:
        return {"error": str(e)}

# ═══════════════════════════════════════════════════════════════════
# SIEM Policy Enforcement Engine
# ═══════════════════════════════════════════════════════════════════
def is_policy_enabled(pol_id):
    # Disable pol-008 by default to prevent mass lockout during fast simulation
    if pol_id == "pol-008": return False
    for p in security_policies:
        if p["id"] == pol_id: return p["enabled"]
    return False

def add_violation(pol_id):
    for p in security_policies:
        if p["id"] == pol_id: p["violations"] += 1

def siem_policy_engine():
    while True:
        time.sleep(5)
        
        # pol-006: QPC Rotation
        if is_policy_enabled("pol-006"):
            if int(time.time()) % 60 < 5:
                # Add event occasionally
                if not any(e["message"].startswith("QPC Quantum-Safe") and time.time() - e["time"] < 60 for e in live_events):
                    _add_event("SYSTEM", "QPC Quantum-Safe keys successfully rotated", "INFO", "Cryptography")
                
        # Evaluate Users
        for uid, u in managed_users.items():
            if u["status"] in ["locked", "revoked"]: continue
            
            # pol-003 USB Restriction
            if is_policy_enabled("pol-003") and u.get("usb_attempts", 0) > 0:
                u["status"] = "locked"
                add_violation("pol-003")
                _add_event("SIEM", f"pol-003 Violation: {u['name']} locked due to USB access.", "CRITICAL", "Data Protection")
                continue
                
            # pol-004 After Hours
            if is_policy_enabled("pol-004") and u.get("after_hours_activity"):
                if random.random() < 0.05:
                    add_violation("pol-004")
                    _add_event("SIEM", f"pol-004 Alert: {u['name']} active after hours.", "WARNING", "Behavior")
            
            # pol-005 MFA
            if is_policy_enabled("pol-005") and not u.get("mfa"):
                if random.random() < 0.2:
                    u["mfa"] = True
                    add_violation("pol-005")
                    _add_event("SIEM", f"pol-005 Enforcement: Forced MFA for {u['name']}.", "INFO", "Authentication")
            
            # pol-008 Excessive files
            baseline_files = u.get("behavioral_baseline", {}).get("avg_files", 10)
            if is_policy_enabled("pol-008") and u.get("files_accessed_today", 0) > (baseline_files * 3):
                u["status"] = "locked"
                add_violation("pol-008")
                _add_event("SIEM", f"pol-008 Violation: {u['name']} locked for massive file access.", "CRITICAL", "Behavior")
                continue
            
            # pol-009 Failed Logins
            if is_policy_enabled("pol-009") and u.get("failed_logins_today", 0) >= 5:
                u["status"] = "locked"
                add_violation("pol-009")
                _add_event("SIEM", f"pol-009 Violation: {u['name']} locked (failed logins).", "CRITICAL", "Authentication")
                continue

        # Evaluate Sessions
        for sid, s in list(active_sessions.items()):
            if s["status"] != "active": continue
            # pol-007 Data Exfiltration
            if is_policy_enabled("pol-007") and s["bytes_transferred"] > 5000000: # 5MB limit for fast simulation
                s["status"] = "killed"
                if s["agent_id"] in active_endpoints:
                    active_endpoints[s["agent_id"]]["status"] = "LOCKED"
                add_violation("pol-007")
                _add_event("SIEM", f"pol-007 Violation: Killed session {sid} (Data Exfiltration >1MB).", "CRITICAL", "Data Protection")

def autonomous_telemetry_simulator():
    """Runs continuously in the background to simulate live user behavior from ACTUAL dataset logs."""
    log_index = 0
    total_logs = len(initial_file_access) if initial_file_access is not None else 0
    
    # Pre-seed graph with some edges so it's not totally empty on boot
    for i in range(min(50, total_logs)):
        u = str(initial_file_access.iloc[i]['user'])
        f = str(initial_file_access.iloc[i]['file'])
        live_graph_edges.append((u, f))
    
    while True:
        time.sleep(1.0) # Tick every 1.0 second (one by one clearly)
        
        # Decay stats slightly every tick to create a moving average (prevents infinite accumulation)
        for u in managed_users.values():
            u["files_accessed_today"] = int(u.get("files_accessed_today", 0) * 0.999)
            u["login_count_today"] = int(u.get("login_count_today", 0) * 0.999)
            u["failed_logins_today"] = int(u.get("failed_logins_today", 0) * 0.999)
            
        for s in active_sessions.values():
            if s["status"] == "active":
                s["bytes_transferred"] = int(s.get("bytes_transferred", 0) * 0.9)

        # Play back 1 real file access log per tick to create a clear one-by-one real-time environment
        for _ in range(1):
            if log_index >= total_logs: 
                log_index = 0 # loop dataset if we reach the end
                
            row = initial_file_access.iloc[log_index]
            uid = str(row['user'])
            filename = str(row['file'])
            access_time = row['access_time'] # This gives us a real timestamp
            
            # Extract hour from real access time
            hour = access_time.hour
            after_hours = hour < 8 or hour >= 18
            
            # Fire real file log
            ingest_cert_log(CertEvent(user_id=uid, event_type="file", action="Access", details=filename))
            
            user = managed_users.get(uid)
            if user:
                is_red = user['role'] == "Insider Threat"
                
                # Make sure the user is marked as "online" in endpoints if they just did something
                ep_id = f"ep-{uid}"
                if ep_id not in active_endpoints:
                    active_endpoints[ep_id] = {
                        "agent_id": ep_id,
                        "timestamp": time.time(),
                        "cpu": random.randint(10, 80),
                        "ram": random.randint(20, 90),
                        "net_conns": random.randint(5, 50),
                        "risk_score": user["risk_score"],
                        "status": "SECURE",
                        "last_seen": time.time()
                    }
                
                # Contextual generation based on dataset logs to flesh out the environment
                if random.random() < 0.1:
                    ingest_cert_log(CertEvent(user_id=uid, event_type="email", action="Send", details="internal@company.com"))
                if random.random() < 0.05:
                    ingest_cert_log(CertEvent(user_id=uid, event_type="logon", action="Logon", details="Workstation"))
                if after_hours and is_red and random.random() < 0.2:
                    ingest_cert_log(CertEvent(user_id=uid, event_type="usb", action="Connect", details="SanDisk Cruzer"))
            
            # Update Active Sessions randomly for active users
            ep_id = f"ep-{uid}"
            if ep_id not in active_sessions:
                active_sessions[ep_id] = {
                    "id": f"sess-{len(active_sessions)+1:04d}",
                    "agent_id": ep_id,
                    "started": time.time(),
                    "last_activity": time.time(),
                    "status": "active",
                    "protocol": "QPC-AES-256",
                    "bytes_transferred": 0,
                }
            active_sessions[ep_id]["last_activity"] = time.time()
            active_sessions[ep_id]["bytes_transferred"] += random.randint(1024, 65536)
            
            log_index += 1
            
        # Update CPU/RAM for all endpoints to simulate live machines, and randomly drop endpoints to offline
        for ep_id, ep in active_endpoints.items():
            if ep["status"] != "LOCKED":
                # Randomly fluctuate endpoints online/offline
                if random.random() < 0.02:
                    ep["status"] = "OFFLINE"
                elif random.random() < 0.05 and ep["status"] == "OFFLINE":
                    ep["status"] = "SECURE"
                    
                if ep["status"] != "OFFLINE":
                    ep["cpu"] = max(5, min(95, ep["cpu"] + random.randint(-10, 10)))
                    ep["ram"] = max(20, min(90, ep["ram"] + random.randint(-5, 5)))
                ep["last_seen"] = time.time()
                
                # Link AI Behavioral Risk to Device Risk directly!
                uid = ep_id.replace("ep-", "")
                if uid in managed_users:
                    ep["risk_score"] = managed_users[uid]["risk_score"]

# Start SIEM and Simulation engines
threading.Thread(target=siem_policy_engine, daemon=True).start()
threading.Thread(target=autonomous_telemetry_simulator, daemon=True).start()


