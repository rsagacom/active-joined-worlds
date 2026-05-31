# CC Acceptance: Resident Rail And Personal Room Entry

## 背景

本轮目标来自 IM 项目最高蓝图修正：单城邦中心化 IM 先落地。住宅页不应再按通用 hub 页面运行，而应作为居民端个人房间/私聊入口运行。

请以验收视角检查，不要重构无关页面，不要改动后台候选页，不要把 H5 做成私有状态源。

## 验收范围

重点检查这些文件：

- `apps/lobster-web-shell/creative.html`
- `apps/lobster-web-shell/app.js`
- `apps/lobster-web-shell/styles.creative.css`
- `apps/lobster-web-shell/styles.pixel-map.css`
- `apps/lobster-web-shell/test/creative-resident-shell-init.test.mjs`
- `apps/lobster-web-shell/test/shell-pages-static.test.mjs`
- `docs/PRODUCT_CHARTER.md`
- `docs/SPATIAL_SCENE_MODEL.md`
- `docs/IMPLEMENTATION_PHASES.md`

## 必须确认

1. `creative.html` 住宅页必须按居民端运行：
   - `data-shell-page="user"`
   - `data-default-shell-mode="user"`
   - 运行态 `document.body.dataset.shellPage === "user"`
   - 运行态 `document.body.dataset.shellMode === "user"`
   - `styles.creative.css`、`styles.pixel-map.css`、`app.js` 的 query version 必须与本轮 resident rail 改动一致，避免浏览器缓存旧 CSS/JS 导致输入框不可见或左栏尺寸异常。

2. 左侧栏必须承担“居民目录/用户栏”语义：
   - 标题为“居民”
   - 有 `#room-search-input`
   - placeholder 为“搜索居民、房间或最近消息”
   - 房间列表可滚动，不应撑爆页面或压缩舞台

3. 居民头像必须是个人房间/私聊入口：
   - 直聊房间头像存在 `data-resident-room-entry`
   - 点击头像必须先确认，再切换到对应房间
   - 群聊/公共频道不要伪装成个人房间入口

4. 布局不能回退：
   - 桌面端左栏和舞台高度一致
   - 拉宽/缩窄窗口时舞台不短于左栏
   - 热点标签仍保持 hover/focus 才显示
   - 清屏模式仍可用

5. 架构方向不能走偏：
   - 单城邦中心化 IM 是当前落地优先级
   - 跨城互联/去中心化不阻塞当前 IM 主路径
   - 用户房间自定义按 `image_layer` + `hotspot_layer` 进入 gateway 配置，不允许变成 H5 私有状态

## 建议命令

```bash
cd /Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell
node --check app.js
npm test
python3 -m http.server 4179
```

然后用浏览器打开：

```text
http://127.0.0.1:4179/creative.html
```

手工验收：

- 搜索 `builder` 或居民名，确认列表过滤生效。
- 在底部输入框输入中文，确认内容可见、未被透明色/禁用态覆盖。
- 点击直聊头像，确认弹出“进入「...」的房间私聊？”。
- 拉伸浏览器宽度，确认左栏和舞台同高。
- 点击空白场景，确认 UI 清屏/恢复正常。

## 输出要求

请输出：

- 是否通过验收
- 发现的问题，按严重程度排序
- 是否存在 H5 私有状态继续膨胀的风险
- 是否需要补测或补合同字段
