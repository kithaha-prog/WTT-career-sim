/* ==================== 真实局内比分生成与模拟器 ==================== */
function simulateMatchScore(p1, p2, targetGames = 3) {
  let diff = (p1?.power || 60) - (p2?.power || 60);
  let p1WinRate = setWinProb(diff);
  let p1G = 0, p2G = 0;
  let details = [];

  while (p1G < targetGames && p2G < targetGames) {
    let p1WonGame = Math.random() < p1WinRate;
    if (p1WonGame) p1G++; else p2G++;

    let loserPts;
    let roll = Math.random();
    if (roll < 0.15) {
      loserPts = Math.floor(3 + Math.random() * 4); // 11-3 ~ 11-6
    } else if (roll < 0.70) {
      loserPts = Math.floor(7 + Math.random() * 3); // 11-7 ~ 11-9
    } else {
      let deuce = 10 + Math.floor(Math.random() * 4); // 12-10, 13-11 等加分局
      loserPts = deuce;
      let winnerPts = deuce + 2;
      details.push(p1WonGame ? `${winnerPts}-${loserPts}` : `${loserPts}-${winnerPts}`);
      continue;
    }
    details.push(p1WonGame ? `11-${loserPts}` : `${loserPts}-11`);
  }

  return {
    winner: p1G > p2G ? p1 : p2,
    score: `${p1G} - ${p2G}`,
    scoreDetails: `(${details.join(', ')})`
  };
}

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

function buildFeederEvent(week, year, seedOffset) {
  const idx = Math.abs(week * 7 + seedOffset * 13 + year) % FEEDER_CITY_POOL.length;
  const city = FEEDER_CITY_POOL[idx];
  return {
    name: `WTT 支线赛 ${city}站 (Feeder ${city})`,
    type: "Feeder", level: "badge-feed", points: 125, drawSize: 32,
    directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000
  };
}

function generateWeekEvents(week, year) {
  const anchor = getBaseWeekEvent(week, year);
  let events;
  
  if (anchor.type === "Training" || anchor.type === "Vacation" || isTeamEventType(anchor.type) || !(anchor.drawSize > 0 && anchor.points > 0)) {
    events = [anchor];
  } else {
    const hash = Math.sin(week * 13.37 + year * 79.19) * 10000;
    const randomCount = 2 + Math.floor((hash - Math.floor(hash)) * 4);

    events = [anchor];
    for (let i = 1; i < randomCount; i++) {
      events.push(buildFeederEvent(week, year, i));
    }
  }

  events.forEach((e, i) => { e.id = `w${year}_${week}_${i}`; });
  return events;
}

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

function isEventJoinableForPlayer(ev) {
  if (!ev || !ev.points) return false;
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  if (currentRank < (ev.maxRank || 1)) return false;
  if (currentRank > (ev.qualiCut || 9999)) return false;
  return true;
}

let spectateBracketCache = {};

function getDisciplineCosts(ev) {
  const base = calculateTournamentCost(ev, gameState.player.country);
  return {
    singles: base.total,
    doubles: base.total,
    both: Math.round(base.total * 1.3)
  };
}

function selectWeekEvent(eventId) {
  const wm = ensureWeekMeta();
  if (wm.selectedEventId) return;
  const ev = wm.events.find(e => e.id === eventId);
  if (!ev) return;

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

function spectateEvent(eventId) {
  const wm = ensureWeekMeta();
  const ev = wm.events.find(e => e.id === eventId);
  if (!ev) return;
  wm.viewingEventId = eventId;
  updateUI();
  saveGame();
}

function exitToWeekEventSelector() {
  const wm = ensureWeekMeta();
  wm.viewingEventId = null;
  wm.explicitSpectateEventId = null;
  updateUI();
  saveGame();
}

function renderWeekEventSelector() {
  const box = document.getElementById('week-events-select');
  if (!box) return;
  const wm = ensureWeekMeta();

  if (wm.events.length <= 1) { box.style.display = 'none'; box.innerHTML = ''; return; }

  box.style.display = 'block';

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

    const cheapestOption = hasPartner ? Math.min(costs.singles, costs.doubles) : costs.singles;
    const canAfford = money >= cheapestOption;

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
  
  let pointsInfo = `单打积分: ${isRetired ? '—' : p.points}`;
  if (p.isUser && gameState.playerDoubles) {
    pointsInfo += ` ｜ 双打积分: ${gameState.playerDoubles.points || 0}`;
  }
  // 确保这一行正确读取 p.age（我方选手需读取实时的 gameState.player.age，而不是快照字段）
  let displayAge = p.isUser ? gameState.player.age : p.age;
  document.getElementById('prof-modal-sub').innerHTML = `${getFlagImgHtml(p.country)}${p.country} | ${displayAge}岁 | 世界排名: ${rankText} | ${pointsInfo}`;
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

  let overallVal = p.isUser ? Math.round(computeUserCombatPower()) : Math.round(p.basePow || 60);
  document.getElementById('prof-modal-overall').innerText = overallVal;

  let careerWins = p.isUser ? gameState.stats.wins : (p.careerWins || 0);
  let careerLosses = p.isUser ? gameState.stats.losses : (p.careerLosses || 0);
  let careerTotal = careerWins + careerLosses;
  let winRateText = careerTotal > 0 ? ((careerWins / careerTotal) * 100).toFixed(1) + "%" : "0.0%";
  document.getElementById('prof-modal-winrate').innerText = winRateText;
  document.getElementById('prof-modal-wl').innerText = `${careerWins}胜 ${careerLosses}负`;

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

function getEventForWeekAndYear(week, year) {
  const p = gameState.player;
  if (p && week === p.week && year === p.year) {
    const wm = ensureWeekMeta();
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

    recordTournamentPodium(
      curYear, 
      curWeek, 
      curEvent.id + (isDoubles ? '_doubles' : ''), 
      evName + (isDoubles ? ' (双打)' : ''), 
      champ.name, 
      runnerUp?.name, 
      thirds,
      finalMatch.score || "4 - 2",
      finalMatch.scoreDetails || "(11-8, 11-9, 9-11, 11-7, 11-6)",
      evType
    );

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
        let targetGames = (curEvent.drawSize >= 32 && r >= subTour.rounds.length - 2) ? 4 : 3;
        let simRes = simulateMatchScore(m.p1, m.p2, targetGames);
        m.winner = simRes.winner;
        m.score = simRes.score;
        m.scoreDetails = simRes.scoreDetails;
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

  applySubTournamentResults(subTour, curEvent, isDoubles);
  return subTour;
}

/* ==================== 3. 构造并缓存观赛签表 ==================== */
function getOrBuildEventBracket(ev) {
  if (!ev) return null;
  const p = gameState.player;
  const wm = ensureWeekMeta();
  if (!wm.spectateBrackets) wm.spectateBrackets = {};

  if (wm.spectateBrackets[ev.id]) {
    return wm.spectateBrackets[ev.id];
  }

  let singlesTour = buildPureAISinglesTournamentData(ev);
  simulateFullSubTournamentRounds(singlesTour, ev, false);

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

function ensureDoublesRankingAvailable() {
  if (!gameState.doublesRanking || gameState.doublesRanking.length < 50) {
    generateInitial100DoublesPairs();
  }
}

function generateSeededBracket(participants, drawSize, isDoubles = false) {
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

function buildTeamKnockoutBracket(teams, fieldSize) {
  let seededTeams = generateSeededBracket(teams, fieldSize);
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
    return;
  }

  p.money -= cost.total;

  const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  let isUnqualified = currentRank > curEvent.qualiCut;
  let isQualifying = !isUnqualified && (currentRank > curEvent.directCut);
  let totalSize = isQualifying ? 4 : (curEvent.drawSize || 16);

  let opponentPool = [];
  if (isQualifying) {
    opponentPool = gameState.worldRanking.filter(x => {
      let r = gameState.worldRanking.indexOf(x) + 1;
      return !x.isUser && (!isPlayerSeverelyInjured(x)) && !excludedNames.has(x.name) && r > curEvent.directCut && r <= (curEvent.qualiCut + 15);
    });
  } else {
    opponentPool = gameState.worldRanking.filter(x => {
      let r = gameState.worldRanking.indexOf(x) + 1;
      return !x.isUser && !isPlayerSeverelyInjured(x) && !excludedNames.has(x.name) && r >= (curEvent.maxRank || 1);
    });

    if (opponentPool.length < totalSize) {
      opponentPool = gameState.worldRanking.filter(x => {
        let r = gameState.worldRanking.indexOf(x) + 1;
        return !x.isUser && !isPlayerSeverelyInjured(x) && r >= (curEvent.maxRank || 1);
      });
    }
  }

  let neededMin = (totalSize - 1);
  if (opponentPool.length < neededMin) {
    opponentPool = gameState.worldRanking.filter(x => {
      let r = gameState.worldRanking.indexOf(x) + 1;
      return !x.isUser && (!isPlayerSeverelyInjured(x)) &&
        (isQualifying ? (r > curEvent.directCut && r <= (curEvent.qualiCut + 15)) : (r >= curEvent.maxRank && r <= (curEvent.directCut + 10)));
    });
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

function calculateTournamentCost(event, userCountry) {
  if (!event || event.points === 0 || event.type === "Training" || event.type === "Vacation") {
    return { entry: 0, flight: 0, hotel: 0, food: 0, total: 0, days: 0 };
  }

  let entryFee = 100;
  if (event.type === "Feeder") entryFee = 150;
  else if (event.type === "Contender") entryFee = 250;
  else if (event.type === "Star Contender") entryFee = 400;
  else if (event.type === "Champions") entryFee = 600;
  else if (event.type === "Grand Smash") entryFee = 1000;
  else if (event.type === "Olympic" || event.type === "WTTC") entryFee = 0;

  let isDomestic = false;
  if (userCountry && userCountry.includes("CHN")) {
    if (event.name.includes("中国") || event.name.includes("北京") || event.name.includes("重庆") || event.name.includes("太原") || event.name.includes("澳门")) {
      isDomestic = true;
    }
  }
  let flightFee = isDomestic ? 150 : 1100;
  if (!isDomestic && (event.name.includes("美国") || event.name.includes("里约") || event.name.includes("圣保罗") || event.name.includes("拉各斯"))) {
    flightFee = 1800;
  }

  let stayDays = event.drawSize >= 64 ? 8 : (event.drawSize >= 32 ? 5 : 3);
  let hotelDailyRate = 120;
  let foodDailyRate = 40;

  let hotelFee = stayDays * hotelDailyRate;
  let foodFee = stayDays * foodDailyRate;

  if (event.type === "Olympic" || event.type === "WTTC" || event.type.includes("Team")) {
    flightFee = 0;
    hotelFee = 0;
    foodFee = stayDays * 20;
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

function calculateRoundPoints(pointsAward, drawSize, roundIdx, phase, isRunnerUp = false) {
  if (isRunnerUp) return Math.floor(pointsAward * 0.70);
  
  if (phase === 'quali') {
    let qPct = (roundIdx === 0) ? 0.03 : 0.06;
    return Math.max(3, Math.floor(pointsAward * qPct));
  }
  
  let totalRounds = Math.log2(drawSize || 16);
  let roundsLeft = totalRounds - roundIdx;
  
  let mainPct = 0.12;
  if (roundsLeft === 2) mainPct = 0.40;
  else if (roundsLeft === 3) mainPct = 0.22;
  else if (roundsLeft === 4) mainPct = 0.12;
  else if (roundsLeft === 5) mainPct = 0.06;
  else if (roundsLeft >= 6) mainPct = 0.03;
  
  return Math.max(8, Math.floor(pointsAward * mainPct));
}

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

function triggerRoundAction() {
  const rootTour = gameState.currentTournament;
  if (!rootTour || rootTour.completed) return;

  if (rootTour.mode === 'both') {
    let sTour = rootTour.singles;
    let dTour = rootTour.doubles;
    let curActiveTour = (currentActiveBracketTab === 'doubles') ? dTour : sTour;

    if (!curActiveTour || curActiveTour.completed) {
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

    finishSubTournamentRound(curActiveTour, false);
    if (sTour.completed && dTour.completed) {
      rootTour.completed = true;
    }
    renderBracket();
    updateUI();
    saveGame();
    return;
  }

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

  roundMatches.forEach((m, idx) => {
    if (!m.winner && m.p1 && m.p2) {
      let targetGames = (tour.drawSize >= 32 && tour.currentRound >= tour.rounds.length - 2) ? 4 : 3;
      let simRes = simulateMatchScore(m.p1, m.p2, targetGames);
      m.winner = simRes.winner;
      m.score = simRes.score;
      m.scoreDetails = simRes.scoreDetails;

      let loser = (m.winner === m.p1) ? m.p2 : m.p1;
      let rTitle = getRoundName(tour.drawSize, tour.currentRound, tour.phase);
      if (isSemiFinal && tour.type === 'Olympic') {
        semiLosers.push(loser);
      } else if (!isTrueFinal) {
        let pts = calculateRoundPoints(tour.pointsAward, tour.drawSize, tour.currentRound, tour.phase);
        if (isDoubles) {
          let loserPair = gameState.doublesRanking?.find(p => p.name === loser.name);
          if (loserPair) {
            loserPair.careerLosses = (loserPair.careerLosses || 0) + 1;
            if (!loserPair.isUserPair) awardDoublesPoints(loserPair, pts);
            [loserPair.player1?.name, loserPair.player2?.name].forEach(pName => {
              let pl = gameState.worldRanking.find(x => x.name === pName);
              if (pl) recordRecentMatchForPlayer(pl, tour.name, tour.type, rTitle, pts, "双打");
            });
          }
          let winPair = gameState.doublesRanking?.find(p => p.name === m.winner.name);
          if (winPair) winPair.careerWins = (winPair.careerWins || 0) + 1;
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

  if (isTrueFinal && isLastRound) {
    let finalMatch = roundMatches[0];
    let champ = finalMatch.winner;
    let runnerUp = (champ === finalMatch.p1) ? finalMatch.p2 : finalMatch.p1;
    let champPts = tour.pointsAward;
    let runnerUpPts = Math.floor(champPts * 0.70);

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
      thirds,
      finalMatch.score,
      finalMatch.scoreDetails,
      tour.type
    );

    if (tour.bronzeMatch && !tour.bronzeMatch.winner) {
      let bm = tour.bronzeMatch;
      let simBm = simulateMatchScore(bm.p1, bm.p2, 3);
      bm.winner = simBm.winner;
      bm.score = simBm.score;
      bm.scoreDetails = simBm.scoreDetails;

      let bLoser = (bm.winner === bm.p1) ? bm.p2 : bm.p1;
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

    if (isDoubles) {
      let partner = gameState.playerDoubles?.currentPartner;
      let userPair = gameState.doublesRanking?.find(p => p.isUserPair);

      if (champ.isUser) {
        awardDoublesPoints(userPair, champPts);
        gameState.player.money += (tour.prizeAward || 0);
        gameState.stats.totalPrizeWon = (gameState.stats.totalPrizeWon || 0) + (tour.prizeAward || 0);
        gameState.doublesStats.titles = (gameState.doublesStats.titles || 0) + 1;
        
        const eventShortName = tour.name.split('(')[0].replace(/第.*?届/g, '').trim();
        gameState.doublesStats.bestAchievement = `${eventShortName} 冠军 🏆`;

        if (partner) partner.titles = (partner.titles || 0) + 1;

        recordCareerMedal(gameState.player.name, 'G', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
        if (partner) recordCareerMedal(partner.name, 'G', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
        
        accumulateDoublesTrophyStats(tour.type);
      } else {
        let champPair = gameState.doublesRanking?.find(p => p.name === champ.name);
        if (champPair) {
          awardDoublesPoints(champPair, champPts);
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
      if (champ.isUser) {
        awardPoints(gameState.worldRanking.find(x => x.isUser), champPts);
        gameState.player.money += (tour.prizeAward || 0);
        gameState.stats.totalPrizeWon = (gameState.stats.totalPrizeWon || 0) + (tour.prizeAward || 0);
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

    showChampionToast(
      champ.isUser ? gameState.player.name : champ.name, 
      tour.name, 
      Boolean(champ.isUser), 
      isDoubles ? "双打" : "单打"
    );
  }
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
        
        if (rTitle.includes("季军") || rTitle.includes("铜牌") || isSemiFinal) {
          recordCareerMedal('B', gameState.player.year, tour.week, tour.name, tour.type, "男子双打");
        }
        showAlert(`双打比赛止步【${rTitle}】：获得 +${earnedPts} 双打积分！`);
      } else {
        awardPoints(gameState.worldRanking.find(x => x.isUser), earnedPts);
        recordRecentMatchForPlayer(gameState.worldRanking.find(x => x.isUser), tour.name, tour.type, rTitle, earnedPts, "单打");
        
        if (rTitle.includes("季军") || rTitle.includes("铜牌") || isSemiFinal) {
          recordCareerMedal('B', gameState.player.year, tour.week, tour.name, tour.type, "男子单打");
        }
        showAlert(`单打比赛止步【${rTitle}】：获得 +${earnedPts} 单打积分！`);
      }
      tour.isUserKnockedOut = true;
    }
  }

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

function getCountryCandidatePool(countryName) {
  return gameState.worldRanking
    .filter(x => x.country === countryName && x.injury !== "重度伤病")
    .slice()
    .sort((a, b) => b.points - a.points)
    .slice(0, TEAM_CANDIDATE_POOL_SIZE);
}

function runNationalTeamSelection(countryName) {
  let pool = getCountryCandidatePool(countryName);
  let scored = pool.map(pl => {
    let age = pl.age || 24;
    let ageFactor = (age >= 20 && age <= 30) ? 1.04 : ((age < 18 || age > 35) ? 0.9 : 1.0);
    let injuryFactor = (pl.injury === "健康") ? 1 : 0.8;
    let noise = 0.85 + Math.random() * 0.3;
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

function rubberSidePower(players) {
  let vals = players.map(pl => (pl.isUser ? computeUserCombatPower() : (pl.basePow || 55)) + rollMatchDayForm());
  let base = vals.reduce((s, v) => s + v, 0) / vals.length;
  if (players.length === 2) base += (Math.random() * 8 - 3);
  return base;
}

function getOrCreateFullCountryTeam(countryName, byCountryMap) {
  let existing = (byCountryMap[countryName] || []).filter(x => !isPlayerSeverelyInjured(x));
  let roster = existing.slice(0, NATIONAL_TEAM_SIZE);
  
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

    if (involvesUser && rub.kind === 'singles') {
      let userWonRubber = isAUser ? (aG > bG) : (bG > aG);
      let oppPlayer = isAUser ? rub.bP[0] : rub.aP[0];
      let oppName = oppPlayer ? oppPlayer.name : "对手";
      let userGames = isAUser ? aG : bG;
      let oppGames = isAUser ? bG : aG;

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

      if (aG + bG === 5) {
        s.decidingMatchesPlayed = (s.decidingMatchesPlayed || 0) + 1;
        if (userWonRubber) s.decidingMatchesWon = (s.decidingMatchesWon || 0) + 1;
      }
      let oppRankIdx = gameState.worldRanking.findIndex(x => x.name === oppName);
      if (oppRankIdx >= 0 && (oppRankIdx + 1) <= 10) {
        s.top10MatchesPlayed = (s.top10MatchesPlayed || 0) + 1;
        if (userWonRubber) s.top10MatchesWon = (s.top10MatchesWon || 0) + 1;
      }

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

      let logText = `[${gameState.player.year}年 第${gameState.player.week}周 | ${teName}] ${rub.label} 对决 【${oppName}】，比分 ${userGames}-${oppGames} (${userWonRubber ? '🔥 获胜' : '❌ 失利'})`;
      gameState.matchHistory.unshift(logText);
    }

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

function buildGroupStage(teams, numGroups) {
  let sorted = teams.slice().sort((a, b) => (b.points || 0) - (a.points || 0) || ((b.power || 0) - (a.power || 0)));
  let groups = [];
  for (let g = 0; g < numGroups; g++) {
    groups.push({ id: String.fromCharCode(65 + g), teams: [], matches: buildGroupSchedule() });
  }
  let potCount = Math.ceil(sorted.length / numGroups);
  for (let pot = 0; pot < potCount; pot++) {
    let potTeams = sorted.slice(pot * numGroups, pot * numGroups + numGroups);
    potTeams.sort(() => Math.random() - 0.5);
    potTeams.forEach((t, i) => {
      if (!groups[i]) return;
      t.groupStats = { tieW: 0, tieL: 0, rubW: 0, rubL: 0 };
      groups[i].teams.push(t);
    });
  }
  return { groups: groups, matchday: 0, totalMatchdays: 3, completed: false };
}

function rankGroupTeams(group) {
  return group.teams.slice().sort((a, b) => {
    let s = a.groupStats, t = b.groupStats;
    return (t.tieW - s.tieW) || ((t.rubW - t.rubL) - (s.rubW - s.rubL)) || (Math.random() - 0.5);
  });
}

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

  if (gs.matchday >= gs.totalMatchdays - 1) {
    gs.completed = true;
    saveGame();
    updateUI();
    return;
  }

  gs.matchday++;
  saveGame();
  updateUI();
}

function proceedToKnockoutStage() {
  let te = gameState.currentTeamEvent;
  if (!te || !te.groupStage) return;
  finalizeGroupStage();
  saveGame();
  updateUI();
}

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
  });

  if (userGroupInfo && !userGroupInfo.qualified && !te.userResultRecorded) {
    recordUserTeamGroupExit(userGroupInfo);
  }

  te.phase = 'knockout';
  te.bracket = buildTeamKnockoutBracket(qualifiers, qualifiers.length);
}

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

function renderGroupStagePanel(gs, root) {
  let userGroup = gs.groups.find(g => g.teams.some(t => t.isUser));

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

function startTeamEvent() {
  const p = gameState.player;
  const curEvent = getEventForWeekAndYear(p.week, p.year);

  let selection = runNationalTeamSelection(p.country);
  let userSelected = selection.selectedNames.has(p.name);
  let userPoolRank = selection.allScored.findIndex(s => s.player.name === p.name) + 1;
  if (userPoolRank <= 0) userPoolRank = selection.poolSize + 1;

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

  let rawFieldSize = (curEvent.drawSize && curEvent.drawSize >= 8) ? curEvent.drawSize : 16;
  let fieldSize = Math.max(TEAM_GROUP_SIZE * 2, Math.round(rawFieldSize / TEAM_GROUP_SIZE) * TEAM_GROUP_SIZE);
  let numGroups = fieldSize / TEAM_GROUP_SIZE;
  let knockoutSize = fieldSize / 2;

  let byCountry = {};
  gameState.worldRanking.forEach(x => {
    if (isPlayerSeverelyInjured(x)) return;
    if (!byCountry[x.country]) byCountry[x.country] = [];
    byCountry[x.country].push(x);
  });

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
  if (!field.find(f => f.country === p.country)) {
    field[field.length - 1] = { country: p.country, sumPoints: p.points };
  }

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

  checkAndTriggerPlayerInjury(true);
  saveGame();
  updateUI();
}

function advanceTeamRound() {
  let te = gameState.currentTeamEvent;
  if (!te || te.completed) return;
  if (te.phase === 'group' && te.groupStage && !te.groupStage.completed) {
    advanceGroupRound();
    return;
  }
  advanceKnockoutRound();
}

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
  });

  let nextRound = br.rounds[br.currentRound + 1];
  if (nextRound) {
    for (let i = 0; i < roundMatches.length; i++) {
      let slot = nextRound[Math.floor(i / 2)];
      if (i % 2 === 0) slot.t1 = roundMatches[i].winner; else slot.t2 = roundMatches[i].winner;
    }
  }

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

    showChampionToast(p.country + " 代表队", te.name, true, "团体", p.country);
  } else {
    pts = Math.floor(te.pointsAward * ((roundIdx + 1) / (te.bracket.rounds.length + 1)));
    resultLabel = getTeamRoundName(te.bracket.drawSize, roundIdx);
  }

  let userItem = gameState.worldRanking.find(x => x.isUser);
  awardPoints(userItem, pts);
  recordRecentMatchForPlayer(userItem, te.name, te.type, resultLabel, pts);

  te.userResultRecorded = true;
  te.userWon = won;
  te.userResultText = `${resultLabel}！团体赛积分 +${pts}${won ? `，奖金 +$${te.prizeAward.toLocaleString()}` : ''}。`;
}

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

    recordTournamentPodium(gameState.player.year, te.week, "team_event", te.name, champTeam.name, runnerUpTeam?.name, thirds, finalMatch.score || "3 - 1", "(3-1, 3-0, 2-3, 3-2)");

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

  if (!isTeamEventType(curEvent.type)) return;

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
        infoHtml += `<button class="btn-gold" style="margin-bottom:16px;" onclick="advanceTeamRound()">进行小组赛第 ${te.groupStage.matchday + 1} 轮 ➔</button>`;
      } else {
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

  if (te.phase === 'group' && te.groupStage) {
    root.classList.add('group-stage-mode');
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

  document.getElementById('ret-name').innerText = p.name;
  document.getElementById('ret-country').innerText = p.country;
  document.getElementById('ret-years').innerText = `${yearsActive} 年 (2026 ~ ${p.year})`;
  document.getElementById('ret-age').innerText = `${p.age} 岁`;
  document.getElementById('ret-best-rank').innerText = `#${s.bestRank}`;
  document.getElementById('ret-final-rank').innerText = `#${finalRank}`;

  document.getElementById('ret-matches').innerText = s.totalMatches;
  document.getElementById('ret-record').innerText = `${s.wins}胜 ${s.losses}负`;
  document.getElementById('ret-winrate').innerText = winRate;
  document.getElementById('ret-streak').innerText = s.bestStreak || 0;
  document.getElementById('ret-prize').innerText = `$${(s.totalPrizeWon || 0).toLocaleString()}`;
  document.getElementById('ret-money').innerText = `$${p.money.toLocaleString()}`;

  document.getElementById('ret-major').innerText = s.titlesMajor || 0;
  document.getElementById('ret-smash').innerText = s.titlesSmash || 0;
  document.getElementById('ret-champ-star').innerText = (s.titlesChamp || 0) + (s.titlesStar || 0);
  document.getElementById('ret-total-titles').innerText = s.titles || 0;

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

  document.getElementById('retirement-modal').style.display = 'flex';
}

/* ==================== 批次三：双打与兼项赛事调度系统 ==================== */
let currentActiveBracketTab = 'singles';

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

function openRegistrationForEvent(eventId) {
  const wm = ensureWeekMeta();
  wm.explicitSpectateEventId = null;
  if (wm.selectedEventId && wm.selectedEventId !== eventId) {
    spectateEvent(eventId);
    return;
  }
  const ev = wm.events.find(e => e.id === eventId);
  if (!ev) return;
  if (!isEventJoinableForPlayer(ev)) {
    spectateEvent(eventId);
    return;
  }
  wm.viewingEventId = eventId;
  updateUI();
  openDisciplineSelectModal();
}

function chooseSpectateOnly() {
  const p = gameState.player;
  const wm = ensureWeekMeta();
  const curEvent = getEventForWeekAndYear(p.week, p.year);
  closeDisciplineSelectModal();
  if (!curEvent) return;
  wm.explicitSpectateEventId = curEvent.id;
  spectateEvent(curEvent.id);
}

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

function buildPureAISinglesTournamentData(curEvent) {
  const wm = ensureWeekMeta();
  let totalSize = curEvent.drawSize || 16;
  
  let pool = (wm.assignment && wm.assignment[curEvent.id] && wm.assignment[curEvent.id].length >= totalSize)
    ? wm.assignment[curEvent.id]
    : null;

  if (!pool || pool.length < totalSize) {
    const excludedNames = getExcludedAINamesForOtherEvents(curEvent.id);
    const minRankLimit = curEvent.maxRank || 1;
    const maxRankLimit = curEvent.qualiCut || 9999;

    let opponentPool = gameState.worldRanking.filter((x, idx) => {
      let r = idx + 1;
      return !x.isUser && 
             !isPlayerSeverelyInjured(x) && 
             !excludedNames.has(x.name) && 
             r >= minRankLimit && 
             r <= maxRankLimit;
    });

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

function buildPureAIDoublesTournamentData(curEvent) {
  ensureDoublesRankingAvailable();
  const wm = ensureWeekMeta();
  let totalSize = curEvent.drawSize <= 16 ? 16 : Math.min(32, Math.floor(curEvent.drawSize / 2));
  let dMinRank = curEvent.type === "Feeder" ? Math.max(17, Math.floor((curEvent.maxRank || 33) / 2)) : (curEvent.maxRank || 1);
  let dQualiCut = Math.floor((curEvent.qualiCut || 9999) / 2);

  let pool = (wm.doublesAssignment && wm.doublesAssignment[curEvent.id] && wm.doublesAssignment[curEvent.id].length >= totalSize) 
    ? wm.doublesAssignment[curEvent.id] 
    : null;

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

function simulateAIOnlyDoublesEvent(curEvent, presetField) {
  ensureDoublesRankingAvailable();
  let totalSize = curEvent.drawSize <= 16 ? 16 : Math.min(32, Math.floor(curEvent.drawSize / 2));
  let dMinRank = curEvent.type === "Feeder" ? Math.max(17, Math.floor((curEvent.maxRank || 33) / 2)) : (curEvent.maxRank || 1);

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
        let targetGames = (curEvent.drawSize >= 32 && r >= rounds.length - 2) ? 4 : 3;
        let simRes = simulateMatchScore(m.p1, m.p2, targetGames);
        m.winner = simRes.winner;
        m.score = simRes.score;
        m.scoreDetails = simRes.scoreDetails;

        let loser = (m.winner === m.p1) ? m.p2 : m.p1;
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

function getEligibleDoublesPairsForEvent(curEvent, targetCount) {
  ensureDoublesRankingAvailable();
  let pairs = gameState.doublesRanking.filter(pr => !pr.isUserPair);

  let dualPairs = pairs.filter(pr => {
    let p1Rank = gameState.worldRanking.findIndex(x => x.name === pr.player1.name) + 1;
    let p2Rank = gameState.worldRanking.findIndex(x => x.name === pr.player2.name) + 1;
    return p1Rank <= (curEvent.directCut || 64) && p2Rank <= (curEvent.directCut || 64);
  });

  let otherPairs = pairs.filter(pr => !dualPairs.includes(pr));
  let combinedPool = [...dualPairs, ...otherPairs];
  return combinedPool.slice(0, targetCount);
}

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
    pointsAward: isDoubles ? Math.floor(curEvent.points * 0.85) : curEvent.points,
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

function switchActiveBracketView(tab) {
  currentActiveBracketTab = tab;
  const sBtn = document.getElementById('btn-switch-singles-bracket');
  const dBtn = document.getElementById('btn-switch-doubles-bracket');
  if (sBtn) sBtn.classList.toggle('active-gear-type', tab === 'singles');
  if (dBtn) dBtn.classList.toggle('active-gear-type', tab === 'doubles');
  renderBracket();
}

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