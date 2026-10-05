# フィードバック先（稼働中のエージェント・仕組みの登録簿）

週次リサーチの結果を反映させる対象の一覧。新しいエージェントや仕組みを作ったら、ここに1行追加する（基準書 第13章の最終チェック項目）。

| 名前 | 種類 | 所在（リポジトリ / パス） | 担当範囲・目的（outcome_link） | 自律度 | 関連ルール | 最終見直し日 |
|---|---|---|---|---|---|---|
| 週次リサーチ | Routine（定期実行） | Claude Code Routines（毎週月曜 06:52 JST） / soyan3355-ui/my-context `standards/` | 基準書を最新の知見に保ち、稼働中のエージェントへ改善を届ける | L1（提案まで。変更はPRでオーナー承認） | GOV-01〜07 | 2026-09-29 |

| 履歴レビュー（手動） | 手順書 | soyan3355-ui/my-context `standards/session-review.md` | 繰り返しの指摘をスキル・テスト・CLAUDE.mdへ反映し手戻りを減らす | L1（提案まで） | GOV-02, GOV-04 | 2026-10-05 |
| ドリーミング | Routine（定期実行） | Claude Code Routines（毎週日曜 22:52 JST・`trig_013r4CJTxAGmDNDEZ61mAksi`） / soyan3355-ui/my-context `standards/session-review.md` | 繰り返しの指摘を検出し、CLAUDE.md・スキルへの改善案をPRで届け手戻りを減らす | L1（提案まで。変更はPRでオーナー承認） | GOV-02, GOV-04, GOV-06 | 2026-10-05 |

<!-- 追加例:
| chief-of-staff | サブエージェント | owner/repo `.claude/agents/chief-of-staff.md` | 週次計画と委任で講座申込数を伸ばす | L3 | ROL-01, TSK-* | YYYY-MM-DD |
-->
