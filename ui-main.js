/* ==================== 资金动态变动与飘字引擎 ==================== */
let lastTrackedPlayerMoney = null;
let moneyRollingAnimTimer = null;

// 数字平滑递增/递减滚动
function animateMoneyCount(targetVal) {
  const topEl = document.getElementById('top-p-money');
  const profEl = document.getElementById('p-money');
  
  if (!topEl && !profEl) return;

  // 第一次加载直接显示，不播放滚动
  if (lastTrackedPlayerMoney === null) {
    lastTrackedPlayerMoney = targetVal;
    if (topEl) topEl.innerText = `$${targetVal.toLocaleString()}`;
    if (profEl) profEl.innerText = `$${targetVal.toLocaleString()}`;
    return;
  }

  const startVal = lastTrackedPlayerMoney;
  const delta = targetVal - startVal;

  if (delta === 0) return;

  // 1. 触发飘字与外框呼吸动画
  spawnMoneyDeltaFloatingTag(delta);

  // 2. 数字滚动动画（持续 450ms）
  if (moneyRollingAnimTimer) cancelAnimationFrame(moneyRollingAnimTimer);

  const duration = 450;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // 使用 easeOutCubic 缓动函数
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.round(startVal + delta * easeProgress);

    const formatted = `$${currentVal.toLocaleString()}`;
    if (topEl) topEl.innerText = formatted;
    if (profEl) profEl.innerText = formatted;

    if (progress < 1) {
      moneyRollingAnimTimer = requestAnimationFrame(step);
    } else {
      lastTrackedPlayerMoney = targetVal;
      if (topEl) topEl.innerText = `$${targetVal.toLocaleString()}`;
      if (profEl) profEl.innerText = `$${targetVal.toLocaleString()}`;
    }
  }

  moneyRollingAnimTimer = requestAnimationFrame(step);
}

// 产生浮动飘字气泡
function spawnMoneyDeltaFloatingTag(delta) {
  const container = document.getElementById('top-money-badge');
  if (!container) return;

  const isPlus = delta > 0;
  const floatEl = document.createElement('div');
  floatEl.className = `money-delta-float ${isPlus ? 'plus' : 'minus'}`;
  floatEl.innerText = `${isPlus ? '+' : '-'} $${Math.abs(delta).toLocaleString()}`;
  
  container.appendChild(floatEl);

  // 触发胶囊外框发光与微缩放
  const pulseClass = isPlus ? 'money-pulse-plus' : 'money-pulse-minus';
  container.classList.remove('money-pulse-plus', 'money-pulse-minus');
  // 强制回流重置动画
  void container.offsetWidth;
  container.classList.add(pulseClass);

  // 动画结束后自动清理 DOM 节点
  setTimeout(() => {
    floatEl.remove();
    container.classList.remove(pulseClass);
  }, 1300);
}

function drawRadarChart() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const centerX = w / 2, centerY = h / 2, radius = 80; // 半径从 95 改为 80 适应左侧布局
  const stats = getEffectiveStats();
  
  const keys = ['fhPower', 'bhSpeed', 'spin', 'touch', 'rally', 'serve', 'receive', 'speed', 'footwork', 'endurance', 'mental', 'tactics'];
  const labels = ['正手', '反手', '旋转', '控制', '防守', '发球', '接发', '移速', '步法', '体能', '心理', '球商'];
  const total = keys.length;

  ctx.clearRect(0, 0, w, h);

  // 1. 绘制网格同心环
  for (let level = 1; level <= 4; level++) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    let r = (radius / 4) * level;
    for (let i = 0; i < total; i++) {
      let angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      let x = centerX + r * Math.cos(angle);
      let y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 2. 绘制放射轴线与标签文字
  ctx.fillStyle = '#93a0bd';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < total; i++) {
    let angle = (Math.PI * 2 / total) * i - Math.PI / 2;
    let x = centerX + radius * Math.cos(angle);
    let y = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    let tx = centerX + (radius + 15) * Math.cos(angle);
    let ty = centerY + (radius + 12) * Math.sin(angle) + 4;
    ctx.fillText(labels[i], tx, ty);
  }

  // 3. 绘制玩家能力多边形
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255, 183, 3, 0.35)';
  ctx.strokeStyle = '#ffb703';
  ctx.lineWidth = 2;
  for (let i = 0; i < total; i++) {
    let angle = (Math.PI * 2 / total) * i - Math.PI / 2;
    let val = stats[keys[i]] || 30;
    let r = radius * (Math.min(100, val) / 100);
    let x = centerX + r * Math.cos(angle);
    let y = centerY + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. 更新右侧 12 个数值
  keys.forEach(k => {
    let el = document.getElementById('val-' + k);
    if (el) el.innerText = Math.round(stats[k] || 0);
  });
}

/* ==================== 6. UI 综合更新 ==================== */
/* ==================== 6. UI 综合更新 (完整修复版) ==================== */
/* ==================== 极速性能优化版：按需响应式 updateUI ==================== */
/* ==================== 极速性能优化版：按需响应式 updateUI（修复 ID 与空指针） ==================== */
/* ==================== 完整修复版：按需刷新与全场景 Bracket 签表渲染 ==================== */
function updateUI() {
  const p = gameState.player;
  const s = gameState.stats;
  const wmForStatus = ensureWeekMeta();
  const curEvent = getEventForWeekAndYear(p.week, p.year);

  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  if (currentRank < s.bestRank) s.bestRank = currentRank;

  // 1. 顶部基础球员信息与顶栏胶囊刷新
  const headerNameEl = document.getElementById('header-p-name');
  const headerRankEl = document.getElementById('header-p-rank');
  const headerDateEl = document.getElementById('header-p-date');
  const headerAvatarEl = document.getElementById('header-p-avatar');

  if (headerNameEl) headerNameEl.innerText = p.name;
  if (headerRankEl) headerRankEl.innerText = rankIdx >= 0 ? `#${currentRank}` : '#--';
  if (headerDateEl) headerDateEl.innerText = `${p.year}年 W${p.week}`;
  if (headerAvatarEl && typeof getPlayerAvatarHtml === 'function') {
    headerAvatarEl.innerHTML = getPlayerAvatarHtml(p, 36);
  }

  // 资金平滑动画
  if (typeof animateMoneyCount === 'function') {
    animateMoneyCount(p.money);
  }

  // 2. 推进 1 周按钮状态
  let advCheck = checkCanAdvanceWeek();
  let btnAdvance = document.getElementById('btn-advance-week');
  if (btnAdvance) {
    btnAdvance.disabled = false;
    if (advCheck.ok) {
      btnAdvance.style.opacity = '1';
      btnAdvance.style.cursor = 'pointer';
      btnAdvance.style.background = 'linear-gradient(135deg, #ff2d55 0%, #e11d48 100%)';
      btnAdvance.innerText = '推进 1 周 ➔';
    } else {
      btnAdvance.style.opacity = '0.7';
      btnAdvance.style.cursor = 'pointer';
      btnAdvance.style.background = 'rgba(239, 68, 68, 0.7)';
      btnAdvance.innerText = '⚠️ 请先完成赛事';
    }
  }

  // 3. 当前激活的页面 ID
  const activeTabEl = document.querySelector('.tab-content.active');
  const activeTabId = activeTabEl ? activeTabEl.id : 'tab-profile';

  // ================= A. 主页渲染 (体能、负荷与赛季进度条完全联动) =================
  if (activeTabId === 'tab-profile') {
    const pNameEl = document.getElementById('p-name');
    const pBioEl = document.getElementById('p-bio');
    const pStyleEl = document.getElementById('p-style');
    const pHandEl = document.getElementById('p-hand');
    const pPointsEl = document.getElementById('p-points');
    const pCurrentDateEl = document.getElementById('p-current-date');
    const singleRankEl = document.getElementById('p-world-rank');

    if (pNameEl) pNameEl.innerHTML = `${p.name} <span style="font-size:0.88rem; color:var(--accent-gold); font-weight:700; font-family:var(--font-display);">#${currentRank}</span>`;
    if (pBioEl) pBioEl.innerHTML = `${getFlagImgHtml(p.country)}${p.country} | ${p.age}岁 (${getAgeGrowthFactor(p.age).stage}) | ${p.hand}`;
    if (pStyleEl) pStyleEl.innerText = p.style;
    if (pHandEl) pHandEl.innerText = p.grip;
    if (pPointsEl) pPointsEl.innerText = p.points;
    if (pCurrentDateEl) pCurrentDateEl.innerText = `${p.year}年 第${p.week}周`;
    if (singleRankEl) singleRankEl.innerText = rankIdx >= 0 ? `#${currentRank}` : "未入榜";

    // 伤病状态标签
    const injuryBadge = document.getElementById('injury-badge');
    if (injuryBadge) {
      if (p.injury && typeof INJURY_TYPES !== 'undefined' && INJURY_TYPES[p.injury]) {
        const inj = INJURY_TYPES[p.injury];
        injuryBadge.style.display = 'inline-block';
        injuryBadge.className = inj.severity === 'severe' ? 'badge badge-smash' : 'badge badge-gold';
        injuryBadge.innerHTML = inj.severity === 'severe' ? `🚨 ${inj.name}` : `🩹 ${inj.name}`;
      } else {
        injuryBadge.style.display = 'none';
      }
    }

      // 首页单打/双打胶囊及变动更新
    const pRankDeltaEl = document.getElementById('p-rank-delta');
    const dRankEl = document.getElementById('p-doubles-world-rank');
    const dRankDeltaEl = document.getElementById('p-doubles-rank-delta');

    if (pRankDeltaEl) {
      let delta = (p.prevRank || currentRank) - currentRank;
      pRankDeltaEl.className = `pill-delta ${delta > 0 ? 'up' : (delta < 0 ? 'down' : 'same')}`;
      pRankDeltaEl.innerText = delta > 0 ? `▲ +${delta}` : (delta < 0 ? `▼ ${delta}` : '-');
    }

    const userPair = gameState.doublesRanking?.find(x => x.isUserPair);
    if (dRankEl) {
      if (userPair) {
        let dRank = gameState.doublesRanking.indexOf(userPair) + 1;
        dRankEl.innerText = `#${dRank}`;
        if (dRankDeltaEl) {
          let dDelta = (userPair.prevRank || dRank) - dRank;
          dRankDeltaEl.className = `pill-delta ${dDelta > 0 ? 'up' : (dDelta < 0 ? 'down' : 'same')}`;
          dRankDeltaEl.innerText = dDelta > 0 ? `▲ +${dDelta}` : (dDelta < 0 ? `▼ ${dDelta}` : '-');
        }
      } else {
        dRankEl.innerText = '未组队';
        if (dRankDeltaEl) {
          dRankDeltaEl.className = 'pill-delta same';
          dRankDeltaEl.innerText = '-';
        }
      }
    }

    // 主页四小卡片
    let homeWinRate = s.totalMatches > 0 ? ((s.wins / s.totalMatches) * 100).toFixed(1) + "%" : "0.0%";
    const statWinRateEl = document.getElementById('stat-win-rate');
    const statRecordEl = document.getElementById('stat-record');
    const statTitlesEl = document.getElementById('stat-titles');
    const statBestRankEl = document.getElementById('stat-best-rank');
    // 首页 Bento Grid 卡片 6：商业品牌赞助综合状态
    const sponsorEl = document.getElementById('p-sponsor');
    if (sponsorEl) {
      ensurePlayerSponsors();
      let parts = [];
      if (p.sponsors?.gear) {
        parts.push(`🏓 ${p.sponsors.gear.name}`);
      }
      const commCount = p.sponsors?.commercials?.length || 0;
      if (commCount > 0) {
        let commTotalPay = p.sponsors.commercials.reduce((sum, c) => sum + (c.weeklyPay || 0), 0);
        parts.push(`💼 ${commCount}个商业代言 (+$${commTotalPay}/周)`);
      }

      if (parts.length > 0) {
        sponsorEl.innerHTML = parts.join('<br>');
        sponsorEl.style.fontSize = '0.78rem';
      } else {
        sponsorEl.innerText = '暂无签约';
        sponsorEl.style.fontSize = '0.86rem';
      }
    }

    if (statWinRateEl) statWinRateEl.innerText = homeWinRate;
    if (statRecordEl) statRecordEl.innerText = `${s.wins}胜 / ${s.losses}负`;
    if (statTitlesEl) statTitlesEl.innerText = `${s.titles} 🏆`;
    if (statBestRankEl) statBestRankEl.innerText = `#${s.bestRank}`;

    // 1. 体能储备数据与进度条联动刷新
    const staminaVal = Math.max(0, Math.min(100, Math.round(p.stamina || 0)));
    const staminaBar = document.getElementById('p-stamina-bar');
    const staminaText = document.getElementById('p-stamina-text');
    const staminaNum = document.getElementById('p-stamina');

    if (staminaNum) {
      staminaNum.innerText = `${staminaVal}/100`;
      if (staminaVal >= 70) staminaNum.style.color = '#34c759';
      else if (staminaVal >= 40) staminaNum.style.color = '#ff9f0a';
      else staminaNum.style.color = '#ff3b30';
    }

    if (staminaText) {
      staminaText.innerText = `${staminaVal}%`;
      if (staminaVal >= 70) staminaText.style.color = '#34c759';
      else if (staminaVal >= 40) staminaText.style.color = '#ff9f0a';
      else staminaText.style.color = '#ff3b30';
    }

    if (staminaBar) {
      staminaBar.style.width = `${staminaVal}%`;
      if (staminaVal >= 70) {
        staminaBar.style.background = 'linear-gradient(90deg, #30d158, #34c759)';
      } else if (staminaVal >= 40) {
        staminaBar.style.background = 'linear-gradient(90deg, #ffd60a, #ff9f0a)';
      } else {
        staminaBar.style.background = 'linear-gradient(90deg, #ff453a, #ff3b30)';
      }
    }

    // 2. 连续参赛负荷与指示灯状态
    const fatigueCount = Math.max(0, p.consecutiveTournaments || 0);
    const fatigueEl = document.getElementById('p-fatigue');
    const fatigueSegs = document.querySelectorAll('#p-fatigue-segments .mac-load-seg');
    const fatigueStatus = document.getElementById('p-fatigue-status');

    if (fatigueEl) {
      fatigueEl.innerText = `${fatigueCount} 站`;
    }

    if (fatigueSegs && fatigueSegs.length > 0) {
      fatigueSegs.forEach((seg, i) => {
        seg.className = 'mac-load-seg';
        if (i < fatigueCount) {
          seg.classList.add(`active-${Math.min(4, i + 1)}`);
        }
      });
    }

    if (fatigueStatus) {
      if (fatigueCount === 0) {
        fatigueStatus.innerText = '良好';
        fatigueStatus.style.color = '#34c759';
      } else if (fatigueCount <= 2) {
        fatigueStatus.innerText = '适中';
        fatigueStatus.style.color = '#ffcc00';
      } else if (fatigueCount === 3) {
        fatigueStatus.innerText = '偏重';
        fatigueStatus.style.color = '#ff9500';
      } else {
        fatigueStatus.innerText = '⚠️ 超负荷';
        fatigueStatus.style.color = '#ff3b30';
      }
    }

    // 3. 赛季进度条
    const seasonBar = document.getElementById('p-season-bar');
    if (seasonBar) {
      const seasonPct = Math.min(100, Math.max(2, Math.round(((p.week || 1) / 52) * 100)));
      seasonBar.style.width = `${seasonPct}%`;
    }

    drawRadarChart();
  }

  // ================= B. 赛事面板与签表渲染 =================
  if (activeTabId === 'tab-tournament') {
    const btnEnter = document.getElementById('btn-enter-tournament');
    const btnSim = document.getElementById('btn-sim-round');
    const btnTeam = document.getElementById('btn-enter-team-event');
    const qMsg = document.getElementById('tour-qualification-msg');
    const tourTitleEl = document.getElementById('tour-display-title');
    const tourPointsEl = document.getElementById('tour-display-points');
    const switcher = document.getElementById('tour-bracket-switcher');

    if (isTeamEventType(curEvent.type)) {
      if (btnEnter) btnEnter.style.display = "none";
      if (btnSim) btnSim.style.display = "none";
      if (switcher) switcher.style.display = "none";
      const weekEventsBox = document.getElementById('week-events-select');
      if (weekEventsBox) { weekEventsBox.style.display = 'none'; weekEventsBox.innerHTML = ''; }

      if (gameState.currentTeamEvent && gameState.currentTeamEvent.week === p.week) {
        if (btnTeam) btnTeam.style.display = "none";
        let te = gameState.currentTeamEvent;
        if (qMsg) {
          if (!te.userSelected) qMsg.innerHTML = `📋 国家队选拔已公布，本站你未能入选 ${p.country} 代表队。`;
          else if (te.completed) qMsg.innerHTML = `🏆 团体赛已结束！`;
          else qMsg.innerHTML = `🔥 团体赛正在进行！你已代表 ${p.country} 出战。`;
        }
      } else {
        if (btnTeam) btnTeam.style.display = "inline-block";
        if (qMsg) qMsg.innerHTML = `<span style="color: var(--accent-gold);">🏆 本周为团体赛周，点击按钮查看选拔结果！</span>`;
      }
      renderTeamEventPanel();
      return;
    }

    if (btnTeam) btnTeam.style.display = "none";
    const teamInfoBox = document.getElementById('team-event-info');
    if (teamInfoBox) { teamInfoBox.style.display = 'none'; teamInfoBox.innerHTML = ''; }

    renderWeekEventSelector();

    const weekMetaForUI = ensureWeekMeta();
    const multiWeekForUI = weekMetaForUI.events.length > 1;
    const viewingIdForUI = weekMetaForUI.viewingEventId || null;
    const showingSelectorGrid = multiWeekForUI && !viewingIdForUI && !gameState.currentTournament;

    const activeEvent = (viewingIdForUI ? weekMetaForUI.events.find(e => e.id === viewingIdForUI) : null) 
                        || (gameState.currentTournament ? weekMetaForUI.events.find(e => e.id === gameState.currentTournament.eventId) : null)
                        || curEvent;

    if (activeEvent) {
      if (tourTitleEl) tourTitleEl.innerText = `第${p.week}周: ${activeEvent.name}${viewingIdForUI && viewingIdForUI !== curEvent.id ? ' 🔍[浏览中]' : ''}`;
      if (tourPointsEl) tourPointsEl.innerText = `冠军积分: ${activeEvent.points} | 规模: ${activeEvent.drawSize > 0 ? activeEvent.drawSize + '强' : '集训周'}`;
    }

    if (activeEvent.points === 0) {
      if (btnEnter) btnEnter.style.display = "none";
      if (btnSim) btnSim.style.display = "none";
      if (switcher) switcher.style.display = "none";
      const bRoot = document.getElementById('bracket-root');
      if (bRoot) bRoot.innerHTML = '';
      if (qMsg) qMsg.innerHTML = `本周为国家队封闭集训/休赛周。请在【训练】中规划 7 天计划并推进时间。`;
    } else if (showingSelectorGrid) {
      if (btnEnter) btnEnter.style.display = "none";
      if (btnSim) btnSim.style.display = "none";
      if (switcher) switcher.style.display = "none";
      const bRoot = document.getElementById('bracket-root');
      if (bRoot) bRoot.innerHTML = '';
      if (qMsg) qMsg.innerHTML = `<span style="color: var(--accent-gold);">🗓️ 本周同时开出多站赛事，请先在上方卡片中选择 1 站进入报名或查看签表。</span>`;
    } else if (gameState.currentTournament && gameState.currentTournament.week === p.week && (!viewingIdForUI || viewingIdForUI === gameState.currentTournament.eventId)) {
      if (btnEnter) btnEnter.style.display = "none";
      let t = gameState.currentTournament;
      let isBoth = (t.mode === 'both');
      let isCompleted = isBoth ? (t.singles?.completed && t.doubles?.completed) : t.completed;

      if (isCompleted) {
        if (btnSim) btnSim.style.display = "none";
        if (qMsg) qMsg.innerHTML = `🏆 本站赛事已结束，冠军已经诞生！请推进 1 周继续赛季。`;
      } else {
        if (btnSim) btnSim.style.display = "inline-block";
        let curSubForBtn = isBoth ? ((currentActiveBracketTab === 'doubles') ? t.doubles : t.singles) : t;
        let hasUserMatch = Boolean(!curSubForBtn.completed && !curSubForBtn.isUserKnockedOut && curSubForBtn.rounds[curSubForBtn.currentRound]?.some(m => (m.p1?.isUser || m.p2?.isUser) && !m.winner));
        if (btnSim) btnSim.innerText = hasUserMatch ? "进行本轮对决 ➔" : "推进下一轮比赛 ➔";
        if (qMsg) qMsg.innerHTML = `🔥 赛事进行中！当前查看：【${curSubForBtn.isDoubles ? '👥 双打' : '🏓 单打'}】第 ${curSubForBtn.currentRound + 1} 轮。`;
      }
      renderBracket();
    } else {
      if (btnSim) btnSim.style.display = "none";
      let isTooHigh = currentRank < (activeEvent.maxRank || 1);
      let isRankShort = currentRank > (activeEvent.qualiCut || 9999);
      let isLockedElsewhere = weekMetaForUI.selectedEventId && weekMetaForUI.selectedEventId !== activeEvent.id;

      const specBracket = getOrBuildEventBracket(activeEvent);
      renderBracket(specBracket);

      if (isLockedElsewhere) {
        if (btnEnter) btnEnter.style.display = "none";
        if (qMsg) qMsg.innerHTML = `👀 正在只读浏览 <strong>${activeEvent.name}</strong> 的对阵签表（你已报名本周其他赛事）。`;
      } else if (isTooHigh) {
        if (btnEnter) btnEnter.style.display = "none";
        if (qMsg) qMsg.innerHTML = `<span style="color: var(--accent-gold);">🛡️ 你的世界排名 (#${currentRank}) 较高受保护限制，当前为签表观战模式。</span>`;
      } else if (isRankShort) {
        if (btnEnter) btnEnter.style.display = "none";
        if (qMsg) qMsg.innerHTML = `👀 你的世界排名 (#${currentRank}) 未达报名线，当前为签表观战模式。`;
      } else {
        if (btnEnter) {
          btnEnter.style.display = "inline-block";
          btnEnter.innerText = `报名参加本站赛事 (选择出战项目) ➔`;
        }
        if (qMsg) qMsg.innerHTML = `<span style="color: var(--accent-blue);">✔ 本站正赛/资格赛签表如下，点击按钮选择出战单打、双打或兼项。</span>`;
      }
    }
  }

  // C. 其它标签页（仅当用户切换至对应 Tab 时才执行对应渲染）
  if (activeTabId === 'tab-ranking') renderRankingTable();
  if (activeTabId === 'tab-calendar') renderCalendarTimeline();
  if (activeTabId === 'tab-doubles') renderDoublesPanel();
  if (activeTabId === 'tab-h2h') renderH2HCards();
  if (activeTabId === 'tab-stats') renderStatsTab();
  if (activeTabId === 'tab-training') {
    renderWeeklySlotsUI();
    // 确保主界面刷新时保障团队列表正常加载
    if (typeof renderStaffList === 'function') renderStaffList();
  }
  if (activeTabId === 'tab-gear') {
    if (typeof checkSponsors === 'function') {
      checkSponsors(currentRank);
    } else if (typeof renderSponsorsCompact === 'function') {
      renderSponsorsCompact(currentRank);
    }
    if (typeof renderBrandFilterButtons === 'function') renderBrandFilterButtons();
    if (typeof renderGearList === 'function') renderGearList();
  }
}

/* ==================== 数据页与荣誉柜完整渲染 ==================== */
function renderStatsTab() {
  const isD = (currentStatsViewMode === 'doubles');
  const s = isD ? (gameState.doublesStats || {}) : gameState.stats;
  const p = gameState.player;

  // 1. 顶部胜率与战绩
  const total = (s.wins || 0) + (s.losses || 0);
  const winRate = total > 0 ? ((s.wins / total) * 100).toFixed(1) + "%" : "0.0%";
  const winRateNum = total > 0 ? (s.wins / total) * 100 : 0;

  const rateEl = document.getElementById('st-rate');
  const ringEl = document.getElementById('st-winrate-ring');
  const winsEl = document.getElementById('st-wins');
  const lossesEl = document.getElementById('st-losses');
  const totalEl = document.getElementById('st-total');
  const bestRankEl = document.getElementById('st-best-rank');
  const titlesTotalEl = document.getElementById('st-titles-total');

  if (rateEl) rateEl.innerText = winRate;
  if (ringEl) ringEl.style.setProperty('--pct', winRateNum.toFixed(1));
  if (winsEl) winsEl.innerText = s.wins || 0;
  if (lossesEl) lossesEl.innerText = s.losses || 0;
  if (totalEl) totalEl.innerText = total;
  if (bestRankEl) bestRankEl.innerText = `#${s.bestRank || (isD ? '--' : 999)}`;
  if (titlesTotalEl) titlesTotalEl.innerText = s.titles || 0;

  // 2. 瓷砖统计项
  const streakCurEl = document.getElementById('st-streak-cur');
  const streakBestEl = document.getElementById('st-streak-best');
  const decideRateEl = document.getElementById('st-decide-rate');
  const decideCntEl = document.getElementById('st-decide-cnt');
  const top10RecordEl = document.getElementById('st-top10-record');
  const top10RateEl = document.getElementById('st-top10-rate');
  const totalPrizeEl = document.getElementById('st-total-prize');
  const bestAchieveEl = document.getElementById('st-best-achievement');

  if (streakCurEl) streakCurEl.innerText = s.currentStreak || 0;
  if (streakBestEl) streakBestEl.innerText = s.bestStreak || 0;

  const decideTotal = (s.decidingMatchesPlayed || 0);
  const decideWon = (s.decidingMatchesWon || 0);
  if (decideRateEl) decideRateEl.innerText = decideTotal > 0 ? ((decideWon / decideTotal) * 100).toFixed(1) + "%" : "0.0%";
  if (decideCntEl) decideCntEl.innerText = `${decideWon}/${decideTotal} 场`;

  const top10W = s.top10Wins || 0;
  const top10L = s.top10Losses || 0;
  const top10Total = top10W + top10L;
  if (top10RecordEl) top10RecordEl.innerText = `${top10W}胜 ${top10L}负`;
  if (top10RateEl) top10RateEl.innerText = `胜率 ${top10Total > 0 ? ((top10W / top10Total) * 100).toFixed(1) + "%" : "0.0%"}`;

  if (totalPrizeEl) totalPrizeEl.innerText = `$${(gameState.stats.totalPrizeWon || 0).toLocaleString()}`;
  if (bestAchieveEl) bestAchieveEl.innerText = s.bestAchievement || (s.titles > 0 ? "巡回赛冠军" : "暂无顶级荣誉");

  // 3. 奖杯柜数量统计 (从 trophyRecords 统计或直接从 stats 取值)
  ensureTrophyRecords();
  const records = gameState.trophyRecords || [];
  const countCat = (cat) => records.filter(r => r.categoryKey === cat).length;

  const trophyMap = {
    'st-title-olympic': s.titlesOlympic ?? countCat('olympic'),
    'st-title-wttc': s.titlesWTTC ?? countCat('wttc'),
    'st-title-wc': s.titlesWorldCup ?? countCat('wc'),
    'st-title-smash': s.titlesSmash ?? countCat('smash'),
    'st-title-finals': s.titlesFinals ?? countCat('finals'),
    'st-title-champ': s.titlesChamp ?? countCat('champ'),
    'st-title-star': s.titlesStar ?? countCat('star'),
    'st-title-contender': s.titlesContender ?? countCat('contender'),
    'st-title-feeder': s.titlesFeeder ?? countCat('feeder')
  };

  Object.entries(trophyMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  });

  // 4. 生涯比赛交手流水
  renderFullMatchHistory();
}

function renderWeeklySlotsUI() {
  if (!gameState.weeklyPlan) return;
  gameState.weeklyPlan.forEach((type, dayIdx) => {
    setDayTraining(dayIdx, type);
  });
}

/* ==================== 9. 带专业分支连线的 Bracket 渲染 ==================== */
function renderBracket(tourOverride) {
  const root = document.getElementById('bracket-root');
  if (!root) return;
  root.innerHTML = '';

  let rootTour = tourOverride;
  if (!rootTour) {
    const wm = ensureWeekMeta();
    if (wm.viewingEventId && (!gameState.currentTournament || gameState.currentTournament.eventId !== wm.viewingEventId)) {
      const curEv = wm.events.find(e => e.id === wm.viewingEventId) || getEventForWeekAndYear(gameState.player.week, gameState.player.year);
      rootTour = getOrBuildEventBracket(curEv);
    } else {
      rootTour = gameState.currentTournament;
    }
  }
  if (!rootTour) return;

  let tour = rootTour;
  const switcher = document.getElementById('tour-bracket-switcher');

  // 只要包含双线项目（自己参赛兼项 或 观赏赛事），始终显示单打/双打切换按钮
  if (rootTour.mode === 'both' || (rootTour.singles && rootTour.doubles)) {
    if (switcher) {
      switcher.style.display = 'flex';
      document.getElementById('btn-switch-singles-bracket')?.classList.toggle('active-gear-type', currentActiveBracketTab === 'singles');
      document.getElementById('btn-switch-doubles-bracket')?.classList.toggle('active-gear-type', currentActiveBracketTab === 'doubles');
    }
    tour = (currentActiveBracketTab === 'doubles') ? (rootTour.doubles || rootTour) : (rootTour.singles || rootTour);
  } else {
    if (switcher) switcher.style.display = 'none';
  }

  if (!tour || !tour.rounds) return;

  tour.rounds.forEach((round, rIdx) => {
    let col = document.createElement('div');
    col.className = 'bracket-round';
    let rTitle = getRoundName(tour.drawSize, rIdx, tour.phase);

    let titleEl = document.createElement('div');
    titleEl.style = "text-align:center; font-size:0.8rem; color:var(--text-dim); margin-bottom:8px; font-weight:bold;";
    titleEl.innerText = rTitle;
    col.appendChild(titleEl);

    for (let i = 0; i < round.length; i += 2) {
      let pairDiv = document.createElement('div');
      pairDiv.className = 'bracket-pair';

      for (let j = 0; j < 2 && (i + j) < round.length; j++) {
        let m = round[i + j];
        let node = document.createElement('div');
        let isUserMatch = m.p1?.isUser || m.p2?.isUser;
        node.className = `match-node ${isUserMatch ? 'active' : ''}`;

        let p1Win = m.winner && m.winner === m.p1;
        let p2Win = m.winner && m.winner === m.p2;

        let p1DisplayHtml = formatParticipantSlotHtml(m.p1, Boolean(tour.isDoubles || m.isDoubles));
        let p2DisplayHtml = formatParticipantSlotHtml(m.p2, Boolean(tour.isDoubles || m.isDoubles));

        let p1Score = '';
        let p2Score = '';
        if (m.score && m.score.includes('-')) {
          let parts = m.score.split('-');
          p1Score = parts[0].trim();
          p2Score = parts[1].trim();
        }

        node.innerHTML = `
          <div class="player-slot ${p1Win ? 'winner' : ''}">
            <span class="bracket-player-name">${p1DisplayHtml}</span>
            <span style="font-weight:bold; font-family:monospace; font-size:0.95rem;">${p1Score}</span>
          </div>
          <div class="player-slot ${p2Win ? 'winner' : ''}">
            <span class="bracket-player-name">${p2DisplayHtml}</span>
            <span style="font-weight:bold; font-family:monospace; font-size:0.95rem;">${p2Score}</span>
          </div>
        `;
        pairDiv.appendChild(node);
      }
      col.appendChild(pairDiv);
    }
    root.appendChild(col);
  });



  // 2. 奥运会专属：在对阵树最右侧挂载【季军争夺战 (铜牌赛)】
  if (tour.bronzeMatch) {
    let bm = tour.bronzeMatch;
    let bronzeCol = document.createElement('div');
    bronzeCol.className = 'bracket-round';
    bronzeCol.style.borderLeft = '2px dashed #334d7d';
    bronzeCol.style.paddingLeft = '18px';
    bronzeCol.style.marginLeft = '10px';

    bronzeCol.innerHTML = `
      <div style="text-align:center; font-size:0.82rem; color:var(--accent-gold); margin-bottom:8px; font-weight:bold;">
        🥉 季军争夺战 (铜牌赛)
      </div>
    `;

    let pairDiv = document.createElement('div');
    pairDiv.className = 'bracket-pair';

    let bmNode = document.createElement('div');
    let isUserBm = bm.p1?.isUser || bm.p2?.isUser;
    bmNode.className = `match-node ${isUserBm ? 'active' : ''}`;
    bmNode.style.border = '1px solid var(--accent-gold)';

    let p1Win = bm.winner && bm.winner === bm.p1;
    let p2Win = bm.winner && bm.winner === bm.p2;

    let bmP1Obj = bm.p1 ? gameState.worldRanking.find(x => x.name === bm.p1.name) || (gameState.retiredPlayers || []).find(x => x.name === bm.p1.name) : null;
    let bmP2Obj = bm.p2 ? gameState.worldRanking.find(x => x.name === bm.p2.name) || (gameState.retiredPlayers || []).find(x => x.name === bm.p2.name) : null;

    let bmP1Flag = bmP1Obj ? getFlagImgHtml(bmP1Obj.country) : '';
    let bmP2Flag = bmP2Obj ? getFlagImgHtml(bmP2Obj.country) : '';

    let bmP1Seed = bm.p1?.seed ? `<span class="seed-badge" style="margin-left:4px; margin-right:0;">[${bm.p1.seed}]</span>` : '';
    let bmP2Seed = bm.p2?.seed ? `<span class="seed-badge" style="margin-left:4px; margin-right:0;">[${bm.p2.seed}]</span>` : '';

    let p1Click = bm.p1 ? `${bmP1Flag}<span class="player-clickable" onclick="openPlayerProfileModal('${bm.p1.name}')">${bm.p1.name}</span>${bmP1Seed}` : '待定';
    let p2Click = bm.p2 ? `${bmP2Flag}<span class="player-clickable" onclick="openPlayerProfileModal('${bm.p2.name}')">${bm.p2.name}</span>${bmP2Seed}` : '待定';

    let p1Score = '';
    let p2Score = '';
    if (bm.score && bm.score.includes('-')) {
      let parts = bm.score.split('-');
      p1Score = parts[0].trim();
      p2Score = parts[1].trim();
    }

    bmNode.innerHTML = `
      <div class="player-slot ${p1Win ? 'winner' : ''}">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px; display:flex; align-items:center;">${p1Click}</span>
        <span style="font-weight:bold; font-family:monospace; font-size:0.95rem; color:var(--accent-gold);">${p1Score}</span>
      </div>
      <div class="player-slot ${p2Win ? 'winner' : ''}">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px; display:flex; align-items:center;">${p2Click}</span>
        <span style="font-weight:bold; font-family:monospace; font-size:0.95rem; color:var(--accent-gold);">${p2Score}</span>
      </div>
    `;

    pairDiv.appendChild(bmNode);
    bronzeCol.appendChild(pairDiv);
    root.appendChild(bronzeCol);
  }
}

// 辅助：生成签表槽位的富文本 HTML (支持单打与 2v2 双打，解决双打显示为单人的问题)
// 辅助：生成签表槽位的富文本 HTML (单打与双打每位选手均可独立点击打开个人档案)
function formatParticipantSlotHtml(participant, isDoubles) {
  if (!participant) return '待定';

  let seedBadge = participant.seed ? `<span class="seed-badge">[${participant.seed}]</span>` : '';

  // 1. 双打组合槽位渲染（两位搭档名字分别绑定点击事件）
  if (isDoubles || participant.isDoubles || participant.player2) {
    let p1 = participant.player1 || { name: participant.name.split('/')[0]?.trim() || "选手1" };
    let p2 = participant.player2 || { name: participant.name.split('/')[1]?.trim() || "搭档" };

    let name1 = p1.name || "选手1";
    let name2 = p2.name || "搭档";

    // 查找选手国家以展示国旗
    let p1Obj = gameState.worldRanking.find(x => x.name === name1) || (gameState.retiredPlayers || []).find(x => x.name === name1);
    let p2Obj = gameState.worldRanking.find(x => x.name === name2) || (gameState.retiredPlayers || []).find(x => x.name === name2);

    let country1 = p1.country || p1Obj?.country || "中国 (CHN)";
    let country2 = p2.country || p2Obj?.country || "中国 (CHN)";

    let flag1 = getFlagImgHtml(country1);
    let flag2 = (country2 !== country1) ? getFlagImgHtml(country2) : '';

    return `
      ${flag1}${flag2}
      <span class="player-clickable" onclick="openPlayerProfileModal('${name1}')" title="查看 ${name1} 个人档案">${name1}</span>
      <span style="color:var(--text-dim); margin:0 3px;">/</span>
      <span class="player-clickable" onclick="openPlayerProfileModal('${name2}')" title="查看 ${name2} 个人档案">${name2}</span>
      ${seedBadge}
    `;
  } 
  // 2. 单打槽位渲染
  else {
    let pObj = gameState.worldRanking.find(x => x.name === participant.name) || (gameState.retiredPlayers || []).find(x => x.name === participant.name);
    let flag = pObj ? getFlagImgHtml(pObj.country) : '';
    return `
      ${flag}
      <span class="player-clickable" onclick="openPlayerProfileModal('${participant.name}')" title="查看 ${participant.name} 个人档案">${participant.name}</span>
      ${seedBadge}
    `;
  }
}

/* ==================== 10. H2H 卡片与选手档案 (仅显示对决过的对手) ==================== */
function renderH2HCards() {
  const container = document.getElementById('h2h-cards-container');
  if (!container) return;
  container.innerHTML = '';

  // 核心修复点：以 h2hData（真实交手记录）为唯一数据源来生成对手列表，
  // 而不是遍历当前世界排名——这样即使对手赛季末退役（被新秀顶替名额），
  // 依旧能在此保留完整的历史交手记录，只是排名会显示为 "Retired"。
  let playedOpponents = Object.keys(gameState.h2hData).map(oppName => {
    let rec = gameState.h2hData[oppName] || { wins: 0, losses: 0, matches: [] };
    let total = rec.wins + rec.losses;

    let activeIdx = gameState.worldRanking.findIndex(x => !x.isUser && x.name === oppName);
    let isRetired = activeIdx === -1;
    let country = "";
    let rankLabel = "";

    if (!isRetired) {
      country = gameState.worldRanking[activeIdx].country;
      rankLabel = `世界排名 #${activeIdx + 1}`;
    } else {
      let rp = (gameState.retiredPlayers || []).find(x => x.name === oppName);
      country = rp ? rp.country : "";
      rankLabel = "Retired";
    }

    return {
      name: oppName,
      country: country,
      rankLabel: rankLabel,
      isRetired: isRetired,
      wins: rec.wins,
      losses: rec.losses,
      total: total
    };
  }).filter(opp => opp.total > 0);

  // 若尚未有任何交手记录时的空状态展示
  if (playedOpponents.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--text-dim); background: var(--bg-card-alt); border-radius: var(--radius-card); border: 1px dashed var(--border);">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🏓</div>
        <div style="font-size: 1rem; font-weight: bold; color: var(--text);">暂无历史交锋记录</div>
        <div style="font-size: 0.84rem; margin-top: 4px;">参加巡回赛资格赛或正赛与其他选手对战后，此处将自动收录对手的交锋档案与胜率。</div>
      </div>
    `;
    return;
  }

  // 按总交手场次从多到少排序；场次相同则胜场多者靠前
  playedOpponents.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return b.wins - a.wins;
  });

  playedOpponents.forEach(opp => {
    let winWidth = "50%";
    let isSlanted = false;

    if (opp.wins > 0 && opp.losses === 0) {
      winWidth = "100%";
    } else if (opp.wins === 0 && opp.losses > 0) {
      winWidth = "0%";
    } else {
      let pct = Math.round((opp.wins / opp.total) * 100);
      pct = Math.max(30, Math.min(70, pct));
      winWidth = pct + "%";
      isSlanted = true;
    }

    let card = document.createElement('div');
    card.className = 'h2h-card';
    card.onclick = () => openPlayerProfileModal(opp.name);

    // 修改 card.innerHTML 中的 h2h-rank-tag 这一行
    card.innerHTML = `
      <div class="h2h-card-header">
        <div class="h2h-title-vs">VS ${opp.name}${opp.isRetired ? ' <span style="font-size:0.72rem; color: var(--text-dim); font-weight:600;">(已退役)</span>' : ''}</div>
        <div class="h2h-rank-tag">${getFlagImgHtml(opp.country)}${opp.country} • ${opp.rankLabel}</div>
      </div>
      <div class="h2h-split-container">
        ${opp.wins > 0 ? `<div class="h2h-bar-win ${isSlanted ? 'slant' : ''}" style="width: ${winWidth};">${opp.wins} Win</div>` : ''}
        ${opp.losses > 0 ? `<div class="h2h-bar-lose">${opp.losses} Lose</div>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

function renderRankingTable() {
  const thead = document.getElementById('ranking-thead');
  const tbody = document.getElementById('ranking-body');
  if (!thead || !tbody) return;

  tbody.innerHTML = '';

  // ---- 模式 A：男子单打排名榜单 ----
  if (currentRankingViewMode === 'singles') {
    thead.innerHTML = `
      <tr>
        <th>排名 (周动向)</th>
        <th>选手 (点击查看战绩/H2H)</th>
        <th>年龄</th>
        <th>协会 (Nation)</th>
        <th>世界积分 (Points)</th>
        <th>身体/生涯状态</th>
        <th>风格打法</th>
      </tr>
    `;

    gameState.worldRanking.slice(0, 500).forEach((item, idx) => {
      let tr = document.createElement('tr');
      if (item.isUser) tr.className = 'is-user';

      let currentRank = idx + 1;
      let delta = (item.prevRank || currentRank) - currentRank;
      let deltaHtml = `<span class="rank-same">-</span>`;
      if (delta > 0) deltaHtml = `<span class="rank-up">▲ +${delta}</span>`;
      else if (delta < 0) deltaHtml = `<span class="rank-down">▼ ${delta}</span>`;

      let currentInjury = item.isUser 
        ? (gameState.player.injury ? (INJURY_TYPES[gameState.player.injury]?.name || "受伤") : "健康")
        : (item.injury || "健康");

      let badgeClass = currentInjury === "健康" ? "badge" : "badge badge-gold";
      let badgeStyle = currentInjury === "健康" ? "background:#10b981; color:#000;" : "";

      tr.innerHTML = `
        <td><strong>#${currentRank}</strong> <span style="margin-left:6px;">${deltaHtml}</span></td>
        <td><span class="player-clickable" onclick="openPlayerProfileModal('${item.name}')">${item.name}</span></td>
        <td>${item.isUser ? gameState.player.age : (item.age || 20)} 岁</td>
        <td>${getFlagImgHtml(item.country)}${item.country}</td>
        <td><span style="color: var(--accent-gold); font-weight: bold;">${item.points}</span></td>
        <td><span class="${badgeClass}" style="${badgeStyle}">${currentInjury}</span></td>
        <td><span class="badge">${item.style || '两面弧圈'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } 
  // ---- 模式 B：男子双打组合排名榜单 ----
  else {
    thead.innerHTML = `
      <tr>
        <th>排名 (动向)</th>
        <th>双打组合 (选手 / 搭档)</th>
        <th>代表协会</th>
        <th>搭档默契度</th>
        <th>双打官方积分</th>
        <th>组合生涯战绩</th>
        <th>冠军头衔</th>
      </tr>
    `;

    // 确保初始 100 对组合已生成
    if (!gameState.doublesRanking || gameState.doublesRanking.length === 0) {
      generateInitial100DoublesPairs();
    }

    gameState.doublesRanking.forEach((pair, idx) => {
      let tr = document.createElement('tr');
      if (pair.isUserPair) tr.className = 'is-user';

      let currentRank = idx + 1;
      let delta = (pair.prevRank || currentRank) - currentRank;
      let deltaHtml = `<span class="rank-same">-</span>`;
      if (delta > 0) deltaHtml = `<span class="rank-up">▲ +${delta}</span>`;
      else if (delta < 0) deltaHtml = `<span class="rank-down">▼ ${delta}</span>`;

      // 解析组合中两名选手的名字
      let p1Name = pair.player1?.name || pair.name.split('/')[0]?.trim() || "选手1";
      let p2Name = pair.player2?.name || pair.name.split('/')[1]?.trim() || "选手2";

      // 构建支持点击弹窗的名字 HTML
      let pairNameHtml = `
        <span class="player-clickable" onclick="openPlayerProfileModal('${p1Name}')">${p1Name}</span>
        <span style="color:var(--text-dim); margin:0 4px;">/</span>
        <span class="player-clickable" onclick="openPlayerProfileModal('${p2Name}')">${p2Name}</span>
      `;

      tr.innerHTML = `
        <td><strong>#${currentRank}</strong> <span style="margin-left:6px;">${deltaHtml}</span></td>
        <td>
          ${pairNameHtml}
          ${pair.isUserPair ? ' <span class="badge badge-gold" style="font-size:0.7rem; margin-left:4px;">我方组合</span>' : ''}
        </td>
        <td>${formatCountryWithFlags(pair.country)}</td>
        <td><span class="badge ${pair.chemistry >= 80 ? 'badge-gold' : 'badge-star'}">${pair.chemistry}</span></td>
        <td><strong style="color:var(--accent-gold); font-family:var(--font-display); font-size:1.05rem;">${pair.points}</strong></td>
        <td><span style="color:var(--accent-blue); font-weight:bold;">${pair.careerWins || 0}胜</span> / <span style="color:var(--accent);">${pair.careerLosses || 0}负</span></td>
        <td><strong style="color:var(--accent-gold);">${pair.titles || 0} 🏆</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }
}

/* ==================== 赛历系统：图二级背景色与右侧详情联动 ==================== */
let selectedCalendarViewWeek = null;

// 映射赛事级别至背景色 class[cite: 2]
function getEventStripClass(type) {
  if (!type) return 'cal-strip-gray';
  let t = type.toLowerCase();
  if (t.includes('smash') || t.includes('olympic') || t.includes('wttc') || t.includes('大满贯') || t.includes('奥运') || t.includes('世乒赛')) {
    return 'cal-strip-red';
  }
  if (t.includes('finals') || t.includes('champion') || t.includes('总决赛') || t.includes('冠军赛') || t.includes('world cup') || t.includes('世界杯')) {
    return 'cal-strip-purple';
  }
  if (t.includes('star') || t.includes('球星')) {
    return 'cal-strip-blue';
  }
  if (t.includes('contender') || t.includes('挑战赛')) {
    return 'cal-strip-green';
  }
  if (t.includes('feeder') || t.includes('支线') || t.includes('洲际') || t.includes('continental')) {
    return 'cal-strip-gold'; // 对应图二的琥珀金色背景[cite: 2]
  }
  return 'cal-strip-gray';
}

// 估算站点的真实奖金池
function getEstimatedPrizePool(ev) {
  if (!ev || !ev.type || ev.points === 0) return '$0';
  let t = ev.type.toLowerCase();
  if (t.includes('smash') || t.includes('大满贯')) return '$1,500,000';
  if (t.includes('finals') || t.includes('总决赛')) return '$1,000,000';
  if (t.includes('champion') || t.includes('冠军赛')) return '$800,000';
  if (t.includes('world cup') || t.includes('世界杯')) return '$1,000,000';
  if (t.includes('star') || t.includes('球星')) return '$275,000';
  if (t.includes('contender') || t.includes('常规挑战')) return '$85,000';
  if (t.includes('feeder') || t.includes('支线')) return '$25,000';
  if (t.includes('olympic') || t.includes('wttc')) return '奥运/世锦最高荣誉';
  return '$40,000';
}

// 场馆信息与本地 ./Venue 图片智能映射
function getEventVenueInfo(eventName) {
  const defaultVenue = {
    city: '世界巡回赛分站',
    venue: '国际乒联官方标准球馆',
    bgImg: './Venue/default.jpg' // 兜底通用背景
  };

  if (!eventName || typeof eventName !== 'string') return defaultVenue;

  // 1. 关键词与本地图片映射表 (支持各大满贯、冠军赛、球星赛、挑战赛与支线赛)
  const venueMap = [
    { keys: ['新加坡', 'Singapore'], city: '新加坡', venue: '新加坡室内体育馆 (Singapore Indoor Stadium)', img: 'singapore.jpg' },
    { keys: ['杜哈', '多哈', 'Doha'], city: '卡塔尔 · 多哈', venue: '卢塞尔体育馆 (Lusail Sports Arena)', img: 'doha.jpg' },
    { keys: ['北京', 'Beijing', '首钢'], city: '中国 · 北京', venue: '首钢园冰球馆 (Shougang Park Arena)', img: 'beijing.jpg' },
    { keys: ['澳门', 'Macao', 'Macau'], city: '中国 · 澳门', venue: '塔石体育馆 (Tap Seac Multisport Pavilion)', img: 'macau.jpg' },
    { keys: ['巴黎', 'Paris'], city: '法国 · 巴黎', venue: '南巴黎竞技场 4 号馆 (Paris South Arena 4)', img: 'paris.jpg' },
    { keys: ['法兰克福', 'Frankfurt'], city: '德国 · 法兰克福', venue: '苏瓦格能量竞技场 (Süwag Energie Arena)', img: 'frankfurt.jpg' },
    { keys: ['蒙彼利埃', 'Montpellier'], city: '法国 · 蒙彼利埃', venue: '南法竞技场 (Sud de France Arena)', img: 'montpellier.jpg' },
    { keys: ['仁川', 'Incheon'], city: '韩国 · 仁川', venue: '迎仕柏综艺馆 (Inspire Arena)', img: 'incheon.jpg' },
    { keys: ['重庆', 'Chongqing'], city: '中国 · 重庆', venue: '华熙 LIVE · 鱼洞文体中心', img: 'chongqing.jpg' },
    { keys: ['太原', 'Taiyuan'], city: '中国 · 太原', venue: '滨河体育中心', img: 'taiyuan.jpg' },
    { keys: ['福冈', 'Fukuoka'], city: '日本 · 福冈', venue: '北九州市立综合体育馆', img: 'fukuoka.jpg' },
    { keys: ['名古屋', 'Nagoya'], city: '日本 · 名古屋', venue: '武田梯瓦名古屋穹顶球场', img: 'nagoya.jpg' },
    { keys: ['横滨', 'Yokohama'], city: '日本 · 横滨', venue: '横滨文化体育馆', img: 'yokohama.jpg' },
    { keys: ['杜塞尔多夫', 'Dusseldorf', 'Düsseldorf'], city: '德国 · 杜塞尔多夫', venue: 'ARAG 主赛场 (ARAG CenterCourt)', img: 'dusseldorf.jpg' },
    { keys: ['布达佩斯', 'Budapest'], city: '匈牙利 · 布达佩斯', venue: '布达佩斯奥林匹克中心', img: 'budapest.jpg' },
    { keys: ['曼谷', 'Bangkok'], city: '泰国 · 曼谷', venue: '华马克室内体育馆 (Huamark Stadium)', img: 'bangkok.jpg' },
    { keys: ['卢布尔雅那', 'Ljubljana'], city: '斯洛文尼亚 · 卢布尔雅那', venue: '蒂沃利体育馆 (Tivoli Hall)', img: 'ljubljana.jpg' },
    { keys: ['萨格勒布', 'Zagreb'], city: '克罗地亚 · 萨格勒布', venue: 'Dom Sportova 体育馆', img: 'zagreb.jpg' },
    { keys: ['里约', 'Rio'], city: '巴西 · 里约热内卢', venue: '卡里奥卡竞技场 1 号馆', img: 'rio.jpg' },
    { keys: ['拉各斯', 'Lagos'], city: '尼日利亚 · 拉各斯', venue: '特斯利姆·巴洛贡体育场', img: 'lagos.jpg' },
    { keys: ['马斯喀特', 'Muscat'], city: '阿曼 · 马斯喀特', venue: '苏丹卡布斯综合体育中心', img: 'muscat.jpg' },
    { keys: ['新德里', '钦奈', 'Goa', 'India'], city: '印度赛区', venue: '甘地室内体育馆', img: 'india.jpg' },
    { keys: ['威海', 'Weihai'], city: '中国 · 威海', venue: '威海市南海奥林匹克中心', img: 'weihai.jpg' },
    { keys: ['成都', 'Chengdu'], city: '中国 · 成都', venue: '四川省体育馆 / 高新体育中心', img: 'chengdu.jpg' },
    { keys: ['奥运', 'Olympic'], city: '奥林匹克赛区', venue: '奥运乒乓球专属主场馆', img: 'olympic.jpg' },
    { keys: ['世乒赛', '世锦赛', 'WTTC'], city: '世界乒乓球锦标赛', venue: '世锦赛官方特设超级主赛场', img: 'wttc.jpg' }
  ];

  // 2. 遍历匹配赛站名称
  for (const item of venueMap) {
    if (item.keys.some(k => eventName.includes(k))) {
      return {
        city: item.city,
        venue: item.venue,
        bgImg: `./Venue/${item.img}` // 指向本地 Venue 路径
      };
    }
  }

  // 3. 支线赛 / 洲际赛通用分类匹配
  if (eventName.includes('支线') || eventName.includes('Feeder')) {
    return {
      city: 'WTT 支线赛赛区',
      venue: 'WTT 官方巡回赛球馆',
      bgImg: './Venue/feeder.jpg'
    };
  }

  return defaultVenue;
}

// 主渲染函数：渲染 52 周卡片 (无 badge tag，纯背景色色块)
function renderCalendarTimeline() {
  const container = document.getElementById('calendar-timeline');
  if (!container) return;
  container.innerHTML = '';
  
  const curW = gameState.player.week;
  const curY = gameState.player.year;

  // 默认选中当前周
  if (!selectedCalendarViewWeek) {
    selectedCalendarViewWeek = curW;
  }

  for (let w = 1; w <= 52; w++) {
    const isCur = (w === curW);
    const isSelected = (w === selectedCalendarViewWeek);
    const events = isCur ? ensureWeekMeta().events : generateWeekEvents(w, curY);
    const isPast = (w < curW);

    const card = document.createElement('div');
    card.className = `timeline-card ${isCur ? 'current' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected-view' : ''}`;
    
    // 点击切换右侧 1/4 区域详情
    card.onclick = () => {
      selectedCalendarViewWeek = w;
      document.querySelectorAll('.timeline-card').forEach(c => c.classList.remove('selected-view'));
      card.classList.add('selected-view');
      renderCalendarSidePanel(curY, w);
    };

    let eventsHtml = '';
    if (events.length > 1) {
      eventsHtml = events.map(e => `
        <div class="cal-event-strip ${getEventStripClass(e.type)}">
          <div class="cal-strip-title">${e.name}</div>
          <div class="cal-strip-sub">
            <span>${e.type}</span>
            <span style="font-weight:700;">+${e.points}分</span>
          </div>
        </div>
      `).join('');
      eventsHtml += `<div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">本周 ${events.length} 站并行赛事</div>`;
    } else {
      const ev = events[0];
      eventsHtml = `
        <div class="cal-event-strip ${getEventStripClass(ev.type)}">
          <div class="cal-strip-title">${ev.name}</div>
          <div class="cal-strip-sub">
            <span>${ev.type}</span>
            <span style="font-weight:700;">${ev.points > 0 ? '+' + ev.points + '分' : '集训'}</span>
          </div>
        </div>
        <div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">
          直通: Top ${ev.directCut || 999} | 资格赛: Top ${ev.qualiCut || 999}
        </div>
      `;
    }

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span class="timeline-week" style="font-size:0.85rem;">第 ${w} 周 ${isCur ? '📍[本周]' : ''}</span>
        <span style="font-size:0.7rem; color:var(--accent-cyan); font-weight:bold;">详情 ➔</span>
      </div>
      ${eventsHtml}
    `;
    container.appendChild(card);
  }

  // 同步刷新右侧 1/4 面板
  renderCalendarSidePanel(curY, selectedCalendarViewWeek);
}

/* ==================== 战报核心归档与智能历史补齐引擎 ==================== */

// 1. 获取或智能补齐某周的全部赛事名次（彻底解决历史周次空白问题）
function getOrEnsureWeekPodiums(year, week) {
  if (!gameState.tournamentPodiums) gameState.tournamentPodiums = {};
  const key = `${year}_${week}`;
  if (!gameState.tournamentPodiums[key]) gameState.tournamentPodiums[key] = {};

  const curW = gameState.player.week;
  const curY = gameState.player.year;
  const isPast = (year < curY) || (year === curY && week < curW);
  const events = generateWeekEvents(week, year);

  events.forEach(ev => {
    if (!(ev.drawSize > 0 && ev.points > 0)) return;
    const isTeam = isTeamEventType(ev.type);

    // 团体赛归档补齐
    if (isTeam) {
      const hasTeamRecord = gameState.tournamentPodiums[key][ev.id] || 
                            gameState.tournamentPodiums[key][ev.name] || 
                            gameState.tournamentPodiums[key]["team_event"];
      if (!hasTeamRecord && isPast) {
        const topTeams = ["中国 (CHN)", "日本 (JPN)", "德国 (GER)", "法国 (FRA)", "韩国 (KOR)", "瑞典 (SWE)"];
        gameState.tournamentPodiums[key][ev.id] = {
          eventName: ev.name,
          champion: topTeams[0],
          runnerUp: topTeams[1],
          thirds: [topTeams[2], topTeams[3]]
        };
      }
      return;
    }

    // 单打战报归档补齐
    const hasSingles = gameState.tournamentPodiums[key][ev.id] || gameState.tournamentPodiums[key][ev.name];
    if (!hasSingles && isPast) {
      let pool = gameState.worldRanking.filter(x => !x.isUser && (x.injury !== "重度伤病"));
      if (pool.length < 8) pool = gameState.worldRanking.slice(0, 32);
      
      let candidatePool = pool.slice(0, Math.min(pool.length, ev.drawSize || 32));
      let champ = candidatePool[Math.floor(Math.random() * Math.min(3, candidatePool.length))]?.name || "王楚钦";
      let rem1 = candidatePool.filter(x => x.name !== champ);
      let runnerUp = rem1[Math.floor(Math.random() * Math.min(4, rem1.length))]?.name || "樊振东";
      let rem2 = rem1.filter(x => x.name !== runnerUp);
      let thirds = [rem2[0]?.name || "梁靖崑", rem2[1]?.name || "马龙"];

      gameState.tournamentPodiums[key][ev.id] = {
        eventName: ev.name,
        champion: champ,
        runnerUp: runnerUp,
        thirds: thirds
      };
    }

    // 双打战报归档补齐
    const dKey = ev.id + '_doubles';
    const hasDoubles = gameState.tournamentPodiums[key][dKey] || gameState.tournamentPodiums[key][ev.name + ' (双打)'];
    if (!hasDoubles && isPast) {
      let dPool = (gameState.doublesRanking && gameState.doublesRanking.length > 0)
        ? gameState.doublesRanking.filter(x => !x.isUserPair)
        : [];
      let dChamp = dPool[0]?.name || "樊振东 / 王楚钦";
      let dRunner = dPool[1]?.name || "户上隼辅 / 篠塚大登";
      let dThirds = [dPool[2]?.name || "勒布伦兄弟", dPool[3]?.name || "林钟勋 / 安宰贤"];

      gameState.tournamentPodiums[key][dKey] = {
        eventName: ev.name + ' (双打)',
        champion: dChamp,
        runnerUp: dRunner,
        thirds: dThirds
      };
    }
  });

  return gameState.tournamentPodiums[key];
}

// 2. 当前选中的右侧赛历分站索引
let selectedSidePanelEventIndex = 0;

// 切换右侧选中的分站（支持左右箭头循环切换）
function switchSidePanelEvent(year, week, delta) {
  const events = (week === gameState.player.week) ? ensureWeekMeta().events : generateWeekEvents(week, year);
  if (!events || events.length === 0) return;
  selectedSidePanelEventIndex = (selectedSidePanelEventIndex + delta + events.length) % events.length;
  renderCalendarSidePanel(year, week);
}

// 渲染右侧面板（包含双打季军与顶部切站箭头）
function renderCalendarSidePanel(year, week) {
  const panel = document.getElementById('calendar-side-panel');
  if (!panel) return;

  const events = (week === gameState.player.week) ? ensureWeekMeta().events : generateWeekEvents(week, year);
  if (selectedSidePanelEventIndex >= events.length) selectedSidePanelEventIndex = 0;

  const primaryEv = events[selectedSidePanelEventIndex] || events[0] || { name: '国家队集训周', type: 'Training', points: 0 };
  const venueInfo = getEventVenueInfo(primaryEv.name);
  const prizePool = getEstimatedPrizePool(primaryEv);
  const curW = gameState.player.week;
  const curY = gameState.player.year;
  const isPast = (year < curY) || (year === curY && week < curW);
  const isCur = (week === curW && year === curY);

  const weekPodiums = getOrEnsureWeekPodiums(year, week);
  const isTeam = isTeamEventType(primaryEv.type);
  const pDataSingles = weekPodiums[primaryEv.id] || weekPodiums[primaryEv.name] || (isTeam ? weekPodiums["team_event"] : null);
  const pDataDoubles = weekPodiums[primaryEv.id + '_doubles'] || weekPodiums[primaryEv.name + ' (双打)'];

  // 1. 右上角切站箭头（替代原有的 WTT 标签栏）
  let navArrowsHtml = '';
  if (events.length > 1) {
    navArrowsHtml = `
      <div class="side-event-nav-arrows">
        <button class="side-nav-arrow-btn" onclick="switchSidePanelEvent(${year}, ${week}, -1)" title="上一站">◀</button>
        <span class="side-nav-page">${selectedSidePanelEventIndex + 1}/${events.length}</span>
        <button class="side-nav-arrow-btn" onclick="switchSidePanelEvent(${year}, ${week}, 1)" title="下一站">▶</button>
      </div>
    `;
  }

  // 2. 领奖台数据构造（补充双打季军）
  let podiumHtml = '';
  if (isPast || (isCur && pDataSingles)) {
    let singlesChamp = pDataSingles?.champion ? formatPodiumParticipant(pDataSingles.champion, false) : '—';
    let singlesRunner = pDataSingles?.runnerUp ? formatPodiumParticipant(pDataSingles.runnerUp, false) : '—';
    let singlesThirds = Array.isArray(pDataSingles?.thirds) ? pDataSingles.thirds.map(t => formatPodiumParticipant(t, false)).join('、') : (pDataSingles?.thirds || '—');

    let doublesThirds = '—';
    if (pDataDoubles) {
      doublesThirds = Array.isArray(pDataDoubles.thirds)
        ? pDataDoubles.thirds.map(t => formatPodiumParticipant(t, true)).join('、')
        : (pDataDoubles.thirds ? formatPodiumParticipant(pDataDoubles.thirds, true) : '—');
    }

    podiumHtml = `
      <div class="side-podium-box">
        <div class="side-podium-title">
          <span>🏆 ${isTeam ? '团体赛成绩' : '单打领奖台'}</span>
          <span style="font-size:0.68rem; color:var(--text-dim);">官方认证</span>
        </div>
        <div class="side-podium-item gold">
          <span class="side-podium-rank" style="color:var(--accent-gold);">🥇 冠军</span>
          <span class="side-podium-name">${singlesChamp}</span>
        </div>
        <div class="side-podium-item">
          <span class="side-podium-rank" style="color:#cbd5e1;">🥈 亚军</span>
          <span class="side-podium-name">${singlesRunner}</span>
        </div>
        <div class="side-podium-item">
          <span class="side-podium-rank" style="color:#f59e0b;">🥉 季军</span>
          <span class="side-podium-name">${singlesThirds}</span>
        </div>

        ${(!isTeam && pDataDoubles) ? `
          <div class="side-podium-title" style="margin-top:4px;">
            <span>👥 双打领奖台</span>
          </div>
          <div class="side-podium-item gold">
            <span class="side-podium-rank" style="color:var(--accent-cyan);">🥇 冠军</span>
            <span class="side-podium-name">${formatPodiumParticipant(pDataDoubles.champion, true)}</span>
          </div>
          <div class="side-podium-item">
            <span class="side-podium-rank" style="color:#cbd5e1;">🥈 亚军</span>
            <span class="side-podium-name">${formatPodiumParticipant(pDataDoubles.runnerUp, true)}</span>
          </div>
          <div class="side-podium-item">
            <span class="side-podium-rank" style="color:#f59e0b;">🥉 季军</span>
            <span class="side-podium-name">${doublesThirds}</span>
          </div>
        ` : ''}
      </div>
    `;
  } else if (isCur) {
    podiumHtml = `
      <div class="side-podium-box" style="text-align:center; padding:10px;">
        <div style="font-size:1.3rem; margin-bottom:2px;">🔥</div>
        <div style="font-weight:bold; color:var(--accent-gold); font-size:0.82rem;">本周赛事激战中</div>
        <div style="font-size:0.7rem; color:var(--text-dim); margin-top:2px;">完赛并推进周次后在此生成最终战报</div>
      </div>
    `;
  } else {
    podiumHtml = `
      <div class="side-podium-box" style="text-align:center; padding:10px;">
        <div style="font-size:1.3rem; margin-bottom:2px;">⏳</div>
        <div style="font-weight:bold; color:var(--text-dim); font-size:0.82rem;">赛事尚未开打</div>
      </div>
    `;
  }

  panel.innerHTML = `
    <!-- 顶部：标题 + 左右切换箭头 -->
    <div class="side-panel-header">
      <div class="side-panel-date">${year}年 第 ${week} 周 · 巡回赛</div>
      ${navArrowsHtml}
    </div>

    <!-- 站点海报图 (带图片加载容错兜底) -->
    <div class="side-tour-poster" style="background-image: url('${venueInfo.bgImg}'), url('./Venue/default.jpg');">
      <div class="side-poster-gradient">
        <div class="side-poster-title">${primaryEv.name}</div>
        <div class="side-poster-venue">
          <span>📍</span> <span>${venueInfo.city} · ${venueInfo.venue}</span>
        </div>
      </div>
    </div>

    <!-- 领奖台区域（已移除原有的 WTT 药丸按钮并上移） -->
    ${podiumHtml}

    <!-- 关键参数数据 -->
    <div class="side-specs-grid">
      <div class="side-spec-box">
        <div class="side-spec-label">赛事级别</div>
        <div class="side-spec-val" style="color:var(--accent-cyan); font-size:0.82rem;">${primaryEv.type || '巡回赛'}</div>
      </div>
      <div class="side-spec-box">
        <div class="side-spec-label">总奖金池</div>
        <div class="side-spec-val" style="color:var(--accent-gold); font-size:0.86rem;">${prizePool}</div>
      </div>
      <div class="side-spec-box">
        <div class="side-spec-label">冠军单打积分</div>
        <div class="side-spec-val" style="color:#4ade80;">+${primaryEv.points} pts</div>
      </div>
      <div class="side-spec-box">
        <div class="side-spec-label">正赛签表规模</div>
        <div class="side-spec-val">${primaryEv.drawSize > 0 ? primaryEv.drawSize + ' 强' : '集训'}</div>
      </div>
    </div>

    <!-- 唤起完整弹窗战报按钮 -->
    <button class="btn-primary" style="width:100%; padding:8px; font-size:0.82rem; display:flex; align-items:center; justify-content:center; gap:6px;" onclick="openWeekPodiumModal(${year}, ${week})">
      <span>🏆</span> <span>查看该周全部详细战报 ➔</span>
    </button>
  `;
}

// 4. 辅助函数：保存玩家亲自参加并完成的赛事领奖台
function saveTournamentSubPodium(tour, year, week, eventId, eventName, isDoubles) {
  if (!tour || !tour.rounds || tour.rounds.length === 0) return;
  let finalMatch = tour.rounds[tour.rounds.length - 1][0];
  if (!finalMatch || !finalMatch.winner) return;

  let champName = finalMatch.winner.name;
  let runnerUpName = (finalMatch.winner === finalMatch.p1 ? finalMatch.p2 : finalMatch.p1)?.name || "—";
  let thirds = [];
  if (tour.bronzeMatch && tour.bronzeMatch.winner) {
    thirds.push(tour.bronzeMatch.winner.name);
  } else if (tour.rounds.length >= 2) {
    let semiRound = tour.rounds[tour.rounds.length - 2];
    semiRound.forEach(sm => {
      let loser = (sm.winner === sm.p1 ? sm.p2 : sm.p1);
      if (loser && loser.name) thirds.push(loser.name);
    });
  }

  recordTournamentPodium(year, week, eventId, eventName, champName, runnerUpName, thirds);
}

function renderFullMatchHistory() {
  const box = document.getElementById('full-match-log');
  if (gameState.matchHistory.length > 0) {
    box.innerHTML = gameState.matchHistory.map(x => `<div>• ${x}</div>`).join('');
  }
}

/* ==================== 13. 存档与系统启动 ==================== */
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('nav button, .nav-capsule-btn').forEach(b => b.classList.remove('active'));
  
  let targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');
  
  // 激活导航按钮高亮
  document.querySelectorAll('.nav-capsule-btn').forEach(btn => {
    if (btn.getAttribute('onclick')?.includes(tabId)) {
      btn.classList.add('active');
    }
  });

  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;

  // 统一执行基础 UI 刷新（包含首页与当前周次）
  updateUI();

  // 针对特定标签页做补充重绘
  if (tabId === 'tab-profile') drawRadarChart();
  if (tabId === 'tab-stats') renderStatsTab();
  if (tabId === 'tab-ranking') renderRankingTable();
  if (tabId === 'tab-calendar') {
    renderCalendarTimeline();
    scrollToCurrentWeek();
  }
  if (tabId === 'tab-doubles') renderDoublesPanel();
  if (tabId === 'tab-h2h') renderH2HCards();
  if (tabId === 'tab-gear') {
    if (typeof checkSponsors === 'function') {
      checkSponsors(currentRank);
    } else if (typeof renderSponsorsCompact === 'function') {
      renderSponsorsCompact(currentRank);
    }
    if (typeof renderBrandFilterButtons === 'function') renderBrandFilterButtons();
    if (typeof renderGearList === 'function') renderGearList();
  }
  if (tabId === 'tab-training') {
    renderWeeklySlotsUI();
    if (typeof renderStaffList === 'function') renderStaffList();
  }
}

function initPlayerCreation() {
  gameState.player.name = document.getElementById('inp-name').value || "陈星远";
  gameState.player.country = document.getElementById('inp-country').value;
  gameState.player.age = parseInt(document.getElementById('inp-age').value) || 16;
  gameState.player.hand = document.getElementById('inp-hand-side').value;
  gameState.player.grip = document.getElementById('inp-grip').value;
  gameState.player.style = document.getElementById('inp-style-type').value;

  document.getElementById('create-modal').style.display = 'none';
  gameState.player.rankHistory = [];
  generateTop300();
  recordRankHistoryPoint();
  refreshSlots();
  renderStaffList();
  renderGearList('blade');
  updateUI();
  saveGame();
}

window.onload = () => {
  const cSel = document.getElementById('inp-country');
  COUNTRIES_GLOBAL.forEach(c => {
    let opt = document.createElement('option');
    opt.value = c; opt.innerText = c;
    cSel.appendChild(opt);
  });

  if (!loadGame(false)) {
    document.getElementById('create-modal').style.display = 'flex';
  }
};

/* ==================== 推进周次前置校验 ==================== */
function checkCanAdvanceWeek() {
  const p = gameState.player;
  const t = gameState.currentTournament;
  
  if (t && t.week === p.week) {
    // 兼项模式：单双打均完赛即算整站完成
    if (t.mode === 'both') {
      if (t.singles?.completed && t.doubles?.completed) {
        t.completed = true;
      }
    }
    // 观赛模式/只读模式不阻止推进
    if (t.readOnly || t.discipline === 'spectate') {
      t.completed = true;
    }

    if (!t.completed && !t.isUserKnockedOut) {
      return { ok: false, msg: `⚠️ 本周赛事【${t.name}】尚未结束！请先进入「当前赛事」打完本站比赛。` };
    }
  }

  const te = gameState.currentTeamEvent;
  if (te && te.week === p.week && te.userSelected && !te.completed) {
    return { ok: false, msg: `⚠️ 本周团体赛【${te.name}】尚未结束！请进入「当前赛事」推进团体赛进程。` };
  }

  return { ok: true };
}

/* ==================== 推进周次逻辑 ==================== */
function advanceWeek() {
  let check = checkCanAdvanceWeek();
  if (!check.ok) {
    showAlert(check.msg, "无法推进周次", "⚠️");
    return;
  }

  let p = gameState.player;
  
  // 记录上一周的世界排名
  gameState.worldRanking.forEach((pl, idx) => { pl.prevRank = idx + 1; });
  p.prevRank = gameState.worldRanking.findIndex(x => x.isUser) + 1;

  // 获取教练与体能师配置
  const curCoach = (typeof COACH_DATABASE !== 'undefined') 
    ? (COACH_DATABASE.find(c => c.id === (p.staff?.coach || 'coach_none')) || COACH_DATABASE[0]) 
    : { trainBonus: 0, weeklyCost: 0 };
  const curPhysio = (typeof PHYSIO_DATABASE !== 'undefined') 
    ? (PHYSIO_DATABASE.find(ph => ph.id === (p.staff?.physio || 'physio_none')) || PHYSIO_DATABASE[0]) 
    : { staminaDrainDiscount: 0, spaBonus: 0, weeklyCost: 0 };

  const coachBonus = 1.0 + (curCoach.trainBonus || 0);
  const physioDiscount = 1.0 - (curPhysio.staminaDrainDiscount || 0);

  // 扣除团队周薪
  const totalStaffCost = (curCoach.weeklyCost || 0) + (curPhysio.weeklyCost || 0);
  if (totalStaffCost > 0) {
    if (p.money >= totalStaffCost) {
      p.money -= totalStaffCost;
    } else {
      p.staff.coach = 'coach_none';
      p.staff.physio = 'physio_none';
      showAlert(`⚠️ 资金不足以支付团队周薪 ($${totalStaffCost})，保障团队已自动解约！`, "解约通知", "💸");
    }
  }

  // 1. 执行 7 天训练计划结算
  const ageFactor = (typeof getAgeGrowthFactor === 'function') ? getAgeGrowthFactor(p.age) : { power: 1, speed: 1, spin: 1, control: 1, footwork: 1, mental: 1, staminaDecay: 1 };
  (gameState.weeklyPlan || []).forEach(act => {
    if (act === 'fh') {
      p.baseStats.fhPower += 0.35 * ageFactor.power * coachBonus;
      p.baseStats.spin += 0.15 * ageFactor.spin * coachBonus;
      p.stamina -= 12 * ageFactor.staminaDecay * physioDiscount;
    } else if (act === 'bh') {
      p.baseStats.bhSpeed += 0.35 * ageFactor.speed * coachBonus;
      p.baseStats.speed += 0.15 * ageFactor.speed * coachBonus;
      p.stamina -= 12 * ageFactor.staminaDecay * physioDiscount;
    } else if (act === 'touch') {
      p.baseStats.touch += 0.35 * ageFactor.control * coachBonus;
      p.baseStats.receive += 0.15 * ageFactor.control * coachBonus;
      p.stamina -= 8 * ageFactor.staminaDecay * physioDiscount;
    } else if (act === 'serve') {
      p.baseStats.serve += 0.35 * ageFactor.control * coachBonus;
      p.baseStats.tactics += 0.15 * ageFactor.mental * coachBonus;
      p.stamina -= 8 * ageFactor.staminaDecay * physioDiscount;
    } else if (act === 'footwork') {
      p.baseStats.footwork += 0.35 * ageFactor.footwork * coachBonus;
      p.baseStats.endurance += 0.15 * coachBonus;
      p.stamina -= 15 * ageFactor.staminaDecay * physioDiscount;
    } else if (act === 'rally') {
      p.baseStats.rally += 0.30 * ageFactor.control * coachBonus;
      p.baseStats.spin += 0.20 * ageFactor.spin * coachBonus;
      p.stamina -= 14 * ageFactor.staminaDecay * physioDiscount;
    } else if (act === 'match') {
      p.baseStats.tactics += 0.25 * ageFactor.mental * coachBonus;
      p.baseStats.mental += 0.25 * ageFactor.mental * coachBonus;
      p.stamina -= 14 * ageFactor.staminaDecay * physioDiscount;
    } else if (act === 'rest') {
      p.stamina = Math.min(100, p.stamina + 35 + (curPhysio.spaBonus || 0));
    }
  });

  p.stamina = Math.max(5, Math.min(100, p.stamina));

  // 判定本周是否实际参与了正式赛事 / 团体赛出战
  const playedThisWeek = Boolean(
    (gameState.currentTournament && gameState.currentTournament.week === p.week && !gameState.currentTournament.readOnly && gameState.currentTournament.discipline !== 'spectate') ||
    (gameState.currentTeamEvent && gameState.currentTeamEvent.week === p.week && gameState.currentTeamEvent.userSelected)
  );

  // 只有在未参赛的周次（休息/集训/仅观赛）推进时，连续参赛负荷才重置为 0；参赛周则保持累加
  if (!playedThisWeek) {
    p.consecutiveTournaments = 0;
  }

  // 2. 伤病康复判定
  if (p.injury && typeof INJURY_TYPES !== 'undefined' && INJURY_TYPES[p.injury]) {
    const inj = INJURY_TYPES[p.injury];
    const hasRestSlot = (gameState.weeklyPlan || []).includes('rest');
    if (inj.severity === 'mild' && (p.stamina >= 55 || hasRestSlot)) {
      p.injury = null;
      if (p.injuryHistory && p.injuryHistory[0]) p.injuryHistory[0].recovered = true;
      showAlert(`✨ 经过调养，你的【${inj.name}】已完全康复！属性全额恢复！`, "轻伤自愈", "✨");
    } else if (inj.severity === 'severe' && p.stamina >= 65 && hasRestSlot) {
      p.injury = null;
      if (p.injuryHistory && p.injuryHistory[0]) p.injuryHistory[0].recovered = true;
      showAlert(`✨ 经过深度休养，你的【${inj.name}】已脱离伤病状态！`, "重伤康复", "🎉");
    }
  }

  // 3. 赞助周薪结算
  // 3. 赞助周薪结算（1个器材赞助 + 无限个商业代言叠加发放）
  if (typeof ensurePlayerSponsors === 'function') {
    ensurePlayerSponsors();
  }

  // A. 结算独占器材赞助
  if (p.sponsors?.gear) {
    const sp = p.sponsors.gear;
    p.money += (sp.weeklyPay || 0);
    sp.weeksLeft--;
    if (sp.weeksLeft <= 0) {
      p.sponsors.gear = null;
      showAlert(`⌛ 你与器材赞助商【${sp.name}】的赞助合约已到期。`, "器材合同到期", "📋");
    }
  }

  // B. 结算所有活跃的商业代言（各自发放周薪与独立倒计时）
  if (Array.isArray(p.sponsors?.commercials) && p.sponsors.commercials.length > 0) {
    let expiredCommercials = [];
    p.sponsors.commercials.forEach(c => {
      p.money += (c.weeklyPay || 0);
      c.weeksLeft--;
      if (c.weeksLeft <= 0) {
        expiredCommercials.push(c.name);
      }
    });

    // 移出已到期的商业代言
    p.sponsors.commercials = p.sponsors.commercials.filter(c => c.weeksLeft > 0);

    if (expiredCommercials.length > 0) {
      showAlert(`⌛ 你与商业品牌【${expiredCommercials.join('、')}】的代言合约已到期。`, "代言合同到期", "📋");
    }
  }

  if (p.sponsor) p.money += (p.sponsor.weeklyPay || 0);

  p.stamina = Math.max(5, p.stamina);

  // 4. 并行赛事结算
  // 4. 并行赛事结算（观赛即已结算；未观赛的站点在此自动完成并持久化，保证全局唯一）
  const wmThisWeek = ensureWeekMeta();
  const curEventThisWeek = getEventForWeekAndYear(p.week, p.year);
  const userTournamentEventId = (gameState.currentTournament && gameState.currentTournament.week === p.week) ? gameState.currentTournament.eventId : null;
  const userRanTeamBracketThisWeek = !!(gameState.currentTeamEvent && gameState.currentTeamEvent.week === p.week && gameState.currentTeamEvent.bracket);

  if (isTeamEventType(curEventThisWeek.type)) {
    if (!userRanTeamBracketThisWeek && typeof simulateAIOnlyTeamEvent === 'function') {
      simulateAIOnlyTeamEvent(curEventThisWeek);
    }
  } else {
    wmThisWeek.events.forEach(ev => {
      if (!(ev.drawSize > 0 && ev.points > 0)) return;
      if (ev.id === userTournamentEventId) {
        if (gameState.currentTournament?.mode === 'both') {
          if (!gameState.currentTournament.singles.completed) finishSubTournamentRound(gameState.currentTournament.singles, false);
          if (!gameState.currentTournament.doubles.completed) finishSubTournamentRound(gameState.currentTournament.doubles, false);
        } else if (gameState.currentTournament && !gameState.currentTournament.completed) {
          finishSubTournamentRound(gameState.currentTournament, false);
        }
        return;
      }
      // 关键：直接通过 getOrBuildEventBracket 一站式完成单双打模拟与战绩结算，已生成的直接复用绝不重新随机
      getOrBuildEventBracket(ev);
    });
  }

  if (typeof sortDoublesRanking === 'function') sortDoublesRanking();

  // --- 确保存档本周完赛的名次战报 ---
  if (gameState.currentTournament && gameState.currentTournament.week === p.week) {
    let t = gameState.currentTournament;
    if (t.mode === 'both') {
      if (t.singles) saveTournamentSubPodium(t.singles, p.year, p.week, t.eventId, t.name, false);
      if (t.doubles) saveTournamentSubPodium(t.doubles, p.year, p.week, t.eventId + '_doubles', t.name + ' (双打)', true);
    } else {
      saveTournamentSubPodium(t, p.year, p.week, t.isDoubles ? t.eventId + '_doubles' : t.eventId, t.name, t.isDoubles);
    }
  }

  // 5. 跨周推进
  p.week++;
  if (p.week > 52) {
    p.week = 1;
    p.year++;
    p.age++;
    if (typeof handleSeasonAIAgingAndRetirements === 'function') handleSeasonAIAgingAndRetirements();
    if (typeof handleDoublesSeasonalReorganization === 'function') handleDoublesSeasonalReorganization();
  }

  if (typeof recomputeAllPoints === 'function') recomputeAllPoints();

  let userRankItem = gameState.worldRanking.find(x => x.isUser);
  if (userRankItem) {
    userRankItem.prevCombatPower = userRankItem.basePow || 55;
    userRankItem.basePow = computeUserCombatPower();
  }
  gameState.worldRanking.sort((a, b) => b.points - a.points);
  
  recordRankHistoryPoint();
  if (typeof recordDoublesRankHistoryPoint === 'function') {
    recordDoublesRankHistoryPoint(); // 👈 每周推进时同步记录双打排名历史
  }

  // 清空上周赛事状态
  gameState.currentTournament = null;
  gameState.currentTeamEvent = null;
  
  const bRoot = document.getElementById('bracket-root');
  if (bRoot) bRoot.innerHTML = '';

  if (p.money < 100) {
    p.money += 300;
    showAlert(`📋 <strong>协会青年基金救济</strong><br>当地乒协向你发放了 $300 青年训练津贴！`, "青年扶持", "🌱");
  }

  updateUI();
  saveGame();
  showWeekAdvanceToast(p.week, p.year);
}
let saveGameDebounceTimer = null;

function saveGame(showAlert = false) {
  if (showAlert) {
    try {
      localStorage.setItem('TT_SIM_FINAL_SAVE_2026_PRO', JSON.stringify(gameState));
      alert('💾 生涯存档已成功保存到本地浏览器！');
    } catch (e) {
      console.error(e);
    }
    return;
  }

  // 连续点击时延迟 300ms 批量写入，完全不阻碍主线程动画与渲染
  if (saveGameDebounceTimer) clearTimeout(saveGameDebounceTimer);
  saveGameDebounceTimer = setTimeout(() => {
    try {
      localStorage.setItem('TT_SIM_FINAL_SAVE_2026_PRO', JSON.stringify(gameState));
    } catch (e) {
      console.error(e);
    }
  }, 300);
}

function exportSaveFile() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `乒乓生涯_${gameState.player.name}_${gameState.player.year}年.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importSaveFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      gameState = JSON.parse(e.target.result);
      // 同步执行旧存档修复，逻辑与 loadGame 保持一致
      if (!gameState.h2hData) gameState.h2hData = {};
      if (!gameState.retiredPlayers) gameState.retiredPlayers = [];
      if (gameState.player.consecutiveTournaments === undefined) gameState.player.consecutiveTournaments = 0;
      if (!gameState.stats.totalPrizeWon) gameState.stats.totalPrizeWon = 0;
      if (gameState.currentTeamEvent === undefined) gameState.currentTeamEvent = null;
      if (gameState.weekMeta === undefined) gameState.weekMeta = null;
      if (!gameState.player.gear.shoes) gameState.player.gear.shoes = 's1';
      ensureOwnedGearShape();
      migrateLegacyWorldRanking();
      if (!Array.isArray(gameState.player.rankHistory) || gameState.player.rankHistory.length === 0) {
        gameState.player.rankHistory = [];
        recordRankHistoryPoint();
      }
      let t = gameState.currentTournament;
      if (t && t.rounds && t.rounds.length) {
        if (t.currentRound >= t.rounds.length) {
          t.completed = true;
        } else if (!t.rounds[t.currentRound]) {
          gameState.currentTournament = null;
        }
      }
      saveGame();
      document.getElementById('create-modal').style.display = 'none';
      refreshSlots();
      renderGearList('blade');
      updateUI();
      renderBracket();
      showAlert('📂 外部存档文件已成功导入并激活！');
    } catch (err) {
      showAlert('导入失败：存档文件格式有误！');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function resetGame() {
  showCustomConfirm({
    icon: '🔄',
    title: '重新创建角色',
    msg: '确定要重置当前生涯并重新创建新球员吗？<br><span style="color:#ef4444; font-size:0.82rem;">（注意：此操作将清空当前浏览器的存档数据）</span>',
    okText: '确认重置',
    okColor: '#ef4444',
    onConfirm: () => {
      localStorage.removeItem('TT_SIM_FINAL_SAVE_2026_PRO');
      location.reload();
    }
  });
}

/* ==================== 11. 周训练与赛季推进 (含属性自愈) ==================== */
function allowDrop(ev) { ev.preventDefault(); ev.currentTarget.classList.add('drag-over'); }
function drag(ev) { ev.dataTransfer.setData("type", ev.target.getAttribute("data-type")); }
function drop(ev, dayIndex) {
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');
  let type = ev.dataTransfer.getData("type");
  gameState.weeklyPlan[dayIndex] = type;
  refreshSlots();
}

// 平板/手机端支持：点击选择训练项
function selectTrainingItemTouch(el, type) {
  selectedTrainingTypeForTouch = type;
  draggedTrainingType = type;
  
  // 清除其他项的高亮，给当前点击项加高亮框
  document.querySelectorAll('.training-pool .draggable-item').forEach(item => {
    item.style.outline = 'none';
    item.style.transform = 'scale(1)';
  });
  el.style.outline = '3px solid var(--accent-gold)';
  el.style.transform = 'scale(1.05)';
}

// 平板/手机端支持：点击某一天直接填入当前选中的项目
function handleDaySlotClick(dayIndex) {
  if (selectedTrainingTypeForTouch) {
    setDayTraining(dayIndex, selectedTrainingTypeForTouch);
  }
}

/* ==================== 批次二：双打系统 UI 交互引擎 ==================== */

let currentStatsViewMode = 'singles';     // 'singles' | 'doubles'
let currentRankingViewMode = 'singles';   // 'singles' | 'doubles'
let partnerCandidatesFilter = 'same';     // 'same' (同协会) | 'all' (全球)

// 2. 切换世界排名视角 (单打 / 双打)
function switchRankingViewMode(mode) {
  currentRankingViewMode = mode;
  document.getElementById('btn-rank-singles').classList.toggle('active-gear-type', mode === 'singles');
  document.getElementById('btn-rank-doubles').classList.toggle('active-gear-type', mode === 'doubles');
  renderRankingTable();
}

// 3. 筛选搭档候选人
function filterPartnerCandidates(filterType) {
  partnerCandidatesFilter = filterType;
  document.getElementById('filter-partner-same').classList.toggle('active-gear-type', filterType === 'same');
  document.getElementById('filter-partner-all').classList.toggle('active-gear-type', filterType === 'all');
  renderPartnerCandidates();
}

// 4. 渲染双打专属面板 (现任搭档 + 邀请候选 + 历任名人堂)
function renderDoublesPanel() {
  const container = document.getElementById('current-partner-view');
  if (!container) return;

  const partner = gameState.playerDoubles?.currentPartner;
  const userPair = gameState.doublesRanking?.find(p => p.isUserPair);
  const pairRank = userPair ? (gameState.doublesRanking.indexOf(userPair) + 1) : null;

  const badgeEl = document.getElementById('doubles-team-rank-badge');
  if (badgeEl) {
    badgeEl.innerText = pairRank ? `世界双打排名 #${pairRank}` : '世界双打排名：未组队';
    badgeEl.style.cursor = 'pointer';
    badgeEl.title = '点击查看双打历史世界排名走势';
    badgeEl.onclick = () => openDoublesRankHistoryModal();
  }

  if (partner) {
    let matches = partner.matches || 0;
    let wins = partner.wins || 0;
    let losses = partner.losses || 0;
    let winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) + "%" : "0.0%";
    let chem = partner.chemistry || 60;
    let combatPow = calculateDoublesPairCombatPower(gameState.player, partner, chem);

    container.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
        <div style="font-size: 2.8rem; background: var(--bg-card-alt); border-radius: 50%; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent-gold);">🏓</div>
        <div>
          <h2 style="color:#fff; margin-bottom:4px;">${partner.name}</h2>
          <p style="color:var(--text-dim); font-size:0.88rem;">${getFlagImgHtml(partner.country)}${partner.country} | ${partner.age || 22}岁 | ${partner.style || '快攻弧圈型'}</p>
          <p style="font-size:0.82rem; margin-top:4px;"><span class="badge badge-gold">签约年份: ${partner.joinYear}年 第${partner.joinWeek}周</span></p>
        </div>
      </div>

      <!-- 组合默契度面板 -->
      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
          <span>搭档默契度 (Chemistry)</span>
          <strong style="color: var(--accent-gold); font-family: var(--font-display); font-size: 1.05rem;">${chem} / 100</strong>
        </div>
        <div class="chem-bar-container">
          <div class="chem-bar-fill" style="width: ${chem}%;"></div>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-dim); display: flex; justify-content: space-between;">
          <span>战术协同加成: <b style="color:var(--accent-cyan);">+${((chem - 50) / 5).toFixed(1)}% 团队战斗力</b></span>
          <span>组合战力: <b style="color:var(--accent-gold);">${combatPow}</b></span>
        </div>
      </div>

      <!-- 合作战绩数据 -->
      <div class="grid-3" style="margin-bottom: 16px;">
        <div class="stat-box" style="padding:10px;"><div class="stat-label">合作战绩</div><div class="stat-val" style="font-size:1.2rem; color:var(--accent-blue);">${wins}胜 ${losses}负</div></div>
        <div class="stat-box" style="padding:10px;"><div class="stat-label">组合胜率</div><div class="stat-val" style="font-size:1.2rem; color:var(--accent-gold);">${winRate}</div></div>
        <div class="stat-box" style="padding:10px;"><div class="stat-label">合作冠军</div><div class="stat-val" style="font-size:1.2rem; color:var(--accent);">${partner.titles || 0} 🏆</div></div>
      </div>

      <button class="btn-action" style="width: 100%; color: #ef4444; border-color: rgba(239,68,68,0.35);" onclick="disbandCurrentPartner()">
        💔 解散当前双打组合 (Disband Pair)
      </button>
    `;
  } else {
    container.innerHTML = `
      <div style="text-align: center; padding: 45px 14px; color: var(--text-dim);">
        <div style="font-size: 3rem; margin-bottom: 10px;">👥</div>
        <h3 style="color: var(--text); margin-bottom: 6px;">当前暂无固定双打搭档</h3>
        <p style="font-size: 0.85rem; line-height: 1.6;">请在右侧候选池中挑选队友并发起合作邀约。<br>组队后可参加巡回赛双打比赛并争夺双打世界排名与奖牌！</p>
      </div>
    `;
  }

  renderPartnerCandidates();
  renderPastPartnersHistory();
}

// 渲染全员候选人列表（取消 40 人限制，支持全库展示与冷却期倒计时）
function renderPartnerCandidates() {
  const tbody = document.getElementById('partner-candidates-tbody');
  if (!tbody) return;

  const p = gameState.player;
  const currentPartnerName = gameState.playerDoubles?.currentPartner?.name;
  if (!gameState.playerDoubles.cooldowns) gameState.playerDoubles.cooldowns = {};

  let candidates = gameState.worldRanking.filter(pl => !pl.isUser && pl.name !== currentPartnerName && pl.injury !== "重度伤病");
  if (partnerCandidatesFilter === 'same') {
    candidates = candidates.filter(pl => pl.country === p.country);
  }

  // 默认按单打排名升序排列（展示全部选手）
  candidates.sort((a, b) => (gameState.worldRanking.indexOf(a) - gameState.worldRanking.indexOf(b)));

  const curAbs = absWeekIndex(p.week, p.year);

  tbody.innerHTML = candidates.map(pl => {
    let singleRank = gameState.worldRanking.indexOf(pl) + 1;
    let chem = calculateInitialChemistry(p.country, pl.country);
    let power = pl.basePow || 60;
    
    // 检查冷却状态
    const cd = gameState.playerDoubles.cooldowns[pl.name];
    let isCooling = false;
    let weeksLeft = 0;
    if (cd) {
      let cdAbs = absWeekIndex(cd.week, cd.year);
      if (curAbs < cdAbs) {
        isCooling = true;
        weeksLeft = cdAbs - curAbs;
      }
    }

    let btnHtml = isCooling 
      ? `<button class="btn-action" style="padding: 3px 8px; font-size: 0.72rem; color:var(--text-dim); opacity:0.6; cursor:not-allowed;" title="冷却中，还剩 ${weeksLeft} 周" onclick="invitePlayerAsPartner('${pl.name}')">⏳ ${weeksLeft}周后</button>`
      : `<button class="btn-primary" style="padding: 3px 8px; font-size: 0.72rem;" onclick="invitePlayerAsPartner('${pl.name}')">🤝 邀请</button>`;

    return `
      <tr>
        <td><span class="player-clickable" onclick="openPlayerProfileModal('${pl.name}')">${pl.name}</span></td>
        <td>${getFlagImgHtml(pl.country)}${pl.country}</td>
        <td><strong style="color:var(--accent-gold);">#${singleRank}</strong></td>
        <td><span style="color:var(--accent-cyan); font-weight:bold;">${power}</span></td>
        <td><span class="badge ${chem >= 75 ? 'badge-gold' : 'badge-feed'}">${chem}</span></td>
        <td>${btnHtml}</td>
      </tr>
    `;
  }).join('');
}

function switchStatsViewMode(mode) {
  currentStatsViewMode = mode;
  document.getElementById('btn-stats-singles')?.classList.toggle('active-gear-type', mode === 'singles');
  document.getElementById('btn-stats-doubles')?.classList.toggle('active-gear-type', mode === 'doubles');

  const isD = (mode === 'doubles');
  const elOly = document.getElementById('trophy-lbl-olympic');
  const elWttc = document.getElementById('trophy-lbl-wttc');
  const elWc = document.getElementById('trophy-lbl-wc');

  if (elOly) elOly.innerText = isD ? "奥运会双打" : "奥运会单打";
  if (elWttc) elWttc.innerText = isD ? "世乒赛双打" : "世乒赛单打";
  if (elWc) elWc.innerText = isD ? "世界杯双打" : "世界杯单打";

  updateUI();
}

// 6. 渲染历任已解散搭档战绩名人堂
function renderPastPartnersHistory() {
  const tbody = document.getElementById('past-partners-tbody');
  if (!tbody) return;

  const list = gameState.playerDoubles?.partnersHistory || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-dim); padding:16px;">暂无历史解散记录，当前为第一任搭档或尚未组队。</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => {
    let winRate = (item.matches > 0) ? (((item.wins || 0) / item.matches) * 100).toFixed(1) + "%" : "0.0%";
    return `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${getFlagImgHtml(item.country)}${item.country}</td>
        <td>${item.joinYear}年W${item.joinWeek} ~ ${item.endYear}年W${item.endWeek}</td>
        <td><span class="badge badge-gold">${item.finalChemistry}</span></td>
        <td><span style="color:var(--accent-blue); font-weight:bold;">${item.wins}胜</span> / <span style="color:var(--accent);">${item.losses}负</span></td>
        <td><strong>${winRate}</strong></td>
        <td><span style="color:var(--accent-gold); font-weight:bold;">${item.titles} 座 🏆</span></td>
      </tr>
    `;
  }).join('');
}

/* ==================== AI 双打组合动态轮转与解散重组机制 ==================== */
function handleDoublesSeasonalReorganization() {
  if (!gameState.doublesRanking) return;

  const currentYear = gameState.player.year;
  const activeSingles = gameState.worldRanking.filter(p => !p.isUser && p.injury !== "重度伤病");
  const singlesNameMap = new Map(activeSingles.map(p => [p.name, p]));

  // 1. 清理包含已退役选手的双打组合
  gameState.doublesRanking = gameState.doublesRanking.filter(pair => {
    if (pair.isUserPair) return true;
    const p1Active = singlesNameMap.has(pair.player1.name);
    const p2Active = singlesNameMap.has(pair.player2.name);
    return p1Active && p2Active;
  });

  // 2. 战绩不佳或默契度过低的 AI 组合有 25% 概率在赛季末协议解散
  gameState.doublesRanking = gameState.doublesRanking.filter(pair => {
    if (pair.isUserPair) return true;
    let shouldDisband = (pair.careerLosses > pair.careerWins * 2 && pair.careerLosses >= 6 && Math.random() < 0.25);
    return !shouldDisband;
  });

  // 3. 获取当前已组队的选手名单
  let pairedNames = new Set();
  gameState.doublesRanking.forEach(pair => {
    if (pair.player1) pairedNames.add(pair.player1.name);
    if (pair.player2) pairedNames.add(pair.player2.name);
  });

  // 4. 从未组队的选手中挑选新组合，补充至 100 对
  let unpairedSingles = activeSingles.filter(p => !pairedNames.has(p.name));
  unpairedSingles.sort((a, b) => b.points - a.points); // 高水平单打选手优先配对

  while (gameState.doublesRanking.length < 100 && unpairedSingles.length >= 2) {
    let p1 = unpairedSingles.shift();
    // 优先同协会配对
    let sameCountryIdx = unpairedSingles.findIndex(p => p.country === p1.country);
    let p2 = (sameCountryIdx >= 0) ? unpairedSingles.splice(sameCountryIdx, 1)[0] : unpairedSingles.shift();

    let chem = calculateInitialChemistry(p1.country, p2.country);
    let newPair = createDoublesPairObject(p1, p2, chem);
    gameState.doublesRanking.push(newPair);
  }

  // 重新排序与更新动向
  sortDoublesRanking();
}

/* AI 独立双打赛事模拟与真实结算 */
function simulateAIOnlyDoublesEvent(curEvent, presetField) {
  ensureDoublesRankingAvailable();
  let totalSize = curEvent.drawSize <= 16 ? 16 : Math.min(32, Math.floor(curEvent.drawSize / 2));
  
  let pool = (presetField && presetField.length >= 2) 
    ? presetField 
    : gameState.doublesRanking.filter(pr => !pr.isUserPair).slice(0, totalSize);
    
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
    let isSemi = (rounds.length - r === 2); // 修复：补充声明半决赛变量
    
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

        // 精确递增 1 胜 1 负
        if (lPair) {
          lPair.careerLosses = (lPair.careerLosses || 0) + 1;
          let pts = calculateRoundPoints(curEvent.points * 0.85, size, r, 'main', isFinal);
          let rName = isFinal ? "🥈 亚军" : getRoundName(size, r, 'main');
          awardDoublesPoints(lPair, pts);

          // 为双打组合内两位选手分别发放生涯奖牌
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

      // 晋级下一轮
      if (next && m.winner) {
        let nIdx = Math.floor(idx / 2);
        if (idx % 2 === 0) next[nIdx].p1 = m.winner;
        else next[nIdx].p2 = m.winner;
      }
    }); // 闭合 matches.forEach
  } // 闭合 for 循环

  // 冠军精准结算
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

/* ==================== 游戏说明书交互逻辑 ==================== */

// 1. 打开说明书弹窗
function openManualModal() {
  const modal = document.getElementById('game-manual-modal');
  if (!modal) return;
  modal.style.display = 'flex';
}

// 2. 关闭说明书弹窗
function closeManualModal() {
  const modal = document.getElementById('game-manual-modal');
  if (modal) modal.style.display = 'none';
}

// 3. 切换说明书左侧 Tab
function switchManualTab(tabKey) {
  // 切换左侧按钮高亮
  document.querySelectorAll('.manual-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(tabKey));
  });

  // 切换右侧内容面板
  document.querySelectorAll('.manual-tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  const targetPane = document.getElementById(tabKey);
  if (targetPane) {
    targetPane.classList.add('active');
  }
}

