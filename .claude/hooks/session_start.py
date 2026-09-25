#!/usr/bin/env python3
"""SessionStart: セッション開始時刻を記録し、Notion 同期ログの確認を促す。"""
import json
import os
import sys
import time

root = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
state_dir = os.path.join(root, ".claude", "state")
os.makedirs(state_dir, exist_ok=True)

try:
    payload = json.load(sys.stdin)
except Exception:
    payload = {}

session_id = payload.get("session_id", "unknown")
with open(os.path.join(state_dir, f"session_{session_id}.start"), "w") as f:
    f.write(str(int(time.time())))

print(
    "[Notion同期] このリポジトリは Notion と相互同期しています（notion-map.md 参照）。\n"
    "最初の返答の前に、Notion の同期ログ DB（collection://3eccf6f0-8494-46b8-a01c-2247a3ad3261）で"
    "ステータスが「未処理」「要確認あり」の行だけを軽く確認し、あればそーやんに一言伝えてください。"
    "他のAIから共有された内容はここに入っています。"
)
