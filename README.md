# 教师 AI 赋能站：本地复刻

这是 `jiaoshiai.top/#workbench` 的本地可运行复刻版。首页保留三大工作台和 24 个工具入口；工具页提供学科/年级选择、资料上传、补充说明、生成结果和打印导出流程。

`sites.json` 保存了原站公开工具目录的 24 条记录，作为入口编号、名称、路径和描述的校对清单。

`PRODUCT_SPEC.md` 是工具复刻的产品级基本提示词，规定字段、按钮、学科逻辑和结果依据。

`agent-config.js` 定义了 02/07/17/18/19/20/21 七个教学提分智能体，包括独立的系统提示词、能力路由、输出契约和模型参数。对应页面的“AI 智能体配置”面板可查看并在本机覆盖系统提示词。`SEVEN_TOOL_AUDIT.md` 记录了逐工具审查、已补齐内容与仍需外部 API 的能力。

## 真实生成结果存档

`review_jiaoshiai/results/` 保存了 24 个工具**真实消耗积分生成**后的结果结构（2026-09-13 实测）：

- 每个工具一个目录：`report.txt`（结果全文）、`structure.json`（标题/按钮结构）、`meta.txt`（输入与流程说明）。
- `results/README.md` 是**真实结果结构总览**：每个工具结果区的板块顺序、按钮清单、上传是否为硬门槛、两类流程形态（直接生成型 vs 逐题生成+组卷型）与导出配置。
- `app.js` 中的 `playbooks`（各工具生成模板骨架）已按该实测结构回填。
- 特殊样本：`06-exam-ppt/workbench.png`（课件工作台截图）、`13-knowledge-gap/full_content.txt`（红黄绿地图全量）、`23-teaching-aid-maker/generated_image.png`（真实生成的教辅图）、`21-question-sense/answer_flow.json`（三连问作答流程）。

## 启动

项目的生成请求通过本地 Node 代理（`.claude/serve.js`）发送，支持两种上游，按环境变量自动选择：

- **阿里云 MaaS / 任意 OpenAI 兼容端点（当前在用）**：`OPENAI_API_KEY` + `OPENAI_BASE_URL`（如 `https://ws-xxx.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`）+ `OPENAI_MODEL`（如 `qwen3.8-max-0902`）。
- 中转站 + Anthropic 兼容：`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN` + `ANTHROPIC_MODEL`（思考型模型超时已设 5 分钟）。
- 智谱官方直连：`ZHIPU_API_KEY`（open.bigmodel.cn 的 Key），可选 `ZHIPU_MODEL`（默认 `glm-4.5`）。

**视觉（图片）输入**：`/api/chat` 的 user 消息 `content` 支持分片数组 `[{type:'image_url',image_url:{url:'data:image/png;base64,…'}},{type:'text',text:'…'}]`。页面允许选择单个不超过 20MB 的 PNG/JPG/WebP/GIF，超过模型 5MB 入参限制的静态图会先在浏览器自动缩放和压缩；每次最多 10 张。带图请求会自动切换视觉型号：GLM 纯文本型号（如 `glm-4.5`）自动换成 `glm-4.5v`，可用 `ZHIPU_VISION_MODEL` / `ANTHROPIC_VISION_MODEL` 覆盖；Claude 等原生多模态型号不切换。通用生成器和 07「错题举一反三」都会把上传图片实际发给模型读图；PDF/DOCX 会先经本地 `/api/extract` 提取文字。

**打开方式**：不要在 `file://` 模式下直接运行工具，否则浏览器无法访问 `/api/chat` 和 `/api/extract`。新版 `index.html` 在被直接双击时会自动转到 `http://127.0.0.1:4173`；请确保 `.claude/serve.js` 已启动。

API Key 只从环境变量读取，不要写入源码、网页或项目文件。

```bash
OPENAI_API_KEY='sk-xxx' OPENAI_BASE_URL='https://ws-xxx.cn-beijing.maas.aliyuncs.com/compatible-mode/v1' OPENAI_MODEL='qwen3.8-max-0902' node .claude/serve.js
```

访问 <http://localhost:4173>。未配置 Key 时页面仍可打开，但生成操作会提示配置错误；上游返回的业务错误（如令牌无效）会原样显示在页面提示里，便于排查。

仅查看静态页面（不提供 API 代理）时，也可以运行：

```bash
python3 -m http.server 4173
```

完整性校验：

```bash
python3 verify.py
```

## 线上发行与自动更新

`main` 分支每次推送后，GitHub Actions 会自动执行完整性与 JavaScript 语法校验，成功后发布最新应用镜像：

```text
ghcr.io/yaokailiu9-cloud/teacher-ai-workbench:latest
```

首次运行前在项目目录配置 `.env`（文件已被 Git 忽略，不会上传），然后启动：

```bash
docker compose up -d
```

`compose.yaml` 已设置 `pull_policy: always`，每次重新启动都会拉取最新线上版本：

```bash
docker compose pull
docker compose up -d
```

版本标签（如 `v1.0.0`）会同时发布对应的固定镜像版本，方便回滚和多环境同步。运行时 API Key 只通过服务器环境变量注入，不会打包进镜像。

## 路由

- `#/`：教师工作台
- `#tool/01` 到 `#tool/26`：24 个工具页（编号按工具目录编号，缺号是分类编号）

## 结构

- `spec.js`：由 `review_jiaoshiai/build_spec2.py` 从抓取快照生成的页面结构数据（24 页，已剔除积分/兑换相关界面）。
- `specapp.js`：通用渲染器，把 `spec.js` 的结构树渲染成页面并挂上交互（上传、模式切换、生成、导出）。
- `spec.css`：工具页样式（深色两栏布局）。
- `app.js`：首页、路由与登录弹窗；工具页优先走 `specapp.js` 渲染。

结果生成目前是本地演示逻辑，便于在没有后端服务时完整走通页面流程。
