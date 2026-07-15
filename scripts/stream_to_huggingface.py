"""
Stream-upload the entire CMU CERT Insider Threat Test Dataset (14 files, ~95 GB total)
directly from Figshare to Hugging Face -- without permanently saving anything to local disk.

For very large files (>2 GB), uses a temporary file that is deleted immediately after upload.
For smaller files, buffers entirely in memory via BytesIO.

Usage:
    python scripts/stream_to_huggingface.py
"""

import io
import os
import sys
import tempfile
import time
import requests
from huggingface_hub import HfApi, create_repo

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
HF_TOKEN = os.environ.get("HF_TOKEN")
if not HF_TOKEN:
    print("[-] Set the HF_TOKEN environment variable before running this script.")
    sys.exit(1)

# Threshold: files larger than this are spooled to a temp file (deleted after upload).
# Files smaller than this are kept entirely in RAM.
MEM_THRESHOLD = 500 * 1024 * 1024  # 500 MB

# All 14 files from https://kilthub.cmu.edu/articles/dataset/Insider_Threat_Test_Dataset/12841247
# Source: Figshare REST API  (GET /v2/articles/12841247/files)
FIGSHARE_FILES = [
    # -- Text / metadata --
    {"name": "SEI_Insider_README.txt",   "size":        1_446, "url": "https://ndownloader.figshare.com/files/24860765"},
    {"name": "CHECKSUMS-sha256.txt",     "size":          868, "url": "https://ndownloader.figshare.com/files/24857831"},
    {"name": "CHECKSUMS-sha1.txt",       "size":          604, "url": "https://ndownloader.figshare.com/files/24857837"},
    # -- Answer key --
    {"name": "answers.tar.bz2",          "size":    1_254_678, "url": "https://ndownloader.figshare.com/files/24857828"},
    # -- Dataset releases --
    {"name": "r1.tar.bz2",    "size":    87_541_633, "url": "https://ndownloader.figshare.com/files/24857825"},
    {"name": "r2.tar.bz2",    "size": 8_655_227_129, "url": "https://ndownloader.figshare.com/files/24852656"},
    {"name": "r3.1.tar.bz2",  "size": 4_249_740_376, "url": "https://ndownloader.figshare.com/files/24857777"},
    {"name": "r3.2.tar.bz2",  "size": 4_285_343_561, "url": "https://ndownloader.figshare.com/files/24856979"},
    {"name": "r4.1.tar.bz2",  "size": 5_018_970_347, "url": "https://ndownloader.figshare.com/files/24855644"},
    {"name": "r4.2.tar.bz2",  "size": 4_824_287_500, "url": "https://ndownloader.figshare.com/files/24856766"},
    {"name": "r5.1.tar.bz2",  "size":11_236_061_031, "url": "https://ndownloader.figshare.com/files/24849308"},
    {"name": "r5.2.tar.bz2",  "size":11_137_370_937, "url": "https://ndownloader.figshare.com/files/24849938"},
    {"name": "r6.1.tar.bz2",  "size":20_360_461_443, "url": "https://ndownloader.figshare.com/files/24848018"},
    {"name": "r6.2.tar.bz2",  "size":23_811_144_737, "url": "https://ndownloader.figshare.com/files/24844280"},
]

CHUNK_SIZE = 64 * 1024  # 64 KB read chunks


def _human_size(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(n) < 1024:
            return f"{n:.2f} {unit}"
        n /= 1024
    return f"{n:.2f} PB"


def _download_to_buffer(url: str, size: int, name: str):
    """Download a file and return an open file-like object (BytesIO or temp file).
    
    The caller is responsible for closing / cleaning up.
    """
    use_tempfile = size > MEM_THRESHOLD

    with requests.get(url, stream=True, timeout=120) as resp:
        resp.raise_for_status()

        if use_tempfile:
            buf = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{name}")
        else:
            buf = io.BytesIO()

        downloaded = 0
        last_report = 0
        for chunk in resp.iter_content(chunk_size=CHUNK_SIZE):
            buf.write(chunk)
            downloaded += len(chunk)
            # Progress every 500 MB for large files
            if use_tempfile and downloaded - last_report > 500 * 1024 * 1024:
                pct = downloaded / size * 100 if size else 0
                print(f"      ... downloaded {_human_size(downloaded)} / {_human_size(size)} ({pct:.0f}%)", flush=True)
                last_report = downloaded

    buf.seek(0)
    return buf, use_tempfile


def main():
    api = HfApi()

    # -- Authenticate --
    try:
        user_info = api.whoami(token=HF_TOKEN)
        username = user_info["name"]
    except Exception as exc:
        print(f"[-] Authentication failed: {exc}")
        sys.exit(1)

    repo_id = f"{username}/cmu-cert-insider-threat"
    print(f"[*] Authenticated as: {username}")
    print(f"[*] Target repository: {repo_id}")
    print(f"[*] Total files to upload: {len(FIGSHARE_FILES)}")
    total_bytes = sum(f["size"] for f in FIGSHARE_FILES)
    print(f"[*] Total dataset size: {_human_size(total_bytes)}")
    print()

    # -- Create (or reuse) repository --
    try:
        create_repo(
            repo_id,
            token=HF_TOKEN,
            repo_type="dataset",
            exist_ok=True,
            private=True,
        )
        print(f"[+] Repository ready: https://huggingface.co/datasets/{repo_id}")
    except Exception as exc:
        print(f"[-] Could not create repo: {exc}")
        sys.exit(1)

    # -- Check what is already uploaded (resume support) --
    try:
        existing = set(api.list_repo_files(repo_id, repo_type="dataset", token=HF_TOKEN))
    except Exception:
        existing = set()

    # -- Stream each file --
    uploaded = 0
    skipped  = 0
    failed   = 0

    for idx, entry in enumerate(FIGSHARE_FILES, 1):
        name = entry["name"]
        size = entry["size"]
        url  = entry["url"]

        tag = f"[{idx}/{len(FIGSHARE_FILES)}]"

        # Skip if already uploaded
        if name in existing:
            print(f"{tag} SKIP  {name} (already on HF)")
            skipped += 1
            continue

        print(f"{tag} Downloading {name} ({_human_size(size)}) ...", flush=True)
        t0 = time.time()

        buf = None
        tmp_path = None
        try:
            buf, is_tmp = _download_to_buffer(url, size, name)
            if is_tmp:
                tmp_path = buf.name
                buf.close()  # Must close before passing path to HF

            dl_time = time.time() - t0
            print(f"      Downloaded in {dl_time:.0f}s. Uploading to HuggingFace ...", flush=True)

            # For temp files, pass the path string; for BytesIO, pass the buffer
            upload_target = tmp_path if is_tmp else buf

            api.upload_file(
                path_or_fileobj=upload_target,
                path_in_repo=name,
                repo_id=repo_id,
                repo_type="dataset",
                token=HF_TOKEN,
                commit_message=f"Add {name} ({_human_size(size)})",
            )

            elapsed = time.time() - t0
            speed = size / elapsed if elapsed > 0 else 0
            print(f"      [OK] Done in {elapsed:.0f}s ({_human_size(speed)}/s)")
            uploaded += 1

        except Exception as exc:
            elapsed = time.time() - t0
            print(f"      [FAIL] after {elapsed:.0f}s -- {exc}")
            failed += 1

        finally:
            if buf and not buf.closed:
                buf.close()
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # -- Summary --
    print()
    print("=" * 60)
    print(f"  Uploaded : {uploaded}")
    print(f"  Skipped  : {skipped}  (already present)")
    print(f"  Failed   : {failed}")
    print(f"  Repo URL : https://huggingface.co/datasets/{repo_id}")
    print("=" * 60)

    if failed:
        print("\n[!] Re-run this script to retry failed uploads (it will skip successes).")
        sys.exit(1)


if __name__ == "__main__":
    main()
