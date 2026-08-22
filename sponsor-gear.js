// 1. 初始化玩家身上的赞助状态（支持：1 个器材赞助 + 无限个商业代言列表）
function ensurePlayerSponsors() {
  const p = gameState.player;
  if (!p.sponsors) {
    p.sponsors = {
      gear: p.sponsor ? { ...p.sponsor, weeksLeft: 52 } : null,
      commercials: [] // 改为数组，支持无限个商业代言
    };
  }

  // 兼容老存档：如果之前存的是单个 commercial 对象，自动迁移转入数组
  if (!Array.isArray(p.sponsors.commercials)) {
    if (p.sponsors.commercial && typeof p.sponsors.commercial === 'object') {
      p.sponsors.commercials = [p.sponsors.commercial];
    } else {
      p.sponsors.commercials = [];
    }
    delete p.sponsors.commercial;
  }
}

// 2. 切换赞助分类标签
function switchSponsorCategory(cat, btn) {
  currentSponsorCategory = cat;
  document.getElementById('btn-sp-tab-gear')?.classList.toggle('active-gear-type', cat === 'gear');
  document.getElementById('btn-sp-tab-comm')?.classList.toggle('active-gear-type', cat === 'commercial');
  renderSponsorsCompact(gameState.worldRanking.findIndex(x => x.isUser) + 1);
}

// 3. 渲染赞助商列表（支持多商业代言、冷却倒计时与独立状态）
function renderSponsorsCompact(currentRank) {
  ensurePlayerSponsors();
  const container = document.getElementById('sponsors-container');
  if (!container) return;

  const list = (typeof SPONSORS_DATABASE !== 'undefined' ? SPONSORS_DATABASE[currentSponsorCategory] : []) || [];
  const p = gameState.player;
  if (!p.sponsorCooldowns) p.sponsorCooldowns = {};

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; color: var(--text-dim); font-size: 0.85rem; padding: 10px;">暂无该类型赞助商</div>`;
    return;
  }

  container.innerHTML = list.map(s => {
    // 1. 检查是否已签约
    let activeContract = null;
    if (s.type === 'gear') {
      activeContract = (p.sponsors.gear && p.sponsors.gear.id === s.id) ? p.sponsors.gear : null;
    } else {
      activeContract = (p.sponsors.commercials || []).find(c => c.id === s.id) || null;
    }

    const isSigned = Boolean(activeContract);
    const canNegotiate = currentRank <= s.rankReq;

    // 2. 检查是否处于谈判冷却期
    let isCooling = false;
    let coolWeeksLeft = 0;
    const coolData = p.sponsorCooldowns[s.id];
    if (coolData) {
      const curAbs = (typeof absWeekIndex === 'function') ? absWeekIndex(p.week, p.year) : (p.year * 52 + p.week);
      const coolAbs = (typeof absWeekIndex === 'function') ? absWeekIndex(coolData.week, coolData.year) : (coolData.year * 52 + coolData.week);
      if (curAbs < coolAbs) {
        isCooling = true;
        coolWeeksLeft = coolAbs - curAbs;
      }
    }

    // 3. 按钮状态构造
    let statusHtml = '';
    if (isSigned) {
      statusHtml = `
        <div style="text-align:right;">
          <span class="badge badge-gold" style="font-size:0.68rem;">已签约 ($${activeContract.weeklyPay}/周)</span>
          <div style="font-size:0.68rem; color:var(--accent-cyan); margin-top:2px;">余 ${activeContract.weeksLeft} 周</div>
        </div>
      `;
    } else if (isCooling) {
      statusHtml = `
        <button class="btn-action" style="padding:4px 10px; font-size:0.72rem; color:var(--text-dim); opacity:0.65; cursor:not-allowed;" title="谈判冷却中，还剩 ${coolWeeksLeft} 周" onclick="openNegotiateModal('${s.id}', '${s.type}')">
          ⏳ ${coolWeeksLeft}周后
        </button>
      `;
    } else if (canNegotiate) {
      statusHtml = `<button class="btn-gold" style="padding:4px 10px; font-size:0.72rem;" onclick="openNegotiateModal('${s.id}', '${s.type}')">谈判签约</button>`;
    } else {
      statusHtml = `<span style="font-size:0.7rem; color:var(--text-dim);">#${s.rankReq} 入围</span>`;
    }

    return `
      <div class="sponsor-card-mini ${isSigned ? 'signed' : ''}">
        <div style="min-width:0; flex:1;">
          <div class="sponsor-mini-title">${s.name}</div>
          <div class="sponsor-mini-desc">
            周薪: <strong style="color:var(--accent-cyan);">$${s.minPay} ~ $${s.maxPay}</strong>
          </div>
        </div>
        <div style="flex-shrink:0;">${statusHtml}</div>
      </div>
    `;
  }).join('');
}

// 4. 打开谈判弹窗
// 4. 打开谈判弹窗
function openNegotiateModal(sponsorId, type) {
  const s = (SPONSORS_DATABASE[type] || []).find(x => x.id === sponsorId);
  if (!s) return;

  const p = gameState.player; // 👈 移动到此处优先声明

  // 检查粉丝门槛
  const pFans = p.fans || 0;
  if (s.fanReq && pFans < s.fanReq) {
    showAlert(`🔒 人气门槛不足！【${s.name}】要求选手全网粉丝达到 <strong>${formatFanCount(s.fanReq)}</strong>（当前: ${formatFanCount(pFans)}），请继续在赛场打出亮眼战绩积累人气！`, "商业代言门槛", "💼");
    return;
  }
  
  if (!p.sponsorCooldowns) p.sponsorCooldowns = {};
  
  const coolData = p.sponsorCooldowns[sponsorId];
  if (coolData) {
    const currentAbsWeek = p.year * 52 + p.week;
    const coolAbsWeek = coolData.year * 52 + coolData.week;
    if (currentAbsWeek < coolAbsWeek) {
      const weeksLeft = coolAbsWeek - currentAbsWeek;
      showAlert(`⏳ 谈判冷却中：由于上一次谈判破裂，该品牌对你持观望态度。请在约 <strong>${weeksLeft} 周</strong>后再来尝试谈判！`, "冷却保护", "📑");
      return;
    }
  }

  currentNegotiatingSponsor = s;
  selectedContractTerm = 26; // 默认半年

  document.getElementById('neg-title').innerHTML = `🤝 签约谈判 · ${s.name}`;
  document.getElementById('neg-brand-desc').innerHTML = `
    <strong>品牌类型：</strong>${s.type === 'gear' ? '🏓 专业器材主赞助商 (只能同时签约 1 家)' : '💼 商业广告代言 (可同时签署多家)'}<br>
    <strong>品牌简介：</strong>${s.desc}
  `;

  renderNegotiateOptions();
  document.getElementById('sponsor-negotiate-modal').style.display = 'flex';
}

function closeNegotiateModal() {
  document.getElementById('sponsor-negotiate-modal').style.display = 'none';
  currentNegotiatingSponsor = null;
}

// 5. 动态计算谈判成功率与周薪
function getNegotiateScheme(s, weeks) {
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  let rankBonusPct = Math.max(0, (s.rankReq - currentRank) / s.rankReq); // 排名超出越多，溢价与成功率越高

  // 周薪计算：长约溢价
  let basePay = s.minPay + (s.maxPay - s.minPay) * Math.min(1.0, rankBonusPct * 1.2);
  let termMultiplier = weeks === 26 ? 1.0 : (weeks === 52 ? 1.15 : 1.35);
  let offerPay = Math.round(basePay * termMultiplier);

  // 成功率公式：基础75% + 排名表现加成 - 期限跨度难度
  let winRate = gameState.stats.totalMatches > 0 ? (gameState.stats.wins / gameState.stats.totalMatches) : 0.5;
  let termPenalty = weeks === 26 ? 0 : (weeks === 52 ? 12 : 25);
  let successChance = Math.round(75 + rankBonusPct * 20 + (winRate - 0.5) * 20 - termPenalty);
  successChance = Math.max(15, Math.min(95, successChance));

  return { offerPay, successChance };
}

function selectTermOption(weeks) {
  selectedContractTerm = weeks;
  renderNegotiateOptions();
}

// 5. 提示信息渲染（明确提示商业代言可无限并存）
function renderNegotiateOptions() {
  const s = currentNegotiatingSponsor;
  const terms = [
    { weeks: 26, label: '短期合作 (半年 / 26周)', desc: '周期短，品牌顾虑少，极易达成' },
    { weeks: 52, label: '常规合同 (1年 / 52周)', desc: '周薪 +15% 溢价，品牌要求适中' },
    { weeks: 156, label: '长期代言 (3年 / 156周)', desc: '周薪 +35% 超高溢价，谈判难度较高' }
  ];

  const box = document.getElementById('neg-options-container');
  box.innerHTML = terms.map(t => {
    const { offerPay, successChance } = getNegotiateScheme(s, t.weeks);
    const isSelected = selectedContractTerm === t.weeks;
    return `
      <div onclick="selectTermOption(${t.weeks})" style="cursor:pointer; padding:10px 14px; border-radius:10px; border:1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border)'}; background:${isSelected ? 'rgba(255,183,3,0.12)' : 'rgba(255,255,255,0.03)'}; display:flex; justify-content:space-between; align-items:center; transition:all 0.15s;">
        <div>
          <div style="font-weight:700; color:#fff; font-size:0.88rem;">${t.label}</div>
          <div style="font-size:0.72rem; color:var(--text-dim); margin-top:2px;">${t.desc}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:var(--accent-cyan); font-weight:800; font-family:var(--font-display); font-size:1.05rem;">$${offerPay}/周</div>
          <div style="font-size:0.72rem; color:${successChance >= 60 ? '#4ade80' : '#f87171'}; font-weight:bold;">预估成功率: ${successChance}%</div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('neg-eval-box').innerHTML = `
    📊 <strong>商务评估提示：</strong>当前世界排名为 #${gameState.worldRanking.findIndex(x => x.isUser) + 1}。<br>${s.type === 'gear' ? '⚠️ 器材赞助具有排他性，签约后将替换现有器材合约，且<strong>只能装备【' + s.brandKeyword + '】品牌的专业器材</strong>。' : '✨ <strong>商业代言可无限叠加！</strong>签约后不影响器材使用与现有代言，每周准时发放该品牌商业酬劳。'}
  `;
}

// 6. 提交谈判结果（商业代言 append 到数组，器材赞助独占单项）
function submitNegotiation() {
  const s = currentNegotiatingSponsor;
  if (!s) return;
  const p = gameState.player;
  ensurePlayerSponsors();
  const { offerPay, successChance } = getNegotiateScheme(s, selectedContractTerm);

  const isSuccess = (Math.random() * 100) < successChance;
  closeNegotiateModal();

  if (isSuccess) {
    const contractObj = {
      id: s.id,
      name: s.name,
      type: s.type,
      brandKeyword: s.brandKeyword || '',
      weeklyPay: offerPay,
      weeksLeft: selectedContractTerm
    };

    // 清空该商家的谈判冷却
    if (p.sponsorCooldowns && p.sponsorCooldowns[s.id]) {
      delete p.sponsorCooldowns[s.id];
    }

    let resetSlots = [];

    // ====== 区分器材赞助与商业代言写入 ======
    if (s.type === 'gear') {
      p.sponsors.gear = contractObj;

      // 器材专属合规检查
      if (s.brandKeyword) {
        const defaultGearMap = { blade: 'b1', fh: 'f1', bh: 'bh1', shoes: 's1' };
        const slotNames = { blade: '底板', fh: '正手胶皮', bh: '反手胶皮', shoes: '球鞋' };

        for (let slot of ['blade', 'fh', 'bh', 'shoes']) {
          const equippedId = p.gear[slot];
          const item = (GEAR_DATABASE[slot] || []).find(x => x.id === equippedId);
          if (item && item.tier > 1) {
            const itemBrand = extractGearBrand(item);
            if (!itemBrand.includes(s.brandKeyword)) {
              p.gear[slot] = defaultGearMap[slot];
              resetSlots.push(slotNames[slot]);
            }
          }
        }
      }
    } else {
      // 商业代言：追加或续签更新
      const existIdx = p.sponsors.commercials.findIndex(c => c.id === s.id);
      if (existIdx >= 0) {
        p.sponsors.commercials[existIdx] = contractObj;
      } else {
        p.sponsors.commercials.push(contractObj);
      }
    }

    let alertMsg = `🎉 谈判成功！【${s.name}】已与你正式签署为期 ${selectedContractTerm} 周的代言合约，每周将获得 $${offerPay} 代言费！`;
    
    if (resetSlots.length > 0) {
      alertMsg += `<br><br>⚠️ <strong>装备合规重置提醒：</strong><br>因更换器材赞助商，原品牌装备已不再合规，你的【<strong style="color:var(--accent);">${resetSlots.join('、')}</strong>】已暂时换回通用基础款，请前往<strong>【器材与赞助】</strong>库重新选配【${s.brandKeyword}】专供装备！`;
    }

    showAlert(alertMsg, "签约成功", "🤝");
  } else {
    if (!p.sponsorCooldowns) p.sponsorCooldowns = {};
    let targetWeek = p.week + 4;
    let targetYear = p.year;
    if (targetWeek > 52) {
      targetWeek -= 52;
      targetYear += 1;
    }
    p.sponsorCooldowns[s.id] = { week: targetWeek, year: targetYear };

    showAlert(`💔 谈判破裂：【${s.name}】高层认为你目前的开价或合同年限风险偏高，未能达成一致。进入**为期一个月（4周）的冷却期**，在此期间无法再次谈判！`, "谈判未通过", "📑");
  }

  renderBrandFilterButtons();
  renderGearList();
  drawRadarChart();
  updateUI();
  saveGame();
}

function signSponsor(sponsorId) {
  const sponsorsList = (typeof SPONSORS !== 'undefined' ? SPONSORS : (typeof SPONSORS_DATABASE !== 'undefined' ? SPONSORS_DATABASE : []));
  const s = sponsorsList.find(x => x.id === sponsorId);
  if (!s) return;

  gameState.player.sponsor = s;
  showAlert(`🤝 签约成功！你已成为【${s.name}】品牌代言人，每周将获得 $${s.weeklyPay} 赞助津贴！`, "商业签约", "🏢");
  renderSponsorsCompact(gameState.worldRanking.findIndex(x => x.isUser) + 1);
  updateUI();
  saveGame();
}

// 提取品牌名称
function extractGearBrand(item) {
  if (!item) return '其他';
  if (item.sponsorBrand) {
    for (let b of KNOWN_BRANDS) {
      if (item.sponsorBrand.includes(b)) return b;
    }
  }
  for (let b of KNOWN_BRANDS) {
    if (item.name && item.name.includes(b)) return b;
  }
  return '基础/入门';
}

// 1. 切换大品类 (底板/正手/反手/球鞋)
function changeGearCategory(type, btn) {
  currentGearType = type;
  currentGearBrand = 'all'; // 切换大品类时重置为全部品牌

  // 更新大品类按钮高亮样式
  document.querySelectorAll('#tab-gear .btn-action').forEach(el => el.classList.remove('active-gear-type'));
  if (btn) {
    btn.classList.add('active-gear-type');
  }

  renderBrandFilterButtons();
  renderGearList();
}

// 2. 切换品牌筛选
function filterGearBrand(brand, btn) {
  currentGearBrand = brand;

  // 更新品牌筛选按钮高亮
  document.querySelectorAll('.gear-filter-btn').forEach(el => el.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  }

  renderGearList();
}

// 3. 动态渲染当前品类拥有的品牌按钮
function renderBrandFilterButtons() {
  const filterBar = document.getElementById('gear-brand-filters');
  if (!filterBar || typeof GEAR_DATABASE === 'undefined') return;

  const rawList = GEAR_DATABASE[currentGearType] || [];
  const brandsSet = new Set();
  rawList.forEach(item => brandsSet.add(extractGearBrand(item)));

  let html = `<button class="gear-filter-btn ${currentGearBrand === 'all' ? 'active' : ''}" onclick="filterGearBrand('all', this)">全部品牌 (${rawList.length})</button>`;
  
  brandsSet.forEach(b => {
    const count = rawList.filter(item => extractGearBrand(item) === b).length;
    html += `<button class="gear-filter-btn ${currentGearBrand === b ? 'active' : ''}" onclick="filterGearBrand('${b}', this)">${b} (${count})</button>`;
  });

  filterBar.innerHTML = html;
}

// 4. 渲染器材卡片 (根据大品类 + 品牌实时过滤)
function renderGearList() {
  const container = document.getElementById('gear-container');
  if (!container || typeof GEAR_DATABASE === 'undefined') return;

  const rawList = GEAR_DATABASE[currentGearType] || [];
  const filtered = currentGearBrand === 'all'
    ? rawList
    : rawList.filter(item => extractGearBrand(item) === currentGearBrand);

  const tierBadges = {
    1: { name: '入门', cls: 'badge-feed' },
    2: { name: '进阶', cls: 'badge-cont' },
    3: { name: '专业', cls: 'badge-star' },
    4: { name: '国手', cls: 'badge-gold' }
  };

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; color:var(--text-dim); font-size:0.85rem; padding:20px; text-align:center;">该分类下暂无【${currentGearBrand}】器材</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isEquipped = gameState.player.gear[currentGearType] === item.id;
    const isOwned = (gameState.player.ownedGear[currentGearType] || []).includes(item.id);
    const tierInfo = tierBadges[item.tier] || { name: `T${item.tier}`, cls: 'badge' };
    const brandName = extractGearBrand(item);

    return `
      <div class="gear-card-compact ${isEquipped ? 'equipped' : ''}" onclick="handleGearClick('${currentGearType}', '${item.id}')">
        <div class="gear-header">
          <span class="gear-title" title="${item.name}">${item.name}</span>
          <span class="badge ${tierInfo.cls}" style="font-size:0.65rem; padding:1px 6px; flex-shrink:0;">${tierInfo.name}</span>
        </div>
        <div class="gear-stat-row">
          ${item.speed ? `<span>速<strong>+${item.speed}</strong></span>` : ''}
          ${item.spin ? `<span>旋<strong>+${item.spin}</strong></span>` : ''}
          ${item.control ? `<span>控<strong>+${item.control}</strong></span>` : ''}
          ${item.footwork ? `<span>步<strong>+${item.footwork}</strong></span>` : ''}
        </div>
        <div class="gear-footer">
          <span style="color:var(--text-dim);">${brandName}</span>
          <span style="font-weight:700; color:${isEquipped ? 'var(--accent-gold)' : (isOwned ? 'var(--accent-cyan)' : 'var(--accent)')};">
            ${isEquipped ? '✓ 已装备' : (isOwned ? '点击换装' : (item.price === 0 ? '免费领取' : `$${item.price}`))}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// 5. 点击装备（购买 / 换装）
function handleGearClick(type, gearId) {
  const item = (GEAR_DATABASE[type] || []).find(x => x.id === gearId);
  if (!item) return;

  const p = gameState.player;
  ensurePlayerSponsors();

  // ========== 完善器材赞助排他性判定 ==========
  const gearSp = p.sponsors?.gear;
  if (gearSp) {
    const itemBrand = extractGearBrand(item);
    // 只有入门级 T1 (入门/普及底板) 允许过渡使用，其余所有器材必须匹配签约品牌
    if (item.tier > 1) {
      if (!itemBrand.includes(gearSp.brandKeyword)) {
        showAlert(`🔒 违约警告：你已与【${gearSp.name}】签署排他性器材赞助协议，在合约期内只能使用【${gearSp.brandKeyword}】品牌的专业器材！`, "品牌专供限制", "🏓");
        return;
      }
    }
  }
  // ============================================

  if (!p.ownedGear) p.ownedGear = { blade: ['b1', 'b2'], fh: ['f1', 'f2'], bh: ['bh1', 'bh2'], shoes: ['s1', 's2'] };
  if (!p.ownedGear[type]) p.ownedGear[type] = [];

  const isOwned = p.ownedGear[type].includes(gearId);
  if (isOwned) {
    p.gear[type] = gearId;
    renderGearList();
    drawRadarChart();
    updateUI();
    saveGame();
    return;
  }

  // 购买资金与世界排名检查
  let rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  let currentRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  if (currentRank > item.rankReq) {
    showAlert(`🔒 购买门槛不足：需要世界排名前 #${item.rankReq} 位！`);
    return;
  }

  if (item.price > 0 && p.money < item.price) {
    showAlert(`💵 资金不足！购买此装备需要 $${item.price.toLocaleString()}。`);
    return;
  }

  if (item.price > 0) p.money -= item.price;
  p.ownedGear[type].push(gearId);
  p.gear[type] = gearId;

  showAlert(`🎉 成功解锁并装备了【${item.name}】！`, "装备更新", "🏓");
  renderGearList();
  drawRadarChart();
  updateUI();
  saveGame();
}

function renderStaffList() {
  const p = gameState.player;
  if (!p.staff) p.staff = { coach: 'coach_none', physio: 'physio_none' };

  // 1. 渲染教练列表
  const coachBox = document.getElementById('coach-staff-list');
  if (coachBox) {
    coachBox.innerHTML = COACH_DATABASE.map(c => {
      const isHired = p.staff.coach === c.id;
      return `
        <div class="gear-card-compact ${isHired ? 'equipped' : ''}" style="height:auto; min-height:52px; padding:6px 10px; flex-shrink:0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:#fff; font-size:0.82rem;">${c.name}</strong>
              <span class="badge badge-gold" style="font-size:0.62rem; padding:1px 5px; margin-left:4px;">${c.level}</span>
              <div style="font-size:0.7rem; color:var(--text-dim); margin-top:2px;">${c.desc} · 周薪: <span style="color:var(--accent-cyan);">$${c.weeklyCost}</span></div>
            </div>
            <div>
              ${isHired ? '<span class="badge badge-gold" style="font-size:0.7rem;">已聘请</span>' : `<button class="btn-action" style="padding:3px 8px; font-size:0.72rem;" onclick="hireStaff('coach', '${c.id}')">签约</button>`}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. 渲染体能/理疗师列表
  const physioBox = document.getElementById('physio-staff-list');
  if (physioBox) {
    physioBox.innerHTML = PHYSIO_DATABASE.map(ph => {
      const isHired = p.staff.physio === ph.id;
      return `
        <div class="gear-card-compact ${isHired ? 'equipped' : ''}" style="height:auto; min-height:52px; padding:6px 10px; flex-shrink:0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:#fff; font-size:0.82rem;">${ph.name}</strong>
              <span class="badge badge-star" style="font-size:0.62rem; padding:1px 5px; margin-left:4px;">${ph.level}</span>
              <div style="font-size:0.7rem; color:var(--text-dim); margin-top:2px;">${ph.desc} · 周薪: <span style="color:var(--accent-cyan);">$${ph.weeklyCost}</span></div>
            </div>
            <div>
              ${isHired ? '<span class="badge badge-gold" style="font-size:0.7rem;">已聘请</span>' : `<button class="btn-action" style="padding:3px 8px; font-size:0.72rem;" onclick="hireStaff('physio', '${ph.id}')">签约</button>`}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function hireStaff(type, staffId) {
  const p = gameState.player;
  if (!p.staff) p.staff = { coach: 'coach_none', physio: 'physio_none' };
  
  const db = type === 'coach' ? COACH_DATABASE : PHYSIO_DATABASE;
  const target = db.find(x => x.id === staffId);
  if (!target) return;

  if (target.weeklyCost > p.money) {
    showAlert(`💵 签约资金不足！账户当前余额需至少能够支付首周周薪（$${target.weeklyCost}）。`);
    return;
  }

  p.staff[type] = staffId;
  showAlert(`🤝 签约成功！已聘请【${target.name}】进入您的专属团队！`, "教练团队更新", "📋");
  renderStaffList();
  updateUI();
  saveGame();
}