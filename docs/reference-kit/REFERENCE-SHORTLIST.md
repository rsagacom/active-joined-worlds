# Lobster Chat Reference Shortlist

这份清单只保留后续会真正拿来参考和执行的项目。

目标不是“收藏链接”，而是明确：
- 哪个项目解决什么问题
- 我们该借哪一层
- 哪些部分不要照抄

## 1. WorkAdventure

- 项目地址：<https://github.com/thecodingmachine/workadventure>
- 本地快照：`docs/reference-kit/readmes/workadventure.README.md`
- 适合参考：
  - 世界/城邦/房间的空间组织方式
  - 多用户同步和房间进入逻辑
  - “虚拟空间”和“真实聊天”的共存方式
- 不要照抄：
  - 音视频和沉浸式空间的重量级部分
  - 让地图层压过聊天主流程

## 2. RPGUI

- 项目地址：<https://github.com/RonenNess/RPGUI>
- 本地快照：`docs/reference-kit/readmes/rpgui.README.md`
- 适合参考：
  - SFC / 16-bit JRPG 视觉语言
  - 边框、面板、状态区、滚动条、菜单气质
  - 城主/居民/世界观 UI 的外观参考
- 不要照抄：
  - 纯装饰性纹理堆砌
  - 让表单和输入区失去现代可用性

## 3. Phaser

- 项目地址：<https://github.com/phaserjs/phaser>
- 本地快照：`docs/reference-kit/readmes/phaser.README.md`
- 适合参考：
  - Web 像素场景层
  - Tilemap/房间/城市地图渲染思路
  - 场景对象和 UI 分层
- 不要照抄：
  - 用游戏引擎接管聊天输入主流程
  - 把 IM 产品做成重交互小游戏

## 4. Lazygit

- 项目地址：<https://github.com/jesseduffield/lazygit>
- 本地快照：`docs/reference-kit/readmes/lazygit.README.md`
- 适合参考：
  - 终端产品交互质量
  - 列表切换、焦点管理、状态条、快捷键组织
  - “信息多但不乱”的终端布局
- 不要照抄：
  - Git 专用语义
  - 过强的表格/面板密度

## 5. ratatui

- 项目地址：<https://github.com/ratatui/ratatui>
- 本地快照：`docs/reference-kit/readmes/ratatui.README.md`
- 适合参考：
  - Rust 终端 UI 的正统实现方式
  - 稳定边框、布局、滚动、焦点和组件化
  - 替代当前手搓字符边框系统
- 不要照抄：
  - 纯 demo 风格组件堆砌
  - 为了炫技牺牲聊天产品的直接性

## 执行原则

后续开发按这条优先级参考：

1. 聊天产品交互基线：`Lazygit`
2. Web 世界/房间视觉语言：`RPGUI`
3. Web 场景层/像素地图：`Phaser`
4. 世界/房间多人空间架构：`WorkAdventure`
5. Rust TUI 重构路线：`ratatui`

## 当前工程决策

- Web 端：
  - 继续用 DOM/HTML 做聊天主流程
  - 用 `RPGUI` 借视觉语言
  - 必要时用 `Phaser` 承担像素场景层
- TUI：
  - 不再继续扩张当前手搓线框系统
  - 后续逐步迁到 `ratatui` 风格的稳定布局
- 产品方向：
  - 先保证“像正常 IM 一样能聊天”
  - 再叠加世界/城邦/管家/巡视能力
