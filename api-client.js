(() => {
  async function chat({ messages, temperature = 0.4, max_tokens = 4000, signal } = {}) {
    if (location.protocol === 'file:') throw new Error('当前是文件直开模式，无法调用资料解析和 AI 服务。请使用 http://127.0.0.1:4173 打开。');
    let response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, temperature, max_tokens }),
        signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new Error('无法连接本地 AI 服务。请先启动 node .claude/serve.js，再从 http://127.0.0.1:4173 打开页面。');
    }
    let data;
    try { data = await response.json(); } catch { throw new Error('服务返回了无效响应。'); }
    if (!response.ok) throw new Error(data.error?.message || '生成失败，请稍后再试。');
    if (typeof data.content !== 'string') throw new Error('生成结果为空，请稍后再试。');
    return data;
  }

  window.apiClient = { chat };
})();
