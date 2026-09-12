/* Data-driven tool pages rendered from window.TOOL_PAGES (spec.js).
   Each page is an accessibility tree captured from the reference build;
   this file maps roles to HTML and wires demo interactions. */
(() => {
const PAGES = window.TOOL_PAGES || {};
const IDMAP = {};
for (const key of Object.keys(PAGES)) IDMAP[PAGES[key].id] = key;

const GENERATE = /^(生成|开始|拆解|批改|评测|诊断|重排|输出|制作|分析|一键|提交|立即)/;
const RESULT_HINT = /等待|将在这里|先建立|尚未|暂无|上传.*后|从左侧|开始配置/;

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
        : /选择文件/.test(name) ? 'spec-btn file'
        : /点击或拖拽/.test(name) ? 'spec-drop'
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
    return { left: asides, right: nodes.filter(n => !asides.includes(n)) };
  }
  const idx = nodes.findIndex(n => hasResultHint(n) && !hasFormControl(n));
  if (idx > 0) return { left: nodes.slice(0, idx), right: nodes.slice(idx) };
  return { left: nodes, right: [] };
}

function hasFormControl(node) {
  if (isControl(node)) return true;
  return (node.c || []).some(hasFormControl);
}

function collectInputs(rootEl) {
  const out = [];
  rootEl.querySelectorAll('label.spec-label').forEach(lb => {
    const ctl = lb.querySelector('select,input,textarea');
    if (!ctl || !ctl.value || /^--/.test(ctl.value)) return;
    const clone = lb.cloneNode(true);
    clone.querySelectorAll('select,input,textarea').forEach(x => x.remove());
    const text = clone.textContent.trim();
    if (text) out.push([text, ctl.value]);
  });
  return out;
}

function buildReport(id, name, inputs, files) {
  const steps = (window.SPEC_PLAYBOOKS || {})[id] || ['整理输入资料', '分析核心内容', '生成结构化结果', '给出后续建议'];
  const params = inputs.map(([k, v]) => `<span class="report-param"><i>${esc(k)}</i>${esc(v)}</span>`).join('');
  const fileLine = files.length ? `<p class="report-files">已接收资料：${files.map(esc).join('、')}</p>` : '';
  const body = steps.map((s, i) =>
    `<section class="report-step"><h4><span>${String(i + 1).padStart(2, '0')}</span>${esc(s)}</h4><p>本地演示：此步骤将由生成引擎基于你的输入完成「${esc(s)}」，接入 API 后输出真实内容。</p></section>`
  ).join('');
  return `<div class="spec-report"><header class="spec-sectionhead"><h2>${esc(name)} · 生成结果</h2></header>${params ? `<div class="report-params">${params}</div>` : ''}${fileLine}${body}<div class="report-actions"><button type="button" class="spec-btn" onclick="window.print()">导出PDF</button><button type="button" class="spec-btn" data-export-word>导出Word</button><button type="button" class="spec-btn" data-regenerate>重新生成</button></div></div>`;
}

function wireBehaviors(rootEl, page) {
  // Labels that are actually drop zones ("拖拽文件到此处，或点击上传").
  rootEl.querySelectorAll('label.spec-label').forEach(lb => {
    if (/拖拽|点击上传/.test(lb.textContent) && !lb.querySelector('select,textarea,input')) {
      lb.classList.add('spec-drop');
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.hidden = true;
      lb.append(input);
      input.addEventListener('change', () => {
        let slot = lb.querySelector('.drop-status');
        if (!slot) { slot = document.createElement('small'); slot.className = 'drop-status'; lb.append(slot); }
        slot.textContent = [...input.files].map(f => f.name).join('、') || '未选择任何文件';
      });
    }
  });

  // File pickers: both the small file button and the dropzone open a picker.
  rootEl.querySelectorAll('.spec-btn.file, .spec-drop').forEach(btn => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.hidden = true;
    btn.after(input);
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const names = [...input.files].map(f => f.name).join('、');
      const slot = btn.querySelector('small') || btn.appendChild(document.createElement('small'));
      slot.textContent = names || '未选择任何文件';
      btn.classList.add('has-file');
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
  const resultCol = rootEl.querySelector('.spec-result');
  const genBtn = [...rootEl.querySelectorAll('.spec-formcol button.spec-btn.primary')][0];
  if (genBtn && resultCol) {
    const placeholder = resultCol.innerHTML;
    const run = () => {
      const inputs = collectInputs(rootEl.querySelector('.spec-formcol'));
      const files = [...rootEl.querySelectorAll('.spec-formcol input[type=file]')]
        .flatMap(i => [...i.files].map(f => f.name));
      resultCol.innerHTML = buildReport(page.id, page.name, inputs, files);
      resultCol.querySelector('[data-regenerate]')?.addEventListener('click', () => {
        resultCol.innerHTML = placeholder;
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

  genBtn?.addEventListener('click', () => {
    if (!chosen.length) { msg.textContent = '请先添加至少一个知识点。'; return; }
    if (!resultCol) return;
    const val = sel => [...form.querySelectorAll('label.spec-label')]
      .map(lb => [lb.textContent, lb.querySelector('select,input,textarea')])
      .find(([t, c]) => c && t.includes(sel))?.[1]?.value || '';
    const subject = val('科目'), grade = val('年级'), type = val('试卷类型');
    const withAnswer = form.querySelector('.spec-check input')?.checked;
    const notes = form.querySelector('textarea')?.value.trim();
    resultCol.innerHTML =
      `<div class="exam-paper"><header class="spec-sectionhead"><h2>${esc(grade)}${esc(subject)} · ${esc(type)}</h2></header>` +
      `<p class="exam-meta">共 ${chosen.length * 2} 题 · 覆盖 ${chosen.length} 个知识点${notes ? ' · 备注：' + esc(notes) : ''}</p>` +
      chosen.map((k, i) =>
        `<section class="exam-block"><h3>${String(i + 1).padStart(2, '0')} ${esc(k)}</h3>` +
        `<div class="exam-q"><b>第 ${i * 2 + 1} 题（基础）</b><p>本地演示占位：接入生成引擎后，这里输出「${esc(k)}」的基础题题面。</p>${withAnswer ? '<p class="exam-ans">答案与解析将随题目一并生成。</p>' : ''}</div>` +
        `<div class="exam-q"><b>第 ${i * 2 + 2} 题（提升）</b><p>本地演示占位：接入生成引擎后，这里输出「${esc(k)}」的变式提升题题面。</p>${withAnswer ? '<p class="exam-ans">答案与解析将随题目一并生成。</p>' : ''}</div></section>`
      ).join('') +
      `<div class="report-actions"><button type="button" class="spec-btn" onclick="window.print()">导出PDF</button><button type="button" class="spec-btn" data-export-word>导出Word</button><button type="button" class="spec-btn" data-regenerate>重新生成</button></div></div>`;
    resultCol.querySelector('[data-regenerate]')?.addEventListener('click', () => { resultCol.innerHTML = placeholder; });
    resultCol.querySelector('[data-export-word]')?.addEventListener('click', () => {
      const blob = new Blob(
        ['<html><head><meta charset="utf-8"></head><body>' + resultCol.innerHTML + '</body></html>'],
        { type: 'application/msword' }
      );
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${page.name}-试卷.doc`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    resultCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

window.renderSpecPage = function (id) {
  const key = IDMAP[id];
  if (!key) return false;
  const page = PAGES[key];
  const { left, right } = splitColumns(page.tree);
  const app = document.getElementById('app');
  let leftHtml = renderSeq(left, 'root');
  if (!/<h1/.test(leftHtml)) {
    leftHtml = `<h1>${esc(page.name)}</h1><p>${esc(page.tagline || '')}</p>` + leftHtml;
  }
  app.innerHTML =
    `<section class="spec-page" data-tool="${esc(key)}">` +
    `<a class="spec-link back" href="#/">← 返回教师工作台</a>` +
    `<div class="spec-columns${right.length ? '' : ' single'}">` +
    `<div class="spec-formcol">${leftHtml}</div>` +
    (right.length ? `<div class="spec-result">${renderSeq(right, 'root')}</div>` : '') +
    `</div></section>`;
  wireBehaviors(app, page);
  window.scrollTo(0, 0);
  return true;
};
})();
