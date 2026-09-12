#!/bin/zsh
# 逐页复刻 jiaoshiai.top 的 24 个工具页
export PATH="/Users/nidie/.workbuddy/binaries/node/versions/22.22.2/bin:$PATH"
BASE="/Users/nidie/Documents/ChatGPT/错题本/review_jiaoshiai"
OUT="$BASE/pages"
mkdir -p "$OUT"

JS='(()=>{const q=s=>[...document.querySelectorAll(s)];return JSON.stringify({url:location.href,title:document.title,headings:q("h1,h2,h3,h4").map(e=>e.textContent.trim()).filter(Boolean),labels:q("label").map(e=>e.textContent.trim()).filter(Boolean),fields:q("input,textarea,select").map(e=>({tag:e.tagName,type:e.type||"",name:e.name||"",id:e.id||"",placeholder:e.placeholder||"",required:!!e.required,multiple:!!e.multiple,options:e.tagName==="SELECT"?[...e.options].map(o=>o.textContent.trim()):null})),buttons:q("button").map(e=>e.textContent.trim()).filter(Boolean),links:q("a").map(e=>e.textContent.trim()).filter(Boolean).slice(0,40),radios:q("input[type=radio]").map(e=>({name:e.name,value:e.value,checked:e.checked,label:(e.closest("label")||{}).textContent||""})),tabs:q("[role=tab],[role=radiogroup] label,.tab,.mode,.seg-item").map(e=>e.textContent.trim()).filter(Boolean).slice(0,40),text:document.body.innerText.replace(/\n{3,}/g,"\n\n").slice(0,6000)})})()'

APPS=(ai-exam post-exam study-material teaching-aid-maker exam-ppt wrong-question word-layout ai-prep score-space loss-diagnosis wrong-attribution knowledge-gap exam-score-boost question-card action-plan question-review solution-stepper score-point error-diagnosis question-sense variant-exam lesson-preview class-notes homework-grader)

echo "开始抓取 ${#APPS[@]} 个页面"
i=0
for k in $APPS; do
  i=$((i+1))
  d="$OUT/$k"
  mkdir -p "$d"
  echo "[$i] $k ..."
  agent-browser open "https://jiaoshiai.top/apps/$k/" >/dev/null 2>&1
  sleep 4
  agent-browser get url > "$d/url.txt" 2>&1
  agent-browser snapshot > "$d/snapshot.txt" 2>&1
  agent-browser eval "$JS" --json 2>/dev/null > "$d/dom.json"
  agent-browser screenshot "$d/screenshot.png" >/dev/null 2>&1
  agent-browser pdf "$d/page.pdf" >/dev/null 2>&1
  echo "    完成: $(head -c 120 "$d/url.txt")"
done
echo "全部抓取结束"
