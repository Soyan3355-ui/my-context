#!/usr/bin/env python3
"""会話ログ（~/.claude/projects 以下の *.jsonl と subagents/*.jsonl）から、トークンの使用量を日本時間の日付ごとに集計する。
使い方: python3 token_report.py [日数=3]  → JSON を標準出力に出す（画面の db の tokens/now に入れる）
数え方: output = 出力、fresh = 新しく読んだ入力（キャッシュの新規書き込みを含む）、cacheRead = キャッシュからの読み出し（軽い）
契約の上限に対する残りは、ここからは分からない（画面に目安の予算を入れて、それとくらべる）。"""
import json,glob,os,sys,datetime
days=int(sys.argv[1]) if len(sys.argv)>1 else 3
JST=datetime.timezone(datetime.timedelta(hours=9))
root=os.path.expanduser('~/.claude/projects')
seen=set();acc={}
now=datetime.datetime.now(JST);since=(now-datetime.timedelta(days=days-1)).strftime('%Y-%m-%d')
for f in glob.glob(root+'/**/*.jsonl',recursive=True):
    sub='/subagents/' in f
    try:
        for l in open(f,encoding='utf-8'):
            if '"usage"' not in l: continue
            try: d=json.loads(l)
            except Exception: continue
            m=d.get('message') or {}
            u=m.get('usage')
            if not u: continue
            key=m.get('id') or d.get('requestId') or d.get('uuid')
            if key in seen: continue
            seen.add(key)
            ts=d.get('timestamp')
            if not ts: continue
            day=datetime.datetime.fromisoformat(ts.replace('Z','+00:00')).astimezone(JST).strftime('%Y-%m-%d')
            if day<since: continue
            a=acc.setdefault(day,{'output':0,'fresh':0,'cacheRead':0,'calls':0,'sub':0,'byModel':{}})
            o=u.get('output_tokens',0);fr=u.get('input_tokens',0)+u.get('cache_creation_input_tokens',0);cr=u.get('cache_read_input_tokens',0)
            a['output']+=o;a['fresh']+=fr;a['cacheRead']+=cr;a['calls']+=1
            if sub: a['sub']+=o+fr
            mm=a['byModel'].setdefault(m.get('model','?'),{'output':0,'fresh':0});mm['output']+=o;mm['fresh']+=fr
    except Exception: pass
out={'at':int(now.timestamp()*1000),'days':{k:acc[k] for k in sorted(acc)}}
print(json.dumps(out,ensure_ascii=False))
