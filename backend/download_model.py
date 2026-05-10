from huggingface_hub import snapshot_download
import os

repo_id = "MoritzLaurer/DeBERTa-v3-xsmall-mnli-xnli"

try:
    print(f"Downloading {repo_id}...")
    local_dir = snapshot_download(
        repo_id=repo_id, 
        token=False, 
        local_files_only=False
    )
    print(f"✅ Success. The model is cached into {local_dir}")
except Exception as e:
    print(f"❌ Fail: {e}")