// 打法流派对应的 12 维加权偏置
const STYLE_STAT_BIAS = {
  "横板两面暴力弧圈": { fhPower: 1.18, spin: 1.15, rally: 1.10, speed: 1.05, touch: 0.90 },
  "横板反手快撕大师": { bhSpeed: 1.20, speed: 1.12, receive: 1.12, tactics: 1.05, fhPower: 0.95 },
  "直拍横打极速突击": { bhSpeed: 1.15, speed: 1.18, touch: 1.15, footwork: 1.12, rally: 0.85 },
  "削球防守反击型":   { rally: 1.25, spin: 1.15, endurance: 1.20, mental: 1.10, speed: 0.82, fhPower: 0.85 },
  "六边形终极掌控":   { fhPower: 1.08, bhSpeed: 1.08, spin: 1.08, touch: 1.12, rally: 1.10, serve: 1.10, receive: 1.10, speed: 1.05, footwork: 1.08, endurance: 1.05, mental: 1.15, tactics: 1.15 },
  "default":         { fhPower: 1.0, bhSpeed: 1.0, spin: 1.0, touch: 1.0, rally: 1.0, serve: 1.0, receive: 1.0, speed: 1.0, footwork: 1.0, endurance: 1.0, mental: 1.0, tactics: 1.0 }
};

// 多样化伤病库：每种伤病影响不同维度的属性
// 分级多样化伤病库：轻度伤病扣 1~2 点（可带伤出赛）；重度伤病扣 8~12 点（需休息康复）
// 分级伤病库：轻伤临时扣除 2~3 点；大伤永久扣除 7~12 点基础属性
const INJURY_TYPES = {
  // --- 轻度伤病 (临时减益 2~3 点，康复后全额恢复) ---
  muscle_mild: { name: "轻度肌肉拉伤", severity: "mild", desc: "力量-3, 速度-2 (临时减益，愈后恢复)", penalty: { power: 3, speed: 2 } },
  knee_mild: { name: "轻度膝盖酸痛", severity: "mild", desc: "步法-3, 速度-2 (临时减益，愈后恢复)", penalty: { footwork: 3, speed: 2 } },
  waist_mild: { name: "轻度腰肌劳损", severity: "mild", desc: "旋转-3, 力量-2 (临时减益，愈后恢复)", penalty: { spin: 3, power: 2 } },
  shoulder_mild: { name: "轻度肩部疲劳", severity: "mild", desc: "力量-2, 旋转-3 (临时减益，愈后恢复)", penalty: { power: 2, spin: 3 } },
  wrist_mild: { name: "轻度手腕不适", severity: "mild", desc: "控制-3, 旋转-2 (临时减益，愈后恢复)", penalty: { control: 3, spin: 2 } },

  // --- 严重伤病 (直接永久扣除 7~12 点基础属性，需重新训练补回) ---
  muscle_severe: { name: "重度肌肉撕裂", severity: "severe", desc: "基础力量永久-12, 速度永久-8 (需重新训练)", permLoss: { power: 12, speed: 8 } },
  knee_severe: { name: "半月板严重损伤", severity: "severe", desc: "基础步法永久-11, 速度永久-9 (需重新训练)", permLoss: { footwork: 11, speed: 9 } },
  waist_severe: { name: "急性腰部扭伤", severity: "severe", desc: "基础旋转永久-11, 力量永久-9 (需重新训练)", permLoss: { spin: 11, power: 9 } },
  shoulder_severe: { name: "肩袖重度撕裂", severity: "severe", desc: "基础力量永久-12, 旋转永久-9 (需重新训练)", permLoss: { power: 12, spin: 9 } },
  wrist_severe: { name: "重度腱鞘炎", severity: "severe", desc: "基础控制永久-12, 旋转永久-8 (需重新训练)", permLoss: { control: 12, spin: 8 } }
};

// 国家头像映射配置表（前缀名 与 拥有图片总数量）
const AVATAR_CONFIG = {
  CHN: { prefix: 'chinese', count: 10 },
  JPN: { prefix: 'japanese', count: 10 },
  KOR: { prefix: 'korean', count: 10 },
  TPE: { prefix: 'chinese', count: 10 },
  HKG: { prefix: 'chinese', count: 10 },
  MAS: { prefix: 'malaysian', count: 5 },
  GER: { prefix: 'western', count: 15 },
  FRA: { prefix: 'western', count: 15 },
  SWE: { prefix: 'western', count: 15 },
  USA: { prefix: 'western', count: 15 },
  ENG: { prefix: 'western', count: 15 }
};

// 国际乒联/国际奥委会代码 (三字码) -> ISO 3166-1 alpha-2 (国旗二字码)
const IOC_TO_ISO2 = {
  "CHN": "cn", "JPN": "jp", "KOR": "kr", "GER": "de", "FRA": "fr",
  "SWE": "se", "TPE": "tw", "HKG": "hk", "BRA": "br", "ENG": "gb",
  "SLO": "si", "NGR": "ng", "EGY": "eg", "POR": "pt", "IND": "in",
  "ROU": "ro", "DEN": "dk", "AUT": "at", "USA": "us", "CAN": "ca",
  "AUS": "au", "SGP": "sg", "MAS": "my", "THA": "th", "VIE": "vn",
  "POL": "pl", "CZE": "cz", "ESP": "es", "ITA": "it", "CRO": "hr",
  "BEL": "be", "NED": "nl", "SUI": "ch", "TUR": "tr", "GRE": "gr",
  "HUN": "hu", "SRB": "rs", "SVK": "sk", "UKR": "ua", "RUS": "ru",
  "KAZ": "kz", "IRI": "ir", "SAU": "sa", "QAT": "qa", "ARG": "ar",
  "CHI": "cl", "PUR": "pr", "CUB": "cu", "MEX": "mx", "COL": "co",
  "NZL": "nz", "ALG": "dz", "TUN": "tn", "RSA": "za", "NOR": "no",
  "FIN": "fi", "IRL": "ie", "SCO": "gb-sct", "WAL": "gb-wls"
};

// ==================== 专属保障团队配置库 ====================
const COACH_DATABASE = [
  { id: 'coach_none', name: '无主管教练', level: '业余自练', weeklyCost: 0, trainBonus: 0, desc: '自学摸索，无训练增益' },
  { id: 'coach_amateur', name: '业余教练', level: '基层启蒙', weeklyCost: 200, trainBonus: 0.15, desc: '每周专项训练成长效率 +15%' },
  { id: 'coach_provincial', name: '省队教练', level: '专业省队', weeklyCost: 800, trainBonus: 0.40, desc: '每周专项训练成长效率 +40%' },
  { id: 'coach_national', name: '国家级名帅', level: '国手名师', weeklyCost: 3000, trainBonus: 1.00, desc: '每周专项训练成长效率 +100%' }
];

const PHYSIO_DATABASE = [
  { id: 'physio_none', name: '无随队理疗师', level: '常规休息', weeklyCost: 0, staminaDrainDiscount: 0, spaBonus: 0, desc: '正常消耗与恢复' },
  { id: 'physio_junior', name: '初级按摩师', level: '基础调理', weeklyCost: 200, staminaDrainDiscount: 0.15, spaBonus: 10, desc: '训练/参赛消耗-15%，水疗恢复+10' },
  { id: 'physio_senior', name: '高级体能师', level: '专业队医', weeklyCost: 800, staminaDrainDiscount: 0.35, spaBonus: 25, desc: '训练/参赛消耗-35%，水疗恢复+25' },
  { id: 'physio_master', name: '国家队首席康复专家', level: '顶级保障', weeklyCost: 2500, staminaDrainDiscount: 0.60, spaBonus: 45, desc: '训练/参赛消耗-60%，水疗恢复+45' }
];

const KNOWN_BRANDS = ['红双喜', '蝴蝶', '斯帝卡', '亚萨卡', '尼塔谷', '挺拔', '多尼克', '骄猛', '银河', '岸度', 'VICTAS', '亚瑟士', '美津浓', '雷神', '729'];

const TROPHY_CAT_META = {
  olympic: { name: "夏季奥林匹克运动会 单打金牌", icon: "🥇", badge: "badge-olympic" },
  wttc: { name: "世界乒乓球锦标赛 单打冠军", icon: "🏆", badge: "badge-smash" },
  wc: { name: "单打世界杯 冠军", icon: "🌍", badge: "badge-gold" },
  smash: { name: "WTT 大满贯 冠军", icon: "🌟", badge: "badge-smash" },
  finals: { name: "WTT 年终总决赛 冠军", icon: "👑", badge: "badge-smash" },
  champ: { name: "WTT 冠军赛 1000 冠军", icon: "🎖️", badge: "badge-champ" },
  star: { name: "WTT 球星挑战赛 600 冠军", icon: "⭐", badge: "badge-star" },
  contender: { name: "WTT 常规挑战赛 400 冠军", icon: "🏓", badge: "badge-cont" },
  feeder: { name: "WTT 支线赛 / 洲际赛 冠军", icon: "🥉", badge: "badge-feed" }
};

// 定义收录的重要赛事分类与排序
const MEDAL_EVENT_GROUPS = [
  { key: "Olympic", title: "夏季奥林匹克运动会", icon: "🥇" },
  { key: "WTTC", title: "世界乒乓球锦标赛", icon: "🏆" },
  { key: "WorldCup", title: "乒乓球世界杯", icon: "🌍" },
  { key: "Smash", title: "WTT 大满贯", icon: "🌟" },
  { key: "Finals", title: "WTT 年终总决赛", icon: "👑" },
  { key: "Champions", title: "WTT 冠军赛", icon: "🎖️" },
  { key: "Star", title: "WTT 球星挑战赛 / 洲际赛", icon: "⭐" }
];

// 城市/举办地轮换映射库
const OLYMPIC_CITIES = { 2024: "巴黎", 2028: "洛杉矶", 2032: "布里斯班", 2036: "多哈" };
const WTTC_SINGLES_CITIES = { 2025: "多哈", 2027: "阿斯塔纳", 2029: "蒙彼利埃", 2031: "伦敦" };
const WTTC_TEAMS_CITIES = { 2024: "釜山", 2026: "伦敦", 2028: "巴黎", 2030: "东京" };
const WORLDCUP_CITIES = { 2026: "澳门", 2027: "威海", 2028: "杜塞尔多夫", 2029: "横滨", 2030: "成都" };
const FINALS_CITIES = { 2026: "福冈", 2027: "多哈", 2028: "名古屋", 2029: "北京", 2030: "法兰克福" };

/* ==================== 3. 游戏全局数据状态 ==================== */
let gameState = {
  settings: {
    enable3DAnim: false // 默认开启 3D 击球动画
  },
  player: {
    name: "陈星远",
    country: "中国 (CHN)",
    age: 16,
    hand: "右手 (Right-Handed)",
    grip: "横拍 (Shakehand)",
    style: "两面反胶弧圈结合快攻",
    stamina: 100,
    staff: {
      coach: 'coach_none',
      physio: 'physio_none'
    },
    consecutiveTournaments: 0,
    injury: null,
    money: 8888,
    points: 0, // 开局积分为 0
    week: 1,
    year: 2026,
    baseStats: {
      fhPower: 35, bhSpeed: 33, spin: 32, touch: 40,
      rally: 30, serve: 36, receive: 34, speed: 35,
      footwork: 32, endurance: 38, mental: 30, tactics: 32
    },
    gear: { blade: 'b1', fh: 'f1', bh: 'bh1', shoes: 's1' },
    ownedGear: { blade: ['b1', 'b2'], fh: ['f1', 'f2'], bh: ['bh1', 'bh2'], shoes: ['s1', 's2'] },
    sponsor: null,
    prevRank: 500
  },
  // ===== 新增：玩家双打专属档案 =====
  playerDoubles: {
    currentPartner: null, // 现任搭档信息对象，格式为 { name, country, age, style, basePow, chemistry, joinYear, joinWeek, matches, wins, losses, titles }
    partnersHistory: [],  // 历任已解散搭档的历史档案 [{ name, country, joinYear, endYear, wins, losses, titles, ... }]
    points: 0,            // 玩家独立双打官方积分
    pointsHistory: [], 
    rankHistory: [],   // 52周滚动双打积分明细 [{ amt: 积分, w: 周次, y: 年份 }]
    prevRank: 100         // 上周双打世界排名（用于计算 ▲/▼ 动向）
  },
    stats: {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    titles: 0,
    bestRank: 500,
    bestSmashResult: "未入围",
    totalPrizeWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    decidingMatchesPlayed: 0,
    decidingMatchesWon: 0,
    top10MatchesPlayed: 0,
    top10MatchesWon: 0,
    // 细分各赛事冠军数
    titlesOlympic: 0,
    titlesWTTC: 0,
    titlesWorldCup: 0,
    titlesSmash: 0,
    titlesFinals: 0,
    titlesChamp: 0,
    titlesStar: 0,
    titlesContender: 0,
    titlesFeeder: 0
  },
  // ===== 新增：双打生涯独立统计数据 =====
  doublesStats: {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    titles: 0,
    bestRank: 999,
    bestAchievement: "未入围", // 👈 初始状态为未入围
    currentStreak: 0,
    bestStreak: 0,
    decidingMatchesPlayed: 0,
    decidingMatchesWon: 0,
    titlesOlympic: 0,
    titlesWTTC: 0,
    titlesWorldCup: 0,
    titlesSmash: 0,
    titlesFinals: 0,
    titlesChamp: 0,
    titlesStar: 0,
    titlesContender: 0,
    titlesFeeder: 0
  },

  h2hData: {},
  retiredPlayers: [],
  weeklyPlan: ["rest", "speed", "spin", "footwork", "serve", "match", "rest"],
  worldRanking: [],        // 单打世界排名榜单 (Top 500)
  doublesRanking: [],      // ===== 新增：双打组合世界排名榜单 (100+ 组合) =====
  currentTournament: null, // 当前进行的赛事（单打/双打）
  currentTeamEvent: null,
  matchHistory: [],
  weekMeta: null
};

let liveMatchState = null;

function absWeekIndex(week, year) {
  return year * RANKING_WINDOW_WEEKS + week;
}

// 裁剪某位选手超过 52 周窗口的历史积分记录，并重新汇总当前总积分
function recomputePlayerPoints(pObj) {
  if (!pObj) return;
  if (!Array.isArray(pObj.pointsHistory)) pObj.pointsHistory = [];
  const curAbs = absWeekIndex(gameState.player.week, gameState.player.year);
  pObj.pointsHistory = pObj.pointsHistory.filter(e => (curAbs - absWeekIndex(e.w, e.y)) < RANKING_WINDOW_WEEKS);
  pObj.points = Math.max(0, pObj.pointsHistory.reduce((s, e) => s + e.amt, 0));
}

// 全局唯一加分入口：为某位选手（玩家或 AI）在当前周记一笔积分，并立即重新汇总
function awardPoints(pObj, pts) {
  if (!pObj || !pts) return;
  if (!Array.isArray(pObj.pointsHistory)) pObj.pointsHistory = [];
  pObj.pointsHistory.push({ amt: pts, w: gameState.player.week, y: gameState.player.year });
  recomputePlayerPoints(pObj);
  if (pObj.isUser) gameState.player.points = pObj.points;
}

// 每次推进周次后调用：为所有选手裁剪过期积分并重新汇总（取代旧版的随机波动）
function recomputeAllPoints() {
  gameState.worldRanking.forEach(pl => recomputePlayerPoints(pl));
  let userItem = gameState.worldRanking.find(x => x.isUser);
  if (userItem) gameState.player.points = userItem.points;
}

// 2. 获取叠加器材与伤病后的 12 维真实属性
// 2. 获取叠加器材与伤病后的 12 维真实属性（已完美接入底板旋转 b.spin）
function getEffectiveStats() {
  let b = GEAR_DATABASE.blade.find(x => x.id === gameState.player.gear.blade) || { speed: 0, spin: 0, control: 0 };
  let f = GEAR_DATABASE.fh.find(x => x.id === gameState.player.gear.fh) || { speed: 0, spin: 0, control: 0 };
  let bk = GEAR_DATABASE.bh.find(x => x.id === gameState.player.gear.bh) || { speed: 0, spin: 0, control: 0 };
  let sh = GEAR_DATABASE.shoes.find(x => x.id === gameState.player.gear.shoes) || { footwork: 0, speed: 0 };

  let p = gameState.player.baseStats;
  let pen = { fhPower: 0, bhSpeed: 0, spin: 0, touch: 0, rally: 0, serve: 0, receive: 0, speed: 0, footwork: 0, endurance: 0, mental: 0, tactics: 0 };

  // 伤病减益映射
  if (gameState.player.injury && INJURY_TYPES[gameState.player.injury]?.penalty) {
    let pMap = INJURY_TYPES[gameState.player.injury].penalty;
    pen.speed = pMap.speed || 0;
    pen.footwork = pMap.footwork || 0;
    pen.fhPower = pMap.power || 0;
    pen.touch = pMap.control || 0;
  }

  return {
    // 💥 正手杀伤：正手胶皮速度(0.8) + 底板速度(0.4)
    fhPower: Math.max(10, Math.min(99, (p.fhPower || 35) + f.speed * 0.8 + b.speed * 0.4 - pen.fhPower)),
    
    // ⚡ 反手速度：反手胶皮速度(0.8) + 底板速度(0.3)
    bhSpeed: Math.max(10, Math.min(99, (p.bhSpeed || 35) + bk.speed * 0.8 + b.speed * 0.3 - pen.bhSpeed)),
    
    // 🌪️ 击球旋转：正手旋转(0.5) + 反手旋转(0.3) + 底板吃球形变旋转(0.3) 👈 [已接入底板旋转]
    spin: Math.max(10, Math.min(99, (p.spin || 35) + f.spin * 0.5 + bk.spin * 0.3 + b.spin * 0.3 - pen.spin)),
    
    // 🎯 台内控制：底板控制(0.5) + 正手控制(0.3)
    touch: Math.max(10, Math.min(99, (p.touch || 35) + b.control * 0.5 + f.control * 0.3 - pen.touch)),
    
    // 🛡️ 相持防守：底板控制(0.4) + 反手控制(0.3) + 底板形变底劲旋转(0.2) 👈 [已接入底板旋转]
    rally: Math.max(10, Math.min(99, (p.rally || 35) + b.control * 0.4 + bk.control * 0.3 + b.spin * 0.2 - pen.rally)),
    
    // 🌀 特色发球：正手旋转(0.4) + 底板摩擦旋转(0.2) + 底板落点控制(0.2) 👈 [已接入底板旋转]
    serve: Math.max(10, Math.min(99, (p.serve || 35) + f.spin * 0.4 + b.spin * 0.2 + b.control * 0.2 - pen.serve)),
    
    // 🏓 接发拧拉：反手控制(0.4) + 底板控制(0.3)
    receive: Math.max(10, Math.min(99, (p.receive || 35) + bk.control * 0.4 + b.control * 0.3 - pen.receive)),
    
    // 💨 爆发移速：球鞋速度(0.6)
    speed: Math.max(10, Math.min(99, (p.speed || 35) + sh.speed * 0.6 - pen.speed)),
    
    // 🏃 摆速步法：球鞋步法(1.0)
    footwork: Math.max(10, Math.min(99, (p.footwork || 35) + (sh.footwork || 0) - pen.footwork)),
    
    endurance: Math.max(10, Math.min(99, (p.endurance || 35) - pen.endurance)),
    mental: Math.max(10, Math.min(99, (p.mental || 35) - pen.mental)),
    tactics: Math.max(10, Math.min(99, (p.tactics || 35) - pen.tactics))
  };
}

// 综合战力计算（加权平均）
function computeUserCombatPower() {
  let s = getEffectiveStats();
  return (
    (s.fhPower || 30) * 0.12 + (s.bhSpeed || 30) * 0.10 + (s.spin || 30) * 0.10 +
    (s.touch || 30) * 0.08 + (s.rally || 30) * 0.08 + (s.serve || 30) * 0.08 +
    (s.receive || 30) * 0.08 + (s.speed || 30) * 0.08 + (s.footwork || 30) * 0.08 +
    (s.endurance || 30) * 0.06 + (s.mental || 30) * 0.07 + (s.tactics || 30) * 0.07
  );
}

/* ==================== 3.2 比赛胜率引擎 (Balance Engine) ====================
   旧版所有胜率计算（无论是"每一分"还是"每一局/每一场对抗"）统一复用同一条
   0.15~0.85 的线性公式，导致实力差距一旦拉开（例如新秀 vs 世界前十），
   每一分的胜率就会被封顶在 15%，21分/11分制下几乎必然打出 0-11、1-11 的
   离谱悬殊比分，完全不符合乒乓球"哪怕实力悬殊也很少被打光头"的现实观感。

   现改为两套独立曲线：
   - pointWinProb(diff)：单个"分"的胜率（用于现场文字直播逐分模拟），
     压缩到 32%~68% 区间，就算是新秀迎战世界第一，每一分依然有机会，
     打出的比分会更接近 6-11 / 7-11 这种"输得不丢人"的真实分差，
     且偶尔可能爆冷抢下一局甚至一场。
   - setWinProb(diff)：整局/整场对抗胜率（用于团体赛盘次、AI 之间的
     快速模拟等"以局定胜负"场景），压缩到 20%~80% 区间，
     既保留强弱分明的整体走势，也留出爆冷空间。
   两者都叠加"临场状态"随机浮动，让同一批实力数据在不同比赛日
   也会有所波动，避免比赛结果完全由静态属性差决定。 */
function pointWinProb(diff, opts) {
  opts = opts || {};
  let clutch = opts.clutch || 0; // 关键分心理加成（心理属性带来的临场把握力）
  let prob = 0.5 + diff * 0.011 + clutch;
  return Math.max(0.32, Math.min(0.68, prob));
}

function setWinProb(diff, opts) {
  opts = opts || {};
  let prob = 0.5 + diff * 0.016 + (opts.clutch || 0);
  return Math.max(0.20, Math.min(0.80, prob));
}

// 单场比赛开赛前生成的"临场状态"浮动：正负约 8 点战力，代表当天手感、
// 精神状态等不可控因素，使实力接近甚至有一定差距的对局都存在爆冷可能。
function rollMatchDayForm() {
  return (Math.random() - 0.5) * 16;
}

/* ==================== 双打默契度与综合战力计算 ==================== */

// 计算两名选手组合的基础初始默契度
function calculateInitialChemistry(p1Country, p2Country) {
  const isSameNation = p1Country && p2Country && p1Country.trim() === p2Country.trim();
  if (isSameNation) {
    // 同国籍：默契度 75 ~ 88
    return Math.floor(75 + Math.random() * 14);
  } else {
    // 跨国配对：默契度 45 ~ 60
    return Math.floor(45 + Math.random() * 16);
  }
}

// 综合双打团队战力 = (选手A战力 + 选手B战力) / 2 + 默契度加成 (默契度越高，战术配合与补位加成越高)
function calculateDoublesPairCombatPower(playerA, playerB, chemistry = 60) {
  const powA = playerA.isUser ? computeUserCombatPower() : (playerA.basePow || 55);
  const powB = playerB.isUser ? computeUserCombatPower() : (playerB.basePow || 55);
  const baseAvg = (powA + powB) / 2;
  
  // 默契系数：50为基准 (±0%)，100满默契可提升 +10% 团队战斗力，低默契度扣减最多 -10%
  const chemistryMultiplier = 1.0 + ((chemistry - 50) / 50) * 0.10;
  return +(baseAvg * chemistryMultiplier).toFixed(1);
}

// 比赛后更新玩家与搭档的默契度
function applyDoublesMatchChemistryDelta(isWin) {
  const partner = gameState.playerDoubles.currentPartner;
  if (!partner) return;

  let delta = isWin ? (1.5 + Math.random() * 1.0) : (0.5 + Math.random() * 0.5); // 赢球大幅涨默契，输球小幅累积经验
  partner.chemistry = Math.min(100, +(partner.chemistry + delta).toFixed(1));
}

/* ==================== 初始 100 对双打组合生成 ==================== */
function generateInitial100DoublesPairs() {
  const singlesList = gameState.worldRanking.filter(p => !p.isUser);
  const usedSinglesNames = new Set();
  const pairs = [];

  // 1. 按国籍聚合选手，优先组建同国强强组合（如国乒男双、法国勒布伦兄弟等）
  const byCountry = {};
  singlesList.forEach(p => {
    if (!byCountry[p.country]) byCountry[p.country] = [];
    byCountry[p.country].push(p);
  });

  // 同国强力组合
  Object.keys(byCountry).forEach(c => {
    let pool = byCountry[c];
    for (let i = 0; i + 1 < pool.length; i += 2) {
      if (pairs.length >= 75) break; // 前 75 组尽量同国
      let p1 = pool[i];
      let p2 = pool[i + 1];
      usedSinglesNames.add(p1.name);
      usedSinglesNames.add(p2.name);

      let chem = calculateInitialChemistry(p1.country, p2.country);
      pairs.push(createDoublesPairObject(p1, p2, chem));
    }
  });

  // 2. 剩余选手随机跨国配对，补满 100 组
  let remaining = singlesList.filter(p => !usedSinglesNames.has(p.name));
  remaining.sort(() => Math.random() - 0.5);

  for (let i = 0; i + 1 < remaining.length && pairs.length < 100; i += 2) {
    let p1 = remaining[i];
    let p2 = remaining[i + 1];
    let chem = calculateInitialChemistry(p1.country, p2.country);
    pairs.push(createDoublesPairObject(p1, p2, chem));
  }

  // 3. 按初始积分降序排列
  pairs.sort((a, b) => b.points - a.points);
  pairs.forEach((pair, idx) => { pair.prevRank = idx + 1; });

  gameState.doublesRanking = pairs;
}

// 辅助：构建单个双打组合实体对象
// 辅助：构建单个双打组合实体对象（从0开始真实累加）
function createDoublesPairObject(p1, p2, chemistry) {
  const p1Pow = p1.basePow || 60;
  const p2Pow = p2.basePow || 60;
  const avgPow = (p1Pow + p2Pow) / 2;
  
  let rankEstimate = Math.max(1, Math.min(100, Math.floor((100 - avgPow) * 2.5)));
  let basePts = Math.max(120, Math.floor(6500 * Math.pow(0.965, rankEstimate)));

  return {
    id: `pair_${p1.name}_${p2.name}_${Date.now()}_${Math.floor(Math.random()*1000)}`,
    player1: { name: p1.name, country: p1.country, basePow: p1Pow, style: p1.style },
    player2: { name: p2.name, country: p2.country, basePow: p2Pow, style: p2.style },
    name: `${p1.name} / ${p2.name}`,
    country: (p1.country === p2.country) ? p1.country : `${p1.country} / ${p2.country}`,
    chemistry: chemistry,
    points: basePts,
    pointsHistory: [
      { amt: basePts, w: Math.floor(1 + Math.random() * 45), y: gameState.player.year - 1 }
    ],
    careerWins: 0,
    careerLosses: 0,
    titles: 0,
    recentMatches: []
  };
}

/* ==================== 玩家搭档管理系统 ==================== */

// 替换 config-state.js 中的 invitePlayerAsPartner 函数
function invitePlayerAsPartner(targetPlayerName) {
  if (!gameState.playerDoubles.cooldowns) gameState.playerDoubles.cooldowns = {};

  if (gameState.playerDoubles.currentPartner) {
    showAlert("你当前已有双打搭档，需先解除现有合作关系才能邀请新搭档！", "无法邀请", "⚠️");
    return;
  }

  // 检查是否处于 4 周（1个月）邀请冷却期内
  const cd = gameState.playerDoubles.cooldowns[targetPlayerName];
  if (cd) {
    const curAbs = absWeekIndex(gameState.player.week, gameState.player.year);
    const cdAbs = absWeekIndex(cd.week, cd.year);
    if (curAbs < cdAbs) {
      const weeksLeft = cdAbs - curAbs;
      showAlert(`⏳ 【${targetPlayerName}】近期刚刚婉拒了你的邀约，正在冷静期中。<br>还需等待 <strong>${weeksLeft} 周</strong>（约 ${(weeksLeft*7/30).toFixed(1)} 个月）后方可再次发起邀请！`, "冷却中", "⏳");
      return;
    }
  }

  const target = gameState.worldRanking.find(p => p.name === targetPlayerName);
  if (!target || target.isUser) return;

  const p = gameState.player;
  const userRank = gameState.worldRanking.findIndex(x => x.isUser) + 1;
  const targetRank = gameState.worldRanking.indexOf(target) + 1;
  const isSameNation = p.country === target.country;

  let acceptChance = 0.50;
  if (isSameNation) acceptChance += 0.30;
  let rankDiff = targetRank - userRank;
  acceptChance += (rankDiff * 0.005);
  acceptChance = Math.max(0.10, Math.min(0.95, acceptChance));

  if (Math.random() < acceptChance) {
    const initialChem = calculateInitialChemistry(p.country, target.country);
    disbandAIPairIfContains(target.name);

    gameState.playerDoubles.currentPartner = {
      name: target.name,
      country: target.country,
      age: target.age,
      style: target.style,
      basePow: target.basePow || 60,
      chemistry: initialChem,
      joinYear: p.year,
      joinWeek: p.week,
      matches: 0,
      wins: 0,
      losses: 0,
      titles: 0
    };

    registerUserDoublesPair();

    showAlert(
      `🤝 <strong>配对成功！</strong><br>【${target.name}】（${target.country}）已接受你的双打邀请！<br>` +
      `初始搭档默契度：<strong style="color:var(--accent-gold);">${initialChem}</strong> ` +
      `(${isSameNation ? '同协会默契加成' : '跨国磨合'})，向双打巡回赛进发吧！`,
      "邀约成功", "🎉"
    );
  } else {
    // 拒绝后加入 4 周（1个月）冷却期
    let cdWeek = p.week + 4;
    let cdYear = p.year;
    if (cdWeek > 52) {
      cdWeek -= 52;
      cdYear += 1;
    }
    gameState.playerDoubles.cooldowns[targetPlayerName] = { week: cdWeek, year: cdYear };

    showAlert(
      `❌ <strong>邀约被婉拒</strong><br>【${target.name}】考虑后婉拒了你的配对邀请。<br>` +
      `<span style="color:var(--text-dim); font-size:0.82rem;">（已进入 4 周邀约冷却期。提升单打世界排名或邀请同协会选手成功率更高！）</span>`,
      "邀约结果", "📋"
    );
  }
  updateUI();
  saveGame();
}

// 解散现有搭档并归档至历任战绩库
function disbandCurrentPartner() {
  const partner = gameState.playerDoubles.currentPartner;
  if (!partner) return;

  showCustomConfirm({
    icon: '💔',
    title: '解散双打组合确认',
    msg: `确定要与搭档【<strong style="color:var(--accent-gold);">${partner.name}</strong>】解除双打合作吗？<br>` +
         `双方共同征战期间取得的战绩（${partner.wins}胜 ${partner.losses}负，${partner.titles}个冠军）将归档保留。`,
    okText: '确认解散',
    okColor: '#ef4444',
    onConfirm: () => {
      // 归档至历史记录
      gameState.playerDoubles.partnersHistory.unshift({
        name: partner.name,
        country: partner.country,
        joinYear: partner.joinYear,
        joinWeek: partner.joinWeek,
        endYear: gameState.player.year,
        endWeek: gameState.player.week,
        finalChemistry: partner.chemistry,
        matches: partner.matches || 0,
        wins: partner.wins || 0,
        losses: partner.losses || 0,
        titles: partner.titles || 0
      });

      // 从双打榜单中移除玩家组合
      gameState.doublesRanking = gameState.doublesRanking.filter(pair => !pair.isUserPair);
      gameState.playerDoubles.currentPartner = null;

      showAlert(`你与【${partner.name}】的双打组合已正式解散。你现在可以自由寻找新的搭档！`, "组合解散", "📋");
      updateUI();
      saveGame();
    }
  });
}

function registerUserDoublesPair() {
  const p = gameState.player;
  const partner = gameState.playerDoubles.currentPartner;
  if (!partner) return;

  // 确保初始 100 对 AI 双打已存在
  if (!gameState.doublesRanking || gameState.doublesRanking.length === 0) {
    generateInitial100DoublesPairs();
  }

  // 仅移除玩家自己旧的组合项，保留全部 AI 组合
  gameState.doublesRanking = gameState.doublesRanking.filter(pair => !pair.isUserPair);

  const userPairObj = {
    id: `user_pair_${p.name}_${partner.name}`,
    isUserPair: true,
    player1: { name: p.name, country: p.country, isUser: true },
    player2: { name: partner.name, country: partner.country, basePow: partner.basePow },
    name: `${p.name} / ${partner.name}`,
    country: (p.country === partner.country) ? p.country : `${p.country} / ${partner.country}`,
    chemistry: partner.chemistry,
    points: gameState.playerDoubles.points || 0,
    pointsHistory: gameState.playerDoubles.pointsHistory || [],
    careerWins: partner.wins || 0,
    careerLosses: partner.losses || 0,
    titles: partner.titles || 0,
    recentMatches: []
  };

  gameState.doublesRanking.push(userPairObj);
  sortDoublesRanking();
}

// 移除与目标 AI 选手绑定的既有组合
function disbandAIPairIfContains(playerName) {
  gameState.doublesRanking = gameState.doublesRanking.filter(pair => {
    if (pair.player1.name === playerName || pair.player2.name === playerName) {
      return false;
    }
    return true;
  });
}

/* ==================== 双打滚动积分与排名 ==================== */

// 重新计算单个双打组合的总积分
function recomputePairDoublesPoints(pair) {
  if (!pair) return;
  if (!Array.isArray(pair.pointsHistory)) pair.pointsHistory = [];
  const curAbs = absWeekIndex(gameState.player.week, gameState.player.year);
  pair.pointsHistory = pair.pointsHistory.filter(e => (curAbs - absWeekIndex(e.w, e.y)) < RANKING_WINDOW_WEEKS);
  pair.points = Math.max(0, pair.pointsHistory.reduce((s, e) => s + e.amt, 0));
}

// 为双打组合发放赛事积分
function awardDoublesPoints(pair, pts) {
  if (!pair || !pts) return;
  if (!Array.isArray(pair.pointsHistory)) pair.pointsHistory = [];
  pair.pointsHistory.push({ amt: pts, w: gameState.player.week, y: gameState.player.year });
  recomputePairDoublesPoints(pair);

  if (pair.isUserPair) {
    gameState.playerDoubles.points = pair.points;
    gameState.playerDoubles.pointsHistory = pair.pointsHistory;
  }
}

// 双打榜单排序并更新动向
function sortDoublesRanking() {
  gameState.doublesRanking.forEach(pair => recomputePairDoublesPoints(pair));
  gameState.doublesRanking.sort((a, b) => b.points - a.points);
  gameState.doublesRanking.forEach((pair, idx) => {
    pair.prevRank = pair.currentRank || (idx + 1);
    pair.currentRank = idx + 1;
  });

  const userPair = gameState.doublesRanking.find(p => p.isUserPair);
  if (userPair) {
    gameState.playerDoubles.prevRank = userPair.prevRank;
  }
}

// config-state.js
function recordRecentMatchForPlayer(playerObj, eventName, eventType, resultText, points, discipline = "单打") {
  if (!playerObj) return;
  if (!Array.isArray(playerObj.recentMatches)) playerObj.recentMatches = [];

  const curYear = gameState.player.year;
  const curWeek = gameState.player.week;

  // 1. 查找是否存在同一年、同一周、同一站、同一项目的已有记录
  const existingIdx = playerObj.recentMatches.findIndex(m => 
    m.season === `${curYear}年` && 
    m.week === curWeek && 
    m.event === eventName &&
    m.discipline === discipline
  );

  const formattedResult = (typeof formatRoundResult === 'function') ? formatRoundResult(resultText) : resultText;
  const formattedPoints = (typeof points === 'number') ? `+${points}` : (String(points).startsWith('+') ? String(points) : `+${points}`);

  const matchRecord = {
    season: `${curYear}年`,
    week: curWeek,
    event: eventName,
    type: eventType,
    result: formattedResult,
    points: formattedPoints,
    discipline: discipline
  };

  if (existingIdx >= 0) {
    playerObj.recentMatches[existingIdx] = matchRecord;
  } else {
    playerObj.recentMatches.unshift(matchRecord);
    if (playerObj.recentMatches.length > 20) {
      playerObj.recentMatches.pop();
    }
  }
}

// 记录玩家当前双打世界排名快照
function recordDoublesRankHistoryPoint() {
  const p = gameState.player;
  if (!gameState.playerDoubles) return;
  if (!gameState.playerDoubles.rankHistory) gameState.playerDoubles.rankHistory = [];

  const userPair = gameState.doublesRanking?.find(pair => pair.isUserPair);
  if (!userPair) return;

  const dRank = gameState.doublesRanking.indexOf(userPair) + 1;
  const abs = absWeekIndex(p.week, p.year);
  const hist = gameState.playerDoubles.rankHistory;
  const last = hist[hist.length - 1];

  if (last && last.abs === abs) {
    last.rank = dRank;
  } else {
    hist.push({ abs, week: p.week, year: p.year, rank: dRank });
  }

  if (hist.length > 900) {
    gameState.playerDoubles.rankHistory = hist.slice(hist.length - 900);
  }
}

