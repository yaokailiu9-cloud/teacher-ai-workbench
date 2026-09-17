"""Static completeness check for the local replica."""
from pathlib import Path
import re
import json

root = Path(__file__).parent
js = (root / "app.js").read_text()
required = {f"{n:02d}" for n in [1,2,3,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]}
tool_block = js.split("const groups=", 1)[0]
tools = set(re.findall(r"\['(\d{2})'", tool_block))
playbooks = set(re.findall(r"'(\d{2})':\[", js))
assert tools == required, f"tool ids mismatch: {sorted(tools ^ required)}"
assert playbooks == required, f"playbook ids mismatch: {sorted(playbooks ^ required)}"
for filename in ("index.html", "styles.css", "app.js", "README.md", "verify.py", "PRODUCT_SPEC.md"):
    path = root / filename
    assert path.exists() and path.stat().st_size > 0, f"missing artifact: {filename}"
assert "id=\"app\"" in (root / "index.html").read_text()
assert "python3 -m http.server 4173" in (root / "README.md").read_text()
spec = (root / "PRODUCT_SPEC.md").read_text()
assert "高中数学" in spec and "六个维度" in spec
agent_js = (root / "agent-config.js").read_text()
learning_js = (root / "learning-core.js").read_text()
for tool_id in ("02", "07", "17", "18", "19", "20", "21"):
    assert f"'{tool_id}':" in agent_js, f"missing agent profile: {tool_id}"
assert "chatAgent" in learning_js and "prepareFiles" in learning_js and "subjectRule" in learning_js
assert (root / "SEVEN_TOOL_AUDIT.md").exists(), "missing seven-tool audit"
site_data = json.loads((root / "sites.json").read_text())
assert len(site_data.get("sites", [])) == 24, "site catalog must contain 24 tools"
hero = root / "assets" / "hero-knowledge-infrastructure.png"
assert hero.exists() and hero.stat().st_size > 100_000, "missing hero image asset"
print(f"OK: {len(tools)} tools, {len(playbooks)} playbooks, 6 artifacts")
