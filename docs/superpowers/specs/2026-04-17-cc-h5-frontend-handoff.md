# lobster-chat H5 Frontend Handoff for CC (GLM5)

日期：2026-04-17  
适用对象：负责 `lobster-chat` H5 视觉与交互前端的 CC / GLM5 开发线程  
当前 owner 分工：
- 我：负责后端、共享合同、数据语义、最终集成、验收和修订
- CC：只负责 H5 的视觉、交互、页面表现、前端消费层收口

---

## 1. 目标

把 `lobster-chat` 当前 H5 入口继续往 `contract-first` 收口，但**只做前端消费层**，不改产品边界，不新增前端私有 canonical state。

这次交付不是做新后端能力，而是：

1. 让 H5 更稳定地消费 `gateway` 正式合同
2. 继续减少 [app.js](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js) 里“本地猜状态/拼文案”的比例
3. 推进 H5/SFC 的视觉和交互表现，但不越权定义后端真源

---

## 2. 架构红线

必须遵守下面这些边界，不要自行改口径：

1. `gateway contract` 是唯一真源  
   当前正式合同是：
   - `conversation_shell`
   - `scene_render`

2. `H5` 是当前主交互入口  
   但它只是主入口，不是状态真源。

3. `TUI` 是并行映射客户端  
   不要把 H5 做成依赖 TUI，也不要把 TUI 改成依赖 H5 私货状态。

4. 不允许新增 H5 私有 canonical state  
   可以有临时 UI 派生值、渲染缓存、compat fallback，但不能再在前端偷偷长一套真源状态。

5. 当前阶段只收 IM 主路径  
   不做：
   - 世界治理扩张
   - 装扮编辑器
   - 素材系统
   - 眼镜端
   - 多城邦复杂产品面

参考：
- [README.md](/Users/rsaga/Documents/Playground/lobster-chat/README.md)
- [PRODUCT_CHARTER.md](/Users/rsaga/Documents/Playground/lobster-chat/docs/PRODUCT_CHARTER.md)

---

## 3. 当前代码状态

### 后端已给出的正式语义

当前 `lobster-waku-gateway` 已经输出并在推进这些字段：

- 基础：
  - `kind`
  - `scope`
  - `kind_hint`
  - `participant_label`
  - `route_label`
  - `member_count`

- 列表与摘要：
  - `list_summary`
  - `status_line`
  - `thread_headline`
  - `chat_status_summary`
  - `queue_summary`
  - `preview_text`
  - `last_activity_label`
  - `activity_time_label`
  - `overview_summary`
  - `context_summary`
  - `search_terms`

- 详情与动作：
  - `caretaker`
  - `detail_card`
  - `workflow`
  - `inline_actions`

- 场景：
  - `scene_banner`
  - `scene_summary`
  - `room_variant`
  - `room_motif`
  - `scene_render.stage`
  - `scene_render.portrait`

### 前端已完成到哪

当前 H5 已经做过一轮收口，很多 non-user 页的标题/摘要层已经开始复用 helper 和合同语义，而不是直接吃 raw `room.title`。

但仍有残留：
- 一些搜索、摘要、detail、overview、placeholder、callout 文案仍有本地 heuristics
- direct 会话相关语义仍存在 fallback 依赖
- `app.js` 仍然过大

---

## 4. CC 这次只负责什么

CC 本轮只做下面 4 类工作：

### A. 继续把 H5 做成“优先消费正式合同”的视觉/交互入口

重点查看：
- [/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/app.js)

目标：
- 优先吃 `conversation_shell`
- 再吃 `scene_render`
- 最后才兼容 `rooms[]` / sample fallback

### B. 清理视觉和交互层里仍然不该存在的本地 heuristics

允许保留的：
- 真正的 UI 派生值
- quick-action 动态态覆盖
- 少量兼容 fallback

不允许继续新增的：
- 新的私有 canonical 字段
- 新的“页面自己猜真相”逻辑
- 新的对 raw `room.title` / `room.subtitle` 的长期依赖

### C. 收口 direct / public / system 三类会话在 H5 的展示与交互一致性

不要自己重新发明分类规则。  
优先使用合同里的：
- `kind`
- `scope`
- `participant_label`
- `route_label`
- `thread_headline`

### D. 推进 SFC 风格场景表现

这轮不是做新的后端协议，而是确保：
- 场景标题
- 房间摘要
- stage / portrait 信息
- detail / workflow / inline actions

都能通过正式合同稳定进入 H5。

---

## 5. 明确不要做的事

这次不要碰下面这些：

1. 不改 Rust 后端合同定义  
   如果发现合同缺字段，只记录缺口，不要在前端偷偷补真源。

2. 不扩产品范围  
   不新做治理页、装扮编辑器、世界层复杂交互。

3. 不越权改后端语义  
   不擅自重命名、重解释、重发明合同字段。

4. 不重写大框架  
   不要把 H5 改成新的状态管理体系，不引入新前端框架。

5. 不为了“更好看”破坏当前 contract-first 路线  
   当前优先级是结构收口，不是视觉抛光。

6. 不让前端和后端同时改同一语义的定义  
   如果字段缺失，先在交付说明里标出，不要擅自造字段名。

---

## 6. 建议的开发顺序

建议按这个顺序推进：

1. 先扫 `app.js` 中所有直接读 `room.title / room.subtitle / room.meta` 的摘要层使用点
2. 分类成：
   - 应该吃合同
   - 可以保留本地动态态
   - 只是 legacy fallback
3. 逐块替换为现有 helper / 合同字段
4. 每做一块就补/改对应测试
5. 不要一次性大改整文件

优先区域建议：

1. non-user 摘要层残口
2. user 页仍依赖 raw title 的 fallback 摘要层
3. 搜索/过滤/会话定位逻辑
4. scene / detail / workflow 投影一致性

---

## 7. 测试要求

每一轮前端改动至少要跑：

```bash
node --test /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/nonuser-shell-init.test.mjs
node --test /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/user-shell-init.test.mjs
node --test /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/test/shell-pages-static.test.mjs
```

如果动到了 gateway 合同消费假设，额外建议跑：

```bash
cargo test -p lobster-waku-gateway shell_state -- --nocapture
```

如果前端需要 fixture 更新，要同步检查：
- [/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/generated/state.contract.json](/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-web-shell/generated/state.contract.json)

---

## 8. 交付格式要求

CC 每次交付时，请输出：

1. 改了哪些文件
2. 哪些 UI 区块从本地 heuristics 改成了合同优先
3. 哪些点仍然是临时 fallback
4. 跑了哪些测试
5. 还有哪些字段缺口需要后端补

如果存在后端缺口，请按这种格式列出来：

```md
- 缺口：direct 会话对端显示名仍缺正式字段
  当前前端临时 fallback：roomDisplayPeer()
  建议后端补：peer_label
```

---

## 9. 当前已知后端缺口

下面这些缺口目前仍可能存在，请 CC 不要在前端自行发明真源：

1. direct 会话“对端显示名”仍未完全正式化  
   前端当前仍可能需要 fallback。

2. viewer-specific 语义仍然有限  
   H5 不应假装自己知道所有“当前身份锚点”。

3. 少量 legacy `rooms[]` 兼容仍在过渡中  
   可以消费，但不要继续把新功能挂回去。

---

## 10. 完成标准

这轮前端工作完成，至少要满足：

1. H5 新增收口点优先消费正式合同，而不是继续新增页面私货
2. non-user 和 user 的摘要层更一致
3. 搜索/定位/卡片文案更依赖合同字段
4. 没有新增前端 canonical state
5. 所有相关测试通过
6. 明确列出仍待后端补的字段缺口

---

## 11. 我这边的后续动作

等 CC 按这份文档交付完，我这边会做：

1. 代码验收
2. 合同一致性复查
3. 回归测试
4. 必要的后端补字段
5. 最后一轮收口修订

所以 CC 的目标不是“独立定架构”或“顺手做后端”，而是：

`在既定 contract-first 架构下，把 H5 的视觉、交互、页面表现和前端消费层尽可能收干净。`
