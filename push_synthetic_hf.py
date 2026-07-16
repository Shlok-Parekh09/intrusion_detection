from huggingface_hub import HfApi
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Try Kaggle Secrets first, then environment variable
try:
    from kaggle_secrets import UserSecretsClient
    HF_TOKEN = UserSecretsClient().get_secret("HF_TOKEN")
except Exception:
    HF_TOKEN = os.environ.get("HF_TOKEN", "")

if not HF_TOKEN:
    print("[-] Set the HF_TOKEN environment variable or Kaggle secret before running.")
    sys.exit(1)

api = HfApi(token=HF_TOKEN)

username = api.whoami()["name"]
repo_id = f"{username}/cmu-cert-insider-threat"

print(f"Uploading files to dataset {repo_id}...")
api.upload_folder(
    folder_path="cert_synthetic",
    repo_id=repo_id,
    repo_type="dataset",
    commit_message="Add 1000-user synthetic dataset (features and scores)"
)
print("Uploaded successfully!")
