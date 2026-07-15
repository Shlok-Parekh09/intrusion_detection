import time
import json
import psutil
import requests
import random
import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Config
SIEM_URL = "http://127.0.0.1:8000/api/v1/telemetry/ingest"
AGENT_ID = f"endpoint_{random.randint(1000, 9999)}"
POLL_INTERVAL = 5  # seconds

# ---------------------------------------------------------
# Quantum-Proof Cryptography (QPC) Simulator Layer
# AES-256 is mathematically considered quantum-safe against 
# Grover's algorithm for symmetric encryption.
# ---------------------------------------------------------
SHARED_QUANTUM_SAFE_KEY = b'12345678901234567890123456789012' # 256-bit key

def qpc_encrypt(payload_dict):
    aesgcm = AESGCM(SHARED_QUANTUM_SAFE_KEY)
    nonce = os.urandom(12)
    data = json.dumps(payload_dict).encode('utf-8')
    ct = aesgcm.encrypt(nonce, data, None)
    return base64.b64encode(nonce + ct).decode('utf-8')

def collect_telemetry():
    try:
        net_conns = len(psutil.net_connections())
    except psutil.AccessDenied:
        net_conns = 0

    return {
        "agent_id": AGENT_ID,
        "timestamp": time.time(),
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "ram_percent": psutil.virtual_memory().percent,
        "active_processes": len(psutil.pids()),
        "network_connections": net_conns,
        # Simulate insider threat features based on OS metrics
        "files_per_day": random.randint(0, 100),
        "usb_per_day": random.randint(0, 2),
        "is_red_team": False
    }

def run_agent():
    print(f"[*] Starting Endpoint Agent [{AGENT_ID}]")
    print("[*] Quantum-Proof Cryptography (QPC) channel established.")
    
    while True:
        try:
            telemetry = collect_telemetry()
            
            # Occasionally inject a simulated "Red Team" insider threat spike
            if random.random() < 0.05:
                telemetry["is_red_team"] = True
                telemetry["files_per_day"] = 5000
                telemetry["network_connections"] += 500
                print("[!] Insider Threat Behavior Simulated!")

            encrypted_payload = qpc_encrypt(telemetry)
            
            payload = {
                "agent_id": AGENT_ID,
                "qpc_payload": encrypted_payload
            }
            
            response = requests.post(SIEM_URL, json=payload)
            if response.status_code == 200:
                print(f"[+] Telemetry sent securely (Risk Score: {response.json().get('risk_score', 'N/A')})")
            else:
                print(f"[-] Failed to send telemetry: {response.status_code}")
                
        except Exception as e:
            print(f"[-] Error: {e}")
            
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    run_agent()
