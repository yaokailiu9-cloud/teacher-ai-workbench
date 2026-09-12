#!/usr/bin/env python3
"""Parse review_jiaoshiai/pages/*/snapshot.txt accessibility trees into a
renderable JSON spec (spec.js). Credit/redeem UI is stripped per product
decision: the local build has no points system."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES = ROOT / "pages"
OUT = ROOT.parent / "spec.js"

LINE = re.compile(
    r'^(?P<indent>\s*)- (?P<role>[A-Za-z]+)'
    r'(?: "(?P<name>(?:[^"\\]|\\.)*)")?'
    r'(?: \[(?P<attrs>[^\]]*)\])?'
    r'(?: (?P<flags>clickable.*|active.*))?'
    r'(?:: (?P<value>.*))?$'
)

# Anything that belongs to the points/redeem system is out of scope.
CREDIT = re.compile(r'积分|兑换|TAI-|123321|余额')


def parse_attrs(raw):
    out = {}
    if not raw:
        return out
    for part in raw.split(', '):
        if '=' in part:
            k, v = part.split('=', 1)
            out[k] = v
        else:
            out[part] = True
    return out


def parse_snapshot(text):
    root = {"r": "root", "c": []}
    stack = [(-1, root)]
    for raw in text.splitlines():
        if not raw.strip():
            continue
        m = LINE.match(raw)
        if not m:
            # Continuation/plain text line: attach to current node as text.
            depth = (len(raw) - len(raw.lstrip())) // 2
            node = {"r": "StaticText", "n": raw.strip(), "c": []}
            while stack and stack[-1][0] >= depth:
                stack.pop()
            stack[-1][1]["c"].append(node)
            continue
        depth = len(m.group('indent')) // 2
        attrs = parse_attrs(m.group('attrs'))
        node = {"r": m.group('role'), "c": []}
        if m.group('name'):
            node["n"] = m.group('name').replace('\\"', '"')
        if m.group('value'):
            node["v"] = m.group('value')
        if 'level' in attrs:
            node["l"] = int(attrs['level'])
        if attrs.get('selected'):
            node["sel"] = 1
        if attrs.get('checked') in (True, 'true'):
            node["chk"] = 1
        while stack and stack[-1][0] >= depth:
            stack.pop()
        stack[-1][1]["c"].append(node)
        stack.append((depth, node))
    return root


def is_credit(node):
    name = node.get("n", "") + node.get("v", "")
    return bool(CREDIT.search(name))


def strip_nodes(node):
    """Drop banner, dialogs, and credit/redeem UI; prune empty wrappers."""
    kept = []
    for child in node.get("c", []):
        role = child["r"]
        if role in ("banner", "dialog", "contentinfo"):
            continue
        if role in ("button", "link", "textbox", "LabelText", "StaticText",
                    "heading", "paragraph", "generic") and is_credit(child):
            # Only drop leaf-ish credit UI, not containers with other content.
            non_credit_kids = [k for k in child.get("c", []) if not is_credit(k)]
            has_form = any(
                g["r"] in ("combobox", "textbox", "checkbox", "button")
                and not is_credit(g)
                for g in walk(child)
            )
            if not has_form or role in ("button", "link", "textbox"):
                continue
            child = dict(child, c=non_credit_kids)
        strip_nodes(child)
        kept.append(child)
    node["c"] = kept
    return node


def walk(node):
    for child in node.get("c", []):
        yield child
        yield from walk(child)


def main():
    meta = json.loads((ROOT / "复刻规格.json").read_text())
    tools = {t["key"]: t for t in meta["tools"]}
    pages = {}
    for d in sorted(PAGES.iterdir()):
        snap = d / "snapshot.txt"
        if not snap.exists():
            continue
        tree = strip_nodes(parse_snapshot(snap.read_text()))
        t = tools.get(d.name, {})
        pages[d.name] = {
            "id": t.get("编号"),
            "name": t.get("名称"),
            "tagline": t.get("副标题"),
            "desc": t.get("一句话说明"),
            "group": t.get("板块"),
            "tree": tree,
        }
        n_fields = sum(1 for x in walk(tree)
                       if x["r"] in ("combobox", "textbox", "checkbox", "spinbutton"))
        n_buttons = sum(1 for x in walk(tree) if x["r"] == "button")
        print(f"{d.name:22s} fields={n_fields:3d} buttons={n_buttons:3d}")
    payload = json.dumps(pages, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text("window.TOOL_PAGES=" + payload + ";\n")
    print(f"\nwrote {OUT} ({OUT.stat().st_size // 1024} KB, {len(pages)} pages)")


if __name__ == "__main__":
    main()
