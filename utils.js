// 为 AI 依据综合能力和打法生成 12 维数据
function generateAI12Stats(basePow, style = "") {
  const keys = ['fhPower', 'bhSpeed', 'spin', 'touch', 'rally', 'serve', 'receive', 'speed', 'footwork', 'endurance', 'mental', 'tactics'];
  let matchedBias = STYLE_STAT_BIAS.default;
  for (let s in STYLE_STAT_BIAS) {
    if (style && style.includes(s)) {
      matchedBias = STYLE_STAT_BIAS[s];
      break;
    }
  }

  let stats = {};
  keys.forEach(k => {
    let bias = matchedBias[k] || 1.0;
    let jitter = (Math.random() - 0.5) * 6; // 随机轻微浮动 ±3
    let val = basePow * bias + jitter;
    stats[k] = Math.max(15, Math.min(99, Math.round(val)));
  });
  return stats;
}

function generateUniqueRookieName(country, extraExcluded = new Set()) {
  // 汇总所有不可重复的名字库（现役世界排名 + 已退役球员 + 玩家自己）
  const activeNames = new Set([
    ...gameState.worldRanking.map(p => p.name),
    ...(gameState.retiredPlayers || []).map(p => p.name),
    gameState.player.name,
    ...extraExcluded
  ]);

  let cStr = country || "中国 (CHN)";
  // 从 "国家 (CODE)" 中提取国家代码，再查表得到对应姓名库分组
  let codeMatch = cStr.match(/\(([A-Z]+)\)/);
  let rawCode = codeMatch ? codeMatch[1] : "";
  let bucket = COUNTRY_NAME_BUCKET_MAP[rawCode] || { kind: "pool", key: "WESTERN" };

  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    let candidate = "";

    if (bucket.kind === "special" && bucket.key === "CHN") {
      let s = NAME_PARTS_DATABASE.CHN.surnames[Math.floor(Math.random() * NAME_PARTS_DATABASE.CHN.surnames.length)];
      let c1 = NAME_PARTS_DATABASE.CHN.givenChars[Math.floor(Math.random() * NAME_PARTS_DATABASE.CHN.givenChars.length)];
      let c2 = NAME_PARTS_DATABASE.CHN.givenChars[Math.floor(Math.random() * NAME_PARTS_DATABASE.CHN.givenChars.length)];
      candidate = (c1 === c2) ? `${s}${c1}` : `${s}${c1}${c2}`;
    } else if (bucket.kind === "special") {
      // JPN / KOR / TPE_HKG / MAS：姓 + 名 直接拼接
      let db = NAME_PARTS_DATABASE[bucket.key];
      let s = db.surnames[Math.floor(Math.random() * db.surnames.length)];
      let g = db.givens[Math.floor(Math.random() * db.givens.length)];
      candidate = `${s}${g}`;
    } else {
      // 其余所有国家：按地域分组的"名·姓"式生成（不再统一落入笼统的 WESTERN 池）
      // 姓氏改为从该地区所有姓氏中拆出的单字字符池里随机挑 2~4 个字自由重组
      // 例如 "莫雷加德" -> 莫/雷/加/德，"勒布伦" -> 勒/布/伦，可重新拼出"莫布伦""勒雷德"等全新姓氏，
      // 组合空间远大于直接从固定姓氏列表中整词挑选，能大幅降低重名概率
      let db = NAME_PARTS_DATABASE[bucket.key] || NAME_PARTS_DATABASE.WESTERN;
      let f = db.firstNames[Math.floor(Math.random() * db.firstNames.length)];
      if (!db.lastNameChars) {
        db.lastNameChars = Array.from(new Set(db.lastNames.join("").split("")));
      }
      let charPool = db.lastNameChars;
      let lenChoices = [2, 3, 3, 4]; // 姓氏长度以 2~4 字为主，3 字权重略高，贴近真实译名习惯
      let numChars = lenChoices[Math.floor(Math.random() * lenChoices.length)];
      let l = "";
      for (let i = 0; i < numChars; i++) {
        l += charPool[Math.floor(Math.random() * charPool.length)];
      }
      candidate = `${f}·${l}`;
    }

    // 唯一性校验：确保未曾存在过
    if (!activeNames.has(candidate)) {
      return candidate;
    }
  }

  // 极端兜底
  return `${cStr.split(' ')[0]}新秀${Math.floor(Math.random() * 900 + 100)}`;
}

// 500 位球员排名的主生成算法
function generateTop300() {
  let list = JSON.parse(JSON.stringify(BASE_REAL_STARS_CN));
  let usedNames = new Set(list.map(x => x.name));

  // 1. 前 50 名真实名将：保留其初始积分，并将其分散生成在过去 52 周的历史记录中
  list.forEach(p => {
    let initialPts = p.points || 0;
    p.stats = generateAI12Stats(p.basePow, p.style);
    p.recentMatches = [];
    p.careerWins = 0;
    p.careerLosses = 0;
    p.pointsHistory = [];

    if (initialPts > 0) {
      // 模拟过去 52 周内获得的 8 站有效赛事积分分布（每 4~6 周分布一站积分）
      let remaining = initialPts;
      let count = 8;
      for (let i = 0; i < count; i++) {
        // 分布在过去 1 ~ 50 周之间（当前为 2026 年第 1 周，对应 2025 年各周）
        let pastWeek = Math.min(52, Math.max(1, 52 - (i * 6 + Math.floor(Math.random() * 3))));
        let pastYear = gameState.player.year - 1;
        
        let portion = (i === count - 1) 
          ? remaining 
          : Math.floor((remaining / (count - i)) * (0.8 + Math.random() * 0.4));
        
        if (portion > 0) {
          p.pointsHistory.push({ amt: portion, w: pastWeek, y: pastYear });
          remaining -= portion;
        }
      }
    }
    // 重新校准确保总分与设定一致
    recomputePlayerPoints(p);
  });

  // 2. 合并扩展球员：按梯队阶梯赋予合理初始积分（模拟过去 12 个月积累）
  let combinedPool = [...REAL_PLAYERS_EXTENDED_DATABASE, ...GLOBAL_LEGENDS_AND_PROS_SUPPLEMENT];
  let extIdx = 0;

  while (list.length < 499 && extIdx < combinedPool.length) {
    let cand = combinedPool[extIdx++];
    if (usedNames.has(cand.name)) continue;
    usedNames.add(cand.name);

    // 50~500 名选手的积分根据排位自然衰减（从 ~600 分平滑递减至 ~30 分）
    let rankPos = list.length + 1;
    let basePts = Math.max(20, Math.floor(650 * Math.pow(0.993, rankPos - 50) + (Math.random() * 30 - 15)));

    let pObj = {
      name: cand.name,
      country: cand.country,
      points: basePts,
      age: cand.age || (16 + Math.floor(Math.random() * 7)),
      style: cand.style || "横板全面进攻型",
      basePow: cand.basePow || Math.floor(50 + Math.random() * 25),
      injury: "健康",
      prevRank: rankPos,
      recentMatches: [],
      careerWins: 0,
      careerLosses: 0,
      pointsHistory: []
    };
    pObj.stats = generateAI12Stats(pObj.basePow, pObj.style); // 👈 补充这行

    // 分配过去 12 个月的历史积分记录
    let pastWeek = Math.floor(1 + Math.random() * 45);
    pObj.pointsHistory.push({ amt: basePts, w: pastWeek, y: gameState.player.year - 1 });
    recomputePlayerPoints(pObj);

    // 注意：此前这里曾误将同一位选手 push 两次，导致排行榜出现完全相同姓名的重复行，现已修正为只 push 一次
    list.push(pObj);
  }

  // 3. 兜底补足
  let seedIdx = 1;
  while (list.length < 499) {
    let c = COUNTRIES_GLOBAL[seedIdx % COUNTRIES_GLOBAL.length];
    // 修改后:
    let fallbackName = generateUniqueRookieName(c, usedNames);
    seedIdx++;
    if (usedNames.has(fallbackName)) continue;
    usedNames.add(fallbackName);

    let rankPos = list.length + 1;
    let basePts = Math.max(10, Math.floor(100 - rankPos * 0.15));

    // 找到兜底生成 pObj 的地方：
    let pObj = {
      name: fallbackName,
      country: c,
      points: basePts,
      age: 16 + (seedIdx % 7),
      style: "两面反胶快攻",
      basePow: 45,
      injury: "健康",
      debutYear: gameState.player.year, //
      avatar: getRandomAvatarByCountry(c), // 👈 新增这一行
      prevRank: rankPos,
      recentMatches: [],
      careerWins: 0,
      careerLosses: 0,
      pointsHistory: [{ amt: basePts, w: Math.floor(1 + Math.random() * 40), y: gameState.player.year - 1 }]
    };
    recomputePlayerPoints(pObj);
    list.push(pObj);
  }

  // 4. 玩家新秀加入：初始积分为 0（无过去 12 个月积分记录）
  list.push({
    name: gameState.player.name,
    country: gameState.player.country,
    points: 0,
    age: gameState.player.age,
    style: gameState.player.style,
    isUser: true,
    basePow: 55,
    injury: "健康",
    prevRank: list.length + 1,
    recentMatches: [],
    careerWins: 0,
    careerLosses: 0,
    pointsHistory: []
  });

  // 按积分降序排序并设定初始排名
  list.sort((a, b) => (b.points - a.points) || ((b.basePow || 0) - (a.basePow || 0)));
  list.forEach((p, idx) => {
    p.prevRank = idx + 1;
  });

  gameState.worldRanking = list;
  generateInitial100DoublesPairs();
}

// 根据国家文本动态获取随机头像路径
function getRandomAvatarByCountry(countryStr) {
  if (!countryStr) return null;
  let match = countryStr.match(/\(([A-Z]+)\)/);
  let code = match ? match[1] : countryStr.trim().toUpperCase();
  
  let conf = AVATAR_CONFIG[code];
  if (conf && conf.count > 0) {
    let randIndex = Math.floor(Math.random() * conf.count) + 1;
    return `./profilePIC/${conf.prefix}${randIndex}.jpg`;
  }
  return null;
}

// 根据国家文本（例如 "中国 (CHN)"、"日本 (JPN)" 或 "CHN"）生成国旗 <img> 标签
function getFlagImgHtml(countryStr, isLarge = false) {
  if (!countryStr) return '';
  
  // 提取括号里的三字码，如 "中国 (CHN)" -> "CHN"
  let match = countryStr.match(/\(([A-Z]+)\)/);
  let code3 = match ? match[1] : countryStr.trim().toUpperCase();
  
  // 转换为两位字母小写（如 "cn"）
  let iso2 = (IOC_TO_ISO2[code3] || code3.substring(0, 2)).toLowerCase();
  let cls = isLarge ? "flag-icon-lg" : "flag-icon";
  
  // 加载 flag 文件夹下的 svg，并自带错误兜底（若找不到文件自动隐藏）
  return `<img class="${cls}" src="./flag/${iso2}.svg" alt="${code3}" onerror="this.style.display='none'">`;
}

// 获取选手头像 HTML（若有专属头像则加载图片，否则显示默认 emoji）
function getPlayerAvatarHtml(player, size = 70) {
  if (!player) return '👤';
  if (player.avatar) {
    return `<img src="${player.avatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;" onerror="this.outerHTML='👤'">`;
  }
  return player.isUser ? '🏓' : '👤';
}

// 支持单个国家或跨国组合（含斜杠）同时显示对应国旗
function formatCountryWithFlags(countryStr) {
  if (!countryStr) return '';
  if (countryStr.includes('/')) {
    return countryStr.split('/').map(c => {
      let trimmed = c.trim();
      return `${getFlagImgHtml(trimmed)}${trimmed}`;
    }).join(' <span style="color:var(--text-dim); margin:0 3px;">/</span> ');
  }
  return `${getFlagImgHtml(countryStr)}${countryStr}`;
}

/* ==================== 选手姓名携带世界排名小标签格式化 ==================== */
function formatPlayerWithRank(nameStr) {
  if (!nameStr || nameStr === "—" || nameStr === "待定" || nameStr === "轮空" || nameStr === "轮空选手") return nameStr;

  // 包含多个选手时（如四强/季军列表）逐一递归解析
  if (nameStr.includes('、')) {
    return nameStr.split('、').map(n => formatPlayerWithRank(n.trim())).join('、');
  }

  // 清洗后缀标签
  let cleanName = nameStr.replace(/\s*\(铜牌\)/g, '').replace(/\s*\(你\)/g, '').replace(/\s*\[.*?\]/g, '').trim();
  let suffix = "";
  if (nameStr.includes('(铜牌)')) suffix = ' <span style="font-size:0.72rem; color:var(--text-dim);">(铜牌)</span>';
  if (nameStr.includes('(你)')) suffix = ' <span style="font-size:0.72rem; color:var(--accent-gold);">(你)</span>';

  let idx = gameState.worldRanking.findIndex(x => x.name === cleanName);
  if (idx >= 0) {
    let rank = idx + 1;
    return `${cleanName} <span style="font-size:0.75rem; color:var(--accent-gold); font-weight:700; font-family:var(--font-display);">#${rank}</span>${suffix}`;
  } else {
    let ret = (gameState.retiredPlayers || []).find(x => x.name === cleanName);
    if (ret) {
      return `${cleanName} <span style="font-size:0.75rem; color:var(--text-dim); font-weight:normal;">#Ret</span>${suffix}`;
    }
  }
  return nameStr;
}

function showAlert(msg, title = "赛事通知", icon = "🏓", callback = null) {
  const modal = document.getElementById('custom-alert-modal');
  document.getElementById('custom-alert-title').innerText = title;
  document.getElementById('custom-alert-msg').innerHTML = msg;
  document.getElementById('custom-alert-icon').innerText = icon;
  alertCallback = callback;
  modal.style.display = 'flex';
}

function closeCustomAlert() {
  document.getElementById('custom-alert-modal').style.display = 'none';
  if (typeof alertCallback === 'function') {
    alertCallback();
  }
  alertCallback = null;
}

function showCustomConfirm(options) {
  const modal = document.getElementById('custom-confirm-modal');
  document.getElementById('confirm-modal-icon').innerText = options.icon || '⚠️';
  document.getElementById('confirm-modal-title').innerText = options.title || '操作确认';
  document.getElementById('confirm-modal-msg').innerHTML = options.msg || '确定要继续吗？';
  
  const okBtn = document.getElementById('confirm-modal-ok-btn');
  okBtn.innerText = options.okText || '确认';
  okBtn.style.background = options.okColor || 'var(--accent)';

  confirmCallback = options.onConfirm;
  modal.style.display = 'flex';
}

function closeCustomConfirm(isConfirmed) {
  document.getElementById('custom-confirm-modal').style.display = 'none';
  if (isConfirmed && typeof confirmCallback === 'function') {
    confirmCallback();
  }
  confirmCallback = null;
}

/* ==================== 右下角夺冠提示弹窗 (Champion Toast) ==================== */
/* ==================== 右下角夺冠提示弹窗 (Champion Toast) ==================== */
function showChampionToast(championName, eventName, isUser = false, discipline = "单打", country = "") {
  const container = document.getElementById('champion-toast-container');
  if (!container) return;

  const isTeam = discipline === "团体" || eventName.includes("团体") || (country && country.length > 0);
  const isDoubles = discipline === "双打" || eventName.includes("双打");
  
  let titleText = "";
  let discBadge = "";
  let icon = "🏆";

  if (isTeam) {
    icon = "🥇";
    titleText = isUser ? '🎉 我国代表队斩获团体金牌！' : '🏆 团体赛冠军代表队诞生';
    discBadge = `<span class="badge badge-gold" style="font-size:0.72rem; margin-right:4px;">男子团体</span>`;
  } else if (isDoubles) {
    icon = "👥";
    titleText = isUser ? '🎉 你与搭档夺得双打冠军！' : '🏆 本站双打冠军组合诞生';
    discBadge = `<span class="badge badge-star" style="font-size:0.72rem; margin-right:4px;">男子双打</span>`;
  } else {
    icon = "🏓";
    titleText = isUser ? '🎉 你斩获了单打冠军！' : '🏆 本站单打冠军诞生';
    discBadge = `<span class="badge badge-gold" style="font-size:0.72rem; margin-right:4px;">男子单打</span>`;
  }

  const toast = document.createElement('div');
  toast.className = 'champion-toast';
  toast.innerHTML = `
    <div class="ct-icon">${icon}</div>
    <div class="ct-body">
      <div class="ct-title">${titleText}</div>
      <div class="ct-name" style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
        ${discBadge}<strong>${championName}</strong>
      </div>
      <div class="ct-event" style="color:var(--text-dim); font-size:0.78rem; margin-top:2px;">${eventName}</div>
    </div>
    <button class="ct-close" onclick="dismissChampionToast(this.parentElement)">✕</button>
  `;
  container.appendChild(toast);

  // 触发进入动画
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

  // 自动关闭
  const autoTimer = setTimeout(() => dismissChampionToast(toast), 6000);
  toast._autoTimer = autoTimer;
}

function dismissChampionToast(toast) {
  if (!toast || !toast.parentElement) return;
  if (toast._autoTimer) clearTimeout(toast._autoTimer);
  toast.classList.remove('show');
  toast.classList.add('hide');
  setTimeout(() => toast.remove(), 350);
}

/* ==================== 周次推进提示 Toast（复用冠军 Toast 容器与样式） ==================== */
function showWeekAdvanceToast(weekNum, yearNum) {
  const container = document.getElementById('champion-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'champion-toast';
  toast.style.borderColor = 'var(--accent-cyan)';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 18px rgba(30,144,255,0.25)';
  toast.innerHTML = `
    <div class="ct-icon">📅</div>
    <div class="ct-body">
      <div class="ct-title" style="color:var(--accent-cyan);">周次已推进</div>
      <div class="ct-name">${yearNum} 赛季 · 第 ${weekNum} 周</div>
      <div class="ct-event">本周训练与赛事已结算完毕</div>
    </div>
    <button class="ct-close" onclick="dismissChampionToast(this.parentElement)">✕</button>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  const autoTimer = setTimeout(() => dismissChampionToast(toast), 4500);
  toast._autoTimer = autoTimer;
}