# 動画編集の試作：結合せず、指示書だけで編集する方式

## 目的
AIと共同で動画を編集する仕組みを、Codex側の方式とは別の構成で試す。
最大の弱点だった「編集前に全素材を変換して1本にする待ち時間」をなくし、編集の試行回数を増やすことが狙い。

## 方式
- 素材は元ファイルのまま触らない。
- 編集内容は指示書（JSON）だけに保存する。形式は `example.edit.json` を参照。
  - 各クリップは「どの素材の・何秒から何秒まで・残す／省く・章タイトル」を持つ。
- AIは指示書を作る・直すだけ。映像の加工はFFmpegが書き出し時に1回だけ行う。
- 解像度・fps・音声の有無が違う素材は、書き出し時に揃える（縦動画は黒帯で収める、音声なしは無音を補う）。

## 使い方
```
# 書き出し
python3 render.py plan   example.edit.json            # 検証と全体像の表示（一瞬）
python3 render.py render example.edit.json out.mp4    # 書き出し
python3 render.py render example.edit.json out.mp4 --preview          # 確認用（640x360・速い）
python3 render.py render example.edit.json out.mp4 --subs subs.srt    # 字幕の焼き込み

# 文字起こし → AIが編集案 → 指示書
python3 pipeline.py transcribe a.mp4 b.mp4            # 素材ごとに transcripts/*.transcript.json
python3 pipeline.py prompt transcripts/*.json         # AI(Claude Code等)への依頼文 prompt.md
#   → AIが proposal.json を書く（秒数ではなく発話番号で範囲を指定）
python3 pipeline.py build proposal.json transcripts/*.json --out edit.json
python3 pipeline.py srt edit.json transcripts/*.json --out subs.srt
python3 pipeline.py silence a.mp4 --noise=-40dB       # 無音区間の検出（補助）

# テスト
python3 -m unittest discover -s tests -v
```
必要なもの：Python 3、FFmpeg（ffprobe・libass・zimg付き）。文字起こしだけ `pip install faster-whisper`。

## 仕組みのポイント
- **書き出しは1回のエンコード**。クリップごとに素材の途中から読み込む（頭から読み進めない）ので、長い素材でも速い。
- **HDR素材は自動でSDRに変換**（PQ=HDR10系、HLG=iPhone等。BT.2020→BT.709、mobiusトーンマップ）。`plan` に `[HDR:…→SDR変換]` と出る。
- **AIには秒数を書かせない**。発話番号で範囲を指定させ、秒数への変換と前後の余白付け（省いた発話には食い込ませない）はスクリプトが行う。範囲外の番号は書き出し前にエラーになる。

## 動作確認の結果（2026-10-09）
合成素材で確認した。**実際のHDR素材・実際の音声での確認はまだ**。
- 解像度・fps・音声の有無が違う素材3本から105秒を書き出し：約44秒（このクラウド環境のCPU）。長さは105.0秒ちょうど。
- 確認用の `--preview`：48秒の編集で約12秒。
- HDR：SDR原本の平均輝度126.2に対し、PQ/HLGの変換後は119.7（変換なしだと約99〜105でくすむ）。設定は合成素材で調整したので、実素材では目視確認が必要。
- 文字起こし→指示書→字幕→書き出しは、手作りの文字起こしで一通り確認した。Whisperのモデルは、このクラウド環境から取得できず未実行。
- 自動テスト9本が通る。壊した場合に失敗することも確認済み。

## 未対応（次の候補）
1. 実際のHDR素材（iPhone HLG、Dolby Visionなど）での目視確認と、トーンマップ設定の調整。
2. 実際の音声での文字起こし（faster-whisperのモデル取得）と、AI案の品質確認。
3. ブラウザーでのプレビュー（素材をその場で切り替えて再生。音声同期の作り込みが必要）。
4. Googleフォトからの取り込み。
5. 既存のCodex側編集データ（JSON）との互換変換。
6. Shotcut（MLT XML）への書き出し。
