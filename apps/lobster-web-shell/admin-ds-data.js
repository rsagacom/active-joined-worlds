/* ============================================================
   admin-ds-data.js — Mock 数据工厂
   所有模拟数据集中于此，后续接真实 Gateway 时只需替换此文件。
   不依赖任何框架，浏览器直接通过 <script> 加载。
   暴露全局对象 window.__ADMIN_DS_DATA__。
   ============================================================ */

(function () {
  'use strict';

  var data = {
    residents: [
      { id: 'R001', nick: 'chenxiaoming', email: 'chenxm@example.com', role: 'admin', status: 'online', lastSeen: '刚刚', msgCount: 1247 },
      { id: 'R002', nick: 'wangdana', email: 'wangdn@example.com', role: 'resident', status: 'online', lastSeen: '5 分钟前', msgCount: 892 },
      { id: 'R003', nick: 'zhanglaosan', email: 'zhangls@example.com', role: 'resident', status: 'online', lastSeen: '12 分钟前', msgCount: 2341 },
      { id: 'R004', nick: 'limei', email: 'limei@example.com', role: 'resident', status: 'offline', lastSeen: '2 小时前', msgCount: 456 },
      { id: 'R005', nick: 'zhaoyunlong', email: 'zhaoyl@example.com', role: 'resident', status: 'online', lastSeen: '刚刚', msgCount: 3201 },
      { id: 'R006', nick: 'test_user_03', email: 'test03@example.com', role: 'guest', status: 'banned', lastSeen: '3 天前', msgCount: 23 },
      { id: 'R007', nick: 'sunwenyu', email: 'sunwy@example.com', role: 'resident', status: 'online', lastSeen: '8 分钟前', msgCount: 1678 },
      { id: 'R008', nick: 'qianliming', email: 'qianlm@example.com', role: 'admin', status: 'offline', lastSeen: '1 天前', msgCount: 567 },
      { id: 'R009', nick: 'zhoujie', email: 'zhoujie@example.com', role: 'resident', status: 'online', lastSeen: '3 分钟前', msgCount: 3456 },
      { id: 'R010', nick: 'wulei', email: 'wulei@example.com', role: 'resident', status: 'offline', lastSeen: '6 小时前', msgCount: 789 },
      { id: 'R011', nick: 'huanglei', email: 'huanglei@example.com', role: 'resident', status: 'banned', lastSeen: '5 天前', msgCount: 45 },
      { id: 'R012', nick: 'linxiaoxiao', email: 'linxx@example.com', role: 'admin', status: 'online', lastSeen: '刚刚', msgCount: 4567 }
    ],

    rooms: [
      { id: 'RM001', name: '主城大厅', type: 'group', members: 24, todayMsg: 1247, unread: 89, creator: 'chenxiaoming', created: '2026-03-01', frozen: false },
      { id: 'RM002', name: '望海别墅', type: 'group', members: 8, todayMsg: 342, unread: 12, creator: 'wangdana', created: '2026-03-15', frozen: false },
      { id: 'RM003', name: '世界广场', type: 'world', members: 142, todayMsg: 4521, unread: 234, creator: 'system', created: '2026-03-01', frozen: false },
      { id: 'RM004', name: 'AJW文学社', type: 'group', members: 15, todayMsg: 567, unread: 45, creator: 'zhanglaosan', created: '2026-04-02', frozen: false },
      { id: 'RM005', name: 'chenxiaoming ↔ wangdana', type: 'private', members: 2, todayMsg: 89, unread: 0, creator: 'chenxiaoming', created: '2026-03-20', frozen: false },
      { id: 'RM006', name: 'zhanglaosan ↔ limei', type: 'private', members: 2, todayMsg: 156, unread: 3, creator: 'zhanglaosan', created: '2026-04-10', frozen: false },
      { id: 'RM007', name: '深夜食堂', type: 'group', members: 12, todayMsg: 234, unread: 18, creator: 'zhaoyunlong', created: '2026-04-15', frozen: false },
      { id: 'RM008', name: '技术交流', type: 'group', members: 20, todayMsg: 890, unread: 67, creator: 'sunwenyu', created: '2026-03-25', frozen: false },
      { id: 'RM009', name: 'zhaoyunlong ↔ wulei', type: 'private', members: 2, todayMsg: 45, unread: 1, creator: 'zhaoyunlong', created: '2026-05-01', frozen: false },
      { id: 'RM010', name: '新手村', type: 'world', members: 56, todayMsg: 678, unread: 23, creator: 'system', created: '2026-03-01', frozen: false }
    ],

    messages: [
      { time: '14:35:22', sender: 'test_user_03', room: '#主城大厅', content: '加我微信 xxx12345 免费领取优惠券！！！', status: 'pending' },
      { time: '14:34:18', sender: 'zhanglaosan', room: '#AJW文学社', content: '今天的散文写得不错，大家可以看看第二章', status: 'passed' },
      { time: '14:33:05', sender: 'wulei', room: '#世界广场', content: '有人一起打游戏吗？在线等', status: 'passed' },
      { time: '14:32:41', sender: 'test_user_03', room: '#主城大厅', content: 'https://spam-site.example.com 点击领取大奖', status: 'flagged' },
      { time: '14:31:12', sender: 'wangdana', room: '#望海别墅', content: '今晚聚餐地点改了，大家看下新地址', status: 'passed' },
      { time: '14:30:55', sender: 'limei', room: '#世界广场', content: '分享一张今天拍的照片 [图片]', status: 'passed' },
      { time: '14:29:33', sender: 'zhaoyunlong', room: '#技术交流', content: '这个 bug 应该跟 Gateway 连接超时有关', status: 'passed' },
      { time: '14:28:17', sender: 'guest_007', room: '#世界广场', content: '有没有人知道怎么联系管理员？', status: 'pending' },
      { time: '14:27:01', sender: 'sunwenyu', room: '#AJW文学社', content: '新写了一首诗，请大家指教', status: 'passed' },
      { time: '14:25:44', sender: 'qianliming', room: '#主城大厅', content: '广告位招租，日活 500+，联系 QQ 12345', status: 'blocked' }
    ],

    inviteCodes: [
      { code: 'LOB-2026-0421', room: '#望海别墅', maxUses: 10, used: 6, expires: '2026-06-01', creator: 'wangdana', status: 'active' },
      { code: 'LOB-2026-0501', room: '#AJW文学社', maxUses: 5, used: 3, expires: '2026-07-01', creator: 'zhanglaosan', status: 'active' },
      { code: 'LOB-2026-0315', room: '#主城大厅', maxUses: 50, used: 50, expires: '2026-04-15', creator: 'chenxiaoming', status: 'expired' },
      { code: 'LOB-2026-0510', room: '#深夜食堂', maxUses: 8, used: 1, expires: '2026-08-10', creator: 'zhaoyunlong', status: 'active' },
      { code: 'LOB-2026-0401', room: '#技术交流', maxUses: 20, used: 12, expires: '2026-06-15', creator: 'sunwenyu', status: 'active' }
    ],

    logs: [
      { time: '14:35:10', level: 'error', type: 'connection', desc: 'Gateway WebSocket 连接中断 · 客户端 IP 58.22.14.7 · 重连中', source: 'Gateway' },
      { time: '14:32:45', level: 'warn', type: 'login', desc: '居民 test_user_03 连续 3 次登录失败 · IP 114.25.18.9', source: 'Auth' },
      { time: '14:30:22', level: 'error', type: 'message', desc: '消息发送失败: 房间 #主城大厅 · 发送者 qianliming · 内容过长 (5124 chars)', source: 'Message' },
      { time: '14:28:01', level: 'warn', type: 'ai', desc: 'AI 助手主通道响应超时 30s · 自动切换至备用通道 Claude Sonnet', source: 'AI' },
      { time: '14:15:37', level: 'error', type: 'connection', desc: '客户端频繁断开连接 · 居民 zhoujie · 30 分钟内重连 12 次', source: 'Gateway' },
      { time: '14:10:55', level: 'warn', type: 'login', desc: '未注册邮箱尝试登录: unknown@spam.com · IP 203.0.113.45', source: 'Auth' },
      { time: '13:58:12', level: 'info', type: 'connection', desc: 'Gateway 连接数达到预警阈值 450/500', source: 'Gateway' },
      { time: '13:42:33', level: 'error', type: 'ai', desc: '备用 AI 通道不可用 · api.anthropic.com 返回 503', source: 'AI' },
      { time: '13:30:18', level: 'warn', type: 'message', desc: '消息发送频率异常 · 居民 test_user_03 · 60秒内发送 45 条', source: 'Message' },
      { time: '13:15:01', level: 'info', type: 'connection', desc: '备份 Gateway 节点已就绪 · wss://gw-backup.lobster-chat.io/ws', source: 'Gateway' }
    ]
  };

  // 映射表（只读，不从外部注入 HTML）
  data.labels = {
    roleTag: { admin: 'info', resident: 'default', guest: 'default' },
    roleText: { admin: '管理员', resident: '居民', guest: '访客' },
    statusClass: { online: 'online', offline: 'offline', banned: 'banned' },
    statusText: { online: '在线', offline: '离线', banned: '已禁用' },
    roomTypeTag: { private: 'info', group: 'success', world: 'warning' },
    roomTypeText: { private: '私聊', group: '群聊', world: '世界频道' },
    msgStatusTag: { pending: 'warning', passed: 'success', flagged: 'danger', blocked: 'default' },
    msgStatusText: { pending: '待审核', passed: '已通过', flagged: '已标记', blocked: '已屏蔽' },
    inviteStatusTag: { active: 'success', expired: 'default' },
    inviteStatusText: { active: '有效', expired: '已过期' },
    logTypeText: { connection: '连接失败', login: '登录失败', message: '消息失败', ai: 'AI 异常' },
    logLevelText: { error: '错误', warn: '警告', info: '信息' }
  };

  window.__ADMIN_DS_DATA__ = data;
})();
