# チーム戦術 相性調査レポート（counter / press / long / possession）

調査日: 2026-09-25
対象: ゲーム内の4戦術（堅守速攻 counter / ハイプレス press / ロングボール long / ポゼッション possession）の総当たり相性

> **調査方法の注意**: WebSearch で検索した。ただし theanalyst.com、ncbi.nlm.nih.gov、frontiersin.org などへの WebFetch は、実行環境のプロキシでブロックされた。このため数値の多くは**検索結果に出た原文の抜粋から引用しており、本文そのものは読めていない**。数値には URL を付けた。出典の信頼度は次の3段階で示す。
> - 【データ】査読論文や Opta/StatsBomb/FIFA などの一次データ
> - 【分析家合意】戦術分析記事やコーチング資料で繰り返し述べられている見解
> - 【推測】本レポートでの推論。ゲーム設計のための仮定

---

## 1. 4×4 相性マトリクス（行チームから見た有利度）

記号: ◎ 有利（+2） / ○ やや有利（+1） / △ 互角（0。△−は「やや不利」、△+は「やや有利寄りの互角」） / × 不利（−2）
数値は「素の能力が互角のとき」の目安。**どのセルも選手能力で逆転しうる傾向値として扱う。**

| 行 vs 列 | counter | press | long | possession |
|---|---|---|---|---|
| **counter** | △ 0：両者とも待つので試合が動かず、低得点になる。スピードとセットプレーで決まる | ○ +1：プレス側が前がかりになり、高いラインの背後を速攻で突ける。深い位置の相手にはプレスをかける対象も少ない | △ 0：密集したボックスへの空中戦は守備側が有利。一方でセカンドボールとセットプレーでは押し込まれる | ○ +1：相手のポゼッションが「不毛」になり、奪ってからの速攻で不整備な守備を突ける |
| **press** | △− −1：深いブロックにはプレスが空振りし、高いラインの背後を走られる | △ 0：互いのハイプレスで混戦になる。ターンオーバー合戦で、プレス耐性（pas）とスタミナが勝負を決める | △− −1：蹴られるとプレスを回避され、高いラインが裏へのボールにさらされる | ○ +1：自陣から繋ぐ相手を高い位置で奪い、良質なシュートにつなげる。ただしプレス耐性の高い相手には逆転される |
| **long** | △ 0（△+寄り）：陣地を取ってセットプレーとセカンドボールで押し込む。ただしボックス内の空中戦は守備側が有利 | ○ +1：ロングボールでプレスを飛ばし、高いラインの裏や1対1を狙う | △ 0：空中戦とセカンドボールの消耗戦になる。体格（def/身長）で決まる | △− −1：ロングボールの成功率は約5割なのでボールを渡しがち。押し上げた中盤の背後も使われる |
| **possession** | △− −1：崩せずに攻めが単調になる。前がかりを速攻で刺される | × / △− −1：自陣ビルドアップでのロストが失点に直結する。ただし pas が高ければ逆転し、剥がした先は広大な裏になる | ○ +1：ボールを保持して相手のロングボール源を断つ。中盤の押し上げで空いたスペースを突く | △ 0：保持率の奪い合い。pas とプレス耐性の差がそのまま出る |

**構造上のまとめ【推測】**
- 大まかな循環は「long → press → possession → long」。counter はこれとは別枠で、press と possession にやや強く、long とは互角。
- counter は「負けにくいが、勝ち切りにくい」戦術として設計するのが現実に近い。低得点で引き分けが多く、**リードされると機能しなくなる**。ここに弱点を持たせないと支配的な戦術になるので、スコア状況による補正（後述 4.8）で調整する。
- 完全な三すくみにはしない。各セルの有利度は ±1 程度にとどめ、選手能力の差で覆るように作る。

---

## 2. ペア別メカニズムと逆転条件

### 2.1 press vs possession（press ○ / possession △−）
**メカニズム**
- 自陣から短く繋ぐ相手を高い位置で奪えば、ゴールに近い位置でシュートを打てる。Opta によると、プレミアリーグでハイターンオーバー後のシュートの平均xGは **0.11** で、記録上最高だった。シュートで終わったハイターンオーバーは1試合 **2.5回**（2024-25）【データ】 https://theanalyst.com/articles/premier-league-pressing-stats-too-good
- Rangnick は「ゴールの多くはボール奪取から8秒以内に生まれる」と述べている【分析家合意】 https://www.getfootballnewsgermany.com/2026/pressing-pace-precision-what-defines-modern-bundesliga-football/
- カウンタープレス（失った直後の即時奪回）が成功すると得点率は大きく上がり、失敗すると失点が大きく増える（Bauer & Anzer）【データ】 https://www.researchgate.net/publication/353102488

**逆転条件**
- **プレス耐性（pas）**: 一流の選手はプレスを受けてもパスを高い確率で通す。StatsBomb の例では Kroos のプレス下パス成功率が90%、Verratti が91%【データ】 https://blogarchive.statsbomb.com/articles/soccer/statsbomb-data-case-studies-actions-under-pressure/
- GKを含めた数的優位で相手のプレスを誘い出し、剥がせば、高いラインの裏に大きなスペースが生まれる（De Zerbi のビルドアップ）【分析家合意】 https://www.soccertutor.com/blogs/inside-football-coaching/de-zerbis-tactics-bait-the-press-build-up-play
- プレス側のスタミナが切れる終盤（2.9 参照）。

### 2.2 long vs press（long ○ / press △−）
**メカニズム**
- ロングボールはプレスを飛ばせる。2025-26 のプレミアではハイターンオーバーが1試合 **11.5回** まで減り、過去10シーズンで最少になった。Opta は「相手がロングボールを蹴る傾向を強めた結果」と解釈している【データ】 https://theanalyst.com/articles/premier-league-2025-26-more-direct-football
- 同じ時期にGKのパスに占めるロングの割合は、2014/15 の79.3%から2023/24 の46.6%まで10季連続で下がった。その後 2025/26 序盤に51.9%へ反転している【データ】 https://www.premierleague.com/en/news/4407434/analysis-four-tactical-trends-redefining-the-premier-league
- 高いラインの背後は広い。そのため裏へのボールと速いFWに弱い【分析家合意】 https://the-footballanalyst.com/defending-with-a-high-backline-football-tactics-explained/

**逆転条件**
- **プレス側DFのスピードと空中戦能力**: Klopp の Liverpool は、長身でリカバリーの速いCB（Van Dijk、Matip）を置いて高いラインを成り立たせた。2019-20 には相手のオフサイドが1試合 **3.7回**（過去3季平均は2.9）に増えた【データ/分析家合意】 https://www.planetfootball.com/in-depth/liverpool-jurgen-klopp-offside-trap-high-line-defence-var-genius-chelsea-burnley
- ロングボールの成功率は約5割なので、残りの半分は相手ボールになる（4.3 参照）。
- ロング側のFWが遅い、または小さい場合は、蹴っても回収されて終わる。

### 2.3 counter vs press（counter ○ / press △−）
**メカニズム**
- 深いブロックは自陣でしかプレスをかけない。このためプレス側はボールを持つ時間が長くなり、ハイプレスで奪う機会そのものが減る。実質的には「高いラインの保持チーム vs 低ブロック」の構図になる【分析家合意】
- 奪った瞬間には相手の守備が整っていない（imbalanced）。不整備な守備に対するカウンターは、組み立て攻撃より有効で、オッズ比は **OR 1.64（95%CI 1.03–2.61）**（Tenga ら 2010、ノルウェー1部）【データ】 https://pubmed.ncbi.nlm.nih.gov/20391095/
- プレミアで「前に人数をかけるチームが増えた結果、背後に穴が増えてカウンターが増えた」とする Opta の分析もある。2024/25 は、シュートで終わったファストブレイクが1試合1.84回、そこからの得点が0.30点で、ともに記録上最多だった【データ】 https://www.premierleague.com/en/news/4272576

**逆転条件**
- プレス側がカウンタープレスで速攻の最初のパスを潰せる場合（相手の pas が低いとき）。
- counter 側のFWが遅い場合、裏に抜けてもDFに追いつかれる。
- press 側がリードしている場合、ラインを下げてリスクを管理できる。

### 2.4 counter vs possession（counter ○ / possession △−）
**メカニズム**
- 低ブロックに対して保持側が外に追いやられ、中央を割れずにバックパスでやり直すと、守備側は休めてしまう。結果はミドルシュートか、跳ね返されやすいクロスになる【分析家合意】 https://www.3dmigoto.com/2013-14-premier-league-sterile-possession-analysis/ 、 https://learning.coachesvoice.com/cv/low-block-football-tactics-explained-simeone-dyche-mourinho/
- 流れの中のクロスは効率が悪い。正確に通るのは4.87本に1本、得点になるのは91.47本に1本。1試合平均で見ると、流れの中のクロスを減らせば+0.57点の見込みがある（Vecer, EPL/ブンデス/2014W杯）【データ】 https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2225728
- 攻撃は、整った守備に対してはスコアボックスへの侵入率が **6.5%** だが、不整備な守備に対しては **28.5%** になる（Tenga ら）【データ】 https://pubmed.ncbi.nlm.nih.gov/20391095/
- 実例: 2015-16 の Leicester は保持率42.4%で優勝した。これは記録上最低の優勝チーム保持率で、保持率40%未満の試合に8勝している。パスの21%がロングボール、1試合約70本、1シーケンスの平均時間は5.5秒でリーグ最短だった【データ】 https://theanalyst.com/articles/on-this-day-leicester-city-premier-league-title-2-may 、 https://www.sofascore.com/news/on-this-day-10-years-ago-leicester-won-the-premier-league-title

**逆転条件**
- 保持側の pas が高く、テンポの速い左右の揺さぶりや、低いクロスとカットバックを使える場合【分析家合意】 https://totalfootballanalysis.com/article/tactical-theory-successfully-break-low-block-tactical-analysis-tactics
- 保持側のカウンタープレスが機能している場合（奪われた直後に即回収）。
- **スコア状況**: counter 側が先制されると保持を強いられ、機能しなくなる。負けているチームほど保持率が上がることが Lago-Peñas の研究で示されている【データ】 https://doi.org/10.1080/02640410903131681
- **注意**: 実データでは「保持率が高いチームほど勝つ」相関もある。ただしこれはチーム力の交絡が大きい【分析家合意】。同じ能力同士なら counter がやや有利、という程度の評価にとどめる。

### 2.5 long vs counter（ほぼ互角。long がわずかに有利寄り）
**メカニズム**
- 低ブロックが相手なので、裏にスペースがない。ロングボールはFWへの競り合いになり、密集したボックス内では守備側CBが有利になる【分析家合意】
- 一方で long 側は陣地を取るので、セットプレー（コーナー、ロングスロー、FK）と相手陣でのセカンドボール回収が増える。2025-26 のプレミアでは、セットプレーへの依存とロングスローの増加が指摘されている【データ】 https://www.premierleague.com/en/news/4426039/opta-analyst-on-long-balls-long-throws-key-tactical-trends-spotted-in-2025-26-season
- long 側は中盤を押し上げるので、セカンドボールを失うとその背後に大きなスペースが空き、counter の出番になる。Dyche の Burnley の分析でも「セカンドボールを失うと、密集した地点以外にスペースが大量に生まれる」と指摘されている【分析家合意】 https://themastermindsite.com/2020/05/04/sean-dyche-burnley-tactical-analysis/

**逆転条件**
- long 側のFW/CBの空中戦能力（def と体格）が相手を上回れば、long が有利になる。
- counter 側の中盤がセカンドボールを拾えれば、counter が有利になる。

### 2.6 possession vs long（possession ○ / long △−）
**メカニズム**
- ロングボールの成功率は平均で約47%（Opta の過去データ）。2024-25 → 2025-26 のリーグ全体では、1試合あたりの試行が1274.1本→1395.4本、成功が656本→689.5本で、成功率はおよそ49〜51%【データ】 https://www.si.com/soccer/2018/11/23/surprising-statistics-reveal-chelsea-and-manchester-city-best-long-ball-premier-league-sides 、 https://www.premierleague.com/en/news/4426039/opta-analyst-on-long-balls-long-throws-key-tactical-trends-spotted-in-2025-26-season
- つまり long 側は自分からボールを手放しやすく、保持側がボールと試合のテンポを握りやすい【推測】
- Burnley は保持率43%でロングパス77本/試合、空中戦勝利22.9〜24.7回/試合でリーグ1位だった。技術的に上のチームを苦しめた、と分析されている【データ/分析家合意】 https://themastermindsite.com/2021/02/25/sean-dyche-burnley-tactical-analysis-2020-21-edition/

**逆転条件**
- 空中戦の力の差（long 側FWの def/体格が高く、possession 側CBが低い場合）。
- possession 側がラインを高く上げている場合は、2.2 と同じ理屈で long が逆転する。

### 2.7 ミラーマッチ
- **counter vs counter**: どちらも引いて待つので、イベントの少ない試合になる【推測/分析家合意】。先制した側が一方的に有利になる。スコア状況による補正が重要。
- **press vs press**: 両チームとも高いラインでターンオーバーが多発し、オープンな展開になる。pas（プレス耐性）とスタミナ（sta）が高い側が有利【分析家合意】。終盤は両チームとも崩れる。
- **long vs long**: 空中戦とセカンドボールの消耗戦。def、体格、中盤の数で決まる。
- **possession vs possession**: どちらも保持を狙うので、pas の差がそのまま出る。

### 2.8 横断的な逆転要因

| 要因 | 効果 | 根拠 |
|---|---|---|
| スピード（spd） | 高いラインの裏、カウンター、ロングボールの裏抜けの成否 | 【分析家合意】 high line 解説 https://the-footballanalyst.com/defending-with-a-high-backline-football-tactics-explained/ |
| 空中戦（def＋体格） | long の成否、低ブロックのボックス防衛 | 身長を補正した空中戦 Elo モデル【データ】 https://www.tandfonline.com/doi/full/10.1080/24748668.2024.2420458 |
| パス／プレス耐性（pas） | press vs possession の勝敗、カウンターの最初のパス | StatsBomb【データ】 |
| スタミナ（sta） | press の後半の崩壊 | 下記 2.9 |
| 規律 | オフサイドラインの統一、ブロックの間隔 | オフサイドトラップは1人でも遅れると破綻する【分析家合意】 https://guidetofootball.com/tactics/offside-trap/ |
| スコア状況 | 負けている側は保持率が上がり、前に出る。先制された counter は機能しなくなる | Lago-Peñas【データ】 |
| ピッチの広さ | 広い、または長いピッチでは攻撃側とカウンターが有利。狭いピッチではプレスが有利 | ユースのスモールサイドゲーム研究（縦長・横長の構成はカウンターと得点機会が多い）【データ（規模小・ユース）】 https://www.mdpi.com/1660-4601/18/19/10500 |

### 2.9 疲労とプレス
- 最後の15分のスプリント距離は、最初の15分より **43%少ない**。高強度ランの間の回復時間は **28%長い**【データ（検索抜粋。原典は半プロの研究と思われるが未確認）】 https://www.researchgate.net/publication/299598558_Variations_in_high-intensity_running_and_fatigue_during_semi-professional_soccer_matches
- ブンデスリーガ792件の分析では、ランニングは平均24.2%低下した。ただし実プレー時間で補正すると低下は10.2%で、低下の一部は中断によるもの【データ】 https://www.researchgate.net/publication/329247433
- 加速・減速能力は60分以降に有意に低下し、高速走行（HSR）の低下は最後の15分で顕著になる【データ】 https://www.tandfonline.com/doi/full/10.1080/02640414.2026.2632514
- UCL 2020/21 では、チームのランニングが大きく落ちた5分区間に失点が集中していた【データ】 https://pmc.ncbi.nlm.nih.gov/articles/PMC11874785/
- 注意: 「プレスをするチームほど終盤に崩れる」ことを直接示すチーム単位のデータは見つからなかった。一般的な疲労データからの【推測】であり、【分析家合意】も一部ある。

---

## 3. 定量アンカー一覧

| 指標 | 値 | 出典 | 信頼度 |
|---|---|---|---|
| ハイターンオーバー後のシュートの平均xG | 0.11（EPL、記録上最高） | https://theanalyst.com/articles/premier-league-pressing-stats-too-good | データ（抜粋） |
| シュートで終わったハイターンオーバー | 2.5回/試合（EPL 2024-25） | 同上 | データ（抜粋） |
| ハイターンオーバー総数 | 11.5回/試合（EPL 2025-26、過去10季で最少） | https://theanalyst.com/articles/premier-league-2025-26-more-direct-football | データ（抜粋） |
| ロングボール成功率 | 約47.3%（Opta、2018年ごろの記事） | https://www.si.com/soccer/2018/11/23/surprising-statistics-reveal-chelsea-and-manchester-city-best-long-ball-premier-league-sides | データ（古い） |
| リーグ全体のロングボール | 試行1274.1→1395.4、成功656→689.5（1試合あたり、20チーム合計と思われる） | https://www.premierleague.com/en/news/4426039/opta-analyst-on-long-balls-long-throws-key-tactical-trends-spotted-in-2025-26-season | データ（抜粋） |
| GKパスのロング比率 | 79.3%（14/15）→46.6%（23/24）→51.9%（25/26序盤） | https://www.premierleague.com/en/news/4407434/analysis-four-tactical-trends-redefining-the-premier-league | データ |
| ファストブレイク | シュートで終わったもの1.84回/試合、得点0.30/試合（24/25） | https://www.premierleague.com/en/news/4272576 | データ |
| ファストブレイク総数 | 2.04回/試合（24/25）→1.56回（25/26） | https://www.premierleague.com/en/news/4426039/opta-analyst-on-long-balls-long-throws-key-tactical-trends-spotted-in-2025-26-season | データ（抜粋、要確認） |
| カウンター vs 組み立て攻撃（不整備な守備相手） | OR 1.64。スコアボックス侵入率36.4% vs 24.4% | https://pubmed.ncbi.nlm.nih.gov/20391095/ | 査読論文 |
| 不整備な守備 vs 整った守備への侵入率 | 28.5% vs 6.5% | 同上 | 査読論文 |
| 得点に占めるカウンターの割合（ノルウェー） | 得点サンプルの52%、無作為サンプルの41% | 同上 | 査読論文 |
| W杯2022のカウンター | 勝利チーム: シュートで終わったカウンター42回→11得点。敗戦チーム: 12回→0得点 | https://www.fifatrainingcentre.com/en/fwc2022/technical-and-tactical-analysis/technical-tactical-overview.php | データ（抜粋。掲載ページは未確認） |
| 流れの中のクロス | 正確なのは4.87本に1本、得点は91.47本に1本 | https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2225728 | 論文 |
| PPDA の目安 | 10未満は強いハイプレス、10〜15は中間、15超は深いブロック | https://kiqiq.com/ppda-football/ | 二次資料 |
| EPL 25/26 の PPDA 範囲 | 8.99（Chelsea）〜14.16（West Ham）（Understat、第28節時点） | https://matchengine.pro/blog/ppda-football-meaning | 二次資料 |
| Direct speed | West Ham 2.29 m/s vs Man City 1.1 m/s | https://www.andrewbeasleyfootball.com/p/which-is-the-fastest-team-in-the-premier-league | 二次資料 |
| Leicester 15-16 | 保持率42.4%、ロングボールがパスの21%、約70本/試合、シーケンス平均5.5秒 | https://theanalyst.com/articles/on-this-day-leicester-city-premier-league-title-2-may | データ（抜粋） |
| Burnley（Dyche） | ロングパス77本/試合、保持率43%、空中戦勝利22.9〜24.7回/試合 | https://themastermindsite.com/2021/02/25/sean-dyche-burnley-tactical-analysis-2020-21-edition/ | 分析記事 |
| 空中戦勝率の目安 | 60%超で優秀、トップのCB/ターゲットマンは70%超 | https://www.sportmonks.com/glossary/aerial-duels-won/ | 二次資料 |
| 相手のオフサイド数（Liverpool） | 3.7回/試合（19-20）、2.9回（その前3季） | https://www.planetfootball.com/in-depth/liverpool-jurgen-klopp-offside-trap-high-line-defence-var-genius-chelsea-burnley | 分析記事 |
| 終盤のスプリント | 最後の15分は最初の15分より−43%、回復時間+28% | https://www.researchgate.net/publication/299598558 | データ（抜粋） |
| 走行距離の低下（ブンデス） | −24.2%（実プレー時間で補正すると−10.2%） | https://www.researchgate.net/publication/329247433 | データ |
| プレス下のパス成功率（一流選手） | Kroos 90%、Verratti 91% | https://blogarchive.statsbomb.com/articles/soccer/statsbomb-data-case-studies-actions-under-pressure/ | データ |

注意: 検索で「Bradley & Ade (2018) では、成功したハイプレスチームの PPDA は6未満」とする二次記事が見つかった。しかし原論文は PPDA を扱っていないと思われるため、**採用していない**。

---

## 4. ゲームメカニクスへの落とし込み（調整可能なパラメータ案）

以下は【推測】にもとづく設計案。初期値は、上のアンカーを「おおむね再現する」ことを目標にした。能力値は0〜100を想定している。

### 4.1 プレス下のパスミス（press vs possession の中核）
```
pressure = Σ_pressers  w_i * (1 - dist_i / R_press)          # R_press ≈ 4m、2人で上限 1.0
press_skill = avg(def, spd, sta_now) of pressers
resist = carrier.pas * 0.7 + carrier.spd * 0.1 + carrier.sta_now * 0.2

pass_err_mult = 1 + k_press * pressure * sigmoid((press_skill - resist) / 12)
k_press 初期値 = 1.2   （一流の選手は圧力下でも成功率約90%を保つので、pas 80 の選手が圧力最大で 88〜92% になるよう調整）
```
- **しきい値**: `resist - press_skill >= 15` なら「プレスを剥がした」判定にする。受け手には次のボーナスを付ける。
  - 前を向いた状態で受ける（ファーストタッチのロスなし）
  - 相手が press の場合、ラインの背後のスペース評価を +30%（ライン突破→裏の広いスペースを反映）
- ハイターンオーバー（相手陣の奥1/3で奪取）の後は、`counter mode` の最初のシュート期待値が通常より高くなるようにする。目安は xG/shot ≈ 0.11 で、組み立て攻撃の平均を0.08〜0.09と置いた場合の約1.3倍（後者は【推測】）。

### 4.2 プレス回避としてのロングボール（long vs press）
```
long_success = base_long(0.48) 
             + 0.004 * (passer.pas - 50)
             + aerial_term (4.3)
             + 0.10 * max(0, def_line_height - 0.5)    # 相手のラインが高いほど裏のスペースが広い
```
- 相手が press のとき、ロングボールの受け手が裏に抜ける確率は `P_behind = sigmoid((fw.spd - cb.spd) / 10 + line_gap_bonus)` とする。
- **逆転**: press 側CBの spd が FW より10以上高ければ、ほぼ回収される（Van Dijk 型）。
- press チームは「ボールを保持している相手1人あたりのプレス機会」が減るので、ロングボールを蹴られた回数に比例して、ハイターンオーバー期待値を下げる（2025-26 のデータの傾向）。

### 4.3 空中戦
```
aerial_score = def * 0.5 + body_size * 0.3 + spd * 0.1 + jump_timing(random) 
P_win = sigmoid((attacker_score - defender_score) / 8)
```
- **密集補正**: 自陣ボックス内の守備人数が N_def > N_att + 2 のときは、攻撃側の P_win × 0.7 とする（低ブロック vs long を互角〜守備有利にする）。
- **セカンドボール**: 競り合いの落下点から半径8m以内の人数と spd で回収者を決める。long チームは中盤を押し上げるので+1人分の補正を付ける。回収に失敗した場合、押し上げた分だけ背後のスペース評価を上げる（counter の反撃を誘う）。
- 目安: 空中戦に強い選手の勝率は60〜70%程度に収束させる。

### 4.4 低ブロック vs 保持（counter vs possession）
- **ブロック密度**: counter チームが自陣1/3に8人以上いるとき、中央を通すパスのミス率 × (1 + 0.4) とする。サイドのパスには補正なし。これで保持側が外に追いやられる。
- **クロス**: 流れの中のクロスは、正確に通る率が約20%、得点に直結する率が約1〜1.5%程度になるよう調整する（Vecer: 1/4.87、1/91）。
- **ポゼッション側のショット選択**（「良い位置からのみ」）: 低ブロック相手ではシュート機会が減る。一定時間シュートがなければ `patience` が下がり、ミドルシュートやクロスの頻度が上がるようにする。
- **カウンター係数**: 奪取時点で相手の守備が「不整備」（自陣側にいるDFの数がボールより前の相手より少ない）なら、ゴール前侵入率 ×（28.5/6.5）の範囲で補正する。ただしそのままだと効きすぎるので、×2.0〜2.5 程度に縮める。

### 4.5 高いラインとオフサイド
```
offside_trap_success = min(def of back line) と line_sync(=規律) の関数
if 最も遅いDFの spd < 攻撃側の spd - 10:  トラップ失敗時は GK と1対1になる確率を上げる
```
- press チームのラインの高さは実際に高い位置に置く。相手の裏抜けは spd の差で判定する。
- 規律（隠しステータス、または def と sta の平均）が低いと、ラインがずれて1人が相手をオンサイドにしてしまう。

### 4.6 スタミナとプレス
```
sta_drain_per_tick = base + press_mode * 1.8x   (press のプレッサー役 2人 + マーク 1人)
effective_spd = spd * (0.75 + 0.25 * sta_now/100)
press_intensity = min(1, sta_now / 60)     # sta_now が60を切ると、プレッサーの寄せる速度と人数が減る
```
- 目標値: press チームは60分以降、プレッサーの寄せる速度が約10〜15%落ちる。75分以降はスプリント頻度が最初の15分より約30〜40%落ちるよう調整する（データでは最後の15分に−43%。中断を補正すると低下はより小さい）。
- 高強度ランの回復時間は後半に +28%（アンカー）なので、連続プレスのクールダウンを後半は1.3倍にする。
- 走行量が大きく落ちた時間帯に失点が集中する（UCL の研究）。そのため `sta_now` が低いときに守備の反応遅延を加える。

### 4.7 counter mode（速攻）
- 奪取から数秒以内に前線へ縦パスを出した場合、カウンターが成立する。目安は Leicester のシーケンス平均5.5秒、Rangnick の「8秒」。
- 成立条件は、前線の走者の数（spd 上位2人）、相手の戻っている人数、最初のパスの pas。
- 相手が possession でも press でも、前がかりになっていれば成立しやすい。相手が counter や long で深い位置にいる場合は、ほとんど成立しない。

### 4.8 スコア状況と疲労による補正（counter の支配を防ぐ）
- counter チームが**負けているとき**は、ブロックの高さを自動で+1段階上げて前に出る（負けている側の保持率が上がる現象の再現）。これで counter 本来の強みを失う。
- 勝っているとき: どの戦術もライン−0.5段階（リスク管理）。
- press チームが勝っているときは、プレスの強度を下げてスタミナを温存できる（AI の選択肢）。

### 4.9 ピッチの広さ（オプション）
- 横幅が広いほど、ブロックの横スライドに時間がかかるので、counter の低ブロックと press の守備範囲は不利になる。possession と counter の攻撃側は有利。
- 狭いピッチでは press のプレッサーの寄せ距離が短くなり、プレスが有利になる（研究はユースのスモールサイドゲームに限られるので、補正は小さく）。

### 4.10 検証のためのテレメトリ案
シミュレーションを数千試合回し、次の値が現実の範囲に入っているかを確認する。
- press の PPDA 相当（相手陣での守備アクションあたりの相手パス数）: 8〜10。counter: 14〜18。
- ハイターンオーバー: press チームで1試合10〜15回程度。そのうちシュートで終わる割合は約20%。
- ロングボール成功率: 45〜52%。
- 流れの中のクロスからの得点: 1〜2%。
- 相性の勝率: 素の能力が同じ試合で、有利側の勝ち点期待値が +0.15〜0.3 点/試合程度になるように調整する（【推測】: 強すぎると三すくみになる）。

---

## 5. 不確実性についての注意

- **データの裏付けが比較的強いもの**: カウンターが不整備な守備相手に有効であること（Tenga）、流れの中のクロスが非効率であること（Vecer）、ハイターンオーバー後のシュートの質（Opta）、ロングボールが増えてハイターンオーバーが減った傾向（Opta 2025-26）、試合終盤のランニング低下、負けているチームの保持率が上がること（Lago-Peñas）。
- **分析家の合意が中心のもの**: 高いラインが裏と速さに弱いこと、低ブロックに対して保持が「不毛」になること、セカンドボールの重要性、ミラーマッチの性質。
- **根拠が弱く、推測の要素が大きいもの**: 「プレスをするチームほど終盤に失点が増える」という直接の因果、ピッチの広さの効果（ユースの研究のみ）、各セルの有利度の具体的な数値。
- 戦術同士の相性（A vs B の勝率）を直接推定した大規模な研究は見つからなかった。マトリクスは、上のメカニズムを組み合わせて推論したもの。
- WebFetch がブロックされたため、数値は検索結果の抜粋からの引用。正式採用の前に、原文で確認することを推奨する。

---

## 6. 出典一覧

- Opta Analyst – Premier League pressing stats: https://theanalyst.com/articles/premier-league-pressing-stats-too-good
- Opta Analyst – More long balls, fewer high turnovers (2025-26): https://theanalyst.com/articles/premier-league-2025-26-more-direct-football
- Opta Analyst – Leicester title: https://theanalyst.com/articles/on-this-day-leicester-city-premier-league-title-2-may
- Premier League – Fast breaks are back in style: https://www.premierleague.com/en/news/4272576
- Premier League – Long balls, long throws (2025-26): https://www.premierleague.com/en/news/4426039/opta-analyst-on-long-balls-long-throws-key-tactical-trends-spotted-in-2025-26-season
- Premier League – Four tactical trends 2025/26: https://www.premierleague.com/en/news/4407434/analysis-four-tactical-trends-redefining-the-premier-league
- Tenga et al. (2010) J Sports Sci – playing tactics & goal scoring: https://pubmed.ncbi.nlm.nih.gov/20391095/
- Lago-Peñas & Dellal / Lago (2009) – match status & possession: https://doi.org/10.1080/02640410903131681
- Vecer – Crossing has a strong negative impact on scoring: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2225728
- Bauer & Anzer – Data-driven detection of counterpressing: https://www.researchgate.net/publication/353102488
- StatsBomb – Actions under pressure: https://blogarchive.statsbomb.com/articles/soccer/statsbomb-data-case-studies-actions-under-pressure/
- StatsBomb – Defensive metrics / PPDA: https://statsbomb.com/articles/soccer/defensive-metrics-measuring-the-intensity-of-a-high-press/
- UCL running when scoring/conceding (BMC SSMR 2025): https://pmc.ncbi.nlm.nih.gov/articles/PMC11874785/
- Decline in running performance & game interruptions (Bundesliga): https://www.researchgate.net/publication/329247433
- Variations in high-intensity running and fatigue: https://www.researchgate.net/publication/299598558
- Match phase & HSR peak periods (J Sports Sci 2026): https://www.tandfonline.com/doi/full/10.1080/02640414.2026.2632514
- FIFA Training Centre – WC2022 technical overview: https://www.fifatrainingcentre.com/en/fwc2022/technical-and-tactical-analysis/technical-tactical-overview.php
- Aerial duel Elo (IJPAS): https://www.tandfonline.com/doi/full/10.1080/24748668.2024.2420458
- Pitch configurations SSG (IJERPH 2021): https://www.mdpi.com/1660-4601/18/19/10500
- Planet Football – Liverpool offside trap: https://www.planetfootball.com/in-depth/liverpool-jurgen-klopp-offside-trap-high-line-defence-var-genius-chelsea-burnley
- The Mastermind – Dyche Burnley analyses: https://themastermindsite.com/2020/05/04/sean-dyche-burnley-tactical-analysis/ , https://themastermindsite.com/2021/02/25/sean-dyche-burnley-tactical-analysis-2020-21-edition/
- Coaches' Voice – Low block explained: https://learning.coachesvoice.com/cv/low-block-football-tactics-explained-simeone-dyche-mourinho/
- Total Football Analysis – Breaking a low block: https://totalfootballanalysis.com/article/tactical-theory-successfully-break-low-block-tactical-analysis-tactics
- SoccerTutor – De Zerbi baiting the press: https://www.soccertutor.com/blogs/inside-football-coaching/de-zerbis-tactics-bait-the-press-build-up-play
- The Football Analyst – High backline: https://the-footballanalyst.com/defending-with-a-high-backline-football-tactics-explained/
- Guide to Football – Offside trap: https://guidetofootball.com/tactics/offside-trap/
- SI – long ball accuracy (Opta): https://www.si.com/soccer/2018/11/23/surprising-statistics-reveal-chelsea-and-manchester-city-best-long-ball-premier-league-sides
- Sofascore – Leicester 2015/16: https://www.sofascore.com/news/on-this-day-10-years-ago-leicester-won-the-premier-league-title
- PPDA 二次資料: https://kiqiq.com/ppda-football/ , https://matchengine.pro/blog/ppda-football-meaning
- Direct speed: https://www.andrewbeasleyfootball.com/p/which-is-the-fastest-team-in-the-premier-league
- Sterile possession: https://www.3dmigoto.com/2013-14-premier-league-sterile-possession-analysis/
- Sportmonks – aerial duels: https://www.sportmonks.com/glossary/aerial-duels-won/
