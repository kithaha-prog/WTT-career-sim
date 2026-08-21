/* ==================== 1. 真实赛历数据生成器 ==================== */
function getBaseWeekEvent(week, year) {
  if (year % 4 === 0 && week === 31) {
    let olympicCity = OLYMPIC_CITIES[year] || "洛杉矶";
    return { name: `${year} ${olympicCity}奥运会乒乓球比赛 (Olympic Games) 🥇`, type: "Olympic", level: "badge-olympic", points: 3000, drawSize: 64, directCut: 64, qualiCut: 128, maxRank: 1, prize: 100000 };
  }
  if (week === 19) {
    if (year % 2 !== 0) {
      let wttcCity = WTTC_SINGLES_CITIES[year] || "世锦赛";
      return { name: `${year} ITTF ${wttcCity}世界乒乓球单项锦标赛 (WTTC Finals) 🥇`, type: "WTTC", level: "badge-smash", points: 2000, drawSize: 64, directCut: 50, qualiCut: 128, maxRank: 1, prize: 80000 };
    } else {
      let teamCity = WTTC_TEAMS_CITIES[year] || "伦敦";
      return { name: `${year} ITTF ${teamCity}世界乒乓球团体锦标赛 (WTTC Teams) 🏆`, type: "WTTC Team", level: "badge-smash", points: 1000, drawSize: 32, directCut: 32, qualiCut: 64, maxRank: 1, prize: 40000 };
    }
  }
  if (week === 16) {
    let wcCity = WORLDCUP_CITIES[year] || "澳门";
    return { name: `${year} ITTF ${wcCity}单打世界杯 (Men's World Cup) 🏆`, type: "World Cup", level: "badge-smash", points: 1500, drawSize: 32, directCut: 32, qualiCut: 48, maxRank: 1, prize: 50000 };
  }
  return BASE_CALENDAR_EVENTS[week] || { name: "常规集训周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 };
}

/* ==================== 多赛事并行系统 (Multi-Event Weekly Calendar) ====================
   每一周不再只有唯一一站赛事：常规巡回赛周会在"主赛事"之外，并行开出 2 站 WTT 支线赛
   (Feeder)，供未入选/未报名主赛事的选手同周出战，形成真实巡回赛"多站并行"的赛历观感。
   玩家每周最多报名 1 站，选定后本周锁定；AI 选手则由 assignWeeklyAIField() 按世界排名、
   赛事级别与参赛资格自动分流到不同赛事，确保每一站都满员出战、绝不出现轮空(BYE)。 */

function buildFeederEvent(week, year, seedOffset) {
  const idx = Math.abs(week * 7 + seedOffset * 13 + year) % FEEDER_CITY_POOL.length;
  const city = FEEDER_CITY_POOL[idx];
  return {
    name: `WTT 支线赛 ${city}站 (Feeder ${city})`,
    type: "Feeder", level: "badge-feed", points: 125, drawSize: 32,
    directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 // 👈 改为 33
  };
}

/* 生成某一周的完整赛事列表（可能为 1 站或多站并行）。休赛/集训周与团体赛周
   保持单一事项，不与其他赛事并行，避免破坏既有团体赛/休赛周机制。 */
/* 生成某一周的完整赛事列表（随机 2 ~ 5 站并行） */
function generateWeekEvents(week, year) {
  const anchor = getBaseWeekEvent(week, year);
  let events;
  
  // 1. 休赛周 / 集训周 / 团体赛周保持单一事项，不进行多站并行
  if (anchor.type === "Training" || anchor.type === "Vacation" || isTeamEventType(anchor.type) || !(anchor.drawSize > 0 && anchor.points > 0)) {
    events = [anchor];
  } else {
    // 2. 使用伪随机哈希算法（保证同年同周的随机总站数确定一致，刷新不跳变）
    // 随机产生 2 ~ 5 站（即 1 站主赛 + 1~4 站支线赛）
    const hash = Math.sin(week * 13.37 + year * 79.19) * 10000;
    const randomCount = 2 + Math.floor((hash - Math.floor(hash)) * 4); // 结果为 2, 3, 4 或 5

    // 主赛事置于第 1 位
    events = [anchor];

    // 补充随机数量的支线赛事 (Feeder)
    for (let i = 1; i < randomCount; i++) {
      events.push(buildFeederEvent(week, year, i));
    }
  }

  // 为本周所有赛事分配唯一 ID
  events.forEach((e, i) => { e.id = `w${year}_${week}_${i}`; });
  return events;
}

/* 将本周所有非用户 AI 选手与双打组合分流到各并行赛事：
   1. 高级别主赛优先保障高排名组合；
   2. 支线赛（Feeder）严格禁止排名前 32 的组合参赛；
   3. 无论单打还是双打，每位选手/组合每周最多只出战 1 站！ */
function assignWeeklyAIField(events) {
  const rankMap = new Map();
  gameState.worldRanking.forEach((x, idx) => rankMap.set(x.name, idx + 1));
  let availableSingles = gameState.worldRanking.filter(x => !x.isUser && !isPlayerSeverelyInjured(x));
  
  ensureDoublesRankingAvailable();
  let availableDoubles = gameState.doublesRanking.filter(x => !x.isUserPair);
  
  let assignedSinglesNames = new Set();
  let assignedDoublesIds = new Set();

  let sortedEvents = [...events].sort((a, b) => (b.points || 0) - (a.points || 0));
  let singlesResult = {};
  let doublesResult = {};

  sortedEvents.forEach((ev) => {
    if (!(ev.drawSize > 0)) { 
      singlesResult[ev.id] = []; 
      doublesResult[ev.id] = [];
      return; 
    }

    let sSize = ev.drawSize || 32;
    let dSize = ev.drawSize <= 16 ? 16 : Math.min(32, Math.floor(ev.drawSize / 2));

    // ==================== 1. 单打分流 ====================
    let sPool = [];
    let sMinRank = ev.type === "Feeder" ? (ev.maxRank || 33) : (ev.maxRank || 1);
    let sQualiCut = ev.qualiCut || 9999;

    if (ev.type === "Feeder") {
      sPool = availableSingles.filter(x => !assignedSinglesNames.has(x.name) && (rankMap.get(x.name) || 9999) >= sMinRank);
      sPool.sort(() => Math.random() - 0.5);
    } else {
      sPool = availableSingles.filter(x => !assignedSinglesNames.has(x.name) &&
        (rankMap.get(x.name) || 9999) >= sMinRank &&
        (rankMap.get(x.name) || 9999) <= sQualiCut);
      sPool.sort((a, b) => (rankMap.get(a.name) || 9999) - (rankMap.get(b.name) || 9999));
    }

    if (sPool.length < sSize) {
      let pickedNames = new Set(sPool.map(x => x.name));
      let remaining = availableSingles.filter(x => !assignedSinglesNames.has(x.name) && !pickedNames.has(x.name) && (rankMap.get(x.name) || 9999) >= sMinRank);
      sPool = sPool.concat(remaining);
    }
    let sField = sPool.slice(0, sSize);
    sField.forEach(f => assignedSinglesNames.add(f.name));
    singlesResult[ev.id] = sField;

    // ==================== 2. 双打分流（双打 Feeder 严格禁止世界前 16/32 参赛） ====================
    let dPool = [];
    let dMinRank = ev.type === "Feeder" ? Math.max(17, Math.floor((ev.maxRank || 33) / 2)) : (ev.maxRank || 1);
    let dQualiCut = Math.floor((ev.qualiCut || 9999) / 2);

    if (ev.type === "Feeder") {
      dPool = availableDoubles.filter(pair => {
        let pairRank = gameState.doublesRanking.indexOf(pair) + 1;
        return !assignedDoublesIds.has(pair.id) && pairRank >= dMinRank;
      });
      dPool.sort(() => Math.random() - 0.5);
    } else {
      dPool = availableDoubles.filter(pair => {
        let pairRank = gameState.doublesRanking.indexOf(pair) + 1;
        return !assignedDoublesIds.has(pair.id) && pairRank >= dMinRank && pairRank <= dQualiCut;
      });
      dPool.sort((a, b) => (gameState.doublesRanking.indexOf(a) - gameState.doublesRanking.indexOf(b)));
    }

    if (dPool.length < dSize) {
      let pickedIds = new Set(dPool.map(p => p.id));
      // 关键修复：补足名单时严格执行 dMinRank，禁止将高排名双打补入支线赛
      let remainingD = availableDoubles.filter(pair => {
        let pairRank = gameState.doublesRanking.indexOf(pair) + 1;
        return !assignedDoublesIds.has(pair.id) && !pickedIds.has(pair.id) && pairRank >= dMinRank;
      });
      dPool = dPool.concat(remainingD);
    }

    let dField = dPool.slice(0, dSize);
    dField.forEach(f => assignedDoublesIds.add(f.id));
    doublesResult[ev.id] = dField;
  });

  return { singles: singlesResult, doubles: doublesResult };
}

/* 确保当前周的赛事列表 + AI 分流方案已生成并缓存在 gameState.weekMeta 中，
   同一周内多次调用只会计算一次（存档后重新载入也会保持同一套分流结果，
   不会因为反复渲染 UI 而重新洗牌 AI 的参赛分布）。 */
function ensureWeekMeta() {
  const p = gameState.player;
  if (gameState.weekMeta && gameState.weekMeta.week === p.week && gameState.weekMeta.year === p.year) {
    return gameState.weekMeta;
  }
  const events = generateWeekEvents(p.week, p.year);
  const { singles: assignment, doubles: doublesAssignment } = assignWeeklyAIField(events);
  gameState.weekMeta = {
    week: p.week,
    year: p.year,
    events: events,
    assignment: assignment,
    doublesAssignment: doublesAssignment,
    selectedEventId: events.length === 1 ? events[0].id : null,
    viewingEventId: null,
    explicitSpectateEventId: null,
    spectateBrackets: {}
  };
  return gameState.weekMeta;
}

/* 获取"本周除 eventId 指定赛事外，其余并行赛事已分配出去的 AI 选手姓名集合"，
   用于在生成玩家所报名赛事的对阵签表时，排除这些已经在别的赛事出战的 AI，
   避免同一名 AI 选手同一周在两站赛事中"分身"出赛。 */
function getExcludedAINamesForOtherEvents(eventId) {
  const wm = ensureWeekMeta();
  let names = new Set();
  wm.events.forEach(ev => {
    if (ev.id !== eventId && wm.assignment && wm.assignment[ev.id]) {
      wm.assignment[ev.id].forEach(x => names.add(x.name));
    }
  });
  return names;
}

/* ==================== 资格判定 & 只读观赛签表缓存 ==================== */

// 判断玩家当前是否有资格报名参加某站赛事（休赛保护 或 排名不足资格线 均视为无资格）
function isEventJoinableForPlayer(ev) {
  if (!ev || !ev.points) return false;
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  if (currentRank < (ev.maxRank || 1)) return false;   // 顶尖选手休赛保护，排名过高无法参赛
  if (currentRank > (ev.qualiCut || 9999)) return false; // 排名不足资格赛资格线
  return true;
}

let spectateBracketCache = {};

// 计算某站赛事下 单打 / 双打 / 兼项 三种出战方案各自需要的预估费用
function getDisciplineCosts(ev) {
  const base = calculateTournamentCost(ev, gameState.player.country);
  return {
    singles: base.total,
    doubles: base.total,
    both: Math.round(base.total * 1.3)
  };
}

/* 玩家在多站并行赛事中选定本周报名的那一站：选定后立即锁定，不能再改选其他赛事。 */
function selectWeekEvent(eventId) {
  const wm = ensureWeekMeta();
  if (wm.selectedEventId) return; // 已锁定，禁止更改
  const ev = wm.events.find(e => e.id === eventId);
  if (!ev) return;

  // 增加最高排名拦截校验
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  if (currentRank < (ev.maxRank || 1)) {
    showAlert(`🛡️ 你的世界排名（#${currentRank}）过高，受赛事规则与顶尖选手休赛保护限制，无法报名参加【${ev.name}】！`);
    return;
  }

  wm.selectedEventId = eventId;
  wm.viewingEventId = eventId;
  wm.explicitSpectateEventId = null;
  updateUI();
  saveGame();
}

/* 切换本周赛事面板当前展示的赛事：可以是玩家自己报名锁定的那一站（正常操作），
   也可以是本周并行开出的其它站点（只读观战，不能操作对阵、不能报名）。 */
function spectateEvent(eventId) {
  const wm = ensureWeekMeta();
  const ev = wm.events.find(e => e.id === eventId);
  if (!ev) return;
  wm.viewingEventId = eventId;
  updateUI();
  saveGame();
}

/* 退出当前查看的赛事（无论是自己报名的那一站还是观战的其它站），
   回到"本周多站赛事选择/浏览列表"界面。 */
function exitToWeekEventSelector() {
  const wm = ensureWeekMeta();
  wm.viewingEventId = null;
  wm.explicitSpectateEventId = null;
  updateUI();
  saveGame();
}

/* 渲染"多站并行赛事"选择/浏览面板：只有本周确实存在 2 站及以上赛事时才会显示。
   三种视图状态：
   1) 列表模式 (viewingEventId 为空)：展示本周全部并行赛事卡片，供选定报名或点击观战；
   2) 本站模式 (viewingEventId === selectedEventId)：顶部显示精简状态条 + "浏览其它赛事"入口；
   3) 观战模式 (viewingEventId 指向其它未报名站点)：顶部显示观战状态条 + "返回赛事列表"入口。 */
/* 优化赛事选择列表：点击进入站点，随时可以返回或观赛 */
function renderWeekEventSelector() {
  const box = document.getElementById('week-events-select');
  if (!box) return;
  const wm = ensureWeekMeta();

  if (wm.events.length <= 1) { box.style.display = 'none'; box.innerHTML = ''; return; }

  box.style.display = 'block';

  // 模式 2：正在查看某站（无论是否已报名），显示返回按钮
  if (wm.viewingEventId) {
    const curViewEv = wm.events.find(e => e.id === wm.viewingEventId);
    const isLocked = wm.selectedEventId === wm.viewingEventId;
    box.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; font-size:0.85rem; color: var(--text-dim); background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:10px; border:1px solid var(--border);">
        <div>📍 当前查看赛事：<span style="color:${isLocked ? 'var(--accent-gold)' : 'var(--accent-cyan)'}; font-weight:700;">${curViewEv ? curViewEv.name : ''}</span> ${isLocked ? '★已报名参赛' : '(未报名，可报名或观赛)'}</div>
        <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="exitToWeekEventSelector()">🔙 返回本周多站赛事列表</button>
      </div>
    `;
    return;
  }

  // 模式 1：多站卡片展示列表
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;

  let html = `<div style="font-size:0.85rem; color: var(--text-dim); margin-bottom:10px;">
    🗓️ 本周同时开出 ${wm.events.length} 站赛事。点击卡片进入查看对应签表，确认报名后将锁定本周行程：
  </div><div style="display:flex; flex-wrap:wrap; gap:10px;">`;

  wm.events.forEach(ev => {
    const isMine = wm.selectedEventId === ev.id;
    const joinable = isEventJoinableForPlayer(ev);
    const isLockedElsewhere = wm.selectedEventId && wm.selectedEventId !== ev.id;
    const hasPartner = Boolean(gameState.playerDoubles?.currentPartner);
    const costs = getDisciplineCosts(ev);
    const money = gameState.player.money;

    // 该站最低出战方案所需费用（用于判断玩家资金是否足以负担任意一种出战方式）
    const cheapestOption = hasPartner ? Math.min(costs.singles, costs.doubles) : costs.singles;
    const canAfford = money >= cheapestOption;

    // 按钮文案与样式：已报名 / 可报名 / 仅可观赛（无资格、资金不足 或 本周已锁定其它站）
    let btnClass = 'btn-primary';
    let btnLabel = '📝 报名 / 查看';
    let reasonTag = '';
    if (isMine) {
      btnClass = 'btn-gold';
      btnLabel = '✅ 查看参赛签表';
    } else if (isLockedElsewhere) {
      btnClass = 'btn-action';
      btnLabel = '👀 查看比赛';
      reasonTag = '(已锁定其它站)';
    } else if (!joinable) {
      btnClass = 'btn-action';
      btnLabel = '👀 查看比赛';
      reasonTag = '(无资格/仅观赛)';
    } else if (!canAfford) {
      btnClass = 'btn-action';
      btnLabel = '👀 查看比赛';
      reasonTag = '(资金不足/仅观赛)';
    }

    const canRegisterDirectly = !isMine && !isLockedElsewhere && joinable && canAfford;

    html += `
      <div style="flex: 1 1 220px; min-width: 220px; padding: 14px; border-radius: 12px; background: var(--bg-card-alt); border: 1px solid ${isMine ? 'var(--accent-gold)' : 'var(--border)'}; display: flex; flex-direction: column;">
        <div style="font-weight: 700; min-height: 42px; line-height: 1.35; margin-bottom: 8px;">
          <span>${ev.name}${isMine ? ' <span style="color:var(--accent-gold); font-size:0.75rem;">★已参赛</span>' : (reasonTag ? ` <span style="color:var(--text-dim); font-size:0.75rem;">${reasonTag}</span>` : '')}</span>
        </div>

        <div style="font-size: 0.78rem; min-height: 24px; margin-bottom: 8px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
          <span class="badge ${ev.level}">${ev.type}</span>
          <span style="color: var(--accent-gold);">+${ev.points}分</span>
          <span style="color: var(--text-dim);">规模 ${ev.drawSize}强</span>
        </div>

        <div style="font-size: 0.74rem; color: var(--text-dim); margin-bottom: 12px; background: rgba(0,0,0,0.25); padding: 6px 8px; border-radius: 6px; line-height: 1.7;">
          <div>🏓 仅单打: <strong style="color:${money >= costs.singles ? 'var(--accent-cyan)' : '#f87171'};">$${costs.singles.toLocaleString()}</strong></div>
          <div>👥 仅双打: <strong style="color:${!hasPartner ? 'var(--text-dim)' : (money >= costs.doubles ? 'var(--accent-cyan)' : '#f87171')};">${hasPartner ? '$' + costs.doubles.toLocaleString() : '需搭档'}</strong></div>
          <div>🔥 兼项: <strong style="color:${!hasPartner ? 'var(--text-dim)' : (money >= costs.both ? 'var(--accent-cyan)' : '#f87171')};">${hasPartner ? '$' + costs.both.toLocaleString() : '需搭档'}</strong></div>
        </div>

        <div style="margin-top: auto;">
          <button class="${btnClass}" style="width:100%;" onclick="${canRegisterDirectly ? `openRegistrationForEvent('${ev.id}')` : `spectateEvent('${ev.id}')`}">
            ${btnLabel}
          </button>
        </div>
      </div>`;
  });
  html += `</div>`;
  box.innerHTML = html;
}

/* 个人资料弹窗：正确显示单打/双打积分与最近战绩 */
function openPlayerProfileModal(playerName) {
  let p = gameState.worldRanking.find(x => x.name === playerName);
  let isRetired = false;
  if (!p) {
    p = (gameState.retiredPlayers || []).find(x => x.name === playerName);
    isRetired = true;
  }
  if (!p) return;

  currentViewingProfilePlayer = p;
  const modal = document.getElementById('player-profile-modal');

  let rankText = isRetired ? "Retired" : `#${gameState.worldRanking.indexOf(p) + 1}`;
  document.getElementById('prof-modal-avatar').innerHTML = getPlayerAvatarHtml(p, 70);
  document.getElementById('prof-modal-name').innerText = p.name + (p.isUser ? "（我方选手）" : (isRetired ? "（已退役）" : ""));
  
  // 积分栏：玩家本人展示单打与双打两项积分
  let pointsInfo = `单打积分: ${isRetired ? '—' : p.points}`;
  if (p.isUser && gameState.playerDoubles) {
    pointsInfo += ` ｜ 双打积分: ${gameState.playerDoubles.points || 0}`;
  }
  document.getElementById('prof-modal-sub').innerHTML = `${getFlagImgHtml(p.country)}${p.country} | ${p.age}岁 | 世界排名: ${rankText} | ${pointsInfo}`;
  document.getElementById('prof-modal-style').innerText = p.style || '两面弧圈型';

  let statusText = "健康";
  if (isRetired) statusText = "已退役";
  else if (p.isUser) statusText = gameState.player.injury ? INJURY_TYPES[gameState.player.injury]?.name : "健康";
  else statusText = p.injury || "健康";
  document.getElementById('prof-modal-status').innerText = statusText;

  let yearsProText = isRetired 
    ? (p.debutYear && p.retiredYear ? (p.retiredYear - p.debutYear) : '--')
    : (p.isUser ? (gameState.player.year - 2026) : (p.debutYear ? Math.max(0, gameState.player.year - p.debutYear) : Math.max(0, (p.age || 16) - 16)));
  document.getElementById('prof-modal-years-pro').innerText = `职业年限: ${yearsProText}${isRetired && yearsProText === '--' ? '' : ' 年'}`;

  // 综合实力与胜率
  let overallVal = p.isUser ? Math.round(computeUserCombatPower()) : Math.round(p.basePow || 60);
  document.getElementById('prof-modal-overall').innerText = overallVal;

  let careerWins = p.isUser ? gameState.stats.wins : (p.careerWins || 0);
  let careerLosses = p.isUser ? gameState.stats.losses : (p.careerLosses || 0);
  let careerTotal = careerWins + careerLosses;
  let winRateText = careerTotal > 0 ? ((careerWins / careerTotal) * 100).toFixed(1) + "%" : "0.0%";
  document.getElementById('prof-modal-winrate').innerText = winRateText;
  document.getElementById('prof-modal-wl').innerText = `${careerWins}胜 ${careerLosses}负`;

  // 渲染最近 5 站比赛记录（支持单打/双打/团体标签）
  const tbody = document.getElementById('prof-recent-tbody');
  tbody.innerHTML = '';
  const recent = p.recentMatches || [];
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-dim); padding:12px;">暂无近期正式参赛记录</td></tr>`;
  } else {
    recent.slice(0, 5).forEach(m => {
      let discTag = '<span class="badge">🏓 单打</span>';
      if (m.discipline === '双打') {
        discTag = '<span class="badge badge-star">👥 双打</span>';
      } else if (m.discipline === '团体') {
        discTag = '<span class="badge badge-gold">🏆 团体</span>';
      }

      let tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.season || '2026年'} 第${m.week}周</td>
        <td><strong>${m.event}</strong></td>
        <td>${discTag}</td>
        <td><span class="badge ${m.type === 'Grand Smash' || m.type === 'Olympic' ? 'badge-smash' : 'badge-star'}">${m.type}</span></td>
        <td><span style="font-weight:bold; color:var(--accent-gold);">${m.result}</span></td>
        <td><strong style="color:var(--accent-blue);">${m.points}</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }

  modal.style.display = 'flex';
}

/* ==================== 1. 正确获取当前查看/选定的赛事 ==================== */
function getEventForWeekAndYear(week, year) {
  const p = gameState.player;
  if (p && week === p.week && year === p.year) {
    const wm = ensureWeekMeta();
    // 优先返回当前正在查看/观赛的站点
    if (wm.viewingEventId) {
      const viewEv = wm.events.find(e => e.id === wm.viewingEventId);
      if (viewEv) return viewEv;
    }
    if (wm.selectedEventId) {
      const sel = wm.events.find(e => e.id === wm.selectedEventId);
      if (sel) return sel;
    }
    return wm.events[0];
  }
  return generateWeekEvents(week, year)[0];
}

/* ==================== 1. 正式结算整张签表的战绩、积分、奖牌与领奖台 ==================== */
function applySubTournamentResults(subTour, curEvent, isDoubles = false) {
  if (!subTour || subTour.awarded) return;

  const rounds = subTour.rounds;
  const size = subTour.drawSize;
  const totalRounds = rounds.length;
  const evName = curEvent.name;
  const evType = curEvent.type;
  const curYear = gameState.player.year;
  const curWeek = gameState.player.week;
  const ptsAward = subTour.pointsAward || curEvent.points || 100;

  // 1. 逐轮结算落败选手的轮次名次与积分
  for (let r = 0; r < totalRounds; r++) {
    let matches = rounds[r];
    let isFinal = (r === totalRounds - 1);
    let isSemi = (totalRounds - r === 2);

    matches.forEach(m => {
      if (!m.winner || !m.p1 || !m.p2) return;
      let loser = (m.winner.name === m.p1.name) ? m.p2 : m.p1;
      let winner = m.winner;

      let rTitle = isFinal ? "🥈 亚军" : getRoundName(size, r, 'main');
      let pts = calculateRoundPoints(ptsAward, size, r, 'main', isFinal);

      if (isDoubles) {
        // 双打落败组合结算
        let lPair = gameState.doublesRanking?.find(p => p.name === loser.name);
        let wPair = gameState.doublesRanking?.find(p => p.name === winner.name);

        if (lPair) {
          lPair.careerLosses = (lPair.careerLosses || 0) + 1;
          if (!lPair.isUserPair) awardDoublesPoints(lPair, pts);

          [lPair.player1?.name, lPair.player2?.name].forEach(pName => {
            if (!pName) return;
            let pl = gameState.worldRanking.find(x => x.name === pName);
            if (pl && !pl.isUser) {
              recordRecentMatchForPlayer(pl, evName, evType, rTitle, pts, "双打");
              if (isFinal) {
                recordCareerMedal(pl.name, 'S', curYear, curWeek, evName, evType, "男子双打");
              } else if (isSemi) {
                recordCareerMedal(pl.name, 'B', curYear, curWeek, evName, evType, "男子双打");
              }
            }
          });
        }
        if (wPair) {
          wPair.careerWins = (wPair.careerWins || 0) + 1;
        }
      } else {
        // 单打落败选手结算
        let loserObj = gameState.worldRanking.find(x => x.name === loser.name);
        let winObj = gameState.worldRanking.find(x => x.name === winner.name);

        if (winObj && !winObj.isUser) {
          winObj.careerWins = (winObj.careerWins || 0) + 1;
        }
        if (loserObj && !loserObj.isUser) {
          loserObj.careerLosses = (loserObj.careerLosses || 0) + 1;
          recordRecentMatchForPlayer(loserObj, evName, evType, rTitle, pts, "单打");
          awardPoints(loserObj, pts);

          if (isFinal) {
            recordCareerMedal(loserObj.name, 'S', curYear, curWeek, evName, evType, "男子单打");
          } else if (isSemi) {
            recordCareerMedal(loserObj.name, 'B', curYear, curWeek, evName, evType, "男子单打");
          }
        }
      }
    });
  }

  // 2. 冠军精准结算与领奖台生成
  let finalMatch = rounds[totalRounds - 1]?.[0];
  if (finalMatch && finalMatch.winner) {
    let champ = finalMatch.winner;
    let runnerUp = (champ.name === finalMatch.p1.name) ? finalMatch.p2 : finalMatch.p1;
    let champPts = ptsAward;

    let semiRound = rounds[totalRounds - 2];
    let thirds = [];
    if (semiRound) {
      semiRound.forEach(sm => {
        if (sm.winner && sm.p1 && sm.p2) {
          let l = (sm.winner.name === sm.p1.name) ? sm.p2 : sm.p1;
          if (l) thirds.push(l.name);
        }
      });
    }
    recordTournamentPodium(curYear, curWeek, curEvent.id + (isDoubles ? '_doubles' : ''), evName + (isDoubles ? ' (双打)' : ''), champ.name, runnerUp?.name, thirds);

    if (isDoubles) {
      let champPair = gameState.doublesRanking?.find(p => p.name === champ.name);
      if (champPair) {
        champPair.titles = (champPair.titles || 0) + 1;
        if (!champPair.isUserPair) awardDoublesPoints(champPair, champPts);

        [champPair.player1?.name, champPair.player2?.name].forEach(pName => {
          if (!pName) return;
          let pl = gameState.worldRanking.find(x => x.name === pName);
          if (pl && !pl.isUser) {
            recordRecentMatchForPlayer(pl, evName, evType, "🏆 冠军", champPts, "双打");
            recordCareerMedal(pl.name, 'G', curYear, curWeek, evName, evType, "男子双打");
          }
        });
      }
    } else {
      let champObj = gameState.worldRanking.find(x => x.name === champ.name);
      if (champObj && !champObj.isUser) {
        recordRecentMatchForPlayer(champObj, evName, evType, "🏆 冠军", champPts, "单打");
        awardPoints(champObj, champPts);
        recordCareerMedal(champObj.name, 'G', curYear, curWeek, evName, evType, "男子单打");
      }
    }
  }

  subTour.awarded = true;
}

/* ==================== 2. 全自动模拟子签表所有轮次并即时同步战绩 ==================== */
function simulateFullSubTournamentRounds(subTour, curEvent, isDoubles = false) {
  if (!subTour || !subTour.rounds) return subTour;
  
  for (let r = 0; r < subTour.rounds.length; r++) {
    let roundMatches = subTour.rounds[r];
    let nextRoundMatches = subTour.rounds[r + 1];
    roundMatches.forEach((m, idx) => {
      if (!m.winner && m.p1 && m.p2) {
        let diff = (m.p1.power || 60) - (m.p2.power || 60);
        let p1WinRate = setWinProb(diff);
        let p1G = 0, p2G = 0;
        while (p1G < 3 && p2G < 3) {
          if (Math.random() < p1WinRate) p1G++; else p2G++;
        }
        m.winner = p1G > p2G ? m.p1 : m.p2;
        m.score = `${p1G} - ${p2G}`;
      } else if (!m.winner) {
        m.winner = m.p1 || m.p2;
      }

      if (nextRoundMatches && m.winner) {
        let nIdx = Math.floor(idx / 2);
        if (idx % 2 === 0) nextRoundMatches[nIdx].p1 = m.winner;
        else nextRoundMatches[nIdx].p2 = m.winner;
      }
    });
  }
  subTour.completed = true;
  subTour.currentRound = subTour.rounds.length;

  // 关键：推演完立即同步战绩与积分，确保观赛点开选手档案即时可见且完全一致
  applySubTournamentResults(subTour, curEvent, isDoubles);

  return subTour;
}

/* ==================== 3. 构造并缓存观赛签表（全局唯一单双打推演） ==================== */
function getOrBuildEventBracket(ev) {
  if (!ev) return null;
  const p = gameState.player;
  const wm = ensureWeekMeta();
  if (!wm.spectateBrackets) wm.spectateBrackets = {};

  // 命中全局缓存则直接返回，杜绝二次随机重新打乱结果
  if (wm.spectateBrackets[ev.id]) {
    return wm.spectateBrackets[ev.id];
  }

  // 1. 生成并推演完整单打签表（即刻同步单打战绩）
  let singlesTour = buildPureAISinglesTournamentData(ev);
  simulateFullSubTournamentRounds(singlesTour, ev, false);

  // 2. 生成并推演完整双打签表（即刻同步双打战绩）
  let doublesTour = buildPureAIDoublesTournamentData(ev);
  simulateFullSubTournamentRounds(doublesTour, ev, true);

  const built = {
    mode: 'both',
    discipline: 'both',
    readOnly: true,
    week: p.week,
    year: p.year,
    eventId: ev.id,
    name: ev.name,
    type: ev.type,
    singles: singlesTour,
    doubles: doublesTour,
    completed: true
  };

  wm.spectateBrackets[ev.id] = built;
  return built;
}

/* ==================== 确保双打组合库始终满员 (杜绝待定) ==================== */
function ensureDoublesRankingAvailable() {
  if (!gameState.doublesRanking || gameState.doublesRanking.length < 50) {
    generateInitial100DoublesPairs();
  }
}

/* ==================== 专业种子抽签与 Bracket 生成 (杜绝 null/待定) ==================== */
function generateSeededBracket(participants, drawSize, isDoubles = false) {
  // 1. 数组去重
  let uniqueList = [];
  let seenNames = new Set();
  participants.forEach(p => {
    if (p && p.name && !seenNames.has(p.name)) {
      seenNames.add(p.name);
      uniqueList.push(p);
    }
  });
  participants = uniqueList;

  participants.sort((a, b) => (b.points || 0) - (a.points || 0) || ((b.power || 0) - (a.power || 0)));
  let slots = new Array(drawSize).fill(null);

  if (participants.length > 0) slots[0] = { ...participants[0], seed: 1 };
  if (participants.length > 1) slots[drawSize - 1] = { ...participants[1], seed: 2 };

  if (drawSize >= 4 && participants.length > 2) {
    let q2 = Math.floor(drawSize / 2) - 1;
    let q3 = Math.floor(drawSize / 2);
    let seeds34 = [participants[2], participants[3]].filter(Boolean);
    if (Math.random() < 0.5) seeds34.reverse();
    if (seeds34[0]) slots[q2] = { ...seeds34[0], seed: 3 };
    if (seeds34[1]) slots[q3] = { ...seeds34[1], seed: 4 };
  }

  if (drawSize >= 8 && participants.length > 4) {
    let seedPositions8 = [
      Math.floor(drawSize / 4) - 1,
      Math.floor(drawSize / 4),
      Math.floor(drawSize * 3 / 4) - 1,
      Math.floor(drawSize * 3 / 4)
    ];
    let seeds58 = participants.slice(4, 8);
    seeds58.sort(() => Math.random() - 0.5);
    seeds58.forEach((p, idx) => {
      if (seedPositions8[idx] !== undefined && !slots[seedPositions8[idx]]) {
        slots[seedPositions8[idx]] = { ...p, seed: idx + 5 };
      }
    });
  }

  let remainingPlayers = participants.slice(8);
  remainingPlayers.sort(() => Math.random() - 0.5);

  for (let i = 0; i < drawSize; i++) {
    if (!slots[i]) {
      let nextPlayer = remainingPlayers.pop();
      
      // 兜底补位：严格检查已有名字，绝不重复添加
      if (!nextPlayer) {
        let currentUsedNames = new Set(slots.filter(Boolean).map(s => s.name));
        if (isDoubles) {
          ensureDoublesRankingAvailable();
          let subPair = gameState.doublesRanking.find(pr => !pr.isUserPair && !currentUsedNames.has(pr.name));
          if (subPair) {
            nextPlayer = {
              name: subPair.name,
              player1: subPair.player1,
              player2: subPair.player2,
              power: calculateDoublesPairCombatPower(subPair.player1, subPair.player2, subPair.chemistry || 70),
              points: subPair.points,
              chemistry: subPair.chemistry || 70,
              isUser: false,
              isDoubles: true
            };
          }
        } else {
          let sub = gameState.worldRanking.find(x => !x.isUser && !isPlayerSeverelyInjured(x) && !currentUsedNames.has(x.name));
          if (sub) {
            nextPlayer = {
              name: sub.name,
              power: Math.max(20, (sub.basePow || 55) - (sub.injuryPenalty || 0)),
              points: sub.points,
              isUser: false,
              isDoubles: false
            };
          }
        }
      }
      slots[i] = nextPlayer;
    }
  }

  return slots;
}

// 抽取团体赛"淘汰赛正赛"对阵树的构建逻辑，供【小组赛出线后组建正赛】与其他场景复用，
// 避免重复代码；入参 teams 为已确定晋级的代表队列表，fieldSize 为淘汰赛正赛规模（需为 2 的幂）。
function buildTeamKnockoutBracket(teams, fieldSize) {
  let seededTeams = generateSeededBracket(teams, fieldSize);
  // 兜底：填补的"轮空选手"占位对象没有 roster，补一份，避免后续模拟报错
  seededTeams.forEach(t => {
    if (!t.roster || t.roster.length === 0) {
      let c = t.country || COUNTRIES_GLOBAL[Math.floor(Math.random() * COUNTRIES_GLOBAL.length)];
      t.country = c;
      t.name = c;
      t.roster = getOrCreateFullCountryTeam(c, {});
    }
  });

  let rounds = [];
  let curSize = fieldSize;
  while (curSize >= 2) {
    let matches = [];
    for (let i = 0; i < curSize / 2; i++) matches.push({ t1: null, t2: null, winner: null, score: "", tieResult: null });
    rounds.push(matches);
    curSize /= 2;
  }
  for (let i = 0; i < fieldSize / 2; i++) {
    rounds[0][i].t1 = seededTeams[i * 2];
    rounds[0][i].t2 = seededTeams[i * 2 + 1];
  }
  return { drawSize: fieldSize, currentRound: 0, rounds: rounds };
}

/* ==================== 严格遵循报名线的资格赛与正赛抽签 ==================== */
function startCurrentWeekTournament() {
  const p = gameState.player;

  // 1. 严重伤病检查
  if (p.injury && INJURY_TYPES[p.injury]?.severity === 'severe') {
    showAlert(`🚫 队医禁止参赛！你目前身患【${INJURY_TYPES[p.injury].name}】。<br>请在【周计划训练】中安排水疗休养！`, "无法参赛", "🚑");
    return;
  }

  const wm = ensureWeekMeta();
  if (wm.events.length > 1 && !wm.selectedEventId) {
    showAlert("本周同时开出多站赛事，请先在上方赛事列表中选择并锁定 1 站赛事，再报名参赛！");
    return;
  }

  const curEvent = getEventForWeekAndYear(p.week, p.year);

  // 2. 计算参赛总开销并进行资金校验与拦截
  const cost = calculateTournamentCost(curEvent, p.country);
  if (p.money < cost.total) {
    showAlert(
      `💸 <strong>账户资金不足，无法前往该站！</strong><br><br>` +
      `前往【${curEvent.name}】预估总开销为：<strong style="color:var(--accent);">$${cost.total.toLocaleString()}</strong><br>` +
      `• 赛事报名费: $${cost.entry}<br>` +
      `• 往返国际航班/交通: $${cost.flight}<br>` +
      `• 官方协议酒店 (${cost.days}晚): $${cost.hotel}<br>` +
      `• 营养配餐与补给: $${cost.food}<br><br>` +
      `你当前可用资金仅剩：<span style="color:var(--accent-cyan);">$${p.money.toLocaleString()}</span>。<br>` +
      `<span style="color:var(--text-dim); font-size:0.8rem;">建议：先在周计划中训练休赛，或签约赞助商积累周薪。</span>`,
      "资金短缺", "💵"
    );
    return; // 拦截参赛
  }

  // 3. 确认报名并扣除费用
  p.money -= cost.total;

  // 4. 后续常规报名逻辑 (抽签与对阵初始化)
  const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  let isUnqualified = currentRank > curEvent.qualiCut;
  let isQualifying = !isUnqualified && (currentRank > curEvent.directCut);
  let totalSize = isQualifying ? 4 : (curEvent.drawSize || 16);

  // ... [保持下方原有的 opponentPool 抽取、Bracket 构建及 UI 刷新逻辑不变] ...

  // 核心修复点：严格划分资格赛与正赛候选池，杜绝高排名选手混入资格赛
  let opponentPool = [];
  if (isQualifying) {
    // 资格赛：严格抽取排名在 directCut + 1 到 qualiCut 之间的选手（排除本周已在其他并行赛事出战的 AI）
    opponentPool = gameState.worldRanking.filter(x => {
      let r = gameState.worldRanking.indexOf(x) + 1;
      return !x.isUser && (!isPlayerSeverelyInjured(x)) && !excludedNames.has(x.name) && r > curEvent.directCut && r <= (curEvent.qualiCut + 15);
    });
  } else {
    // 正赛：抽取符合最高参赛级别限制、且排名在前 directCut 内的选手
    // 改进逻辑：从满足条件的最高排名开始，按排名由高到低依次顺延提取健康选手
    opponentPool = gameState.worldRanking.filter(x => {
      let r = gameState.worldRanking.indexOf(x) + 1;
      return !x.isUser && !isPlayerSeverelyInjured(x) && !excludedNames.has(x.name) && r >= (curEvent.maxRank || 1);
    });

    // 若排除其他赛事后的健康选手仍不足以凑满签表，则放宽排除限制进行全局向后顺延
    if (opponentPool.length < totalSize) {
      opponentPool = gameState.worldRanking.filter(x => {
        let r = gameState.worldRanking.indexOf(x) + 1;
        return !x.isUser && !isPlayerSeverelyInjured(x) && r >= (curEvent.maxRank || 1);
      });
    }
  }
  // 兜底：若排除后候选池不足以填满签表，放宽排除限制，避免玩家赛事出现轮空
  {
    let neededMin = (totalSize - 1);
    if (opponentPool.length < neededMin) {
      opponentPool = gameState.worldRanking.filter(x => {
        let r = gameState.worldRanking.indexOf(x) + 1;
        return !x.isUser && (!isPlayerSeverelyInjured(x)) &&
          (isQualifying ? (r > curEvent.directCut && r <= (curEvent.qualiCut + 15)) : (r >= curEvent.maxRank && r <= (curEvent.directCut + 10)));
      });
    }
  }

  let participants = [];
  let userInDraw = !isUnqualified;
  let targetCount = userInDraw ? totalSize - 1 : totalSize;

  while (participants.length < targetCount && opponentPool.length > 0) {
    let r = Math.floor(Math.random() * opponentPool.length);
    participants.push(opponentPool.splice(r, 1)[0]);
  }

  let rawList = [];
  if (userInDraw) {
    let userStats = getEffectiveStats();
    let userCombatPow = computeUserCombatPower();
    rawList.push({ name: p.name, power: userCombatPow, points: p.points, isUser: true });
  }

  participants.forEach(x => {
    rawList.push({ name: x.name, power: Math.max(20, (x.basePow || 55) - (x.injuryPenalty || 0)) + Math.random()*8, points: x.points, isUser: false });
  });

  let fullDraw = generateSeededBracket(rawList, totalSize);

  let rounds = [];
  let currentSize = totalSize;
  while(currentSize >= 2) {
    let matchesInRound = [];
    for(let i=0; i<currentSize/2; i++) {
      matchesInRound.push({ p1: null, p2: null, score: "", winner: null });
    }
    rounds.push(matchesInRound);
    currentSize /= 2;
  }

  for(let i=0; i<totalSize/2; i++) {
    rounds[0][i].p1 = fullDraw[i*2];
    rounds[0][i].p2 = fullDraw[i*2 + 1];
  }

  gameState.currentTournament = {
    week: p.week,
    eventId: curEvent.id,
    name: curEvent.name,
    type: curEvent.type,
    pointsAward: curEvent.points,
    prizeAward: curEvent.prize,
    phase: isQualifying ? 'quali' : 'main',
    drawSize: totalSize,
    currentRound: 0,
    rounds: rounds,
    isUserKnockedOut: isUnqualified
  };
  wm.selectedEventId = curEvent.id;
  wm.viewingEventId = curEvent.id;

  if (userInDraw) {
    checkAndTriggerPlayerInjury(false);
  }

  renderBracket();
  updateUI();
  saveGame();
}

/* 资格赛突围后进入正赛：正赛对手必须抽取直通线 (Top directCut) 的顶尖名将 */
function enterMainDrawAfterQuali() {
  const p = gameState.player;
  const curEvent = getEventForWeekAndYear(p.week, p.year);
  const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
  let totalSize = curEvent.drawSize || 16;

  let opponentPool = gameState.worldRanking.filter(x => {
    let r = gameState.worldRanking.indexOf(x) + 1;
    return !x.isUser && (!isPlayerSeverelyInjured(x)) && !excludedNames.has(x.name) && r >= curEvent.maxRank && r <= (curEvent.directCut + 10);
  });
  if (opponentPool.length < totalSize - 1) {
    opponentPool = gameState.worldRanking.filter(x => {
      let r = gameState.worldRanking.indexOf(x) + 1;
      return !x.isUser && (!isPlayerSeverelyInjured(x)) && r >= curEvent.maxRank && r <= (curEvent.directCut + 10);
    });
  }

  let participants = [];
  while (participants.length < totalSize - 1 && opponentPool.length > 0) {
    let r = Math.floor(Math.random() * opponentPool.length);
    participants.push(opponentPool.splice(r, 1)[0]);
  }

  let userStats = getEffectiveStats();
  let userCombatPow = computeUserCombatPower();

  let rawList = [
    { name: p.name, power: userCombatPow, points: p.points, isUser: true },
    ...participants.map(x => ({ name: x.name, power: Math.max(20, (x.basePow || 55) - (x.injuryPenalty || 0)) + Math.random()*8, points: x.points, isUser: false }))
  ];

  let fullDraw = generateSeededBracket(rawList, totalSize);

  let rounds = [];
  let currentSize = totalSize;
  while(currentSize >= 2) {
    let matchesInRound = [];
    for(let i=0; i<currentSize/2; i++) {
      matchesInRound.push({ p1: null, p2: null, score: "", winner: null });
    }
    rounds.push(matchesInRound);
    currentSize /= 2;
  }

  for(let i=0; i<totalSize/2; i++) {
    rounds[0][i].p1 = fullDraw[i*2];
    rounds[0][i].p2 = fullDraw[i*2 + 1];
  }

  gameState.currentTournament = {
    week: p.week,
    eventId: curEvent.id,
    name: curEvent.name,
    type: curEvent.type,
    pointsAward: curEvent.points,
    prizeAward: curEvent.prize,
    phase: 'main',
    drawSize: totalSize,
    currentRound: 0,
    rounds: rounds,
    isUserKnockedOut: false
  };

  renderBracket();
  updateUI();
  saveGame();
}

function loadMainDrawForViewing() {
  const p = gameState.player;
  const curEvent = getEventForWeekAndYear(p.week, p.year);
  const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
  let totalSize = curEvent.drawSize || 16;

  let opponentPool = gameState.worldRanking.filter((x, idx) => {
    let rank = idx + 1;
    return !x.isUser && !isPlayerSeverelyInjured(x) && !excludedNames.has(x.name) && rank >= (curEvent.maxRank || 1);
  });
  if (opponentPool.length < totalSize) {
    opponentPool = gameState.worldRanking.filter(x => !x.isUser && !isPlayerSeverelyInjured(x)).slice(0, Math.min(100, totalSize + 10));
  }
  let participants = [];
  while (participants.length < totalSize && opponentPool.length > 0) {
    let r = Math.floor(Math.random() * opponentPool.length);
    participants.push(opponentPool.splice(r, 1)[0]);
  }

  let rawList = participants.map(x => ({ name: x.name, power: (x.basePow || 55) + Math.random() * 8, points: x.points, isUser: false, isDoubles: false }));
  let fullDraw = generateSeededBracket(rawList, totalSize, false);
  let newSinglesMain = createBracketRoundsStructure(fullDraw, totalSize, 'main', curEvent, true, false);

  if (gameState.currentTournament && gameState.currentTournament.mode === 'both') {
    gameState.currentTournament.singles = newSinglesMain;
  } else {
    gameState.currentTournament = newSinglesMain;
  }

  renderBracket();
  updateUI();
  saveGame();
}

function enterMainDrawAfterQuali() {
  const p = gameState.player;
  const curEvent = getEventForWeekAndYear(p.week, p.year);
  const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
  let totalSize = curEvent.drawSize || 16;

  let opponentPool = gameState.worldRanking.filter((x, idx) => {
    let rank = idx + 1;
    return !x.isUser && (x.injury !== "重度伤病") && !excludedNames.has(x.name) && rank >= (curEvent.maxRank || 1);
  });
  if (opponentPool.length < totalSize - 1) {
    opponentPool = gameState.worldRanking.filter(x => !x.isUser && (x.injury !== "重度伤病")).slice(0, Math.min(64, totalSize + 10));
  }
  let participants = [];
  while (participants.length < totalSize - 1 && opponentPool.length > 0) {
    let r = Math.floor(Math.random() * opponentPool.length);
    participants.push(opponentPool.splice(r, 1)[0]);
  }

  let userStats = getEffectiveStats();
  let userCombatPow = computeUserCombatPower();

  let rawList = [
    { name: p.name, power: userCombatPow, points: p.points, isUser: true },
    ...participants.map(x => ({ name: x.name, power: Math.max(20, (x.basePow || 55) - (x.injuryPenalty || 0)) + Math.random()*8, points: x.points, isUser: false }))
  ];

  let fullDraw = generateSeededBracket(rawList, totalSize);

  let rounds = [];
  let currentSize = totalSize;
  while(currentSize >= 2) {
    let matchesInRound = [];
    for(let i=0; i<currentSize/2; i++) {
      matchesInRound.push({ p1: null, p2: null, score: "", winner: null });
    }
    rounds.push(matchesInRound);
    currentSize /= 2;
  }

  for(let i=0; i<totalSize/2; i++) {
    rounds[0][i].p1 = fullDraw[i*2];
    rounds[0][i].p2 = fullDraw[i*2 + 1];
  }

  gameState.currentTournament = {
    week: p.week,
    eventId: curEvent.id,
    name: curEvent.name,
    type: curEvent.type,
    pointsAward: curEvent.points,
    prizeAward: curEvent.prize,
    phase: 'main',
    drawSize: totalSize,
    currentRound: 0,
    rounds: rounds,
    isUserKnockedOut: false
  };

  renderBracket();
  updateUI();
  saveGame();
}

// ==================== 真实参赛差旅与报名成本模型 ====================
function calculateTournamentCost(event, userCountry) {
  if (!event || event.points === 0 || event.type === "Training" || event.type === "Vacation") {
    return { entry: 0, flight: 0, hotel: 0, food: 0, total: 0, days: 0 };
  }

  // 1. 报名费 (按赛事级别划分)
  let entryFee = 100;
  if (event.type === "Feeder") entryFee = 150;
  else if (event.type === "Contender") entryFee = 250;
  else if (event.type === "Star Contender") entryFee = 400;
  else if (event.type === "Champions") entryFee = 600;
  else if (event.type === "Grand Smash") entryFee = 1000;
  else if (event.type === "Olympic" || event.type === "WTTC") entryFee = 0; // 国家代表队出战免报名费

  // 2. 差旅交通（根据参赛城市与选手国籍计算长途机票）
  let isDomestic = false;
  if (userCountry && userCountry.includes("CHN")) {
    if (event.name.includes("中国") || event.name.includes("北京") || event.name.includes("重庆") || event.name.includes("太原") || event.name.includes("澳门")) {
      isDomestic = true;
    }
  }
  let flightFee = isDomestic ? 150 : 1100;
  // 跨大洋长途赛事（如美洲、非洲、欧洲）
  if (!isDomestic && (event.name.includes("美国") || event.name.includes("里约") || event.name.includes("圣保罗") || event.name.includes("拉各斯"))) {
    flightFee = 1800;
  }

  // 3. 酒店住宿与餐饮生活费 (按赛事预估停留天数计算)
  let stayDays = event.drawSize >= 64 ? 8 : (event.drawSize >= 32 ? 5 : 3);
  let hotelDailyRate = 120; // 官方指定合作三星/四星酒店均价
  let foodDailyRate = 40;   // 运动员专业膳食/营养补充

  let hotelFee = stayDays * hotelDailyRate;
  let foodFee = stayDays * foodDailyRate;

  // 奥运会/国家队单项与团体大赛，国家队承担食宿交通（自付象征性零用）
  if (event.type === "Olympic" || event.type === "WTTC" || event.type.includes("Team")) {
    flightFee = 0;
    hotelFee = 0;
    foodFee = stayDays * 20; // 仅保留基本杂费
  }

  let totalCost = entryFee + flightFee + hotelFee + foodFee;

  return {
    entry: entryFee,
    flight: flightFee,
    hotel: hotelFee,
    food: foodFee,
    days: stayDays,
    total: totalCost
  };
}

// 标准 WTT / ITTF 梯队积分计算器（彻底消除资格赛与正赛倒挂）
function calculateRoundPoints(pointsAward, drawSize, roundIdx, phase, isRunnerUp = false) {
  if (isRunnerUp) return Math.floor(pointsAward * 0.70); // 亚军 70%
  
  if (phase === 'quali') {
    // 资格赛首轮出局 ~3%（保底 3 分）；决胜轮出局 ~6%（保底 6 分）
    let qPct = (roundIdx === 0) ? 0.03 : 0.06;
    return Math.max(3, Math.floor(pointsAward * qPct));
  }
  
  // 正赛阶段：根据距离决赛的轮次深度逐级递增
  let totalRounds = Math.log2(drawSize || 16);
  let roundsLeft = totalRounds - roundIdx;
  
  let mainPct = 0.12; // 默认首轮出局 12%（Feeder 125 约为 15 分，高于资格赛的 3~7 分）
  if (roundsLeft === 2) mainPct = 0.40;       // 半决赛 (4强) 40%
  else if (roundsLeft === 3) mainPct = 0.22;  // 1/4决赛 (8强) 22%
  else if (roundsLeft === 4) mainPct = 0.12;  // 1/8决赛 (16强) 12%
  else if (roundsLeft === 5) mainPct = 0.06;  // 32强出局 6%
  else if (roundsLeft >= 6) mainPct = 0.03;   // 64强出局 3%
  
  return Math.max(8, Math.floor(pointsAward * mainPct));
}

// 对应阶梯奖金计算器
function calculateRoundPrize(prizeAward, drawSize, roundIdx, phase, isRunnerUp = false) {
  if (!prizeAward) return 0;
  if (isRunnerUp) return Math.floor(prizeAward * 0.55);
  if (phase === 'quali') {
    let qPct = (roundIdx === 0) ? 0.02 : 0.05;
    return Math.floor(prizeAward * qPct);
  }
  let totalRounds = Math.log2(drawSize || 16);
  let roundsLeft = totalRounds - roundIdx;
  let pPct = 0.08;
  if (roundsLeft === 2) pPct = 0.30;
  else if (roundsLeft === 3) pPct = 0.16;
  else if (roundsLeft === 4) pPct = 0.08;
  else if (roundsLeft === 5) pPct = 0.04;
  else if (roundsLeft >= 6) pPct = 0.02;
  return Math.floor(prizeAward * pPct);
}

/* ==================== 轮次结算与奥运铜牌赛调度 ==================== */
/* ==================== 轮次结算与选手战绩全面记录 (已修复对手履历遗漏) ==================== */
function finishCurrentRound(playerWonRound) {
  let rootTour = gameState.currentTournament;
  if (!rootTour) return;

  if (rootTour.mode === 'both') {
    let targetSubTour = (currentActiveBracketTab === 'doubles') ? rootTour.doubles : rootTour.singles;
    finishSubTournamentRound(targetSubTour, playerWonRound);
    if (rootTour.singles.completed && rootTour.doubles.completed) {
      rootTour.completed = true;
    }
  } else {
    finishSubTournamentRound(rootTour, playerWonRound);
  }

  renderBracket();
  updateUI();
  saveGame();
}

/* ==================== 统一赛事轮次触发 (优先调度铜牌战) ==================== */
/* 统一推进对决动作（支持单打/双打各自处于不同轮次或阶段） */
function triggerRoundAction() {
  const rootTour = gameState.currentTournament;
  if (!rootTour || rootTour.completed) return;

  if (rootTour.mode === 'both') {
    let sTour = rootTour.singles;
    let dTour = rootTour.doubles;

    // 只操作当前查看/激活的签表 (currentActiveBracketTab)，绝不联动/跳转另一项目
    let curActiveTour = (currentActiveBracketTab === 'doubles') ? dTour : sTour;

    if (!curActiveTour || curActiveTour.completed) {
      // 当前签表已完赛，无事可做；仅当两项均完赛时才标记整站结束
      if (sTour.completed && dTour.completed) rootTour.completed = true;
      renderBracket();
      updateUI();
      saveGame();
      return;
    }

    let activeMatch = (!curActiveTour.isUserKnockedOut && curActiveTour.rounds[curActiveTour.currentRound])
      ? curActiveTour.rounds[curActiveTour.currentRound].find(m => (m.p1?.isUser || m.p2?.isUser) && !m.winner)
      : null;

    if (activeMatch) {
      openMatchPreviewModal(activeMatch);
      return;
    }

    // 当前签表本轮无玩家比赛（已出局或全部为 AI 对决）：只推进当前签表这一项
    finishSubTournamentRound(curActiveTour, false);
    if (sTour.completed && dTour.completed) {
      rootTour.completed = true;
    }
    renderBracket();
    updateUI();
    saveGame();
    return;
  }

  // 单一模式推进
  let userMatch = (!rootTour.completed && !rootTour.isUserKnockedOut && rootTour.rounds[rootTour.currentRound])
    ? rootTour.rounds[rootTour.currentRound].find(m => (m.p1?.isUser || m.p2?.isUser) && !m.winner) 
    : null;

  if (userMatch) {
    openMatchPreviewModal(userMatch);
  } else {
    finishSubTournamentRound(rootTour, false);
    renderBracket();
    updateUI();
    saveGame();
  }
}

/* 5. 核心轮次推进与双打战绩写入 */
function finishSubTournamentRound(tour, playerWonRound) {
  if (!tour || tour.completed) return;
  if (tour.currentRound >= tour.rounds.length) {
    tour.completed = true;
    return;
  }

  let roundMatches = tour.rounds[tour.currentRound];
  let nextRoundMatches = tour.rounds[tour.currentRound + 1];
  let isFinalRound = (tour.rounds.length - tour.currentRound === 1);
  let isSemiFinal = (tour.rounds.length - tour.currentRound === 2);
  let isTrueFinal = isFinalRound && tour.phase !== 'quali';
  let isDoubles = Boolean(tour.isDoubles);
  let semiLosers = [];

  // 1. 模拟未完成场次
  roundMatches.forEach((m, idx) => {
    if (!m.winner && m.p1 && m.p2) {
      let diff = (m.p1.power || 60) - (m.p2.power || 60);
      let p1WinRate = setWinProb(diff);
      let targetG = 3;
      let p1G = 0, p2G = 0;
      while (p1G < targetG && p2G < targetG) {
        if (Math.random() < p1WinRate) p1G++; else p2G++;
      }
      m.winner = p1G > p2G ? m.p1 : m.p2;
      m.score = `${p1G} - ${p2G}`;

      let loser = p1G > p2G ? m.p2 : m.p1;
      let rTitle = getRoundName(tour.drawSize, tour.currentRound, tour.phase);
      if (isSemiFinal && tour.type === 'Olympic') {
        semiLosers.push(loser);
      } else if (!isTrueFinal) {
        let pts = calculateRoundPoints(tour.pointsAward, tour.drawSize, tour.currentRound, tour.phase);
        if (isDoubles) {
          let loserPair = gameState.doublesRanking?.find(p => p.name === loser.name);
          if (loserPair) {
            loserPair.careerLosses = (loserPair.careerLosses || 0) + 1; // 👈 真实累加
            if (!loserPair.isUserPair) awardDoublesPoints(loserPair, pts);
            [loserPair.player1?.name, loserPair.player2?.name].forEach(pName => {
              let pl = gameState.worldRanking.find(x => x.name === pName);
              if (pl) recordRecentMatchForPlayer(pl, tour.name, tour.type, rTitle, pts, "双打");
            });
          }
          let winPair = gameState.doublesRanking?.find(p => p.name === m.winner.name);
          if (winPair) winPair.careerWins = (winPair.careerWins || 0) + 1; // 👈 真实累加
        } else {
          let loserObj = gameState.worldRanking.find(x => x.name === loser.name);
          if (loserObj && !loserObj.isUser) {
            recordRecentMatchForPlayer(loserObj, tour.name, tour.type, rTitle, pts, "单打");
            awardPoints(loserObj, pts);
          }
        }
      }
    } else if (isSemiFinal && tour.type === 'Olympic' && m.winner) {
      let loser = (m.winner === m.p1) ? m.p2 : m.p1;
      if (loser) semiLosers.push(loser);
    }

    if (nextRoundMatches && m.winner) {
      let nIdx = Math.floor(idx / 2);
      if (idx % 2 === 0) nextRoundMatches[nIdx].p1 = m.winner;
      else nextRoundMatches[nIdx].p2 = m.winner;
    }
  });

  if (isSemiFinal && tour.type === 'Olympic' && semiLosers.length >= 2) {
    tour.bronzeMatch = {
      p1: semiLosers[0], p2: semiLosers[1], score: "", winner: null, isBronze: true, isDoubles: isDoubles
    };
  }

  tour.currentRound++;
  let isLastRound = tour.currentRound >= tour.rounds.length;

  // ==================== 2. 正赛决赛加冕 ====================
    if (isTrueFinal && isLastRound) {
      let finalMatch = roundMatches[0];
      let champ = finalMatch.winner;
      let runnerUp = (champ === finalMatch.p1) ? finalMatch.p2 : finalMatch.p1;
      let champPts = tour.pointsAward;
      let runnerUpPts = Math.floor(champPts * 0.70);

      // 记录领奖台战报（区分单打与双打）
      let semiRound = tour.rounds[tour.rounds.length - 2];
      let thirds = [];
      if (semiRound) {
        semiRound.forEach(sm => {
          let l = (sm.winner === sm.p1) ? sm.p2 : sm.p1;
          if (l) thirds.push(l.name);
        });
      }
      recordTournamentPodium(
        gameState.player.year, 
        tour.week, 
        tour.eventId + (isDoubles ? '_doubles' : ''), 
        tour.name + (isDoubles ? ' (双打)' : ''), 
        champ.name, 
        runnerUp?.name, 
        thirds
      );

      // 处理铜牌战
      if (tour.bronzeMatch && !tour.bronzeMatch.winner) {
        let bm = tour.bronzeMatch;
        let diff = (bm.p1.power || 60) - (bm.p2.power || 60);
        let p1WinRate = setWinProb(diff);
        let p1G = 0, p2G = 0;
        while (p1G < 3 && p2G < 3) { if (Math.random() < p1WinRate) p1G++; else p2G++; }
        bm.winner = p1G > p2G ? bm.p1 : bm.p2;
        bm.score = `${p1G} - ${p2G}`;
        let bLoser = p1G > p2G ? bm.p2 : bm.p1;
        let bPts = Math.floor(tour.pointsAward * 0.65);
        let fPts = Math.floor(tour.pointsAward * 0.50);

        if (isDoubles) {
          let wPair = gameState.doublesRanking?.find(p => p.name === bm.winner.name);
          let lPair = gameState.doublesRanking?.find(p => p.name === bLoser.name);
          if (wPair && !wPair.isUserPair) awardDoublesPoints(wPair, bPts);
          if (lPair && !lPair.isUserPair) awardDoublesPoints(lPair, fPts);
          if (bm.winner.isUser) {
            recordCareerMedal('B', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
          }
        } else {
          let wObj = gameState.worldRanking.find(x => x.name === bm.winner.name);
          let lObj = gameState.worldRanking.find(x => x.name === bLoser.name);
          if (wObj && !wObj.isUser) {
            recordRecentMatchForPlayer(wObj, tour.name, tour.type, "🥉 季军", bPts, "单打");
            awardPoints(wObj, bPts);
          }
          if (lObj && !lObj.isUser) {
            recordRecentMatchForPlayer(lObj, tour.name, tour.type, "殿军 (第4名)", fPts, "单打");
            awardPoints(lObj, fPts);
          }
          if (bm.winner.isUser) {
            recordCareerMedal('B', gameState.player.year, tour.week, tour.name, tour.type, "男子单打");
          }
        }
      }

      // 1. 双打冠军与亚军永久记录
      if (isDoubles) {
        let partner = gameState.playerDoubles?.currentPartner;
        let userPair = gameState.doublesRanking?.find(p => p.isUserPair);

        if (champ.isUser) {
          awardDoublesPoints(userPair, champPts);
          gameState.player.money += (tour.prizeAward || 0);
          gameState.doublesStats.titles = (gameState.doublesStats.titles || 0) + 1;
          
          // 👈 新增：精准记录玩家双打夺得的具体最高冠军头衔
          const eventShortName = tour.name.split('(')[0].replace(/第.*?届/g, '').trim();
          gameState.doublesStats.bestAchievement = `${eventShortName} 冠军 🏆`;

          if (partner) partner.titles = (partner.titles || 0) + 1;

          // 玩家和搭档两人都永久记录金牌
          recordCareerMedal(gameState.player.name, 'G', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
          if (partner) recordCareerMedal(partner.name, 'G', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
          
          accumulateDoublesTrophyStats(tour.type);
        } else {
          let champPair = gameState.doublesRanking?.find(p => p.name === champ.name);
          if (champPair) {
            awardDoublesPoints(champPair, champPts);
            // AI 组合两人永久记录金牌
            [champPair.player1?.name, champPair.player2?.name].forEach(pName => {
              if (pName) recordCareerMedal(pName, 'G', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
            });
          }
        }

        if (runnerUp.isUser) {
          awardDoublesPoints(userPair, runnerUpPts);
          recordCareerMedal(gameState.player.name, 'S', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
          if (partner) recordCareerMedal(partner.name, 'S', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
          tour.isUserKnockedOut = true;
        } else {
          let runnerPair = gameState.doublesRanking?.find(p => p.name === runnerUp.name);
          if (runnerPair) {
            awardDoublesPoints(runnerPair, runnerUpPts);
            [runnerPair.player1?.name, runnerPair.player2?.name].forEach(pName => {
              if (pName) recordCareerMedal(pName, 'S', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
            });
          }
        }
      } else {
        // 2. 单打冠军与亚军永久记录
        if (champ.isUser) {
          awardPoints(gameState.worldRanking.find(x => x.isUser), champPts);
          gameState.player.money += (tour.prizeAward || 0);
          gameState.stats.titles++;
          recordCareerMedal(gameState.player.name, 'G', gameState.player.year, tour.week, tour.name, tour.type, "男子单打");
        } else {
          let champObj = gameState.worldRanking.find(x => x.name === champ.name);
          if (champObj) {
            awardPoints(champObj, champPts);
            recordCareerMedal(champObj.name, 'G', gameState.player.year, tour.week, tour.name, tour.type, "男子单打");
          }
        }

        if (runnerUp.isUser) {
          awardPoints(gameState.worldRanking.find(x => x.isUser), runnerUpPts);
          recordCareerMedal(gameState.player.name, 'S', gameState.player.year, tour.week, tour.name, tour.type, "男子单打");
          tour.isUserKnockedOut = true;
        } else {
          let runnerObj = gameState.worldRanking.find(x => x.name === runnerUp.name);
          if (runnerObj) {
            recordCareerMedal(runnerObj.name, 'S', gameState.player.year, tour.week, tour.name, tour.type, "男子单打");
          }
        }
      }

      tour.completed = true;

      // 右下角冠军播报弹窗（单打/双打正赛决赛加冕时触发）
      showChampionToast(
        champ.isUser ? gameState.player.name : champ.name, 
        tour.name, 
        Boolean(champ.isUser), 
        isDoubles ? "双打" : "单打"
      );
    }
    // ==================== 4. 常规淘汰赛失利（半决赛/四强铜牌） ====================
    else if (!playerWonRound && !tour.isUserKnockedOut) {
      if (isSemiFinal && tour.type === 'Olympic') {
        showAlert(`止步半决赛！但奥运会设有【🥉 季军争夺战 (铜牌赛)】，你将出战铜牌赛争夺奥运奖牌！`, "进入铜牌赛", "🥉");
      } else {
        let playedRoundIdx = tour.currentRound - 1;
        let earnedPts = calculateRoundPoints(tour.pointsAward, tour.drawSize, playedRoundIdx, tour.phase);
        let rTitle = getRoundName(tour.drawSize, playedRoundIdx, tour.phase);

        if (isDoubles) {
          const userPair = gameState.doublesRanking?.find(p => p.isUserPair);
          awardDoublesPoints(userPair, earnedPts);
          let userObj = gameState.worldRanking.find(x => x.isUser);
          let partner = gameState.playerDoubles?.currentPartner;
          let partnerObj = gameState.worldRanking.find(x => x.name === partner?.name);
          recordRecentMatchForPlayer(userObj, tour.name, tour.type, rTitle, earnedPts, "双打");
          if (partnerObj) recordRecentMatchForPlayer(partnerObj, tour.name, tour.type, rTitle, earnedPts, "双打");
          
          // 👈 四强/半决赛出局记录男子双打铜牌
          if (rTitle.includes("季军") || rTitle.includes("铜牌") || isSemiFinal) {
            recordCareerMedal('B', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
          }
          showAlert(`双打比赛止步【${rTitle}】：获得 +${earnedPts} 双打积分！`);
        } else {
          awardPoints(gameState.worldRanking.find(x => x.isUser), earnedPts);
          recordRecentMatchForPlayer(gameState.worldRanking.find(x => x.isUser), tour.name, tour.type, rTitle, earnedPts, "单打");
          
          // 👈 四强/半决赛出局记录男子单打铜牌
          if (rTitle.includes("季军") || rTitle.includes("铜牌") || isSemiFinal) {
            recordCareerMedal('B', gameState.player.year, tour.week, tour.name, tour.type, "男子单打");
          }
          showAlert(`单打比赛止步【${rTitle}】：获得 +${earnedPts} 单打积分！`);
        }
        tour.isUserKnockedOut = true;
      }
    }

  // ==================== 5. 资格赛全部轮次结束：自动生成/切换正赛签表 ====================
  if (isLastRound && tour.phase === 'quali') {
    transitionQualiTourToMain(tour);
  }

  sortDoublesRanking();
  gameState.worldRanking.sort((a, b) => b.points - a.points);
}

function isTeamEventType(type) {
  if (!type || typeof type !== "string") return false;
  return type === "WTTC Team" || 
         type === "Olympic Team" || 
         type === "Men Team World Cup" || 
         type.includes("Team") || 
         type.includes("团体");
}

// 取某国候选选手池（伤势过重者不参与选拔），按积分从高到低取前 N 名进入考察范围
function getCountryCandidatePool(countryName) {
  return gameState.worldRanking
    .filter(x => x.country === countryName && x.injury !== "重度伤病")
    .slice()
    .sort((a, b) => b.points - a.points)
    .slice(0, TEAM_CANDIDATE_POOL_SIZE);
}

// 模拟一次国家队选拔：候选池综合评分 = 积分 × 年龄适配系数 × 伤病系数 × 随机波动
function runNationalTeamSelection(countryName) {
  let pool = getCountryCandidatePool(countryName);
  let scored = pool.map(pl => {
    let age = pl.age || 24;
    let ageFactor = (age >= 20 && age <= 30) ? 1.04 : ((age < 18 || age > 35) ? 0.9 : 1.0);
    let injuryFactor = (pl.injury === "健康") ? 1 : 0.8;
    let noise = 0.85 + Math.random() * 0.3; // ±15% 选拔波动：状态、临场发挥、教练组主观倾向等
    return { player: pl, score: pl.points * ageFactor * injuryFactor * noise };
  });
  scored.sort((a, b) => b.score - a.score);
  let selected = scored.slice(0, NATIONAL_TEAM_SIZE).map(s => s.player);
  return {
    country: countryName,
    poolSize: pool.length,
    allScored: scored,
    selected: selected,
    selectedNames: new Set(selected.map(s => s.name))
  };
}


function computeTeamAvgPower(roster) {
  let vals = roster.map(pl => pl.isUser ? computeUserCombatPower() : (pl.basePow || 55) + Math.random() * 4);
  return vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
}

// 按照真实斯韦思林杯 (Swaythling Cup) 赛制排兵布阵：5 场比赛顺序固定为
// 单打(A1 vs B2) → 单打(A2 vs B1) → 双打 → 单打(A1 vs B1) → 单打(A2 vs B2)，
// 先赢 3 场即结束整个对抗（Tie），并非全部 5 场都会打满。
// 出战 5 人名单中，位次 0/1 为主力单打，位次 0+2 搭档双打，位次 3/4 为替补席，
// 意味着即便入选了国家队，某一场具体对抗中也未必每次都会被排上场——更贴近现实团体赛的排兵布阵。
function buildTieLineup(teamA, teamB) {
  let a = teamA.roster, b = teamB.roster;
  const idx = (arr, i) => arr[i % arr.length];
  return [
    { label: '第1场单打', kind: 'singles', aP: [idx(a, 0)], bP: [idx(b, 1)] },
    { label: '第2场单打', kind: 'singles', aP: [idx(a, 1)], bP: [idx(b, 0)] },
    { label: '第3场双打', kind: 'doubles', aP: [idx(a, 0), idx(a, 2)], bP: [idx(b, 0), idx(b, 2)] },
    { label: '第4场单打', kind: 'singles', aP: [idx(a, 0)], bP: [idx(b, 0)] },
    { label: '第5场单打', kind: 'singles', aP: [idx(a, 1)], bP: [idx(b, 1)] }
  ];
}

// 计算某一场（单打为1人，双打为2人）的综合战力：双打额外叠加"配合默契"随机浮动
function rubberSidePower(players) {
  let vals = players.map(pl => (pl.isUser ? computeUserCombatPower() : (pl.basePow || 55)) + rollMatchDayForm());
  let base = vals.reduce((s, v) => s + v, 0) / vals.length;
  if (players.length === 2) base += (Math.random() * 8 - 3); // 双打配合浮动：默契好可加成，配合生疏也可能减分
  return base;
}

// 确保任意国家都拥有由真实姓名国手组成的 5 人代表队名单（杜绝“替补选手”）
function getOrCreateFullCountryTeam(countryName, byCountryMap) {
  let existing = (byCountryMap[countryName] || []).filter(x => !isPlayerSeverelyInjured(x));
  let roster = existing.slice(0, NATIONAL_TEAM_SIZE);
  
  // 若该国在排名前 500 中不足 5 人，使用该国籍真实本地化命名库补齐新秀国手
  while (roster.length < NATIONAL_TEAM_SIZE) {
    let dummyName = generateUniqueRookieName(countryName);
    let rookieObj = {
      name: dummyName,
      country: countryName,
      age: 16 + Math.floor(Math.random() * 7),
      style: "两面弧圈结合快攻",
      basePow: 46 + Math.floor(Math.random() * 8),
      points: 20 + Math.floor(Math.random() * 30),
      isUser: false
    };
    roster.push(rookieObj);
  }
  return roster;
}

// 单场团体对抗（Tie）：最多 5 场比赛（含 1 场双打），先赢 3 场获胜；
// 若名单中含玩家本人，其对应场次由玩家真实属性出战，未被排入本次 Tie 的选手视为轮休替补
function simulateTeamTie(teamA, teamB) {
  let aWins = 0, bWins = 0;
  let rubberLogs = [];
  let lineup = buildTieLineup(teamA, teamB);
  for (let i = 0; i < lineup.length && aWins < 3 && bWins < 3; i++) {
    let rub = lineup[i];
    let aPow = rubberSidePower(rub.aP);
    let bPow = rubberSidePower(rub.bP);
    let aWinProb = setWinProb(aPow - bPow);
    let aG = 0, bG = 0;
    while (aG < 3 && bG < 3) { if (Math.random() < aWinProb) aG++; else bG++; }
    if (aG > bG) aWins++; else bWins++;
    
    let isAUser = rub.aP.some(p => p.isUser);
    let isBUser = rub.bP.some(p => p.isUser);
    let involvesUser = isAUser || isBUser;

    // ====== 新增：团体赛单打对决记录进 H2H 与生涯数据 ======
    if (involvesUser && rub.kind === 'singles') {
      let userWonRubber = isAUser ? (aG > bG) : (bG > aG);
      let oppPlayer = isAUser ? rub.bP[0] : rub.aP[0];
      let oppName = oppPlayer ? oppPlayer.name : "对手";
      let userGames = isAUser ? aG : bG;
      let oppGames = isAUser ? bG : aG;

      // 1. 记录 H2H 历史交锋
      if (!gameState.h2hData[oppName]) {
        gameState.h2hData[oppName] = { wins: 0, losses: 0, matches: [] };
      }
      if (userWonRubber) {
        gameState.h2hData[oppName].wins++;
      } else {
        gameState.h2hData[oppName].losses++;
      }

      let teName = gameState.currentTeamEvent ? gameState.currentTeamEvent.name : "团体赛";
      gameState.h2hData[oppName].matches.unshift({
        week: gameState.player.week,
        year: gameState.player.year,
        event: `${teName} (${rub.label})`,
        score: `${userGames}-${oppGames}`,
        win: userWonRubber
      });

      // 2. 累加玩家与对手的生涯总胜负场次与连胜
      const s = gameState.stats;
      s.totalMatches++;
      if (userWonRubber) {
        s.wins++;
        s.currentStreak = (s.currentStreak || 0) + 1;
        if (s.currentStreak > (s.bestStreak || 0)) s.bestStreak = s.currentStreak;
      } else {
        s.losses++;
        s.currentStreak = 0;
      }

      // 3. 决胜局与 Top 10 判定
      if (aG + bG === 5) {
        s.decidingMatchesPlayed = (s.decidingMatchesPlayed || 0) + 1;
        if (userWonRubber) s.decidingMatchesWon = (s.decidingMatchesWon || 0) + 1;
      }
      let oppRankIdx = gameState.worldRanking.findIndex(x => x.name === oppName);
      if (oppRankIdx >= 0 && (oppRankIdx + 1) <= 10) {
        s.top10MatchesPlayed = (s.top10MatchesPlayed || 0) + 1;
        if (userWonRubber) s.top10MatchesWon = (s.top10MatchesWon || 0) + 1;
      }

      // 4. 同步双方排行榜对象上的胜负场数
      let userObj = gameState.worldRanking.find(x => x.isUser);
      let oppObj = gameState.worldRanking.find(x => x.name === oppName);
      if (userObj) {
        if (userWonRubber) userObj.careerWins = (userObj.careerWins || 0) + 1;
        else userObj.careerLosses = (userObj.careerLosses || 0) + 1;
      }
      if (oppObj) {
        if (userWonRubber) oppObj.careerLosses = (oppObj.careerLosses || 0) + 1;
        else oppObj.careerWins = (oppObj.careerWins || 0) + 1;
      }

      // 5. 写入比赛历史流水日志
      let logText = `[${gameState.player.year}年 第${gameState.player.week}周 | ${teName}] ${rub.label} 对决 【${oppName}】，比分 ${userGames}-${oppGames} (${userWonRubber ? '🔥 获胜' : '❌ 失利'})`;
      gameState.matchHistory.unshift(logText);
    }
    // ========================================================

    rubberLogs.push({
      label: rub.label,
      kind: rub.kind,
      a: rub.aP.map(p => p.name).join(' / '),
      b: rub.bP.map(p => p.name).join(' / '),
      score: `${aG}-${bG}`,
      winner: aG > bG ? 'A' : 'B',
      involvesUser: involvesUser
    });
  }
  return { aWins, bWins, rubberLogs, winner: aWins > bWins ? 'A' : 'B' };
}

function getTeamRoundName(drawSize, roundIdx) {
  let totalRounds = Math.log2(drawSize);
  let roundsLeft = totalRounds - roundIdx;
  if (roundsLeft === 1) return "🥈 团体赛亚军";
  if (roundsLeft === 2) return "团体赛四强 (半决赛出局)";
  if (roundsLeft === 3) return "团体赛八强 (1/4决赛出局)";
  return "团体赛16强 (首轮出局)";
}

// 4 队循环赛赛程：3 轮，每轮 2 场对抗，全部队伍两两交手一次
function buildGroupSchedule() {
  return [
    { matchday: 0, aIdx: 0, bIdx: 1, played: false, tieResult: null, score: "" },
    { matchday: 0, aIdx: 2, bIdx: 3, played: false, tieResult: null, score: "" },
    { matchday: 1, aIdx: 0, bIdx: 2, played: false, tieResult: null, score: "" },
    { matchday: 1, aIdx: 1, bIdx: 3, played: false, tieResult: null, score: "" },
    { matchday: 2, aIdx: 0, bIdx: 3, played: false, tieResult: null, score: "" },
    { matchday: 2, aIdx: 1, bIdx: 2, played: false, tieResult: null, score: "" }
  ];
}

// 按实力分档（Pot）抽签分组，避免强队扎堆同组：各档种子队伍打乱后平均分配进每个小组，
// 保证强弱搭配、更贴近真实赛事的分组抽签逻辑。teams.length 必须等于 numGroups * TEAM_GROUP_SIZE。
function buildGroupStage(teams, numGroups) {
  let sorted = teams.slice().sort((a, b) => (b.points || 0) - (a.points || 0) || ((b.power || 0) - (a.power || 0)));
  let groups = [];
  for (let g = 0; g < numGroups; g++) {
    groups.push({ id: String.fromCharCode(65 + g), teams: [], matches: buildGroupSchedule() });
  }
  let potCount = Math.ceil(sorted.length / numGroups);
  for (let pot = 0; pot < potCount; pot++) {
    let potTeams = sorted.slice(pot * numGroups, pot * numGroups + numGroups);
    potTeams.sort(() => Math.random() - 0.5); // 档内打乱，制造合理随机性
    potTeams.forEach((t, i) => {
      if (!groups[i]) return;
      t.groupStats = { tieW: 0, tieL: 0, rubW: 0, rubL: 0 };
      groups[i].teams.push(t);
    });
  }
  return { groups: groups, matchday: 0, totalMatchdays: 3, completed: false };
}

// 小组内排名：胜场数优先，其次比较盘次净胜（斯韦思林杯 Tie 内单打/双打总局面比分差），最后随机破僵
function rankGroupTeams(group) {
  return group.teams.slice().sort((a, b) => {
    let s = a.groupStats, t = b.groupStats;
    return (t.tieW - s.tieW) || ((t.rubW - t.rubL) - (s.rubW - s.rubL)) || (Math.random() - 0.5);
  });
}

// 推进小组赛当前轮次：模拟本轮全部小组的对抗；3 轮全部打完后自动结算出线名单并组建淘汰赛正赛
// 推进小组赛当前轮次：模拟本轮全部小组的对抗；3 轮打完后仅标记完成，停留界面供玩家查看完整成绩
function advanceGroupRound() {
  let te = gameState.currentTeamEvent;
  if (!te || !te.groupStage || te.groupStage.completed) return;
  let gs = te.groupStage;

  gs.groups.forEach(group => {
    group.matches.filter(m => m.matchday === gs.matchday).forEach(m => {
      let teamA = group.teams[m.aIdx], teamB = group.teams[m.bIdx];
      let tie = simulateTeamTie(teamA, teamB);
      m.tieResult = tie;
      m.score = `${tie.aWins} - ${tie.bWins}`;
      m.played = true;
      if (tie.winner === 'A') { teamA.groupStats.tieW++; teamB.groupStats.tieL++; }
      else { teamB.groupStats.tieW++; teamA.groupStats.tieL++; }
      teamA.groupStats.rubW += tie.aWins; teamA.groupStats.rubL += tie.bWins;
      teamB.groupStats.rubW += tie.bWins; teamB.groupStats.rubL += tie.aWins;
    });
  });

  // 如果刚刚打完第 3 轮（最后一场小组赛）
  if (gs.matchday >= gs.totalMatchdays - 1) {
    gs.completed = true; // 标记小组赛已全部打完，但不立即跳入淘汰赛，留给玩家查看
    saveGame();
    updateUI();
    return;
  }

  gs.matchday++;
  saveGame();
  updateUI();
}

// 供玩家手动点击“进入/查看淘汰赛正赛 ➔”时触发的过渡函数
function proceedToKnockoutStage() {
  let te = gameState.currentTeamEvent;
  if (!te || !te.groupStage) return;
  finalizeGroupStage();
  saveGame();
  updateUI();
}

// 小组循环赛全部结束：结算各组前 2 名出线，并据此组建淘汰赛正赛对阵树；
// 若玩家代表队未能出线，立即结算本站个人积分与战绩（结算逻辑与淘汰赛出局共用"只结算一次"原则）
function finalizeGroupStage() {
  let te = gameState.currentTeamEvent;
  let gs = te.groupStage;

  let qualifiers = [];
  let userGroupInfo = null;
  gs.groups.forEach(group => {
    let ranked = rankGroupTeams(group);
    group.finalRanking = ranked;
    qualifiers.push(ranked[0], ranked[1]);
    let uIdx = ranked.findIndex(t => t.isUser);
    if (uIdx >= 0) userGroupInfo = { groupId: group.id, rank: uIdx + 1, qualified: uIdx < 2 };

    // ====== 【新增：为小组第 3、4 名出局的 AI 队伍队员记录战绩】 ======
    ranked.slice(2).forEach((team, idx) => {
      if (!team.isUser && team.roster) {
        let rankNum = idx + 3;
        let pts = Math.floor(te.pointsAward * (rankNum === 3 ? 0.12 : 0.08));
        let label = `小组第 ${rankNum} 名出局`;
        team.roster.forEach(pl => {
          let plObj = gameState.worldRanking.find(x => x.name === pl.name);
          if (plObj && !plObj.isUser) {
            recordRecentMatchForPlayer(plObj, te.name, te.type, label, pts);
            awardPoints(plObj, pts);
          }
        });
      }
    });
    // ==============================================================
  });

  if (userGroupInfo && !userGroupInfo.qualified && !te.userResultRecorded) {
    recordUserTeamGroupExit(userGroupInfo);
  }

  te.phase = 'knockout';
  te.bracket = buildTeamKnockoutBracket(qualifiers, qualifiers.length);
}

// 记录小组赛未出线（未晋级淘汰赛正赛）的个人积分结算：给分低于淘汰赛首轮出局，体现小组未出线的现实差距
function recordUserTeamGroupExit(info) {
  let te = gameState.currentTeamEvent;
  let pts = Math.floor(te.pointsAward * (info.rank === 3 ? 0.12 : 0.08));
  let resultLabel = `小组赛第 ${info.rank} 名出局（${info.groupId} 组，未晋级淘汰赛正赛）`;

  let userItem = gameState.worldRanking.find(x => x.isUser);
  awardPoints(userItem, pts);
  recordRecentMatchForPlayer(userItem, te.name, te.type, resultLabel, pts);

  te.userResultRecorded = true;
  te.userWon = false;
  te.userResultText = `${resultLabel}！团体赛积分 +${pts}。`;
}

// 点击小组赛中已完赛的某场对抗大比分，复用淘汰赛同款弹窗查看逐场明细
function openGroupTieModal(groupId, matchIdx) {
  let te = gameState.currentTeamEvent;
  if (!te || !te.groupStage) return;
  let group = te.groupStage.groups.find(g => g.id === groupId);
  if (!group) return;
  let m = group.matches[matchIdx];
  if (!m || !m.tieResult) return;
  let teamA = group.teams[m.aIdx], teamB = group.teams[m.bIdx];
  let aWin = m.tieResult.winner === 'A';

  document.getElementById('tie-modal-round').innerText = `小组赛 ${group.id} 组 · 第 ${m.matchday + 1} 轮`;
  document.getElementById('tie-modal-t1').innerText = teamA.name;
  document.getElementById('tie-modal-t1').className = 'side' + (aWin ? ' win' : '');
  document.getElementById('tie-modal-t2').innerText = teamB.name;
  document.getElementById('tie-modal-t2').className = 'side' + (!aWin ? ' win' : '');
  document.getElementById('tie-modal-score').innerText = `${m.tieResult.aWins} : ${m.tieResult.bWins}`;

  let userInLineup = m.tieResult.rubberLogs.some(rl => rl.involvesUser);
  let bodyHtml = '';
  if (!userInLineup && (teamA.isUser || teamB.isUser)) {
    bodyHtml += `<div style="font-size:0.82rem; padding:8px 0 14px; color:var(--text-dim);">💺 本场对抗教练组排出的出战顺位中未包含你——即便入选了国家队大名单，具体某一场 Tie 也未必每次都会被排上场，安心在替补席为队友加油，结果依然会计入你的团体赛荣誉。</div>`;
  }
  m.tieResult.rubberLogs.forEach(rl => {
    let winnerName = rl.winner === 'A' ? teamA.name : teamB.name;
    let kindTag = rl.kind === 'doubles' ? '<span class="rubber-kind doubles">双打</span>' : '<span class="rubber-kind">单打</span>';
    bodyHtml += `<div class="rubber-row ${rl.involvesUser ? 'user-row' : ''}">
      ${kindTag}
      <span class="rubber-label">${rl.label}</span>
      <span class="rubber-players">${rl.a} vs ${rl.b}</span>
      <span class="rubber-score">${rl.score}</span>
    </div><div style="text-align:right; font-size:0.72rem; color:var(--text-dim); margin:-4px 0 8px;">${winnerName} 胜</div>`;
  });
  document.getElementById('tie-modal-body').innerHTML = bodyHtml;

  document.getElementById('tie-detail-modal').style.display = 'flex';
}

// 渲染小组赛面板：每组一张卡片，展示实时积分榜（含出线名次高亮）与本组全部 3 轮赛程/比分
// 渲染小组赛面板：玩家所在组置顶重点展示 + 其余小组网格化自适应排版
function renderGroupStagePanel(gs, root) {
  // 1. 寻找玩家所在的代表队和小组
  let userGroup = gs.groups.find(g => g.teams.some(t => t.isUser));

  // 2. 如果玩家有参与，优先渲染置顶焦点大看板
  if (userGroup) {
    let focusDiv = document.createElement('div');
    focusDiv.className = 'user-focus-group-banner';

    let ranked = userGroup.finalRanking || rankGroupTeams(userGroup);
    let rowsHtml = ranked.map((t, i) => {
      let s = t.groupStats;
      return `<tr class="${t.isUser ? 'is-user' : ''} ${i < 2 ? 'qualified' : ''}">
        <td>${i < 2 ? '⭐ ' : ''}${i + 1}</td>
        <td><strong>${t.name}</strong>${t.isUser ? ' <span style="color:var(--accent); font-size:0.75rem;">(我方代表队)</span>' : ''}</td>
        <td>${s.tieW}胜 - ${s.tieL}负</td>
        <td>${s.rubW > s.rubL ? '+' : ''}${s.rubW - s.rubL} (${s.rubW}:${s.rubL})</td>
      </tr>`;
    }).join('');

    let matchesHtml = userGroup.matches.map((m, mIdx) => {
      let teamA = userGroup.teams[m.aIdx], teamB = userGroup.teams[m.bIdx];
      let cls = `group-tie-row ${m.played ? 'clickable' : ''} ${(teamA.isUser || teamB.isUser) ? 'user-tie' : ''}`;
      let onclickAttr = m.played ? ` onclick="openGroupTieModal('${userGroup.id}', ${mIdx})"` : '';
      return `<div class="${cls}"${onclickAttr}>
        <span class="gt-md">第 ${m.matchday + 1} 轮</span>
        <span class="gt-teams">${teamA.name} vs ${teamB.name}</span>
        <span class="gt-score">${m.played ? m.score : '<span style="font-size:0.75rem; color:var(--text-dim);">未开赛</span>'}</span>
      </div>`;
    }).join('');

    focusDiv.innerHTML = `
      <div class="user-focus-header">
        <div class="user-focus-title">🔥 我方所在组：${userGroup.id} 组 出线形势与对决</div>
        <span class="badge badge-gold" style="font-size:0.8rem;">小组前 2 名晋级 16 强淘汰赛</span>
      </div>
      <div class="user-focus-grid">
        <div>
          <table class="group-table" style="font-size:0.9rem;">
            <thead><tr><th>排名</th><th>代表队</th><th>胜负场</th><th>盘次净胜</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
        <div>
          <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:8px; font-weight:bold;">📅 小组赛全赛程与比分（点击已完赛场次可查看逐场明细）</div>
          <div class="group-matches">${matchesHtml}</div>
        </div>
      </div>
    `;
    root.appendChild(focusDiv);
  }

  // 3. 渲染其余所有小组的小卡片列表
  let sectionTitle = document.createElement('div');
  sectionTitle.style = "font-size:0.95rem; font-weight:bold; color:var(--text-dim); margin: 16px 0 12px 4px;";
  sectionTitle.innerText = "🌐 本届团体赛全部小组积分榜 (All Groups)";
  root.appendChild(sectionTitle);

  let wrap = document.createElement('div');
  wrap.className = 'group-stage-wrap';

  gs.groups.forEach(group => {
    let ranked = group.finalRanking || rankGroupTeams(group);
    let rowsHtml = ranked.map((t, i) => {
      let s = t.groupStats;
      return `<tr class="${t.isUser ? 'is-user' : ''} ${i < 2 ? 'qualified' : ''}">
        <td>${i + 1}</td>
        <td>${t.name}${t.isUser ? ' (你)' : ''}</td>
        <td>${s.tieW}-${s.tieL}</td>
        <td>${s.rubW - s.rubL > 0 ? '+' : ''}${s.rubW - s.rubL}</td>
      </tr>`;
    }).join('');

    let matchesHtml = group.matches.map((m, mIdx) => {
      let teamA = group.teams[m.aIdx], teamB = group.teams[m.bIdx];
      let cls = `group-tie-row ${m.played ? 'clickable' : ''} ${(teamA.isUser || teamB.isUser) ? 'user-tie' : ''}`;
      let onclickAttr = m.played ? ` onclick="openGroupTieModal('${group.id}', ${mIdx})"` : '';
      return `<div class="${cls}"${onclickAttr}>
        <span class="gt-md">W${m.matchday + 1}</span>
        <span class="gt-teams">${teamA.name} vs ${teamB.name}</span>
        <span class="gt-score">${m.played ? m.score : '—'}</span>
      </div>`;
    }).join('');

    let card = document.createElement('div');
    card.className = 'group-card';
    card.innerHTML = `
      <div class="group-card-title">
        <span>${group.id} 组</span>
        <span style="color:var(--text-dim); font-weight:400; font-size:0.72rem;">前 2 名出线</span>
      </div>
      <table class="group-table">
        <thead><tr><th>名次</th><th>代表队</th><th>胜负</th><th>净胜</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="group-matches">${matchesHtml}</div>
    `;
    wrap.appendChild(card);
  });

  root.appendChild(wrap);
}

// 报名/选拔入口：点击【查看国家队选拔结果】触发
function startTeamEvent() {
  const p = gameState.player;
  const curEvent = getEventForWeekAndYear(p.week, p.year);

  let selection = runNationalTeamSelection(p.country);
  let userSelected = selection.selectedNames.has(p.name);
  let userPoolRank = selection.allScored.findIndex(s => s.player.name === p.name) + 1;
  if (userPoolRank <= 0) userPoolRank = selection.poolSize + 1; // 若积分过低甚至未进入候选池考察范围

  gameState.currentTeamEvent = {
    week: p.week,
    name: curEvent.name,
    type: curEvent.type,
    pointsAward: curEvent.points,
    prizeAward: curEvent.prize,
    userSelected: userSelected,
    userTeam: selection.selected.map(x => x.name),
    userCountry: p.country,
    poolSize: selection.poolSize,
    userPoolRank: userPoolRank,
    completed: false,
    phase: 'group',
    groupStage: null,
    bracket: null,
    resultText: "",
    finalResultText: ""
  };

  if (!userSelected) {
    let namesList = selection.selected.map(x => x.name).join('、') || "（该国候选选手不足，本次未能组队）";
    gameState.currentTeamEvent.completed = true;
    gameState.currentTeamEvent.resultText =
      `📋 <strong>国家队选拔结果公布</strong><br>${p.country} 本次团体赛出战名单：<strong>${namesList}</strong><br>` +
      `本国共有 ${selection.poolSize} 名选手进入选拔考察范围，你的综合评估排名第 <strong>${userPoolRank}</strong> 位，很遗憾未能入选。` +
      (selection.poolSize >= NATIONAL_TEAM_SIZE + 3
        ? "（本国选手竞争十分激烈，即便积分不低，队内深度太大，也很难保证每次都能入选，这正是强国选手的常态。）"
        : "（可能是伤病或状态波动导致落选，继续保持状态，下次选拔再争取名额！）") +
      `<br>本站你无法参赛，积分不受影响。`;
    saveGame();
    updateUI();
    return;
  }

  // ---- 入选：先组建小组赛阶段，组内循环赛前 2 名出线后再产生淘汰赛正赛（更贴近真实团体世锦赛赛制）----
  // 正赛规模取自赛历配置（WTTC Teams 为 32 队，混合团体世界杯为 16 队等），并向下取整为 4 的倍数以凑满整小组
  let rawFieldSize = (curEvent.drawSize && curEvent.drawSize >= 8) ? curEvent.drawSize : 16;
  let fieldSize = Math.max(TEAM_GROUP_SIZE * 2, Math.round(rawFieldSize / TEAM_GROUP_SIZE) * TEAM_GROUP_SIZE);
  let numGroups = fieldSize / TEAM_GROUP_SIZE;
  let knockoutSize = fieldSize / 2; // 各组前 2 名出线，晋级淘汰赛正赛的队伍总数

  // 1. 整理各国选手
  let byCountry = {};
  gameState.worldRanking.forEach(x => {
    if (isPlayerSeverelyInjured(x)) return;
    if (!byCountry[x.country]) byCountry[x.country] = [];
    byCountry[x.country].push(x);
  });

  // 2. 从全球 60+ 国家库中按实力排序挑选参赛代表队
  let allCountryList = Object.keys(byCountry);
  COUNTRIES_GLOBAL.forEach(c => {
    if (!allCountryList.includes(c)) allCountryList.push(c);
  });
  if (!allCountryList.includes(p.country)) allCountryList.unshift(p.country);

  let countryStrength = allCountryList.map(c => {
    let top5 = (byCountry[c] || []).slice().sort((a, b) => b.points - a.points).slice(0, NATIONAL_TEAM_SIZE);
    return { country: c, sumPoints: top5.reduce((s, x) => s + x.points, 0) };
  }).sort((a, b) => b.sumPoints - a.sumPoints);

  let field = countryStrength.slice(0, fieldSize);
  // 保证玩家代表队一定有席位
  if (!field.find(f => f.country === p.country)) {
    field[field.length - 1] = { country: p.country, sumPoints: p.points };
  }

  // 3. 构建全部代表队名单（全部为真实国籍与真实选手/新秀国手）
  let teams = field.map(f => {
    if (f.country === p.country) {
      let userRoster = selection.selected.slice();
      while (userRoster.length < NATIONAL_TEAM_SIZE) {
        userRoster.push({
          name: generateUniqueRookieName(p.country),
          country: p.country,
          basePow: 50,
          points: 30,
          isUser: false
        });
      }
      return { name: f.country, country: f.country, roster: userRoster, isUser: true, power: computeTeamAvgPower(userRoster), points: f.sumPoints };
    } else {
      let roster = getOrCreateFullCountryTeam(f.country, byCountry);
      return { name: f.country, country: f.country, roster: roster, isUser: false, power: computeTeamAvgPower(roster), points: f.sumPoints };
    }
  });
  // 若符合条件的代表队数量不足以凑满整数个小组，用弱旅外卡占位补满，确保每组都是完整的 4 队循环赛
  let wildcardIdx = 1;
  while (teams.length < fieldSize) {
    teams.push({ name: `外卡邀请队 ${wildcardIdx}`, country: "中立外卡", roster: [{ name: "替补选手", basePow: 42, isUser: false }], isUser: false, power: 42, points: 0 });
    wildcardIdx++;
  }

  gameState.currentTeamEvent.phase = 'group';
  gameState.currentTeamEvent.groupStage = buildGroupStage(teams, numGroups);
  gameState.currentTeamEvent.bracket = null;

  let userGroup = gameState.currentTeamEvent.groupStage.groups.find(g => g.teams.some(t => t.isUser));
  let userGroupId = userGroup ? userGroup.id : '?';

  // 队伍实力预览：按选拔综合评分列出出战 5 人名单及各自战力，方便玩家判断队伍强弱
  let rosterPreview = selection.selected.map((pl, i) => {
    let role = i === 0 ? '主力一单' : i === 1 ? '主力二单' : i === 2 ? '双打搭档' : '替补席';
    let pow = pl.isUser ? computeUserCombatPower() : (pl.basePow || 55);
    return `${pl.name}${pl.isUser ? '（你）' : ''} [${role} · 战力${pow.toFixed(0)}]`;
  }).join('、');

  gameState.currentTeamEvent.resultText =
    `🎉 恭喜！你成功入选 <strong>${p.country}</strong> 代表队！<br>正式出战 5 人名单：${rosterPreview}<br>` +
    `团体赛采用国际乒联斯韦思林杯赛制：单打→单打→双打→单打→单打，先胜 3 场获胜。<br>` +
    `本站团体赛共 ${fieldSize} 支代表队参赛，先分为 ${numGroups} 个小组（每组 ${TEAM_GROUP_SIZE} 队循环赛），` +
    `各组前 2 名出线，晋级 ${knockoutSize} 强淘汰赛正赛。<br>你的代表队被分在 <strong>${userGroupId} 组</strong>，点击下方按钮开始小组赛第一轮！`;

  // 团体赛周同样计入连续参赛的体能消耗与伤病风险，与个人赛事保持一致
  checkAndTriggerPlayerInjury(true);
  saveGame();
  updateUI();
}

// 推进团体赛：根据当前所处阶段（小组循环赛 / 淘汰赛正赛）自动分发到对应的推进逻辑，
// 供界面按钮统一调用，无需玩家关心内部阶段切换。
function advanceTeamRound() {
  let te = gameState.currentTeamEvent;
  if (!te || te.completed) return;
  if (te.phase === 'group' && te.groupStage && !te.groupStage.completed) {
    advanceGroupRound();
    return;
  }
  advanceKnockoutRound();
}

// 推进淘汰赛正赛一轮：模拟本轮全部对抗（Tie），玩家所在的对抗会附带详细单打战报
// 推进淘汰赛正赛一轮
function advanceKnockoutRound() {
  let te = gameState.currentTeamEvent;
  if (!te || !te.bracket || te.completed) return;
  let br = te.bracket;
  let roundMatches = br.rounds[br.currentRound];
  let p = gameState.player;
  let isLastRound = br.currentRound === br.rounds.length - 1;

  roundMatches.forEach(m => {
    if (m.winner) return;
    if (m.t1 && m.t2) {
      let tie = simulateTeamTie(m.t1, m.t2);
      m.tieResult = tie;
      m.score = `${tie.aWins} - ${tie.bWins}`;
      m.winner = tie.winner === 'A' ? m.t1 : m.t2;
    } else {
      m.winner = m.t1 || m.t2;
    }

    // ====== 【新增：为本轮落败的非决赛 AI 队伍结算积分与战绩】 ======
    if (!isLastRound && m.winner) {
      let loserTeam = (m.winner === m.t1) ? m.t2 : m.t1;
      if (loserTeam && loserTeam.roster && !loserTeam.isUser) {
        let isSemi = (br.rounds.length - br.currentRound === 2);
        let roundLabel = isSemi ? "🥉 季军 (半决赛)" : getTeamRoundName(br.drawSize, br.currentRound);
        let pts = Math.floor(te.pointsAward * ((br.currentRound + 1) / (br.rounds.length + 1)));
        loserTeam.roster.forEach(pl => {
          let plObj = gameState.worldRanking.find(x => x.name === pl.name);
          if (plObj && !plObj.isUser) {
            recordRecentMatchForPlayer(plObj, te.name, te.type, roundLabel, pts, "团体");
            awardPoints(plObj, pts);
          }
        });
      }
    }
    // ==============================================================
  });

  let nextRound = br.rounds[br.currentRound + 1];
  if (nextRound) {
    for (let i = 0; i < roundMatches.length; i++) {
      let slot = nextRound[Math.floor(i / 2)];
      if (i % 2 === 0) slot.t1 = roundMatches[i].winner; else slot.t2 = roundMatches[i].winner;
    }
  }

  // 玩家代表队的个人积分/战绩结算
  if (!te.userResultRecorded) {
    let userTie = roundMatches.find(m => m.t1?.isUser || m.t2?.isUser);
    if (userTie) {
      if (userTie.winner.country !== p.country) {
        recordUserTeamResult(br.currentRound, false);
      } else if (isLastRound) {
        recordUserTeamResult(br.currentRound, true);
      }
    }
  }

  if (isLastRound) {
    finalizeTeamEvent();
    return;
  }

  br.currentRound++;
  saveGame();
  updateUI();
}

// 记录玩家个人这一站团体赛的积分与战绩（只会触发一次：出局时或夺冠时）
// 记录玩家个人这一站团体赛的积分与战绩（只会触发一次：出局时或夺冠时）
function recordUserTeamResult(roundIdx, won) {
  let te = gameState.currentTeamEvent;
  let p = gameState.player;
  let pts, resultLabel;

  if (won) {
    pts = te.pointsAward;
    resultLabel = "🏆 团体赛冠军";
    gameState.stats.titles++;
    gameState.stats.titlesMajor = (gameState.stats.titlesMajor || 0) + 1;
    gameState.stats.bestSmashResult = gameState.stats.bestSmashResult === "未入围" ? "团体赛冠军 🏆" : gameState.stats.bestSmashResult;
    p.money += te.prizeAward;
    gameState.stats.totalPrizeWon = (gameState.stats.totalPrizeWon || 0) + te.prizeAward;

    // 【修改】：团体赛不计入奖牌榜，移除这行
    // recordCareerMedal('G', gameState.player.year, te.week, te.name, te.type, "男子团体");

    showChampionToast(p.country + " 代表队", te.name, true, "团体", p.country);
  } else {
    pts = Math.floor(te.pointsAward * ((roundIdx + 1) / (te.bracket.rounds.length + 1)));
    resultLabel = getTeamRoundName(te.bracket.drawSize, roundIdx);

    // 【修改】：团体赛不计入奖牌榜，移除银牌/铜牌记录
    /*
    if (roundIdx === te.bracket.rounds.length - 1) {
      recordCareerMedal('S', gameState.player.year, te.week, te.name, te.type, "男子团体");
    } else if (roundIdx === te.bracket.rounds.length - 2) {
      recordCareerMedal('B', gameState.player.year, te.week, te.name, te.type, "男子团体");
    }
    */
  }

  let userItem = gameState.worldRanking.find(x => x.isUser);
  awardPoints(userItem, pts);
  recordRecentMatchForPlayer(userItem, te.name, te.type, resultLabel, pts);

  te.userResultRecorded = true;
  te.userWon = won;
  te.userResultText = `${resultLabel}！团体赛积分 +${pts}${won ? `，奖金 +$${te.prizeAward.toLocaleString()}` : ''}。`;
}

// 全部轮次跑完、冠军代表队产生后，正式结束本站团体赛事
function finalizeTeamEvent() {
  let te = gameState.currentTeamEvent;
  let br = te.bracket;
  let finalMatch = br.rounds[br.rounds.length - 1][0];
  let champion = finalMatch ? finalMatch.winner : null;

  te.completed = true;

  let championLine = champion ? `🏆 本届团体赛冠军：<strong>${champion.name}</strong>` : '';
  if (te.userResultRecorded) {
    te.finalResultText = te.userWon ? te.userResultText : `${te.userResultText}<br>${championLine}`;
  } else {
    te.finalResultText = championLine || '本届团体赛已结束。';
  }

  if (finalMatch && finalMatch.winner) {
    let champTeam = finalMatch.winner;
    let runnerUpTeam = (finalMatch.winner === finalMatch.t1 ? finalMatch.t2 : finalMatch.t1);
    let semiRound = br.rounds[br.rounds.length - 2];
    let thirds = [];
    if (semiRound) {
      semiRound.forEach(sm => {
        let loser = sm.winner === sm.t1 ? sm.t2 : sm.t1;
        if (loser) thirds.push(loser.name);
      });
    }

    // 记录领奖台
    recordTournamentPodium(gameState.player.year, te.week, "team_event", te.name, champTeam.name, runnerUpTeam?.name, thirds);

    // 结算冠军队伍
    if (champTeam && champTeam.roster && !champTeam.isUser) {
      champTeam.roster.forEach(pl => {
        let plObj = gameState.worldRanking.find(x => x.name === pl.name);
        if (plObj && !plObj.isUser) {
          recordRecentMatchForPlayer(plObj, te.name, te.type, "🏆 团体赛冠军", te.pointsAward, "团体");
          awardPoints(plObj, te.pointsAward);
        }
      });
      showChampionToast(champTeam.name, te.name, false, "团体", champTeam.country || champTeam.name);
    }

    // 结算亚军队伍
    if (runnerUpTeam && runnerUpTeam.roster && !runnerUpTeam.isUser) {
      let runnerPts = Math.floor(te.pointsAward * 0.7);
      runnerUpTeam.roster.forEach(pl => {
        let plObj = gameState.worldRanking.find(x => x.name === pl.name);
        if (plObj && !plObj.isUser) {
          recordRecentMatchForPlayer(plObj, te.name, te.type, "🥈 团体赛亚军", runnerPts, "团体");
          awardPoints(plObj, runnerPts);
        }
      });
    }
  }

  saveGame();
  updateUI();
}

function renderTeamEventPanel() {
  const root = document.getElementById('bracket-root');
  const infoBox = document.getElementById('team-event-info');
  if (!root || !infoBox) return;
  let te = gameState.currentTeamEvent;
  const p = gameState.player;
  const curEvent = getEventForWeekAndYear(p.week, p.year);

  if (!isTeamEventType(curEvent.type)) return; // 非团体赛周不接管该容器

  infoBox.style.display = 'block';
  root.innerHTML = '';
  root.classList.remove('group-stage-mode');

  if (!te || te.week !== p.week) {
    infoBox.innerHTML = `<div class="team-info-card" style="color:var(--text-dim);">本周为团体赛周，队友只能是与你同国籍的选手。点击上方按钮查看国家队选拔结果。</div>`;
    return;
  }

  let infoHtml = `<div class="team-info-card">${te.resultText}`;
  if (te.completed && te.finalResultText) {
    infoHtml += `<div class="final-banner">${te.finalResultText}</div>`;
  } else if (te.userResultRecorded && te.userResultText) {
    infoHtml += `<div class="final-banner" style="color:var(--text-dim); border-color:var(--border); background:rgba(255,255,255,0.04);">${te.userResultText}<br><span style="color:var(--accent-cyan);">你的代表队征程已结束，其余对阵仍会继续，点击下方按钮可以一直推进到产生冠军。</span></div>`;
  }
  infoHtml += `</div>`;

  if (te.userSelected && !te.completed) {
    if (te.phase === 'group' && te.groupStage) {
      if (!te.groupStage.completed) {
        // 小组赛 1~3 轮进行中
        infoHtml += `<button class="btn-gold" style="margin-bottom:16px;" onclick="advanceTeamRound()">进行小组赛第 ${te.groupStage.matchday + 1} 轮 ➔</button>`;
      } else {
        // 小组赛已全部打完：显示最终出线战报提示 + 专属前进按钮
        let uGroup = te.groupStage.groups.find(g => g.teams.some(t => t.isUser));
        let ranked = uGroup ? rankGroupTeams(uGroup) : [];
        let isQualified = ranked.findIndex(t => t.isUser) < 2;

        infoHtml += `
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; background:rgba(0,0,0,0.3); border:1px solid var(--border); padding:12px 18px; border-radius:12px;">
            <div style="font-size:0.9rem; font-weight:bold; color:${isQualified ? 'var(--accent-gold)' : 'var(--text-dim)'};">
              🏁 全部 3 轮小组循环赛已结束！${isQualified ? '🎉 恭喜你队成功突围出线！' : '很遗憾未能小组出线。'}
            </div>
            <button class="btn-primary" style="padding:8px 20px;" onclick="proceedToKnockoutStage()">
              ${isQualified ? '⚔️ 进入淘汰赛正赛 ➔' : '👀 观战淘汰赛正赛 ➔'}
            </button>
          </div>
        `;
      }
    } else if (te.bracket) {
      infoHtml += `<button class="btn-gold" style="margin-bottom:16px;" onclick="advanceTeamRound()">进行团体赛第 ${te.bracket.currentRound + 1} 轮对决 ➔</button>`;
    }
  }
  infoBox.innerHTML = infoHtml;

  if (!te.userSelected) return;

  // 小组赛阶段：渲染分组积分榜与赛程，此阶段尚未产生淘汰赛对阵树
  if (te.phase === 'group' && te.groupStage) {
    root.classList.add('group-stage-mode'); // 小组赛用普通网格布局，而非淘汰赛的横向 flex 导轨
    renderGroupStagePanel(te.groupStage, root);
    return;
  }

  if (!te.bracket) return;

  let br = te.bracket;
  br.rounds.forEach((round, rIdx) => {
    let colTitle = getTeamColumnTitle(round, rIdx);
    let col = document.createElement('div');
    col.className = 'bracket-round' + (rIdx === br.currentRound && !te.completed ? ' current-round' : '');

    let titleEl = document.createElement('div');
    titleEl.className = 'round-col-title';
    titleEl.innerHTML = `<div class="rt-main">${colTitle.main}</div><div class="rt-sub">${colTitle.sub}</div>`;
    col.appendChild(titleEl);

    for (let i = 0; i < round.length; i += 2) {
      let pairDiv = document.createElement('div');
      pairDiv.className = 'bracket-pair';

      for (let j = 0; j < 2 && (i + j) < round.length; j++) {
        let mIdx = i + j;
        let m = round[mIdx];
        let isUserTie = (m.t1?.isUser || m.t2?.isUser);
        let hasResult = !!m.tieResult;
        let node = document.createElement('div');
        node.className = `match-node tie-node ${isUserTie ? 'user-tie' : ''} ${hasResult ? 'clickable' : ''}`;
        if (hasResult) node.onclick = () => openTieDetailModal(rIdx, mIdx);

        let t1Win = m.winner && m.winner === m.t1;
        let t2Win = m.winner && m.winner === m.t2;
        let t1n = m.t1 ? m.t1.name : (m.t2 ? '轮空' : '待定');
        let t2n = m.t2 ? m.t2.name : (m.t1 ? '轮空' : '待定');
        let t1Score = '', t2Score = '';
        if (m.tieResult) { t1Score = m.tieResult.aWins; t2Score = m.tieResult.bWins; }
        else if (m.winner && (!m.t1 || !m.t2)) { t1Score = m.t1 ? 'WO' : ''; t2Score = m.t2 ? 'WO' : ''; }

        node.innerHTML = `
          <div class="player-slot ${t1Win ? 'winner' : ''}">
            <span class="team-name">${t1n}</span>
            <span class="tie-score">${t1Score}</span>
          </div>
          <div class="player-slot ${t2Win ? 'winner' : ''}">
            <span class="team-name">${t2n}</span>
            <span class="tie-score">${t2Score}</span>
          </div>
        `;
        if (!m.t1 && !m.t2) node.classList.add('tbd');
        pairDiv.appendChild(node);
      }
      col.appendChild(pairDiv);
    }
    root.appendChild(col);
  });
}

// 点击对阵树中某一组 Tie 的大比分，弹出斯韦思林杯 5 场逐场明细
function openTieDetailModal(roundIdx, matchIdx) {
  let te = gameState.currentTeamEvent;
  if (!te || !te.bracket) return;
  let m = te.bracket.rounds[roundIdx][matchIdx];
  if (!m || !m.tieResult) return;

  let t1Win = m.winner === m.t1;
  document.getElementById('tie-modal-round').innerText = getTeamColumnTitle(te.bracket.rounds[roundIdx], roundIdx).main;
  document.getElementById('tie-modal-t1').innerText = m.t1.name;
  document.getElementById('tie-modal-t1').className = 'side' + (t1Win ? ' win' : '');
  document.getElementById('tie-modal-t2').innerText = m.t2.name;
  document.getElementById('tie-modal-t2').className = 'side' + (!t1Win ? ' win' : '');
  document.getElementById('tie-modal-score').innerText = `${m.tieResult.aWins} : ${m.tieResult.bWins}`;

  let userInLineup = m.tieResult.rubberLogs.some(rl => rl.involvesUser);
  let bodyHtml = '';
  if (!userInLineup && (m.t1?.isUser || m.t2?.isUser)) {
    bodyHtml += `<div style="font-size:0.82rem; padding:8px 0 14px; color:var(--text-dim);">💺 本场对抗教练组排出的出战顺位中未包含你——即便入选了国家队大名单，具体某一场 Tie 也未必每次都会被排上场，安心在替补席为队友加油，结果依然会计入你的团体赛荣誉。</div>`;
  }
  m.tieResult.rubberLogs.forEach(rl => {
    let winnerName = rl.winner === 'A' ? m.t1.name : m.t2.name;
    let kindTag = rl.kind === 'doubles' ? '<span class="rubber-kind doubles">双打</span>' : '<span class="rubber-kind">单打</span>';
    bodyHtml += `<div class="rubber-row ${rl.involvesUser ? 'user-row' : ''}">
      ${kindTag}
      <span class="rubber-label">${rl.label}</span>
      <span class="rubber-players">${rl.a} vs ${rl.b}</span>
      <span class="rubber-score">${rl.score}</span>
    </div><div style="text-align:right; font-size:0.72rem; color:var(--text-dim); margin:-4px 0 8px;">${winnerName} 胜</div>`;
  });
  document.getElementById('tie-modal-body').innerHTML = bodyHtml;

  document.getElementById('tie-detail-modal').style.display = 'flex';
}

function closeTieDetailModal() {
  document.getElementById('tie-detail-modal').style.display = 'none';
}

/* ==================== 14. 退役结算与名人堂评价 ==================== */
function confirmRetirement() {
  const p = gameState.player;
  const yearsActive = p.year - 2026;

  showCustomConfirm({
    icon: '👑',
    title: '宣布退役确认',
    msg: `确定要结束选手【<strong style="color:var(--accent-gold);">${p.name}</strong>】的职业生涯吗？<br>你已在国际赛场征战 <strong>${yearsActive}</strong> 个赛季，确认后将为你生成终身成就与名人堂评级！`,
    okText: '确认退役 ➔',
    okColor: 'var(--accent-purple)',
    onConfirm: () => {
      generateCareerSummary();
    }
  });
}

function generateCareerSummary() {
  const p = gameState.player;
  const s = gameState.stats;
  const rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  const finalRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  const yearsActive = p.year - 2026;
  const winRate = s.totalMatches > 0 ? ((s.wins / s.totalMatches) * 100).toFixed(1) + "%" : "0.0%";

  // 基础信息注入
  document.getElementById('ret-name').innerText = p.name;
  document.getElementById('ret-country').innerText = p.country;
  document.getElementById('ret-years').innerText = `${yearsActive} 年 (2026 ~ ${p.year})`;
  document.getElementById('ret-age').innerText = `${p.age} 岁`;
  document.getElementById('ret-best-rank').innerText = `#${s.bestRank}`;
  document.getElementById('ret-final-rank').innerText = `#${finalRank}`;

  // 战绩数据注入
  document.getElementById('ret-matches').innerText = s.totalMatches;
  document.getElementById('ret-record').innerText = `${s.wins}胜 ${s.losses}负`;
  document.getElementById('ret-winrate').innerText = winRate;
  document.getElementById('ret-streak').innerText = s.bestStreak || 0;
  document.getElementById('ret-prize').innerText = `$${(s.totalPrizeWon || 0).toLocaleString()}`;
  document.getElementById('ret-money').innerText = `$${p.money.toLocaleString()}`;

  // 荣誉数据注入
  document.getElementById('ret-major').innerText = s.titlesMajor || 0;
  document.getElementById('ret-smash').innerText = s.titlesSmash || 0;
  document.getElementById('ret-champ-star').innerText = (s.titlesChamp || 0) + (s.titlesStar || 0);
  document.getElementById('ret-total-titles').innerText = s.titles || 0;

  // 生涯历史地位评级体系
  let tier = "D";
  let desc = "";
  const majors = s.titlesMajor || 0;
  const smashes = s.titlesSmash || 0;
  const totalTitles = s.titles || 0;
  const bestRank = s.bestRank;

  if (majors >= 3 && bestRank === 1) {
    tier = "GOAT (乒坛至尊)";
    desc = `无可挑剔的统治者！手握 ${majors} 座三大赛桂冠并登顶世界第一，与马龙、瓦尔德内尔等传奇并列乒坛史册！`;
  } else if (majors >= 1 || (smashes >= 2 && bestRank <= 3)) {
    tier = "SSS (世界传奇)";
    desc = `大满贯级别的顶尖名将，屡次在世界大赛中问鼎巅峰，是国家队的绝对核心与时代领军人物！`;
  } else if (totalTitles >= 5 || bestRank <= 10) {
    tier = "S (乒坛巨星)";
    desc = `常年位列世界前十的巡回赛顶级掠食者，巡回赛荣誉满身，国际乒联不可忽视的中流砥柱。`;
  } else if (totalTitles >= 1 || bestRank <= 50) {
    tier = "A (名将国手)";
    desc = `拥有冠军头衔的高水平职业国手，多次代表国家参加巡回赛并斩获佳绩。`;
  } else if (s.totalMatches >= 30) {
    tier = "B (职业老兵)";
    desc = `勤勉征战巡回赛的职业球员，经历了高强度的国际竞争洗礼。`;
  } else {
    tier = "C (乒坛新秀)";
    desc = `短暂体验了职业巡回赛的节奏，早早告别了职业赛场。`;
  }

  document.getElementById('ret-eval-tier').innerText = tier;
  document.getElementById('ret-eval-desc').innerText = desc;

  // 展示弹窗并清除本地自动存档，防止存档冲突
  document.getElementById('retirement-modal').style.display = 'flex';
}

/* ==================== 批次三：双打与兼项赛事调度系统 ==================== */

let currentActiveBracketTab = 'singles'; // 兼项时当前显示的签表：'singles' | 'doubles'

/* 2. 打开项目选择弹窗（支持随时关闭退出） */
function openDisciplineSelectModal() {
  const p = gameState.player;
  if (p.injury && INJURY_TYPES[p.injury]?.severity === 'severe') {
    showAlert(`🚫 队医禁止参赛！你目前身患【${INJURY_TYPES[p.injury].name}】。<br>请在【周计划训练】中安排水疗休养！`, "无法参赛", "🚑");
    return;
  }

  const curEvent = getEventForWeekAndYear(p.week, p.year);
  const partner = gameState.playerDoubles?.currentPartner;
  const userPair = gameState.doublesRanking?.find(p => p.isUserPair);
  const pairRank = userPair ? (gameState.doublesRanking.indexOf(userPair) + 1) : 999;
  const singleRank = gameState.worldRanking.findIndex(x => x.isUser) + 1;

  let doublesDirectCut = curEvent.drawSize <= 16 ? 16 : Math.floor(curEvent.directCut / 2);
  let doublesQualiCut = Math.floor(curEvent.qualiCut / 2);

  const singlesStatusEl = document.getElementById('disc-singles-status');
  const doublesStatusEl = document.getElementById('disc-doubles-status');
  const partnerTextEl = document.getElementById('disc-doubles-partner-text');

  singlesStatusEl.innerText = singleRank <= curEvent.directCut ? "直通正赛" : (singleRank <= curEvent.qualiCut ? "需资格赛" : "排名不足");
  singlesStatusEl.className = singleRank <= curEvent.directCut ? "badge badge-gold" : (singleRank <= curEvent.qualiCut ? "badge badge-star" : "badge");

  if (!partner) {
    doublesStatusEl.innerText = "无固定搭档";
    doublesStatusEl.className = "badge";
    partnerTextEl.innerText = "⚠️ 尚未签约搭档，请先在「双打」菜单中组队";
  } else {
    partnerTextEl.innerText = `搭档: ${partner.name} (默契度 ${partner.chemistry} | 双打排名 #${pairRank})`;
    doublesStatusEl.innerText = pairRank <= doublesDirectCut ? "直通正赛" : (pairRank <= doublesQualiCut ? "需资格赛" : "排名不足");
    doublesStatusEl.className = pairRank <= doublesDirectCut ? "badge badge-gold" : (pairRank <= doublesQualiCut ? "badge badge-star" : "badge");
  }

  // 三种出战方案的预估费用展示
  const costs = getDisciplineCosts(curEvent);
  const money = gameState.player.money;
  const singlesCostEl = document.getElementById('disc-singles-cost');
  const doublesCostEl = document.getElementById('disc-doubles-cost');
  const bothCostEl = document.getElementById('disc-both-cost');
  if (singlesCostEl) singlesCostEl.innerHTML = `💰 预估费用: <strong style="color:${money >= costs.singles ? 'var(--accent-cyan)' : '#f87171'};">$${costs.singles.toLocaleString()}</strong>`;
  if (doublesCostEl) doublesCostEl.innerHTML = partner ? `💰 预估费用: <strong style="color:${money >= costs.doubles ? 'var(--accent-cyan)' : '#f87171'};">$${costs.doubles.toLocaleString()}</strong>` : '';
  if (bothCostEl) bothCostEl.innerHTML = `💰 预估费用: <strong style="color:${money >= costs.both ? 'var(--accent-cyan)' : '#f87171'};">$${costs.both.toLocaleString()}</strong>`;

  document.getElementById('discipline-select-modal').style.display = 'flex';
}

function closeDisciplineSelectModal() {
  document.getElementById('discipline-select-modal').style.display = 'none';
}

/* 直接从"本周多站赛事"卡片点击【报名】：跳过中间的"进入查看"步骤，直接弹出项目选择弹窗 */
function openRegistrationForEvent(eventId) {
  const wm = ensureWeekMeta();
  wm.explicitSpectateEventId = null; // 重新尝试报名，清除此前的"仅观赛"标记
  if (wm.selectedEventId && wm.selectedEventId !== eventId) {
    // 本周已锁定其它站，此站只能进入只读观赛
    spectateEvent(eventId);
    return;
  }
  const ev = wm.events.find(e => e.id === eventId);
  if (!ev) return;
  if (!isEventJoinableForPlayer(ev)) {
    // 兜底：无资格情况一律转为只读观赛入口
    spectateEvent(eventId);
    return;
  }
  wm.viewingEventId = eventId;
  updateUI();
  openDisciplineSelectModal();
}

/* 项目选择弹窗中选择【仅观赛】：不报名、不锁定本周行程，仅以只读身份查看该站签表（单打+双打） */
function chooseSpectateOnly() {
  const p = gameState.player;
  const wm = ensureWeekMeta();
  const curEvent = getEventForWeekAndYear(p.week, p.year);
  closeDisciplineSelectModal();
  if (!curEvent) return;
  // 明确标记：即便该站本可报名、且本周尚未锁定其它赛事，也应以只读签表展示，而非弹回报名按钮
  wm.explicitSpectateEventId = curEvent.id;
  spectateEvent(curEvent.id);
}

/* 3. 选定项目并正式锁定本站行程 */
function selectDiscipline(discipline) {
  const p = gameState.player;
  const partner = gameState.playerDoubles?.currentPartner;

  if ((discipline === 'doubles' || discipline === 'both') && !partner) {
    showAlert("参加双打比赛必须拥有固定搭档！请前往顶栏「双打」面板邀请一位队友组队后再来报名。", "未组建双打", "👥");
    return;
  }

  closeDisciplineSelectModal();

  const curEvent = getEventForWeekAndYear(p.week, p.year);
  const cost = calculateTournamentCost(curEvent, p.country);
  const totalCost = discipline === 'both' ? Math.round(cost.total * 1.3) : cost.total;

  if (p.money < totalCost) {
    showAlert(`💸 参赛资金不足！前往本站${discipline === 'both' ? '（兼项出战）' : ''}共需 $${totalCost.toLocaleString()}，你当前只有 $${p.money.toLocaleString()}。<br>你可以点击「🔙 返回本周多站赛事列表」选择预算更低的支线赛，或休赛训练。`, "资金短缺", "💵");
    return;
  }

  p.money -= totalCost;
  checkAndTriggerPlayerInjury(discipline === 'both');

  // 构建单打与双打独立签表数据
  let singlesData, doublesData;
  if (discipline === 'singles') {
    singlesData = buildSinglesTournamentData(curEvent);
    doublesData = buildPureAIDoublesTournamentData(curEvent);
    currentActiveBracketTab = 'singles';
  } else if (discipline === 'doubles') {
    singlesData = buildPureAISinglesTournamentData(curEvent);
    doublesData = buildDoublesTournamentData(curEvent);
    currentActiveBracketTab = 'doubles';
  } else {
    singlesData = buildSinglesTournamentData(curEvent);
    doublesData = buildDoublesTournamentData(curEvent);
    currentActiveBracketTab = 'singles';
  }

  gameState.currentTournament = {
    mode: 'both',
    discipline: discipline,
    week: p.week,
    eventId: curEvent.id,
    name: curEvent.name,
    type: curEvent.type,
    pointsAward: curEvent.points,
    prizeAward: curEvent.prize,
    singles: singlesData,
    doubles: doublesData,
    completed: false
  };

  const wm = ensureWeekMeta();
  wm.selectedEventId = curEvent.id;
  wm.viewingEventId = curEvent.id;
  wm.explicitSpectateEventId = null;

  updateUI();
  saveGame();
}

/* 辅助：纯 AI 单打签表数据构造 */
/* ==================== 纯 AI 单打签表数据构造 (严格遵循分流与排名门槛) ==================== */
function buildPureAISinglesTournamentData(curEvent) {
  const wm = ensureWeekMeta();
  let totalSize = curEvent.drawSize || 16;
  
  // 1. 优先直接使用 assignWeeklyAIField 已经去重且按规则分流好的 AI 名单
  let pool = (wm.assignment && wm.assignment[curEvent.id] && wm.assignment[curEvent.id].length >= totalSize)
    ? wm.assignment[curEvent.id]
    : null;

  // 2. 若无分流名单则现场构造（严格执行 maxRank 门槛与排除其他站选手）
  if (!pool || pool.length < totalSize) {
    const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
    const minRankLimit = curEvent.maxRank || 1; // 支线赛为 33，禁止前 32 名参赛
    const maxRankLimit = curEvent.qualiCut || 9999;

    let opponentPool = gameState.worldRanking.filter((x, idx) => {
      let r = idx + 1;
      return !x.isUser && 
             !isPlayerSeverelyInjured(x) && 
             !excludedNames.has(x.name) && 
             r >= minRankLimit && 
             r <= maxRankLimit;
    });

    // 兜底补足（仍必须严格遵守 minRankLimit，绝不允许世界排名前列的名将混入支线赛）
    if (opponentPool.length < totalSize) {
      let currentPicked = new Set(opponentPool.map(x => x.name));
      let fallbackPool = gameState.worldRanking.filter((x, idx) => {
        let r = idx + 1;
        return !x.isUser && 
               !isPlayerSeverelyInjured(x) && 
               !currentPicked.has(x.name) && 
               r >= minRankLimit;
      });
      opponentPool = opponentPool.concat(fallbackPool);
    }
    pool = opponentPool;
  }

  let participants = pool.slice(0, totalSize).map(x => ({
    name: x.name,
    power: (x.basePow || 55) + Math.random() * 8,
    points: x.points || 0,
    isUser: false
  }));

  let fullDraw = generateSeededBracket(participants, totalSize, false);
  return createBracketRoundsStructure(fullDraw, totalSize, 'main', curEvent, true, false);
}

/* ==================== 纯 AI 双打签表数据构造 (严格遵循分流与排名门槛) ==================== */
function buildPureAIDoublesTournamentData(curEvent) {
  ensureDoublesRankingAvailable();
  const wm = ensureWeekMeta();
  let totalSize = curEvent.drawSize <= 16 ? 16 : Math.min(32, Math.floor(curEvent.drawSize / 2));
  let dMinRank = curEvent.type === "Feeder" ? Math.max(17, Math.floor((curEvent.maxRank || 33) / 2)) : (curEvent.maxRank || 1);
  let dQualiCut = Math.floor((curEvent.qualiCut || 9999) / 2);

  // 1. 优先使用分流好的双打阵容
  let pool = (wm.doublesAssignment && wm.doublesAssignment[curEvent.id] && wm.doublesAssignment[curEvent.id].length >= totalSize) 
    ? wm.doublesAssignment[curEvent.id] 
    : null;

  // 2. 现场构造时严格过滤排名门槛
  if (!pool || pool.length < totalSize) {
    let dPool = gameState.doublesRanking.filter(pair => {
      if (pair.isUserPair) return false;
      let pairRank = gameState.doublesRanking.indexOf(pair) + 1;
      return pairRank >= dMinRank && pairRank <= dQualiCut;
    });

    if (dPool.length < totalSize) {
      let pickedIds = new Set(dPool.map(p => p.id));
      let fallbackPool = gameState.doublesRanking.filter(pair => {
        if (pair.isUserPair || pickedIds.has(pair.id)) return false;
        let pairRank = gameState.doublesRanking.indexOf(pair) + 1;
        return pairRank >= dMinRank;
      });
      dPool = dPool.concat(fallbackPool);
    }
    pool = dPool;
  }

  let participants = pool.slice(0, totalSize).map(pr => ({
    name: pr.name, 
    player1: pr.player1, 
    player2: pr.player2,
    power: calculateDoublesPairCombatPower(pr.player1, pr.player2, pr.chemistry || 70) + Math.random() * 4,
    points: pr.points, 
    chemistry: pr.chemistry || 70, 
    isUser: false, 
    isDoubles: true
  }));

  let fullDraw = generateSeededBracket(participants, totalSize, true);
  return createBracketRoundsStructure(fullDraw, totalSize, 'main', curEvent, true, true);
}

/* AI 独立双打赛事模拟与真实结算 */
function simulateAIOnlyDoublesEvent(curEvent, presetField) {
  ensureDoublesRankingAvailable();
  let totalSize = curEvent.drawSize <= 16 ? 16 : Math.min(32, Math.floor(curEvent.drawSize / 2));
  let dMinRank = curEvent.type === "Feeder" ? Math.max(17, Math.floor((curEvent.maxRank || 33) / 2)) : (curEvent.maxRank || 1);

  // 关键修复：当缺少 presetField 时，过滤掉排名高于 dMinRank 的王牌双打
  let pool = (presetField && presetField.length >= 2) 
    ? presetField 
    : gameState.doublesRanking.filter(pr => {
        if (pr.isUserPair) return false;
        let pairRank = gameState.doublesRanking.indexOf(pr) + 1;
        return pairRank >= dMinRank;
      }).slice(0, totalSize);
    
  if (pool.length < 2) return;

  let size = 2;
  while (size * 2 <= pool.length && size * 2 <= totalSize) size *= 2;

  let field = pool.slice(0, size).map(pr => ({
    name: pr.name,
    player1: pr.player1,
    player2: pr.player2,
    power: calculateDoublesPairCombatPower(pr.player1, pr.player2, pr.chemistry || 70) + Math.random() * 4,
    points: pr.points,
    isUser: false,
    isDoubles: true
  }));

  let seeded = generateSeededBracket(field, size, true);
  let rounds = [];
  let curSize = size;
  while (curSize >= 2) {
    let matches = [];
    for (let i = 0; i < curSize / 2; i++) matches.push({ p1: null, p2: null, score: "", winner: null, isDoubles: true });
    rounds.push(matches);
    curSize /= 2;
  }
  for (let i = 0; i < size / 2; i++) {
    rounds[0][i].p1 = seeded[i * 2];
    rounds[0][i].p2 = seeded[i * 2 + 1];
  }

  for (let r = 0; r < rounds.length; r++) {
    let matches = rounds[r];
    let next = rounds[r + 1];
    let isFinal = (r === rounds.length - 1);
    let isSemi = (rounds.length - r === 2);
    
    matches.forEach((m, idx) => {
      if (m.p1 && m.p2) {
        let diff = (m.p1.power || 60) - (m.p2.power || 60);
        let p1WinRate = setWinProb(diff);
        let p1G = 0, p2G = 0;
        while (p1G < 3 && p2G < 3) { if (Math.random() < p1WinRate) p1G++; else p2G++; }
        m.winner = p1G > p2G ? m.p1 : m.p2;
        m.score = `${p1G} - ${p2G}`;

        let loser = p1G > p2G ? m.p2 : m.p1;
        let winner = m.winner;

        let lPair = gameState.doublesRanking.find(p => p.name === loser.name);
        let wPair = gameState.doublesRanking.find(p => p.name === winner.name);

        if (lPair) {
          lPair.careerLosses = (lPair.careerLosses || 0) + 1;
          let pts = calculateRoundPoints(curEvent.points * 0.85, size, r, 'main', isFinal);
          let rName = isFinal ? "🥈 亚军" : getRoundName(size, r, 'main');
          awardDoublesPoints(lPair, pts);

          [lPair.player1?.name, lPair.player2?.name].forEach(pName => {
            let pl = gameState.worldRanking.find(x => x.name === pName);
            if (pl) {
              recordRecentMatchForPlayer(pl, curEvent.name, curEvent.type, rName, pts, "双打");
              if (isFinal) {
                recordCareerMedal(pl.name, 'S', gameState.player.year, gameState.player.week, curEvent.name, curEvent.type, "男子双打");
              } else if (isSemi) {
                recordCareerMedal(pl.name, 'B', gameState.player.year, gameState.player.week, curEvent.name, curEvent.type, "男子双打");
              }
            }
          });
        }
        if (wPair) {
          wPair.careerWins = (wPair.careerWins || 0) + 1;
        }
      }

      if (next && m.winner) {
        let nIdx = Math.floor(idx / 2);
        if (idx % 2 === 0) next[nIdx].p1 = m.winner;
        else next[nIdx].p2 = m.winner;
      }
    });
  }

  let finalMatch = rounds[rounds.length - 1][0];
  if (finalMatch && finalMatch.winner) {
    let champPair = gameState.doublesRanking.find(p => p.name === finalMatch.winner.name);
    if (champPair) {
      champPair.titles = (champPair.titles || 0) + 1;
      let champPts = Math.floor(curEvent.points * 0.85);
      awardDoublesPoints(champPair, champPts);

      [champPair.player1?.name, champPair.player2?.name].forEach(pName => {
        let pl = gameState.worldRanking.find(x => x.name === pName);
        if (pl) {
          recordRecentMatchForPlayer(pl, curEvent.name, curEvent.type, "🏆 冠军", champPts, "双打");
          recordCareerMedal(pl.name, 'G', gameState.player.year, gameState.player.week, curEvent.name, curEvent.type, "男子双打");
        }
      });
    }
  }
}

/* 构建含玩家的双打签表数据 */
function buildDoublesTournamentData(curEvent) {
  const p = gameState.player;
  const partner = gameState.playerDoubles?.currentPartner;
  ensureDoublesRankingAvailable();
  const wm = ensureWeekMeta();

  const userPair = gameState.doublesRanking.find(pr => pr.isUserPair);
  const pairRank = userPair ? (gameState.doublesRanking.indexOf(userPair) + 1) : 999;

  let directCut = curEvent.drawSize <= 16 ? 16 : Math.floor(curEvent.directCut / 2);
  let qualiCut = Math.floor(curEvent.qualiCut / 2);

  let isUnqualified = pairRank > qualiCut;
  let isQualifying = !isUnqualified && (pairRank > directCut);
  let totalSize = isQualifying ? 4 : (curEvent.drawSize <= 16 ? 16 : Math.min(32, Math.floor(curEvent.drawSize / 2)));

  let pool = (wm.doublesAssignment && wm.doublesAssignment[curEvent.id])
    ? wm.doublesAssignment[curEvent.id]
    : gameState.doublesRanking.filter(pr => !pr.isUserPair);

  let poolCopy = pool.filter(pr => !pr.isUserPair);
  let participants = [];
  let userInDraw = !isUnqualified;
  let targetCount = userInDraw ? totalSize - 1 : totalSize;

  while (participants.length < targetCount && poolCopy.length > 0) {
    let r = Math.floor(Math.random() * poolCopy.length);
    participants.push(poolCopy.splice(r, 1)[0]);
  }

  let rawList = [];
  if (userInDraw && partner) {
    let combatPow = calculateDoublesPairCombatPower(p, partner, partner.chemistry);
    rawList.push({
      name: `${p.name} / ${partner.name}`,
      player1: { name: p.name, country: p.country, isUser: true },
      player2: { name: partner.name, country: partner.country, basePow: partner.basePow },
      power: combatPow,
      points: gameState.playerDoubles.points || 0,
      chemistry: partner.chemistry,
      isUser: true,
      isDoubles: true
    });
  }

  participants.forEach(pr => {
    let pow = calculateDoublesPairCombatPower(pr.player1, pr.player2, pr.chemistry || 70);
    rawList.push({
      name: pr.name,
      player1: pr.player1,
      player2: pr.player2,
      power: pow + Math.random() * 4,
      points: pr.points,
      chemistry: pr.chemistry || 70,
      isUser: false,
      isDoubles: true
    });
  });

  let fullDraw = generateSeededBracket(rawList, totalSize, true);
  return createBracketRoundsStructure(fullDraw, totalSize, isQualifying ? 'quali' : 'main', curEvent, isUnqualified, true);
}

// 3. 构建单打签表核心数据
function buildSinglesTournamentData(curEvent) {
  const p = gameState.player;
  const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  let isUnqualified = currentRank > curEvent.qualiCut;
  let isQualifying = !isUnqualified && (currentRank > curEvent.directCut);
  let totalSize = isQualifying ? 4 : (curEvent.drawSize || 16);

  let opponentPool = gameState.worldRanking.filter(x => {
    let r = gameState.worldRanking.indexOf(x) + 1;
    return !x.isUser && !isPlayerSeverelyInjured(x) && !excludedNames.has(x.name) &&
      (isQualifying ? (r > curEvent.directCut && r <= (curEvent.qualiCut + 15)) : (r >= (curEvent.maxRank || 1)));
  });

  let participants = [];
  let userInDraw = !isUnqualified;
  let targetCount = userInDraw ? totalSize - 1 : totalSize;

  while (participants.length < targetCount && opponentPool.length > 0) {
    let r = Math.floor(Math.random() * opponentPool.length);
    participants.push(opponentPool.splice(r, 1)[0]);
  }

  let rawList = [];
  if (userInDraw) {
    rawList.push({ name: p.name, power: computeUserCombatPower(), points: p.points, isUser: true });
  }
  participants.forEach(x => {
    rawList.push({ name: x.name, power: (x.basePow || 55) + Math.random() * 8, points: x.points, isUser: false });
  });

  let fullDraw = generateSeededBracket(rawList, totalSize);
  return createBracketRoundsStructure(fullDraw, totalSize, isQualifying ? 'quali' : 'main', curEvent, isUnqualified);
}

/* 2. 双打候选池：单打名将组合优先获得兼项资格 */
function getEligibleDoublesPairsForEvent(curEvent, targetCount) {
  ensureDoublesRankingAvailable();
  let pairs = gameState.doublesRanking.filter(pr => !pr.isUserPair);

  // 优先挑选单打名将组合实现兼项出战
  let dualPairs = pairs.filter(pr => {
    let p1Rank = gameState.worldRanking.findIndex(x => x.name === pr.player1.name) + 1;
    let p2Rank = gameState.worldRanking.findIndex(x => x.name === pr.player2.name) + 1;
    return p1Rank <= (curEvent.directCut || 64) && p2Rank <= (curEvent.directCut || 64);
  });

  let otherPairs = pairs.filter(pr => !dualPairs.includes(pr));
  let combinedPool = [...dualPairs, ...otherPairs];
  return combinedPool.slice(0, targetCount);
}

/* 3. 资格赛突围与未突围正赛生成（单打） */
function buildSinglesMainDrawWithUser(curEvent) {
  const p = gameState.player;
  const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
  let totalSize = curEvent.drawSize || 16;

  let opponentPool = gameState.worldRanking.filter(x => {
    let r = gameState.worldRanking.indexOf(x) + 1;
    return !x.isUser && !isPlayerSeverelyInjured(x) && !excludedNames.has(x.name) && r >= (curEvent.maxRank || 1);
  });
  if (opponentPool.length < totalSize - 1) {
    opponentPool = gameState.worldRanking.filter(x => !x.isUser && !isPlayerSeverelyInjured(x)).slice(0, totalSize + 10);
  }

  let participants = [];
  while (participants.length < totalSize - 1 && opponentPool.length > 0) {
    let r = Math.floor(Math.random() * opponentPool.length);
    participants.push(opponentPool.splice(r, 1)[0]);
  }

  let userCombatPow = computeUserCombatPower();
  let rawList = [
    { name: p.name, power: userCombatPow, points: p.points, isUser: true, isDoubles: false },
    ...participants.map(x => ({ name: x.name, power: (x.basePow || 55) + Math.random() * 8, points: x.points, isUser: false, isDoubles: false }))
  ];

  let fullDraw = generateSeededBracket(rawList, totalSize, false);
  return createBracketRoundsStructure(fullDraw, totalSize, 'main', curEvent, false, false);
}

function enterMainDrawAfterQuali() {
  const newSinglesMain = buildSinglesMainDrawWithUser(getEventForWeekAndYear(gameState.player.week, gameState.player.year));

  if (gameState.currentTournament && gameState.currentTournament.mode === 'both') {
    gameState.currentTournament.singles = newSinglesMain;
  } else {
    gameState.currentTournament = newSinglesMain;
  }

  renderBracket();
  updateUI();
  saveGame();
}

/* 4. 资格赛突围与未突围正赛生成（双打） */
function buildDoublesMainDrawWithUser(curEvent) {
  const p = gameState.player;
  const partner = gameState.playerDoubles.currentPartner;
  let totalSize = curEvent.drawSize <= 16 ? 16 : Math.min(32, Math.floor(curEvent.drawSize / 2));
  ensureDoublesRankingAvailable();

  let pool = getEligibleDoublesPairsForEvent(curEvent, totalSize + 15);
  let participants = [];
  while (participants.length < totalSize - 1 && pool.length > 0) {
    let r = Math.floor(Math.random() * pool.length);
    participants.push(pool.splice(r, 1)[0]);
  }

  let combatPow = calculateDoublesPairCombatPower(p, partner, partner.chemistry);
  let rawList = [
    {
      name: `${p.name} / ${partner.name}`,
      player1: { name: p.name, country: p.country, isUser: true },
      player2: { name: partner.name, country: partner.country, basePow: partner.basePow },
      power: combatPow,
      points: gameState.playerDoubles.points || 0,
      chemistry: partner.chemistry,
      isUser: true,
      isDoubles: true
    },
    ...participants.map(pr => ({
      name: pr.name,
      player1: pr.player1,
      player2: pr.player2,
      power: calculateDoublesPairCombatPower(pr.player1, pr.player2, pr.chemistry || 70) + Math.random() * 6,
      points: pr.points,
      chemistry: pr.chemistry || 70,
      isUser: false,
      isDoubles: true
    }))
  ];

  let fullDraw = generateSeededBracket(rawList, totalSize, true);
  return createBracketRoundsStructure(fullDraw, totalSize, 'main', curEvent, false, true);
}

function enterDoublesMainDrawAfterQuali() {
  const newDoublesMain = buildDoublesMainDrawWithUser(getEventForWeekAndYear(gameState.player.week, gameState.player.year));

  if (gameState.currentTournament && gameState.currentTournament.mode === 'both') {
    gameState.currentTournament.doubles = newDoublesMain;
  } else {
    gameState.currentTournament = newDoublesMain;
  }

  renderBracket();
  updateUI();
}

/* 资格赛全部轮次结束后自动生成/切换正赛签表（无论玩家资格赛晋级与否，正赛都会生成，
   晋级则玩家本人在正赛出战；未晋级则正赛为纯 AI 对阵，玩家可继续只读浏览该项赛程）。 */
function transitionQualiTourToMain(tour) {
  const isDoubles = Boolean(tour.isDoubles);
  const survived = !tour.isUserKnockedOut;
  const curEvent = getEventForWeekAndYear(gameState.player.week, gameState.player.year);

  let newMain;
  if (isDoubles) {
    newMain = survived ? buildDoublesMainDrawWithUser(curEvent) : buildPureAIDoublesTournamentData(curEvent);
  } else {
    newMain = survived ? buildSinglesMainDrawWithUser(curEvent) : buildPureAISinglesTournamentData(curEvent);
  }

  const rootTour = gameState.currentTournament;
  if (rootTour && rootTour.mode === 'both') {
    if (isDoubles) rootTour.doubles = newMain; else rootTour.singles = newMain;
  } else if (rootTour) {
    gameState.currentTournament = newMain;
  }

  showAlert(
    survived
      ? `🎉 恭喜突围资格赛！正式晋级【${isDoubles ? '👥 双打' : '🏓 单打'}】正赛，对阵已生成，请继续推进比赛！`
      : `😔 资格赛未能突围（${isDoubles ? '双打' : '单打'}）。正赛对阵已自动生成，你可以继续只读查看该项后续赛程。`,
    survived ? "晋级正赛" : "资格赛出局",
    survived ? "🎉" : "📋"
  );
}

// 辅助：构建对阵树 rounds 结构
function createBracketRoundsStructure(fullDraw, totalSize, phase, curEvent, isUnqualified, isDoubles = false) {
  let rounds = [];
  let currentSize = totalSize;
  while (currentSize >= 2) {
    let matchesInRound = [];
    for (let i = 0; i < currentSize / 2; i++) {
      matchesInRound.push({ p1: null, p2: null, score: "", winner: null, isDoubles: isDoubles });
    }
    rounds.push(matchesInRound);
    currentSize /= 2;
  }

  for (let i = 0; i < totalSize / 2; i++) {
    rounds[0][i].p1 = fullDraw[i * 2];
    rounds[0][i].p2 = fullDraw[i * 2 + 1];
  }

  return {
    week: curEvent.week || gameState.player.week,
    eventId: curEvent.id,
    name: curEvent.name,
    type: curEvent.type,
    pointsAward: isDoubles ? Math.floor(curEvent.points * 0.85) : curEvent.points, // 双打积分为单打对应梯队
    prizeAward: isDoubles ? Math.floor(curEvent.prize * 0.6) : curEvent.prize,
    phase: phase,
    drawSize: totalSize,
    currentRound: 0,
    rounds: rounds,
    isUserKnockedOut: isUnqualified,
    isDoubles: isDoubles,
    completed: false
  };
}

/* 切换单打/双打签表标签页 */
/* ==================== 4. 切换单打/双打签表标签页 ==================== */
function switchActiveBracketView(tab) {
  currentActiveBracketTab = tab;
  const sBtn = document.getElementById('btn-switch-singles-bracket');
  const dBtn = document.getElementById('btn-switch-doubles-bracket');
  if (sBtn) sBtn.classList.toggle('active-gear-type', tab === 'singles');
  if (dBtn) dBtn.classList.toggle('active-gear-type', tab === 'doubles');
  renderBracket();
}

// 辅助：细分统计双打荣誉头衔
function accumulateDoublesTrophyStats(type) {
  const ds = gameState.doublesStats;
  if (type === "Olympic") ds.titlesOlympic = (ds.titlesOlympic || 0) + 1;
  else if (type === "WTTC") ds.titlesWTTC = (ds.titlesWTTC || 0) + 1;
  else if (type === "World Cup") ds.titlesWorldCup = (ds.titlesWorldCup || 0) + 1;
  else if (type === "Grand Smash") ds.titlesSmash = (ds.titlesSmash || 0) + 1;
  else if (type === "Finals") ds.titlesFinals = (ds.titlesFinals || 0) + 1;
  else if (type === "Champions") ds.titlesChamp = (ds.titlesChamp || 0) + 1;
  else if (type === "Star Contender") ds.titlesStar = (ds.titlesStar || 0) + 1;
  else if (type === "Contender") ds.titlesContender = (ds.titlesContender || 0) + 1;
  else ds.titlesFeeder = (ds.titlesFeeder || 0) + 1;
}

function loadDoublesMainDrawForViewing() {
  const p = gameState.player;
  const curEvent = getEventForWeekAndYear(p.week, p.year);
  let totalSize = curEvent.drawSize <= 16 ? 16 : Math.min(32, Math.floor(curEvent.drawSize / 2));
  ensureDoublesRankingAvailable();

  let pool = getEligibleDoublesPairsForEvent(curEvent, totalSize + 15);
  let participants = [];
  while (participants.length < totalSize && pool.length > 0) {
    let r = Math.floor(Math.random() * pool.length);
    participants.push(pool.splice(r, 1)[0]);
  }

  let rawList = participants.map(pr => ({
    name: pr.name,
    player1: pr.player1,
    player2: pr.player2,
    power: calculateDoublesPairCombatPower(pr.player1, pr.player2, pr.chemistry || 70) + Math.random() * 6,
    points: pr.points,
    chemistry: pr.chemistry || 70,
    isUser: false,
    isDoubles: true
  }));

  let fullDraw = generateSeededBracket(rawList, totalSize, true);
  let newDoublesMain = createBracketRoundsStructure(fullDraw, totalSize, 'main', curEvent, true, true);

  if (gameState.currentTournament && gameState.currentTournament.mode === 'both') {
    gameState.currentTournament.doubles = newDoublesMain;
  } else {
    gameState.currentTournament = newDoublesMain;
  }

  renderBracket();
  updateUI();
  saveGame();
}

