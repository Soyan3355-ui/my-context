#!/usr/bin/env python3
"""編集指示書（EDL JSON）から動画を書き出す。素材は事前に結合しない。

使い方:
  python3 render.py plan   edit.json            # 指示書の検証と全体像の表示
  python3 render.py render edit.json out.mp4    # 書き出し（エンコードは1回だけ）
  python3 render.py render edit.json out.mp4 --preview            # 確認用の速い書き出し
  python3 render.py render edit.json out.mp4 --subs subs.srt      # 字幕を焼き込む
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_type,width,height,r_frame_rate,color_transfer",
         "-of", "json", str(path)],
        check=True, capture_output=True, text=True).stdout
    info = json.loads(out)
    streams = info["streams"]
    return {
        "duration": float(info["format"]["duration"]),
        "has_audio": any(s["codec_type"] == "audio" for s in streams),
        "video": next((s for s in streams if s["codec_type"] == "video"), None),
    }


HDR_TRANSFERS = {"smpte2084", "arib-std-b67"}  # PQ（HDR10/Dolby Vision系）, HLG（iPhone等）


def tonemap_filter(transfer):
    """HDR素材をBT.709のSDRへ。入力の色情報（タグ）が付いている前提。"""
    return (
        "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
        "tonemap=mobius:param=0.7:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")


def load(edl_path):
    edl = json.loads(Path(edl_path).read_text(encoding="utf-8"))
    base = Path(edl_path).parent
    sources = {}
    for name, rel in edl["sources"].items():
        p = (base / rel).resolve()
        sources[name] = {"path": p, **probe(p)}
    clips = [c for c in edl["timeline"] if c.get("keep", True)]
    for i, c in enumerate(clips):
        s = sources[c["source"]]
        c.setdefault("in", 0)
        end = c.get("out", s["duration"])
        if not 0 <= c["in"] < end <= s["duration"] + 0.05:
            raise SystemExit(f"clip {i}: 範囲が素材の長さ({s['duration']:.1f}s)に収まってないで: {c}")
        c["out"] = min(end, s["duration"])
    return edl, sources, clips


def plan(edl_path):
    edl, sources, clips = load(edl_path)
    t = 0.0
    for i, c in enumerate(clips):
        d = c["out"] - c["in"]
        trc = (sources[c["source"]]["video"] or {}).get("color_transfer")
        hdr = f" [HDR:{trc}→SDR変換]" if trc in HDR_TRANSFERS else ""
        print(f"{t:7.1f}s  [{c['source']}] {c['in']:.1f}-{c['out']:.1f}s ({d:.1f}s)  {c.get('chapter', '')}{hdr}")
        t += d
    print(f"合計 {t:.1f}s / 素材 {len(sources)}本（結合・変換はまだしてない）")


def srt_filter(srt_path):
    p = str(Path(srt_path).resolve()).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
    style = "FontName=IPAGothic,FontSize=22,Outline=2,MarginV=40"
    return f"subtitles=filename='{p}':force_style='{style}'"


def render(edl_path, out_path, preview=False, subs=None):
    edl, sources, clips = load(edl_path)
    w, h, fps = edl.get("size", [1920, 1080]) + [edl.get("fps", 30)]
    if preview:  # 確認用: 小さく・速く・粗く
        w, h = 640, 360
    cmd = ["ffmpeg", "-y", "-v", "error"]
    filters, labels = [], []
    for i, c in enumerate(clips):
        s = sources[c["source"]]
        d = c["out"] - c["in"]
        # 入力側でシークして、必要な区間だけを読む（長い素材でも頭から読み進めない）
        cmd += ["-ss", f"{c['in']}", "-t", f"{d}", "-i", str(s["path"])]
        trc = (s["video"] or {}).get("color_transfer")
        tone = f"{tonemap_filter(trc)}," if trc in HDR_TRANSFERS else ""
        filters.append(
            f"[{i}:v]setpts=PTS-STARTPTS,"
            f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
            f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,{tone}fps={fps},format=yuv420p[v{i}]")
        if s["has_audio"]:
            filters.append(
                f"[{i}:a]asetpts=PTS-STARTPTS,"
                f"aresample=48000,aformat=channel_layouts=stereo[a{i}]")
        else:
            filters.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{d}[a{i}]")
        labels.append(f"[v{i}][a{i}]")
    vlabel = "[v]"
    if subs:
        filters.append(f"{''.join(labels)}concat=n={len(clips)}:v=1:a=1[vc][a]")
        filters.append(f"[vc]{srt_filter(subs)}[v]")
    else:
        filters.append(f"{''.join(labels)}concat=n={len(clips)}:v=1:a=1[v][a]")
    preset, crf = ("ultrafast", "30") if preview else ("veryfast", "20")
    cmd += ["-filter_complex", ";".join(filters), "-map", vlabel, "-map", "[a]",
            "-c:v", "libx264", "-preset", preset, "-crf", crf,
            "-c:a", "aac", str(out_path)]
    subprocess.run(cmd, check=True)
    print(f"書き出し完了: {out_path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["plan", "render"])
    ap.add_argument("edl")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--preview", action="store_true", help="640x360・高速・低画質で書き出す")
    ap.add_argument("--subs", help="焼き込む字幕(SRT)。pipeline.py srt で作れる")
    a = ap.parse_args()
    if a.mode == "plan":
        plan(a.edl)
    elif a.out:
        render(a.edl, a.out, a.preview, a.subs)
    else:
        ap.error("render には出力ファイル名が必要です")
