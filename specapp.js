/* Data-driven tool pages rendered from window.TOOL_PAGES (spec.js).
   Each page is an accessibility tree captured from the reference build;
   this file maps roles to HTML and wires demo interactions. */
(() => {
const PAGES = window.TOOL_PAGES || {};
const IDMAP = {};
for (const key of Object.keys(PAGES)) IDMAP[PAGES[key].id] = key;

const GENERATE = /^(生成|开始|拆解|批改|评测|诊断|重排|输出|制作|分析|一键|提交|立即)/;
const RESULT_HINT = /等待|将在这里|先建立|尚未|暂无|上传.*后|从左侧|开始配置/;
const FILE_PICKER = /(?:选择文件|添加图片素材|添加[^\n]{0,8}素材|批量上传|上传(?:错题|题目|试卷|完整试卷|资料|文件))/;
const DROP_PICKER = /(?:点击或拖拽|拖拽文件|添加图片素材|批量上传|上传完整试卷)/;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* The reference pages use an icon font; its ligature names were captured as
   plain text ("tune", "arrow_forward", "数学calculate"). Strip them. */
const ICON_TOKENS = /(arrow_forward|arrow_back|upload_file|history_edu|menu_book|picture_as_pdf|photo_camera|check_circle|swap_horiz|imagesmode|hourglass_empty|task_alt|autorenew|analytics|insights|description|calculate|translate|settings|download|science|biotech|refresh|school|public|search|gavel|tune|eco|edit|add|close|check|star|info)/g;
const stripIcons = s => String(s ?? '').replace(ICON_TOKENS, '').replace(/\s{2,}/g, ' ').trim();
const ARROW_ONLY = /^[→←↑↓⌫↗↘↖\s]+$/;

function isControl(n) {
  return ['combobox', 'textbox', 'spinbutton', 'checkbox'].includes(n.r);
}

function renderOptions(node) {
  let html = '';
  for (const c of node.c || []) {
    if (c.r === 'MenuListPopup') { html += renderOptions(c); continue; }
    if (c.r === 'group') {
      html += `<optgroup label="${esc(c.n)}">${renderOptions(c)}</optgroup>`;
    } else if (c.r === 'option') {
      html += `<option${c.sel ? ' selected' : ''}>${esc(c.n)}</option>`;
    }
  }
  return html;
}

function control(node) {
  if (node.r === 'combobox') {
    return `<select aria-label="${esc(node.n)}">${renderOptions(node)}</select>`;
  }
  if (node.r === 'spinbutton') {
    return `<input type="number" aria-label="${esc(node.n)}" value="${esc(node.v || '')}">`;
  }
  if (node.r === 'textbox') {
    const ph = esc(node.n || '');
    const long = (node.n || '').length > 14 || /补充|说明|要求|粘贴|描述|备注/.test(node.n || '');
    return long
      ? `<textarea placeholder="${ph}">${esc(node.v || '')}</textarea>`
      : `<input type="text" placeholder="${ph}" value="${esc(node.v || '')}">`;
  }
  if (node.r === 'checkbox') {
    return `<label class="spec-check"><input type="checkbox"${node.chk ? ' checked' : ''}><span>${esc(node.n)}</span></label>`;
  }
  return '';
}

function render(node, parentRole) {
  const kids = () => renderSeq(node.c || [], node.r);
  switch (node.r) {
    case 'root': case 'main': return kids();
    case 'complementary': return `<aside class="spec-side">${kids()}</aside>`;
    case 'heading': {
      const l = Math.min(node.l || 2, 4);
      return `<h${l}>${esc(stripIcons(node.n))}${kids()}</h${l}>`;
    }
    case 'paragraph': return `<p>${node.n ? esc(stripIcons(node.n)) : ''}${kids()}</p>`;
    case 'StaticText': {
      const txt = stripIcons(node.n);
      if (!txt || ARROW_ONLY.test(txt)) return '';
      const blocky = ['root', 'main', 'complementary', 'region', 'group', 'generic', 'form'].includes(parentRole);
      return blocky ? `<span class="spec-text">${esc(txt)}</span>` : esc(txt);
    }
    case 'strong': return `<b>${kids()}</b>`;
    case 'emphasis': return `<em>${kids()}</em>`;
    case 'LabelText': return `<label class="spec-label">${kids()}</label>`;
    case 'combobox': case 'textbox': case 'spinbutton': case 'checkbox':
      return control(node);
    case 'button': {
      const name = stripIcons(node.n || '');
      if (!name && !(node.c || []).length) return '';
      const cls = GENERATE.test(name) ? 'spec-btn primary'
        : DROP_PICKER.test(name) ? 'spec-drop'
        : FILE_PICKER.test(name) ? 'spec-btn file'
        : 'spec-btn';
      const sub = node.v ? `<small>${esc(node.v)}</small>` : '';
      const body = node.c && node.c.length ? kids() : esc(name);
      return `<button type="button" class="${cls}" data-name="${esc(name)}">${body}${sub}</button>`;
    }
    case 'link': {
      const home = /返回主页|返回教师工作台/.test(node.n || '');
      return `<a class="spec-link${home ? ' back' : ''}" href="${home ? '#/' : '#'}">${node.c && node.c.length ? kids() : esc(node.n)}</a>`;
    }
    case 'image': return `<div class="spec-img" role="img" aria-label="${esc(node.n || '图示')}"><span>${esc(node.n || '图示')}</span></div>`;
    case 'list': return `<ul>${kids()}</ul>`;
    case 'listitem': return `<li>${kids()}</li>`;
    case 'table': return `<table>${kids()}</table>`;
    case 'rowgroup': return `<tbody>${kids()}</tbody>`;
    case 'row': return `<tr>${kids()}</tr>`;
    case 'columnheader': return `<th>${node.n ? esc(node.n) : kids()}</th>`;
    case 'cell': return `<td>${node.n ? esc(node.n) : kids()}</td>`;
    case 'sectionheader': return `<header class="spec-sectionhead">${kids()}</header>`;
    case 'article': return `<article class="spec-card">${kids()}</article>`;
    case 'form': return `<div class="spec-form">${kids()}</div>`;
    case 'region': case 'group': case 'generic': {
      const label = node.n ? ` data-label="${esc(node.n)}"` : '';
      return `<div class="spec-block"${label}>${kids()}</div>`;
    }
    case 'MenuListPopup': case 'option': return '';
    default: return kids();
  }
}

/* Merge "LabelText followed by its control" sibling pattern into one label. */
function renderSeq(children, parentRole) {
  let html = '';
  for (let i = 0; i < children.length; i++) {
    const cur = children[i];
    const next = children[i + 1];
    if (cur.r === 'LabelText' && !(cur.c || []).some(isControl) && next && isControl(next) && next.r !== 'checkbox') {
      html += `<label class="spec-label">${renderSeq(cur.c || [], 'LabelText')}${control(next)}</label>`;
      i++;
      continue;
    }
    html += render(cur, parentRole);
  }
  return html;
}

function hasResultHint(node) {
  if (node.r === 'heading' && RESULT_HINT.test(node.n || '')) return true;
  if (node.r === 'sectionheader') return true;
  return (node.c || []).some(hasResultHint);
}

/* Split top-level nodes into form column and result column. */
function splitColumns(tree) {
  // Flatten one wrapper level so complementary/main siblings line up.
  let nodes = [];
  for (const n of tree.c || []) {
    if (n.r === 'main') nodes.push(...(n.c || []));
    else if ((n.c || []).length === 1 && n.c[0].r === 'main') nodes.push(...(n.c[0].c || []));
    else nodes.push(n);
  }
  const asides = nodes.filter(n => n.r === 'complementary');
  if (asides.length) {
    // Pages like post-exam keep the whole form inside main: any block with
    // form controls belongs to the input column, not the result column.
    const leftNodes = nodes.filter(n => asides.includes(n) || hasFormControl(n));
    const rightNodes = nodes.filter(n => !leftNodes.includes(n));
    return { left: leftNodes, right: rightNodes };
  }
  const idx = nodes.findIndex(n => hasResultHint(n) && !hasFormControl(n));
  if (idx > 0) return { left: nodes.slice(0, idx), right: nodes.slice(idx) };
  // 无占位提示的页面（17/03/13/16/26 等）：把带“结果/报告/预览”类标题的区块作为结果列起点。
  const ridx = nodes.findIndex(n => !hasFormControl(n) && (function walk(node) {
    if (node.r === 'heading' && /(结果|报告|预览|地图|清单|讲评|笔记)/.test(node.n || '')) return true;
    return (node.c || []).some(walk);
  })(n));
  if (ridx > 0) return { left: nodes.slice(0, ridx), right: nodes.slice(ridx) };
  return { left: nodes, right: [] };
}

function hasFormControl(node) {
  if (isControl(node)) return true;
  return (node.c || []).some(hasFormControl);
}

function collectInputs(rootEl) {
  const out = [];
  const seen = new Set();
  rootEl.querySelectorAll('label.spec-label').forEach(lb => {
    const ctl = lb.querySelector('select,input,textarea');
    if (!ctl || ctl.type === 'file' || (ctl.type === 'checkbox' && !ctl.checked) || !ctl.value || /^--/.test(ctl.value)) return;
    const clone = lb.cloneNode(true);
    clone.querySelectorAll('select,input,textarea').forEach(x => x.remove());
    const text = clone.textContent.trim();
    if (text) { out.push([text, ctl.type === 'checkbox' ? '是' : ctl.value]); seen.add(ctl); }
  });
  rootEl.querySelectorAll('select[aria-label],input[aria-label],textarea[aria-label]').forEach(ctl => {
    if (seen.has(ctl) || ctl.type === 'file' || (ctl.type === 'checkbox' && !ctl.checked) || !ctl.value || /^--/.test(ctl.value)) return;
    out.push([ctl.getAttribute('aria-label'), ctl.type === 'checkbox' ? '是' : ctl.value]);
  });
  const chipValues = [...rootEl.querySelectorAll('button.chip.active')].map(btn => stripIcons(btn.dataset.name || btn.textContent));
  for (const value of chipValues) {
    let key = '选项';
    if (/^小学|初[\u4e00-三]|高[\u4e00-三]$/.test(value)) key = '年级';
    else if (/测验|月考|期中|期末|模拟/.test(value)) key = '考试类型';
    else if (window.LearningCore?.normalizeSubject(value)) key = '学科';
    out.push([key, value]);
  }
  return out;
}

const TOOL_RULES = {
  '02': '必须只根据上传试卷中可见的题号、批改、得分和作答证据分析。先校验本次得分≤卷面总分，得分率和可追回分必须可复算；看不清的题号要明示标注“证据不足”，不得虚构。',
  '17': '必须完整转录题干再拆解；任务词、限制条件、关键数据、隐藏条件、干扰信息、作答范围都必须引用原题证据。隐藏条件不可捏造新已知。',
  '18': '先识别题目学科与年级，再给出四步支架：读懂已知、确定方法、列式求解、检验作答。每步都要有“学生先做什么”和“检查点”，最后给完整答案。',
  '19': '根据题目总分建立可加总的评分点；结论、依据、推理步骤的分值合计不得超过总分。有学生答案时逐项引证判分，无学生答案时只生成评分标准，不得假装已评分。',
  '20': '以“第一个独立错误”为诊断核心，区分首错与后续连锁错误。错误证据必须引用学生原文；未提供学生作答时不能做个体错因定性，只能给出需要补充的证据。',
};

function buildPrompt(id, name, inputs, files, steps) {
  const fields = inputs.map(([key, value]) => `${key}：${value}`).join('\n');
  const fileHint = files.length ? `\n已实际读取的上传资料（顺序与图片/文档分片一致）：\n${files.map((file, index) => `${index + 1}. ${file}`).join('\n')}` : '';
  const rule = TOOL_RULES[id] ? `\n【本工具专用规则】${TOOL_RULES[id]}` : '';
  return `你是教师 AI 工作台的生成助手。请为“${name}”生成可直接使用的中文结果。\n输入字段：\n${fields || '无'}${fileHint}${rule}\n请按以下步骤组织输出：\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n所有判断必须区分“资料证据”与“教学建议”。只输出干净内容，不要输出 HTML、JavaScript、Markdown 标记或生成过程。涉及分数、上下标、根式、希腊字母、向量、化学式等公式时，使用语法完整且成对的 $...$ 标准 LaTeX。`;
}

function validateToolInput(id, inputs, files) {
  const value = key => inputs.find(([name]) => name.includes(key))?.[1] || '';
  if (id === '02') {
    if (!value('年级') || !value('考试类型') || !value('学科')) return '请先选择年级、考试类型和学科。';
    const score = Number(value('本次得分')), total = Number(value('卷面总分'));
    if (!(total > 0) || score < 0 || score > total) return '请检查得分：本次得分必须在 0 到卷面总分之间。';
  }
  if (['02', '17', '18', '19', '20'].includes(id) && !files.length) return '请先上传题目、试卷或学生作答资料。';
  return '';
}

/* Turn free-form generated text into the reference-style report layout:
   numbered/short heading lines open a .report-step card, the rest are
   paragraphs inside it. */
function reportSections(content) {
  const lines = String(content).replace(/\r/g, '').replace(/\*\*([^*\n]+)\*\*/g, '$1').replace(/^\s*#{1,6}\s+/gm, '').split('\n');
  const secs = []; let cur = null;
  const isHeading = s => {
    if (!s || /^[A-D][.、)]/.test(s)) return false;
    if (/^【[^】]+】$/.test(s)) return true;
    const numbered = /^[（(【]?[0-9①-⑩一二三四五六七八九十]{1,3}[)）、.．]/.test(s);
    if (numbered && s.length <= 26) return true;
    return /[\u4e00-\u9fa5]/.test(s) && s.length <= 16 && !/[。；，,！？!?;.：:]/.test(s);
  };
  for (const raw of lines) {
    const s = raw.trim();
    if (!s) continue;
    if (isHeading(s)) { cur = { head: s.replace(/[：:]\s*$/, '').replace(/^【|】$/g, ''), body: [] }; secs.push(cur); }
    else { if (!cur) { cur = { head: '', body: [] }; secs.push(cur); } cur.body.push(s); }
  }
  return secs.filter(x => x.head || x.body.length);
}

const BADGE_CLASS = {
  '已掌握': 'b-ok', '书写规范': 'b-mint', '掌握良好': 'b-ok',
  '有待补全': 'b-warn', '中等': 'b-warn', '及时处理': 'b-warn', '需要完善': 'b-warn',
  '严重': 'b-bad', '较重': 'b-bad', '优先处理': 'b-bad', '漏洞严重': 'b-bad',
  '较轻': 'b-info', '持续优化': 'b-info', '存在漏洞': 'b-warn',
};

function renderReportBody(content, id) {
  let html = '';
  if (id === '02') {
    const rate = content.match(/得分率[^0-9%]{0,8}([0-9.]+)\s*%/);
    const rec = content.match(/可追回[^\d]{0,4}([0-9.]+)\s*分/);
    const first = content.match(/第一优先动作[：:]?\s*([^\n]{4,60})/);
    if (rate || rec || first) {
      html += '<div class="report-metrics">' +
        (rate ? `<div class="metric"><small>得分率</small><b>${esc(rate[1])}%</b></div>` : '') +
        (rec ? `<div class="metric accent"><small>可追回分</small><b>${esc(rec[1])} 分</b></div>` : '') +
        (first ? `<div class="metric warn"><small>第一优先动作</small><span>${esc(first[1].trim())}</span></div>` : '') +
        '</div>';
    }
  }
  html += reportSections(content).map(s => {
    const statusRe = /(已掌握|有待补全|需要完善|书写规范|掌握良好|漏洞严重|存在漏洞|严重|较重|中等|较轻|优先处理|及时处理|持续优化)/;
    const badge = s.head.match(statusRe)?.[1] || s.body.join('').match(statusRe)?.[1];
    const cls = badge ? ` ${BADGE_CLASS[badge] || 'b-info'}` : '';
    const head = s.head ? `<h4>${esc(s.head)}${badge ? `<em class="report-badge${cls}">${esc(badge)}</em>` : ''}</h4>` : '';
    return `<div class="report-step">${head}${s.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
  }).join('');
  return html || `<pre class="report-content">${esc(content)}</pre>`;
}

function buildReport(id, name, inputs, files, content) {
  const params = inputs.map(([k, v]) => `<span class="report-param"><i>${esc(k)}</i>${esc(v)}</span>`).join('');
  const fileLine = files.length ? `<p class="report-files">已读取资料：${files.map(esc).join('、')}</p>` : '';
  return `<div class="spec-report"><header class="spec-sectionhead"><h2>${esc(name)} · 生成结果</h2></header>${params ? `<div class="report-params">${params}</div>` : ''}${fileLine}${renderReportBody(content, id)}<div class="report-actions"><button type="button" class="spec-btn" data-export-pdf>导出PDF</button><button type="button" class="spec-btn" data-export-word>导出Word</button><button type="button" class="spec-btn" data-regenerate>重新生成</button></div></div>`;
}

function wireBehaviors(rootEl, page) {
  // Labels that are actually drop zones ("拖拽文件到此处，或点击上传").
  rootEl.querySelectorAll('label.spec-label').forEach(lb => {
    if (/拖拽|点击上传/.test(lb.textContent) && !lb.querySelector('select,textarea,input')) {
      if (lb.querySelector('button.spec-drop')) return;
      lb.classList.add('spec-drop');
      lb.tabIndex = 0;
      lb.setAttribute('role', 'button');
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/png,image/jpeg,image/webp,.pdf,.docx,.txt';
      input.hidden = true;
      lb.append(input);
      input.addEventListener('change', () => {
        let slot = lb.querySelector('.drop-status');
        if (!slot) { slot = document.createElement('small'); slot.className = 'drop-status'; lb.append(slot); }
        slot.textContent = [...input.files].map(f => f.name).join('、') || '未选择任何文件';
      });
      lb.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); }
      });
    }
  });

  // File pickers: both the small file button and the dropzone open a picker.
  rootEl.querySelectorAll('.spec-btn.file, button.spec-drop, label.spec-drop').forEach(btn => {
    let input = btn.matches('label') ? btn.querySelector(':scope > input[type=file]') : null;
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = page.id === '02'
        ? 'image/png,image/jpeg,image/webp,.pdf'
        : 'image/png,image/jpeg,image/webp,.pdf,.docx,.txt';
      input.hidden = true;
      btn.after(input);
    }
    const maxFiles = page.id === '02' ? 10 : null;
    btn.setAttribute('aria-label', btn.dataset.name || btn.textContent.trim() || '选择文件');
    btn.addEventListener('click', event => {
      if (event.target === input) return;
      event.preventDefault();
      event.stopPropagation();
      input.click();
    });
    input.addEventListener('change', () => {
      if (maxFiles && input.files.length > maxFiles) {
        input.value = '';
        const slot = btn.querySelector('small') || btn.appendChild(document.createElement('small'));
        slot.textContent = `最多选择 ${maxFiles} 个文件，请重新选择`;
        btn.classList.remove('has-file');
        return;
      }
      const names = [...input.files].map(f => f.name).join('、');
      const slot = btn.querySelector('small') || btn.appendChild(document.createElement('small'));
      slot.textContent = names || '未选择任何文件';
      btn.classList.add('has-file');
    });
    btn.addEventListener('dragover', event => {
      event.preventDefault();
      btn.classList.add('is-dragging');
    });
    btn.addEventListener('dragleave', () => btn.classList.remove('is-dragging'));
    btn.addEventListener('drop', event => {
      event.preventDefault();
      btn.classList.remove('is-dragging');
      const incoming = [...(event.dataTransfer?.files || [])];
      if (!incoming.length) return;
      if (maxFiles && incoming.length > maxFiles) {
        const slot = btn.querySelector('small') || btn.appendChild(document.createElement('small'));
        slot.textContent = `最多选择 ${maxFiles} 个文件，请重新选择`;
        return;
      }
      const transfer = new DataTransfer();
      incoming.forEach(file => transfer.items.add(file));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  // Mode toggle buttons (single non-generate button groups) get an active state.
  rootEl.querySelectorAll('.spec-block button.spec-btn:not(.primary):not(.file)').forEach(btn => {
    if (/知识点|模式|单题|整卷|切换/.test(btn.dataset.name || '')) {
      btn.classList.add('mode');
      btn.addEventListener('click', () => btn.classList.toggle('active'));
    }
  });

  // Option-chip groups (年级/考试/学科 button rows): single-select highlight.
  rootEl.querySelectorAll('.spec-block').forEach(block => {
    const chips = [...block.children].filter(el =>
      el.matches('button.spec-btn:not(.primary):not(.file):not(.mode)') &&
      (el.dataset.name || '').length <= 6);
    if (chips.length < 2) return;
    chips.forEach(btn => {
      btn.classList.add('chip');
      btn.addEventListener('click', () => {
        chips.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  // Generate flow.
  if (document.querySelector('.spec-page')?.dataset.tool === 'ai-exam') {
    wireExamBuilder(rootEl, page);
    return;
  }
  if (page.id === '20') wireErrorDiagnosisExtras(rootEl);
  const resultCol = rootEl.querySelector('.spec-result');
  const genBtn = [...rootEl.querySelectorAll('.spec-formcol button.spec-btn.primary')][0];
  if (genBtn && resultCol) {
    const placeholder = resultCol.innerHTML;
    const run = async () => {
      const inputs = collectInputs(rootEl.querySelector('.spec-formcol'));
      const fileGroups = [...rootEl.querySelectorAll('.spec-formcol input[type=file]')]
        .map(input => [...input.files]).filter(group => group.length);
      const fileObjects = fileGroups.flat();
      const roleMap = {
        '02': ['卷面/成绩图'], '17': ['题目/试卷/作业'], '18': ['题目'],
        '19': ['题目', '学生答案'], '20': ['题目'],
      };
      const files = fileGroups.flatMap((group, groupIndex) => group.map(file =>
        `${roleMap[page.id]?.[groupIndex] || '上传资料'}：${file.name.slice(0, 200)}`));
      const validationError = validateToolInput(page.id, inputs, files);
      if (validationError) {
        resultCol.innerHTML = `<div class="spec-report"><p class="form-message" role="alert">${esc(validationError)}</p></div>`;
        return;
      }
      const steps = (window.SPEC_PLAYBOOKS || {})[page.id] || ['整理输入资料', '分析核心内容', '生成结构化结果', '给出后续建议'];
      genBtn.disabled = true;
      resultCol.innerHTML = '<div class="spec-report"><p aria-live="polite">正在读取并优化上传资料…</p></div>';
      let progressTimer = null;
      try {
        const prepared = await window.LearningCore.prepareFiles(fileObjects);
        const subject = window.LearningCore.findSubject(inputs);
        const startedAt = Date.now();
        resultCol.innerHTML = '<div class="spec-report"><p aria-live="polite" data-ai-progress>资料已读取，AI 正在进行错因诊断与结果复核…（已用时 0 秒）</p><small>通常需要 3–15 秒，大图片或复杂作答可能更久。</small></div>';
        progressTimer = setInterval(() => {
          const status = resultCol.querySelector('[data-ai-progress]');
          if (status) status.textContent = `资料已读取，AI 正在进行${page.id === '20' ? '错因诊断' : '分析'}与结果复核…（已用时 ${Math.floor((Date.now() - startedAt) / 1000)} 秒）`;
        }, 1000);
        const { content } = await window.LearningCore.chatAgent(page.id, {
          prompt: buildPrompt(page.id, page.name, inputs, files, steps),
          prepared,
          subject,
          max_tokens: 8000,
        });
        resultCol.innerHTML = buildReport(page.id, page.name, inputs, files, content);
        window.LearningCore.renderMathIn(resultCol);
        resultCol.querySelector('[data-regenerate]')?.addEventListener('click', run);
        resultCol.querySelector('[data-export-pdf]')?.addEventListener('click', async event => {
          const button = event.currentTarget;
          button.disabled = true;
          button.textContent = '正在生成PDF…';
          try { await window.LearningCore.downloadPdf(resultCol.querySelector('.spec-report'), `${page.name}-结果.pdf`); }
          catch (error) { alert(error.message); }
          finally { button.disabled = false; button.textContent = '导出PDF'; }
        });
        resultCol.querySelector('[data-export-word]')?.addEventListener('click', () => {
          const blob = new Blob(
            ['<html><head><meta charset="utf-8"></head><body>' + resultCol.innerHTML + '</body></html>'],
            { type: 'application/msword' }
          );
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${page.name}-结果.doc`;
          a.click();
          URL.revokeObjectURL(a.href);
        });
        resultCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (error) {
        resultCol.innerHTML = `<div class="spec-report"><p class="form-message" role="alert">${esc(error.message)}</p></div>`;
      } finally {
        if (progressTimer) clearInterval(progressTimer);
        genBtn.disabled = false;
      }
    };
    genBtn.addEventListener('click', run);
  }
}

function wireExamBuilder(rootEl, page) {
  const form = rootEl.querySelector('.spec-formcol');
  const resultCol = rootEl.querySelector('.spec-result');
  const placeholder = resultCol ? resultCol.innerHTML : '';
  const select = [...form.querySelectorAll('select')].find(s => /^--/.test(s.options[0]?.text || ''));
  const addBtn = form.querySelector('button[data-name="添加"]');
  const manualBtn = form.querySelector('button[data-name="手动添加知识点"]');
  const genBtn = form.querySelector('.spec-btn.primary');
  const emptyText = [...form.querySelectorAll('.spec-text')].find(el => /还没有添加知识点/.test(el.textContent));
  const counts = form.querySelectorAll('[data-label="组卷汇总"] b');
  const chips = document.createElement('div');
  chips.className = 'spec-chips';
  (emptyText || addBtn)?.after(chips);
  const msg = document.createElement('p');
  msg.className = 'spec-msg';
  genBtn?.after(msg);
  const chosen = [];

  function sync() {
    if (emptyText) emptyText.hidden = chosen.length > 0;
    chips.innerHTML = chosen.map((k, i) =>
      `<span class="spec-chip">${String(i + 1).padStart(2, '0')} ${esc(k)}<button type="button" data-rm="${i}">×</button></span>`
    ).join('');
    chips.querySelectorAll('[data-rm]').forEach(b =>
      b.addEventListener('click', () => { chosen.splice(Number(b.dataset.rm), 1); sync(); }));
    if (counts.length >= 3) {
      counts[0].textContent = chosen.length;
      counts[1].textContent = chosen.length * 2;
      counts[2].textContent = chosen.length * 2;
    }
  }
  function addPoint(name) {
    const v = (name || '').trim();
    if (!v || /^--|手动输入/.test(v) || chosen.includes(v)) return;
    chosen.push(v);
    msg.textContent = '';
    sync();
  }
  addBtn?.addEventListener('click', () => addPoint(select?.value));
  manualBtn?.addEventListener('click', () => {
    const v = prompt('输入知识点名称');
    if (v) addPoint(v);
  });
  select?.addEventListener('change', () => {
    if (/手动输入/.test(select.value)) {
      const v = prompt('输入知识点名称');
      if (v) addPoint(v);
      select.selectedIndex = 0;
    }
  });

  genBtn?.addEventListener('click', async () => {
    if (!chosen.length) { msg.textContent = '请先添加至少一个知识点。'; return; }
    if (!resultCol) return;
    const val = sel => [...form.querySelectorAll('label.spec-label')]
      .map(lb => [lb.textContent, lb.querySelector('select,input,textarea')])
      .find(([t, c]) => c && t.includes(sel))?.[1]?.value || '';
    const subject = val('科目'), grade = val('年级'), type = val('试卷类型');
    const withAnswer = form.querySelector('.spec-check input')?.checked;
    const notes = form.querySelector('textarea')?.value.trim();
    genBtn.disabled = true;
    msg.textContent = '正在调用 AI 模型生成试卷，请稍候…';
    try {
      const { content } = await window.apiClient.chat({ messages: [
        { role: 'system', content: '你是严谨的中文出题教师。' },
        { role: 'user', content: `请生成一份${grade}${subject}的${type}。知识点：${chosen.join('、')}。每个知识点生成1道基础题和1道提升题，检查题目、答案和分值的一致性。${withAnswer ? '请包含答案与解析。' : '不要输出答案与解析。'}${notes ? `额外要求：${notes}` : ''}只输出纯文本试卷，不要输出 HTML 或 JavaScript。` },
      ], max_tokens: 8000 });
      resultCol.innerHTML = `<div class="exam-paper"><header class="spec-sectionhead"><h2>${esc(grade)}${esc(subject)} · ${esc(type)}</h2></header><pre class="report-content">${esc(content)}</pre><div class="report-actions"><button type="button" class="spec-btn" data-export-pdf>导出PDF</button><button type="button" class="spec-btn" data-export-word>导出Word</button><button type="button" class="spec-btn" data-regenerate>重新生成</button></div></div>`;
      window.LearningCore.renderMathIn(resultCol);
      resultCol.querySelector('[data-regenerate]')?.addEventListener('click', () => genBtn.click());
      resultCol.querySelector('[data-export-pdf]')?.addEventListener('click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = '正在生成PDF…';
        try { await window.LearningCore.downloadPdf(resultCol.querySelector('.exam-paper'), `${page.name}-试卷.pdf`); }
        catch (error) { msg.textContent = error.message; }
        finally { button.disabled = false; button.textContent = '导出PDF'; }
      });
      resultCol.querySelector('[data-export-word]')?.addEventListener('click', () => {
        const blob = new Blob(['<html><head><meta charset="utf-8"></head><body>' + resultCol.innerHTML + '</body></html>'], { type: 'application/msword' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${page.name}-试卷.doc`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
      msg.textContent = '';
      resultCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      msg.textContent = error.message;
    } finally {
      genBtn.disabled = false;
    }
  });
}

/* error-diagnosis hides optional evidence fields behind a 补充材料 toggle on
   the reference build; the captured tree only contains the collapsed state, so
   rebuild them here. */
function wireErrorDiagnosisExtras(rootEl) {
  const form = rootEl.querySelector('.spec-formcol');
  if (!form) return;
  // 学生原始答案 in the reference page is a textarea, not a one-line input.
  const ansLabel = [...form.querySelectorAll('label.spec-label')].find(lb => /学生原始答案/.test(lb.textContent));
  if (ansLabel) {
    const input = ansLabel.querySelector('input[type=text]') || form.querySelector(`input[type=text][placeholder*="学生原始答案"]`);
    if (input) {
      const ta = document.createElement('textarea');
      ta.placeholder = '在此输入学生的原始答案与完整作答过程（可选）';
      input.replaceWith(ta);
    }
  }
  const extra = document.createElement('div');
  extra.className = 'spec-block';
  extra.dataset.label = '补充材料';
  extra.hidden = true;
  const sel = (label, opts) => `<label class="spec-label">${label}<select>${opts.map(o => `<option>${o}</option>`).join('')}</select></label>`;
  extra.innerHTML =
    sel('学生自判', ['未提供', '知识没掌握', '题目读错了', '方法选错了', '解题步骤有误', '运算粗心']) +
    sel('教师判断错因', ['知识理解或记忆错误', '题意读取错误', '方法选择错误', '解题步骤错误', '运算判断或执行错误', '答案表达错误']) +
    `<label class="spec-label">正确答案（可选）<textarea placeholder="输入正确答案（可选）"></textarea></label>` +
    `<label class="spec-label">标准解题过程（可选）<textarea placeholder="输入标准解题过程（可选）"></textarea></label>` +
    `<label class="spec-label">得分点或评分标准（可选）<textarea placeholder="输入得分点或评分标准（可选）"></textarea></label>` +
    `<label class="spec-label">教师判断依据（可选）<textarea placeholder="记录教师判断依据（可选）"></textarea></label>`;
  (ansLabel || form.lastElementChild)?.after(extra);
  const toggle = [...form.querySelectorAll('button.spec-btn')].find(b => /补充材料/.test(b.dataset.name || b.textContent));
  if (toggle) toggle.addEventListener('click', () => {
    extra.hidden = !extra.hidden;
    toggle.classList.toggle('active', !extra.hidden);
  });
}

window.renderSpecPage = function (id) {
  const key = IDMAP[id];
  if (!key) return false;
  const page = PAGES[key];
  const { left, right } = splitColumns(page.tree);
  /* 单列页（树里没有可识别的结果占位）也要有结果容器，否则生成按钮无法接线。 */
  if (!right.length) right.push({ r: 'generic', c: [{ r: 'paragraph', n: '生成结果会显示在这里。' }] });
  const app = document.getElementById('app');
  let leftHtml = renderSeq(left, 'root');
  if (!/<h1/.test(leftHtml)) {
    leftHtml = `<h1>${esc(page.name)}</h1><p>${esc(page.tagline || '')}</p>` + leftHtml;
  }
  const liveAgentIds = new Set(['02', '17', '18', '19', '20']);
  const resultHtml = liveAgentIds.has(page.id)
    ? `<div class="spec-report"><p class="module-group-kicker">等待生成</p><h2>${esc(page.name)}结果</h2><p>完成左侧设置并上传真实资料后，智能体将在这里输出基于证据的结果。</p></div>`
    : renderSeq(right, 'root');
  app.innerHTML =
    `<section class="spec-page" data-tool="${esc(key)}">` +
    `<a class="spec-link back" href="#/">← 返回教师工作台</a>` +
    `<div class="spec-columns${right.length ? '' : ' single'}">` +
    `<div class="spec-formcol">${leftHtml}</div>` +
    (right.length ? `<div class="spec-result">${resultHtml}</div>` : '') +
    `</div></section>`;
  wireBehaviors(app, page);
  window.LearningCore?.mountAgentPanel(app.querySelector('.spec-formcol'), page.id);
  window.scrollTo(0, 0);
  return true;
};
})();
