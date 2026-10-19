"""dungeon/page.html を base64 にして village-live.html の <!--DGN-BEGIN-->…<!--DGN-END--> の間に埋め込む。
ゲームを直したら: python3 tools/embed_dungeon.py（chiikawa-village で実行）"""
import base64, pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
b64 = base64.b64encode((root / 'dungeon' / 'page.html').read_bytes()).decode()
live = root / 'village-live.html'
s = live.read_text(encoding='utf8')
new = '<!--DGN-BEGIN--><script type="text/plain" id="dgnSrc">' + b64 + '</script><!--DGN-END-->'
s2, n = re.subn(r'<!--DGN-BEGIN-->.*?<!--DGN-END-->', lambda m: new, s, flags=re.S)
if n != 1:
    sys.exit('markers not found exactly once')
live.write_text(s2, encoding='utf8')
print('embedded', len(b64), 'bytes')
