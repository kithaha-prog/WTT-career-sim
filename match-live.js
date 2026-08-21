/* ==================== 广播级赛前对战 VS 预览卡 (支持 1v1 与 2v2) ==================== */
function openMatchPreviewModal(match) {
  if (!match) return;
  pendingLiveMatch = match;
  let rootTour = gameState.currentTournament;
  if (!rootTour) return;
  let tour = rootTour.mode === 'both' ? (match.isDoubles ? rootTour.doubles : rootTour.singles) : rootTour;

  const isDoubles = !!match.isDoubles;
  const isP1User = match.p1 ? !!match.p1.isUser : false;
  const userSide = isP1User ? match.p1 : match.p2;
  const oppSide = isP1User ? match.p2 : match.p1;
  const roundTitle = getRoundName(tour.drawSize, tour.currentRound, tour.phase);

  // 1. 顶部标题
  const evTypeEl = document.getElementById('prev-event-type');
  const evTitleEl = document.getElementById('prev-event-title');
  if (evTypeEl) evTypeEl.innerText = `${(tour.type || "WTT TOUR").toUpperCase()} · ${isDoubles ? 'DOUBLES (男子双打)' : 'SINGLES (男子单打)'}`;
  if (evTitleEl) evTitleEl.innerText = `${tour.name} · ${roundTitle}`;

  const grid = document.getElementById('prev-preview-grid');
  if (!grid) return;

  // 2. 渲染 2v2 双打预览
  if (isDoubles && userSide && oppSide) {
    let userPairRank = gameState.doublesRanking.findIndex(p => p.isUserPair) + 1;
    let oppPairObj = gameState.doublesRanking.find(p => p.name === oppSide.name) || oppSide;
    let oppPairRank = gameState.doublesRanking.indexOf(oppPairObj) + 1;

    let userChem = userSide.chemistry || 75;
    let oppChem = oppSide.chemistry || Math.floor(65 + Math.random() * 25);

    let p1 = userSide.player1 || { name: "我方", country: gameState.player.country };
    let p2 = userSide.player2 || { name: "搭档", country: gameState.player.country };
    let op1 = oppSide.player1 || { name: oppSide.name.split('/')[0]?.trim() || "对手1", country: "中国 (CHN)" };
    let op2 = oppSide.player2 || { name: oppSide.name.split('/')[1]?.trim() || "对手2", country: "中国 (CHN)" };

    grid.innerHTML = `
      <div class="preview-player-panel">
        <div class="preview-player-header">
          <div style="font-size: 2.2rem; background:#0c1427; border-radius:50%; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border:2px solid var(--accent-cyan);">👥</div>
          <div>
            <div style="font-size:0.8rem; color:var(--text-dim);">${getFlagImgHtml(p1.country)}${p1.country} ${p2.country !== p1.country ? getFlagImgHtml(p2.country) + p2.country : ''}</div>
            <div style="font-family:var(--font-display); font-size:1.15rem; font-weight:800; color:#fff;">${p1.name} / ${p2.name}</div>
          </div>
        </div>
        <div class="preview-stat-row"><span class="preview-stat-label">PAIR RANK (双打排名)</span><span class="preview-stat-val" style="color:var(--accent-cyan);">#${userPairRank || '--'}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">CHEMISTRY (搭档默契)</span><span class="preview-stat-val" style="color:var(--accent-gold);">${userChem} / 100</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">PLAYERS (组合成员)</span><span class="preview-stat-val" style="font-size:0.82rem; font-family:var(--font-body);">${p1.name} & ${p2.name}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">TITLES (合作头衔)</span><span class="preview-stat-val">${userSide.titles || 0} 🏆</span></div>
      </div>

      <div class="preview-vs-center">
        <div style="font-family:var(--font-display); font-size:2.2rem; font-weight:900; color:var(--accent-gold); text-shadow:0 0 16px rgba(255,183,3,0.6);">VS</div>
        <div class="badge badge-star" style="margin-top:6px;">2 vs 2 双打</div>
      </div>

      <div class="preview-player-panel p2">
        <div class="preview-player-header">
          <div style="font-size: 2.2rem; background:#0c1427; border-radius:50%; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border:2px solid var(--accent);">👥</div>
          <div>
            <div style="font-size:0.8rem; color:var(--text-dim);">${getFlagImgHtml(op1.country)}${op1.country} ${op2.country !== op1.country ? getFlagImgHtml(op2.country) + op2.country : ''}</div>
            <div style="font-family:var(--font-display); font-size:1.15rem; font-weight:800; color:#fff;">${op1.name} / ${op2.name}</div>
          </div>
        </div>
        <div class="preview-stat-row"><span class="preview-stat-label">PAIR RANK (双打排名)</span><span class="preview-stat-val" style="color:var(--accent);">#${oppPairRank > 0 ? oppPairRank : '--'}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">CHEMISTRY (搭档默契)</span><span class="preview-stat-val" style="color:var(--accent-gold);">${oppChem} / 100</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">PLAYERS (组合成员)</span><span class="preview-stat-val" style="font-size:0.82rem; font-family:var(--font-body);">${op1.name} & ${op2.name}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">TITLES (合作头衔)</span><span class="preview-stat-val">${oppPairObj.titles || 0} 🏆</span></div>
      </div>
    `;
  } 
  // 3. 渲染 1v1 单打预览
  else if (oppSide) {
    let p = gameState.player;
    let s = gameState.stats;
    let userRank = gameState.worldRanking.findIndex(x => x.isUser) + 1;
    let userBestRank = s.bestRank || userRank;
    let userYearsPro = p.year - 2026;
    let userTotalM = s.totalMatches || 0;
    let userWinRate = userTotalM > 0 ? ((s.wins / userTotalM) * 100).toFixed(1) + "%" : "0.0%";
    let userTitles = s.titles || 0;

    let oppRankIdx = gameState.worldRanking.findIndex(x => x.name === oppSide.name);
    let oppObj = oppRankIdx >= 0 ? gameState.worldRanking[oppRankIdx] : {};
    let oppBestRank = oppObj.bestRank || (oppRankIdx >= 0 ? oppRankIdx + 1 : "—");
    let oppYearsPro = oppObj.debutYear ? Math.max(0, gameState.player.year - oppObj.debutYear) : Math.max(0, (oppObj.age || 16) - 16);
    let oppWins = oppObj.careerWins || 0;
    let oppLosses = oppObj.careerLosses || 0;
    let oppTotalM = oppWins + oppLosses;
    let oppWinRate = oppTotalM > 0 ? ((oppWins / oppTotalM) * 100).toFixed(1) + "%" : "0.0%";
    let oppTitles = (oppObj.recentMatches || []).filter(m => m.result && m.result.includes("冠军")).length;

    let h2h = gameState.h2hData[oppSide.name] || { wins: 0, losses: 0 };

    grid.innerHTML = `
      <div class="preview-player-panel">
        <div class="preview-player-header">
          <div style="width:60px; height:60px; border-radius:50%; overflow:hidden; border:2px solid var(--accent-cyan); display:flex; align-items:center; justify-content:center;">
            ${getPlayerAvatarHtml(p, 60)}
          </div>
          <div>
            <div style="font-size:0.8rem; color:var(--text-dim);">${getFlagImgHtml(p.country)}${p.country}</div>
            <div style="font-family:var(--font-display); font-size:1.25rem; font-weight:800; color:#fff;">${p.name}</div>
          </div>
        </div>
        <div class="preview-stat-row"><span class="preview-stat-label">AGE (年龄)</span><span class="preview-stat-val">${p.age} 岁</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">YEARS PRO (职业年限)</span><span class="preview-stat-val">${userYearsPro} 年</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">WORLD RANKING</span><span class="preview-stat-val" style="color:var(--accent-cyan);">#${userRank}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">BEST RANK (最高排名)</span><span class="preview-stat-val" style="color:var(--accent-gold);">#${userBestRank}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">STYLE</span><span class="preview-stat-val" style="font-size:0.85rem;">${p.style}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">WIN % (胜率)</span><span class="preview-stat-val" style="color:var(--accent-gold);">${userWinRate}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">TITLES (冠军)</span><span class="preview-stat-val">${userTitles} 🏆</span></div>
      </div>

      <div class="preview-vs-center">
        <div style="font-family:var(--font-display); font-size:2.2rem; font-weight:900; color:var(--accent-gold); text-shadow:0 0 16px rgba(255,183,3,0.6);">VS</div>
        <div style="font-size:0.75rem; color:var(--text-dim); margin-top:6px;">H2H: ${h2h.wins}-${h2h.losses}</div>
      </div>

      <div class="preview-player-panel p2">
        <div class="preview-player-header">
          <div style="width:60px; height:60px; border-radius:50%; overflow:hidden; border:2px solid var(--accent); display:flex; align-items:center; justify-content:center;">
            ${getPlayerAvatarHtml(oppObj, 60)}
          </div>
          <div>
            <div style="font-size:0.8rem; color:var(--text-dim);">${getFlagImgHtml(oppObj.country || oppSide.country || "中国 (CHN)")}${oppObj.country || oppSide.country || "中国 (CHN)"}</div>
            <div style="font-family:var(--font-display); font-size:1.25rem; font-weight:800; color:#fff;">${oppSide.name}</div>
          </div>
        </div>
        <div class="preview-stat-row"><span class="preview-stat-label">AGE (年龄)</span><span class="preview-stat-val">${oppObj.age || 22} 岁</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">YEARS PRO (职业年限)</span><span class="preview-stat-val">${oppYearsPro} 年</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">WORLD RANKING</span><span class="preview-stat-val" style="color:var(--accent);">#${oppRankIdx >= 0 ? oppRankIdx + 1 : '--'}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">BEST RANK (最高排名)</span><span class="preview-stat-val" style="color:var(--accent-gold);">#${oppBestRank}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">STYLE</span><span class="preview-stat-val" style="font-size:0.85rem;">${oppObj.style || '快攻弧圈型'}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">WIN % (胜率)</span><span class="preview-stat-val" style="color:var(--accent-gold);">${oppWinRate}</span></div>
        <div class="preview-stat-row"><span class="preview-stat-label">TITLES (冠军)</span><span class="preview-stat-val">${oppTitles} 🏆</span></div>
      </div>
    `;
  }

  document.getElementById('match-preview-modal').style.display = 'flex';
}

function closeMatchPreviewModal() {
  document.getElementById('match-preview-modal').style.display = 'none';
  pendingLiveMatch = null;
}

function startMatchFromPreview() {
  if (!pendingLiveMatch) return;
  const matchToStart = pendingLiveMatch;
  closeMatchPreviewModal();
  openLiveMatch(matchToStart);
}

function createEmptyGameStats() {
  return {
    userServePts: 0, userServeWon: 0,
    oppServePts: 0, oppServeWon: 0,
    userPointsWon: 0, oppPointsWon: 0,
    maxLeadUser: 0, maxLeadOpp: 0,
    curStreak: 0, curStreakSide: null,
    maxStreakUser: 0, maxStreakOpp: 0
  };
}

function openLiveMatch(match) {
  let tour = gameState.currentTournament;
  if (tour.mode === 'both') {
    tour = (currentActiveBracketTab === 'doubles' || match.isDoubles) ? tour.doubles : tour.singles;
  }

  const isP1User = match.p1.isUser;
  const user = isP1User ? match.p1 : match.p2;
  const opp = isP1User ? match.p2 : match.p1;
  const roundTitle = getRoundName(tour.drawSize, tour.currentRound, tour.phase);

  const isAnimEnabled = gameState.settings ? gameState.settings.enable3DAnim !== false : true;
  const viewport3D = document.getElementById('tt-3d-viewport');
  
  if (viewport3D) {
    viewport3D.style.display = isAnimEnabled ? 'block' : 'none';
  }

  document.getElementById('live-match-modal').style.display = 'flex';

  if (isAnimEnabled) {
    setTimeout(() => {
      initTableTennis3D();
    }, 50);
  }
  
  document.getElementById('live-match-stage').innerText = `${match.isDoubles ? '👥 双打 ' : '🏓 单打 '}${roundTitle}`;
  document.getElementById('live-p1-name').innerText = user.name + (user.seed ? ` [${user.seed}号种子]` : '');
  document.getElementById('live-p2-name').innerText = opp.name + (opp.seed ? ` [${opp.seed}号种子]` : '');

  document.getElementById('live-commentary').innerHTML = `<div>🏓 欢迎来到【${tour.name}】${match.isDoubles ? '双打' : '单打'} ${roundTitle} 比赛现场！双方正在做挑边准备...</div>`;

  let maxGames = (tour.drawSize <= 16 && tour.currentRound >= 2) || (tour.drawSize === 64 && tour.currentRound >= 4) ? 4 : 3;

  liveMatchState = {
    match: match,
    isDoubles: !!match.isDoubles,
    user: user,
    opp: opp,
    userGames: 0,
    oppGames: 0,
    userPoints: 0,
    oppPoints: 0,
    server: 'user',
    totalServesInGame: 0,
    maxGames: maxGames,
    isFinished: false,
    userGameScores: [],
    oppGameScores: [],
    userFormJitter: rollMatchDayForm(),
    oppFormJitter: rollMatchDayForm(),
    games: [ createEmptyGameStats() ]
  };

  matchStatsActiveTab = 'all';
  updateLiveScoreboard();
  document.getElementById('live-inprogress-bar').style.display = 'flex';
  document.getElementById('live-finish-bar').classList.remove('show');
  document.getElementById('btn-live-next').style.display = 'inline-block';
  document.getElementById('btn-live-skip').style.display = 'inline-block';
  document.getElementById('live-match-modal').style.display = 'flex';

  stopLiveAutoplay();
  document.getElementById('btn-live-autoplay').style.display = 'inline-block';
  document.getElementById('btn-live-autoplay').innerText = '▶ 自动播放';
}

function stepLivePoint() {
  if (!liveMatchState || liveMatchState.isFinished || isRallyAnimating) return;

  const st = liveMatchState;
  const u = getEffectiveStats();
  const oppRankObj = gameState.worldRanking.find(x => x.name === st.opp.name);
  const oppStats = oppRankObj?.stats || generateAI12Stats(st.opp.power || 65, oppRankObj?.style);

  const isUserServing = (st.server === 'user');
  const serverStats = isUserServing ? u : oppStats;
  const receiverStats = isUserServing ? oppStats : u;

  let userWonPoint = false;
  let commentaryText = "";
  let hudText = "";
  let shotList = [];

  let serveDiff = serverStats.serve - receiverStats.receive;
  let aceProb = Math.max(0.01, Math.min(0.18, 0.02 + serveDiff * 0.002));
  let chiquitaProb = Math.max(0.08, Math.min(0.55, 0.15 + (receiverStats.receive - serverStats.serve) * 0.005));

  let roll = Math.random();

  if (roll < aceProb) {
    userWonPoint = isUserServing;
    shotList.push({ isUser: isUserServing, action: 'serve', isWinner: false });
    shotList.push({ isUser: !isUserServing, action: 'net_error', isWinner: false });

    hudText = userWonPoint 
      ? `🟢 我方得分 (+1) · 对方接发吃旋转下网` 
      : `🔴 ${st.opp.name} 得分 (+1) · 我方接发判断失误下网`;

    commentaryText = userWonPoint 
      ? `<span style="color:var(--accent-blue);">🌀 我方发出极强旋转短球，${st.opp.name} 接发吃旋转直接下网！</span>`
      : `<span style="color:var(--accent);">🌀 ${st.opp.name} 发出高质量隐蔽发球，我方接发下网失误！</span>`;
  } 
  else if (roll < aceProb + chiquitaProb) {
    let attackValue = receiverStats.bhSpeed * 0.7 + receiverStats.receive * 0.3;
    let defenseValue = serverStats.rally * 0.7 + serverStats.footwork * 0.3;
    let attackSuccessProb = Math.max(0.20, Math.min(0.85, 0.50 + (attackValue - defenseValue) * 0.015));

    if (Math.random() < attackSuccessProb) {
      userWonPoint = !isUserServing;
      shotList.push({ isUser: isUserServing, action: 'serve', isWinner: false });
      shotList.push({ isUser: !isUserServing, action: 'chiquita', isWinner: true });

      hudText = userWonPoint 
        ? `🟢 我方得分 (+1) · 反手拧拉暴冲绝杀` 
        : `🔴 ${st.opp.name} 得分 (+1) · 反手强拧下底变线制胜`;

      commentaryText = userWonPoint 
        ? `<span style="color:var(--accent-blue);">⚡ 我方看准来球台内反手强力拧拉直线绝杀得分！</span>`
        : `<span style="color:var(--accent);">⚡ ${st.opp.name} 迎前反手霸气强拧大角度变线，我方扑救不及失分！</span>`;
    } else {
      let rallyDiff = (computeUserCombatPower() - (st.opp.power || 65)) + (st.userFormJitter - st.oppFormJitter);
      userWonPoint = Math.random() < pointWinProb(rallyDiff, { clutch: (u.mental - oppStats.mental) * 0.002 });

      let rallyRounds = 4 + Math.floor(Math.random() * 5);
      shotList.push({ isUser: isUserServing, action: 'serve', isWinner: false });
      shotList.push({ isUser: !isUserServing, action: 'chiquita', isWinner: false });

      let currentHitter = isUserServing;
      for (let r = 2; r < rallyRounds - 1; r++) {
        shotList.push({ isUser: currentHitter, action: r % 2 === 0 ? 'rally' : 'smash', isWinner: false });
        currentHitter = !currentHitter;
      }

      const loserIsUser = !userWonPoint;
      const errorAction = Math.random() < 0.5 ? 'net_error' : 'out_error';
      shotList.push({ isUser: loserIsUser, action: errorAction, isWinner: false });

      const errorLabel = (errorAction === 'net_error') ? '回球下网' : '回球出界';
      hudText = userWonPoint 
        ? `🟢 我方得分 (+1) · 对手${errorLabel}` 
        : `🔴 ${st.opp.name} 得分 (+1) · 我方${errorLabel}`;

      commentaryText = userWonPoint
        ? `<span style="color:var(--accent-blue);">🛡️ 双方经过 ${rallyRounds} 板高强度对拉，对手变线${errorLabel}失误，我方得分！</span>`
        : `<span style="color:var(--accent);">🛡️ 双方大战 ${rallyRounds} 板中远台拉锯，我方拉球${errorLabel}失误！</span>`;
    }
  } 
  else {
    let rallyDiff = (computeUserCombatPower() - (st.opp.power || 65)) + (st.userFormJitter - st.oppFormJitter);
    let isClutch = st.userPoints >= 9 && st.oppPoints >= 9;
    userWonPoint = Math.random() < pointWinProb(rallyDiff, { clutch: isClutch ? (u.mental - oppStats.mental) * 0.003 : 0 });

    let totalShots = 6 + Math.floor(Math.random() * 7);
    shotList.push({ isUser: isUserServing, action: 'serve', isWinner: false });
    shotList.push({ isUser: !isUserServing, action: 'chop', isWinner: false });

    let currentHitter = isUserServing;
    for (let r = 2; r < totalShots - 1; r++) {
      shotList.push({
        isUser: currentHitter,
        action: Math.random() < 0.6 ? 'rally' : 'smash',
        isWinner: false
      });
      currentHitter = !currentHitter;
    }

    const loserIsUser = !userWonPoint;
    const errorAction = Math.random() < 0.5 ? 'net_error' : 'out_error';
    shotList.push({ isUser: loserIsUser, action: errorAction, isWinner: false });

    const errorLabel = (errorAction === 'net_error') ? '下网' : '出界';
    hudText = userWonPoint 
      ? `🟢 我方得分 (+1) · 对手相持${errorLabel}` 
      : `🔴 ${st.opp.name} 得分 (+1) · 我方相持${errorLabel}`;

    commentaryText = userWonPoint
      ? `<span style="color:var(--accent-blue);">🏓 精彩！多达 ${totalShots} 板极限相持攻防，逼迫对方${errorLabel}失误得分！</span>`
      : `<span style="color:var(--accent);">🏓 双方连续对拉 ${totalShots} 板，我方退台反拉回球${errorLabel}失误！</span>`;
  }

  const applyPointOutcome = () => {
    showBroadcastHUD(hudText, userWonPoint ? 'user' : 'opp');

    if (userWonPoint) st.userPoints++; else st.oppPoints++;
    st.totalServesInGame++;
    recordPointStats(st, isUserServing, userWonPoint);

    let deuce = st.userPoints >= 10 && st.oppPoints >= 10;
    if (deuce || st.totalServesInGame % 2 === 0) {
      st.server = (st.server === 'user') ? 'opp' : 'user';
    }

    let logHtml = `<div>• <strong>[${st.userPoints} : ${st.oppPoints}]</strong> ${commentaryText}</div>`;
    const feed = document.getElementById('live-commentary');
    if (feed) feed.innerHTML = logHtml + feed.innerHTML;

    if ((st.userPoints >= 11 || st.oppPoints >= 11) && Math.abs(st.userPoints - st.oppPoints) >= 2) {
      let userWonGame = st.userPoints > st.oppPoints;
      if (userWonGame) st.userGames++; else st.oppGames++;

      st.userGameScores.push(st.userPoints);
      st.oppGameScores.push(st.oppPoints);

      if (feed) {
        feed.innerHTML = `<div class="highlight">🔔 第 ${st.userGames + st.oppGames} 局结束！局分：(${st.userPoints}-${st.oppPoints})，总比分来到 [${st.userGames} - ${st.oppGames}]！</div>` + feed.innerHTML;
      }
      st.userPoints = 0;
      st.oppPoints = 0;
      st.totalServesInGame = 0;

      if (st.userGames === st.maxGames || st.oppGames === st.maxGames) {
        st.isFinished = true;
        let wonMatch = st.userGames > st.oppGames;
        if (feed) {
          feed.innerHTML = `<div class="highlight" style="color:var(--accent-gold); font-size:1rem; margin-top:8px;">🏆 全场比赛结束！${wonMatch ? '我方选手' : st.opp.name} 以 [${st.userGames} - ${st.oppGames}] 获胜！</div>` + feed.innerHTML;
        }
        document.getElementById('live-inprogress-bar').style.display = 'none';
        document.getElementById('live-finish-bar').classList.add('show');
        document.getElementById('btn-live-autoplay').style.display = 'none';
        stopLiveAutoplay();
      } else {
        st.games.push(createEmptyGameStats());
      }
    }
    updateLiveScoreboard();
  };

  const isAnimEnabled = gameState.settings ? gameState.settings.enable3DAnim !== false : true;
  if (isAnimEnabled) {
    startRallyAnimation(shotList, applyPointOutcome);
  } else {
    applyPointOutcome();
  }
}

function skipLiveMatch() {
  stopLiveAutoplay();
  updateLiveAutoplayButtonLabel();
  rallyQueue = [];
  isRallyAnimating = false;
  currentTrajectory = null;

  while(liveMatchState && !liveMatchState.isFinished) {
    stepLivePoint();
    if (isRallyAnimating && onRallyFinishedCallback) {
      onRallyFinishedCallback();
      onRallyFinishedCallback = null;
      isRallyAnimating = false;
    }
  }
}

function updateLiveScoreboard() {
  if (!liveMatchState) return;
  const st = liveMatchState;

  document.getElementById('live-p1-games').innerText = st.userGames;
  document.getElementById('live-p2-games').innerText = st.oppGames;

  document.getElementById('live-p1-serve').className = `sb-serve-indicator ${st.server === 'user' ? 'active' : ''}`;
  document.getElementById('live-p2-serve').className = `sb-serve-indicator ${st.server === 'opp' ? 'active' : ''}`;

  let p1SubHtml = '';
  let p2SubHtml = '';
  let totalGamesCount = Math.max(st.userGameScores.length, st.oppGameScores.length);
  
  for (let i = 0; i < totalGamesCount; i++) {
    let p1ScoreText = st.userGameScores[i] !== undefined ? st.userGameScores[i] : '';
    let p2ScoreText = st.oppGameScores[i] !== undefined ? st.oppGameScores[i] : '';
    
    p1SubHtml += `<span class="sb-sub-score">${p1ScoreText}</span>`;
    p2SubHtml += `<span class="sb-sub-score">${p2ScoreText}</span>`;
  }
  document.getElementById('live-p1-subgames').innerHTML = p1SubHtml;
  document.getElementById('live-p2-subgames').innerHTML = p2SubHtml;

  document.getElementById('live-p1-points').innerText = st.userPoints;
  document.getElementById('live-p2-points').innerText = st.oppPoints;
}

function stopLiveAutoplay() {
  if (liveAutoplayTimer) {
    clearInterval(liveAutoplayTimer);
    liveAutoplayTimer = null;
  }
  liveAutoplaySpeed = 0;
}

function startLiveAutoplay(speed) {
  if (liveAutoplayTimer) clearInterval(liveAutoplayTimer);
  liveAutoplaySpeed = speed;
  liveAutoplayTimer = setInterval(() => {
    if (!liveMatchState || liveMatchState.isFinished) {
      stopLiveAutoplay();
      updateLiveAutoplayButtonLabel();
      return;
    }
    stepLivePoint();
  }, LIVE_AUTOPLAY_BASE_MS / speed);
}

function toggleLiveAutoplay() {
  if (!liveMatchState || liveMatchState.isFinished) return;
  const nextSpeedMap = { 0: 1, 1: 2, 2: 4, 4: 0 };
  const next = nextSpeedMap[liveAutoplaySpeed];
  if (next === 0) {
    stopLiveAutoplay();
  } else {
    startLiveAutoplay(next);
  }
  updateLiveAutoplayButtonLabel();
}

/* ==================== 修复大比分反转与结算崩溃 ==================== */
function closeLiveModal() {
  stopLiveAutoplay();
  document.getElementById('live-match-modal').style.display = 'none';
  if (!liveMatchState) return;

  const st = liveMatchState;
  const isDoubles = Boolean(st.isDoubles || st.match?.isDoubles);
  
  let rootTour = gameState.currentTournament;
  let tour = rootTour;
  if (rootTour && rootTour.mode === 'both') {
    tour = isDoubles ? rootTour.doubles : rootTour.singles;
  }

  const wonMatch = st.userGames > st.oppGames;
  const userWon = wonMatch;
  const oppName = st.opp.name;

  st.match.winner = userWon ? st.user : st.opp;

  let isP1User = Boolean(st.match.p1?.isUser);
  let p1FinalGames = isP1User ? st.userGames : st.oppGames;
  let p2FinalGames = isP1User ? st.oppGames : st.userGames;
  
  let formattedGameDetails = (st.userGameScores || []).map((sc, idx) => `${sc}-${st.oppGameScores[idx] || 0}`).join(', ');
  
  st.match.score = `${p1FinalGames} - ${p2FinalGames}`;
  st.match.scoreDetails = formattedGameDetails ? `(${formattedGameDetails})` : `(${p1FinalGames}-${p2FinalGames})`;

  // 1. 双打专属数据结算
  if (isDoubles) {
    const ds = gameState.doublesStats;
    const partner = gameState.playerDoubles?.currentPartner;

    ds.totalMatches = (ds.totalMatches || 0) + 1;
    if (userWon) {
      ds.wins = (ds.wins || 0) + 1;
      ds.currentStreak = (ds.currentStreak || 0) + 1;
      if (ds.currentStreak > (ds.bestStreak || 0)) ds.bestStreak = ds.currentStreak;
    } else {
      ds.losses = (ds.losses || 0) + 1;
      ds.currentStreak = 0;
    }

    let isDecidingMatch = (st.userGames + st.oppGames) === (st.maxGames * 2 - 1);
    if (isDecidingMatch) {
      ds.decidingMatchesPlayed = (ds.decidingMatchesPlayed || 0) + 1;
      if (userWon) ds.decidingMatchesWon = (ds.decidingMatchesWon || 0) + 1;
    }

    if (partner) {
      partner.matches = (partner.matches || 0) + 1;
      if (userWon) partner.wins = (partner.wins || 0) + 1;
      else partner.losses = (partner.losses || 0) + 1;
      applyDoublesMatchChemistryDelta(userWon);
    }

    const userPair = gameState.doublesRanking?.find(p => p.isUserPair);
    if (userPair) {
      if (userWon) userPair.careerWins = (userPair.careerWins || 0) + 1;
      else userPair.careerLosses = (userPair.careerLosses || 0) + 1;
    }

    const oppPair = gameState.doublesRanking?.find(p => p.name === oppName);
    if (oppPair) {
      if (userWon) oppPair.careerLosses = (oppPair.careerLosses || 0) + 1;
      else oppPair.careerWins = (oppPair.careerWins || 0) + 1;
    }

    let roundName = tour ? getRoundName(tour.drawSize, tour.currentRound, tour.phase) : "对决";
    let logText = `[${gameState.player.year}年 第${gameState.player.week}周 | ${tour?.name || '巡回赛'}] 👥 男双 ${roundName} 对决 【${oppName}】，比分 ${st.userGames}-${st.oppGames} (${userWon ? '🔥 获胜' : '❌ 失利'})`;
    gameState.matchHistory.unshift(logText);
  } 
  // 2. 单打专属数据结算
  else {
    const s = gameState.stats;
    s.totalMatches++;
    if (userWon) {
      s.wins++;
      s.currentStreak = (s.currentStreak || 0) + 1;
      if (s.currentStreak > (s.bestStreak || 0)) s.bestStreak = s.currentStreak;
    } else {
      s.losses++;
      s.currentStreak = 0;
    }

    let isDecidingMatch = (st.userGames + st.oppGames) === (st.maxGames * 2 - 1);
    if (isDecidingMatch) {
      s.decidingMatchesPlayed = (s.decidingMatchesPlayed || 0) + 1;
      if (userWon) s.decidingMatchesWon = (s.decidingMatchesWon || 0) + 1;
    }

    let oppRankIdx = gameState.worldRanking.findIndex(x => x.name === oppName);
    let isVsTop10 = oppRankIdx >= 0 && (oppRankIdx + 1) <= 10;
    if (isVsTop10) {
      s.top10MatchesPlayed = (s.top10MatchesPlayed || 0) + 1;
      if (userWon) s.top10MatchesWon = (s.top10MatchesWon || 0) + 1;
    }

    const userRankObj = gameState.worldRanking.find(x => x.isUser);
    const oppRankObj = gameState.worldRanking.find(x => x.name === oppName);
    if (userRankObj) {
      if (userWon) userRankObj.careerWins = (userRankObj.careerWins || 0) + 1;
      else userRankObj.careerLosses = (userRankObj.careerLosses || 0) + 1;
    }
    if (oppRankObj) {
      if (userWon) oppRankObj.careerLosses = (oppRankObj.careerLosses || 0) + 1;
      else oppRankObj.careerWins = (oppRankObj.careerWins || 0) + 1;
    }

    if (!gameState.h2hData[oppName]) {
      gameState.h2hData[oppName] = { wins: 0, losses: 0, matches: [] };
    }
    if (userWon) gameState.h2hData[oppName].wins++; else gameState.h2hData[oppName].losses++;
    
    gameState.h2hData[oppName].matches.unshift({
      week: tour?.week || gameState.player.week,
      year: gameState.player.year,
      event: tour?.name || '巡回赛',
      score: `${st.userGames}-${st.oppGames} (${formattedGameDetails})`,
      win: userWon
    });

    let roundName = st.match.isBronze ? "奥运铜牌战" : (tour ? getRoundName(tour.drawSize, tour.currentRound, tour.phase) : "对决");
    let logText = `[${gameState.player.year}年 第${gameState.player.week}周 | ${tour?.name || '巡回赛'}] 🏓 单打 ${roundName} 对决 【${oppName}】，比分 ${st.userGames}-${st.oppGames} (${userWon ? '🔥 获胜' : '❌ 失利'})`;
    gameState.matchHistory.unshift(logText);
  }

  finishCurrentRound(userWon, isDoubles);
}

function simulatePureAIRound() {
  const tour = gameState.currentTournament;
  if (!tour || tour.completed) return;
  finishCurrentRound(false);
}

function aggregateGameStats(games) {
  const agg = createEmptyGameStats();
  games.forEach(g => {
    agg.userServePts += g.userServePts;
    agg.userServeWon += g.userServeWon;
    agg.oppServePts += g.oppServePts;
    agg.oppServeWon += g.oppServeWon;
    agg.userPointsWon += g.userPointsWon;
    agg.oppPointsWon += g.oppPointsWon;
    if (g.maxLeadUser > agg.maxLeadUser) agg.maxLeadUser = g.maxLeadUser;
    if (g.maxLeadOpp > agg.maxLeadOpp) agg.maxLeadOpp = g.maxLeadOpp;
    if (g.maxStreakUser > agg.maxStreakUser) agg.maxStreakUser = g.maxStreakUser;
    if (g.maxStreakOpp > agg.maxStreakOpp) agg.maxStreakOpp = g.maxStreakOpp;
  });
  return agg;
}

function recordPointStats(st, isUserServing, userWonPoint) {
  const g = st.games[st.games.length - 1];
  if (!g) return;

  if (isUserServing) {
    g.userServePts++;
    if (userWonPoint) g.userServeWon++;
  } else {
    g.oppServePts++;
    if (!userWonPoint) g.oppServeWon++;
  }

  if (userWonPoint) g.userPointsWon++; else g.oppPointsWon++;

  const lead = g.userPointsWon - g.oppPointsWon;
  if (lead > g.maxLeadUser) g.maxLeadUser = lead;
  if (-lead > g.maxLeadOpp) g.maxLeadOpp = -lead;

  const side = userWonPoint ? 'user' : 'opp';
  if (g.curStreakSide === side) {
    g.curStreak++;
  } else {
    g.curStreakSide = side;
    g.curStreak = 1;
  }
  if (side === 'user' && g.curStreak > g.maxStreakUser) g.maxStreakUser = g.curStreak;
  if (side === 'opp' && g.curStreak > g.maxStreakOpp) g.maxStreakOpp = g.curStreak;
}

let matchStatsActiveTab = 'all';

function openMatchStatsModal() {
  if (!liveMatchState) return;
  const st = liveMatchState;

  document.getElementById('stats-p1-name').innerText = '我方 ' + (st.user.name || '选手');
  document.getElementById('stats-p2-name').innerText = st.opp.name || '对手';

  const tabRow = document.getElementById('stats-tab-row');
  let tabHtml = `<button class="stats-tab-btn ${matchStatsActiveTab === 'all' ? 'active' : ''}" onclick="switchMatchStatsTab('all')">全场</button>`;
  st.games.forEach((g, idx) => {
    if (g.userPointsWon === 0 && g.oppPointsWon === 0 && idx > 0 && idx >= st.games.length - 1 && !st.isFinished) return;
    tabHtml += `<button class="stats-tab-btn ${matchStatsActiveTab === idx ? 'active' : ''}" onclick="switchMatchStatsTab(${idx})">G${idx + 1}</button>`;
  });
  tabRow.innerHTML = tabHtml;

  renderMatchStatsBody();
  document.getElementById('match-stats-modal').style.display = 'flex';
}

function closeMatchStatsModal() {
  document.getElementById('match-stats-modal').style.display = 'none';
}

function switchMatchStatsTab(tab) {
  matchStatsActiveTab = tab;
  openMatchStatsModal();
}

function renderMatchStatsBody() {
  if (!liveMatchState) return;
  const st = liveMatchState;
  const body = document.getElementById('stats-body');

  let g;
  if (matchStatsActiveTab === 'all') {
    g = aggregateGameStats(st.games);
  } else {
    g = st.games[matchStatsActiveTab];
  }

  if (!g || (g.userPointsWon === 0 && g.oppPointsWon === 0)) {
    body.innerHTML = `<div class="stats-empty-note">该局暂无数据</div>`;
    return;
  }

  const totalPts = g.userPointsWon + g.oppPointsWon;
  const userServeWinRate = g.userServePts > 0 ? Math.round((g.userServeWon / g.userServePts) * 100) : 0;
  const oppServeWinRate = g.oppServePts > 0 ? Math.round((g.oppServeWon / g.oppServePts) * 100) : 0;
  const userReceiveWinRate = g.oppServePts > 0 ? Math.round(((g.oppServePts - g.oppServeWon) / g.oppServePts) * 100) : 0;
  const oppReceiveWinRate = g.userServePts > 0 ? Math.round(((g.userServePts - g.userServeWon) / g.userServePts) * 100) : 0;

  const barPct = (a, b) => {
    const sum = a + b;
    return sum > 0 ? (a / sum) * 100 : 50;
  };

  body.innerHTML = `
    ${statsRow('赢分', g.userPointsWon, g.oppPointsWon, barPct(g.userPointsWon, g.oppPointsWon))}
    ${statsRow('发球得分率', userServeWinRate + '%', oppServeWinRate + '%', barPct(userServeWinRate, oppServeWinRate))}
    ${statsRow('接发得分率', userReceiveWinRate + '%', oppReceiveWinRate + '%', barPct(userReceiveWinRate, oppReceiveWinRate))}
    ${statsRow('最大领先', g.maxLeadUser, g.maxLeadOpp, barPct(g.maxLeadUser, g.maxLeadOpp))}
    ${statsRow('最多连续得分', g.maxStreakUser, g.maxStreakOpp, barPct(g.maxStreakUser, g.maxStreakOpp))}
  `;
}

function statsRow(label, p1Val, p2Val, p1Pct) {
  return `
    <div class="stats-row-wrap">
      <div class="stats-row-top">
        <span class="stats-val p1">${p1Val}</span>
        <span>${label}</span>
        <span class="stats-val p2">${p2Val}</span>
      </div>
      <div class="stats-bar-track">
        <div class="stats-bar-fill-p1" style="width:${p1Pct}%;"></div>
        <div class="stats-bar-fill-p2" style="width:${100 - p1Pct}%;"></div>
      </div>
    </div>
  `;
}

function openInjuryHistoryModal(playerName) {
  if (!playerName) return;
  const modal = document.getElementById('injury-history-modal');
  const title = document.getElementById('injury-modal-title');
  const summary = document.getElementById('injury-modal-summary');
  const body = document.getElementById('injury-modal-body');

  let p = gameState.worldRanking.find(x => x.name === playerName) || (gameState.retiredPlayers || []).find(x => x.name === playerName);
  let isUser = (playerName === gameState.player.name);

  title.innerHTML = `🏥 【${playerName}】历史伤病档案`;

  let curStatusHtml = '<span style="color:#10b981; font-weight:bold;">🟢 当前完全健康</span>';
  if (isUser) {
    if (gameState.player.injury && INJURY_TYPES[gameState.player.injury]) {
      const inj = INJURY_TYPES[gameState.player.injury];
      curStatusHtml = `<span style="color:var(--accent); font-weight:bold;">🚨 当前处于伤病：${inj.name}</span>`;
    }
  } else if (p && p.injury && p.injury !== "健康") {
    curStatusHtml = `<span style="color:var(--accent); font-weight:bold;">🚨 当前处于伤病：${p.injury}</span>`;
  }

  let injuryLogs = [];
  if (isUser) {
    injuryLogs = gameState.player.injuryHistory || [];
  } else if (p) {
    injuryLogs = p.injuryHistory || [];
  }

  summary.innerHTML = `
    <div>身体状态: ${curStatusHtml}</div>
    <div>生涯累计伤病: <strong style="color:var(--accent-gold); font-size:1.05rem;">${injuryLogs.length}</strong> 次</div>
  `;

  if (injuryLogs.length === 0) {
    body.innerHTML = `
      <div style="text-align:center; padding:36px 10px; color:var(--text-dim);">
        <div style="font-size:2.4rem; margin-bottom:8px;">🛡️</div>
        <div style="font-size:0.95rem; font-weight:bold; color:var(--text);">生涯至今保持全勤，无重大伤病记录！</div>
        <div style="font-size:0.8rem; margin-top:4px;">身体管理极佳，未曾出现肌肉拉伤或关节劳损。</div>
      </div>`;
  } else {
    body.innerHTML = injuryLogs.map(item => `
      <div style="background:var(--bg-card-alt); border:1px solid var(--border); border-left:4px solid ${item.isSevere ? 'var(--accent)' : 'var(--accent-gold)'}; border-radius:12px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:0.75rem; color:var(--text-dim); margin-bottom:3px;">
            📅 ${item.year}赛季 · 第 ${item.week} 周触发
          </div>
          <div style="font-size:0.92rem; font-weight:bold; color:#fff;">
            ${item.name}
          </div>
          <div style="font-size:0.78rem; color:var(--text-dim); margin-top:2px;">
            ${item.desc || ''}
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <span class="badge ${item.isSevere ? 'badge-smash' : 'badge-gold'}">${item.isSevere ? '🚨 重度伤病' : '🩹 轻度伤病'}</span>
          <div style="font-size:0.75rem; color:#4ade80; margin-top:4px; font-weight:bold;">${item.recovered ? '✔ 已康复' : '⚠️ 治疗中'}</div>
        </div>
      </div>
    `).join('');
  }

  modal.style.display = 'flex';
}

function closeInjuryHistoryModal() {
  document.getElementById('injury-history-modal').style.display = 'none';
}

function openRetiredPlayersModal() {
  const modal = document.getElementById('retired-players-modal');
  const tbody = document.getElementById('retired-players-tbody');
  
  let list = (gameState.retiredPlayers || []).slice();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:36px 10px; color:var(--text-dim);">
          <div style="font-size:2.2rem; margin-bottom:6px;">🏓</div>
          <div style="font-size:0.95rem; font-weight:bold; color:var(--text);">目前尚无选手退役</div>
          <div style="font-size:0.8rem; margin-top:4px;">随着赛季推进与老将年龄增长，退役的名将将在此铭刻入殿！</div>
        </td>
      </tr>
    `;
    modal.style.display = 'flex';
    return;
  }

  list.forEach(p => {
    let medals = getPlayerMedalsList(p.name);
    p.goldCount = medals.filter(m => m.medal === 'G').length;
    p.silverCount = medals.filter(m => m.medal === 'S').length;
    p.bronzeCount = medals.filter(m => m.medal === 'B').length;
    p.totalMedals = p.goldCount + p.silverCount + p.bronzeCount;
  });

  list.sort((a, b) => {
    if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
    if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
    if (b.bronzeCount !== a.bronzeCount) return b.bronzeCount - a.bronzeCount;
    return (b.careerWins || 0) - (a.careerWins || 0);
  });

  tbody.innerHTML = list.map((p, idx) => {
    let rankBadge = idx === 0 
      ? `<span style="color:#f59e0b; font-weight:900; font-size:1.05rem;">🥇 1</span>`
      : (idx === 1 
        ? `<span style="color:#cbd5e1; font-weight:900; font-size:1.05rem;">🥈 2</span>`
        : (idx === 2 
          ? `<span style="color:#d97706; font-weight:900; font-size:1.05rem;">🥉 3</span>`
          : `<span style="color:var(--text-dim); font-weight:bold;">#${idx + 1}</span>`));

    return `
      <tr>
        <td style="text-align:center;">${rankBadge}</td>
        <td>
          <span class="player-clickable" onclick="openPlayerProfileModal('${p.name}')">${p.name}</span>
        </td>
        <td>${p.country || '—'}</td>
        <td>${p.age || '—'} 岁</td>
        <td style="text-align:center;">
          <span style="color:#f59e0b; font-weight:bold; margin-right:8px;" title="金牌数">🥇 ${p.goldCount}</span>
          <span style="color:#cbd5e1; font-weight:bold; margin-right:8px;" title="银牌数">🥈 ${p.silverCount}</span>
          <span style="color:#d97706; font-weight:bold;" title="铜牌数">🥉 ${p.bronzeCount}</span>
        </td>
        <td style="font-size:0.85rem;">
          <strong style="color:var(--accent-blue);">${p.careerWins || 0}胜</strong>
          <span style="color:var(--text-dim);"> / ${p.careerLosses || 0}负</span>
        </td>
        <td style="color:var(--accent-gold); font-size:0.85rem; font-family:var(--font-display); font-weight:bold;">
          ${p.retiredYear ? p.retiredYear + '年' : '赛季末'}
        </td>
      </tr>
    `;
  }).join('');

  modal.style.display = 'flex';
}

function closeRetiredPlayersModal() {
  document.getElementById('retired-players-modal').style.display = 'none';
}

function openCareerMedalsModal() {
  ensureCareerMedals();
  const modal = document.getElementById('career-medals-modal');
  const summaryBar = document.getElementById('medals-summary-bar');
  const body = document.getElementById('career-medals-body');

  const medals = gameState.careerMedals || [];
  let gCount = medals.filter(m => m.medal === 'G').length;
  let sCount = medals.filter(m => m.medal === 'S').length;
  let bCount = medals.filter(m => m.medal === 'B').length;

  summaryBar.innerHTML = `
    <div><span style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#f59e0b; color:#000; font-weight:900; font-size:0.8rem;">G</span> <strong style="font-size:1.1rem; color:#f59e0b; margin-left:4px;">${gCount}</strong> 金牌</div>
    <div><span style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#cbd5e1; color:#000; font-weight:900; font-size:0.8rem;">S</span> <strong style="font-size:1.1rem; color:#cbd5e1; margin-left:4px;">${sCount}</strong> 银牌</div>
    <div><span style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#d97706; color:#fff; font-weight:900; font-size:0.8rem;">B</span> <strong style="font-size:1.1rem; color:#d97706; margin-left:4px;">${bCount}</strong> 铜牌</div>
  `;

  if (medals.length === 0) {
    body.innerHTML = `
      <div style="text-align:center; padding:36px 10px; color:var(--text-dim);">
        <div style="font-size:2.4rem; margin-bottom:8px;">🏓</div>
        <div style="font-size:0.95rem; font-weight:bold; color:var(--text);">暂无三大赛或 WTT 顶级大赛奖牌</div>
        <div style="font-size:0.82rem; margin-top:4px;">在奥运会、世锦赛、世界杯、大满贯或冠军赛中打进前三名（冠亚季军），即可铭刻进生涯奖牌榜！</div>
      </div>`;
  } else {
    let html = '';
    MEDAL_EVENT_GROUPS.forEach(grp => {
      let list = medals.filter(m => m.groupKey === grp.key);
      if (list.length === 0) return;

      list.sort((a, b) => a.year - b.year || a.week - b.week);

      let rowsHtml = list.map(item => {
        let badge = item.medal === 'G' 
          ? `<span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f59e0b; color:#111; font-weight:900; font-size:0.75rem; box-shadow:0 0 8px rgba(245,158,11,0.5);">G</span>`
          : (item.medal === 'S'
            ? `<span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#cbd5e1; color:#111; font-weight:900; font-size:0.75rem;">S</span>`
            : `<span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#d97706; color:#fff; font-weight:900; font-size:0.75rem;">B</span>`);

        let discColor = item.discipline === "男子双打" ? "var(--accent-cyan)" : (item.discipline === "男子团体" ? "var(--accent-gold)" : "var(--text)");

        return `
          <div style="display:flex; align-items:center; padding:7px 10px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.88rem;">
            <div style="width:36px; text-align:center;">${badge}</div>
            <div style="flex:1; padding-left:10px; color:#93c5fd; font-weight:bold;">${item.year}年 ${item.city}</div>
            <div style="width:120px; text-align:right; color:${discColor}; font-weight:bold;">${item.discipline}</div>
          </div>
        `;
      }).join('');

      html += `
        <div style="background:var(--bg-card-alt); border:1px solid var(--border); border-radius:12px; overflow:hidden; flex-shrink: 0;">
          <div style="background:linear-gradient(180deg, #1a253e 0%, #111a30 100%); padding:8px 14px; text-align:center; font-weight:bold; color:var(--accent-gold); font-size:0.92rem; border-bottom:1px solid var(--border);">
            ${grp.icon} ${grp.title}
          </div>
          <div>${rowsHtml}</div>
        </div>
      `;
    });

    body.innerHTML = html;
  }

  modal.style.display = 'flex';
}

function closeCareerMedalsModal() {
  document.getElementById('career-medals-modal').style.display = 'none';
}

function openPlayerCareerMedalsModal(playerName) {
  if (!playerName) return;
  const medals = getPlayerMedalsList(playerName);
  const modal = document.getElementById('career-medals-modal');
  const summaryBar = document.getElementById('medals-summary-bar');
  const body = document.getElementById('career-medals-body');

  let gCount = medals.filter(m => m.medal === 'G').length;
  let sCount = medals.filter(m => m.medal === 'S').length;
  let bCount = medals.filter(m => m.medal === 'B').length;

  summaryBar.innerHTML = `
    <div><span style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#f59e0b; color:#000; font-weight:900; font-size:0.8rem;">G</span> <strong style="font-size:1.1rem; color:#f59e0b; margin-left:4px;">${gCount}</strong> 金牌</div>
    <div><span style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#cbd5e1; color:#000; font-weight:900; font-size:0.8rem;">S</span> <strong style="font-size:1.1rem; color:#cbd5e1; margin-left:4px;">${sCount}</strong> 银牌</div>
    <div><span style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#d97706; color:#fff; font-weight:900; font-size:0.8rem;">B</span> <strong style="font-size:1.1rem; color:#d97706; margin-left:4px;">${bCount}</strong> 铜牌</div>
  `;

  if (medals.length === 0) {
    body.innerHTML = `
      <div style="text-align:center; padding:36px 10px; color:var(--text-dim);">
        <div style="font-size:2.4rem; margin-bottom:8px;">🏓</div>
        <div style="font-size:0.95rem; font-weight:bold; color:var(--text);">【${playerName}】暂无三大赛或 WTT 顶级大赛奖牌记录</div>
      </div>`;
  } else {
    let html = '';
    MEDAL_EVENT_GROUPS.forEach(grp => {
      let list = medals.filter(m => m.groupKey === grp.key);
      if (list.length === 0) return;
      list.sort((a, b) => a.year - b.year || a.week - b.week);

      let rowsHtml = list.map(item => {
        let badge = item.medal === 'G' 
          ? `<span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f59e0b; color:#111; font-weight:900; font-size:0.75rem; box-shadow:0 0 8px rgba(245,158,11,0.5);">G</span>`
          : (item.medal === 'S'
            ? `<span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#cbd5e1; color:#111; font-weight:900; font-size:0.75rem;">S</span>`
            : `<span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#d97706; color:#fff; font-weight:900; font-size:0.75rem;">B</span>`);

        let discColor = item.discipline === "男子双打" ? "var(--accent-cyan)" : (item.discipline === "男子团体" ? "var(--accent-gold)" : "var(--text)");

        return `
          <div style="display:flex; align-items:center; padding:7px 10px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.88rem;">
            <div style="width:36px; text-align:center;">${badge}</div>
            <div style="flex:1; padding-left:10px; color:#93c5fd; font-weight:bold;">${item.year}年 ${item.city}</div>
            <div style="width:120px; text-align:right; color:${discColor}; font-weight:bold;">${item.discipline}</div>
          </div>
        `;
      }).join('');

      html += `
        <div style="background:var(--bg-card-alt); border:1px solid var(--border); border-radius:12px; overflow:hidden; flex-shrink: 0;">
          <div style="background:linear-gradient(180deg, #1a253e 0%, #111a30 100%); padding:8px 14px; text-align:center; font-weight:bold; color:var(--accent-gold); font-size:0.92rem; border-bottom:1px solid var(--border);">
            ${grp.icon} ${grp.title}
          </div>
          <div>${rowsHtml}</div>
        </div>
      `;
    });
    body.innerHTML = html;
  }
  modal.style.display = 'flex';
}

function recordCareerMedal(targetPlayer, type, year, week, eventName, eventType, discipline = "男子单打") {
  let pName = (typeof targetPlayer === 'string') 
    ? targetPlayer 
    : (targetPlayer?.name || gameState.player.name);

  if (!pName || pName === "—" || pName === "待定" || pName === "轮空") return;
  pName = pName.replace(/\s*\(铜牌\)/g, '').replace(/\s*\(你\)/g, '').replace(/\s*\[.*?\]/g, '').trim();

  let isUser = (pName === gameState.player.name);
  let pObj = gameState.worldRanking.find(x => x.name === pName) 
          || (gameState.retiredPlayers || []).find(x => x.name === pName);

  let groupKey = classifyMedalEvent(eventName, eventType);
  if (!groupKey) return;

  let city = extractEventCity(eventName, year);
  let medalType = (type === 'G' || type === 'S' || type === 'B') ? type : 'G';

  let medalObj = {
    medal: medalType,
    year: year,
    week: week,
    groupKey: groupKey,
    eventName: eventName,
    city: city,
    discipline: discipline
  };

  if (isUser) {
    if (!gameState.careerMedals) gameState.careerMedals = [];
    let exists = gameState.careerMedals.some(m => 
      m.year === year && m.week === week && m.groupKey === groupKey && m.discipline === discipline
    );
    if (!exists) gameState.careerMedals.push(medalObj);
  }

  if (pObj) {
    if (!pObj.careerMedals) pObj.careerMedals = [];
    let exists = pObj.careerMedals.some(m => 
      m.year === year && m.week === week && m.groupKey === groupKey && m.discipline === discipline
    );
    if (!exists) pObj.careerMedals.push(medalObj);
  }
}

function ensureCareerMedals() {
  if (!gameState.careerMedals) gameState.careerMedals = [];

  const addMedalToObj = (pName, type, year, week, evName, disc) => {
    if (!pName || pName === "—" || pName === "待定") return;
    let clean = pName.replace(/\s*\(铜牌\)/g, '').replace(/\s*\(你\)/g, '').replace(/\s*\[.*?\]/g, '').trim();
    if (!clean) return;
    recordCareerMedal(clean, type, year, week, evName, "", disc);
  };

  if (gameState.tournamentPodiums) {
    for (let key in gameState.tournamentPodiums) {
      let [y, w] = key.split('_').map(Number);
      let weekPod = gameState.tournamentPodiums[key];
      for (let evId in weekPod) {
        let pData = weekPod[evId];
        let evName = pData.eventName || "";
        if (!classifyMedalEvent(evName, "")) continue;

        let isTeam = evName.includes("团体") || evName.includes("Team");
        let isDoubles = evName.includes("双打") || evName.includes("Doubles");
        let disc = isTeam ? "男子团体" : (isDoubles ? "男子双打" : "男子单打");

        if (pData.champion) {
          pData.champion.split('/').forEach(name => addMedalToObj(name.trim(), 'G', y, w, evName, disc));
        }
        if (pData.runnerUp) {
          pData.runnerUp.split('/').forEach(name => addMedalToObj(name.trim(), 'S', y, w, evName, disc));
        }
        if (pData.thirds && Array.isArray(pData.thirds)) {
          pData.thirds.forEach(t => {
            t.split('、').forEach(subT => {
              subT.split('/').forEach(name => addMedalToObj(name.trim(), 'B', y, w, evName, disc));
            });
          });
        }
      }
    }
  }
}

function getPlayerMedalsList(playerName) {
  if (!playerName) return [];
  ensureCareerMedals();

  if (playerName === gameState.player.name) {
    return gameState.careerMedals || [];
  }

  let pObj = gameState.worldRanking.find(x => x.name === playerName) || 
             (gameState.retiredPlayers || []).find(x => x.name === playerName);
  
  if (pObj && pObj.careerMedals) {
    return pObj.careerMedals;
  }
  return [];
}

let currentRankHistoryPeriod = '10w';
let currentRankHistoryMode = 'singles';

function openRankHistoryModal() {
  currentRankHistoryMode = 'singles';
  if (!gameState.player.rankHistory || gameState.player.rankHistory.length === 0) {
    recordRankHistoryPoint();
  }
  document.getElementById('rank-history-modal').style.display = 'flex';
  renderRankHistoryChart(currentRankHistoryPeriod);
}

function openDoublesRankHistoryModal() {
  currentRankHistoryMode = 'doubles';
  if (!gameState.playerDoubles.rankHistory || gameState.playerDoubles.rankHistory.length === 0) {
    recordDoublesRankHistoryPoint();
  }
  document.getElementById('rank-history-modal').style.display = 'flex';
  renderRankHistoryChart(currentRankHistoryPeriod);
}

function renderRankHistoryChart(period) {
  currentRankHistoryPeriod = period;

  document.querySelectorAll('.rank-period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-period') === period);
  });

  const isDoubles = (currentRankHistoryMode === 'doubles');
  const titleEl = document.querySelector('#rank-history-modal h3');
  if (titleEl) {
    titleEl.innerHTML = isDoubles ? `👥 历史双打组合世界排名走势` : `📈 历史单打世界排名走势`;
  }

  const hist = isDoubles 
    ? (gameState.playerDoubles?.rankHistory || []).slice().sort((a, b) => a.abs - b.abs)
    : (gameState.player.rankHistory || []).slice().sort((a, b) => a.abs - b.abs);

  const container = document.getElementById('rank-history-chart-container');
  const summaryBox = document.getElementById('rank-history-summary');

  if (hist.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 10px; color:var(--text-dim);">
        <div style="font-size:2rem; margin-bottom:6px;">${isDoubles ? '👥' : '🏓'}</div>
        <div>${isDoubles ? '暂无双打历史排名数据，组建搭档并出战几周后再来查看走势吧～' : '暂无单打历史排名数据，推进几周后再来查看走势吧～'}</div>
      </div>`;
    summaryBox.innerHTML = '';
    return;
  }

  const currentAbs = hist[hist.length - 1].abs;
  const RANGE_WEEKS = { '10w': 10, '6m': 26, '5y': 260, 'career': Infinity };
  const rangeWeeks = RANGE_WEEKS[period] !== undefined ? RANGE_WEEKS[period] : 10;

  let filtered = period === 'career' ? hist : hist.filter(h => (currentAbs - h.abs) <= rangeWeeks);
  if (filtered.length === 0) filtered = hist.slice(-1);
  if (filtered.length === 1 && hist.length > 1) {
    filtered = hist.slice(Math.max(0, hist.length - 2));
  }

  const MAX_POINTS = 60;
  let displayPoints = filtered;
  if (filtered.length > MAX_POINTS) {
    displayPoints = [];
    const step = (filtered.length - 1) / (MAX_POINTS - 1);
    for (let i = 0; i < MAX_POINTS; i++) {
      displayPoints.push(filtered[Math.round(i * step)]);
    }
    displayPoints = displayPoints.filter((pt, idx) => idx === 0 || pt.abs !== displayPoints[idx - 1].abs);
  }

  const curRank = hist[hist.length - 1].rank;
  const bestRankEver = Math.min(...hist.map(h => h.rank));
  const rangeStartRank = filtered[0].rank;
  const rangeChange = rangeStartRank - curRank;
  let changeHtml;
  if (rangeChange > 0) {
    changeHtml = `<span class="rank-up">▲ 上升 ${rangeChange} 位</span>`;
  } else if (rangeChange < 0) {
    changeHtml = `<span class="rank-down">▼ 下降 ${Math.abs(rangeChange)} 位</span>`;
  } else {
    changeHtml = `<span class="rank-same">- 持平</span>`;
  }

  summaryBox.innerHTML = `
    <div>当前${isDoubles ? '双打' : ''}排名: <strong style="color:var(--accent-gold);">第 ${curRank} 位</strong></div>
    <div>历史最佳: <strong style="color:var(--accent-cyan);">第 ${bestRankEver} 位</strong></div>
    <div>本区间变化: ${changeHtml}</div>
  `;

  container.innerHTML = buildRankHistorySVG(displayPoints, isDoubles);
}

function buildRankHistorySVG(points, isDoubles = false) {
  const width = 660, height = 260;
  const pad = { left: 46, right: 20, top: 20, bottom: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  let ranks = points.map(pt => pt.rank);
  let minRank = Math.min(...ranks);
  let maxRank = Math.max(...ranks);
  if (minRank === maxRank) { minRank = Math.max(1, minRank - 3); maxRank = maxRank + 3; }
  let rangePad = Math.max(1, Math.round((maxRank - minRank) * 0.1));
  minRank = Math.max(1, minRank - rangePad);
  maxRank = maxRank + rangePad;

  const xFor = (i) => points.length === 1 ? pad.left + plotW / 2 : pad.left + (i / (points.length - 1)) * plotW;
  const yFor = (rank) => pad.top + ((rank - minRank) / (maxRank - minRank)) * plotH;

  let gridLines = '', yLabels = '';
  const TICKS = 5;
  for (let t = 0; t <= TICKS; t++) {
    let rankVal = Math.round(minRank + (t / TICKS) * (maxRank - minRank));
    let y = pad.top + (t / TICKS) * plotH;
    gridLines += `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    yLabels += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--text-dim)">#${rankVal}</text>`;
  }

  let pathD = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(pt.rank).toFixed(1)}`).join(' ');

  let xLabelIdxs = points.length === 1 ? [0] : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  let xLabels = [...new Set(xLabelIdxs)].map(i => {
    let pt = points[i];
    return `<text x="${xFor(i).toFixed(1)}" y="${height - pad.bottom + 20}" text-anchor="middle" font-size="11" fill="var(--text-dim)">${pt.year}年W${pt.week}</text>`;
  }).join('');

  const strokeColor = isDoubles ? 'var(--accent-gold)' : 'var(--accent-cyan)';
  const dotColor = isDoubles ? '#ffb703' : 'var(--accent-gold)';

  let dots = points.map((pt, i) => {
    let x = xFor(i).toFixed(1), y = yFor(pt.rank).toFixed(1);
    let label = `${pt.year}年 第${pt.week}周 · ${isDoubles ? '双打' : '单打'}`;
    return `<circle class="rank-history-dot" cx="${x}" cy="${y}" r="3.5" fill="${dotColor}" stroke="#0a0e18" stroke-width="1.5"
      onmouseenter="showRankTooltip(event, ${pt.rank}, '${label}')" onmousemove="showRankTooltip(event, ${pt.rank}, '${label}')" onmouseleave="hideRankTooltip()"></circle>`;
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; min-width:480px; display:block;">
      ${gridLines}
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      ${yLabels}
      ${xLabels}
      <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
    </svg>
  `;
}

function closeRankHistoryModal() {
  document.getElementById('rank-history-modal').style.display = 'none';
  hideRankTooltip();
}

function openTrophyDetailModal(catKey) {
  ensureTrophyRecords();
  const meta = TROPHY_CAT_META[catKey] || { name: "冠军荣誉", icon: "🏆", badge: "badge-gold" };
  const modal = document.getElementById('trophy-detail-modal');
  const title = document.getElementById('trophy-modal-title');
  const body = document.getElementById('trophy-modal-body');

  title.innerHTML = `${meta.icon} ${meta.name} 夺冠历程`;

  const list = gameState.trophyRecords.filter(t => t.categoryKey === catKey);

  if (list.length === 0) {
    body.innerHTML = `
      <div style="text-align:center; padding:36px 10px; color:var(--text-dim);">
        <div style="font-size:2.4rem; margin-bottom:8px;">🏛️</div>
        <div style="font-size:0.95rem; font-weight:bold; color:var(--text);">尚未斩获该级别冠军头衔</div>
        <div style="font-size:0.8rem; margin-top:4px;">继续征战 WTT / ITTF 巡回赛，向最高荣誉发起冲击！</div>
      </div>`;
  } else {
    body.innerHTML = list.map((item, idx) => `
      <div style="background:var(--bg-card-alt); border:1px solid var(--border); border-left:4px solid var(--accent-gold); border-radius:12px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <div>
          <div style="font-size:0.75rem; color:var(--accent-gold); font-weight:bold; margin-bottom:3px; font-family:var(--font-display);">
            📅 ${item.year}赛季 · 第 ${item.week} 周
          </div>
          <div style="font-size:0.98rem; font-weight:700; color:#fff;">
            ${item.eventName}
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <span class="badge ${meta.badge}">🏆 冠军</span>
          ${item.points > 0 ? `<div style="font-size:0.75rem; color:var(--accent-blue); margin-top:4px; font-weight:bold;">+${item.points}分 ${item.prize > 0 ? `| $${item.prize.toLocaleString()}` : ''}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  modal.style.display = 'flex';
}

function closeTrophyDetailModal() {
  document.getElementById('trophy-detail-modal').style.display = 'none';
}