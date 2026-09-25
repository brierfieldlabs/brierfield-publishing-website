from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"

if not INDEX.is_file():
    raise SystemExit("index.html is missing")

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {"img", "script"} and attrs.get("src"):
            self.refs.append(attrs["src"])
        if tag == "link" and attrs.get("href"):
            self.refs.append(attrs["href"])

html = INDEX.read_text(encoding="utf-8")
if "file://" in html or "127.0.0.1" in html or "localhost" in html:
    raise SystemExit("index.html contains a local-only URL")

parser = Parser()
parser.feed(html)
missing = []
for ref in parser.refs:
    parsed = urlparse(ref)
    if parsed.scheme or ref.startswith("//") or ref.startswith("#") or ref.startswith("data:"):
        continue
    rel = parsed.path.lstrip("/")
    if not rel:
        continue
    if not (ROOT / rel).is_file():
        missing.append(ref)

if missing:
    raise SystemExit("Missing referenced assets: " + ", ".join(missing))

required = [
    "assets/logo-horizontal-transparent.png",
    "assets/the-last-photograph.jpg",
    "assets/parish-council.png",
    "assets/noodle-and-me.jpg",
]
for rel in required:
    if not (ROOT / rel).is_file():
        raise SystemExit(f"Required asset missing: {rel}")

print(f"Site validation passed: {len(parser.refs)} local/external asset references checked.")