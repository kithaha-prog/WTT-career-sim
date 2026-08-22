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

const KNOWN_BRANDS = [
  '红双禧', '红双燕', '蝴蝶飞', '蝶恋花', '斯帝咖', '斯帝佳',
  '亚萨咖', '鸭萨咖', '尼踏谷', '倪塔可', '挺拨', '挺霸',
  '多霓克', '多尼可', '骄勐', '骄萌', '银禾', '银禾河',
  '岸渡', '岸渡拓', '维克踏', '维克它', '亚瑟仕', '亚色仕',
  '美津侬', '美卓浓', '雷申', '雷震', '柒贰玖', '柒贰玖友',
  '李凝', '李林', '胜利拓', '胜力拓', '弘图'
];

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
    fans: 200, // 👈 初始 200 粉丝
    fanHistory: [], // 👈 粉丝走势记录
    moneyHistory: [],
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
/* ==================== ITTF 官方真实积分规则：52 周内最佳 8 站有效积分 ==================== */
const RANKING_WINDOW_WEEKS = 52;     // 12 个月（52 周）有效窗口
const MAX_COUNTING_TOURNAMENTS = 8;  // 最多计入 8 站最高分

// 1. 单打选手积分重算：过滤 52 周内记录 -> 降序排序 -> 截取前 8 站求和
function recomputePlayerPoints(pObj) {
  if (!pObj) return;
  if (!Array.isArray(pObj.pointsHistory)) pObj.pointsHistory = [];
  
  const curAbs = absWeekIndex(gameState.player.week, gameState.player.year);
  
  // 步骤 A：过滤出 52 周 (12个月) 之内的有效参赛得分记录
  pObj.pointsHistory = pObj.pointsHistory.filter(e => (curAbs - absWeekIndex(e.w, e.y)) < RANKING_WINDOW_WEEKS);
  
  // 步骤 B：按单站得分从高到低排序，只截取最高的 8 站有效得分
  let validScores = pObj.pointsHistory
    .map(e => e.amt || 0)
    .sort((a, b) => b - a)
    .slice(0, MAX_COUNTING_TOURNAMENTS);

  // 步骤 C：求和得出官方世界排名总积分
  pObj.points = Math.max(0, validScores.reduce((sum, score) => sum + score, 0));
}

// 2. 双打组合积分重算：同样遵循 52 周内最佳 8 站有效积分
function recomputePairDoublesPoints(pair) {
  if (!pair) return;
  if (!Array.isArray(pair.pointsHistory)) pair.pointsHistory = [];
  
  const curAbs = absWeekIndex(gameState.player.week, gameState.player.year);
  
  // 步骤 A：过滤 52 周内有效记录
  pair.pointsHistory = pair.pointsHistory.filter(e => (curAbs - absWeekIndex(e.w, e.y)) < RANKING_WINDOW_WEEKS);

  // 步骤 B：按得分降序提取前 8 站
  let validScores = pair.pointsHistory
    .map(e => e.amt || 0)
    .sort((a, b) => b - a)
    .slice(0, MAX_COUNTING_TOURNAMENTS);

  // 步骤 C：求和
  pair.points = Math.max(0, validScores.reduce((sum, score) => sum + score, 0));
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

/* ==================== 1. AI 选手装备分配与生成器 ==================== */

// 根据选手世界排名与综合战力，从官方 GEAR_DATABASE 挑选合规器材
function assignAIGear(playerObj, rank = 999) {
  if (!playerObj || playerObj.isUser) return;

  const pow = playerObj.basePow || 60;
  
  // 1. 确定器材阶位 Tier (1~4)
  let targetTier = 1;
  if (rank <= 15 || pow >= 86) {
    targetTier = 4; // 国手顶级
  } else if (rank <= 80 || pow >= 74) {
    targetTier = Math.random() < 0.75 ? 3 : 4; // 专业级为主，小概率越级
  } else if (rank <= 250 || pow >= 60) {
    targetTier = 2; // 进阶级
  } else {
    targetTier = Math.random() < 0.3 ? 2 : 1; // 入门/普及
  }

  // 2. 特殊名将招牌底板匹配（从真实底板库匹配）
  let pName = playerObj.name || "";
  let pickedBlade = null;

  if (pName.includes("樊振东")) {
    pickedBlade = GEAR_DATABASE.blade.find(b => b.id === 'b31' || b.id === 'b19');
  } else if (pName.includes("马龙")) {
    pickedBlade = GEAR_DATABASE.blade.find(b => b.id === 'b39' || b.id === 'b42');
  } else if (pName.includes("张本")) {
    pickedBlade = GEAR_DATABASE.blade.find(b => b.id === 'b33' || b.id === 'b20');
  } else if (pName.includes("波尔")) {
    pickedBlade = GEAR_DATABASE.blade.find(b => b.id === 'b35' || b.id === 'b18');
  } else if (pName.includes("林昀儒")) {
    pickedBlade = GEAR_DATABASE.blade.find(b => b.id === 'b21');
  } else if (pName.includes("奥恰")) {
    pickedBlade = GEAR_DATABASE.blade.find(b => b.id === 'b34');
  }

  // 3. 通用从指定阶位池抽取器材
  const filterByTier = (list, t) => {
    let pool = list.filter(item => String(item.tier) === String(t));
    if (pool.length === 0) pool = list.filter(item => Number(item.tier) <= Number(t));
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const blade = pickedBlade || filterByTier(GEAR_DATABASE.blade, targetTier);
  const fh = filterByTier(GEAR_DATABASE.fh, targetTier);
  const bh = filterByTier(GEAR_DATABASE.bh, targetTier);
  const shoes = filterByTier(GEAR_DATABASE.shoes, targetTier);

  playerObj.gear = {
    blade: blade ? blade.id : 'b1',
    fh: fh ? fh.id : 'f1',
    bh: bh ? bh.id : 'bh1',
    shoes: shoes ? shoes.id : 's1'
  };
}

/* ==================== 2. 通用 12 维真实属性计算 (玩家与 AI 完全相同) ==================== */

// 通用：计算任意选手（玩家或 AI）穿戴装备后的 12 维真实属性
function getEffectiveStatsForPlayer(playerObj) {
  if (!playerObj || playerObj.isUser) {
    return getEffectiveStats();
  }

  // 确保 AI 身上拥有来自器材库的装备
  if (!playerObj.gear) {
    let rank = gameState.worldRanking.indexOf(playerObj) + 1;
    assignAIGear(playerObj, rank > 0 ? rank : 999);
  }

  let b = GEAR_DATABASE.blade.find(x => x.id === playerObj.gear.blade) || { speed: 0, spin: 0, control: 0 };
  let f = GEAR_DATABASE.fh.find(x => x.id === playerObj.gear.fh) || { speed: 0, spin: 0, control: 0 };
  let bk = GEAR_DATABASE.bh.find(x => x.id === playerObj.gear.bh) || { speed: 0, spin: 0, control: 0 };
  let sh = GEAR_DATABASE.shoes.find(x => x.id === playerObj.gear.shoes) || { footwork: 0, speed: 0 };

  if (!playerObj.baseStats) {
    playerObj.baseStats = generateAI12Stats(playerObj.basePow || 60, playerObj.style || "");
  }
  let p = playerObj.baseStats;

  return {
    fhPower: Math.max(10, Math.min(99, (p.fhPower || 35) + f.speed * 0.8 + b.speed * 0.4)),
    bhSpeed: Math.max(10, Math.min(99, (p.bhSpeed || 35) + bk.speed * 0.8 + b.speed * 0.3)),
    spin: Math.max(10, Math.min(99, (p.spin || 35) + f.spin * 0.5 + bk.spin * 0.3 + b.spin * 0.3)),
    touch: Math.max(10, Math.min(99, (p.touch || 35) + b.control * 0.5 + f.control * 0.3)),
    rally: Math.max(10, Math.min(99, (p.rally || 35) + b.control * 0.4 + bk.control * 0.3 + b.spin * 0.2)),
    serve: Math.max(10, Math.min(99, (p.serve || 35) + f.spin * 0.4 + b.spin * 0.2 + b.control * 0.2)),
    receive: Math.max(10, Math.min(99, (p.receive || 35) + bk.control * 0.4 + b.control * 0.3)),
    speed: Math.max(10, Math.min(99, (p.speed || 35) + sh.speed * 0.6)),
    footwork: Math.max(10, Math.min(99, (p.footwork || 35) + (sh.footwork || 0))),
    endurance: Math.max(10, Math.min(99, p.endurance || 35)),
    mental: Math.max(10, Math.min(99, p.mental || 35)),
    tactics: Math.max(10, Math.min(99, p.tactics || 35))
  };
}

// 通用：计算选手综合战力（综评 Overall），完全基于 12 维加权算法
function computePlayerCombatPower(playerObj) {
  let s = getEffectiveStatsForPlayer(playerObj);
  return +(
    (s.fhPower || 30) * 0.12 + (s.bhSpeed || 30) * 0.10 + (s.spin || 30) * 0.10 +
    (s.touch || 30) * 0.08 + (s.rally || 30) * 0.08 + (s.serve || 30) * 0.08 +
    (s.receive || 30) * 0.08 + (s.speed || 30) * 0.08 + (s.footwork || 30) * 0.08 +
    (s.endurance || 30) * 0.06 + (s.mental || 30) * 0.07 + (s.tactics || 30) * 0.07
  ).toFixed(1);
}

// 保持对旧代码 computeUserCombatPower 的兼容
function computeUserCombatPower() {
  return computePlayerCombatPower(gameState.player);
}
/* ==================== 3. AI 低概率年度器材更换机制 ==================== */

/* ==================== 3. AI 低概率年度器材更换机制 ==================== */

// 在每年赛季结束推进时触发：AI 有极低几率触发器材调校与升级
/* ==================== 多样化 AI 换装新闻生成器 ==================== */
function createAIGearChangeNews(pl, oldBladeId, newBlade, curRank) {
  if (!newBlade || newBlade.id === oldBladeId) return null;

  const isTopStar = curRank <= 15;
  const isRisingPro = curRank <= 80;
  const rankTag = isTopStar ? "世界顶尖巨星" : (isRisingPro ? "巡回赛主力名将" : "巡回赛冲分新锐");
  const tierName = newBlade.tier === '4' || newBlade.tier === 4 ? "国手旗舰特注" : (newBlade.tier === '3' || newBlade.tier === 3 ? "专业竞技底板" : "进阶实战手板");
  const brandName = (typeof extractGearBrand === 'function') ? extractGearBrand(newBlade) : "专业";

  // 1. 根据选手排位匹配多样化新闻标题
  const titleTemplates = isTopStar ? [
    `神兵再调校！${rankTag}【${pl.name}】秘密换装【${newBlade.name}】`,
    `巅峰利刃！【${pl.name}】携全新【${newBlade.name}】出战新赛季`,
    `重炮升级！【${pl.name}】正式列装【${brandName}】旗舰【${newBlade.name}】`
  ] : (isRisingPro ? [
    `战力革新！【${pl.name}】升级主战手板为【${newBlade.name}】`,
    `磨刀霍霍！冲分名将【${pl.name}】完成底板换装【${newBlade.name}】`,
    `强化相持！【${pl.name}】启用【${newBlade.name}】力求突破前列`
  ] : [
    `武器升级！年轻选手【${pl.name}】换装进阶底板【${newBlade.name}】`,
    `精进手感！【${pl.name}】新赛季选用【${newBlade.name}】优化出球弧线`,
    `装备进阶！【${pl.name}】完成手板更新【${newBlade.name}】`
  ]);

  // 2. 多样化正文模板
  const contentTemplates = [
    `【器材注册公示】根据国际乒联官方装备最新备案，来自 ${pl.country} 的${rankTag}【${pl.name}】（现世界排名 #${curRank}）已完成主战器材调校，正式更换为【${newBlade.name}】（${tierName}）。\n\n现场技术监测显示，新底板提供了更扎实的持球吃球手感，其综合战力已来到 ${Math.round(computePlayerCombatPower(pl))} 点。`,
    `【探营速递】在备战新赛季的封闭训练中，【${pl.name}】针对前三板落点控制与中远台底劲进行了专项手板调整，最终敲定列装【${newBlade.name}】。\n\n主管教练表示，这款手板与选手的战术风格契合度极高，期待在下站巡回赛中打出全新竞技状态。`,
    `【装备评测志】${pl.country} 选手【${pl.name}】近期告别了旧配置，正式换用【${newBlade.name}】。\n\n技术分析师指出，该款底板在击球形变恢复和速度支撑上提升明显，将有助于其在接下来的高强度对抗中抢占先手。`
  ];

  // 3. 真实多角度球迷热评
  const fanCommentsPool = [
    [
      { author: "器材研究员", text: `换了【${newBlade.name}】吃球更深了，反拉爆冲质量肉眼可见地上升！` },
      { author: "巡回赛观战团", text: `期待【${pl.name}】新赛季拿这块新武器在正赛打出好成绩！` }
    ],
    [
      { author: "弧圈发烧友", text: `【${brandName}】这款手板支撑力很强，非常适合他的打法。` },
      { author: "战术分析师", text: `看来是想重点加强近中台的摆速衔接，这波换装很到位。` }
    ],
    [
      { author: "看台球友", text: `装备微调对职业球员影响很大，就看新配置的实战磨合了！` },
      { author: "名宿评述", text: `底劲更扎实了，关键分变线的时候底气会更足。` }
    ]
  ];

  const pickedTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  const pickedContent = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
  const pickedComments = fanCommentsPool[Math.floor(Math.random() * fanCommentsPool.length)];
  const mediaSources = ["乒乓器材装备志", "《桌球王国》探营", "WTT 装备观察哨", "《乒乓世界》特稿", "欧洲器材实验室"];

  return {
    id: `news_${gameState.player.year}_${gameState.player.week}_gear_${pl.name}_${Date.now()}`,
    week: gameState.player.week,
    year: gameState.player.year,
    category: 'biz',
    isUser: false,
    icon: '🏓',
    source: mediaSources[Math.floor(Math.random() * mediaSources.length)],
    title: pickedTitle,
    snippet: `为优化出球质量与战术表现，${pl.name} 完成主战手板调校，正式列装【${newBlade.name}】。`,
    content: pickedContent,
    comments: pickedComments
  };
}

/* ==================== 3. AI 低概率年度器材更换机制 ==================== */
function checkAIGearUpgrades() {
  (gameState.worldRanking || []).forEach((pl, idx) => {
    if (pl.isUser) return;

    let curRank = idx + 1;
    let pow = pl.basePow || 60;
    let switchChance = 0.08;

    if (curRank <= 15 && (!pl.gear || pl.gear.blade === 'b1' || pl.gear.blade === 'b2')) {
      switchChance = 0.50;
    } else if (curRank <= 80 && pl.gear && ['b1', 'b2', 'b10', 'b3', 'b44'].includes(pl.gear.blade)) {
      switchChance = 0.35;
    }

    if (Math.random() < switchChance) {
      const oldBladeId = pl.gear?.blade;
      assignAIGear(pl, curRank);
      pl.stats = getEffectiveStatsForPlayer(pl);

      const newBlade = (typeof GEAR_DATABASE !== 'undefined' && GEAR_DATABASE.blade) 
        ? GEAR_DATABASE.blade.find(b => b.id === pl.gear.blade) 
        : null;

      if (newBlade && newBlade.id !== oldBladeId) {
        const gearNewsItem = createAIGearChangeNews(pl, oldBladeId, newBlade, curRank);
        if (gearNewsItem) {
          if (!gameState.newsFeed) gameState.newsFeed = [];
          gameState.newsFeed.unshift(gearNewsItem);
        }
      }
    }
  });
}

/* ==================== 真实打法风格相生相克引擎 (分差 <= 5 生效) ==================== */
function getStyleCategory(styleStr) {
  if (!styleStr || typeof styleStr !== 'string') return 'ALLROUND';
  const s = styleStr.toLowerCase();
  if (s.includes('削球') || s.includes('削中反攻') || s.includes('长胶') || s.includes('生胶削')) return 'CHOP';
  if (s.includes('快撕') || s.includes('超强速度') || s.includes('近台快攻') || s.includes('快弧')) return 'SPEED';
  if (s.includes('直拍') || s.includes('推挡') || s.includes('日直') || s.includes('单面拉')) return 'PENHOLD';
  if (s.includes('暴力') || s.includes('重炮') || s.includes('爆冲') || s.includes('大力量') || s.includes('两面弧圈')) return 'POWER';
  if (s.includes('控制') || s.includes('六边形') || s.includes('手感') || s.includes('落点') || s.includes('魔术师')) return 'CONTROL';
  return 'ALLROUND';
}

function getStyleAdvantage(p1Style, p2Style, p1Power, p2Power) {
  const diff = Math.abs(p1Power - p2Power);
  if (diff > 5) return { bonus: 0, reason: '' };

  const cat1 = getStyleCategory(p1Style);
  const cat2 = getStyleCategory(p2Style);
  if (cat1 === cat2) return { bonus: 0, reason: '' };

  const COUNTER_RULES = {
    POWER: { targets: ['CHOP', 'ALLROUND'], reason: '单板质量极高，凭借绝对力量和旋转冲穿防守' },
    SPEED: { targets: ['POWER'], reason: '近台借力极速快撕，压迫引拍空间，不给后撤蓄力时间' },
    PENHOLD: { targets: ['ALLROUND'], reason: '前三板发抢凶狠，台内落点变化隐蔽多变' },
    CHOP: { targets: ['SPEED', 'PENHOLD'], reason: '旋转剧烈多变，顶住快攻攻势，消耗对手体能与急躁心态' },
    CONTROL: { targets: ['SPEED', 'POWER'], reason: '长短节奏变换与刁钻落点，打乱对手发力预判与步法' }
  };

  if (COUNTER_RULES[cat1] && COUNTER_RULES[cat1].targets.includes(cat2)) {
    return { bonus: 3.5, reason: COUNTER_RULES[cat1].reason };
  }
  return { bonus: 0, reason: '' };
}

/* ==================== 粉丝声望阶位与体系 ==================== */
const FAN_TIERS = [
  { min: 2000000, name: "🌍 国际体坛巨星", badge: "badge-smash", desc: "赛场享有极高助威声浪，每周收获巨额周边版税分红" },
  { min: 300000,  name: "👑 国家级偶像",   badge: "badge-gold",  desc: "解锁顶奢商业代言，开启个人签名款特注底板分成" },
  { min: 50000,   name: "🔥 巡回赛红人",   badge: "badge-star",  desc: "商务谈判溢价，客场享有现场声援" },
  { min: 3000,    name: "🌟 地方新锐",     badge: "badge-cont",  desc: "开始获得媒体专访与关注" },
  { min: 0,       name: "🌱 籍籍无名",     badge: "badge-feed",  desc: "初入职业赛场，暂无粉丝特权" }
];

function getPlayerFanTier(fans) {
  const f = fans || 0;
  return FAN_TIERS.find(t => f >= t.min) || FAN_TIERS[FAN_TIERS.length - 1];
}

// 👈 补回该函数：格式化粉丝数量显示（如 1250 -> 1.2k，350000 -> 35.0w）
function formatFanCount(count) {
  const c = count || 0;
  if (c < 1000) return `${c}`;
  if (c >= 10000) return `${(c / 10000).toFixed(1)}w`;
  return `${(c / 1000).toFixed(1)}k`;
}

function addPlayerFans(delta, reason = "") {
  if (!gameState.player) return;
  if (gameState.player.fans === undefined) gameState.player.fans = 200;
  
  const oldTier = getPlayerFanTier(gameState.player.fans).name;
  gameState.player.fans = Math.max(0, Math.round(gameState.player.fans + delta));
  const newTier = getPlayerFanTier(gameState.player.fans).name;

  if (delta > 0 && oldTier !== newTier) {
    showAlert(
      `🎉 <strong>粉丝声望晋级！</strong><br>你的全网粉丝突破至 <strong>${(gameState.player.fans).toLocaleString()}</strong>，正式加冕【<strong style="color:var(--accent-gold);">${newTier}</strong>】！<br><span style="color:var(--text-dim); font-size:0.8rem;">更多顶级商业赞助与赛场助威已解锁。</span>`,
      "声望晋升", "🌟"
    );
  }
}

function recordFanHistoryPoint() {
  const p = gameState.player;
  if (!p.fanHistory) p.fanHistory = [];
  let abs = absWeekIndex(p.week, p.year);
  let fans = p.fans || 200;
  let last = p.fanHistory[p.fanHistory.length - 1];
  if (last && last.abs === abs) {
    last.fans = fans;
  } else {
    p.fanHistory.push({ abs, week: p.week, year: p.year, fans });
  }
  if (p.fanHistory.length > 900) p.fanHistory = p.fanHistory.slice(-900);
}

function recordMoneyHistoryPoint() {
  const p = gameState.player;
  if (!p.moneyHistory) p.moneyHistory = [];
  let abs = absWeekIndex(p.week, p.year);
  let money = p.money || 0;
  let last = p.moneyHistory[p.moneyHistory.length - 1];
  if (last && last.abs === abs) {
    last.money = money;
  } else {
    p.moneyHistory.push({ abs, week: p.week, year: p.year, money });
  }
  if (p.moneyHistory.length > 900) p.moneyHistory = p.moneyHistory.slice(-900);
}