"""Notion APIへの書き込み（標準ライブラリのみ）。"""
import json
import os
import time
import urllib.request

API = "https://api.notion.com/v1"
VERSION = "2022-06-28"


def _call(method: str, path: str, payload: dict | None = None) -> dict:
    req = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={
            "Authorization": f"Bearer {os.environ['NOTION_TOKEN']}",
            "Notion-Version": VERSION,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as res:
        return json.load(res)


def _text(s: str) -> list[dict]:
    # Notionのrich_textは1要素2000文字まで
    return [{"text": {"content": s[i : i + 2000]}} for i in range(0, max(len(s), 1), 2000)]


def create_database(parent_page_id: str, title: str = "LINE仕事ログ") -> str:
    db = _call("POST", "/databases", {
        "parent": {"type": "page_id", "page_id": parent_page_id},
        "title": [{"text": {"content": title}}],
        "properties": {
            "概要": {"title": {}},
            "トーク名": {"select": {}},
            "送信者": {"select": {}},
            "日時": {"date": {}},
            "本文": {"rich_text": {}},
            "ID": {"rich_text": {}},
        },
    })
    return db["id"]


def add_message(database_id: str, m) -> None:
    first = m.body.split("\n")[0]
    _call("POST", "/pages", {
        "parent": {"database_id": database_id},
        "properties": {
            "概要": {"title": _text(first[:60])},
            "トーク名": {"select": {"name": m.talk[:100]}},
            "送信者": {"select": {"name": (m.sender or "不明")[:100]}},
            "日時": {"date": {"start": m.sent_at.isoformat() + "+09:00"}},
            "本文": {"rich_text": _text(m.body)},
            "ID": {"rich_text": _text(m.uid)},
        },
    })
    time.sleep(0.35)  # Notionのレート制限（約3件/秒）対策
