# CC 下一轮前端任务：Creative + Hub 收口

## 当前判断

- 当前 `creative.html` 和 `index.html / hub` 的大方向是对的。
- 像素风、木框、游戏 HUD、暖色深底的气质已经立住了。
- 这轮不要再重做风格，也不要再回到 SaaS / glass 控制台。
- 当前问题主要是：
  - scene 装饰与正文抢注意力
  - 移动端顶部大物件和标题区争空间
  - 输入区仍然偏像大表单块
  - 左栏有时仍像半个内容区，不够像窄导航
  - hub 还没有完全形成“公共广场”语义，仍有一点室内摆件拼贴感

## 只做这两个页面

- `http://localhost:8080/creative.html`
- `http://localhost:8080/index.html`

不要把这轮扩散到：
- `user.html`
- `admin.html`

除非只是被动兼容样式，否则不要动旧页。

## 核心目标

### 1. creative 页
- 保持像素/SFC/HUD 方向不变
- 把页面从“有感觉的初稿”收成“更完整、更克制”的成品
- scene 继续保留，但只能做语境层，不要压文案和聊天主轴
- 输入区要更像聊天 action bar，而不是一块厚表单

### 2. hub 页
- 继续强化“默认人已经站在城里”
- 更像城邦公共广场 / 公共频道，不像室内房间
- 让公共区域、路面、建筑轮廓、招牌/灯光关系更明确
- 少一点私宅摆设感

## 明确要修的点

### A. Scene 与内容主次
- 缩小或后退顶部 scene 中偏大的家具/装饰块
- 给标题、频道名、短说明留安全区
- 避免 scene 压住文字、chip、标题
- 让 scene 更像“空间背景”，不是“贴了一层大图标”

### B. 输入区
- 继续减薄输入区高度
- 输入框和发送按钮要更像统一的像素聊天操作条
- 不要像后台系统的长表单
- 移动端上尤其要减轻体积

### C. 左栏
- 左栏继续收成窄导航
- 减少说明性内容和阅读感
- 强化按钮感、切换感
- 不要让左栏成为第二内容区

### D. 聊天主轴
- 聊天记录必须继续比 scene 更重要
- 系统 / 他人 / 自己 的气泡样式要清楚，但不要增加太多新颜色
- 优先靠排版、位置、边框、间距来区分
- 保持“在这个空间里聊天”的感觉，而不是“下方另一个模块”

### E. Hub 的公共广场语义
- 加强：
  - 公共区域感
  - 路面/天际线/建筑块面
  - 标识牌与频道归属
  - 夜间城邦氛围
- 减少：
  - 私人房间感
  - 室内摆件感

### F. 移动端优先收口
- 当前桌面端方向已基本稳定，移动端优先级更高
- 移动端重点修：
  - 顶部 scene 压字
  - 输入区过厚
  - 消息块过重
  - 页面上下关系不够轻巧

## 允许修改的文件

- `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/creative.html`
- `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/index.html`
- `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/styles.css`
- `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/styles.creative.css`
- 如确有必要，再改：
  - `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js`

## 不要做

- 不改 Rust 后端
- 不改 gateway contract
- 不新增前端 canonical state
- 不重写整体结构
- 不引回现代玻璃风、SaaS 控制台感

## 验收要求

完成后必须交付：

1. 改动文件列表
2. 你如何处理了 scene 与正文的主次冲突
3. 你如何把输入区收成 action bar
4. 你如何让 hub 更像公共广场
5. 你如何收口移动端
6. 实际跑过的测试命令
7. 新截图路径

至少跑：

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat && node --test apps/lobster-web-shell/test/*.mjs
```

至少输出截图：

- `creative-desktop`
- `creative-mobile`
- `hub-desktop`
- `hub-mobile`
