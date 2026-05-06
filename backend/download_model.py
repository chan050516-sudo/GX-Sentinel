from huggingface_hub import snapshot_download
import os

# 定义模型 ID
repo_id = "MoritzLaurer/DeBERTa-v3-xsmall-mnli-xnli"

# 执行手动下载（显式禁用 Token）
try:
    print(f"正在下载模型 {repo_id}...")
    local_dir = snapshot_download(
        repo_id=repo_id, 
        token=False, 
        local_files_only=False
    )
    print(f"✅ 下载成功！模型已缓存至: {local_dir}")
except Exception as e:
    print(f"❌ 下载失败: {e}")