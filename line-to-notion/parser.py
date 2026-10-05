"""LINE（Mac）のトーク履歴txtを、メッセージ単位に分解する。"""
import hashlib
import re
from dataclasses import dataclass
from datetime import datetime

DATE_RE = re.compile(r"^(\d{4})/(\d{1,2})/(\d{1,2})\([^)]*\)\s*$")
MSG_RE = re.compile(r"^(\d{1,2}):(\d{2})\t([^\t]*)\t(.*)$")
TITLE_RE = re.compile(r"^\[LINE\]\s*(.+?)(?:とのトーク履歴|のトーク履歴)\s*$")


@dataclass
class Message:
    talk: str
    sent_at: datetime
    sender: str
    body: str

    @property
    def uid(self) -> str:
        key = f"{self.talk}|{self.sent_at.isoformat()}|{self.sender}|{self.body}"
        return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


def parse(text: str, talk: str | None = None) -> list[Message]:
    messages: list[Message] = []
    current_date = None
    for raw in text.splitlines():
        line = raw.rstrip("\r")
        if talk is None and (m := TITLE_RE.match(line)):
            talk = m.group(1)
            continue
        if m := DATE_RE.match(line):
            current_date = tuple(int(x) for x in m.groups())
            continue
        if current_date and (m := MSG_RE.match(line)):
            h, mi, sender, body = m.groups()
            sent = datetime(*current_date, int(h), int(mi))
            messages.append(Message(talk or "unknown", sent, sender, body.strip('"')))
        elif messages and line and current_date:
            # 複数行メッセージの続き
            messages[-1].body += "\n" + line.strip('"')
    return messages
