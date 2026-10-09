#!/usr/bin/env python3
"""文字起こし → AIが編集案を作る → 指示書(EDL)へ変換、までをつなぐ。

流れ:
  1. transcribe  素材ごとに文字起こしを保存（faster-whisper。PC内で動く）
  2. prompt      文字起こしからAI（Claude Code等）への依頼文を作る
  3. （AIが proposal.json を書く。時刻ではなく「発話番号」で範囲を指定する）
  2b. correct    用語辞書で文字起こしの用語を直す（ちいかわ株式会社の用語辞書と同じ列）
  4. build       proposal.json と文字起こしから、render.py用の指示書を作る
  5. srt         指示書と文字起こしから、書き出し後の時刻に合わせた字幕(SRT)を作る
  6. record      「編集の記録」に書く1行を作り、送信待ちの箱（outbox）に積む
  （補助）silence 無音区間を検出する

AIに秒数を直接書かせず発話番号で指定させるのは、秒数の幻覚と、
単語の途中で切れる事故を防ぐため。秒数への変換と余白付けはスクリプトが行う。
"""
import argparse
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

import glossary

PAD_BEFORE, PAD_AFTER = 0.15, 0.25  # 発話の前後に付ける余白（秒）

PROPOSAL_SPEC = """\
{
  "chapters": [
    {"title": "章のタイトル", "ranges": [
      {"source": "A", "from": 3, "to": 12, "keep": true, "note": "理由を短く"},
      {"source": "A", "from": 13, "to": 15, "keep": false, "note": "言い直しなので省く"}
    ]}
  ]
}"""


def transcribe(args):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("faster-whisper が未導入です: pip install faster-whisper")
    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    hot = glossary.hotwords(glossary.load(args.glossary)) if args.glossary else None
    for media in args.media:
        name = Path(media).stem
        segs, info = model.transcribe(media, language=args.language, vad_filter=True, hotwords=hot)
        out = {"source": name, "path": str(media), "language": info.language,
               "segments": [{"i": i, "start": round(s.start, 2), "end": round(s.end, 2),
                             "text": s.text.strip()} for i, s in enumerate(segs)]}
        dest = Path(args.out) / f"{name}.transcript.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{dest}: {len(out['segments'])} 発話")


def correct(args):
    """用語辞書で文字起こしを直す。元ファイルは残し、*.corrected.json と corrections.json を作る。"""
    entries = glossary.load(args.glossary)
    all_fixes, all_sug = [], []
    for p in args.transcripts:
        t = json.loads(Path(p).read_text(encoding="utf-8"))
        fixed, fixes, sug = glossary.correct_transcript(t, entries)
        dest = Path(p).with_name(Path(p).name.replace(".transcript.json", ".corrected.json"))
        dest.write_text(json.dumps(fixed, ensure_ascii=False, indent=1), encoding="utf-8")
        all_fixes += fixes
        all_sug += sug
        print(f"{dest}: {sum(f['count'] for f in fixes)}か所を修正")
    Path(args.out).write_text(json.dumps({"fixes": all_fixes, "suggestions": all_sug,
                                          "total": sum(f["count"] for f in all_fixes)},
                                         ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"修正 {sum(f['count'] for f in all_fixes)}か所 / 要確認の候補 {len(all_sug)}件 → {args.out}")


def record(args):
    """ちいかわ株式会社の「編集の記録」に書く1行を作り、送信待ちの箱（outbox）に積む。
    映像・音声は含めず、タイトル・長さ・件数などの数字だけにする。"""
    import render
    edl, sources, clips = render.load(args.edl)
    raw = json.loads(Path(args.edl).read_text(encoding="utf-8"))["timeline"]
    outbox = Path(args.outbox)
    outbox.mkdir(parents=True, exist_ok=True)
    ledger = outbox / "records.jsonl"
    today = datetime.date.today().strftime("%Y%m%d")
    existing = [json.loads(x) for x in ledger.read_text(encoding="utf-8").splitlines()] if ledger.exists() else []
    seq = 1 + sum(1 for r in existing if str(r.get("動画番号", "")).startswith(f"V-{today}-"))
    fixes = 0
    if args.corrections:
        fixes = json.loads(Path(args.corrections).read_text(encoding="utf-8"))["total"]
    used = {c["source"] for c in clips}
    row = {
        "動画タイトル": args.title,
        "動画番号": args.number or f"V-{today}-{seq:02}",
        "状態": args.status,
        "元の長さ（分）": round(sum(sources[n]["duration"] for n in used) / 60, 1),
        "完成の長さ（分）": round(sum(c["out"] - c["in"] for c in clips) / 60, 1),
        "カットした数": sum(1 for c in raw if not c.get("keep", True)),
        "直した用語の数": fixes,
    }
    for key, val in (("撮影日", args.shot_date), ("編集完了日", args.done_date),
                     ("編集にかかった時間（分）", args.minutes), ("動画リンク", args.link), ("メモ", args.memo)):
        if val is not None:  # わかるものだけ書く
            row[key] = val
    with ledger.open("a", encoding="utf-8") as f:
        f.write(json.dumps({**row, "_sent": False}, ensure_ascii=False) + "\n")
    print(json.dumps(row, ensure_ascii=False, indent=1))
    print(f"送信待ちの箱に追加: {ledger}（Notionへの反映はまだ。内容を確認してから）", file=sys.stderr)


def load_transcripts(paths):
    return {t["source"]: t for t in (json.loads(Path(p).read_text(encoding="utf-8")) for p in paths)}


def prompt(args):
    tr = load_transcripts(args.transcripts)
    lines = [
        "以下は複数の動画素材の文字起こしです。視聴者に伝わる動画に編集するため、",
        "チャプター分けと、残す／省く範囲の案を作ってください。",
        "",
        "ルール:",
        "- 範囲は秒数ではなく発話番号（[番号]）で指定する。",
        "- 言い直し・言い淀み・本筋から外れた雑談は keep=false にして理由を note に書く。",
        "- 章は意味のまとまりごとに作り、タイトルは内容が分かる短い言葉にする。",
        "- 素材の順序は変えてよいが、話の流れが自然につながること。",
        f"- 出力は次の形式のJSONのみ。{args.proposal} に保存する。",
        "", PROPOSAL_SPEC, "",
    ]
    for name, t in tr.items():
        lines.append(f"## 素材 {name}")
        lines += [f"[{s['i']}] {s['start']:.1f}-{s['end']:.1f}s {s['text']}" for s in t["segments"]]
        lines.append("")
    Path(args.out).write_text("\n".join(lines), encoding="utf-8")
    print(f"依頼文を作成: {args.out}")


def build(args):
    tr = load_transcripts(args.transcripts)
    proposal = json.loads(Path(args.proposal).read_text(encoding="utf-8"))
    timeline, problems = [], []
    for ch in proposal["chapters"]:
        first = True
        for r in ch["ranges"]:
            t = tr.get(r["source"])
            if not t:
                problems.append(f"未知の素材: {r['source']}")
                continue
            segs = t["segments"]
            if not 0 <= r["from"] <= r["to"] < len(segs):
                problems.append(f"{ch['title']}: 発話番号が範囲外 {r['source']}[{r['from']}-{r['to']}] (0-{len(segs) - 1})")
                continue
            # 余白は付けるが、前後の発話（省く発話を含む）には食い込ませない
            lo = segs[r["from"] - 1]["end"] if r["from"] > 0 else 0.0
            hi = segs[r["to"] + 1]["start"] if r["to"] + 1 < len(segs) else float("inf")
            start = max(lo, segs[r["from"]]["start"] - PAD_BEFORE)
            end = min(hi, segs[r["to"]]["end"] + PAD_AFTER)
            clip = {"source": r["source"], "in": round(start, 2), "out": round(end, 2),
                    "keep": r.get("keep", True), "note": r.get("note", "")}
            if first and clip["keep"]:
                clip["chapter"] = ch["title"]
                first = False
            timeline.append(clip)
    if problems:
        sys.exit("提案に問題があります:\n- " + "\n- ".join(problems))
    base = Path(args.out).resolve().parent
    sources = {n: str(Path(t["path"]).resolve().relative_to(base, walk_up=True)) for n, t in tr.items()}
    edl = {"sources": sources, "size": [1920, 1080], "fps": 30, "timeline": timeline}
    Path(args.out).write_text(json.dumps(edl, ensure_ascii=False, indent=2), encoding="utf-8")
    kept = sum(c["out"] - c["in"] for c in timeline if c["keep"])
    print(f"指示書を作成: {args.out}（残す {kept:.1f}秒 / 区間 {len(timeline)}）")


def fmt_srt(t):
    ms = round(t * 1000)
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def srt(args):
    """指示書で残した区間に入る発話から、書き出し後の時刻に合わせた字幕(SRT)を作る。"""
    tr = load_transcripts(args.transcripts)
    edl = json.loads(Path(args.edl).read_text(encoding="utf-8"))
    out, offset, n = [], 0.0, 0
    for c in (c for c in edl["timeline"] if c.get("keep", True)):
        end = c.get("out", float("inf"))
        for s in tr[c["source"]]["segments"]:
            if s["start"] >= c["in"] - 0.01 and s["end"] <= end + 0.01 and s["text"]:
                n += 1
                out.append(f"{n}\n{fmt_srt(offset + s['start'] - c['in'])} --> "
                           f"{fmt_srt(offset + s['end'] - c['in'])}\n{s['text']}\n")
        offset += end - c["in"]
    Path(args.out).write_text("\n".join(out), encoding="utf-8")
    print(f"字幕を作成: {args.out}（{n}件）")


def silence(args):
    """無音区間を検出する。文字起こし前の粗いカット候補や、間の詰め処理に使える。"""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", args.media, "-vn",
                        "-af", f"silencedetect=noise={args.noise}:d={args.min}", "-f", "null", "-"],
                       capture_output=True, text=True, check=True)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [(float(a), float(b)) for a, b in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", r.stderr)]
    spans = [{"start": round(s, 2), "end": round(e, 2)} for s, (e, _) in zip(starts, ends)]
    print(json.dumps(spans, ensure_ascii=False, indent=1))
    print(f"無音 {len(spans)}か所 / 合計 {sum(x['end'] - x['start'] for x in spans):.1f}秒", file=sys.stderr)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    a = sp.add_parser("transcribe"); a.add_argument("media", nargs="+")
    a.add_argument("--out", default="transcripts"); a.add_argument("--model", default="small")
    a.add_argument("--language", default="ja"); a.add_argument("--glossary", help="用語辞書（JSON/CSV）。正しい表記が出やすくなる")
    a.set_defaults(fn=transcribe)
    f = sp.add_parser("correct"); f.add_argument("transcripts", nargs="+"); f.add_argument("--glossary", required=True)
    f.add_argument("--out", default="corrections.json"); f.set_defaults(fn=correct)
    g = sp.add_parser("record"); g.add_argument("edl"); g.add_argument("--title", required=True)
    g.add_argument("--status", default="編集中", choices=["編集中", "確認待ち", "完成", "公開"])
    g.add_argument("--number"); g.add_argument("--corrections"); g.add_argument("--outbox", default="outbox")
    g.add_argument("--shot-date"); g.add_argument("--done-date"); g.add_argument("--minutes", type=float)
    g.add_argument("--link"); g.add_argument("--memo"); g.set_defaults(fn=record)
    b = sp.add_parser("prompt"); b.add_argument("transcripts", nargs="+")
    b.add_argument("--out", default="prompt.md"); b.add_argument("--proposal", default="proposal.json")
    b.set_defaults(fn=prompt)
    c = sp.add_parser("build"); c.add_argument("proposal"); c.add_argument("transcripts", nargs="+")
    c.add_argument("--out", default="edit.json"); c.set_defaults(fn=build)
    d = sp.add_parser("srt"); d.add_argument("edl"); d.add_argument("transcripts", nargs="+")
    d.add_argument("--out", default="subs.srt"); d.set_defaults(fn=srt)
    e = sp.add_parser("silence"); e.add_argument("media")
    e.add_argument("--noise", default="-35dB"); e.add_argument("--min", default="0.6")
    e.set_defaults(fn=silence)
    args = ap.parse_args(); args.fn(args)
