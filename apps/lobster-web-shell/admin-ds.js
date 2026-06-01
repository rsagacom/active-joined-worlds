/* ============================================================
   admin-ds.js — AJW聊天 正式管理后台交互脚本
   安全规则：所有数据通过 textContent 写入，不使用 innerHTML 拼接。
   Mock 数据来自 admin-ds-data.js（window.__ADMIN_DS_DATA__）。
   ============================================================ */

(function () {
  'use strict';

  var _debugParam = (new URLSearchParams(window.location.search)).get('debug');
  var debugEnabled = _debugParam === '1' || _debugParam === 'true';

  // ====== DOM refs ======
  var sidebar = document.getElementById('dsSidebar');
  var sidebarToggle = document.getElementById('dsSidebarToggle');
  var sidebarOverlay = document.getElementById('dsSidebarOverlay');
  var detailPanel = document.getElementById('dsDetailPanel');
  var detailTitle = document.getElementById('dsDetailTitle');
  var detailBody = document.getElementById('dsDetailBody');
  var detailActions = document.getElementById('dsDetailActions');
  var detailClose = document.getElementById('dsDetailClose');
  var dashboardTime = document.getElementById('dashboardTime');
  var msgAuditBadge = document.getElementById('msgAuditBadge');
  var statGateway = document.getElementById('statGateway');
  var statGatewaySub = document.getElementById('statGatewaySub');
  var statOnlineResidents = document.getElementById('statOnlineResidents');
  var statOnlineSub = document.getElementById('statOnlineSub');
  var statTodayMessages = document.getElementById('statTodayMessages');
  var statMessageSub = document.getElementById('statMessageSub');
  var statPendingAlerts = document.getElementById('statPendingAlerts');
  var statAlertSub = document.getElementById('statAlertSub');
  var topbarOnlineCount = document.getElementById('dsOnlineCount');
  var topbarAlertCount = document.getElementById('dsAlertCount');
  var gatewayEndpoint = document.getElementById('dsGatewayEndpoint');
  var gatewayConnection = document.getElementById('dsGatewayConnection');
  var gatewayResident = document.getElementById('dsGatewayResident');
  var gatewayRoomCount = document.getElementById('dsGatewayRoomCount');
  var gatewayMessageCount = document.getElementById('dsGatewayMessageCount');
  var gatewayLastSync = document.getElementById('dsGatewayLastSync');

  // ====== Data ======
  var DS = window.__ADMIN_DS_DATA__;
  var residents = DS.residents;
  var rooms = DS.rooms;
  var messages = DS.messages;
  var inviteCodes = DS.inviteCodes;
  var logs = DS.logs;
  var L = DS.labels;
  var gatewayUrl = resolveGatewayUrl();
  var gatewayStatus = document.getElementById('dsGatewayStatus');

  var activeModule = 'dashboard';
  var sidebarExpanded = true;

  // ====== DOM Helpers ======

  /* 创建元素：el('div', {class:'foo', data:{bar:'1'}, style:'color:red'}, child1, child2, ...)
     - children 可以是字符串（自动创建 textNode）或 DOM 节点
     - 不支持内联事件属性，事件通过 addEventListener 绑定 */
  function el(tag, attrs) {
    var element = document.createElement(tag);
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var val = attrs[key];
        if (key === 'class') { element.className = val; }
        else if (key === 'data') {
          var dk = Object.keys(val);
          for (var j = 0; j < dk.length; j++) { element.dataset[dk[j]] = val[dk[j]]; }
        }
        else if (key === 'style' && typeof val === 'string') { element.style.cssText = val; }
        else { element.setAttribute(key, val); }
      }
    }
    for (var k = 2; k < arguments.length; k++) {
      var child = arguments[k];
      if (child == null) continue;
      if (typeof child === 'string') { element.appendChild(document.createTextNode(child)); }
      else { element.appendChild(child); }
    }
    return element;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function safeLocalStorageGet(key) {
    try { return window.localStorage ? window.localStorage.getItem(key) : null; }
    catch (_) { return null; }
  }

  function safeLocalStorageSet(key, value) {
    try { if (window.localStorage) window.localStorage.setItem(key, value); }
    catch (_) { /* ignore storage failures */ }
  }

  function resolveGatewayUrl() {
    var params = new URLSearchParams(window.location.search);
    var query = params.get('gateway');
    if (query && query.trim()) {
      var normalized = query.trim().replace(/\/+$/, '');
      safeLocalStorageSet('lobster-gateway-url', normalized);
      return normalized;
    }
    var remembered = safeLocalStorageGet('lobster-gateway-url');
    return remembered ? remembered.replace(/\/+$/, '') : null;
  }

  function currentGatewayIdentity() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('identity') || safeLocalStorageGet('lobster-identity') || 'rsaga').trim() || 'rsaga';
  }

  async function fetchGatewayJson(path) {
    if (!gatewayUrl) return null;
    var response = await fetch(gatewayUrl + path, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    return response.json();
  }

  async function fetchGatewayJsonPost(path, body) {
    if (!gatewayUrl) return { error: 'Gateway 未连接' };
    try {
      var response = await fetch(gatewayUrl + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      });
      var data = await response.json();
      return { ok: response.ok, status: response.status, data: data };
    } catch (err) {
      return { error: err.message || '请求失败' };
    }
  }

  async function moderateMessage(messageId, conversationId, action) {
    if (!messageId || !conversationId) {
      return { error: '缺少 message_id 或 conversation_id' };
    }
    return fetchGatewayJsonPost('/v1/admin/messages/moderate', {
      message_id: messageId,
      conversation_id: conversationId,
      action: action
    });
  }

  function setGatewayStatus(text, className) {
    if (!gatewayStatus) return;
    gatewayStatus.textContent = text;
    gatewayStatus.className = 'ds-status-dot ' + className;
  }

  function refreshCurrentMessageView() {
    renderMessages(
      document.getElementById('msgRoomFilter').value,
      document.getElementById('msgStatusFilter').value,
      document.getElementById('msgSearch').value
    );
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('zh-CN');
  }

  function renderEmptyRow(tbody, colspan, message) {
    clear(tbody);
    var tr = el('tr');
    var td = el('td', { attrs: { colspan: String(colspan) }, style: 'text-align:center;padding:2rem;color:var(--ds-text-secondary);' });
    td.textContent = message;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function setSectionLoading(sectionId, isLoading) {
    var el = document.getElementById(sectionId);
    if (!el) return;
    if (isLoading) {
      el.dataset.loading = 'true';
      el.style.opacity = '0.6';
    } else {
      delete el.dataset.loading;
      el.style.opacity = '';
    }
  }

  // ---- 前端分页 ----
  var PAGE_SIZE = 25;
  var pageState = { residents: 1, rooms: 1, messages: 1, logs: 1, permissions: 1 };

  function paginateArray(arr, page) {
    var start = (page - 1) * PAGE_SIZE;
    return arr.slice(start, start + PAGE_SIZE);
  }

  function renderPagination(moduleName, totalItems, onPageChange) {
    var currentPage = pageState[moduleName] || 1;
    var totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) { currentPage = totalPages; pageState[moduleName] = currentPage; }
    var module = document.getElementById('mod-' + moduleName);
    if (!module) return;
    var paginationEl = module.querySelector('.ds-pagination');
    if (!paginationEl) return;

    // 更新信息行
    var infoEl = paginationEl.querySelector('.ds-pagination-info');
    if (infoEl) {
      clear(infoEl);
      infoEl.appendChild(document.createTextNode('共 '));
      var strongCount = el('strong');
      strongCount.textContent = String(totalItems);
      infoEl.appendChild(strongCount);
      infoEl.appendChild(document.createTextNode(' 条' + (totalPages > 1 ? '，第 ' + currentPage + '/' + totalPages + ' 页' : '') + '（前端分页）'));
    }

    // 更新按钮
    var btnsEl = paginationEl.querySelector('.ds-pagination-btns');
    if (!btnsEl) return;
    clear(btnsEl);

    var addPageBtn = function (label, targetPage, isDisabled, isActive) {
      var btn = el('button', { class: 'ds-page-btn' + (isActive ? ' active' : '') });
      btn.textContent = String(label);
      if (isDisabled) btn.disabled = true;
      else btn.addEventListener('click', function () { pageState[moduleName] = targetPage; onPageChange(targetPage); });
      btnsEl.appendChild(btn);
    };

    addPageBtn('‹', currentPage - 1, currentPage <= 1, false);
    for (var p = 1; p <= totalPages; p++) {
      addPageBtn(p, p, false, p === currentPage);
    }
    addPageBtn('›', currentPage + 1, currentPage >= totalPages, false);
  }

  function countPendingMessages() {
    var count = 0;
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].status === 'pending' || messages[i].status === 'flagged' || messages[i].status === 'blocked') count++;
    }
    return count;
  }

  function countWarningLogs() {
    var count = 0;
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].level === 'error' || logs[i].level === 'warn') count++;
    }
    return count;
  }

  function updateGatewayConnectionTag(text, tagClass) {
    if (!gatewayConnection) return;
    gatewayConnection.textContent = text;
    gatewayConnection.className = 'ds-tag ' + tagClass;
  }

  function updateDashboardSummary(source) {
    var hasGateway = source === 'gateway';
    var onlineResidents = residents.filter(function (resident) { return resident.status === 'online'; }).length;
    var pendingMessages = countPendingMessages();
    var warningLogs = countWarningLogs();
    var alertTotal = pendingMessages + warningLogs;
    var currentIdentity = currentGatewayIdentity();
    var syncLabel = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (statGateway) statGateway.textContent = hasGateway ? '在线' : '本地';
    if (statGatewaySub) statGatewaySub.textContent = hasGateway ? gatewayUrl + ' · 当前居民 ' + currentIdentity : '本地预览数据 · 未连接 Gateway';
    if (statOnlineResidents) statOnlineResidents.textContent = formatNumber(onlineResidents);
    if (statOnlineSub) statOnlineSub.textContent = '居民总数 ' + formatNumber(residents.length);
    if (statTodayMessages) statTodayMessages.textContent = formatNumber(messages.length);
    if (statMessageSub) statMessageSub.textContent = '可见会话 ' + formatNumber(rooms.length);
    if (statPendingAlerts) statPendingAlerts.textContent = formatNumber(alertTotal);
    if (statAlertSub) statAlertSub.textContent = '消息审核 ' + formatNumber(pendingMessages) + ' · 日志告警 ' + formatNumber(warningLogs);
    if (topbarOnlineCount) topbarOnlineCount.textContent = '在线 ' + formatNumber(onlineResidents) + ' 人';
    if (topbarAlertCount) topbarAlertCount.textContent = '告警 ' + formatNumber(alertTotal);
    if (gatewayEndpoint) gatewayEndpoint.textContent = gatewayUrl || '未连接';
    if (gatewayResident) gatewayResident.textContent = currentIdentity;
    if (gatewayRoomCount) gatewayRoomCount.textContent = formatNumber(rooms.length);
    if (gatewayMessageCount) gatewayMessageCount.textContent = formatNumber(messages.length);
    if (gatewayLastSync) gatewayLastSync.textContent = syncLabel + (hasGateway ? ' · Gateway' : ' · 本地');
    updateGatewayConnectionTag(hasGateway ? '已连接' : '本地预览', hasGateway ? 'success' : 'default');
  }

  function roleFromGatewayRoles(roles) {
    if (!Array.isArray(roles)) return 'resident';
    if (roles.indexOf('admin') !== -1 || roles.indexOf('steward') !== -1 || roles.indexOf('owner') !== -1) return 'admin';
    if (roles.indexOf('guest') !== -1) return 'guest';
    return 'resident';
  }

  function normalizeGatewayResidents(payload) {
    if (!Array.isArray(payload)) return [];
    return payload.map(function (item, index) {
      var id = String(item.resident_id || item.id || 'resident-' + (index + 1));
      var roles = Array.isArray(item.roles) ? item.roles : [];
      var cityCount = Array.isArray(item.active_cities) ? item.active_cities.length : 0;
      var online = item.online === true;
      var banned = item.is_banned === true;
      var lastSeenMs = item.last_seen_at_ms;
      var lastSeenText = '网关同步';
      if (lastSeenMs) {
        var secondsAgo = Math.floor((Date.now() - lastSeenMs) / 1000);
        if (secondsAgo < 60) lastSeenText = '刚刚';
        else if (secondsAgo < 3600) lastSeenText = Math.floor(secondsAgo / 60) + ' 分钟前';
        else if (secondsAgo < 86400) lastSeenText = Math.floor(secondsAgo / 3600) + ' 小时前';
        else lastSeenText = Math.floor(secondsAgo / 86400) + ' 天前';
      }
      return {
        id: id,
        nick: id,
        email: (item.avatar_id || id) + '@resident.local',
        role: roleFromGatewayRoles(roles),
        status: banned ? 'banned' : (online ? 'online' : 'offline'),
        lastSeen: lastSeenText,
        msgCount: cityCount
      };
    });
  }

  function roomTypeFromGateway(room) {
    if (room.kind === 'direct' || room.scope === 'private') return 'private';
    if (room.scope === 'world' || String(room.conversation_id || room.id || '').indexOf('room:world:') === 0) return 'world';
    return 'group';
  }

  function normalizeGatewayRooms(shellState) {
    var source = shellState?.conversation_shell?.conversations || shellState?.rooms || [];
    if (!Array.isArray(source)) return [];
    return source.map(function (room, index) {
      var id = String(room.conversation_id || room.id || 'room-' + (index + 1));
      var msgs = Array.isArray(room.messages) ? room.messages : [];
      return {
        id: id,
        name: room.title || room.thread_headline || id,
        type: roomTypeFromGateway(room),
        members: Number(room.member_count || 0),
        todayMsg: msgs.length,
        unread: Number(room.unread_count || 0),
        creator: room.participant_label || room.self_label || room.peer_label || 'gateway',
        created: room.activity_time_label || room.last_activity_label || '网关同步',
        frozen: Boolean(room.frozen)
      };
    });
  }

  function normalizeGatewayMessages(shellState) {
    var source = shellState?.conversation_shell?.conversations || shellState?.rooms || [];
    if (!Array.isArray(source)) return [];
    var out = [];
    for (var i = 0; i < source.length; i++) {
      var room = source[i];
      var roomId = String(room.conversation_id || room.id || '');
      var roomTitle = room.title || room.thread_headline || room.conversation_id || room.id || '网关会话';
      var msgs = Array.isArray(room.messages) ? room.messages : [];
      for (var j = 0; j < msgs.length; j++) {
        var msg = msgs[j];
        out.push({
          message_id: msg.message_id || '',
          conversation_id: roomId,
          time: msg.timestamp_label || '网关同步',
          sender: msg.sender || 'unknown',
          room: '#' + roomTitle,
          content: msg.is_recalled ? '消息已撤回' : (msg.text || ''),
          status: msg.delivery_status === 'failed' ? 'flagged' : 'passed'
        });
      }
    }
    return out.slice(-80).reverse();
  }

  async function loadGatewayAdminData() {
    if (!gatewayUrl) {
      setGatewayStatus('Gateway 未连接', 'warning');
      updateDashboardSummary('local');
      return;
    }
    setGatewayStatus('Gateway 同步中', 'info');
    setSectionLoading('mod-residents', true);
    setSectionLoading('mod-rooms', true);
    setSectionLoading('mod-messages', true);
    var fetchFailed = false;
    try {
      var identity = encodeURIComponent(currentGatewayIdentity());
      var results = await Promise.allSettled([
        fetchGatewayJson('/v1/residents'),
        fetchGatewayJson('/v1/shell/state?resident_id=' + identity)
      ]);
      var residentPayload = results[0].status === 'fulfilled' ? results[0].value : null;
      var shellPayload = results[1].status === 'fulfilled' ? results[1].value : null;
      if (results[0].status === 'rejected' || results[1].status === 'rejected') fetchFailed = true;
      var nextResidents = normalizeGatewayResidents(residentPayload);
      var nextRooms = normalizeGatewayRooms(shellPayload || {});
      var nextMessages = normalizeGatewayMessages(shellPayload || {});
      if (nextResidents.length) residents = nextResidents;
      if (nextRooms.length) rooms = nextRooms;
      if (nextMessages.length) messages = nextMessages;
      renderResidents('all', 'all', '');
      renderRooms('all', '');
      renderMessages('all', 'all', '');
      updateDashboardSummary(fetchFailed ? 'local' : 'gateway');
      setGatewayStatus(fetchFailed ? 'Gateway 部分读取失败' : 'Gateway 在线', fetchFailed ? 'warning' : 'online');
    } catch (error) {
      console.warn('admin-ds gateway sync failed', error);
      updateDashboardSummary('local');
      setGatewayStatus('Gateway 读取失败', 'warning');
    } finally {
      setSectionLoading('mod-residents', false);
      setSectionLoading('mod-rooms', false);
      setSectionLoading('mod-messages', false);
    }
  }

  // ====== Module Switching ======

  function switchModule(moduleName) {
    activeModule = moduleName;
    var items = document.querySelectorAll('.ds-nav-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].dataset.module === moduleName);
    }
    var modules = document.querySelectorAll('.ds-module');
    for (var j = 0; j < modules.length; j++) {
      modules[j].classList.remove('active');
    }
    var target = document.getElementById('mod-' + moduleName);
    if (target) target.classList.add('active');
    closeDetail();
    if (window.innerWidth <= 768) { collapseSidebar(); }
    if (moduleName === 'sysconfig') { loadSysConfig(); }
  }

  var navItems = document.querySelectorAll('.ds-nav-item');
  for (var ni = 0; ni < navItems.length; ni++) {
    navItems[ni].addEventListener('click', function () {
      switchModule(this.dataset.module);
    });
  }

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
      if (sidebarExpanded) { collapseSidebar(); }
      else { expandSidebar(); sidebarOverlay.classList.add('show'); }
    } else {
      if (sidebarExpanded) { collapseSidebar(); }
      else { expandSidebar(); }
    }
  });

  sidebarOverlay.addEventListener('click', function () { collapseSidebar(); });

  function handleResize() {
    if (window.innerWidth <= 768) {
      if (sidebarExpanded && !sidebarOverlay.classList.contains('show')) { collapseSidebar(); }
    }
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // ====== Detail Panel ======

  /* openDetail(title, buildBody, buildActions)
     - buildBody(container): 接收 detailBody 容器，往里面 append DOM
     - buildActions(container): 接收 detailActions 容器，往里面 append DOM（可选） */
  function openDetail(title, buildBody, buildActions) {
    detailTitle.textContent = title;
    clear(detailBody);
    if (buildBody) buildBody(detailBody);
    detailPanel.classList.remove('hidden');
    clear(detailActions);
    if (buildActions) {
      buildActions(detailActions);
      detailActions.style.display = 'flex';
    } else {
      detailActions.style.display = 'none';
    }
  }

  function closeDetail() {
    detailPanel.classList.add('hidden');
    var selected = document.querySelectorAll('.ds-table tbody tr.selected');
    for (var s = 0; s < selected.length; s++) { selected[s].classList.remove('selected'); }
  }

  detailClose.addEventListener('click', closeDetail);

  // ====== Detail field helper ======

  function detailField(label, valueEl) {
    var field = el('div', { class: 'ds-detail-field' });
    var lbl = el('div', { class: 'ds-detail-label' }, label);
    var val = el('div', { class: 'ds-detail-value' });
    if (typeof valueEl === 'string') { val.textContent = valueEl; }
    else { val.appendChild(valueEl); }
    field.appendChild(lbl);
    field.appendChild(val);
    return field;
  }

  function detailFieldStyled(label, valueStr, styleCss) {
    var field = el('div', { class: 'ds-detail-field' });
    field.appendChild(el('div', { class: 'ds-detail-label' }, label));
    var val = el('div', { class: 'ds-detail-value', style: styleCss }, valueStr);
    field.appendChild(val);
    return field;
  }

  // ====== Status / Tag helpers ======

  function makeTag(text, tagClass) {
    return el('span', { class: 'ds-tag ' + tagClass }, text);
  }

  function makeStatusDot(text, statusClass) {
    return el('span', { class: 'ds-status-indicator ' + statusClass }, text);
  }

  function makeBtn(text, btnClass) {
    return el('button', { class: 'ds-btn ' + btnClass, type: 'button' }, text);
  }

  function makeBtnGroup() {
    return el('div', { class: 'ds-btn-group' });
  }

  function ensureAdminNotice() {
    var notice = document.getElementById('dsAdminNotice');
    if (notice) return notice;
    notice = el('div', { id: 'dsAdminNotice', class: 'ds-admin-notice', role: 'status', 'aria-live': 'polite' });
    var content = document.getElementById('dsContent');
    if (content) content.insertBefore(notice, content.firstChild);
    return notice;
  }

  function showAdminNotice(text, tone) {
    var notice = ensureAdminNotice();
    notice.textContent = text;
    notice.className = 'ds-admin-notice show ' + (tone || 'info');
    window.clearTimeout(showAdminNotice._timer);
    showAdminNotice._timer = window.setTimeout(function () {
      notice.classList.remove('show');
    }, 2600);
  }

  function markUnavailableButton(button, reason) {
    if (!button) return button;
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('title', reason);
    button.dataset.disabledReason = reason;
    return button;
  }

  function copyText(text, successMessage) {
    var value = String(text || '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        showAdminNotice(successMessage || '已复制', 'success');
      }).catch(function () {
        fallbackCopyText(value, successMessage);
      });
      return;
    }
    fallbackCopyText(value, successMessage);
  }

  function fallbackCopyText(text, successMessage) {
    var input = el('textarea', { style: 'position:fixed;left:-9999px;top:-9999px;' }, text);
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      showAdminNotice(successMessage || '已复制', 'success');
    } catch (_) {
      showAdminNotice('复制失败，请手动复制', 'warning');
    }
    document.body.removeChild(input);
  }

  function csvEscape(value) {
    var text = String(value == null ? '' : value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function downloadCsv(filename, columns, rows) {
    var headerCells = [];
    for (var h = 0; h < columns.length; h++) {
      headerCells.push(csvEscape(columns[h].label));
    }
    var bodyLines = [];
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var cells = [];
      for (var c = 0; c < columns.length; c++) {
        var col = columns[c];
        cells.push(csvEscape(typeof col.get === 'function' ? col.get(row) : row[col.key]));
      }
      bodyLines.push(cells.join(','));
    }
    var header = headerCells.join(',');
    var body = bodyLines.join('\n');
    var blob = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = el('a', { href: url, download: filename });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    showAdminNotice('已导出 ' + rows.length + ' 条数据', 'success');
  }

  function filteredResidents() {
    var status = document.getElementById('residentStatusFilter').value;
    var role = document.getElementById('residentRoleFilter').value;
    var searchTerm = document.getElementById('residentSearch').value.trim().toLowerCase();
    return residents.filter(function (r) {
      if (status !== 'all' && r.status !== status) return false;
      if (role !== 'all' && r.role !== role) return false;
      if (!searchTerm) return true;
      return r.id.toLowerCase().indexOf(searchTerm) !== -1 ||
        r.nick.toLowerCase().indexOf(searchTerm) !== -1 ||
        r.email.toLowerCase().indexOf(searchTerm) !== -1;
    });
  }

  function filteredLogs() {
    var level = document.getElementById('logLevelFilter').value;
    var type = document.getElementById('logTypeFilter').value;
    var searchTerm = document.getElementById('logSearch').value.trim().toLowerCase();
    return logs.filter(function (item) {
      if (level !== 'all' && item.level !== level) return false;
      if (type !== 'all' && item.type !== type) return false;
      if (!searchTerm) return true;
      return item.desc.toLowerCase().indexOf(searchTerm) !== -1 ||
        item.source.toLowerCase().indexOf(searchTerm) !== -1;
    });
  }

  function openResidentSessions(resident) {
    switchModule('rooms');
    window.setTimeout(function () {
      var searchInput = document.getElementById('roomSearch');
      if (searchInput) {
        searchInput.value = resident.nick;
        renderRooms(document.getElementById('roomTypeFilter').value, resident.nick);
        showAdminNotice('已筛选 ' + resident.nick + ' 相关会话', 'info');
      }
    }, 80);
  }

  function makeLogLevel(text, level) {
    return el('span', { class: 'ds-log-level ' + level }, text);
  }

  function makeTd(text, styleCss) {
    var td = el('td');
    if (styleCss) td.style.cssText = styleCss;
    if (typeof text === 'string') { td.textContent = text; }
    else { td.appendChild(text); }
    return td;
  }

  function makeTdMono(text) {
    var span = el('span', { style: 'font-family:var(--ds-font-mono);font-size:12px;' }, text);
    return makeTd(span);
  }

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

    clear(tbody);

    if (!filtered.length) { renderEmptyRow(tbody, 8, searchTerm ? '没有匹配的居民' : '暂无居民数据'); renderPagination('residents', 0, function(p){ renderResidents(filterStatus, filterRole, searchTerm); }); return; }

    var residentPage = paginateArray(filtered, pageState.residents || 1);
    for (var i = 0; i < residentPage.length; i++) {
      (function (resident) {
        var tr = el('tr', { data: { residentId: resident.id } });

        tr.appendChild(makeTdMono(resident.id));

        var tdNick = el('td');
        tdNick.appendChild(el('strong', null, resident.nick));
        tr.appendChild(tdNick);

        tr.appendChild(makeTd(resident.email, 'color:var(--ds-text-secondary);'));

        var tdRole = el('td');
        tdRole.appendChild(makeTag(L.roleText[resident.role] || resident.role, L.roleTag[resident.role] || 'default'));
        tr.appendChild(tdRole);

        var tdStatus = el('td');
        var sc = L.statusClass[resident.status] || 'offline';
        var st = L.statusText[resident.status] || resident.status;
        tdStatus.appendChild(makeStatusDot(st, sc));
        tr.appendChild(tdStatus);

        tr.appendChild(makeTd(resident.lastSeen, 'color:var(--ds-text-secondary);'));

        tr.appendChild(makeTd(resident.msgCount.toLocaleString()));

        // 操作按钮
        var tdActions = el('td');
        var btnGroup = makeBtnGroup();

        if (resident.status === 'banned') {
          var restoreBtn = makeBtn('恢复', 'ds-btn-outline ds-btn-xs');
          restoreBtn.addEventListener('click', function (e) { e.stopPropagation(); unbanResident(resident.id, restoreBtn); });
          btnGroup.appendChild(restoreBtn);
        } else {
          var banBtn = makeBtn('禁用', 'ds-btn-outline ds-btn-xs');
          banBtn.addEventListener('click', function (e) { e.stopPropagation(); banResident(resident.id, banBtn); });
          btnGroup.appendChild(banBtn);
        }

        var sessionBtn = makeBtn('会话', 'ds-btn-outline ds-btn-xs');
        sessionBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          openResidentSessions(resident);
        });
        btnGroup.appendChild(sessionBtn);

        tdActions.appendChild(btnGroup);
        tr.appendChild(tdActions);

        // 行点击 → 详情
        tr.addEventListener('click', function (e) {
          if (e.target.closest('button')) return;
          var prev = tbody.querySelectorAll('tr.selected');
          for (var p = 0; p < prev.length; p++) { prev[p].classList.remove('selected'); }
          tr.classList.add('selected');

          var sc2 = L.statusClass[resident.status] || 'offline';
          var st2 = L.statusText[resident.status] || resident.status;
          var rt2 = L.roleText[resident.role] || resident.role;

          openDetail(
            '居民: ' + resident.nick,
            function (container) {
              container.appendChild(detailFieldStyled('居民 ID', resident.id, 'font-family:var(--ds-font-mono);'));
              container.appendChild(detailField('昵称', resident.nick));
              container.appendChild(detailField('登录邮箱', resident.email));
              container.appendChild(detailField('角色', rt2));
              container.appendChild(detailField('状态', makeStatusDot(st2, sc2)));
              container.appendChild(detailField('最近在线', resident.lastSeen));
              container.appendChild(detailField('累计消息', resident.msgCount.toLocaleString()));
            },
            function (actions) {
              var viewSessionsBtn = makeBtn('查看会话', 'ds-btn-outline ds-btn-sm');
              viewSessionsBtn.addEventListener('click', function () { openResidentSessions(resident); });
              actions.appendChild(viewSessionsBtn);
              if (resident.status === 'banned') {
                var detailRestore = makeBtn('恢复居民', 'ds-btn-primary ds-btn-sm');
                detailRestore.addEventListener('click', function () { closeDetail(); unbanResident(resident.id, detailRestore); });
                actions.appendChild(detailRestore);
              } else {
                var detailBan = makeBtn('禁用居民', 'ds-btn-danger-text ds-btn-sm');
                detailBan.addEventListener('click', function () { closeDetail(); banResident(resident.id, detailBan); });
                actions.appendChild(detailBan);
              }
            }
          );
        });

        tbody.appendChild(tr);
      })(residentPage[i]);
    }

    renderPagination('residents', filtered.length, function(p) { renderResidents(filterStatus, filterRole, searchTerm); });
  }

  // Resident search/filter bindings
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

    clear(tbody);

    if (!filtered.length) { renderEmptyRow(tbody, 7, searchTerm ? '没有匹配的会话' : '暂无会话数据'); renderPagination('rooms', 0, function(p){ renderRooms(filterType, searchTerm); }); return; }

    var roomPage = paginateArray(filtered, pageState.rooms || 1);
    for (var i = 0; i < roomPage.length; i++) {
      (function (room) {
        var tr = el('tr', { data: { roomId: room.id } });

        tr.appendChild(makeTdMono(room.id));

        var tdName = el('td');
        tdName.appendChild(el('strong', null, room.name));
        tr.appendChild(tdName);

        var tdType = el('td');
        tdType.appendChild(makeTag(L.roomTypeText[room.type] || room.type, L.roomTypeTag[room.type] || 'default'));
        tr.appendChild(tdType);

        tr.appendChild(makeTd(String(room.members)));
        tr.appendChild(makeTd(room.todayMsg.toLocaleString()));
        tr.appendChild(makeTd(String(room.unread)));
        tr.appendChild(makeTd(room.creator));
        tr.appendChild(makeTd(room.created, 'color:var(--ds-text-secondary);'));

        // 行点击 → 详情
        tr.addEventListener('click', function () {
          var prev = tbody.querySelectorAll('tr.selected');
          for (var p = 0; p < prev.length; p++) { prev[p].classList.remove('selected'); }
          tr.classList.add('selected');

          var rtt = L.roomTypeText[room.type] || room.type;

          openDetail(
            '房间: ' + room.name,
            function (container) {
              container.appendChild(detailFieldStyled('房间 ID', room.id, 'font-family:var(--ds-font-mono);'));
              container.appendChild(detailField('房间名', room.name));
              container.appendChild(detailField('类型', rtt));
              container.appendChild(detailField('成员数', room.members + ' 人'));
              container.appendChild(detailField('今日消息', room.todayMsg.toLocaleString() + ' 条'));
              container.appendChild(detailField('未读消息', room.unread + ' 条'));
              container.appendChild(detailField('创建者', room.creator));
              container.appendChild(detailField('创建时间', room.created));
            },
            function (actions) {
              var viewMsgBtn = makeBtn('查看消息', 'ds-btn-outline ds-btn-sm');
              viewMsgBtn.addEventListener('click', function () {
                switchModule('messages');
                var searchInput = document.getElementById('msgSearch');
                if (searchInput) {
                  searchInput.value = room.name;
                  renderMessages('all', 'all', room.name);
                }
                showAdminNotice('已跳转到消息审核，可继续按房间名检索', 'info');
              });
              actions.appendChild(viewMsgBtn);
              var memberBtn = makeBtn('管理成员', 'ds-btn-outline ds-btn-sm');
              memberBtn.addEventListener('click', function () {
                if (!room) return;
                var residentId = prompt('输入居民ID（添加/移除）:');
                if (!residentId) return;
                var action = confirm('确定要切换该居民在本房间的成员状态？\n按确定=添加, 取消=移除') ? 'add' : 'remove';
                memberBtn.disabled = true; memberBtn.textContent = '处理中...';
                fetchGatewayJsonPost('/v1/admin/rooms/members', {room_id: room.id, resident_id: residentId, actor_id: currentIdentity(), action: action}).then(function(r) {
                  memberBtn.disabled = false; memberBtn.textContent = '管理成员';
                  if (r.error) { showAdminNotice('成员操作失败: ' + r.error, 'error'); }
                  else { showAdminNotice('成员 ' + residentId + ' 已' + (action==='add'?'添加至':'移出') + '房间 ' + room.id, 'success'); }
                });
              });
              actions.appendChild(memberBtn);

              if (room.frozen) {
                var unfreezeBtn = makeBtn('解冻房间', 'ds-btn-outline ds-btn-sm');
                unfreezeBtn.style.color = 'var(--ds-success)';
                unfreezeBtn.addEventListener('click', function () { closeDetail(); unfreezeRoom(room.id, unfreezeBtn); });
                actions.appendChild(unfreezeBtn);
              } else {
                var freezeBtn = makeBtn('冻结房间', 'ds-btn-outline ds-btn-sm');
                freezeBtn.style.color = 'var(--ds-danger)';
                freezeBtn.addEventListener('click', function () { closeDetail(); freezeRoom(room.id, freezeBtn); });
                actions.appendChild(freezeBtn);
              }
            }
          );
        });

        tbody.appendChild(tr);
      })(roomPage[i]);
    }

    renderPagination('rooms', filtered.length, function(p) { renderRooms(filterType, searchTerm); });
  }

  document.getElementById('roomSearch').addEventListener('input', function () {
    renderRooms(document.getElementById('roomTypeFilter').value, this.value);
  });
  document.getElementById('roomTypeFilter').addEventListener('change', function () {
    renderRooms(this.value, document.getElementById('roomSearch').value);
  });

  // ====== Render Messages Table ======

  function buildContextMessages(container, currentMsg) {
    var ctxBox = el('div', {
      style: 'background:var(--ds-bg);padding:10px;border-radius:var(--ds-radius);font-size:12px;color:var(--ds-text-secondary);'
    });

    // 从真实 messages 数组提取相邻上下文
    var contextMessages = [];
    var currentIdx = -1;
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].sender === currentMsg.sender && messages[i].content === currentMsg.content && messages[i].room === currentMsg.room) {
        currentIdx = i;
        break;
      }
    }

    if (currentIdx >= 0) {
      // 取同 room 的前 2 条和后 2 条
      var sameRoomMsgs = [];
      for (var j = 0; j < messages.length; j++) {
        if (messages[j].room === currentMsg.room) sameRoomMsgs.push(j);
      }
      var roomPos = sameRoomMsgs.indexOf(currentIdx);
      if (roomPos >= 0) {
        var start = Math.max(0, roomPos - 2);
        var end = Math.min(sameRoomMsgs.length, roomPos + 3);
        for (var k = start; k < end; k++) {
          if (sameRoomMsgs[k] !== currentIdx) {
            contextMessages.push(messages[sameRoomMsgs[k]]);
          }
        }
      }
    }

    if (!contextMessages.length) {
      var emptyNote = el('div', { style: 'text-align:center;padding:8px;color:var(--ds-text-secondary);' });
      emptyNote.textContent = '暂无上下文消息';
      ctxBox.appendChild(emptyNote);
    } else {
      for (var c = 0; c < contextMessages.length; c++) {
        var ctx = contextMessages[c];
        var line = el('div', { style: 'margin-bottom:4px;' });
        var timeStr = ctx.time || '';
        if (timeStr) {
          line.appendChild(el('strong', null, timeStr + ' '));
        }
        line.appendChild(document.createTextNode(ctx.sender + ': ' + ctx.content));
        ctxBox.appendChild(line);
      }
    }

    // 当前消息高亮行
    var currentLine = el('div', { style: 'margin-bottom:4px;color:var(--ds-text);font-weight:bold;' });
    var currentTime = currentMsg.time || '';
    if (currentTime) {
      currentLine.appendChild(el('strong', null, currentTime + ' '));
    }
    currentLine.appendChild(document.createTextNode(currentMsg.sender + ': ' + currentMsg.content));
    ctxBox.appendChild(currentLine);

    return ctxBox;
  }

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
            m.sender.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1 &&
            m.room.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) return false;
      }
      return true;
    });

    // Badge
    var pendingCount = 0;
    for (var pi = 0; pi < messages.length; pi++) {
      if (messages[pi].status === 'pending' || messages[pi].status === 'flagged') pendingCount++;
    }
    if (msgAuditBadge) {
      msgAuditBadge.textContent = String(pendingCount);
      msgAuditBadge.style.display = pendingCount > 0 ? '' : 'none';
    }

    clear(tbody);

    if (!filtered.length) { renderEmptyRow(tbody, 7, '暂无消息数据'); renderPagination('messages', 0, function(p){ renderMessages(filterRoom, filterStatus, searchTerm); }); return; }

    var msgPage = paginateArray(filtered, pageState.messages || 1);
    for (var i = 0; i < msgPage.length; i++) {
      (function (msg) {
        var tr = el('tr', { data: { msgSender: msg.sender } });

        // 时间
        var tdTime = el('td');
        tdTime.style.cssText = 'font-family:var(--ds-font-mono);font-size:12px;color:var(--ds-text-secondary);';
        tdTime.textContent = msg.time;
        tr.appendChild(tdTime);

        // 发送者
        var tdSender = el('td');
        tdSender.appendChild(el('strong', null, msg.sender));
        tr.appendChild(tdSender);

        // 房间
        tr.appendChild(makeTd(msg.room));

        // 消息内容
        var tdContent = el('td');
        tdContent.style.cssText = 'max-width:280px;overflow:hidden;text-overflow:ellipsis;';
        tdContent.textContent = msg.content;
        tr.appendChild(tdContent);

        // 状态标签
        var tdStatus = el('td');
        tdStatus.appendChild(makeTag(L.msgStatusText[msg.status] || msg.status, L.msgStatusTag[msg.status] || 'default'));
        tr.appendChild(tdStatus);

        // 操作按钮
        var tdActions = el('td');
        var btnGroup = makeBtnGroup();

        var ctxBtn = makeBtn('上下文', 'ds-btn-outline ds-btn-xs');
        ctxBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          openDetail(
            '消息上下文: ' + msg.sender,
            function (container) {
              container.appendChild(detailField('房间', msg.room));
              var ctxLabel = el('div', { class: 'ds-detail-label' }, '上下文消息');
              var field2 = el('div', { class: 'ds-detail-field' });
              field2.appendChild(ctxLabel);
              field2.appendChild(buildContextMessages(container, msg));
              container.appendChild(field2);
            },
            function (actions) {
              var handleBtn = makeBtn('标记已处理', 'ds-btn-primary ds-btn-sm');
              handleBtn.addEventListener('click', function (e2) {
                e2.stopPropagation();
                if (handleBtn.disabled) return;
                handleBtn.disabled = true;
                handleBtn.textContent = '...';
                moderateMessage(msg.message_id, msg.conversation_id, 'handled').then(function (result) {
                  if (result.error) {
                    showAdminNotice('操作失败: ' + result.error, 'error');
                    handleBtn.disabled = false;
                    handleBtn.textContent = '标记已处理';
                    return;
                  }
                  if (!result.ok) {
                    var errMsg2 = (result.data && result.data.error) || '请求失败';
                    showAdminNotice('操作失败: ' + errMsg2, 'error');
                    handleBtn.disabled = false;
                    handleBtn.textContent = '标记已处理';
                    return;
                  }
                  msg.status = 'handled';
                  showAdminNotice('消息已标记为已处理', 'success');
                  refreshCurrentMessageView();
                });
              });
              actions.appendChild(handleBtn);
            }
          );
        });
        btnGroup.appendChild(ctxBtn);

        if (msg.status === 'pending' || msg.status === 'flagged') {
          var passBtn = makeBtn('通过', 'ds-btn-primary ds-btn-xs');
          passBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (passBtn.disabled) return;
            passBtn.disabled = true;
            passBtn.textContent = '...';
            moderateMessage(msg.message_id, msg.conversation_id, 'approved').then(function (result) {
              if (result.error) {
                showAdminNotice('审核失败: ' + result.error, 'error');
                passBtn.disabled = false;
                passBtn.textContent = '通过';
                return;
              }
              if (!result.ok) {
                var errMsg = (result.data && result.data.error) || '请求失败';
                showAdminNotice('审核失败: ' + errMsg, 'error');
                passBtn.disabled = false;
                passBtn.textContent = '通过';
                return;
              }
              msg.status = 'approved';
              showAdminNotice('消息已通过', 'success');
              refreshCurrentMessageView();
            });
          });
          btnGroup.appendChild(passBtn);

          var blockBtn = makeBtn('屏蔽', 'ds-btn-danger-text ds-btn-xs');
          blockBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (blockBtn.disabled) return;
            blockBtn.disabled = true;
            blockBtn.textContent = '...';
            moderateMessage(msg.message_id, msg.conversation_id, 'blocked').then(function (result) {
              if (result.error) {
                showAdminNotice('操作失败: ' + result.error, 'error');
                blockBtn.disabled = false;
                blockBtn.textContent = '屏蔽';
                return;
              }
              if (!result.ok) {
                var errMsg = (result.data && result.data.error) || '请求失败';
                showAdminNotice('操作失败: ' + errMsg, 'error');
                blockBtn.disabled = false;
                blockBtn.textContent = '屏蔽';
                return;
              }
              msg.status = 'blocked';
              showAdminNotice('消息已屏蔽', 'success');
              refreshCurrentMessageView();
            });
          });
          btnGroup.appendChild(blockBtn);
        }

        tdActions.appendChild(btnGroup);
        tr.appendChild(tdActions);

        // 行点击 → 详情
        tr.addEventListener('click', function (e) {
          if (e.target.closest('button')) return;
          var prev = tbody.querySelectorAll('tr.selected');
          for (var p = 0; p < prev.length; p++) { prev[p].classList.remove('selected'); }
          tr.classList.add('selected');

          var mst = L.msgStatusText[msg.status] || msg.status;
          var mstag = L.msgStatusTag[msg.status] || 'default';

          openDetail(
            '消息详情',
            function (container) {
              container.appendChild(detailField('时间', msg.time));
              container.appendChild(detailField('发送者', msg.sender));
              container.appendChild(detailField('房间', msg.room));
              container.appendChild(detailField('消息内容', msg.content));
              container.appendChild(detailField('审核状态', makeTag(mst, mstag)));
              var ctxField = el('div', { class: 'ds-detail-field' });
              ctxField.appendChild(el('div', { class: 'ds-detail-label' }, '上下文消息'));
              ctxField.appendChild(buildContextMessages(container, msg));
              container.appendChild(ctxField);
            },
            function (actions) {
              var copyMsgBtn = makeBtn('复制消息ID', 'ds-btn-outline ds-btn-sm');
              copyMsgBtn.addEventListener('click', function () {
                copyText([msg.time, msg.sender, msg.room].join(' | '), '已复制消息定位信息');
              });
              actions.appendChild(copyMsgBtn);
              if (msg.status === 'pending' || msg.status === 'flagged') {
                var handleBtn = makeBtn('标记已处理', 'ds-btn-primary ds-btn-sm');
              handleBtn.addEventListener('click', function (e2) {
                e2.stopPropagation();
                if (handleBtn.disabled) return;
                handleBtn.disabled = true;
                handleBtn.textContent = '...';
                moderateMessage(msg.message_id, msg.conversation_id, 'handled').then(function (result) {
                  if (result.error) {
                    showAdminNotice('操作失败: ' + result.error, 'error');
                    handleBtn.disabled = false;
                    handleBtn.textContent = '标记已处理';
                    return;
                  }
                  if (!result.ok) {
                    var errMsg2 = (result.data && result.data.error) || '请求失败';
                    showAdminNotice('操作失败: ' + errMsg2, 'error');
                    handleBtn.disabled = false;
                    handleBtn.textContent = '标记已处理';
                    return;
                  }
                  msg.status = 'handled';
                  showAdminNotice('消息已标记为已处理', 'success');
                  refreshCurrentMessageView();
                });
              });
              actions.appendChild(handleBtn);
              }
            }
          );
        });

        tbody.appendChild(tr);
      })(msgPage[i]);
    }

    renderPagination('messages', filtered.length, function(p) { renderMessages(filterRoom, filterStatus, searchTerm); });
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
    clear(tbody);

    if (!inviteCodes.length) { renderEmptyRow(tbody, 6, '暂无邀请码数据'); renderPagination('permissions', 0, function(p){ renderInvites(); }); return; }

    var invitePage = paginateArray(inviteCodes, pageState.permissions || 1);
    for (var i = 0; i < invitePage.length; i++) {
      (function (ic) {
        var tr = el('tr');

        tr.appendChild(makeTdMono(ic.code));
        tr.appendChild(makeTd(ic.room));
        tr.appendChild(makeTd(String(ic.maxUses)));
        tr.appendChild(makeTd(String(ic.used)));
        tr.appendChild(makeTd(ic.expires));
        tr.appendChild(makeTd(ic.creator));

        var tdStatus = el('td');
        tdStatus.appendChild(makeTag(L.inviteStatusText[ic.status] || ic.status, L.inviteStatusTag[ic.status] || 'default'));
        tr.appendChild(tdStatus);

        var tdActions = el('td');
        var btnGroup = makeBtnGroup();
        var copyBtn = makeBtn('复制', 'ds-btn-outline ds-btn-xs');
        copyBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          copyText(ic.code, '已复制邀请码');
        });
        btnGroup.appendChild(copyBtn);
        if (ic.status === 'active') {
          var revokeBtn = makeBtn('作废', 'ds-btn-danger-text ds-btn-xs');
          revokeBtn.addEventListener('click', function () {
                if (!confirm('确定要作废邀请码 ' + ic.code + ' ?')) return;
                revokeBtn.disabled = true; revokeBtn.textContent = '作废中...';
                fetchGatewayJsonPost('/v1/admin/invites/revoke', {code: ic.code, actor_id: currentIdentity()}).then(function(r) {
                  revokeBtn.disabled = false; revokeBtn.textContent = '已作废';
                  if (r.error) { showAdminNotice('作废失败: ' + r.error, 'error'); revokeBtn.textContent = '作废'; }
                  else { showAdminNotice('邀请码 ' + ic.code + ' 已作废', 'success'); revokeBtn.textContent = '已作废'; revokeBtn.style.color = 'var(--ds-text-muted)'; }
                });
              });
          btnGroup.appendChild(revokeBtn);
        }
        tdActions.appendChild(btnGroup);
        tr.appendChild(tdActions);

        tbody.appendChild(tr);
      })(invitePage[i]);
    }

    renderPagination('permissions', inviteCodes.length, function(p) { renderInvites(); });
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

    clear(tbody);

    if (!filtered.length) { renderEmptyRow(tbody, 6, '暂无日志数据'); renderPagination('logs', 0, function(p){ renderLogs(filterLevel, filterType, searchTerm); }); return; }

    var logPage = paginateArray(filtered, pageState.logs || 1);
    for (var i = 0; i < logPage.length; i++) {
      (function (log, idx) {
        var tr = el('tr');

        var tdTime = el('td');
        tdTime.style.cssText = 'font-family:var(--ds-font-mono);font-size:12px;color:var(--ds-text-secondary);';
        tdTime.textContent = log.time;
        tr.appendChild(tdTime);

        var tdLevel = el('td');
        tdLevel.appendChild(makeLogLevel(L.logLevelText[log.level] || log.level, log.level));
        tr.appendChild(tdLevel);

        tr.appendChild(makeTd(L.logTypeText[log.type] || log.type));
        tr.appendChild(makeTd(log.desc));
        tr.appendChild(makeTd(log.source, 'color:var(--ds-text-secondary);'));

        // 行点击 → 详情
        tr.addEventListener('click', function () {
          var prev = tbody.querySelectorAll('tr.selected');
          for (var p = 0; p < prev.length; p++) { prev[p].classList.remove('selected'); }
          tr.classList.add('selected');

          var lvText = L.logLevelText[log.level] || log.level;
          var ltText = L.logTypeText[log.type] || log.type;

          openDetail(
            '日志详情',
            function (container) {
              container.appendChild(detailFieldStyled('时间', log.time, 'font-family:var(--ds-font-mono);'));
              container.appendChild(detailField('级别', makeLogLevel(lvText, log.level)));
              container.appendChild(detailField('类型', ltText));
              container.appendChild(detailField('描述', log.desc));
              container.appendChild(detailField('来源模块', log.source));
            },
            function (actions) {
              var handleLogBtn = makeBtn('标记已处理', 'ds-btn-outline ds-btn-sm');
              handleLogBtn.addEventListener('click', function () {
                handleLogBtn.disabled = true; handleLogBtn.textContent = '处理中...';
                fetchGatewayJsonPost('/v1/admin/logs/handle', {log_id: log.id, actor_id: currentIdentity()}).then(function(r) {
                  handleLogBtn.disabled = false;
                  if (r.error) { showAdminNotice('标记失败: ' + r.error, 'error'); handleLogBtn.textContent = '标记已处理'; }
                  else { showAdminNotice('日志 ' + log.id + ' 已标记为已处理', 'success'); handleLogBtn.textContent = '已处理'; handleLogBtn.style.color = 'var(--ds-success)'; }
                });
              });
              actions.appendChild(handleLogBtn);
              var relatedBtn = makeBtn('查看相关日志', 'ds-btn-outline ds-btn-sm');
              relatedBtn.addEventListener('click', function () {
                var typeFilter = document.getElementById('logTypeFilter');
                var searchInput = document.getElementById('logSearch');
                if (typeFilter) typeFilter.value = log.type;
                if (searchInput) searchInput.value = log.source;
                renderLogs('all', log.type, log.source);
                showAdminNotice('已筛选同类来源日志', 'info');
              });
              actions.appendChild(relatedBtn);
            }
          );
        });

        tbody.appendChild(tr);
      })(logPage[i], i);
    }

    renderPagination('logs', filtered.length, function(p) { renderLogs(filterLevel, filterType, searchTerm); });
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

  function bindStaticAdminActions() {
    var residentExport = document.querySelector('[data-admin-action="export-residents"]');
    if (residentExport) {
      residentExport.addEventListener('click', function () {
        downloadCsv('ajw-residents.csv', [
          { label: '居民ID', key: 'id' },
          { label: '昵称', key: 'nick' },
          { label: '邮箱', key: 'email' },
          { label: '角色', get: function (row) { return L.roleText[row.role] || row.role; } },
          { label: '状态', get: function (row) { return L.statusText[row.status] || row.status; } },
          { label: '最近在线', key: 'lastSeen' },
          { label: '消息数', key: 'msgCount' }
        ], filteredResidents());
      });
    }

    var logExport = document.querySelector('[data-admin-action="export-logs"]');
    if (logExport) {
      logExport.addEventListener('click', function () {
        downloadCsv('ajw-admin-logs.csv', [
          { label: '时间', key: 'time' },
          { label: '级别', get: function (row) { return L.logLevelText[row.level] || row.level; } },
          { label: '类型', get: function (row) { return L.logTypeText[row.type] || row.type; } },
          { label: '描述', key: 'desc' },
          { label: '来源', key: 'source' }
        ], filteredLogs());
      });
    }

    var refreshMessages = document.querySelector('[data-admin-action="refresh-messages"]');
    if (refreshMessages) {
      refreshMessages.addEventListener('click', async function () {
        await loadGatewayAdminData();
        renderMessages(
          document.getElementById('msgRoomFilter').value,
          document.getElementById('msgStatusFilter').value,
          document.getElementById('msgSearch').value
        );
        showAdminNotice(gatewayUrl ? '已刷新 Gateway 消息视图' : '已刷新本地预览数据，当前未连接 Gateway', gatewayUrl ? 'success' : 'warning');
      });
    }

    var unavailableActions = [
      ['create-resident', '新建居民需要 Gateway 居民写接口接入后才能执行'],
        ['create-permission-group', '新建权限组需要 Gateway 权限写接口接入后才能执行'],
        ];
    for (var i = 0; i < unavailableActions.length; i++) {
      var button = document.querySelector('[data-admin-action="' + unavailableActions[i][0] + '"]');
      markUnavailableButton(button, unavailableActions[i][1]);
    }

    // sysconfig: refresh from gateway (real GET + POST)
    // Wire generate-invite button
    var genInviteBtn = document.querySelector('[data-admin-action="generate-invite"]');
    if (genInviteBtn) {
      genInviteBtn.addEventListener('click', function () {
        genInviteBtn.disabled = true; genInviteBtn.textContent = '生成中...';
        fetchGatewayJsonPost('/v1/admin/invites', {actor_id: currentIdentity(), max_uses: 10}).then(function(r) {
          genInviteBtn.disabled = false; genInviteBtn.textContent = '+ 生成邀请码';
          if (r.error) { showAdminNotice('生成失败: ' + r.error, 'error'); }
          else { showAdminNotice('邀请码已生成: ' + r.data.code, 'success'); loadInviteCodes(); }
        }).catch(function() {
          genInviteBtn.disabled = false; genInviteBtn.textContent = '+ 生成邀请码';
        });
      });
    }

    // Wire batch-approve button
    var batchApproveBtn = document.querySelector('[data-admin-action="batch-approve-messages"]');
    if (batchApproveBtn) {
      batchApproveBtn.addEventListener('click', function () {
        var rows = document.querySelectorAll('[data-message-id]');
        if (!rows.length) { showAdminNotice('没有可审核的消息', 'info'); return; }
        if (!confirm('确定要批量通过当前可见的 ' + rows.length + ' 条消息？')) return;
        batchApproveBtn.disabled = true; batchApproveBtn.textContent = '批量通过中...';
        var promises = [];
        rows.forEach(function (row) {
          var msgId = row.dataset.messageId;
          var convId = row.dataset.conversationId || '';
          if (msgId) promises.push(fetchGatewayJsonPost('/v1/admin/messages/moderate', {message_id: msgId, conversation_id: convId, action: 'approved'}));
        });
        Promise.all(promises).then(function () {
          batchApproveBtn.disabled = false; batchApproveBtn.textContent = '批量通过';
          showAdminNotice('已批量通过 ' + rows.length + ' 条消息', 'success');
          refreshCurrentMessageView();
        }).catch(function () {
          batchApproveBtn.disabled = false; batchApproveBtn.textContent = '批量通过';
          showAdminNotice('批量通过部分失败', 'error');
        });
      });
    }

    // Wire clear-processed-logs button
    var clearLogsBtn = document.querySelector('[data-admin-action="clear-processed-logs"]');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', function () {
        if (!confirm('确定要清空所有已处理的日志？')) return;
        clearLogsBtn.disabled = true; clearLogsBtn.textContent = '清空中...';
        fetchGatewayJsonPost('/v1/admin/logs/clear', {}).then(function (r) {
          clearLogsBtn.disabled = false; clearLogsBtn.textContent = '清空已处理';
          if (r.error) { showAdminNotice('清空失败: ' + r.error, 'error'); }
          else { showAdminNotice('已清空 ' + (r.data && r.data.cleared || '') + ' 条已处理日志', 'success'); loadLogs(); }
        }).catch(function () {
          clearLogsBtn.disabled = false; clearLogsBtn.textContent = '清空已处理';
        });
      });
    }

    var refreshSysConfig = document.querySelector('[data-admin-action="refresh-sysconfig"]');
    if (refreshSysConfig) {
      refreshSysConfig.addEventListener('click', loadSysConfig);
    }

    var addSysConfig = document.querySelector('[data-admin-action="add-sysconfig"]');
    if (addSysConfig) {
      addSysConfig.addEventListener('click', addSysConfigItem);
    }

  }

  // ====== System Config (Gateway read/write) ======

  var sysConfigCache = {};

  async function loadSysConfig() {
    var statusEl = document.getElementById('sysConfigGatewayStatus');
    var editorEl = document.getElementById('sysConfigEditor');
    if (!editorEl) return;

    if (!gatewayUrl) {
      if (statusEl) { statusEl.textContent = 'Gateway 未连接'; statusEl.style.color = 'var(--ds-text-danger)'; }
      clear(editorEl);
      editorEl.appendChild(el('p', { style: 'color:var(--ds-text-danger);' }, '请先通过 ?gateway= 参数连接 Gateway'));
      return;
    }

    if (statusEl) { statusEl.textContent = '加载中...'; statusEl.style.color = 'var(--ds-text-secondary)'; }

    var config = await fetchGatewayJson('/v1/admin/config');
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      sysConfigCache = config;
      if (statusEl) { statusEl.textContent = '已同步 ' + Object.keys(config).length + ' 个参数'; statusEl.style.color = 'var(--ds-color-success)'; }
      renderSysConfigEditor(config);
    } else {
      if (statusEl) { statusEl.textContent = '加载失败'; statusEl.style.color = 'var(--ds-text-danger)'; }
      clear(editorEl);
      editorEl.appendChild(el('p', { style: 'color:var(--ds-text-danger);' }, '无法从 Gateway 读取配置，请确认 Gateway 已启动且 /v1/admin/config 端点可用。'));
    }
  }

  function renderSysConfigEditor(config) {
    var editorEl = document.getElementById('sysConfigEditor');
    if (!editorEl) return;
    clear(editorEl);

    var keys = Object.keys(config);
    if (!keys.length) {
      editorEl.appendChild(el('p', { style: 'color:var(--ds-text-muted);' }, '暂无系统参数，请使用下方表单添加。'));
      return;
    }

    keys.sort();
    for (var i = 0; i < keys.length; i++) {
      (function (key, value) {
        var row = el('div', { class: 'ds-config-item', style: 'display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid var(--ds-border-light);' });

        var keyInput = el('input', { type: 'text', value: key, style: 'width:180px;font-family:var(--ds-font-mono);font-size:12px;' });
        keyInput.readOnly = true;
        row.appendChild(keyInput);

        var valueInput = el('input', { type: 'text', value: value, style: 'flex:1;font-family:var(--ds-font-mono);font-size:12px;' });
        row.appendChild(valueInput);

        var saveBtn = el('button', { class: 'ds-btn-primary ds-btn-xs' }, '保存');
        saveBtn.addEventListener('click', function () {
          saveSysConfigItem(keyInput.value, valueInput.value, saveBtn);
        });
        row.appendChild(saveBtn);

        editorEl.appendChild(row);
      })(keys[i], config[keys[i]]);
    }
  }

  async function saveSysConfigItem(key, value, btnEl) {
    if (!key.trim()) { showAdminNotice('参数键名不能为空', 'error'); return; }
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = '保存中...'; }

    var result = await fetchGatewayJsonPost('/v1/admin/config', { config: (function () { var o = {}; o[key] = value; return o; })() });

    if (btnEl) { btnEl.disabled = false; btnEl.textContent = '保存'; }

    if (result.error) {
      showAdminNotice('保存失败: ' + result.error, 'error');
    } else if (result.ok) {
      sysConfigCache[key] = value;
      showAdminNotice('参数 ' + key + ' 已保存', 'success');
    } else {
      showAdminNotice('保存失败 (HTTP ' + result.status + '): ' + JSON.stringify(result.data), 'error');
    }
  }

  async function addSysConfigItem() {
    var keyInput = document.getElementById('sysConfigNewKey');
    var valueInput = document.getElementById('sysConfigNewValue');
    if (!keyInput || !valueInput) return;

    var key = keyInput.value.trim();
    var value = valueInput.value.trim();

    if (!key) { showAdminNotice('请输入参数键名', 'error'); return; }

    var addBtn = document.querySelector('[data-admin-action="add-sysconfig"]');
    if (addBtn) { addBtn.disabled = true; addBtn.textContent = '添加中...'; }

    var result = await fetchGatewayJsonPost('/v1/admin/config', { config: (function () { var o = {}; o[key] = value; return o; })() });

    if (addBtn) { addBtn.disabled = false; addBtn.textContent = '添加参数'; }

    if (result.error) {
      showAdminNotice('添加失败: ' + result.error, 'error');
    } else if (result.ok) {
      sysConfigCache[key] = value;
      keyInput.value = '';
      valueInput.value = '';
      showAdminNotice('参数 ' + key + ' 已添加', 'success');
      renderSysConfigEditor(sysConfigCache);
    } else {
      showAdminNotice('添加失败 (HTTP ' + result.status + '): ' + JSON.stringify(result.data), 'error');
    }
  }

  // ====== Admin Resident Ban / Unban (real Gateway POST) ======

  function setBtnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn._prevText = btn.textContent;
      btn.textContent = '处理中...';
      btn.style.opacity = '0.6';
    } else {
      btn.disabled = false;
      if (btn._prevText) { btn.textContent = btn._prevText; delete btn._prevText; }
      btn.style.opacity = '';
    }
  }

  function setBtnResult(btn, ok, message) {
    if (!btn) return;
    btn.disabled = false;
    btn.style.opacity = '';
    if (ok) {
      btn.textContent = '已完成';
      btn.classList.add('ds-btn-success-tick');
      setTimeout(function () {
        btn.classList.remove('ds-btn-success-tick');
        if (btn._prevText) { btn.textContent = btn._prevText; delete btn._prevText; }
      }, 2000);
    } else {
      btn.textContent = '操作失败';
      btn.title = message || '';
      btn.classList.add('ds-btn-error-flash');
      setTimeout(function () {
        btn.classList.remove('ds-btn-error-flash');
        if (btn._prevText) { btn.textContent = btn._prevText; delete btn._prevText; }
        btn.title = '';
      }, 2500);
    }
  }

  async function banResident(residentId, btn) {
    if (!residentId) { showAdminNotice('缺少居民 ID', 'error'); return; }
    if (!gatewayUrl) { showAdminNotice('Gateway 未连接，无法执行禁用操作', 'error'); return; }
    var reason = prompt('请输入禁用理由：', '违规行为');
    if (reason === null) { setBtnResult(btn, false, '已取消'); return; }
    setBtnLoading(btn, true);
    try {
      var result = await fetchGatewayJsonPost('/v1/admin/residents/ban', {
        resident_id: residentId,
        reason: reason || '违规行为',
        actor_id: currentGatewayIdentity()
      });
      if (result.error) {
        setBtnResult(btn, false, result.error);
        showAdminNotice('禁用失败: ' + result.error, 'error');
      } else if (result.ok) {
        setBtnResult(btn, true);
        showAdminNotice('居民 ' + residentId + ' 已禁用', 'success');
        renderResidents(currentResidentFilter(), currentResidentRoleFilter(), currentResidentSearchTerm());
      } else {
        setBtnResult(btn, false, 'HTTP ' + result.status);
        showAdminNotice('禁用失败 (HTTP ' + result.status + ')', 'error');
      }
    } catch (e) {
      setBtnResult(btn, false, e.message);
      showAdminNotice('网络错误: ' + e.message, 'error');
    }
  }

  async function unbanResident(residentId, btn) {
    if (!residentId) { showAdminNotice('缺少居民 ID', 'error'); return; }
    if (!gatewayUrl) { showAdminNotice('Gateway 未连接，无法执行恢复操作', 'error'); return; }
    setBtnLoading(btn, true);
    try {
      var result = await fetchGatewayJsonPost('/v1/admin/residents/unban', {
        resident_id: residentId,
        actor_id: currentGatewayIdentity()
      });
      if (result.error) {
        setBtnResult(btn, false, result.error);
        showAdminNotice('恢复失败: ' + result.error, 'error');
      } else if (result.ok) {
        setBtnResult(btn, true);
        showAdminNotice('居民 ' + residentId + ' 已恢复', 'success');
        renderResidents(currentResidentFilter(), currentResidentRoleFilter(), currentResidentSearchTerm());
      } else {
        setBtnResult(btn, false, 'HTTP ' + result.status);
        showAdminNotice('恢复失败 (HTTP ' + result.status + ')', 'error');
      }
    } catch (e) {
      setBtnResult(btn, false, e.message);
      showAdminNotice('网络错误: ' + e.message, 'error');
    }
  }

  // ====== Admin Room Freeze / Unfreeze (real Gateway POST) ======

  async function freezeRoom(roomId, btn) {
    if (!roomId) { showAdminNotice('缺少房间 ID', 'error'); return; }
    if (!gatewayUrl) { showAdminNotice('Gateway 未连接，无法执行冻结操作', 'error'); return; }
    setBtnLoading(btn, true);
    try {
      var result = await fetchGatewayJsonPost('/v1/admin/rooms/freeze', { room_id: roomId });
      if (result.error) {
        setBtnResult(btn, false, result.error);
        showAdminNotice('冻结失败: ' + result.error, 'error');
      } else if (result.ok) {
        setBtnResult(btn, true);
        showAdminNotice('房间 ' + roomId + ' 已冻结', 'success');
        renderRooms(currentRoomTypeFilter(), currentRoomSearchTerm());
      } else {
        setBtnResult(btn, false, 'HTTP ' + result.status);
        showAdminNotice('冻结失败 (HTTP ' + result.status + ')', 'error');
      }
    } catch (e) {
      setBtnResult(btn, false, e.message);
      showAdminNotice('网络错误: ' + e.message, 'error');
    }
  }

  async function unfreezeRoom(roomId, btn) {
    if (!roomId) { showAdminNotice('缺少房间 ID', 'error'); return; }
    if (!gatewayUrl) { showAdminNotice('Gateway 未连接，无法执行解冻操作', 'error'); return; }
    setBtnLoading(btn, true);
    try {
      var result = await fetchGatewayJsonPost('/v1/admin/rooms/unfreeze', { room_id: roomId });
      if (result.error) {
        setBtnResult(btn, false, result.error);
        showAdminNotice('解冻失败: ' + result.error, 'error');
      } else if (result.ok) {
        setBtnResult(btn, true);
        showAdminNotice('房间 ' + roomId + ' 已解冻', 'success');
        renderRooms(currentRoomTypeFilter(), currentRoomSearchTerm());
      } else {
        setBtnResult(btn, false, 'HTTP ' + result.status);
        showAdminNotice('解冻失败 (HTTP ' + result.status + ')', 'error');
      }
    } catch (e) {
      setBtnResult(btn, false, e.message);
      showAdminNotice('网络错误: ' + e.message, 'error');
    }
  }

  function currentRoomTypeFilter() { return document.getElementById('roomTypeFilter')?.value || 'all'; }
  function currentRoomSearchTerm() { return document.getElementById('roomSearch')?.value || ''; }

  function currentResidentSearchTerm() { return document.getElementById('residentSearch')?.value || ''; }

  // ====== Dashboard live time ======
  function updateDashboardTime() {
    if (dashboardTime) {
      var now = new Date();
      dashboardTime.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  updateDashboardTime();
  setInterval(updateDashboardTime, 30000);

  // ====== Initial Render ======
  bindStaticAdminActions();
  renderResidents('all', 'all', '');
  renderRooms('all', '');
  renderMessages('all', 'all', '');
  renderInvites();
  renderLogs('all', 'all', '');
  updateDashboardSummary('local');
  loadGatewayAdminData();

  // ====== Keyboard shortcuts ======
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDetail(); }
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      sidebarToggle.click();
    }
  });

  if (debugEnabled) {
    console.log('AJW聊天 · 正式管理后台已就绪');
    console.log('模块: 仪表盘 | 居民管理 | 会话与房间 | 消息审核 | 权限与邀请 | 系统配置 | 日志与告警');
    console.log('快捷键: Esc 关闭详情 | Ctrl+B 切换侧栏');
  }
})();
