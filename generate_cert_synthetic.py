import pandas as pd
import numpy as np
import random
import os

def generate_synthetic_cert_data(num_users=1000, num_red_team=5, output_dir="cert_synthetic"):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Generate Users
    print(f"Generating {num_users} users...")
    users = [f"U{str(i).zfill(4)}" for i in range(1, num_users + 1)]
    
    # Select Red Team
    red_team_users = set(random.sample(users, num_red_team))
    
    # 2. Generate merged_features.csv
    print("Generating merged_features.csv...")
    features = []
    for u in users:
        is_red = 1 if u in red_team_users else 0
        
        # Base features
        login_count = np.random.normal(2, 0.5) if not is_red else np.random.normal(5, 2)
        email_count = np.random.normal(20, 5) if not is_red else np.random.normal(50, 20)
        file_count = np.random.normal(10, 3) if not is_red else np.random.normal(100, 50)
        after_hours = 0 if not is_red else np.random.choice([0, 1], p=[0.2, 0.8])
        
        features.append({
            "user": u,
            "login_count": max(0, int(login_count)),
            "email_count": max(0, int(email_count)),
            "file_count": max(0, int(file_count)),
            "after_hours": after_hours,
            "is_red_team_x": is_red
        })
    df_features = pd.DataFrame(features)
    df_features.to_csv(f"{output_dir}/merged_features.csv", index=False)
    
    # 3. Generate anomaly_scores.csv
    print("Generating anomaly_scores.csv...")
    scores = []
    for u in users:
        is_red = u in red_team_users
        
        iso_forest = np.random.uniform(0, 0.5) if not is_red else np.random.uniform(1.5, 3.0)
        oc_svm = np.random.uniform(0, 0.5) if not is_red else np.random.uniform(1.5, 3.0)
        autoenc = np.random.uniform(0, 0.5) if not is_red else np.random.uniform(1.5, 3.0)
        
        scores.append({
            "user": u,
            "isolation_forest": iso_forest,
            "oneclass_svm": oc_svm,
            "autoencoder": autoenc
        })
    df_scores = pd.DataFrame(scores)
    df_scores.to_csv(f"{output_dir}/anomaly_scores.csv", index=False)
    
    # 4. Generate file_access.csv (Edge list)
    print("Generating file_access.csv...")
    file_access = []
    # Create some shared files
    shared_files = [f"share_docs_{i}.pdf" for i in range(50)]
    for u in users:
        is_red = u in red_team_users
        num_files = int(np.random.normal(3, 1)) if not is_red else int(np.random.normal(15, 5))
        num_files = max(1, num_files)
        
        for _ in range(num_files):
            file_name = random.choice(shared_files) if random.random() < 0.3 else f"private_{u}_{random.randint(1,100)}.txt"
            file_access.append({
                "user": u,
                "file": file_name,
                "access_time": pd.Timestamp.now() - pd.Timedelta(days=random.randint(0, 30))
            })
    df_files = pd.DataFrame(file_access)
    df_files.to_csv(f"{output_dir}/file_access.csv", index=False)
    
    print("Done! Data generated in", output_dir)

if __name__ == "__main__":
    generate_synthetic_cert_data()
