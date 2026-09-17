(() => {
window.addEventListener('error', (event) => {
  const target = document.getElementById('app');
  if (target && !target.innerHTML) target.innerHTML = `<pre style="padding:24px;color:#b22">本地复刻加载错误：${String(event.error || event.message)}</pre>`;
});
const app=document.getElementById('app');
const account=document.getElementById('account');
const authDialog=document.getElementById('authDialog');
const authForm=document.getElementById('authForm');
const authMessage=document.getElementById('authMessage');
const tools=[
['01','AI出题机','从教学目标到完整试卷','按年级、学科、知识点与难度生成可编辑试卷。','teacher-efficiency'],['02','卷后提分试卷分析','从一次考试找到下次增分点','识别卷面证据，形成提分优先级与七天行动计划。','teaching-score'],['03','学习资料生成器','把教材整理成学习路径','从理解、练习到复习，生成可下载的完整学习讲义。','teacher-efficiency'],['23','教辅资料制作器','批量制作课堂教辅图','结合知识库和参考风格，生成多比例教学素材。','teacher-efficiency'],['06','试卷讲评PPT','把试卷变成一堂讲评课','识别题目与图形，编排为课堂可直接使用的 16:9 课件。','teacher-efficiency'],['07','错题举一反三','从一道错题扩展一组训练','识别错因并生成同源、变式与迁移练习。','teaching-score'],['08','题卷重排WORD','把任意上传资料完整重排成 Word','完整识别标题、正文、题目、公式、表格与图形，导出可编辑文档。','teacher-efficiency'],['09','AI备课器','从教材资料生成完整教案','组织目标、学情、活动、评价与作业，形成可编辑备课方案。','teacher-efficiency'],['10','AI提分空间评测器','测出最值得投入的提分空间','结合成绩、试卷和学习表现，生成提分空间评测报告。','training-enrollment'],['11','AI丢分诊断器','定位每一次丢分的真正原因','从试卷、作业和错题材料中识别丢分模式与修复方向。','training-enrollment'],['12','错题归因追分器','把错题归因转成可追踪增分路径','分析错题、知识点与学习阶段，生成可执行的追分方案。','training-enrollment'],['13','知识查缺补漏器','绘制知识缺口与补漏地图','从试卷和知识点材料定位薄弱环节，安排补漏优先级。','training-enrollment'],['14','考前抢分清单器','把考前时间换成确定得分点','基于试卷表现生成考前复习清单、风险控制和时间安排。','training-enrollment'],['15','AI题型提分卡','一张卡看懂题型与得分路径','从题目材料提炼题型特征、解题策略、易错点和后续训练。','training-enrollment'],['16','提分行动计划器','把目标分拆成每天的行动','依据当前水平、目标分和可用时间生成阶段化提分计划。','training-enrollment'],['17','AI审题器','把题目条件拆成可执行步骤','提取任务词、限制条件、关键数据和隐藏条件，减少审题漏项。','teaching-score'],['18','AI解题步骤器','用步骤支架带着学生解题','将题目拆成连续提示与检查点，帮助学生形成稳定解题路径。','teaching-score'],['19','AI得分点拆解器','把评分标准拆成可检查得分点','逐项比对学生答案与评分要求，明确已得分、失分和补强动作。','teaching-score'],['20','AI错因判断器','区分知识、方法与审题错误','从学生答案和题目证据判断错因类型，并给出针对性修正建议。','teaching-score'],['21','题感训练提分器','在连续选择与反馈中形成题感','围绕知识点训练判断、方法选择和陷阱识别，沉淀稳定题感。','teaching-score'],['22','试卷变式机','把原题变成分层训练','上传原卷后生成相似题、变式题与综合应用题。','teacher-efficiency'],['24','课文预习单','把教材资料整理成可直接使用的课文预习单','上传教材、试卷或作业，提炼知识地图、重点难点与课前学习任务。','teacher-efficiency'],['25','课堂笔记生成器','把课堂资料整理成结构清晰的复习笔记','汇总教材、板书、试卷和作业，生成可复习、可打印的课堂笔记。','teacher-efficiency'],['26','智批作业机','整班作业一次批完','批量上传学生作业，自动识别得分、评分说明并按批次归档。','teacher-efficiency']];
const groups=[['teacher-efficiency','AI赋能教师提效','把备课、资料和课堂制作变成可复用的工作流。'],['teaching-score','AI赋能教学提分','围绕审题、解题、得分与错因，建立教学提分闭环。'],['training-enrollment','AI赋能教培招生','把评测、诊断和行动计划沉淀为可展示的提分服务。']];
const playbooks={
'17':['题目预览与元信息（学科/年级/题型/识别时间）','01 任务词','02 限制条件','03 关键数据','04 隐藏条件','05 干扰信息','06 作答范围','题意复述'],
'18':['读题与标注','选择方法','分步计算','规范作答','完整答案'],
'01':['按知识点逐题出题（题干+选项+答案+解析）','逐题检查图形与题干一致','勾选题目组卷（可附生成备注）','试卷视图：题目+完整解析+答案'],
'02':['三指标卡：得分率/分差、可追回分、第一优先动作','结论总控台与数据校验（数据范围/证据可信度/判定边界）','提分地图：当前失分信号→分数为什么没拿到→先改哪一步最划算','能力维度画像（运算/推理/概念/规范）','错误模式聚类与知识薄弱点','题目难度分布与考试策略执行评估'],
'03':['生成流程四步状态：读取资料→生成内容→复核内容→绘制图形','十栏目讲义：01导航/02重点/03策略/04精读/05词典/06图解/07易错/08例题/09练习/10掌握证明','下载 PDF / Word'],
'06':['识别题目、图形与考点','课件目录（N 题·N 张，每题 1~2 页）','16:9 课堂画布（题干+讲评要点）','导出 PPTX'],
'07':['解析错题：知识点/考点/答案解析','相似题（同方法）','变式题（换情境/参数）','综合应用题','由易到难排列，可勾选组卷'],
'08':['识别标题、正文、题目与答案','还原公式、表格与图形','按 A4 版式重排（内容列表可编辑）','导出可编辑 Word'],
'09':['课程标准与课时定位（含核心素养）','学情诊断','教学目标与重难点','课堂任务链与活动设计','板书设计','作业分层','课堂应变预案','课后反思'],
'10':['当前分数层级','差距拆解：先拿回X分/再冲刺Y分/挑战Z+分','优先提分方向（按优先级+可提分区间）','个性化提分路径与建议'],
'11':['五类丢分维度对比：知识/方法/审题/计算表达/习惯（占比+严重程度+优先级）','主要失分点 TOP 分析','修复方向与建议'],
'12':['解析错题：知识点/考点','同源基础题','变式训练题','综合应用题（含答案）','训练矩阵可勾选组卷'],
'13':['红黄绿知识点地图（树状图，每点标注掌握度%）','严重程度视图','优先级视图','30天补漏路线（4阶段：训练内容+交付结果）','统计卡：总数/掌握良好/存在漏洞/漏洞严重/未涉及'],
'14':['失分点：找出关键失分原因','优先级：确定抢分顺序','必练清单（高频题型）','考前风险提醒'],
'15':['1 题型识别（识别结果/高频考点/难度/题型特征）','方法步骤与得分路径','易错点','跟练题与训练建议'],
'16':['目标分差拆解（当前-目标=差值/日均提升）','试卷薄弱点识别 TOP5（百分比）','每周提升重点（各周目标+分）','每日行动计划与检查节点'],
'19':['01 答题对象','02 核心结论','03 关键依据','04 推理步骤','05 关键词','06 格式要求（各维标注分值与状态：已掌握/有待补全/需要完善/书写规范）'],
'20':['首个错误位置（四步链条：题意读取→方法选择→列式计算→最终答案）','错误证据（引用学生原文）','错因类型（知识/题意/方法/步骤/运算）','后续错误链','学生自判与 AI 判断比对','下一步纠正动作'],
'21':['一次性生成10题（全部完成后开始训练）','三连问：①考什么知识点 ②用什么方法 ③陷阱在哪','逐题作答与即时反馈','统计：已训练/正确率/连续正确'],
'22':['抽取原题结构与考点','同源相似题','参数/情境变式题','综合应用题（校验答案）','按变式难度与系数分层'],
'23':['理解需求并规划内容','出图计划（建议张数，确认后生成）','按比例绘制教辅图（含练习/作答区）','下载全部图片'],
'24':['01 课前导航（知识地图/学习目标）','02 自主任务（预习侧重对应）','03 自我检测'],
'25':['按资料重组知识结构（概念/方法/例题）','提炼重点与例题','易错提醒','复习清单与可打印笔记'],
'26':['逐份识别学生与题目（客观题/主观题分项评分）','批次统计：平均分/最高分/最低分','分数分布（按满分换算）','批改重点建议','全员分数排序表']};
window.SPEC_PLAYBOOKS=playbooks;
const byId=id=>tools.find(t=>t[0]===id);
const escOutput=value=>String(value??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const renderMath=root=>window.LearningCore?.renderMathIn(root);
async function requestOutput(title, details, images){
  const userText=`请为“${title}”生成可直接使用的结果。\n${details}\n只输出纯文本，不要输出 HTML、JavaScript 或解释生成过程。`;
  // images 为 base64 data URL 数组，走 OpenAI 风格分片，由本地代理转发给 Claude / GLM 视觉型号。
  const content=images&&images.length
    ?[...images.map(url=>({type:'image_url',image_url:{url}})),{type:'text',text:userText}]
    :userText;
  const {content:out}=await window.apiClient.chat({messages:[
    {role:'system',content:'你是严谨、实用的中文教师助理。'},
    {role:'user',content}
  ],max_tokens:8000});
  return out;
}
function home(){app.innerHTML=`<section class="hero"><div class="hero-shade"></div><div class="hero-content"><p class="hero-eyebrow"><span>教师工作的新基础设施</span><b>2026</b></p><h1>AI赋能教师提效、教学提分、教培增长。</h1><div class="hero-actions"><a class="primary-action" href="#workbench">进入教师工作台 ↘</a><a class="text-action" href="#tool/17">开始复刻流程</a></div></div><aside class="hero-index"><span>01</span><span>02</span><span>03</span></aside></section><section class="workbench" id="workbench">${groups.map((g,i)=>`<section class="module-group"><div class="module-group-heading"><div><p class="module-group-kicker">WORKBENCH / 0${i+1}</p><h2>${g[1]}</h2></div><p>${g[2]}</p></div><div class="module-grid">${tools.filter(t=>t[4]===g[0]).map(t=>card(t)).join('')}</div></section>`).join('')}</section>`}
function card(t){return `<a class="module-card" href="#tool/${t[0]}"><div class="module-top"><span class="module-number">MODULE / ${t[0]}</span></div><h3 class="module-title">${t[1]}</h3><p class="module-label">${t[2]}</p><p class="module-description">${t[3]}</p><span class="module-enter">进入工具 <b>↗</b></span></a>`}
function toolPage(t){
  if(t[0]==='21') return senseTrainingPage(t);
  if(t[0]==='12') return wrongAttributionPage(t);
  if(t[0]==='07') return wrongQuestionPage(t);
  if(t[0]==='22') return variantExamPage(t);
  if(window.renderSpecPage&&window.renderSpecPage(t[0]))return;
  app.innerHTML=`<section class="tool-page"><a class="back" href="#/">← 返回教师工作台</a><p class="form-message">该工具页面缺失，请检查 spec.js 数据。</p></section>`;
}



/* —— 07 错题举一反三：对齐线上原版（左 380px 输入面板 + 右灰画布：原题展示→题卡→组卷→A4 模拟试卷）—— */
function wrongQuestionPage(t){
  const subjectOptions=['自动识别','语文','数学','英语','物理','化学','生物','历史','地理','政治'];
  const gradeOptions=['自动识别','小学','初一','初二','初三','高一','高二','高三'];
  app.innerHTML=`<section class="wq-page"><a class="wq-back" href="#/">← 返回教师工作台</a><div class="wq-container"><form id="wqForm" class="console-panel"><div class="wq-sec"><div class="section-title">上传错题</div><div class="upload-tip">只可以上传1道错题，定制化专练。</div><div class="wq-counts"><label>学科<select name="subject">${subjectOptions.map(x=>`<option>${x}</option>`).join('')}</select></label><label>年级<select name="grade">${gradeOptions.map(x=>`<option>${x}</option>`).join('')}</select></label></div><input id="wrongQuestionFile" class="upload-input-large" type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.docx"><div id="uploadStatus" class="upload-status">支持格式：PNG/JPG/WebP/PDF/DOCX</div><div id="ocrConfirm" class="ocr-confirm" hidden><div class="analysis-label">题目内容（请核对或粘贴）</div><textarea id="questionTextInput" placeholder="粘贴题目与学生作答（含批改更佳），生成将以此为准"></textarea><small class="ocr-hint">已支持读取图片、PDF 和 DOCX；如识别有误，可在此粘贴正确文字覆盖</small></div><div id="analysisResult" class="analysis-result" hidden></div></div><div class="wq-sec"><div class="section-title">出题配置</div><div class="wq-type-block"><label class="wq-row-label">题型选择</label><div id="questionTypeContainer" class="qtype-container"><span class="qtype-tag active" data-type="相似题">相似题</span><span class="qtype-tag active" data-type="变式题">变式题</span><span class="qtype-tag active" data-type="综合应用题">综合应用题</span></div></div><p class="wq-row-label">题目数量</p><div class="wq-counts"><label>相似题<select name="countSimilar"><option>1题</option><option>2题</option><option>3题</option></select></label><label>变式题<select name="countVariant"><option>1题</option><option>2题</option><option>3题</option></select></label><label>综合应用题<select name="countApply"><option>1题</option><option>2题</option><option>3题</option></select></label></div><div class="wq-checks"><label class="wq-check"><input type="checkbox" name="showOriginal" checked> 是否显示原题</label><label class="wq-check"><input type="checkbox" name="showAnswer" checked> 显示答案和解析</label></div><button class="wq-generate" type="submit">⚡ 生成题目</button><p class="wq-hint" aria-live="polite" id="wqMsg">请先上传1道错题，再点击“生成题目”</p></div></form><div class="preview-wrapper" id="previewWrapper"><div class="loading-overlay" id="wqLoading" hidden><div class="loader"></div><div>正在生成题目...</div><div style="font-size:12px;margin-top:5px;opacity:.7">正在按题型构造相似题与变式题</div><div class="fake-progress-wrap"><div class="fake-progress-track"><div class="fake-progress-bar" id="wqProgress"></div></div><div class="fake-progress-text" id="wqProgressText">0%</div></div></div><div class="live-original-panel" id="liveOriginalPanel" hidden><div class="group-title">原题展示</div><img id="liveOriginalImage" alt="原题图片"></div><div class="question-select-mode" id="selectMode" hidden></div><div class="compose-bar" id="composeBar" hidden><div class="compose-left"><button class="btn-select-all" id="selectAllBtn" type="button">全选</button><span class="count">已选 <span id="selectedCount">0</span> 题</span></div><button class="btn-compose" id="composeBtn" type="button">组卷</button></div><div class="a4-paper" id="paper" hidden><div class="seal-line"><div class="seal-text">密封线内不要答题</div></div><div class="exam-header"><div class="secret-mark">绝密 ★ 启用前</div><div class="exam-title" id="paperTitle" contenteditable="true" title="点击修改标题">试卷预览</div><div class="title-edit-hint">点击标题可自定义修改 ✎</div><div class="exam-info">姓名：<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>班级：<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>考号：<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div></div><div id="examContent"></div><div class="answer-key" id="answerArea" hidden><div class="group-title">参考答案与解析</div><div id="answerContent"></div></div></div><div class="preview-bottom-bar" id="downloadBar" hidden><button class="bar-btn" id="backBtn" type="button">← 返回选题</button><button class="bar-btn primary" id="pdfBtn" type="button">导出PDF</button><button class="bar-btn primary" id="wordBtn" type="button">导出Word</button></div></div></div></section>`;
  const $=id=>document.getElementById(id);
  const form=$('wqForm'), msg=$('wqMsg'), file=$('wrongQuestionFile'), uploadStatus=$('uploadStatus'), analysisBox=$('analysisResult'), preview=$('previewWrapper'), loading=$('wqLoading'), progress=$('wqProgress'), progressText=$('wqProgressText'), origPanel=$('liveOriginalPanel'), origImg=$('liveOriginalImage'), selectMode=$('selectMode'), composeBar=$('composeBar'), paper=$('paper'), downloadBar=$('downloadBar');
  let originalImage=null, currentQuestions=null, currentAnalysis=null;
  window.LearningCore?.mountAgentPanel(form, '07');
  form.querySelectorAll('.qtype-tag').forEach(tag=>tag.addEventListener('click',()=>tag.classList.toggle('active')));
  const ocrConfirm=$('ocrConfirm'), questionTextInput=$('questionTextInput');
  file.addEventListener('change',()=>{
    const f=file.files[0];
    uploadStatus.textContent=f?`已选择：${f.name}`:'支持格式：PNG/JPG/PDF';
    ocrConfirm.hidden=!f;
    if(f&&/^image\//.test(f.type)){const fr=new FileReader();fr.onload=()=>{originalImage=fr.result;};fr.readAsDataURL(f);}else originalImage=null;
  });
  /* 数学题查重：模板（数字归一化）相同且数字序列相同才算重复；同模板换数字是合法变式 */
  const normTpl=s=>String(s).replace(/\d+(\.\d+)?/g,'#').replace(/\s+/g,'');
  const normNums=s=>(String(s).match(/\d+(\.\d+)?/g)||[]).join(',');
  const validateQuestions=(list)=>{
    const seen=[];const pass=[];let structFail=0,dupFail=0;
    for(const q of list){
      const opts=(q.opts||q['选项']||[]).map(s=>String(s).trim()).filter(Boolean);
      const ans=String(q.answer||q['答案']||'').trim();
      const exp=String(q.explain||q['解析']||'').trim();
      const kindRaw=String(q.kind||q['类型']||'相似');
      const diffRaw=String(q.diff||q['难度']||'基础');
      const diff=/提高|难/.test(diffRaw)?'提高':/中等/.test(diffRaw)?'中等':'基础';
      const stem=String(q.stem||q['题干']||'').trim();
      /* 模型的“类型”标注不稳定，按题目特征确定性归类：
         多小问/长题干/提高难度→综合；含字母参数或模型标变式→变式；其余→相似 */
      const multi=/\(2\)|（2）|[？?]\s*[\s\S]{20,}\(3\)|（3）/.test(stem)||stem.length>80;
      const hasParam=/关于\s*[a-zA-Z]|实数\s*[a-z]|求\s*[a-z]\s*的取值|含参/.test(stem);
      const kind=kindRaw.includes('综合')?'综合':kindRaw.includes('变')?'变式':kindRaw.includes('相似')?'相似':(multi?'综合':hasParam?'变式':'相似');
      if(!stem||!ans||!exp||stem.length<6){structFail++;continue;}
      if(opts.length&&opts.length<3){structFail++;continue;}
      if(opts.length&&!/^[A-D]/.test(ans)){structFail++;continue;}
      if(!opts.length&&ans.length>150){structFail++;continue;}
      const tpl=normTpl(stem), nums=normNums(stem);
      if(seen.some(g=>g.t===tpl&&g.n===nums)){dupFail++;continue;}
      seen.push({t:tpl,n:nums});
      pass.push({kind,diff,stem,opts,ans,exp});
    }
    const picked=new Set();const selected=[];
    for(const k of ['相似','变式','综合']){const q=pass.find(x=>x.kind===k&&!picked.has(x));if(q){selected.push(q);picked.add(q);}}
    const quota={'基础':4,'中等':4,'提高':2};
    for(const lvl of ['基础','中等','提高']){
      const have=()=>selected.filter(q=>q.diff===lvl).length;
      for(const q of pass){if(selected.length>=10)break;if(picked.has(q)||q.diff!==lvl)continue;if(have()>=quota[lvl])break;selected.push(q);picked.add(q);}
    }
    for(const q of pass){if(selected.length>=10)break;if(!picked.has(q)){selected.push(q);picked.add(q);}}
    return {selected};
  };
  const parseJsonQuestions=(text)=>{
    const s=String(text).replace(/```(?:json)?/g,'');
    const start=s.indexOf('[');
    if(start<0)return null;
    let depth=0,inStr=false,esc=false;
    for(let i=start;i<s.length;i++){
      const ch=s[i];
      if(esc){esc=false;continue;}
      if(ch==='\\'&&inStr){esc=true;continue;}
      if(ch==='"'){inStr=!inStr;continue;}
      if(inStr)continue;
      if(ch==='[')depth++;
      else if(ch===']'){depth--;if(depth===0){let cand=s.slice(start,i+1).replace(/,\s*([\]}])/g,'$1');try{return JSON.parse(cand);}catch{try{cand=cand.replace(/(^|[^\\])\\(?=[A-Za-z_])/g,'$1\\\\');return JSON.parse(cand);}catch{return null;}}}}
    }
    return null;
  };
  const bulletRow=(v)=>v?v.split(/[、，,]+/).map(x=>x.trim()).filter(Boolean).map(x=>`<li>${escOutput(x)}</li>`).join(''):'';
  const renderAnalysis=(analysis)=>{
    analysisBox.innerHTML=analysis.map(([k,v])=>`<div class="analysis-item"><div class="analysis-label">${escOutput(k)}</div><div class="analysis-content"><ul class="wq-bullets">${k==='答案解析'?`<li>${escOutput(v)}</li>`:bulletRow(v)}</ul></div></div>`).join('');
    renderMath(analysisBox);
    analysisBox.hidden=false;
  };
  const stemWith=(q)=>q.opts.length?q.stem+'\n'+q.opts.join('\n'):q.stem;
  const renderSelectMode=()=>{
    const groups=[['相似题','相似'],['变式题','变式'],['综合应用题','综合']].filter(([title])=>[...document.querySelectorAll('#wqForm .qtype-tag.active')].some(t=>t.dataset.type===title));
    origPanel.hidden=!(form.elements.showOriginal.checked&&originalImage);
    if(!origPanel.hidden)origImg.src=originalImage;
    selectMode.innerHTML=groups.map(([title,key])=>{const qs=currentQuestions.filter(q=>q.kind===key);if(!qs.length)return'';return `<div class="group-header">${title}</div>${qs.map(q=>`<div class="question-card selected" data-qi="${currentQuestions.indexOf(q)}"><div class="select-check"></div><div class="q-stem">${escOutput(stemWith(q))}</div></div>`).join('')}`;}).join('');
    renderMath(selectMode);
    selectMode.hidden=false;composeBar.hidden=false;paper.hidden=true;downloadBar.hidden=true;
    const cards=[...selectMode.querySelectorAll('.question-card')];
    cards.forEach(c=>c.addEventListener('click',()=>{c.classList.toggle('selected');syncCount();}));
    const syncCount=()=>$('selectedCount').textContent=selectMode.querySelectorAll('.question-card.selected').length;
    syncCount();
    $('selectAllBtn').onclick=()=>{const on=cards.some(c=>!c.classList.contains('selected'));cards.forEach(c=>c.classList.toggle('selected',on));syncCount();};
    $('composeBtn').onclick=()=>{
      const chosen=currentQuestions.filter((_,i)=>selectMode.querySelector(`[data-qi="${i}"]`)?.classList.contains('selected'));
      const withAns=form.elements.showAnswer.checked;
      const groups2=[['相似题','相似'],['变式题','变式'],['综合应用题','综合']];
      $('examContent').innerHTML=groups2.map(([title,key])=>{const qs=chosen.filter(q=>q.kind===key);if(!qs.length)return'';return `<div class="exam-group"><div class="exam-group-title">${title}</div>${qs.map(q=>`<div class="exam-q"><div class="exam-q-stem">${escOutput(q.stem)}</div>${q.opts.length?`<div class="exam-q-opts">${q.opts.map(o=>`<span>${escOutput(o)}</span>`).join('')}</div>`:''}</div>`).join('')}</div>`;}).join('');
      $('answerArea').hidden=!withAns;
      if(withAns)$('answerContent').innerHTML=chosen.map((q,i)=>`<p><b>${i+1}.</b> ${escOutput(q.ans)}${q.exp?` — ${escOutput(q.exp)}`:''}</p>`).join('');
      renderMath(paper);
      origPanel.hidden=true;selectMode.hidden=true;composeBar.hidden=true;paper.hidden=false;downloadBar.hidden=false;
    };
  };
  const startProgress=()=>{let p=0;loading.hidden=false;const timer=setInterval(()=>{p=Math.min(p+Math.random()*8,92);progress.style.width=p+'%';progressText.textContent=Math.round(p)+'%';},600);return ()=>clearInterval(timer);};
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!file.files.length){msg.textContent='请先上传1道错题，再点击“生成题目”';return;}
    const activeTypes=[...form.querySelectorAll('.qtype-tag.active')].map(t=>t.dataset.type);
    if(!activeTypes.length){msg.textContent='请至少选择一种题型。';return;}
    const submit=e.submitter;submit.disabled=true;msg.textContent='正在解析错题…';
    const stop=startProgress();
    try{
      const qText=questionTextInput.value.trim();
      const prepared=await window.LearningCore.prepareFiles(file.files);
      const images=prepared.images;
      const selectedSubject=window.LearningCore.normalizeSubject(form.elements.subject.value);
      let base;
      if(qText)base=`错题内容：${qText}`+(images.length?'\n（另附错题原图，请结合图片核对以上文字）':'');
      else if(images.length)base='错题内容：（已上传错题图片，请读图提取题目、学生作答与批改痕迹）';
      else base='错题内容：（请以已提取的 PDF/DOCX 文字为准）';
      const {content:a1}=await window.LearningCore.chatAgent('07',{prompt:`${base}\n年级：${form.elements.grade.value}\n请解析这道错题。严格按格式输出：\n【学科】只写一个学科\n【年级】识别或采用用户选定年级\n【题干转录】完整题干与学生关键作答\n【知识点】用、分隔的 2-4 个知识点\n【考点】用、分隔的 2-3 个考点\n【答案解析】3 句以内：正确解法、学生错在哪一步、怎么改`,prepared,subject:selectedSubject,max_tokens:4000});
      const inferredSubject=selectedSubject||window.LearningCore.normalizeSubject((a1.match(/【学科】\s*([^\n]+)/)||[])[1]);
      if(!inferredSubject)throw new Error('无法可靠识别学科，请手动选择学科后重试。');
      const transcript=(a1.match(/【题干转录】([\s\S]*?)(?=【知识点】)/)||[])[1]?.trim()||qText;
      const cleanDiagnostic=value=>window.LearningCore.sanitizeModelOutput(value).split(/\s*---+\s*(?=#{|【|```|\[\s*\{)/)[0].trim().slice(0,1600);
      const analysis=[['学科',inferredSubject],['年级',(a1.match(/【年级】\s*([^\n]+)/)||[])[1]||form.elements.grade.value],['知识点',(a1.match(/【知识点】\s*([^\n]+)/)||[])[1]||''],['考点',(a1.match(/【考点】\s*([^\n]+)/)||[])[1]||''],['答案解析',cleanDiagnostic((a1.match(/【答案解析】([\s\S]*?)$/)||[])[1]||'')]];
      renderAnalysis(analysis);currentAnalysis=analysis;
      uploadStatus.textContent='错题解析完成，可直接生成题目';
      msg.textContent='解析完成，正在生成三类练习题…';
      const typeCounts=[['相似题',form.elements.countSimilar.value[0]],['变式题',form.elements.countVariant.value[0]],['综合应用题',form.elements.countApply.value[0]]];
      const want=typeCounts.filter(([name])=>activeTypes.includes(name)).map(([name,n])=>`${name}约 ${n*3} 道`).join('、');
      msg.textContent='解析完成，正在生成三类练习题…';
      const seed=Math.random().toString(36).slice(2,8);
      const activeSet=new Set(activeTypes);
      const nS=+form.elements.countSimilar.value[0],nV=+form.elements.countVariant.value[0],nA=+form.elements.countApply.value[0];
      const mkPrompt=(tag,spec,n)=>`原题学科：${inferredSubject}\n原题转录：${transcript}\n知识点：${analysis[2][1]}\n考点：${analysis[3][1]}\n错因：${analysis[4][1]}\n（随机种子：${seed}${tag}）\n请生成 ${n*3} 道“${tag}”练习题。${spec}全部题目必须是${inferredSubject}题，保留原题核心考点、学科符号和单位，不得转换为数学独立题。难度混合基础/中等/提高。只输出 JSON 数组，每项格式：\n[{"学科":"${inferredSubject}","类型":"${tag}","难度":"基础","题干":"……","选项":["A. ……","B. ……","C. ……","D. ……"],"答案":"A","解析":"一句话"}]\n解答题"选项"为空数组。公式放在成对的 $...$ 中；JSON 字符串里的 LaTeX 反斜杠必须写成双反斜杠。`;
      const specs={
        '相似题':'相似题=与原题同方法同类型的直接练习。',
        '变式题':'变式题=必须改变求解方向、受力或运动过程、表征形式、附加约束中的至少两项；至少包含逆向求解、分阶段过程、图表信息或新约束中的一项。禁止只替换数字、时间、质量或物体名称。',
        '综合应用题':'综合应用题=在本学科内联系两个以上考点，并引入新情境或多阶段过程；禁止复刻原题结构后只换数字。'
      };
      const jobs=[['相似题',nS],['变式题',nV],['综合应用题',nA]].filter(([name,n])=>activeSet.has(name)&&n>0);
      const pools=await Promise.all(jobs.map(async([name,n])=>{
        let parsed=[];
        const isMeaningfulVariant=q=>/(?:反求|求[^\n。；]{0,18}(?:力|质量|时间|加速度)|撤去|分阶段|先[^\n。；]{0,18}后|图像|图表|斜面|竖直|方向改变|变力|停止|匀减速|临界)/.test(String(q['题干']||q.stem||''));
        for(let attempt=0;attempt<(name==='变式题'?3:2);attempt++){
          const retry=attempt?'\n上一次未得到足量通过校验的题目。请严格返回合法 JSON，检查公式反斜杠转义、题干、答案和解析字段。'+(name==='变式题'?'变式题不得只更换数字或时间，必须改变求解方向、过程、表征或约束。':''):'';
          const {content:txt}=await window.LearningCore.chatAgent('07',{prompt:mkPrompt(name,specs[name],n)+retry,subject:inferredSubject,max_tokens:8000});
          parsed=parseJsonQuestions(txt)||[];
          const structurallyUsable=parsed.filter(q=>String(q['题干']||q.stem||'').trim()&&String(q['答案']||q.answer||'').trim()&&String(q['解析']||q.explain||'').trim()&&(name!=='变式题'||isMeaningfulVariant(q)));
          if(structurallyUsable.length>=n)break;
        }
        return parsed.filter(q=>name!=='变式题'||isMeaningfulVariant(q)).map(q=>({...q,'类型':name.replace('应用题','')}));
      }));
      const raw=[].concat(...pools);
      if(!raw.length)throw new Error('候选题解析失败，请重试。');
      const subjectSafe=raw.filter(q=>window.LearningCore.normalizeSubject(q['学科']||q.subject)===inferredSubject);
      if(!subjectSafe.length)throw new Error('生成题目未通过质量检查，请重新生成，或补充更清晰的原题内容。');
      const {selected}=validateQuestions(subjectSafe);
      const wanted={'相似':nS,'变式':nV,'综合':nA};
      currentQuestions=selected.filter(q=>wanted[q.kind]>0&&wanted[q.kind]-- >0);
      if(!currentQuestions.length||jobs.some(([name,n])=>currentQuestions.filter(q=>q.kind===name.replace('题','').replace('应用','')).length<n))throw new Error('有题型未生成足量且通过校验，请重试。');
      renderSelectMode();msg.textContent='';
    }catch(error){msg.textContent=error.message;}
    finally{stop();loading.hidden=true;submit.disabled=false;}
  });
  $('backBtn').addEventListener('click',renderSelectMode);
  $('pdfBtn').addEventListener('click',async()=>{const btn=$('pdfBtn');btn.disabled=true;btn.textContent='正在生成PDF…';try{await window.LearningCore.downloadPdf(paper,'错题举一反三-模拟试卷.pdf');}catch(error){msg.textContent=error.message;}finally{btn.disabled=false;btn.textContent='导出PDF';}});
  $('wordBtn').addEventListener('click',()=>{const blob=new Blob(['<html><head><meta charset="utf-8"></head><body>'+paper.innerHTML+'</body></html>'],{type:'application/msword'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='错题举一反三-模拟试卷.doc';a.click();URL.revokeObjectURL(a.href);});
}

/* —— 22 试卷变式机：按线上真实结构（难度/系数滑杆 + 逐题变式 + 组卷）—— */
function variantExamPage(t){
  app.innerHTML=`<section class="tool-page wa-page"><a class="back" href="#/">← 返回教师工作台</a><div class="tool-hero"><p class="module-group-kicker">MODULE / 22</p><h1>试卷变式机</h1><p class="tool-subtitle">UPLOAD EXAM · GENERATE VARIANTS</p></div><div class="tool-layout"><form class="tool-form" id="veForm"><label class="upload">上传试卷<small>可多选或拖拽，数量不限</small><input type="file" multiple accept="image/*,.pdf,.docx"><small class="file-status">支持 JPG、PNG、PDF、Word</small></label><label>或粘贴原卷题目<textarea name="paperText" placeholder="粘贴原卷的题目内容（一题一行或带题号）"></textarea></label><h3 class="wq-sec">变式设置</h3><div class="ve-slider"><label>变式难度 <b id="veDiffVal">8级</b></label><input type="range" name="difficulty" min="1" max="10" value="8"><small>1-10级逐级拉开，3级超简单，6级日常，8级中高考，10级奥林匹克</small></div><div class="ve-slider"><label>变式系数 <b id="veCoefVal">1级</b></label><input type="range" name="coefficient" min="1" max="5" value="1"><small>变式系数越大，题目变式变化程度就越大，默认 1 级</small></div><label>要求备注<textarea name="notes" placeholder="输入生成题目的额外要求（可不填）"></textarea></label><label class="check-row"><input type="checkbox" name="showAnswer" checked> 显示答案和解析</label><button class="modal-primary" type="submit">生成变式试卷</button><p class="form-message" aria-live="polite"></p></form><article class="result" id="veResult"><p class="module-group-kicker">变式结果</p><h2>等待上传试卷</h2><p>上传完整原卷后即可开始生成逐题变式。</p></article></div></section>`;
  const form=document.getElementById('veForm'), result=document.getElementById('veResult'), msg=form.querySelector('.form-message');
  form.querySelectorAll('input[type=file]').forEach(i=>i.addEventListener('change',()=>{const st=form.querySelector('.file-status');if(st)st.textContent=i.files.length?`已选择 ${i.files.length} 个文件`:'支持 JPG、PNG、PDF、Word';}));
  const diff=form.elements.difficulty, coef=form.elements.coefficient;
  diff.addEventListener('input',()=>document.getElementById('veDiffVal').textContent=diff.value+'级');
  coef.addEventListener('input',()=>document.getElementById('veCoefVal').textContent=coef.value+'级');
  const parsePair=(text)=>{const out=[];const re=/【原(\d+)】([\s\S]*?)(?=【原\d+】|【变\d+】|$)/g;const reV=/【变(\d+)】([\s\S]*?)(?=【原\d+】|【变\d+】|$)/g;const origs=[],vars=[];let m;
    while((m=re.exec(text)))origs.push(m[2].replace(/【原题】\s*/,'').trim());
    while((m=reV.exec(text))){const body=m[2];const stem=(body.match(/【题干】([\s\S]*?)(?=【选项】|【答案】|【解析】|$)/)||[])[1]?.trim()||body.trim();const opts=((body.match(/【选项】([\s\S]*?)(?=【答案】|【解析】|$)/)||[])[1]||'').split(/\s*\|\s*/).map(s=>s.trim()).filter(Boolean);const ans=((body.match(/【答案】\s*([^\n]+)/)||[])[1]||'').trim();const exp=((body.match(/【解析】([\s\S]*?)$/)||[])[1]||'').trim();vars.push({stem,opts,ans,exp});}
    vars.forEach((v,i)=>out.push({orig:origs[i]||'',...v}));return out;};
  const renderCards=(pairs)=>{
    result.innerHTML=`<div class="wa-matrix"><div class="wa-group"><h3>逐题变式（原题 → 变式题）</h3>${pairs.map((p,i)=>`<label class="wa-qcard ve-card"><input type="checkbox" data-qi="${i}" checked><span class="wa-qnum">${i+1}</span><div class="wa-qbody">${p.orig?`<p class="ve-orig">原题：${escOutput(p.orig)}</p>`:''}<p>${escOutput(p.stem)}</p>${p.opts.length?`<ul>${p.opts.map(o=>`<li>${escOutput(o)}</li>`).join('')}</ul>`:''}</div></label>`).join('')}</div></div><div class="wa-bar"><button type="button" class="text-action" id="veAll">全选</button><span id="veCount"></span><button type="button" class="modal-primary" id="veCompose">组卷</button></div>`;
    renderMath(result);
    const boxes=[...result.querySelectorAll('input[type=checkbox]')];
    const count=()=>result.querySelector('#veCount').textContent=`已选 ${boxes.filter(b=>b.checked).length} 题`;
    count();boxes.forEach(b=>b.addEventListener('change',count));
    result.querySelector('#veAll').addEventListener('click',()=>{const on=boxes.some(b=>!b.checked);boxes.forEach(b=>b.checked=on);count();});
    result.querySelector('#veCompose').addEventListener('click',()=>{
      const chosen=pairs.filter((_,i)=>result.querySelector(`input[data-qi="${i}"]`)?.checked);
      const withAns=form.elements.showAnswer.checked;
      result.innerHTML=`<div class="wa-paper"><header><h2>试卷变式 · 变式训练卷</h2><p>${chosen.length} 题 · 难度 ${diff.value} 级 · 系数 ${coef.value} 级</p></header><section class="wa-questions">${chosen.map((p,i)=>`<div class="wa-pq"><b>${i+1}.</b><div><p>${escOutput(p.stem)}</p>${p.opts.length?`<ul>${p.opts.map(o=>`<li>${escOutput(o)}</li>`).join('')}</ul>`:''}</div></div>`).join('')}</section>${withAns?`<section class="wa-ans"><h3>参考答案与解析</h3>${chosen.map((p,i)=>`<p><b>${i+1}.</b> ${escOutput(p.ans)}${p.exp?` — ${escOutput(p.exp)}`:''}</p>`).join('')}</section>`:''}<div class="report-actions"><button type="button" class="text-action" id="veBack">返回上传</button><button type="button" class="text-action" id="vePdf">导出PDF</button><button type="button" class="text-action" id="veWord">导出Word</button></div></div>`;
      renderMath(result);
      result.querySelector('#veBack').addEventListener('click',()=>renderCards(pairs));
      result.querySelector('#vePdf').addEventListener('click',async()=>{const btn=result.querySelector('#vePdf');btn.disabled=true;btn.textContent='正在生成PDF…';try{await window.LearningCore.downloadPdf(result.querySelector('.wa-paper'),'试卷变式-训练卷.pdf');}catch(error){msg.textContent=error.message;}finally{btn.disabled=false;btn.textContent='导出PDF';}});
      result.querySelector('#veWord').addEventListener('click',()=>{const blob=new Blob(['<html><head><meta charset="utf-8"></head><body>'+result.innerHTML+'</body></html>'],{type:'application/msword'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='试卷变式-训练卷.doc';a.click();URL.revokeObjectURL(a.href);});});};
  form.addEventListener('submit',async e=>{
    e.preventDefault();msg.textContent='';
    const pt=form.elements.paperText.value.trim(), file=form.querySelector('input[type=file]');
    if(!pt&&!file.files.length){msg.textContent='请先上传试卷，或粘贴原卷题目。';return;}
    const submit=e.submitter;submit.disabled=true;msg.textContent='正在生成变式试卷…';
    try{
      const a1=await requestOutput('试卷变式机',`原卷内容：${pt||'（见上传文件名：'+[...file.files].map(f=>f.name).join('、')+'，未读取内容）'}
变式难度：${diff.value} 级（1-10级，3级超简单，6级日常，8级中高考，10级奥林匹克）
变式系数：${coef.value} 级（系数越大变化越大）
${form.elements.notes.value.trim()?'额外要求：'+form.elements.notes.value.trim()+'\n':''}请为原卷每道题生成一道变式题，保持考点一致。严格按格式输出（序号对应原题）：
【原1】【原题】原题摘要一行
【变1】【题干】变式题全文
【选项】A. … | B. … | C. … | D. …（解答题可省略此行）
【答案】字母或简答
【解析】一句话`);
      const pairs=parsePair(a1);
      if(!pairs.length)throw new Error('变式题解析失败，请重试。');
      renderCards(pairs);msg.textContent='';result.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){msg.textContent=error.message;}finally{submit.disabled=false;}});}

function wrongAttributionPage(t){
  const grades=['小学三年级','小学四年级','小学五年级','小学六年级','七年级','八年级','九年级','高一','高二','高三'];
  const subjects=['语文','数学','英语','物理','化学','生物','历史','地理','政治'];
  const counts=n=>Array.from({length:n},(_,i)=>`<option${i===0?' selected':''}>${i+1}题</option>`).join('');
  app.innerHTML=`<section class="tool-page wa-page"><a class="back" href="#/">← 返回教师工作台</a><div class="tool-hero"><p class="module-group-kicker">MODULE / 12</p><h1>错题归因追分器</h1><p class="tool-subtitle">一题一包 · 精准追击 · 直击错因</p></div><div class="tool-layout"><form class="tool-form" id="waForm"><label>年级<select name="grade">${grades.map(g=>`<option>${g}</option>`).join('')}</select></label><label>科目<select name="subject">${subjects.map(s=>`<option>${s}</option>`).join('')}</select></label><label>上传错题（1 道）<input type="file" accept="image/*,.pdf"><small class="file-status">PNG / JPG / PDF</small></label><label>或粘贴错题与学生作答<textarea name="questionText" placeholder="题目 + 学生答案（含批改/错因更佳）"></textarea></label><div class="wa-counts"><label>相似题<select name="countSimilar">${counts(3)}</select></label><label>变式题<select name="countVariant">${counts(3)}</select></label><label>综合应用题<select name="countApply">${counts(3)}</select></label></div><label class="check-row"><input type="checkbox" name="showOriginal" checked> 显示原题</label><label class="check-row"><input type="checkbox" name="showAnswer" checked> 显示答案和解析</label><button class="modal-primary" type="submit">生成归因追分结果</button><p class="form-message" aria-live="polite"></p></form><article class="result" id="waResult"><p class="module-group-kicker">归因追分结果</p><h2>先上传 1 道错题</h2><p>AI 会自动拆解考点、判断错因，并生成三类训练矩阵。</p></article></div></section>`;
  const form=document.getElementById('waForm'), result=document.getElementById('waResult'), msg=form.querySelector('.form-message');
  form.querySelectorAll('input[type=file]').forEach(i=>i.addEventListener('change',()=>{const st=i.parentElement.querySelector('.file-status');if(st)st.textContent=i.files.length?`已选择：${[...i.files].map(f=>f.name).join('、')}`:'PNG / JPG / PDF';}));
  const parseBlocks=(text,keys)=>{const out=[];const re=/【(同源|变式|综合)(\d+)】([\s\S]*?)(?=【(?:同源|变式|综合)\d+】|$)/g;let m;while((m=re.exec(text))){const kind=keys[m[1]];const body=m[3];const stem=(body.match(/【题干】([\s\S]*?)(?=【选项】|【答案】|【解析】|$)/)||[])[1]?.trim()||body.trim();const opts=((body.match(/【选项】([\s\S]*?)(?=【答案】|【解析】|$)/)||[])[1]||'').split(/\s*\|\s*/).map(s=>s.trim()).filter(Boolean);const ans=((body.match(/【答案】\s*([^\n]+)/)||[])[1]||'').trim();const exp=((body.match(/【解析】([\s\S]*?)$/)||[])[1]||'').trim();out.push({kind,stem,opts,ans,exp});}return out;};
  const renderMatrix=(analysis,questions)=>{
    const groups=[['同源基础题','同源'],['变式训练题','变式'],['综合应用题','综合']];
    result.innerHTML=`<div class="wa-analysis"><p class="module-group-kicker">错题解析</p>${analysis.map(([k,v])=>`<div class="wa-ana-row"><b>${escOutput(k)}</b><p>${escOutput(v)}</p></div>`).join('')}</div><div class="wa-matrix">${groups.map(([title,key])=>{const qs=questions.filter(q=>q.kind===key);if(!qs.length)return'';return `<div class="wa-group"><h3>${title}</h3>${qs.map((q,i)=>`<label class="wa-qcard"><input type="checkbox" data-qi="${questions.indexOf(q)}" checked><span class="wa-qnum">${i+1}</span><div class="wa-qbody"><p>${escOutput(q.stem)}</p>${q.opts.length?`<ul>${q.opts.map(o=>`<li>${escOutput(o)}</li>`).join('')}</ul>`:''}</div></label>`).join('')}</div>`;}).join('')}</div><div class="wa-bar"><button type="button" class="text-action" id="waAll">全选</button><span id="waCount"></span><button type="button" class="modal-primary" id="waCompose">组卷</button></div>`;
    renderMath(result);
    const boxes=[...result.querySelectorAll('input[type=checkbox]')];
    const count=()=>result.querySelector('#waCount').textContent=`已选 ${boxes.filter(b=>b.checked).length} 题`;
    count();boxes.forEach(b=>b.addEventListener('change',count));
    result.querySelector('#waAll').addEventListener('click',()=>{const on=boxes.some(b=>!b.checked);boxes.forEach(b=>b.checked=on);count();});
    result.querySelector('#waCompose').addEventListener('click',()=>compose(analysis,questions));};
  const compose=(analysis,questions)=>{
    const chosen=questions.filter((_,i)=>result.querySelector(`input[data-qi="${i}"]`)?.checked);
    const withOrig=form.elements.showOriginal.checked, withAns=form.elements.showAnswer.checked;
    result.innerHTML=`<div class="wa-paper"><header><h2>${escOutput(form.elements.grade.value)}${escOutput(form.elements.subject.value)} · 归因追分训练卷</h2><p>${chosen.length} 题 · 相似/变式/综合分层</p></header>${withOrig?`<section class="wa-orig"><h3>原题展示</h3><p>${escOutput(form.elements.questionText.value.trim()||'（见上传文件）')}</p></section>`:''}<section class="wa-questions">${chosen.map((q,i)=>`<div class="wa-pq"><b>${i+1}.</b><div><p>${escOutput(q.stem)}</p>${q.opts.length?`<ul>${q.opts.map(o=>`<li>${escOutput(o)}</li>`).join('')}</ul>`:''}</div></div>`).join('')}</section>${withAns?`<section class="wa-ans"><h3>参考答案与解析</h3>${chosen.map((q,i)=>`<p><b>${i+1}.</b> ${escOutput(q.ans)}${q.exp?` — ${escOutput(q.exp)}`:''}</p>`).join('')}</section>`:''}<div class="report-actions"><button type="button" class="text-action" id="waBack">返回矩阵</button><button type="button" class="text-action" id="waPdf">导出PDF</button><button type="button" class="text-action" id="waWord">导出WORD</button></div></div>`;
    renderMath(result);
    result.querySelector('#waBack').addEventListener('click',()=>renderMatrix(analysis,questions));
    result.querySelector('#waPdf').addEventListener('click',async()=>{const btn=result.querySelector('#waPdf');btn.disabled=true;btn.textContent='正在生成PDF…';try{await window.LearningCore.downloadPdf(result.querySelector('.wa-paper'),'错题归因追分-训练卷.pdf');}catch(error){msg.textContent=error.message;}finally{btn.disabled=false;btn.textContent='导出PDF';}});
    result.querySelector('#waWord').addEventListener('click',()=>{const blob=new Blob(['<html><head><meta charset="utf-8"></head><body>'+result.innerHTML+'</body></html>'],{type:'application/msword'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='归因追分训练卷.doc';a.click();URL.revokeObjectURL(a.href);});};
  form.addEventListener('submit',async e=>{
    e.preventDefault();msg.textContent='';
    const qt=form.elements.questionText.value.trim(), file=form.querySelector('input[type=file]');
    if(!qt&&!file.files.length){msg.textContent='请上传 1 道错题，或粘贴错题内容。';return;}
    const submit=e.submitter;submit.disabled=true;msg.textContent='正在解析错题…';
    try{
      const base=`年级：${form.elements.grade.value}\n科目：${form.elements.subject.value}\n错题内容：${qt||'（见上传文件名：'+[...file.files].map(f=>f.name).join('、')+'，未读取内容）'}`;
      const a1=await requestOutput('错题归因·解析',`${base}\n请解析这道错题。严格按格式输出：\n【知识点】用、分隔的 2-4 个知识点\n【考点】用、分隔的 2-3 个考点\n【错因解析】3 句以内：错在哪一步、属于知识/方法/审题/运算哪类错因、怎么改`);
      const analysis=[['知识点',(a1.match(/【知识点】\s*([^\n]+)/)||[])[1]||''],['考点',(a1.match(/【考点】\s*([^\n]+)/)||[])[1]||''],['错因解析',(a1.match(/【错因解析】([\s\S]*?)$/)||[])[1]?.trim()||'']];
      msg.textContent='解析完成，正在生成三类训练矩阵…';
      const nS=form.elements.countSimilar.value[0],nV=form.elements.countVariant.value[0],nA=form.elements.countApply.value[0];
      const a2=await requestOutput('错题归因·训练矩阵',`${base}\n错因：${analysis[2][1]}\n请生成训练题：同源基础题 ${nS} 道、变式训练题 ${nV} 道、综合应用题 ${nA} 道。严格按格式输出（序号从1开始各自编号）：\n【同源1】【题干】…\n【选项】A. … | B. … | C. … | D. …\n【答案】字母\n【解析】一句话\n（变式题用【变式1】开头，综合题用【综合1】开头，格式同上；计算题可省略【选项】行）`);
      const questions=parseBlocks(a2,{同源:'同源',变式:'变式',综合:'综合'});
      if(!questions.length)throw new Error('训练题解析失败，请重试。');
      renderMatrix(analysis,questions);msg.textContent='';result.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){msg.textContent=error.message;}finally{submit.disabled=false;}});}

function senseTrainingPage(t){
  const grades=[['小学三年级','三年级'],['小学四年级','四年级'],['小学五年级','五年级'],['小学六年级','六年级'],['初一','七年级'],['初二','八年级'],['初三','九年级'],['高一','十年级'],['高二','十一年级'],['高三','十二年级']];
  const subjectPool=['语文','数学','英语','物理','化学','生物','历史','地理','政治'];
  const availableSubjects=grade=>grade.startsWith('小学')?subjectPool.slice(0,3):grade.startsWith('初')?subjectPool.slice(0,grade==='初一'?3:grade==='初二'?4:5):subjectPool;
  app.innerHTML=`<section class="sense-page"><header class="sense-hero"><h1>题感训练</h1><p>做100道题不如看透10道题</p></header><div class="sense-stats"><div><b id="senseDone">0</b><span>已训练</span></div><div><b id="senseRate">-</b><span>正确率</span></div><div><b id="senseStreak">0</b><span>连续正确</span></div></div><div class="sense-rule"></div><form class="sense-form" id="senseForm"><div class="sense-picker-row"><section class="sense-grade-section"><h2>选择年级</h2><div class="choice-grid grade-grid">${grades.map(g=>`<button type="button" class="choice-card" data-grade="${g[0]}"><b>${g[0]}</b><span>${g[1]}</span></button>`).join('')}</div></section><section class="subject-section"><h2>选择学科</h2><p class="subject-empty">请先选择年级</p><div class="choice-grid subject-grid" hidden></div></section></div><section class="sense-knowledge"><h2>输入知识点</h2><input id="knowledgeInput" name="knowledge" autocomplete="off" placeholder="例如：二次函数图像、浮力、化学方程式配平、光合作用..."><p class="knowledge-hint">后续题目会围绕这个知识点连续训练。</p><p class="sense-notice">默认快速训练：一次生成10题，同一原题完成三次命题意图判断后集中反馈。</p></section><button class="sense-start" type="submit" disabled>开始训练</button><p class="form-message" aria-live="polite"></p></form><article class="sense-result" id="senseResult" hidden></article></section>`;
  const form=document.getElementById('senseForm'), result=document.getElementById('senseResult'), msg=form.querySelector('.form-message'); let selectedGrade='',selectedSubject='';
  const subjectGrid=form.querySelector('.subject-grid'), subjectEmpty=form.querySelector('.subject-empty');
  const bindSubjects=()=>form.querySelectorAll('[data-subject]').forEach(btn=>btn.addEventListener('click',()=>{selectedSubject=btn.dataset.subject;form.querySelectorAll('[data-subject]').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');sync();}));
  form.querySelectorAll('[data-grade]').forEach(btn=>btn.addEventListener('click',()=>{selectedGrade=btn.dataset.grade;selectedSubject='';form.querySelectorAll('[data-grade]').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');subjectEmpty.hidden=true;subjectGrid.hidden=false;subjectGrid.innerHTML=availableSubjects(selectedGrade).map(s=>`<button type="button" class="choice-card subject-card" data-subject="${s}"><b>${s}</b></button>`).join('');bindSubjects();sync();}));
  const sync=()=>{form.querySelector('button[type=submit]').disabled=!(selectedGrade&&selectedSubject&&form.elements.knowledge.value.trim());}; form.elements.knowledge.addEventListener('input',sync);
  const state={qIndex:0,total:10,completed:0,attempted:0,correct:0,streak:0,stepIdx:0,bank:[],responses:[],bankReady:null,loadError:null};
  const parseBank=text=>{try{const clean=String(text).replace(/```(?:json)?/g,'').trim();const a=clean.indexOf('['),b=clean.lastIndexOf(']');return a>=0&&b>a?JSON.parse(clean.slice(a,b+1)):null;}catch{return null;}};
  const normalizeBank=list=>{
    if(!Array.isArray(list))return[];const seen=new Set();const defs=window.QuestionSenseRules?.stepDefinitions||[];
    const riskyClassification=/下列[\s\S]{0,120}(?:属于|不属于)[\s\S]{0,40}(?:一项|的是)/;
    return list.map(raw=>{const stem=String(raw.stem||raw['题干']||'').trim();const subject=window.LearningCore.normalizeSubject(raw.subject||raw['学科']);const sourceAnswer=String(raw.source_answer||raw['原题答案']||'').trim(),sourceExplanation=String(raw.source_explanation||raw['原题解析']||'').trim();const ri=raw.examiner_intent||raw['命题意图']||{};const intent={target:String(ri.target||ri['考查目标']||'').trim(),evidence:String(ri.evidence||ri['决定性证据']||'').trim(),discriminator:String(ri.discriminator||ri['区分动作']||'').trim(),trap:String(ri.trap||ri['干扰机制']||'').trim(),analysis:String(ri.analysis||ri['整题解析']||'').trim()};const steps=(raw.steps||raw['三连问']||[]).map((s,i)=>({type:String(s.type||defs[i]?.type||'').trim(),label:String(s.label||defs[i]?.label||'').trim(),prompt:String(s.prompt||s['问题']||defs[i]?.prompt||'').trim(),opts:(s.options||s['选项']||[]).map(String),ans:String(s.answer||s['答案']||'').trim().charAt(0).toUpperCase(),explain:String(s.explanation||s['解析']||'').trim()}));return{subject,stem,sourceAnswer,sourceExplanation,diff:String(raw.difficulty||raw['难度']||'中等'),intent,steps};}).filter(q=>q.subject===selectedSubject&&q.stem.length>20&&!riskyClassification.test(q.stem)&&q.sourceAnswer.length>=1&&q.sourceExplanation.length>=18&&!seen.has(q.stem)&&(seen.add(q.stem),true)&&Object.values(q.intent).every(x=>x.length>=6)&&q.steps.length===3&&q.steps.every((s,i)=>s.type===['knowledge','method','trap'][i]&&s.prompt&&s.opts.length===4&&/^[A-D]$/.test(s.ans)&&s.explain.length>=6));
  };
  const stats=()=>{document.getElementById('senseDone').textContent=state.completed;document.getElementById('senseRate').textContent=state.attempted?Math.round(state.correct/state.attempted*100)+'%':'-';document.getElementById('senseStreak').textContent=state.streak;};
  const generateBank=async()=>{
    msg.textContent='AI 正在分五个小批次并行生成 10 题，并校验命题意图…';
    form.hidden=true;result.hidden=false;
    result.innerHTML=`<div class="sense-loading"><span></span><h2>AI正在并行生成五个小批次...</h2><p>任意一批 2 题通过校验即可开始，其余题目后台继续准备</p></div>`;
    const knowledge=form.elements.knowledge.value.trim();
    const rules=window.QuestionSenseRules;
    if(!rules?.buildPrompt)throw new Error('题感训练规则文件未加载，请刷新页面后重试。');
    const batches=[
      {batchLabel:'第 1 批',difficultyPlan:'基础 2 题',variationRule:'题干直接呈现，聚焦核心概念边界'},
      {batchLabel:'第 2 批',difficultyPlan:'基础 1 题、中等 1 题',variationRule:'使用典型语境或数据，聚焦相似概念对比'},
      {batchLabel:'第 3 批',difficultyPlan:'中等 2 题',variationRule:'使用反向条件或必要条件辨析'},
      {batchLabel:'第 4 批',difficultyPlan:'中等 2 题',variationRule:'使用材料迁移或选项之间的细微差别'},
      {batchLabel:'第 5 批',difficultyPlan:'提高 2 题',variationRule:'使用复合语境、多步证据链与高质量干扰项'},
    ];
    const auditBatch=async batch=>{const {content}=await window.LearningCore.chatGrounded({system:`你是独立的 K12 试题审校员。你不重写题目，只判断能否发布。必须逐题独立求解原题，并严格检查：原题是否只有一个正确答案；source_answer 和 source_explanation 是否与题干、选项一致；examiner_intent 与 knowledge/method/trap 是否共用同一条证据链；是否存在学科事实错误。任意一项有疑义就判定不通过。`,prompt:`审查以下${selectedSubject}题组：\n${JSON.stringify(batch)}\n只输出 JSON，格式为 {"valid":true,"issues":[]} 或 {"valid":false,"issues":["具体问题"]}。`,subject:selectedSubject,max_tokens:1000,temperature:0});const clean=String(content).replace(/```(?:json)?/g,'').trim(),a=clean.indexOf('{'),b=clean.lastIndexOf('}');try{return a>=0&&b>a&&JSON.parse(clean.slice(a,b+1)).valid===true;}catch{return false;}};
    const makeBatch=async spec=>{let batch=[];for(let attempt=0;attempt<2;attempt++){const {content}=await window.LearningCore.chatAgent('21',{prompt:rules.buildPrompt({grade:selectedGrade,subject:selectedSubject,knowledge,count:2,...spec,retry:attempt>0}),subject:selectedSubject,max_tokens:4500,temperature:.18});batch=normalizeBank(parseBank(content));if(batch.length===2&&await auditBatch(batch))return batch;batch=[];}throw new Error(`${spec.batchLabel}未通过原题唯一答案与命题意图校验。`);};
    state.bank=[];state.total=10;state.qIndex=0;state.stepIdx=0;state.responses=[];state.loadError=null;
    const seen=new Set();
    const jobs=batches.map(spec=>makeBatch(spec).then(items=>{items.forEach(q=>{if(!seen.has(q.stem)){seen.add(q.stem);state.bank.push(q);}});return items;}));
    await Promise.any(jobs);
    if(!state.bank.length)throw new Error('首批题目未通过命题意图校验，请重试。');
    state.bankReady=Promise.allSettled(jobs).then(()=>{if(state.bank.length!==10)throw new Error(`10 题批量结构校验未通过（通过 ${state.bank.length} 题），请重试。`);return state.bank;}).catch(error=>{state.loadError=error;throw error;});
    state.bankReady.catch(()=>{});msg.textContent='';renderStep();
  };
  const escQ=s=>escOutput(s);
  const optionText=(step,letter)=>String(step.opts['ABCD'.indexOf(letter)]||'').replace(/^\s*[A-D][.\u3001\s]+/i,'');
  function renderSummary(){
    const q=state.bank[state.qIndex],score=state.responses.filter(x=>x.right).length;
    result.innerHTML=`<div class="sense-training-head"><span class="sense-difficulty">${escQ(q.diff||'中等')}</span><h2>第 ${state.qIndex+1} / ${state.total} 题·命题意图复盘</h2></div><div class="sense-summary-score"><b>${score}</b><span>答对 / 3</span></div><section class="sense-summary-list">${q.steps.map((step,i)=>{const r=state.responses[i],right=r?.right;return`<article class="sense-judgement-card ${right?'is-right':'is-wrong'}"><h3>${right?'✓':'✕'} ${escQ(step.label)}：${right?'正确':'错误'}</h3><p>你选了：${escQ(optionText(step,r?.choice))}</p>${right?'':`<p>正确答案：${escQ(optionText(step,step.ans))}</p>`}</article>`;}).join('')}</section><section class="sense-intent-analysis"><h3>命题意图解析</h3><p>${escQ(q.intent.analysis)}</p><dl><div><dt>原题唯一答案</dt><dd>${escQ(q.sourceAnswer)}</dd></div><div><dt>原题解答依据</dt><dd>${escQ(q.sourceExplanation)}</dd></div><div><dt>考查目标</dt><dd>${escQ(q.intent.target)}</dd></div><div><dt>决定性证据</dt><dd>${escQ(q.intent.evidence)}</dd></div><div><dt>区分动作</dt><dd>${escQ(q.intent.discriminator)}</dd></div><div><dt>干扰机制</dt><dd>${escQ(q.intent.trap)}</dd></div></dl></section><div class="sense-summary-actions"><button type="button" class="sense-summary-back" id="senseBack">返回</button><button type="button" class="sense-next" id="senseNextQuestion">${state.qIndex+1>=state.total?'查看本组成绩':'下一题'}</button></div>`;
    renderMath(result);
    result.querySelector('#senseBack').onclick=()=>{form.hidden=false;result.hidden=true;};
    result.querySelector('#senseNextQuestion').onclick=async()=>{if(state.qIndex+1>=state.total){result.innerHTML=`<div class="sense-finish"><p>本组完成</p><h2>已看透 ${state.total} 道题</h2><span>命题意图判断正确率 ${Math.round(state.correct/Math.max(state.attempted,1)*100)}%，连续全对 ${state.streak} 题。</span><div><button type="button" class="sense-next" id="senseMore">继续生成10题</button><a class="sense-home" href="#/">返回首页</a></div></div>`;result.querySelector('#senseMore')?.addEventListener('click',()=>{Object.assign(state,{qIndex:0,stepIdx:0,responses:[]});generateBank().catch(e=>{msg.textContent=e.message;});});return;}if(state.qIndex+1>=state.bank.length){result.innerHTML=`<div class="sense-loading"><span></span><h2>正在准备下一批题目...</h2><p>后台正在完成剩余命题意图校验</p></div>`;try{await state.bankReady;}catch(error){result.innerHTML=`<div class="sense-finish"><p>后续批次未通过校验</p><h2>${escQ(error.message)}</h2><div><button type="button" class="sense-next" id="senseRetry">重新生成</button></div></div>`;result.querySelector('#senseRetry').onclick=()=>generateBank().catch(e=>{msg.textContent=e.message;});return;}}state.qIndex++;state.stepIdx=0;state.responses=[];renderStep();};
  }
  function renderStep(){
    const q=state.bank[state.qIndex];
    const step=q.steps[state.stepIdx];
    result.innerHTML=`<div class="sense-training-head"><span class="sense-difficulty">${escQ(q.diff||'中等')}</span><h2>第 ${state.qIndex+1} / ${state.total} 题</h2></div><div class="sense-q"><div class="sense-stem"><span>原题</span><p>${escQ(q.stem)}</p></div><p class="sense-step-count">${state.stepIdx+1} / ${q.steps.length}·${escQ(step.label)}</p><h3>${escQ(step.prompt)}</h3><div class="sense-options">${step.opts.map((o,i)=>{const letter='ABCD'[i];return`<button type="button" class="sense-option" data-letter="${letter}"><span>${letter}</span><b>${escQ(optionText(step,letter))}</b></button>`;}).join('')}</div></div><p class="sense-remain">同一道原题完成三次命题意图判断后，统一显示结果与解析。</p>`;
    renderMath(result);
    result.querySelectorAll('.sense-option').forEach(btn=>btn.addEventListener('click',()=>{
      if(result.querySelector('.sense-option.locked'))return;
      const choice=btn.dataset.letter;
      const right=choice===step.ans;
      state.responses[state.stepIdx]={choice,right};state.attempted++;if(right)state.correct++;
      result.querySelectorAll('.sense-option').forEach(b=>b.classList.add('locked'));btn.classList.add('selected-answer');
      window.setTimeout(()=>{if(state.stepIdx<q.steps.length-1){state.stepIdx++;renderStep();return;}const score=state.responses.filter(x=>x.right).length;state.completed++;state.streak=score===3?state.streak+1:0;stats();renderSummary();},180);
    }));}
  form.addEventListener('submit',async e=>{e.preventDefault();sync();if(e.submitter?.disabled)return;const submit=e.submitter;submit.disabled=true;Object.assign(state,{qIndex:0,completed:0,attempted:0,correct:0,streak:0,stepIdx:0,bank:[],responses:[],bankReady:null,loadError:null});stats();try{await generateBank();}catch(error){result.hidden=true;form.hidden=false;msg.textContent=error.message;}finally{submit.disabled=false;}});
}

function route(){if(authDialog?.open)authDialog.close();const m=location.hash.match(/^#tool\/(\d+)/);const isSense=m?.[1]==='21';document.body.classList.toggle('sense-route',isSense);const brandSub=document.querySelector('.brand-copy small');if(brandSub)brandSub.textContent=isSense?'UNIFIED WORKSTATION':'TEACHER AI WORKSTATION';if(isSense)account.textContent='123321';else if(account.textContent==='123321')account.textContent='本地教师 ⌄';m?toolPage(byId(m[1])):home()} window.addEventListener('hashchange',route);route();account.onclick=()=>authDialog.showModal();authForm.onsubmit=e=>{e.preventDefault();const name=authForm.username.value.trim()||'本地教师';account.textContent=name+' ⌄';authMessage.textContent='登录成功，本地演示账号已启用。';setTimeout(()=>authDialog.close(),500)};

})();
