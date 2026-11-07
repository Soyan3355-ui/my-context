## ちいかわ放送局の YouTube の数字（2026-10-22 そーやんの依頼）

- 目的：YouTube チャンネルの運営（配信計画とモチベーション）を、数字で支える。画面は別の Artifact「ちいかわ放送局」 https://claude.ai/artifact/4sR9MaczXq1Ku4X2Tk8QnN 。担当は司令塔（ハチワレ）。**読むだけ**（YouTube への投稿・設定の変更はしない）
- 取り方：コネクタ「Supermetrics Marketing Analytics」の `data_query`（`ds_id: YT2`、チャンネル ID `UCqJXNGNuiuPkdGEz3dN_KAw`）。`settings` に `report_type` を入れる。数字は 2〜3 日おくれで届く
  1. 動画ごと：`report_type: LatestVideos`、`fields: video,video_title,video_published_date,views,likes,comments,estimatedMinutesWatched,subscribersGained`、`date_range_type: last_90_days`、`max_rows: 30`
  2. チャンネルの日別：`report_type: ChannelTotals`、`fields: date,views,estimatedMinutesWatched,subscribersGained,subscribersLost`、`date_range_type: last_60_days`、`max_rows: 100`（直近28日と、その前の期間を比べるため）
  - `channel_subscribers`（登録者の総数）はこの接続では取れない（「集計できない」と返る）。登録者の総数は、そーやんが画面に手で記録する
- 全期間の積み上げ（「これまでの歩み」の絵「森の土と菌糸」の元データ）：朝の回で更新する。`report_type: ChannelTotals`、`fields: year_channel_totals,views,estimatedMinutesWatched,subscribersGained,subscribersLost`、`date_range_type: custom`、`start_date: 2020-06-01`、`end_date: 今日` で年ごとの合計を取る。あわせて `fields: yearMonth_channel_totals,views,estimatedMinutesWatched`、`start_date: 今年の1/1` で今年の月ごとの合計を取る。放送局の db の `yt/years` に `{updatedAt, source, from, to, years:[{y,views,min,g,l}], months:[{ym:'2026-10',views,min}]}` を `set`（`if_version` つき）で上書きする。`to` は、日別の数字の最後の日（2〜3日おくれ）にそろえる。そーやんの開始日は `yt/channel` の `startedAt`（2020-06-01）
- 書き先：ちいかわ放送局の db（ArtifactData、`url` は上の Artifact）。`yt/videos` に `{updatedAt, source, range, items:[{id,title,pub,views,likes,comments,min,subs}]}`、`yt/summary` に `{updatedAt, source, from, to, views, min, gained, lost（この4つは直近28日の合計）, days:[{d,views,min,g,l}]（取れた日ぶん全部）}` を `set`（`if_version` つき）で上書きする
- いつ：朝の回（毎日）と夕の回で更新する。新しい数字が前回と同じなら書き換えない。取れなかったときは、ダイジェストの「ブロック」に出す（「更新ずみ」とは書かない）
- 共有の場所（`status`・ダイジェスト・Notion）には、数字の細かい内訳は書かない。「YouTube の数字を更新した」までにする
- 番組（動画の計画）の `url` に YouTube の動画 ID が入っていれば、画面が自動でその動画の再生数を出す。公開した動画の URL をそーやんが入れる運用にする
- 番組のカレンダー反映（2026-10-22 そーやんが質問への回答「見回りで自動（承認つき）」で承認）：ちいかわ放送局の番組に限り、見回りの全部の回（朝・夕・ダイジェスト更新）で、そーやんの主カレンダーにイベントを作る・直す・消すことを、そーやんが承認した。ほかのカレンダー操作は、これまでどおり承認が要る
  - 対象：放送局の db の `videos` のうち、`date` があり、`status` が `idea` 以外で、`example` が付いておらず、`archived` でないもの
  - 目印：`cal: {eventId, hash, at}`。`hash` は `[date, time, title, status, shootDate, editDue, series].join('|')`（空の項目は空の文字列。`series` はシリーズの ID）。`cal.hash` が今の `hash` と同じなら何もしない
  - 放送のイベント：題名 `📺 〔{段階}〕{シリーズのアイコン} {title}`（シリーズは `channel/settings` の `series` から ID で引く。未設定ならアイコンなし）（段階は idea=ネタ、plan=採用（古い script も同じ）、shoot=撮影中、edit=編集中、ready=公開待ち、live=公開済み）。開始は `date`＋`time`（空なら放送枠の時刻。いつもは土曜 17:00）、終了は `channel/settings` の `slot.min`（なければ60）分後。説明に `[ちいかわ放送局:{ドキュメントID}]`・段階・キャッチコピー・出演を書く。`create_event`（`summary`・`startTime`・`endTime`・`description`。時刻は日本時間のローカル時刻で、`Z` や UTC オフセットは付けない）で作り、イベント ID を `cal.eventId` に保存する。`eventId` があれば `update_event` で直す
  - 撮影・編集：`shootDate` があれば終日のイベント `🎥 撮影：{title}`、`editDue` があれば終日のイベント `✂ 編集のしめきり：{title}`（`allDay: true`）も同じ要領で作る。ID は `cal.shootId`・`cal.editId`。日付を消したら `delete_event` で消す
  - 消す：`archived: true` で `cal.eventId` があるドキュメントは、イベントを `delete_event` で消してから、ドキュメントを `delete` する
  - 書き戻し：`videos/{id}` に `update`（`cal` だけ。`if_version` つき）。参加者は付けない（通知メールが出ないように）。場所は入れない
  - 記録：作った・直した・消した件数と題名を、ダイジェストと進捗ログに書く。失敗したら、ダイジェストの「ブロック」に出す
- データはそーやんのチャンネルの数字。外には出さない
- ちいかわ株式会社の画面との連携（2026-10-22 そーやんの依頼）：両方の画面に、お互いへのリンクがある。ちいかわ株式会社の画面には「📺 ちいかわ放送局」の箱があり、要点（`status/now.broadcast`）を表示する。見回り（朝・夕）で YouTube の数字を更新したあと、あわせて `status/now.broadcast` を `update` で書く：`{thisWeek: 今週の公開済みの本数, goal: 週の目標, next: {date, title}（直近の未公開の番組。見本の番組だけのときは入れず、`onlySamples: true`）, late: 放送日をすぎた未公開の番組の数, yt: {from, to, views, net: 登録者の増減}, updatedAt}`。元データはちいかわ放送局の db（`videos`・`channel/settings`・`yt/summary`）。番組の題名は書いてよいが、金額・人名は書かない
