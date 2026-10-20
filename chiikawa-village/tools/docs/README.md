# 領収書・請求書の作成（2026-10-21 そーやん決定）

「領収書を作って」「請求書を作って」と頼まれたら、この手順で作る。形式は 2026-10-21 に作った領収書4枚（R-0001〜R-0004）と同じにする。

## 道具
- 専用アプリ（そーやんが画面で作る用）: https://claude.ai/artifact/Mgpzt7BmA5QcKxaPgTzsJX（ソース: `docmaker.html`）
- 頼まれたときにこちらで作る用: `make_docs.js`（Node + Playwright。A4・1ページの PDF を作る）。紙面の見た目は `paper.css`

## 形式（freee の過去の請求書と、2026-10-21 の領収書から）
- 発行者: 暮らしの畑屋のおと（橋口 創也、〒892-0875 鹿児島市川上町380）。インボイス登録番号なし。値はアプリの `data/users/me/settings` が正本
- 領収書: タイトル「領収書」、宛名＋様、金額（税込）、但し書き（既定「土壌分析の追加費用として」。頼まれた内容に合わせる）、「上記、正に領収いたしました。（銀行振込）」、内訳（税抜・消費税10%）、発行者。領収日は入金日。5万円以上は収入印紙の欄を出す
- 請求書: タイトル「請求書」、宛名＋御中、件名、あいさつ文「下記の通りご請求申し上げます。」、ご請求金額、支払期限、明細（税抜の外税10%、端数切り捨て）、お振込先、備考「本PDFを原本とします」
- 番号: 領収書 `R-0001`（4桁）、請求書 `INV-0000000056`（10桁）。`settings` の `nrec` / `ninv` が「次の番号」
- 宛名は、依頼した人ではなく、振り込んだ名義・頼まれた名義で書く（迷ったら聞く）

## 手順
1. アプリの db を ArtifactData で読む: collection `data/users/me`、doc `settings`（URL は上のアプリ）。`settings.json` に保存する
2. 宛名・金額・日付を決める（金額は入金明細で合わせる。freee は GET のみ。名前・金額は共有の場所に書かない）。不明な宛名・漢字は、作る前にそーやんに聞く
3. `items.json` を作る（例）:
   ```json
   [{"kind":"receipt","to":"山田 花子","amount":17600,"date":"2026-10-19","forText":"土壌分析の追加費用として","pay":"銀行振込"},
    {"kind":"invoice","to":"株式会社○○","subject":"10月分原稿料","date":"2026-10-30","due":"2026-11-30","lines":[{"d":"10月分原稿料","q":1,"u":"式","p":"28000"}]}]
   ```
4. 実行: `node chiikawa-village/tools/docs/make_docs.js --settings settings.json --items items.json --out <scratchpad>/docs`（1ページでなければ警告が出る）。1枚をスクリーンショットなどで見て確認する
5. `SendUserFile` で PDF を送る（`display: attach`）
6. 履歴とカウンタを db に書く: `out/history.json` の各件を collection `data/users/me/docs/items` に `set`、`out/settings.next.json` の `nrec` / `ninv` を `settings` に `update`（`if_version` を付ける）
7. 送付は、そーやんが行う（メールの送信はできない）。タスクにして、確認してから送る

## 注意
- 白紙の2ページ目が出ないよう、紙面の高さを 1100px にしてある（`paper.css`）。変えるときは1ページか確かめる
- 日本語フォントは環境にあるもの（IPAゴシック）が使われる。見た目が少し違っても内容は同じ
