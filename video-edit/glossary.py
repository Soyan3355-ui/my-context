"""用語辞書（ちいかわ株式会社 Notion「用語辞書」と同じ列）で文字起こしを直す。

辞書の形式（JSON配列 または CSV。列名は Notion の用語辞書と同じ）:
  用語 / 言い間違いパターン（カンマ区切り）/ 区分 / 状態（確定・要確認）/ 追加元 / 出典・メモ
- 自動で直すのは「確定」の用語だけ。「要確認」は直さず、候補として報告する。
- Notion につながらなくても、手元の辞書ファイルだけで動く（あとで同期する）。
"""
import csv
import json
import re
from pathlib import Path

SPLIT = re.compile(r"[,、，]")


def load(path):
    p = Path(path)
    if p.suffix.lower() == ".csv":
        with p.open(encoding="utf-8-sig", newline="") as f:
            rows = list(csv.DictReader(f))
    else:
        rows = json.loads(p.read_text(encoding="utf-8"))
    entries = []
    for r in rows:
        term = (r.get("用語") or "").strip()
        if not term:
            continue
        pats = [x.strip() for x in SPLIT.split(r.get("言い間違いパターン") or "") if x.strip()]
        entries.append({"term": term, "patterns": [x for x in pats if x != term],
                        "status": (r.get("状態") or "").strip(), "category": r.get("区分", "")})
    return entries


def hotwords(entries, limit=200):
    """Whisperに渡して、正しい表記が出やすくするための語。"""
    return " ".join(e["term"] for e in entries[:limit])


def _inside_term(text, start, end, term):
    """この範囲が、すでに正しい用語（term）の一部になっているか。"""
    i = text.find(term)
    while i != -1:
        if i <= start and end <= i + len(term):
            return True
        i = text.find(term, i + 1)
    return False


def correct_text(text, entries):
    """(直した文, [{term, wrong, count}], [要確認の候補]) を返す。"""
    fixes, suggestions = [], []
    pairs = sorted(((w, e) for e in entries for w in e["patterns"]), key=lambda x: -len(x[0]))
    for wrong, e in pairs:
        out, last, n = [], 0, 0
        for m in re.finditer(re.escape(wrong), text):
            if m.start() < last or _inside_term(text, m.start(), m.end(), e["term"]):
                continue
            if e["status"] != "確定":
                suggestions.append({"term": e["term"], "wrong": wrong})
                continue
            out += [text[last:m.start()], e["term"]]
            last, n = m.end(), n + 1
        if n:
            text = "".join(out) + text[last:]
            fixes.append({"term": e["term"], "wrong": wrong, "count": n})
    return text, fixes, suggestions


def correct_transcript(transcript, entries):
    """文字起こし1本を直す。直した内容の一覧も返す。"""
    segs, fixes, suggestions = [], [], []
    for s in transcript["segments"]:
        text, f, sug = correct_text(s["text"], entries)
        segs.append({**s, "text": text})
        fixes += [{**x, "source": transcript["source"], "segment": s["i"]} for x in f]
        suggestions += [{**x, "source": transcript["source"], "segment": s["i"]} for x in sug]
    return {**transcript, "segments": segs}, fixes, suggestions
