const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

// 图片以 base64 data URL 内嵌在 JSON 里，体积比原图膨胀约 1/3，需要放宽请求体上限。
const MAX_BODY = 90 * 1024 * 1024;
const API_VERSION = '2023-06-01';
const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_MODEL = 'claude-opus-4-7';
const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const ZHIPU_DEFAULT_MODEL = 'glm-4.5';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES_PER_REQUEST = 10;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_EXTRACT_FILES = 10;
const MAX_PDF_HTML_CHARS = 15 * 1024 * 1024;
const CHROME_PATHS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean);
const PDF_EXTRACT_SWIFT = `
import Foundation
import PDFKit
let input = CommandLine.arguments[1]
guard let document = PDFDocument(url: URL(fileURLWithPath: input)) else { exit(2) }
for index in 0..<document.pageCount {
  if let text = document.page(at: index)?.string { print(text) }
}
`;

// Claude/GPT/Gemini 系模型本身多模态；GLM 纯文本型号（glm-4.5 等）需要换成带 v 的视觉型号。
function pickVisionModel(model, override) {
  if (!/^glm/i.test(model) || /\dv/i.test(model) || /vision/i.test(model)) return model;
  return override || `${model}v`;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function handleStatus(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET 请求。' } });
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY || process.env.ZHIPU_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_AUTH_TOKEN);
  const provider = hasOpenAI ? 'OpenAI 兼容/智谱' : hasAnthropic ? 'Anthropic 兼容' : '未配置';
  const model = hasOpenAI
    ? (process.env.OPENAI_MODEL || process.env.ZHIPU_MODEL || ZHIPU_DEFAULT_MODEL)
    : hasAnthropic ? (process.env.ANTHROPIC_MODEL || DEFAULT_MODEL) : '';
  return sendJson(res, 200, {
    configured: hasOpenAI || hasAnthropic,
    provider,
    model,
    capabilities: ['vision_ocr', 'pdf_text_extract', 'docx_text_extract', 'subject_guard', 'structured_validation', 'math_typesetting', 'pdf_export'],
  });
}

function readJson(req, res) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY) {
        sendJson(res, 413, { error: { code: 'REQUEST_TOO_LARGE', message: '请求内容过大。' } });
        req.destroy();
        reject(new Error('request too large'));
      }
    });
    req.on('end', () => {
      if (!body) return reject(new Error('empty request'));
      try { resolve(JSON.parse(body)); } catch { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

function callAnthropic(payload) {
  return new Promise((resolve, reject) => {
    const baseUrl = new URL(process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL);
    if (baseUrl.protocol !== 'https:') return reject(Object.assign(new Error('unsupported upstream protocol'), { status: 502 }));
    const basePath = baseUrl.pathname.replace(/\/+$/, '');
    const request = https.request({
      hostname: baseUrl.hostname,
      port: baseUrl.port || 443,
      path: `${basePath.endsWith('/v1') ? basePath : `${basePath}/v1`}/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_AUTH_TOKEN,
        'anthropic-version': API_VERSION,
      },
    }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch { return reject(Object.assign(new Error('invalid upstream response'), { status: 502 })); }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error('upstream request failed');
          error.status = response.statusCode === 429 ? 429 : 502;
          return reject(error);
        }
        const content = Array.isArray(data.content)
          ? data.content.filter(block => block.type === 'text').map(block => block.text).join('\n')
          : '';
        if (!content) {
          // 思考型模型（GLM-4.5 等）在 max_tokens 过小时会把额度耗在思考段上，
          // 正文为空。给出可行动的错误而不是笼统的 502。
          const error = new Error(data?.stop_reason === 'max_tokens'
            ? '输出长度不足：模型思考段占满了 max_tokens，请加大输出长度后重试。'
            : '上游未返回正文内容。');
          error.status = 502; error.expose = true;
          return reject(error);
        }
        resolve({ content, usage: data.usage || null });
      });
    });
    request.setTimeout(300000, () => request.destroy(Object.assign(new Error('upstream timeout'), { code: 'TIMEOUT' })));
    request.on('error', reject);
    request.end(JSON.stringify(payload));
  });
}

function callZhipu(messages, maxTokens, temperature, hasImages) {
  return new Promise((resolve, reject) => {
    const baseUrl = (process.env.OPENAI_BASE_URL || process.env.ZHIPU_BASE_URL || ZHIPU_BASE_URL).replace(/\/+$/, '');
    const configuredModel = process.env.OPENAI_MODEL || process.env.ZHIPU_MODEL || ZHIPU_DEFAULT_MODEL;
    const payload = {
      // 带图请求时普通对话型号（如 glm-4.5）会拒收，自动切视觉型号，可用 ZHIPU_VISION_MODEL 覆盖。
      model: hasImages ? pickVisionModel(configuredModel, process.env.ZHIPU_VISION_MODEL) : configuredModel,
      messages,
      max_tokens: maxTokens,
    };
    // Qwen 兼容端点默认开启推理时，图片教学诊断会额外等待十几到数十秒。
    // 这些工具已有显式证据链与结构校验，默认关闭隐藏推理以降低交互延迟。
    if (/^qwen/i.test(configuredModel) && process.env.OPENAI_ENABLE_THINKING !== 'true') payload.enable_thinking = false;
    if (Number.isFinite(temperature)) payload.temperature = temperature;
    const request = https.request(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      },
    }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch { return reject(Object.assign(new Error('invalid upstream response'), { status: 502 })); }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(data?.error?.message || `upstream ${response.statusCode}`);
          error.status = response.statusCode === 429 ? 429 : 502;
          error.expose = true;
          return reject(error);
        }
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content) return reject(Object.assign(new Error('missing upstream content'), { status: 502 }));
        resolve({ content, usage: data.usage || null });
      });
    });
    request.setTimeout(120000, () => request.destroy(Object.assign(new Error('upstream timeout'), { code: 'TIMEOUT' })));
    request.on('error', reject);
    request.end(JSON.stringify(payload));
  });
}

// 消息内容统一为：字符串，或 user 角色的分片数组 [{type:'text',text}|{type:'image_url',image_url:{url}}]。
// 图片分片额外解析出 mediaType/data（Anthropic 需要），并校验 data URL 与大小；不合法返回 null。
function normalizeContent(message) {
  const role = message?.role;
  if (!['system', 'user', 'assistant'].includes(role)) return null;
  const content = message.content;
  if (typeof content === 'string') {
    if (!content.trim() || content.length > 100000) return null;
    return content;
  }
  if (!Array.isArray(content) || role !== 'user' || !content.length || content.length > 20) return null;
  const parts = [];
  for (const part of content) {
    if (!part || typeof part !== 'object') return null;
    if (part.type === 'text') {
      if (typeof part.text !== 'string' || !part.text.trim()) return null;
      parts.push({ type: 'text', text: part.text });
    } else if (part.type === 'image_url') {
      const url = part.image_url?.url;
      const match = typeof url === 'string' ? url.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]*)$/) : null;
      if (!match || Buffer.byteLength(match[2], 'base64') > MAX_IMAGE_BYTES) return null;
      parts.push({ type: 'image', mediaType: match[1], data: match[2], url });
    } else return null;
  }
  return parts;
}

async function handleChat(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST 请求。' } });
  if (!process.env.ZHIPU_API_KEY && process.env.OPENAI_API_KEY) process.env.ZHIPU_API_KEY = process.env.OPENAI_API_KEY;
  const provider = process.env.ZHIPU_API_KEY ? 'zhipu' : process.env.ANTHROPIC_AUTH_TOKEN ? 'anthropic' : null;
  if (!provider) return sendJson(res, 503, { error: { code: 'API_KEY_MISSING', message: '服务端尚未配置 API Key（支持 ZHIPU_API_KEY 或 ANTHROPIC_AUTH_TOKEN）。' } });
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return sendJson(res, 400, { error: { code: 'INVALID_CONTENT_TYPE', message: '请求必须使用 JSON 格式。' } });
  let input;
  try { input = await readJson(req, res); } catch (error) {
    if (res.writableEnded) return;
    return sendJson(res, 400, { error: { code: 'INVALID_REQUEST', message: '请求格式不正确。' } });
  }
  const messages = input?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 20) {
    return sendJson(res, 400, { error: { code: 'INVALID_MESSAGES', message: '消息内容不符合要求。' } });
  }
  const normalized = [];
  let textLength = 0;
  let imageCount = 0;
  for (const message of messages) {
    const content = normalizeContent(message);
    if (content === null) {
      return sendJson(res, 400, { error: { code: 'INVALID_MESSAGES', message: '消息内容不符合要求（文本总长 ≤10 万字符；图片仅支持 PNG/JPG/WebP/GIF 的 base64 数据，单图 ≤5MB）。' } });
    }
    if (typeof content === 'string') textLength += content.length;
    else for (const part of content) {
      if (part.type === 'text') textLength += part.text.length;
      else imageCount++;
    }
    normalized.push({ role: message.role, content });
  }
  if (textLength > 100000 || imageCount > MAX_IMAGES_PER_REQUEST) {
    return sendJson(res, 400, { error: { code: 'INVALID_MESSAGES', message: `消息内容不符合要求（文本总长或图片数量超限，图片最多 ${MAX_IMAGES_PER_REQUEST} 张）。` } });
  }
  const maxTokens = Number.isFinite(input.max_tokens) ? Math.min(Math.max(Math.floor(input.max_tokens), 1), 16000) : 4000;
  const temperature = Number.isFinite(input.temperature) ? input.temperature : undefined;
  try {
    if (provider === 'zhipu') {
      // 智谱兼容 OpenAI 消息格式，system 角色可直接传递；图片分片还原为 image_url 形式。
      const zhipuMessages = normalized
        .filter(m => m.role !== 'system' || m.content.trim())
        .map(m => typeof m.content === 'string' ? m : { role: m.role, content: m.content.map(part => part.type === 'text' ? { type: 'text', text: part.text } : { type: 'image_url', image_url: { url: part.url } }) });
      if (!zhipuMessages.some(m => m.role === 'user')) {
        return sendJson(res, 400, { error: { code: 'INVALID_MESSAGES', message: '至少需要一条 user 消息。' } });
      }
      return sendJson(res, 200, await callZhipu(zhipuMessages, maxTokens, temperature, imageCount > 0));
    }
    const system = normalized.filter(message => message.role === 'system').map(message => message.content).join('\n').trim();
    const anthropicMessages = normalized.filter(message => message.role !== 'system').map(message => ({
      role: message.role,
      // Claude 原生图片块：base64 + media_type，与中转站的 GLM 视觉型号同样兼容。
      content: typeof message.content === 'string' ? message.content : message.content.map(part => part.type === 'text'
        ? { type: 'text', text: part.text }
        : { type: 'image', source: { type: 'base64', media_type: part.mediaType, data: part.data } }),
    }));
    if (!anthropicMessages.length || anthropicMessages[0].role !== 'user') {
      return sendJson(res, 400, { error: { code: 'INVALID_MESSAGES', message: '至少需要一条 user 消息。' } });
    }
    const payload = {
      model: imageCount > 0
        ? pickVisionModel(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL, process.env.ANTHROPIC_VISION_MODEL)
        : process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: maxTokens,
      // 思考型模型（GLM-4.5 等）默认输出思考段，会把 max_tokens 耗尽导致正文为空；显式关闭。
      thinking: { type: 'disabled' },
      ...(system ? { system } : {}),
      messages: anthropicMessages,
    };
    return sendJson(res, 200, await callAnthropic(payload));
  } catch (error) {
    const status = error.code === 'TIMEOUT' ? 504 : error.status === 429 ? 429 : 502;
    // 智谱返回的业务错误（如令牌无效）原样透出，便于排查配置问题。
    const message = error.expose
      ? `生成服务返回错误：${error.message}`
      : status === 429 ? '生成请求过于频繁，请稍后再试。'
      : status === 504 ? '生成服务响应超时，请稍后再试。'
      : '生成服务暂时不可用，请稍后再试。';
    return sendJson(res, status, { error: { code: status === 504 ? 'UPSTREAM_TIMEOUT' : status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR', message } });
  }
}

function decodeXmlText(xml) {
  return String(xml || '')
    .replace(/<w:tab\s*\/\s*>/g, '\t')
    .replace(/<w:br\s*\/\s*>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractFileText(filePath, ext) {
  if (ext === '.pdf') {
    if (fs.existsSync('/usr/bin/pdftotext')) {
      const { stdout } = await execFileAsync('/usr/bin/pdftotext', ['-layout', filePath, '-'], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
      return stdout.trim();
    }
    const { stdout } = await execFileAsync('/usr/bin/swift', ['-e', PDF_EXTRACT_SWIFT, filePath], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
    return stdout.trim();
  }
  if (ext === '.docx') {
    const { stdout } = await execFileAsync('/usr/bin/unzip', ['-p', filePath, 'word/document.xml'], { maxBuffer: 4 * 1024 * 1024, timeout: 15000 });
    return decodeXmlText(stdout);
  }
  return '';
}

async function handleExtract(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST 请求。' } });
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return sendJson(res, 400, { error: { code: 'INVALID_CONTENT_TYPE', message: '请求必须使用 JSON 格式。' } });
  let input;
  try { input = await readJson(req, res); } catch {
    if (!res.writableEnded) sendJson(res, 400, { error: { code: 'INVALID_REQUEST', message: '资料解析请求格式不正确。' } });
    return;
  }
  if (!Array.isArray(input?.files) || !input.files.length || input.files.length > MAX_EXTRACT_FILES) {
    return sendJson(res, 400, { error: { code: 'INVALID_FILES', message: `每次需要上传 1-${MAX_EXTRACT_FILES} 个 PDF 或 DOCX 文件。` } });
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-ai-extract-'));
  try {
    const result = [];
    for (let index = 0; index < input.files.length; index++) {
      const item = input.files[index];
      const safeName = path.basename(String(item?.name || `file-${index}`)).slice(0, 200);
      const ext = path.extname(safeName).toLowerCase();
      if (!['.pdf', '.docx'].includes(ext) || typeof item?.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(item.data)) {
        return sendJson(res, 400, { error: { code: 'INVALID_FILE', message: `无法读取“${safeName}”，仅支持 PDF/DOCX。` } });
      }
      const buffer = Buffer.from(item.data, 'base64');
      if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
        return sendJson(res, 400, { error: { code: 'FILE_TOO_LARGE', message: `文件“${safeName}”为空或超过 20MB。` } });
      }
      const tempPath = path.join(tempDir, `upload-${index}${ext}`);
      fs.writeFileSync(tempPath, buffer, { mode: 0o600 });
      let text = '';
      try { text = await extractFileText(tempPath, ext); } catch { text = ''; }
      result.push({ name: safeName, text: text.slice(0, 50000) });
    }
    return sendJson(res, 200, { files: result });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function safePdfHtml(value) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(?:iframe|object|embed)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed)>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
}

function renderPdfWithChrome(chrome, args, pdfPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: 'ignore' });
    let lastSize = -1;
    let stableChecks = 0;
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timeout);
      try { child.kill('SIGKILL'); } catch { /* process already ended */ }
      if (error) reject(error); else resolve();
    };
    const poll = setInterval(() => {
      let size = 0;
      try { size = fs.statSync(pdfPath).size; } catch { size = 0; }
      if (size > 1000 && size === lastSize) stableChecks++;
      else stableChecks = 0;
      lastSize = size;
      if (stableChecks >= 2) finish();
    }, 250);
    const timeout = setTimeout(() => finish(new Error('pdf timeout')), 30000);
    child.once('error', finish);
    child.once('exit', code => {
      if (settled) return;
      let size = 0;
      try { size = fs.statSync(pdfPath).size; } catch { size = 0; }
      if (size > 1000) finish();
      else finish(new Error(`chrome exited ${code}`));
    });
  });
}

async function handlePdf(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST 请求。' } });
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return sendJson(res, 400, { error: { code: 'INVALID_CONTENT_TYPE', message: '请求必须使用 JSON 格式。' } });
  let input;
  try { input = await readJson(req, res); } catch {
    if (!res.writableEnded) sendJson(res, 400, { error: { code: 'INVALID_REQUEST', message: 'PDF 导出请求格式不正确。' } });
    return;
  }
  if (typeof input?.html !== 'string' || !input.html.trim() || input.html.length > MAX_PDF_HTML_CHARS) {
    return sendJson(res, 400, { error: { code: 'INVALID_HTML', message: '没有可导出的内容，或内容过大。' } });
  }
  const chrome = CHROME_PATHS.find(candidate => fs.existsSync(candidate));
  if (!chrome) return sendJson(res, 503, { error: { code: 'PDF_ENGINE_MISSING', message: '本机未找到可用的 Chrome/Chromium PDF 引擎。' } });
  const filename = `${path.basename(String(input.filename || 'AI生成试卷.pdf'), '.pdf').replace(/[\\/:*?"<>|]/g, '-').slice(0, 120) || 'AI生成试卷'}.pdf`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-ai-pdf-'));
  const htmlPath = path.join(tempDir, 'document.html');
  const pdfPath = path.join(tempDir, 'document.pdf');
  try {
    const localStyles = ['styles.css', 'spec.css'].map(file => {
      try { return fs.readFileSync(path.join(root, file), 'utf8'); } catch { return ''; }
    }).join('\n');
    const printStyles = `
@page{size:A4;margin:15mm 16mm 17mm}
html,body{background:#fff!important;color:#111!important;min-height:0!important}
body{margin:0;font-family:"Songti SC","Noto Serif CJK SC","Microsoft YaHei",Arial,sans-serif;font-size:11pt;line-height:1.72;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pdf-export,.pdf-export.wq-page,.pdf-export.wa-page,.pdf-export.spec-page,.pdf-export.tool-page{--sp-bg:#fff;--sp-panel:#fff;--sp-panel-alt:#fff;--sp-line:#555;--sp-text:#111;--sp-muted:#333;--sp-accent:#111;background:#fff!important;color:#111!important;min-height:0!important;padding:0!important}
.pdf-export *{box-sizing:border-box;text-shadow:none!important}
.pdf-export .a4-paper,.pdf-export .wa-paper,.pdf-export .spec-report,.pdf-export .exam-paper{background:#fff!important;color:#111!important;box-shadow:none!important;max-width:none!important;width:auto!important;min-height:0!important;margin:0!important}
.pdf-export .wq-page .a4-paper,.pdf-export.wq-page .a4-paper{min-height:0!important;padding:0!important}
.pdf-export .wa-paper,.pdf-export .spec-report,.pdf-export .exam-paper{padding:0!important;font-family:"Songti SC","Noto Serif CJK SC","Microsoft YaHei",Arial,sans-serif}
.pdf-export .spec-sectionhead{margin:0 0 8mm;padding:0 0 4mm;border-bottom:2px solid #111!important;text-align:center}
.pdf-export .spec-sectionhead h2{margin:0!important;color:#111!important;font-family:"Heiti SC","Microsoft YaHei",Arial,sans-serif;font-size:18pt!important;line-height:1.35;font-weight:800;letter-spacing:.04em}
.pdf-export .report-params{display:flex!important;flex-wrap:wrap;gap:3mm;margin:0 0 5mm!important;padding:0}
.pdf-export .report-param{background:#fff!important;border:1px solid #777!important;border-radius:2px!important;padding:2mm 3mm!important;color:#111!important;font-size:9.5pt!important;line-height:1.4}
.pdf-export .report-param i{color:#333!important;font-style:normal;font-weight:700;margin-right:2mm}
.pdf-export .report-files{margin:0 0 6mm!important;padding:0 0 3mm;border-bottom:1px solid #bbb;color:#222!important;font-size:9.5pt!important;overflow-wrap:anywhere}
.pdf-export .report-step{break-inside:avoid-page;page-break-inside:avoid;margin:0 0 5mm!important;padding:1mm 0 1mm 4mm!important;border-left:3px solid #222!important;background:#fff!important;color:#111!important}
.pdf-export .report-step h4{margin:0 0 2mm!important;color:#111!important;font-family:"Heiti SC","Microsoft YaHei",Arial,sans-serif;font-size:12pt!important;line-height:1.45;font-weight:800}
.pdf-export .report-step p,.pdf-export .report-content,.pdf-export p,.pdf-export li,.pdf-export td,.pdf-export th{color:#111!important;font-size:10.5pt!important;line-height:1.78!important}
.pdf-export .report-step p{margin:1.5mm 0!important;white-space:pre-wrap;overflow-wrap:anywhere;orphans:3;widows:3}
.pdf-export .report-badge{border:1px solid #555!important;background:#fff!important;color:#111!important;padding:1px 6px!important}
.pdf-export .report-metrics{display:grid!important;grid-template-columns:repeat(3,1fr);gap:3mm;margin:0 0 6mm!important}
.pdf-export .report-metrics .metric{background:#fff!important;border:1px solid #666!important;border-top:2px solid #111!important;color:#111!important;box-shadow:none!important}
.pdf-export .report-metrics .metric small,.pdf-export .report-metrics .metric b,.pdf-export .report-metrics .metric span{color:#111!important}
.pdf-export table{width:100%;border-collapse:collapse;background:#fff!important;color:#111!important;break-inside:avoid-page}
.pdf-export th,.pdf-export td{border:1px solid #666!important;background:#fff!important;padding:2mm 3mm!important;text-align:left}
.pdf-export h1,.pdf-export h2,.pdf-export h3,.pdf-export h4,.pdf-export h5,.pdf-export h6,.pdf-export strong,.pdf-export b,.pdf-export span,.pdf-export div{color:inherit}
.pdf-export .seal-line{position:absolute!important}
.pdf-export .report-actions,.pdf-export .preview-bottom-bar,.pdf-export .compose-bar,.pdf-export button{display:none!important}
.pdf-export .katex,.pdf-export .katex *,.pdf-export math,.pdf-export math *{color:#111!important}
.pdf-export .katex{font-size:1em}
.pdf-export .katex>.katex-html{display:none!important}
.pdf-export .katex>.katex-mathml{display:inline!important;position:static!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;white-space:normal!important}
.pdf-export math{font-family:"STIX Two Math","Times New Roman",serif}
`;
    const documentHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${localStyles}\n${printStyles}</style></head><body>${safePdfHtml(input.html)}</body></html>`;
    fs.writeFileSync(htmlPath, documentHtml, { mode: 0o600 });
    const chromeArgs = [
      '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-extensions',
      '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--use-mock-keychain',
      `--user-data-dir=${path.join(tempDir, 'profile')}`,
      '--allow-file-access-from-files', '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=3000', '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`,
    ];
    await renderPdfWithChrome(chrome, chromeArgs, pdfPath);
    const pdf = fs.readFileSync(pdfPath);
    if (!pdf.length) throw new Error('empty pdf');
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'no-store',
    });
    res.end(pdf);
  } catch {
    if (!res.writableEnded) sendJson(res, 500, { error: { code: 'PDF_EXPORT_FAILED', message: 'PDF 生成失败，请检查内容后重试。' } });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

const root = __dirname ? path.resolve(__dirname, '..') : process.cwd();
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (urlPath === '/api/chat') {
    handleChat(req, res);
    return;
  }
  if (urlPath === '/api/extract') {
    handleExtract(req, res);
    return;
  }
  if (urlPath === '/api/pdf') {
    handlePdf(req, res);
    return;
  }
  if (urlPath === '/api/status') {
    handleStatus(req, res);
    return;
  }
  let filePath = path.join(root, urlPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found: ' + urlPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, host, () => console.log(`serving ${root} at http://${host}:${port}`));
