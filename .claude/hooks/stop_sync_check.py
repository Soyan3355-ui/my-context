#!/usr/bin/env python3
"""Stop: 仕事の作業をしたのに Notion と同期していなければ、1セッション1回だけ /notion-sync を促す。"""
import json
import os
import sys

MIN_TOOL_USES = 8  # これ未満の短いやり取りでは促さない

root = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
state_dir = os.path.join(root, ".claude", "state")

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)

if payload.get("stop_hook_active"):
    sys.exit(0)

session_id = payload.get("session_id", "unknown")
reminded = os.path.join(state_dir, f"session_{session_id}.reminded")
if os.path.exists(reminded):
    sys.exit(0)

start_file = os.path.join(state_dir, f"session_{session_id}.start")
marker = os.path.join(state_dir, "last_notion_sync")
try:
    started = int(open(start_file).read().strip())
except Exception:
    started = 0
try:
    synced = int(open(marker).read().strip())
except Exception:
    synced = 0
if synced >= started > 0:
    sys.exit(0)

tool_uses = 0
touched_work = False
transcript = payload.get("transcript_path")
if transcript and os.path.exists(transcript):
    with open(transcript, encoding="utf-8", errors="ignore") as f:
        for line in f:
            tool_uses += line.count('"type":"tool_use"') + line.count('"type": "tool_use"')
            if any(k in line for k in ("notion-update-page", "notion-create-pages", '"name":"Edit"', '"name":"Write"')):
                touched_work = True

if tool_uses < MIN_TOOL_USES and not touched_work:
    sys.exit(0)

os.makedirs(state_dir, exist_ok=True)
open(reminded, "w").close()

print(json.dumps({
    "decision": "block",
    "reason": (
        "このセッションではまだ Notion と同期していません。仕事の情報（決定事項・タスク・数字・日付）が"
        "出ていれば /notion-sync スキルの手順で Notion に反映してください。"
        "雑談や試行だけで反映するものがなければ、`mkdir -p .claude/state && date +%s > .claude/state/last_notion_sync` を実行して"
        "一言そう伝えるだけで構いません。"
    ),
}, ensure_ascii=False))
