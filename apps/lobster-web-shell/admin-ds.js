/* ============================================================
   admin-ds.js — lobster-chat 管理后台候选方案 交互脚本
   ============================================================ */

(function () {
  'use strict';

  // ====== DOM refs ======
  const sidebar = document.getElementById('dsSidebar');
  const sidebarToggle = document.getElementById('dsSidebarToggle');
  const sidebarOverlay = document.getElementById('dsSidebarOverlay');
  const detailPanel = document.getElementById('dsDetailPanel');
  const detailTitle = document.getElementById('dsDetailTitle');
  const detailBody = document.getElementById('dsDetailBody');
  const detailActions = document.getElementById('dsDetailActions');
  const detailClose = document.getElementById('dsDetailClose');
  const gatewayStatus = document.getElementById('dsGatewayStatus');
  const dashboardTime = document.getElementById('dashboardTime');
  const msgAuditBadge = document.getElementById('msgAuditBadge');

  let activeModule = 'dashboard';
  let sidebarExpanded = true;

  // ====== Mock Data ======

  const residents = [
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
    { id: 'R012', nick: 'linxiaoxiao', email: 'linxx@example.com', role: 'admin', status: 'online', lastSeen: '刚刚', msgCount: 4567 },
  ];

  const rooms = [
    { id: 'RM001', name: '主城大厅', type: 'group', members: 24, todayMsg: 1247, unread: 89, creator: 'chenxiaoming', created: '2026-03-01' },
    { id: 'RM002', name: '望海别墅', type: 'group', members: 8, todayMsg: 342, unread: 12, creator: 'wangdana', created: '2026-03-15' },
    { id: 'RM003', name: '世界广场', type: 'world', members: 142, todayMsg: 4521, unread: 234, creator: 'system', created: '2026-03-01' },
    { id: 'RM004', name: '龙虾文学社', type: 'group', members: 15, todayMsg: 567, unread: 45, creator: 'zhanglaosan', created: '2026-04-02' },
    { id: 'RM005', name: 'chenxiaoming ↔ wangdana', type: 'private', members: 2, todayMsg: 89, unread: 0, creator: 'chenxiaoming', created: '2026-03-20' },
    { id: 'RM006', name: 'zhanglaosan ↔ limei', type: 'private', members: 2, todayMsg: 156, unread: 3, creator: 'zhanglaosan', created: '2026-04-10' },
    { id: 'RM007', name: '深夜食堂', type: 'group', members: 12, todayMsg: 234, unread: 18, creator: 'zhaoyunlong', created: '2026-04-15' },
    { id: 'RM008', name: '技术交流', type: 'group', members: 20, todayMsg: 890, unread: 67, creator: 'sunwenyu', created: '2026-03-25' },
    { id: 'RM009', name: 'zhaoyunlong ↔ wulei', type: 'private', members: 2, todayMsg: 45, unread: 1, creator: 'zhaoyunlong', created: '2026-05-01' },
    { id: 'RM010', name: '新手村', type: 'world', members: 56, todayMsg: 678, unread: 23, creator: 'system', created: '2026-03-01' },
  ];

  const messages = [
    { time: '14:35:22', sender: 'test_user_03', room: '#主城大厅', content: '加我微信 xxx12345 免费领取优惠券！！！', status: 'pending' },
    { time: '14:34:18', sender: 'zhanglaosan', room: '#龙虾文学社', content: '今天的散文写得不错，大家可以看看第二章', status: 'passed' },
    { time: '14:33:05', sender: 'wulei', room: '#世界广场', content: '有人一起打游戏吗？在线等', status: 'passed' },
    { time: '14:32:41', sender: 'test_user_03', room: '#主城大厅', content: 'https://spam-site.example.com 点击领取大奖', status: 'flagged' },
    { time: '14:31:12', sender: 'wangdana', room: '#望海别墅', content: '今晚聚餐地点改了，大家看下新地址', status: 'passed' },
    { time: '14:30:55', sender: 'limei', room: '#世界广场', content: '分享一张今天拍的照片 [图片]', status: 'passed' },
    { time: '14:29:33', sender: 'zhaoyunlong', room: '#技术交流', content: '这个 bug 应该跟 Gateway 连接超时有关', status: 'passed' },
    { time: '14:28:17', sender: 'guest_007', room: '#世界广场', content: '有没有人知道怎么联系管理员？', status: 'pending' },
    { time: '14:27:01', sender: 'sunwenyu', room: '#龙虾文学社', content: '新写了一首诗，请大家指教', status: 'passed' },
    { time: '14:25:44', sender: 'qianliming', room: '#主城大厅', content: '广告位招租，日活 500+，联系 QQ 12345', status: 'blocked' },
  ];

  const inviteCodes = [
    { code: 'LOB-2026-0421', room: '#望海别墅', maxUses: 10, used: 6, expires: '2026-06-01', creator: 'wangdana', status: 'active' },
    { code: 'LOB-2026-0501', room: '#龙虾文学社', maxUses: 5, used: 3, expires: '2026-07-01', creator: 'zhanglaosan', status: 'active' },
    { code: 'LOB-2026-0315', room: '#主城大厅', maxUses: 50, used: 50, expires: '2026-04-15', creator: 'chenxiaoming', status: 'expired' },
    { code: 'LOB-2026-0510', room: '#深夜食堂', maxUses: 8, used: 1, expires: '2026-08-10', creator: 'zhaoyunlong', status: 'active' },
    { code: 'LOB-2026-0401', room: '#技术交流', maxUses: 20, used: 12, expires: '2026-06-15', creator: 'sunwenyu', status: 'active' },
  ];

  const logs = [
    { time: '14:35:10', level: 'error', type: 'connection', desc: 'Gateway WebSocket 连接中断 · 客户端 IP 58.22.14.7 · 重连中', source: 'Gateway' },
    { time: '14:32:45', level: 'warn', type: 'login', desc: '居民 test_user_03 连续 3 次登录失败 · IP 114.25.18.9', source: 'Auth' },
    { time: '14:30:22', level: 'error', type: 'message', desc: '消息发送失败: 房间 #主城大厅 · 发送者 qianliming · 内容过长 (5124 chars)', source: 'Message' },
    { time: '14:28:01', level: 'warn', type: 'ai', desc: 'AI 助手主通道响应超时 30s · 自动切换至备用通道 Claude Sonnet', source: 'AI' },
    { time: '14:15:37', level: 'error', type: 'connection', desc: '客户端频繁断开连接 · 居民 zhoujie · 30 分钟内重连 12 次', source: 'Gateway' },
    { time: '14:10:55', level: 'warn', type: 'login', desc: '未注册邮箱尝试登录: unknown@spam.com · IP 203.0.113.45', source: 'Auth' },
    { time: '13:58:12', level: 'info', type: 'connection', desc: 'Gateway 连接数达到预警阈值 450/500', source: 'Gateway' },
    { time: '13:42:33', level: 'error', type: 'ai', desc: '备用 AI 通道不可用 · api.anthropic.com 返回 503', source: 'AI' },
    { time: '13:30:18', level: 'warn', type: 'message', desc: '消息发送频率异常 · 居民 test_user_03 · 60秒内发送 45 条', source: 'Message' },
    { time: '13:15:01', level: 'info', type: 'connection', desc: '备份 Gateway 节点已就绪 · wss://gw-backup.lobster-chat.io/ws', source: 'Gateway' },
  ];

  // ====== Module Switching ======

  function switchModule(moduleName) {
    activeModule = moduleName;
    // Update nav
    document.querySelectorAll('.ds-nav-item').forEach(function (item) {
      item.classList.toggle('active', item.dataset.module === moduleName);
    });
    // Update content
    document.querySelectorAll('.ds-module').forEach(function (mod) {
      mod.classList.remove('active');
    });
    var target = document.getElementById('mod-' + moduleName);
    if (target) target.classList.add('active');
    // Close detail panel
    closeDetail();
    // On mobile, collapse sidebar after nav
    if (window.innerWidth <= 768) {
      collapseSidebar();
    }
  }

  document.querySelectorAll('.ds-nav-item').forEach(function (item) {
    item.addEventListener('click', function () {
      switchModule(this.dataset.module);
    });
  });

  // ====== Sidebar Toggle ======

  function collapseSidebar() {
    sidebar.classList.add('collapsed');
    sidebarOverlay.classList.remove('show');
    sidebarExpanded = false;
  }

  function expandSidebar() {
    sidebar.classList.remove('collapsed');
    sidebarExpanded = true;
  }

  sidebarToggle.addEventListener('click', function () {
    if (window.innerWidth <= 768) {
      // Mobile: toggle overlay mode
      if (sidebarExpanded) {
        collapseSidebar();
      } else {
        expandSidebar();
        sidebarOverlay.classList.add('show');
      }
    } else {
      // Desktop: toggle collapse
      if (sidebarExpanded) {
        collapseSidebar();
      } else {
        expandSidebar();
      }
    }
  });

  sidebarOverlay.addEventListener('click', function () {
    collapseSidebar();
  });

  // On mobile start collapsed
  function handleResize() {
    if (window.innerWidth <= 768) {
      if (sidebarExpanded && !sidebarOverlay.classList.contains('show')) {
        collapseSidebar();
      }
    }
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // ====== Detail Panel ======

  function openDetail(title, bodyHTML, actionsHTML) {
    detailTitle.textContent = title;
    detailBody.innerHTML = bodyHTML;
    detailPanel.classList.remove('hidden');
    if (actionsHTML) {
      detailActions.innerHTML = actionsHTML;
      detailActions.style.display = 'flex';
    } else {
      detailActions.style.display = 'none';
    }
  }

  function closeDetail() {
    detailPanel.classList.add('hidden');
    // Deselect any selected rows
    document.querySelectorAll('.ds-table tbody tr.selected').forEach(function (tr) {
      tr.classList.remove('selected');
    });
  }

  detailClose.addEventListener('click', closeDetail);

  // ====== Render Residents Table ======

  function renderResidents(filterStatus, filterRole, searchTerm) {
    var tbody = document.getElementById('residentTableBody');
    var filtered = residents.filter(function (r) {
      if (filterStatus && filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterRole && filterRole !== 'all' && r.role !== filterRole) return false;
      if (searchTerm) {
        var term = searchTerm.toLowerCase();
        if (r.id.toLowerCase().indexOf(term) === -1 &&
            r.nick.toLowerCase().indexOf(term) === -1 &&
            r.email.toLowerCase().indexOf(term) === -1) return false;
      }
      return true;
    });

    var statusClass = { online: 'online', offline: 'offline', banned: 'banned' };
    var statusText = { online: '在线', offline: '离线', banned: '已禁用' };
    var roleTag = { admin: 'info', resident: 'default', guest: 'default' };
    var roleText = { admin: '管理员', resident: '居民', guest: '访客' };

    tbody.innerHTML = filtered.map(function (r) {
      return '<tr data-resident-id="' + r.id + '">' +
        '<td><span style="font-family:var(--ds-font-mono);font-size:12px;">' + r.id + '</span></td>' +
        '<td><strong>' + r.nick + '</strong></td>' +
        '<td style="color:var(--ds-text-secondary);">' + r.email + '</td>' +
        '<td><span class="ds-tag ' + (roleTag[r.role] || 'default') + '">' + (roleText[r.role] || r.role) + '</span></td>' +
        '<td><span class="ds-status-indicator ' + (statusClass[r.status] || 'offline') + '">' + (statusText[r.status] || r.status) + '</span></td>' +
        '<td style="color:var(--ds-text-secondary);">' + r.lastSeen + '</td>' +
        '<td>' + r.msgCount.toLocaleString() + '</td>' +
        '<td>' +
          '<div class="ds-btn-group">' +
            (r.status === 'banned'
              ? '<button class="ds-btn ds-btn-outline ds-btn-xs restore-resident">恢复</button>'
              : '<button class="ds-btn ds-btn-outline ds-btn-xs ban-resident">禁用</button>') +
            '<button class="ds-btn ds-btn-outline ds-btn-xs view-session">会话</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    // Row click → detail
    tbody.querySelectorAll('tr').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        // Don't trigger if clicking a button
        if (e.target.closest('button')) return;
        var rid = tr.dataset.residentId;
        var resident = residents.find(function (r) { return r.id === rid; });
        if (!resident) return;

        // Highlight row
        tbody.querySelectorAll('tr.selected').forEach(function (r) { r.classList.remove('selected'); });
        tr.classList.add('selected');

        openDetail(
          '居民: ' + resident.nick,
          '<div class="ds-detail-field"><div class="ds-detail-label">居民 ID</div><div class="ds-detail-value" style="font-family:var(--ds-font-mono);">' + resident.id + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">昵称</div><div class="ds-detail-value">' + resident.nick + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">登录邮箱</div><div class="ds-detail-value">' + resident.email + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">角色</div><div class="ds-detail-value">' + (roleText[resident.role] || resident.role) + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">状态</div><div class="ds-detail-value"><span class="ds-status-indicator ' + (statusClass[resident.status] || 'offline') + '">' + (statusText[resident.status] || resident.status) + '</span></div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">最近在线</div><div class="ds-detail-value">' + resident.lastSeen + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">累计消息</div><div class="ds-detail-value">' + resident.msgCount.toLocaleString() + '</div></div>',
          '<button class="ds-btn ds-btn-outline ds-btn-sm">查看会话</button>' +
          (resident.status === 'banned'
            ? '<button class="ds-btn ds-btn-primary ds-btn-sm">恢复居民</button>'
            : '<button class="ds-btn ds-btn-danger-text ds-btn-sm">禁用居民</button>')
        );
      });
    });

    // Button handlers (delegated)
    tbody.querySelectorAll('.ban-resident, .restore-resident').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var rid = btn.closest('tr').dataset.residentId;
        var resident = residents.find(function (r) { return r.id === rid; });
        if (!resident) return;
        if (resident.status === 'banned') {
          resident.status = 'offline';
        } else {
          resident.status = 'banned';
        }
        renderResidents(
          document.getElementById('residentStatusFilter').value,
          document.getElementById('residentRoleFilter').value,
          document.getElementById('residentSearch').value
        );
      });
    });

    tbody.querySelectorAll('.view-session').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        switchModule('rooms');
        // Give time for module to render, then search
        setTimeout(function () {
          var searchInput = document.getElementById('roomSearch');
          if (searchInput) {
            var rid = btn.closest('tr').dataset.residentId;
            var resident = residents.find(function (r) { return r.id === rid; });
            if (resident) {
              searchInput.value = resident.nick;
              renderRooms(document.getElementById('roomTypeFilter').value, resident.nick);
            }
          }
        }, 100);
      });
    });
  }

  // Resident search/filter
  document.getElementById('residentSearch').addEventListener('input', function () {
    renderResidents(
      document.getElementById('residentStatusFilter').value,
      document.getElementById('residentRoleFilter').value,
      this.value
    );
  });
  document.getElementById('residentStatusFilter').addEventListener('change', function () {
    renderResidents(this.value, document.getElementById('residentRoleFilter').value, document.getElementById('residentSearch').value);
  });
  document.getElementById('residentRoleFilter').addEventListener('change', function () {
    renderResidents(document.getElementById('residentStatusFilter').value, this.value, document.getElementById('residentSearch').value);
  });

  // ====== Render Rooms Table ======

  function renderRooms(filterType, searchTerm) {
    var tbody = document.getElementById('roomTableBody');
    var filtered = rooms.filter(function (r) {
      if (filterType && filterType !== 'all' && r.type !== filterType) return false;
      if (searchTerm) {
        var term = searchTerm.toLowerCase();
        if (r.id.toLowerCase().indexOf(term) === -1 &&
            r.name.toLowerCase().indexOf(term) === -1 &&
            r.creator.toLowerCase().indexOf(term) === -1) return false;
      }
      return true;
    });

    var typeTag = { private: 'info', group: 'success', world: 'warning' };
    var typeText = { private: '私聊', group: '群聊', world: '世界频道' };

    tbody.innerHTML = filtered.map(function (r) {
      return '<tr data-room-id="' + r.id + '">' +
        '<td><span style="font-family:var(--ds-font-mono);font-size:12px;">' + r.id + '</span></td>' +
        '<td><strong>' + r.name + '</strong></td>' +
        '<td><span class="ds-tag ' + (typeTag[r.type] || 'default') + '">' + (typeText[r.type] || r.type) + '</span></td>' +
        '<td>' + r.members + '</td>' +
        '<td>' + r.todayMsg.toLocaleString() + '</td>' +
        '<td>' + r.unread + '</td>' +
        '<td>' + r.creator + '</td>' +
        '<td style="color:var(--ds-text-secondary);">' + r.created + '</td>' +
      '</tr>';
    }).join('');

    // Row click → detail
    tbody.querySelectorAll('tr').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var rid = tr.dataset.roomId;
        var room = rooms.find(function (r) { return r.id === rid; });
        if (!room) return;

        tbody.querySelectorAll('tr.selected').forEach(function (r) { r.classList.remove('selected'); });
        tr.classList.add('selected');

        openDetail(
          '房间: ' + room.name,
          '<div class="ds-detail-field"><div class="ds-detail-label">房间 ID</div><div class="ds-detail-value" style="font-family:var(--ds-font-mono);">' + room.id + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">房间名</div><div class="ds-detail-value">' + room.name + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">类型</div><div class="ds-detail-value">' + (typeText[room.type] || room.type) + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">成员数</div><div class="ds-detail-value">' + room.members + ' 人</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">今日消息</div><div class="ds-detail-value">' + room.todayMsg.toLocaleString() + ' 条</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">未读消息</div><div class="ds-detail-value">' + room.unread + ' 条</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">创建者</div><div class="ds-detail-value">' + room.creator + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">创建时间</div><div class="ds-detail-value">' + room.created + '</div></div>',
          '<button class="ds-btn ds-btn-outline ds-btn-sm">查看消息</button><button class="ds-btn ds-btn-outline ds-btn-sm">管理成员</button>'
        );
      });
    });
  }

  document.getElementById('roomSearch').addEventListener('input', function () {
    renderRooms(document.getElementById('roomTypeFilter').value, this.value);
  });
  document.getElementById('roomTypeFilter').addEventListener('change', function () {
    renderRooms(this.value, document.getElementById('roomSearch').value);
  });

  // ====== Render Messages Table ======

  function renderMessages(filterRoom, filterStatus, searchTerm) {
    var tbody = document.getElementById('msgTableBody');
    var filtered = messages.filter(function (m) {
      if (filterRoom && filterRoom !== 'all') {
        var roomMap = { main: '#主城大厅', villa: '#望海别墅', market: '#世界广场' };
        if (m.room !== roomMap[filterRoom]) return false;
      }
      if (filterStatus && filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (searchTerm) {
        if (m.content.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1 &&
            m.sender.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var statusTag = { pending: 'warning', passed: 'success', flagged: 'danger', blocked: 'default' };
    var statusText = { pending: '待审核', passed: '已通过', flagged: '已标记', blocked: '已屏蔽' };

    // Count pending for badge
    var pendingCount = messages.filter(function (m) { return m.status === 'pending' || m.status === 'flagged'; }).length;
    if (msgAuditBadge) {
      msgAuditBadge.textContent = pendingCount;
      msgAuditBadge.style.display = pendingCount > 0 ? '' : 'none';
    }

    tbody.innerHTML = filtered.map(function (m) {
      return '<tr data-msg-sender="' + m.sender + '">' +
        '<td style="font-family:var(--ds-font-mono);font-size:12px;color:var(--ds-text-secondary);">' + m.time + '</td>' +
        '<td><strong>' + m.sender + '</strong></td>' +
        '<td>' + m.room + '</td>' +
        '<td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;">' + m.content + '</td>' +
        '<td><span class="ds-tag ' + (statusTag[m.status] || 'default') + '">' + (statusText[m.status] || m.status) + '</span></td>' +
        '<td>' +
          '<div class="ds-btn-group">' +
            '<button class="ds-btn ds-btn-outline ds-btn-xs view-context">上下文</button>' +
            (m.status === 'pending' || m.status === 'flagged'
              ? '<button class="ds-btn ds-btn-primary ds-btn-xs mark-pass">通过</button>' +
                '<button class="ds-btn ds-btn-danger-text ds-btn-xs mark-block">屏蔽</button>'
              : '') +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    // Row click → detail
    tbody.querySelectorAll('tr').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        var sender = tr.dataset.msgSender;
        var msg = messages.find(function (m) { return m.sender === sender; });
        if (!msg) return;

        tbody.querySelectorAll('tr.selected').forEach(function (r) { r.classList.remove('selected'); });
        tr.classList.add('selected');

        openDetail(
          '消息详情',
          '<div class="ds-detail-field"><div class="ds-detail-label">时间</div><div class="ds-detail-value">' + msg.time + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">发送者</div><div class="ds-detail-value">' + msg.sender + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">房间</div><div class="ds-detail-value">' + msg.room + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">消息内容</div><div class="ds-detail-value">' + msg.content + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">审核状态</div><div class="ds-detail-value"><span class="ds-tag ' + (statusTag[msg.status] || 'default') + '">' + (statusText[msg.status] || msg.status) + '</span></div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">上下文消息</div><div class="ds-detail-value" style="background:var(--ds-bg);padding:10px;border-radius:var(--ds-radius);font-size:12px;color:var(--ds-text-secondary);">' +
            '<div style="margin-bottom:4px;"><strong>14:34:18</strong> zhanglaosan: 今天的散文写得不错</div>' +
            '<div style="margin-bottom:4px;color:var(--ds-text);"><strong>14:35:22</strong> ' + msg.sender + ': ' + msg.content + '</div>' +
            '<div><strong>14:35:30</strong> limei: 同意楼上</div>' +
          '</div></div>',
          '<button class="ds-btn ds-btn-outline ds-btn-sm">复制消息ID</button>' +
          (msg.status === 'pending' || msg.status === 'flagged'
            ? '<button class="ds-btn ds-btn-primary ds-btn-sm">标记已处理</button>'
            : '')
        );
      });
    });

    // Button handlers
    tbody.querySelectorAll('.mark-pass').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var sender = btn.closest('tr').dataset.msgSender;
        var msg = messages.find(function (m) { return m.sender === sender; });
        if (msg) msg.status = 'passed';
        renderMessages(
          document.getElementById('msgRoomFilter').value,
          document.getElementById('msgStatusFilter').value,
          document.getElementById('msgSearch').value
        );
      });
    });
    tbody.querySelectorAll('.mark-block').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var sender = btn.closest('tr').dataset.msgSender;
        var msg = messages.find(function (m) { return m.sender === sender; });
        if (msg) msg.status = 'blocked';
        renderMessages(
          document.getElementById('msgRoomFilter').value,
          document.getElementById('msgStatusFilter').value,
          document.getElementById('msgSearch').value
        );
      });
    });
    tbody.querySelectorAll('.view-context').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var sender = btn.closest('tr').dataset.msgSender;
        var msg = messages.find(function (m) { return m.sender === sender; });
        if (!msg) return;
        openDetail(
          '消息上下文: ' + msg.sender,
          '<div class="ds-detail-field"><div class="ds-detail-label">房间</div><div class="ds-detail-value">' + msg.room + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">上下文消息</div><div class="ds-detail-value" style="background:var(--ds-bg);padding:10px;border-radius:var(--ds-radius);font-size:12px;color:var(--ds-text-secondary);">' +
            '<div style="margin-bottom:4px;"><strong>14:34:18</strong> zhanglaosan: 今天的散文写得不错</div>' +
            '<div style="margin-bottom:4px;color:var(--ds-text);"><strong>14:35:22</strong> ' + msg.sender + ': ' + msg.content + '</div>' +
            '<div style="margin-bottom:4px;"><strong>14:35:30</strong> limei: 同意楼上</div>' +
            '<div><strong>14:36:01</strong> wangdana: +1</div>' +
          '</div></div>',
          '<button class="ds-btn ds-btn-primary ds-btn-sm">标记已处理</button>'
        );
      });
    });
  }

  document.getElementById('msgSearch').addEventListener('input', function () {
    renderMessages(
      document.getElementById('msgRoomFilter').value,
      document.getElementById('msgStatusFilter').value,
      this.value
    );
  });
  document.getElementById('msgRoomFilter').addEventListener('change', function () {
    renderMessages(this.value, document.getElementById('msgStatusFilter').value, document.getElementById('msgSearch').value);
  });
  document.getElementById('msgStatusFilter').addEventListener('change', function () {
    renderMessages(document.getElementById('msgRoomFilter').value, this.value, document.getElementById('msgSearch').value);
  });

  // ====== Render Invite Codes ======

  function renderInvites() {
    var tbody = document.getElementById('inviteTableBody');
    var statusTag = { active: 'success', expired: 'default' };
    var statusText = { active: '有效', expired: '已过期' };

    tbody.innerHTML = inviteCodes.map(function (ic) {
      return '<tr>' +
        '<td><span style="font-family:var(--ds-font-mono);font-size:12px;">' + ic.code + '</span></td>' +
        '<td>' + ic.room + '</td>' +
        '<td>' + ic.maxUses + '</td>' +
        '<td>' + ic.used + '</td>' +
        '<td>' + ic.expires + '</td>' +
        '<td>' + ic.creator + '</td>' +
        '<td><span class="ds-tag ' + (statusTag[ic.status] || 'default') + '">' + (statusText[ic.status] || ic.status) + '</span></td>' +
        '<td>' +
          '<div class="ds-btn-group">' +
            '<button class="ds-btn ds-btn-outline ds-btn-xs">复制</button>' +
            (ic.status === 'active'
              ? '<button class="ds-btn ds-btn-danger-text ds-btn-xs">作废</button>'
              : '') +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  // ====== Render Logs ======

  function renderLogs(filterLevel, filterType, searchTerm) {
    var tbody = document.getElementById('logTableBody');
    var filtered = logs.filter(function (l) {
      if (filterLevel && filterLevel !== 'all' && l.level !== filterLevel) return false;
      if (filterType && filterType !== 'all' && l.type !== filterType) return false;
      if (searchTerm) {
        if (l.desc.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1 &&
            l.source.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var typeText = { connection: '连接失败', login: '登录失败', message: '消息失败', ai: 'AI 异常' };

    tbody.innerHTML = filtered.map(function (l) {
      return '<tr>' +
        '<td style="font-family:var(--ds-font-mono);font-size:12px;color:var(--ds-text-secondary);">' + l.time + '</td>' +
        '<td><span class="ds-log-level ' + l.level + '">' + (l.level === 'error' ? '错误' : l.level === 'warn' ? '警告' : '信息') + '</span></td>' +
        '<td>' + (typeText[l.type] || l.type) + '</td>' +
        '<td>' + l.desc + '</td>' +
        '<td style="color:var(--ds-text-secondary);">' + l.source + '</td>' +
      '</tr>';
    }).join('');

    // Row click → detail
    tbody.querySelectorAll('tr').forEach(function (tr, idx) {
      tr.addEventListener('click', function () {
        var log = filtered[idx];
        if (!log) return;

        tbody.querySelectorAll('tr.selected').forEach(function (r) { r.classList.remove('selected'); });
        tr.classList.add('selected');

        openDetail(
          '日志详情',
          '<div class="ds-detail-field"><div class="ds-detail-label">时间</div><div class="ds-detail-value" style="font-family:var(--ds-font-mono);">' + log.time + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">级别</div><div class="ds-detail-value"><span class="ds-log-level ' + log.level + '">' + (log.level === 'error' ? '错误' : log.level === 'warn' ? '警告' : '信息') + '</span></div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">类型</div><div class="ds-detail-value">' + (typeText[log.type] || log.type) + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">描述</div><div class="ds-detail-value">' + log.desc + '</div></div>' +
          '<div class="ds-detail-field"><div class="ds-detail-label">来源模块</div><div class="ds-detail-value">' + log.source + '</div></div>',
          '<button class="ds-btn ds-btn-outline ds-btn-sm">标记已处理</button><button class="ds-btn ds-btn-outline ds-btn-sm">查看相关日志</button>'
        );
      });
    });
  }

  document.getElementById('logSearch').addEventListener('input', function () {
    renderLogs(
      document.getElementById('logLevelFilter').value,
      document.getElementById('logTypeFilter').value,
      this.value
    );
  });
  document.getElementById('logLevelFilter').addEventListener('change', function () {
    renderLogs(this.value, document.getElementById('logTypeFilter').value, document.getElementById('logSearch').value);
  });
  document.getElementById('logTypeFilter').addEventListener('change', function () {
    renderLogs(document.getElementById('logLevelFilter').value, this.value, document.getElementById('logSearch').value);
  });

  // ====== Dashboard live time ======
  function updateDashboardTime() {
    if (dashboardTime) {
      var now = new Date();
      dashboardTime.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  updateDashboardTime();
  setInterval(updateDashboardTime, 30000);

  // Simulate status changes
  setInterval(function () {
    var onlineCount = document.getElementById('dsOnlineCount');
    if (onlineCount) {
      var count = 140 + Math.floor(Math.random() * 10);
      onlineCount.textContent = '在线 ' + count + ' 人';
    }
  }, 15000);

  // ====== Initial Render ======
  renderResidents('all', 'all', '');
  renderRooms('all', '');
  renderMessages('all', 'all', '');
  renderInvites();
  renderLogs('all', 'all', '');

  // ====== Keyboard shortcuts ======
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDetail();
    }
    // Ctrl+B toggle sidebar
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      sidebarToggle.click();
    }
  });

  console.log('龙虾聊天 · 管理后台候选方案已就绪');
  console.log('模块: 仪表盘 | 居民管理 | 会话与房间 | 消息审核 | 权限与邀请 | 系统配置 | 日志与告警');
  console.log('快捷键: Esc 关闭详情 | Ctrl+B 切换侧栏');
})();
