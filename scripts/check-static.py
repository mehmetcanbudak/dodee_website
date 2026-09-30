"""Check the complete static site using only Python's standard library."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
errors = []


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.refs = path, set(), []
        self.counts = {}
        self.description = self.title = self.lang = False
        self.labels, self.controls = [], []
        self.feed(path.read_text())

    def error(self, message):
        errors.append(f"{self.path.name}: {message}")

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.counts[tag] = self.counts.get(tag, 0) + 1
        identifier = attrs.get("id")
        if identifier:
            if identifier in self.ids:
                self.error(f"duplicate id {identifier}")
            self.ids.add(identifier)
        if tag == "html":
            self.lang = bool(attrs.get("lang"))
        if tag == "title":
            self.title = True
        if tag == "meta" and attrs.get("name") == "description":
            self.description = bool(attrs.get("content"))
        if tag == "img" and "alt" not in attrs:
            self.error(f"image missing alt: {attrs.get('src')}")
        if tag == "iframe" and not attrs.get("title"):
            self.error("iframe missing title")
        if tag == "script" and not attrs.get("src") and attrs.get("type") != "application/ld+json":
            self.error("inline script would violate Content-Security-Policy")
        if tag == "a" and attrs.get("target") == "_blank":
            if not set(attrs.get("rel", "").split()) & {"noopener", "noreferrer"}:
                self.error(f"new-window link missing noopener: {attrs.get('href')}")
        if tag == "label" and attrs.get("for"):
            self.labels.append(attrs["for"])
        for attribute in ("aria-labelledby", "aria-describedby", "aria-controls"):
            for target in attrs.get(attribute, "").split():
                self.refs.append((f"#{target}", attribute))
        for attribute in ("src", "href"):
            if attribute in attrs:
                self.refs.append((attrs[attribute], attribute))

    def handle_startendtag(self, tag, attributes):
        self.handle_starttag(tag, attributes)


pages = {path: Page(path) for path in sorted(ROOT.glob("*.html"))}
for path, page in pages.items():
    if page.counts.get("h1") != 1 or page.counts.get("main") != 1:
        page.error("expected one h1 and one main landmark")
    if not all((page.title, page.description, page.lang)):
        page.error("missing title, description or document language")
    for label in page.labels:
        if label not in page.ids:
            page.error(f"label refers to missing control #{label}")
    for reference, kind in page.refs:
        url = urlsplit(reference)
        if url.scheme or url.netloc:
            if url.scheme.lower() == "javascript":
                page.error("javascript URL is not allowed")
            continue
        target = (ROOT / unquote(url.path.lstrip("/")) if url.path.startswith("/") else path.parent / unquote(url.path)) if url.path else path
        if target.is_dir():
            target /= "index.html"
        target = target.resolve()
        if not target.is_relative_to(ROOT) or not target.is_file():
            page.error(f"missing local {kind}: {reference}")
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            page.error(f"missing fragment: {reference}")

for css in (ROOT / "css").glob("*.css"):
    for url in re.findall(r'url\(\s*[\"\']?([^\"\')]+)', css.read_text()):
        if not urlsplit(url).scheme and not (css.parent / unquote(url)).is_file():
            errors.append(f"{css.name}: missing CSS asset {url}")

for script in (ROOT / "js").glob("*.js"):
    result = subprocess.run(["node", "--check", str(script)], capture_output=True, text=True)
    if result.returncode:
        errors.append(result.stderr)
    for imported in re.findall(r'from\s+[\"\'](\.[^\"\']+)', script.read_text()):
        if not (script.parent / imported).is_file():
            errors.append(f"{script.name}: missing import {imported}")

sitemap = ET.parse(ROOT / "sitemap.xml")
listed = {urlsplit(element.text).path for element in sitemap.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
expected = {"/" if path.name == "index.html" else f"/{path.name}" for path in pages}
if listed != expected:
    errors.append(f"sitemap differs from public pages: {listed ^ expected}")

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"Checked {len(pages)} pages: metadata, landmarks, IDs, references, assets, JavaScript syntax and sitemap.")
