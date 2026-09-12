#!/usr/bin/env python3
# 把抓取到的 24 个页面 dom.json 汇总成一份结构化复刻规格
import json, os

BASE = "/Users/nidie/Documents/ChatGPT/错题本/review_jiaoshiai"
SITES = json.load(open(os.path.join(BASE, "api_sites.json")))["sites"]
ORDER = [s["key"] for s in SITES]

CATEGORY_NAME = {
    "teacher-efficiency": "AI赋能教师提效",
    "teaching-score": "AI赋能教学提分",
    "training-enrollment": "AI赋能教培增长",
}


def load(key):
    p = os.path.join(BASE, "pages", key, "dom.json")
    if not os.path.exists(p):
        return {}
    try:
        return json.loads(json.load(open(p))["data"]["result"])
    except Exception:
        return {}


out = {"site": "https://jiaoshiai.top/", "title": "教师AI赋能站", "categories": {}, "tools": []}

for s in SITES:
    d = load(s["key"])
    fields = []
    for f in (d.get("fields") or []):
        if f.get("tag") == "INPUT" and f.get("type") in ("file", "hidden"):
            continue
        item = {
            "控件": f.get("tag"),
            "类型": f.get("type") or "",
            "名称": f.get("name") or f.get("id") or "",
        }
        if f.get("placeholder"):
            item["提示"] = f["placeholder"]
        if f.get("options"):
            item["选项"] = f["options"]
        if f.get("required"):
            item["必填"] = True
        fields.append(item)

    buttons = [b for b in (d.get("buttons") or []) if b not in ("×", "□", "选择文件")]

    tool = {
        "编号": s["index"],
        "key": s["key"],
        "名称": s["name"],
        "副标题": s["label"],
        "一句话说明": s["description"],
        "板块": CATEGORY_NAME.get(s["category"], s["category"]),
        "路径": s["href"],
        "积分": s.get("pointsPerUse", 1),
        "页面标题": d.get("title", ""),
        "输入字段": fields,
        "操作按钮": buttons,
        "模式切换": [t for t in (d.get("tabs") or [])][:16],
        "结果区结构": [h for h in (d.get("headings") or [])][:14],
    }
    out["tools"].append(tool)
    cat = CATEGORY_NAME.get(s["category"], s["category"])
    out["categories"].setdefault(cat, []).append({"编号": s["index"], "名称": s["name"], "路径": s["href"], "积分": s.get("pointsPerUse", 1)})

with open(os.path.join(BASE, "复刻规格.json"), "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=2)

print("已生成 复刻规格.json")
print("工具数:", len(out["tools"]))
for c, items in out["categories"].items():
    print(" ", c, len(items), "个")
