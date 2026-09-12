#!/usr/bin/env python3
# 生成《复刻总览.html》——可视化浏览 24 个工具的截图与结构
import json, os

BASE = "/Users/nidie/Documents/ChatGPT/错题本/review_jiaoshiai"
spec = json.load(open(os.path.join(BASE, "复刻规格.json"), encoding="utf-8"))
tools = spec["tools"]
data_js = json.dumps(tools, ensure_ascii=False)

html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>教师AI赋能站 · 复刻总览</title>
<style>
  :root{
    --bg:#f6f7f9; --panel:#ffffff; --ink:#1a1d21; --muted:#6b7280;
    --line:#e5e7eb; --brand:#e2564a; --brand-soft:#fdf0ee; --chip:#f3f4f6;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:-apple-system,"PingFang SC","Helvetica Neue",Arial,sans-serif;line-height:1.6}
  header{background:var(--panel);border-bottom:1px solid var(--line);padding:28px 32px 22px}
  h1{margin:0 0 6px;font-size:24px;letter-spacing:-.2px}
  .sub{color:var(--muted);font-size:13px}
  .stats{display:flex;gap:22px;margin-top:18px;flex-wrap:wrap}
  .stat b{display:block;font-size:22px;color:var(--brand);line-height:1.2}
  .stat span{font-size:12px;color:var(--muted)}
  main{padding:22px 32px 60px;max-width:1400px;margin:0 auto}
  .filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
  .filters button{border:1px solid var(--line);background:var(--panel);color:var(--ink);
    padding:7px 15px;border-radius:999px;font-size:13px;cursor:pointer;transition:.15s}
  .filters button:hover{border-color:var(--brand)}
  .filters button.on{background:var(--brand);border-color:var(--brand);color:#fff}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;
    overflow:hidden;display:flex;flex-direction:column;transition:.18s}
  .card:hover{box-shadow:0 6px 22px rgba(0,0,0,.07);transform:translateY(-2px)}
  .thumb{background:#eef0f3;border-bottom:1px solid var(--line);height:180px;overflow:hidden;
    display:flex;align-items:flex-start;justify-content:center;cursor:zoom-in}
  .thumb img{width:100%;display:block}
  .body{padding:14px 16px 16px;flex:1;display:flex;flex-direction:column}
  .meta{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted);margin-bottom:6px}
  .mod{background:var(--chip);border-radius:5px;padding:1px 7px;font-weight:600;color:#374151}
  .pts{background:var(--brand-soft);color:var(--brand);border-radius:5px;padding:1px 7px;font-weight:600}
  h3{margin:2px 0 4px;font-size:16px}
  .lead{font-size:13px;color:#374151;margin:0 0 4px}
  .desc{font-size:12px;color:var(--muted);margin:0 0 10px}
  .path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--muted);
    background:var(--chip);padding:3px 7px;border-radius:5px;display:inline-block;margin-bottom:10px}
  details{margin-top:auto;border-top:1px dashed var(--line);padding-top:8px}
  summary{cursor:pointer;font-size:12px;color:var(--brand);font-weight:600;list-style:none}
  summary::-webkit-details-marker{display:none}
  summary:before{content:"▸ ";}
  details[open] summary:before{content:"▾ ";}
  .sec{margin-top:10px}
  .sec h4{margin:0 0 5px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px}
  table{width:100%;border-collapse:collapse;font-size:11.5px}
  td{border-bottom:1px solid var(--line);padding:4px 4px;vertical-align:top;color:#374151}
  td:first-child{white-space:nowrap;color:var(--muted);padding-right:8px}
  .tags{display:flex;flex-wrap:wrap;gap:4px}
  .tag{background:var(--chip);border-radius:5px;padding:1px 6px;font-size:11px;color:#374151}
  .tag.on{background:var(--brand);color:#fff}
  .flow{font-size:11.5px;color:#374151;background:var(--chip);border-radius:6px;padding:7px 9px}
  #lb{position:fixed;inset:0;background:rgba(12,14,17,.9);display:none;z-index:99;
    align-items:center;justify-content:center;padding:3vh 3vw;cursor:zoom-out}
  #lb img{max-width:100%;max-height:94vh;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.5)}
  footer{padding:20px 32px;color:var(--muted);font-size:12px;text-align:center}
</style>
</head>
<body>
<header>
  <h1>教师AI赋能站 · 复刻总览</h1>
  <div class="sub">复刻对象 <b>jiaoshiai.top/#workbench</b>　·　抓取日期 2026-09-12　·　全站 24 个工具页逐页存档（未触发生成、未消耗积分）</div>
  <div class="stats">
    <div class="stat"><b>24</b><span>工具模块</span></div>
    <div class="stat"><b>3</b><span>工作板块</span></div>
    <div class="stat"><b>24</b><span>整页截图</span></div>
    <div class="stat"><b>105</b><span>抓取后积分余额</span></div>
  </div>
</header>
<main>
  <div class="filters" id="filters"></div>
  <div class="grid" id="grid"></div>
</main>
<footer>存档目录 review_jiaoshiai/ ：复刻总纲.md · 复刻规格.json · pages/&lt;key&gt;/（snapshot / dom / screenshot / pdf）</footer>
<div id="lb"><img id="lbimg" alt=""></div>
<script>
const TOOLS = __DATA__;
const CATS = [["全部"], ["AI赋能教师提效"], ["AI赋能教学提分"], ["AI赋能教培增长"]];
const grid = document.getElementById('grid');
const filters = document.getElementById('filters');
let cur = '全部';

CATS.forEach((c,i)=>{
  const b=document.createElement('button');
  b.textContent = c[0] + (c[0]==='全部' ? ' ('+TOOLS.length+')' : ' ('+TOOLS.filter(t=>t.板块===c[0]).length+')');
  b.className = i===0?'on':'';
  b.onclick=()=>{cur=c[0];[...filters.children].forEach(x=>x.classList.remove('on'));b.classList.add('on');render();};
  filters.appendChild(b);
});

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}

function render(){
  grid.innerHTML='';
  TOOLS.filter(t=>cur==='全部'||t.板块===cur).forEach(t=>{
    const c=document.createElement('div'); c.className='card';
    let fieldRows = (t.输入字段||[]).map(f=>{
      const opts = f.选项 ? '　选项：'+f.选项.slice(0,14).map(esc).join('、')+(f.选项.length>14?' …':'') : '';
      return `<tr><td>${esc(f.控件)}/${esc(f.类型||'-')}</td><td>${esc(f.提示||f.名称||'—')}${opts}</td></tr>`;
    }).join('');
    const btns = (t.操作按钮||[]).map(b=>`<span class="tag">${esc(b)}</span>`).join('');
    const mode = (t.模式切换||[]).length ? `<div class="sec"><h4>模式切换</h4><div class="tags">${t.模式切换.map(m=>`<span class="tag on">${esc(m)}</span>`).join('')}</div></div>` : '';
    const flowTxt = (t.结果区结构||[]).join('　→　');
    const flow = (t.结果区结构||[]).length ? `<div class="sec"><h4>结果区结构</h4><div class="flow">${esc(flowTxt)}</div></div>` : '';

    c.innerHTML = `
      <div class="thumb"><img loading="lazy" src="pages/${t.key}/screenshot.png" alt="${esc(t.名称)}截图"></div>
      <div class="body">
        <div class="meta"><span class="mod">MODULE / ${esc(t.编号)}</span><span class="pts">${esc(t.积分)} 积分</span><span>${esc(t.板块)}</span></div>
        <h3>${esc(t.名称)}</h3>
        <p class="lead">${esc(t.副标题)}</p>
        <p class="desc">${esc(t.一句话说明)}</p>
        <div class="path">${esc(t.路径)}</div>
        <details>
          <summary>复刻细节：字段 / 按钮 / 模式 / 结果结构</summary>
          ${mode}
          ${(t.输入字段||[]).length?`<div class="sec"><h4>输入区字段</h4><table>${fieldRows}</table></div>`:''}
          ${(t.操作按钮||[]).length?`<div class="sec"><h4>操作按钮</h4><div class="tags">${btns}</div></div>`:''}
          ${flow}
        </details>
      </div>`;
    grid.appendChild(c);
  });
}
render();

document.getElementById('grid').addEventListener('click',e=>{
  if(e.target.tagName==='IMG'){document.getElementById('lbimg').src=e.target.src;document.getElementById('lb').style.display='flex';}
});
document.getElementById('lb').onclick=()=>document.getElementById('lb').style.display='none';
</script>
</body>
</html>
"""

html = html.replace("__DATA__", data_js)
with open(os.path.join(BASE, "复刻总览.html"), "w", encoding="utf-8") as fh:
    fh.write(html)
print("已生成 复刻总览.html")
