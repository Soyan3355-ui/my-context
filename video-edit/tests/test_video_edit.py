"""video-edit の自動テスト。合成素材をFFmpegで作って確かめる（外部素材は不要）。

実行: python3 -m unittest discover -s tests -v   （video-edit ディレクトリで）
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import render  # noqa: E402


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-v", "error", *args], check=True)


def duration(path):
    return render.probe(path)["duration"]


class Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.d = Path(cls.tmp.name)
        # 解像度・fps・音声の有無が違う3本
        ff("-f", "lavfi", "-i", "testsrc=size=640x360:rate=30:duration=10", "-f", "lavfi",
           "-i", "sine=f=440:duration=10", "-c:v", "libx264", "-c:a", "aac", str(cls.d / "A.mp4"))
        ff("-f", "lavfi", "-i", "testsrc2=size=960x540:rate=24:duration=20", "-f", "lavfi",
           "-i", "sine=f=660:duration=20", "-c:v", "libx264", "-c:a", "aac", str(cls.d / "B.mp4"))
        ff("-f", "lavfi", "-i", "smptebars=size=360x640:rate=60:duration=5", "-c:v", "libx264",
           str(cls.d / "C.mp4"))
        # HDR（PQ, BT.2020, 10bit）
        ff("-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=3,format=yuv420p", "-vf",
           "setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv,"
           "zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt2020:t=smpte2084:m=bt2020nc:r=tv,"
           "format=yuv420p10le", "-c:v", "libx265", "-x265-params",
           "log-level=error:colorprim=bt2020:transfer=smpte2084:colormatrix=bt2020nc",
           "-tag:v", "hvc1", str(cls.d / "H.mp4"))

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def edl(self, timeline, name="edit.json"):
        p = self.d / name
        p.write_text(json.dumps({
            "sources": {"A": "A.mp4", "B": "B.mp4", "C": "C.mp4", "H": "H.mp4"},
            "size": [640, 360], "fps": 30, "timeline": timeline}))
        return p


class RenderTest(Base):
    def test_mixed_sources_total_duration(self):
        p = self.edl([{"source": "A", "in": 0, "out": 4}, {"source": "B", "in": 5, "out": 12},
                      {"source": "C"}])
        out = self.d / "mixed.mp4"
        render.render(p, out)
        self.assertAlmostEqual(duration(out), 4 + 7 + 5, delta=0.2)
        v = render.probe(out)["video"]
        self.assertEqual((v["width"], v["height"]), (640, 360))
        self.assertTrue(render.probe(out)["has_audio"])  # 音声なしのCも無音で補われる

    def test_keep_false_is_skipped(self):
        p = self.edl([{"source": "A", "in": 0, "out": 4}, {"source": "A", "in": 4, "out": 9, "keep": False}])
        _, _, clips = render.load(p)
        self.assertEqual(len(clips), 1)

    def test_out_of_range_is_rejected(self):
        p = self.edl([{"source": "A", "in": 0, "out": 99}])
        with self.assertRaises(SystemExit):
            render.load(p)

    def test_hdr_is_tonemapped_to_sdr(self):
        self.assertEqual(render.probe(self.d / "H.mp4")["video"]["color_transfer"], "smpte2084")
        out = self.d / "hdr.mp4"
        render.render(self.edl([{"source": "H"}]), out)
        v = render.probe(out)["video"]
        self.assertEqual(v["color_transfer"], "bt709")

    def test_preview_is_small(self):
        out = self.d / "prev.mp4"
        render.render(self.edl([{"source": "A", "in": 0, "out": 3}]), out, preview=True)
        self.assertEqual(render.probe(out)["video"]["width"], 640)


class PipelineTest(Base):
    def run_pipeline(self, *args):
        return subprocess.run([sys.executable, str(ROOT / "pipeline.py"), *map(str, args)],
                              capture_output=True, text=True)

    def setUp(self):
        segs = [(0, 4, "導入"), (4, 7, "えーと"), (7, 12, "本題"), (12, 15, "言い直し"), (15, 20, "続き")]
        (self.d / "A.transcript.json").write_text(json.dumps({
            "source": "A", "path": "A.mp4", "language": "ja",
            "segments": [{"i": i, "start": s, "end": e, "text": t} for i, (s, e, t) in enumerate(segs)]},
            ensure_ascii=False))

    def proposal(self, ranges):
        p = self.d / "proposal.json"
        p.write_text(json.dumps({"chapters": [{"title": "章", "ranges": ranges}]}))
        return p

    def test_build_does_not_overlap_dropped_segments(self):
        p = self.proposal([{"source": "A", "from": 2, "to": 2}, {"source": "A", "from": 4, "to": 4}])
        r = self.run_pipeline("build", p, self.d / "A.transcript.json", "--out", self.d / "built.json")
        self.assertEqual(r.returncode, 0, r.stderr)
        tl = json.loads((self.d / "built.json").read_text())["timeline"]
        self.assertGreaterEqual(tl[0]["in"], 7.0)   # 省いた「えーと」(〜7.0s)に食い込まない
        self.assertLessEqual(tl[0]["out"], 12.0)    # 次の発話(12.0s〜)に食い込まない

    def test_build_rejects_bad_segment_index(self):
        p = self.proposal([{"source": "A", "from": 0, "to": 99}])
        r = self.run_pipeline("build", p, self.d / "A.transcript.json", "--out", self.d / "bad.json")
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("範囲外", r.stderr)

    def test_srt_times_follow_edited_timeline(self):
        p = self.proposal([{"source": "A", "from": 0, "to": 0}, {"source": "A", "from": 2, "to": 2},
                           {"source": "A", "from": 1, "to": 1, "keep": False}])
        self.run_pipeline("build", p, self.d / "A.transcript.json", "--out", self.d / "built2.json")
        r = self.run_pipeline("srt", self.d / "built2.json", self.d / "A.transcript.json",
                              "--out", self.d / "s.srt")
        self.assertEqual(r.returncode, 0, r.stderr)
        text = (self.d / "s.srt").read_text()
        self.assertIn("導入", text)
        self.assertIn("本題", text)
        self.assertNotIn("えーと", text)

    def test_silence_detects_gap(self):
        ff("-f", "lavfi", "-i", "sine=f=440:duration=2", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
           "-f", "lavfi", "-i", "sine=f=440:duration=2", "-filter_complex",
           "[1:a]atrim=0:1.5[s];[0:a][s][2:a]concat=n=3:v=0:a=1", "-t", "5.5", str(self.d / "gap.wav"))
        r = self.run_pipeline("silence", self.d / "gap.wav", "--noise=-50dB")
        spans = json.loads(r.stdout)
        self.assertEqual(len(spans), 1)
        self.assertAlmostEqual(spans[0]["start"], 2.0, delta=0.2)


if __name__ == "__main__":
    unittest.main()
