from huggingface_hub import HfApi
api = HfApi()

username = api.whoami()["name"]
repo_id = f"{username}/vortex-siem-backend"

print(f"Creating space {repo_id}...")
api.create_repo(repo_id=repo_id, repo_type="space", space_sdk="gradio", exist_ok=True)

print("Uploading files to space...")
api.upload_folder(
    folder_path="backend_hf",
    repo_id=repo_id,
    repo_type="space",
    commit_message="Deploy backend"
)

print(f"Deployed successfully to: https://huggingface.co/spaces/{repo_id}")
