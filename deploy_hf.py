from huggingface_hub import HfApi
api = HfApi()

username = api.whoami()["name"]
repo_id = f"{username}/vortex-siem-backend"

print(f"Deploying to existing space {repo_id}...")

print("Uploading files to space...")
api.upload_folder(
    folder_path="backend_hf",
    repo_id=repo_id,
    repo_type="space",
    commit_message="Deploy backend"
)

print(f"Deployed successfully to: https://huggingface.co/spaces/{repo_id}")
