#!/usr/bin/env python3
"""編集指示書（EDL JSON）から動画を書き出す。素材は事前に結合しない。

使い方:
  python3 render.py plan   edit.json            # 指示書の検証と全体像の表示
  python3 render.py render edit.json out.mp4    # 書き出し（エンコードは1回だけ）
"""
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


def render(edl_path, out_path):
    edl, sources, clips = load(edl_path)
    w, h, fps = edl.get("size", [1920, 1080]) + [edl.get("fps", 30)]
    names = list(sources)
    cmd = ["ffmpeg", "-y", "-v", "error"]
    for n in names:
        cmd += ["-i", str(sources[n]["path"])]
    filters, labels = [], []
    for i, c in enumerate(clips):
        k, s = names.index(c["source"]), sources[c["source"]]
        d = c["out"] - c["in"]
        trc = (s["video"] or {}).get("color_transfer")
        tone = f"{tonemap_filter(trc)}," if trc in HDR_TRANSFERS else ""
        filters.append(
            f"[{k}:v]trim={c['in']}:{c['out']},setpts=PTS-STARTPTS,"
            f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
            f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,{tone}fps={fps},format=yuv420p[v{i}]")
        if s["has_audio"]:
            filters.append(
                f"[{k}:a]atrim={c['in']}:{c['out']},asetpts=PTS-STARTPTS,"
                f"aresample=48000,aformat=channel_layouts=stereo[a{i}]")
        else:
            filters.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{d}[a{i}]")
        labels.append(f"[v{i}][a{i}]")
    filters.append(f"{''.join(labels)}concat=n={len(clips)}:v=1:a=1[v][a]")
    cmd += ["-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", str(out_path)]
    subprocess.run(cmd, check=True)
    print(f"書き出し完了: {out_path}")


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "plan":
        plan(sys.argv[2])
    elif len(sys.argv) == 4 and sys.argv[1] == "render":
        render(sys.argv[2], sys.argv[3])
    else:
        print(__doc__)
        sys.exit(1)
