"""使い方:
  export NOTION_TOKEN=secret_xxx
  python3 main.py create-db <親ページID>          # 最初に1回だけ
  python3 main.py sync <トーク履歴.txt> <DB ID>   # 取り込み（重複は自動スキップ）
  python3 main.py dry-run <トーク履歴.txt>        # Notionに送らず解析結果だけ確認
"""
import json
import sys
from pathlib import Path

from parser import parse

STATE = Path.home() / ".line_to_notion_state.json"


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 1
    cmd = argv[1]
    if cmd == "create-db":
        import notion_sync
        print("データベースID:", notion_sync.create_database(argv[2]))
    elif cmd == "dry-run":
        msgs = parse(Path(argv[2]).read_text(encoding="utf-8"))
        print(f"{len(msgs)}件を解析")
        for m in msgs[:10]:
            print(m.sent_at, m.sender, m.body.replace("\n", " / ")[:40])
    elif cmd == "sync":
        import notion_sync
        msgs = parse(Path(argv[2]).read_text(encoding="utf-8"))
        done = set(json.loads(STATE.read_text())) if STATE.exists() else set()
        new = [m for m in msgs if m.uid not in done]
        print(f"全{len(msgs)}件中、新規{len(new)}件を送信")
        for m in new:
            notion_sync.add_message(argv[3], m)
            done.add(m.uid)
            STATE.write_text(json.dumps(sorted(done)))  # 途中で止まっても続きから再開できる
        print("完了")
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
