# DeepSeek v4 pro / CC Handoff: lobster-chat 继续开发

适用方式：把本文从“可直接粘贴给 CC 的提示词”开始整段粘贴给 DeepSeek v4 pro 所在的 CC 运行框架。

## 可直接粘贴给 CC 的提示词

```text
/goal

你现在接手开源项目 lobster-chat 的继续开发。你运行在 CC 框架下，模型是 DeepSeek v4 pro。请先阅读项目，再按计划持续推进，不要凭空重构。

项目路径：
/Volumes/AJW-Data/Projects/lobster-chat

你的最高目标：
把 lobster-chat 推进到“单城中心化 IM 真实可用”的阶段。先完成城邦内部的真实 IM 体验：登录/身份、会话、消息收发、居民列表、个人房间私聊入口、公共房间、后台维护、H5 主入口稳定运行。跨城去中心化、复杂治理、世界扩张、编辑器系统都后置，不要让它们阻塞主线。

项目定位：
lobster-chat 不是 RPG 游戏，也不是纯展示页。它是带像素空间感的 IM。
核心原则是：IM 第一，场景第二。

前端核心结构：
1. 底层：完整像素场景图。
2. 中层：透明热点和交互区域。
3. 顶层：微信式左右聊天气泡、会话栏、输入框、HUD。

架构约束：
1. Gateway 是合同和状态事实源。
2. H5 前端只渲染 Gateway state，不要把本地状态当作房间权限、消息真相、用户身份真相。
3. pending echo 只能作为 UI 发送中状态，必须能被 committed copy 替换，不能重复闪现。
4. 前端不要绕过 Gateway 自造成功态。
5. TUI 是并行客户端，H5 是当前主入口。不要把项目拉回 TUI-first。

必须先读的文档：
1. /Volumes/AJW-Data/Projects/lobster-chat/README.md
2. /Volumes/AJW-Data/Projects/lobster-chat/docs/ACTIVE_WORK_QUEUE.md
3. /Volumes/AJW-Data/Projects/lobster-chat/docs/PRODUCT_CHARTER.md
4. /Volumes/AJW-Data/Projects/lobster-chat/docs/IMPLEMENTATION_PHASES.md
5. /Volumes/AJW-Data/Projects/lobster-chat/docs/FRONTEND_DEBT_REDUCTION_PLAN.md
6. /Volumes/AJW-Data/Projects/lobster-chat/docs/H5_SHELL_PLAN.md
7. /Volumes/AJW-Data/Projects/lobster-chat/docs/SPATIAL_SCENE_MODEL.md
8. /Volumes/AJW-Data/Projects/lobster-chat/docs/WAKU_GATEWAY_PROTOCOL.md
9. /Volumes/AJW-Data/Projects/lobster-chat/docs/WORLD_CITY_MODEL.md
10. /Volumes/AJW-Data/Projects/lobster-chat/docs/admin-refactor-direction.md
11. /Volumes/AJW-Data/Projects/lobster-chat/docs/cc-k2-day-background-and-frontend-realness-prompt.md

主要代码位置：
1. Web/H5 主目录：
   /Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell
2. 主要页面：
   - apps/lobster-web-shell/index.html
   - apps/lobster-web-shell/creative.html
   - apps/lobster-web-shell/unified.html
   - apps/lobster-web-shell/world-square.html
   - apps/lobster-web-shell/admin.html
   - apps/lobster-web-shell/admin-ds.html
3. 当前大文件/技术债：
   - apps/lobster-web-shell/app.js
   - apps/lobster-web-shell/styles.css
4. 已开始拆分的前端模块：
   - apps/lobster-web-shell/shell-errors.js
   - apps/lobster-web-shell/shell-labels.js
   - apps/lobster-web-shell/shell-message-state.js
   - apps/lobster-web-shell/shell-shared.js
   - apps/lobster-web-shell/shell-gateway.js
   - apps/lobster-web-shell/shell-scene-hotspots.js
   - apps/lobster-web-shell/shell-scene-runtime.js
   - apps/lobster-web-shell/composer-state.js
5. DeepSeek 后台设计方向：
   - apps/lobster-web-shell/admin-ds.html
   - apps/lobster-web-shell/styles.admin-ds.css
   - apps/lobster-web-shell/admin-ds.js
   - apps/lobster-web-shell/admin-ds-data.js

当前用户已确认的产品方向：
1. 先做单城中心化 IM，跨城去中心化后置。
2. 左边栏未来同时是导航栏、会话栏、用户栏。
3. 左边栏需要支持上下滚动和检索，用户头像是每个用户个人房间入口。
4. 点击左边栏用户头像后，应能提示是否跳转到对方房间并进入私聊。
5. 用户个人房间允许自定义两层：
   - image_layer：图像层
   - hotspot_layer：热点层
6. 这些配置必须最终由 Gateway 提供，H5 只渲染，不做私有事实源。
7. 后台正式视觉方向采用 DeepSeek 版 admin-ds，不要再另起一套新后台。

近期用户反馈过的前端问题，优先验收：
1. 多个页面左边栏尺寸不统一。
2. creative.html 输入框文字曾不可见。
3. 输入后 Enter 曾不能发送，需确认 Enter 发送、Shift+Enter 换行。
4. 热点标签不能永久遮挡，但也不能完全不可发现。
5. 鼠标移动到热点附近时应显示标签。
6. 点击场景空白处应短暂显示全部热点标签，方便选择。
7. world-square.html 左侧曾出现两层左栏/假左栏，需要只保留真实统一左栏。
8. 舞台框高度和左边栏高度曾在某些窗口比例下不齐。
9. 后台页面有不少按钮/交互不可用，需要逐步补齐状态和行为。

当前白天/夜晚背景素材规则：
不要重新生成白天素材。不要改构图。白天/夜晚只能有光照、色温、明暗差异，建筑和物体位置不能变。
素材和接入规则见：
/Volumes/AJW-Data/Projects/lobster-chat/docs/cc-k2-day-background-and-frontend-realness-prompt.md
/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/assets/pixel/ASSET_HANDOFF.md

禁止事项：
1. 不要重做项目。
2. 不要把像素 IM 改成游戏 UI。
3. 不要用大面积半透明玻璃面板遮住场景。
4. 不要在 H5 端用 localStorage 缓存本该由 Gateway 决定的房间权限或身份。
5. 不要把 admin-ds 视觉样式套到所有旧页面。
6. 不要删除大文件、模型、外盘资料或 Git 历史。
7. 不要提交 git，除非用户明确要求。
8. 不要移动 TTS、ComfyUI、Sulphur2、Win11 相关目录。
9. 不要把大包、导出包、临时包写入 Mac 内盘；如需临时产物，优先放外盘 /Volumes/AJW-Data。

推荐工作方式：
1. 先只读审查，不要立刻大改。
2. 每轮只处理 1-2 个最高优先级问题。
3. 小步修改，小步验证。
4. 如果发现 app.js 或 styles.css 臃肿，按 FRONTEND_DEBT_REDUCTION_PLAN.md 的顺序抽取，不要边重构边改视觉。
5. DeepSeek v4 pro 不是多模态模型，不能靠主观“看图”判断视觉效果；必须用 DOM、CSS 计算值、Playwright 截图尺寸、测试断言验证。

标准验证命令：
在项目根目录：
cd /Volumes/AJW-Data/Projects/lobster-chat

如涉及 Rust gateway/TUI：
cargo test -p lobster-waku-gateway
cargo test -p lobster-tui

如涉及 Web：
cd /Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell
npm run test:unit
npm run test:layout
npm run test:realness
npm test

如需要 Web smoke：
cd /Volumes/AJW-Data/Projects/lobster-chat
./scripts/smoke-web-shell.sh

浏览器验收目标：
http://127.0.0.1:18081/index.html?gateway=http://127.0.0.1:8787&identity=qa-a
http://127.0.0.1:18081/creative.html?gateway=http://127.0.0.1:8787&identity=qa-b
http://127.0.0.1:18081/admin.html?gateway=http://127.0.0.1:8787&qa=manual
http://127.0.0.1:18081/admin-ds.html?gateway=http://127.0.0.1:8787&qa=manual
http://127.0.0.1:18081/unified.html?gateway=http://127.0.0.1:8787&qa=manual
http://127.0.0.1:18081/world-square.html

如果需要本地静态服务，先检查项目已有脚本，不要随便换端口。已有验收文档里常用 18081 / 8787。

第一阶段任务：接管与验收
1. 阅读上面列出的文档。
2. 输出你理解的当前架构、主入口、事实源、已知技术债。
3. 跑 Web 测试，记录通过/失败。
4. 检查上述 6 个浏览器页面是否能加载。
5. 不要先改需求未明确的视觉，只先修阻塞真实使用的问题。

第二阶段任务：前端真实可用修复
优先级从高到低：
1. 输入框和发送：
   - 输入文字必须可见。
   - Enter 发送。
   - Shift+Enter 换行。
   - 发送后清空输入框。
   - pending echo 和 committed copy 不重复。
2. 热点标签：
   - hover/focus 显示标签。
   - 点击空白场景短暂显示全部标签。
   - 标签不要长期遮挡场景。
   - 热点区域要可点击、可聚焦。
3. 左边栏统一：
   - creative/index/unified/world-square/admin/admin-ds 的左栏宽度、字号、行高、内边距尽量共享变量。
   - 舞台框高度和左栏在常见桌面窗口比例下对齐。
4. world-square：
   - 删除/隐藏内层重复左栏。
   - 保留唯一真实导航栏。
   - 背景图里的概念性 UI 不应作为可交互栏重复出现。
5. admin-ds：
   - 作为正式后台方向继续补交互。
   - 假按钮要有状态：可用、禁用原因、加载、成功、失败。
   - 不要影响用户端页面。

第三阶段任务：技术债收敛
按 docs/FRONTEND_DEBT_REDUCTION_PLAN.md 执行：
1. 优先抽纯函数和稳定 helper。
2. 不要先拆复杂状态渲染。
3. 每次抽取后跑 npm 测试。
4. app.js 拆分顺序：
   - shell-shared
   - shell-state
   - shell-gateway
   - shell-render
   - shell-composer
   - shell-scene
   - shell-auth
   - shell-governance
5. CSS 拆分顺序：
   - styles.tokens.css
   - styles.base.css
   - styles.scene.css
   - styles.chat.css
   - styles.world.css
   - styles.admin.css
   - styles.admin-ds.css

第四阶段任务：Gateway 合同与真实 IM
如果前端现象根因来自 Gateway，回到 Gateway 合同修复：
1. 检查 /v1/shell/message
2. 检查 /v1/shell/events
3. 检查 /v1/shell/state
4. 双端 qa-a / qa-b 互发必须真实通过。
5. 失败、离线、重连、pending、committed 状态要能解释清楚。

第五阶段任务：居民栏与个人房间模型
逐步设计和落地：
1. 左边栏居民检索。
2. 用户头像作为个人房间入口。
3. 点击用户头像弹出确认：是否进入对方房间并打开私聊。
4. Gateway state 增加或复用 resident/room profile。
5. 房间配置模型预留：
   - image_layer
   - hotspot_layer
6. H5 只渲染这些 layer，不把配置写死为唯一事实源。

每轮结束必须输出：
1. 本轮阅读/修改了哪些文件。
2. 改了什么。
3. 跑了哪些测试，结果如何。
4. 还有哪些失败。
5. 下一轮建议。
6. 如果修改了关键用户体验，给出预览 URL。

如果你遇到以下情况，停止并询问用户：
1. 需要删除/迁移大量文件。
2. 需要改变产品方向。
3. 需要提交 Git 或推送 GitHub。
4. 需要使用付费外部服务。
5. 发现现有用户改动和你的计划冲突。
```

## 交接摘要

DeepSeek v4 pro 适合承担的部分：

- 前端结构化清债：`app.js` / `styles.css` 拆分、测试补齐、重复样式收敛。
- 后台 `admin-ds` 继续完善：表格、状态、按钮、空态、加载态、错误态、交互逻辑。
- 非视觉主观型 bug：输入框、Enter 发送、热点 hover/focus、左栏尺寸统一、Gateway 状态映射。
- 文档和测试同步：把真实约束写进测试，减少回归。

DeepSeek v4 pro 不适合独立承担的部分：

- 需要精细视觉判断的像素图审美验收。
- 需要看截图判断构图是否“好看”的任务。
- 需要生成或修改白天/夜晚背景图的任务。

这类任务应由有视觉能力的模型或人工预览确认；DeepSeek 可通过 Playwright、DOM 和 CSS 计算值做辅助验证。

## 当前项目阶段判断

项目不是从零开始，已经有可运行骨架和较多文档，但离正式上线仍有距离。当前最重要的是把“真实 IM 主路径”闭环，而不是继续扩世界观。

优先级：

1. Gateway 合同可信。
2. H5 双端收发可信。
3. 输入、发送、热点、左栏等基础交互可信。
4. admin-ds 能承担后台维护入口。
5. 技术债按模块渐进拆分。
6. 居民栏、个人房间、房间 layer 配置进入 Gateway 合同。

## 已知风险

- `apps/lobster-web-shell/app.js` 仍然偏大，改动前必须定位清楚职责。
- `styles.css` 与页面专属 CSS 边界仍需继续收敛。
- 页面较多，左栏/舞台/聊天区域容易出现跨页面不一致。
- 前端不能为了演示写死 Gateway state，否则会偏离项目初心。
- DeepSeek 没有视觉能力，不能让它单独决定像素视觉是否达标。

## 建议第一轮只做这些

1. 只读审查文档和 Web 目录。
2. 跑 Web 测试。
3. 输出失败项。
4. 修复输入框和热点标签两个最高频用户痛点。
5. 增加测试，防止回归。
6. 输出预览地址和下一轮计划。
