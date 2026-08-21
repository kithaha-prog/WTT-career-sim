/* ==================== 乒乓球世界深度新闻与多维热搜舆论引擎 (Pro Variety Edition) ==================== */

let currentSelectedNewsCategory = 'all';
let currentHeroNewsItem = null;

// 周次与分页控制状态
let selectedNewsViewYear = null;
let selectedNewsViewWeek = null;
let newsCurrentPage = 1;
const NEWS_PAGE_SIZE = 4; // 单周一页固定展示 4 条

// 媒体源库
const MEDIA_SOURCES = [
  "ITTF 官方快讯",
  "WTT 赛事周报",
  "《乒乓世界》独家特稿",
  "法新社 · 巴黎体育",
  "《桌球王国》专栏",
  "路透社体育聚焦",
  "欧洲乒乓观察哨",
  "体坛周报 · 乒羽前沿",
  "乒乓器材装备志",
  "全景乒坛深度访谈"
];

// 1. 50+ 种热搜词条生成模板库
const TRENDING_PATTERNS = [
  (p, c, r) => `${c} 决胜局极限救球反拉名场面`,
  (p, c, r) => `${c} 赛后发布会复盘决胜分战术`,
  (p, c, r) => `${c} 问鼎【${r}】冠军登上热搜`,
  (p, c, r) => `${p.name} 单打世界排名最新变动`,
  (p, c, r) => `${p.name} 训练馆加练暴冲视频流出`,
  (p, c, r) => `${c} 逆旋转发球抢攻得分率高达 80%`,
  (p, c, r) => `新材料球硬度对近台快攻打法的影响讨论`,
  (p, c, r) => `国乒主力新赛季体能储备与负荷管理`,
  (p, c, r) => `直拍横打 vs 横板两面弧圈最新胜率普查`,
  (p, c, r) => `特注蓝海绵灌胶工艺与底板形变奥秘揭秘`,
  (p, c, r) => `乒坛名宿点评：接发球直接拧拉已成超一流标配`,
  (p, c, r) => `欧洲新生代选手正手爆发力为何提升如此迅猛`,
  (p, c, r) => `巡回赛多站并行：二线选手争夺直通资格白热化`,
  (p, c, r) => `乒联球台地胶摩擦力参数调整引选手热议`,
  (p, c, r) => `${c} 赛前挑边热身花絮逗乐全场`,
  (p, c, r) => `双打左右手搭配的跑位盲区如何科学化解`,
  (p, c, r) => `大满贯赛事奖金池再创新高吸引全球眼球`,
  (p, c, r) => `防守型削球打法在新赛历下的生存空间`,
  (p, c, r) => `${p.name} 下一站巡回赛签表对阵预测`,
  (p, c, r) => `关键分暂停时机教练战术布置音频解析`,
  (p, c, r) => `六边形异形底板能否真正扩大甜区面积`,
  (p, c, r) => `国际乒联年度最佳得分候选集锦发布`,
  (p, c, r) => `${c} 赛后将战袍赠予现场小球迷获赞无数`,
  (p, c, r) => `长胶倒板与生胶快拨的现代对抗演变`,
  (p, c, r) => `奥运积分争夺进入冲刺期各队排兵布阵`,
  (p, c, r) => `${p.name} 商业赞助周薪与装备配置大公开`
];

// 2. 红榜（状态爆棚）评语库
const RED_BUZZ_REASONS = [
  "在决赛中展现统治级攻防转换，多拍相持胜率突破 82%！",
  "单周积分暴涨，前三板发抢几乎零失误，战术执行力极强！",
  "近期势头凶悍，中远台反拉爆冲频频上演一击绝杀！",
  "心理素质坚如磐石，连续在决胜局挽救赛点逆转强敌！",
  "近台摆速衔接达到赛季最佳，步法移动轻盈如飞！",
  "新换装底板契合度极高，击球旋转与单板质量跃升明显！",
  "接发球拧拉成功率高达 76%，彻底瓦解对手的发球套路！",
  "体能储备充沛，在密集赛程下依旧保持充沛的击球爆发力！"
];

// 3. 黑榜（状态警报）评语库
const BLACK_BUZZ_REASONS = [
  "受连续出战高负荷影响，体能透支导致移动步法明显迟缓。",
  "关键分非受迫性失误偏多，接发球判断失误率较上周上升 18%。",
  "遭遇身体劳损困扰，侧身发力时受限，急需安排水疗休整！",
  "相持阶段节奏被动，回球弧线偏高屡屡遭到对手抢先上手。",
  "受 52 周滚动积分到期扣除影响，世界排名面临较大保分压力。",
  "前三板控制过于保守，在逆风局中缺乏坚决搏杀的战术调整。",
  "反手快撕连续出现出界失误，击球甜区命中率有所下滑。"
];

// 4. 球迷热评库
const FAN_COMMENTS_VARIETIES = {
  win: [
    "恭喜夺冠！决胜局敢在赛点变直线，这大心脏真的给跪了！",
    "这几板中远台对拉质量太炸裂了，现场看得热血沸腾！",
    "技术全面没有任何短板，这站冠军拿得实至名归！",
    "今年绝对是巅峰期，向三大赛大满贯发起冲击吧！",
    "前三板算得太死了，完全把对手的节奏拆解掉了。"
  ],
  loss: [
    "打得已经非常顽强了，就差一两个运气球，下站继续加油！",
    "决胜局太可惜了，不过亚军积分也很扎实，好好总结！",
    "感觉体能到后半程有点跟不上，回球质量稍微掉了一点点。",
    "战术其实没问题，对手今天临场手感确实太爆棚了。"
  ],
  injury: [
    "千万别带伤硬撑！身体才是职业生涯的本钱，安心养伤！",
    "连续参赛负荷太大了，赶紧好好做做深度水疗和筋膜理疗吧！",
    "期待满血归来！健康永远排在第一位！"
  ],
  training: [
    "这周专项加练正手/反手太对了，赛场上见真章！",
    "训练馆里流的汗水不会白费，战力提升肉眼可见！",
    "科学排期很关键，把体能和技术细节打磨好，下周直接冲！"
  ],
  general: [
    "现在的国际乒坛竞争越来越激烈了，每场对决都像决赛。",
    "器材配置和打法越来越先进，速度和旋转完全拉满了。",
    "双打左右手搭配确实丝滑，两人的补位默契越来越好了！",
    "新一代年轻选手冲击力太强了，前排老将们压力不小啊。"
  ]
};

/* ==================== 智能球员实体解析与国旗超链接渲染器 (仅详情弹窗调用) ==================== */
function formatTextWithPlayerTags(text) {
  if (!text || typeof text !== 'string') return "";

  let html = text;

  let players = [
    ...(gameState.worldRanking || []),
    ...(gameState.retiredPlayers || [])
  ];
  if (gameState.player) players.push(gameState.player);

  let uniqueMap = new Map();
  players.forEach(p => {
    if (p && p.name && !uniqueMap.has(p.name)) {
      uniqueMap.set(p.name, p);
    }
  });

  let sortedPlayers = Array.from(uniqueMap.values()).sort((a, b) => b.name.length - a.name.length);

  // 第一阶段：占位符隔离
  sortedPlayers.forEach(p => {
    if (!p.name || p.name.length < 2) return;
    if (html.includes(p.name)) {
      html = html.split(p.name).join(`___PL_TOKEN_${p.name}___`);
    }
  });

  // 第二阶段：替换为国旗 + 可点击姓名
  sortedPlayers.forEach(p => {
    let token = `___PL_TOKEN_${p.name}___`;
    if (html.includes(token)) {
      let flagHtml = (typeof getFlagImgHtml === 'function') ? getFlagImgHtml(p.country) : '';
      let replacement = `${flagHtml}<span class="player-clickable" onclick="event.stopPropagation(); openPlayerProfileModal('${p.name}')" title="点击查看【${p.name}】选手档案">${p.name}</span>`;
      html = html.split(token).join(replacement);
    }
  });

  return html;
}

/* ==================== 2. 真实比分与赛况动态生成引擎 ==================== */

function generateRealisticMatchBreakdown(finalScoreStr) {
  let winGames = 4, loseGames = 2;
  if (finalScoreStr && finalScoreStr.includes('-')) {
    let parts = finalScoreStr.split('-').map(x => parseInt(x.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      winGames = Math.max(parts[0], parts[1]);
      loseGames = Math.min(parts[0], parts[1]);
    }
  }

  let totalGames = winGames + loseGames;
  let gameScores = [];
  let winCount = 0, loseCount = 0;

  for (let g = 0; g < totalGames; g++) {
    let isWinnerGame = false;
    if (g === totalGames - 1) {
      isWinnerGame = true;
    } else if (winCount < winGames && loseCount < loseGames) {
      isWinnerGame = Math.random() < (winGames / totalGames);
    } else if (winCount < winGames) {
      isWinnerGame = true;
    } else {
      isWinnerGame = false;
    }

    if (isWinnerGame) winCount++; else loseCount++;

    let loserPoints;
    let roll = Math.random();
    if (roll < 0.15) {
      loserPoints = Math.floor(3 + Math.random() * 4);
    } else if (roll < 0.75) {
      loserPoints = Math.floor(7 + Math.random() * 3);
    } else {
      let deuceLoser = 10 + Math.floor(Math.random() * 5);
      loserPoints = deuceLoser;
      let winnerPoints = deuceLoser + 2;
      gameScores.push(isWinnerGame ? `${winnerPoints}-${loserPoints}` : `${loserPoints}-${winnerPoints}`);
      continue;
    }

    gameScores.push(isWinnerGame ? `11-${loserPoints}` : `${loserPoints}-11`);
  }

  return {
    scoreStr: `${winGames}-${loseGames}`,
    winGames: winGames,
    loseGames: loseGames,
    isSweep: (loseGames === 0),
    isDecider: (loseGames === winGames - 1),
    detailStr: `(${gameScores.join(', ')})`
  };
}

function buildDynamicMatchNewsText(champ, runner, evName, matchData) {
  const { scoreStr, detailStr, isSweep, isDecider, winGames } = matchData;

  if (isSweep) {
    const titles = [
      `狂风扫落叶！${champ} 零封横扫 ${runner} 问鼎【${evName}】`,
      `降维打击！${champ} ${scoreStr} 完胜 ${runner} 加冕【${evName}】冠军`,
      `绝对统治力！${champ} 一局未失击溃 ${runner} 称霸【${evName}】`
    ];
    const descs = [
      `在【${evName}】决赛中，${champ} 展现出恐怖的进攻火力，全场未给 ${runner} 任何喘息机会，直落 ${winGames} 局 ${scoreStr} ${detailStr} 强势捧杯！`,
      `整场决赛呈现一边倒态势！${champ} 凭借高质量的前三板发抢与落点完全掌控主动权，以 ${scoreStr} ${detailStr} 干净利落地夺得冠军。`
    ];
    return {
      title: titles[Math.floor(Math.random() * titles.length)],
      snippet: descs[Math.floor(Math.random() * descs.length)]
    };
  }

  if (isDecider) {
    const titles = [
      `惊天逆转！${champ} 决胜局险胜 ${runner} 称霸【${evName}】`,
      `七局极限搏杀！${champ} 苦战绝杀 ${runner} 斩获【${evName}】桂冠`,
      `大心脏决胜！${champ} 鏖战至最后一刻力克 ${runner} 问鼎【${evName}】`
    ];
    const descs = [
      `双方战至最后一局关键分对决！${champ} 在巨大心理压力下敢打敢拼，最终以大比分 ${scoreStr} ${detailStr} 惊险绝杀 ${runner} 夺得冠军！`,
      `这是一场载入巡回赛史册的攻防大战！双方打满全部局数，${champ} 在决胜局上演逆境翻盘，以 ${scoreStr} ${detailStr} 险胜捧起金杯。`
    ];
    return {
      title: titles[Math.floor(Math.random() * titles.length)],
      snippet: descs[Math.floor(Math.random() * descs.length)]
    };
  }

  const titles = [
    `战术压制！${champ} ${scoreStr} 击溃 ${runner} 登顶【${evName}】`,
    `巅峰较量！${champ} 力克强敌 ${runner} 摘得【${evName}】男单金牌`,
    `相持大师！${champ} 展现过硬实力击败 ${runner} 斩获【${evName}】冠军`
  ];
  const descs = [
    `经过数局高强度的攻防拉锯，${champ} 在中远台对拉和相持稳定性上技高一筹，最终以 ${scoreStr} ${detailStr} 战胜 ${runner} 锁定冠军头衔！`,
    `面对 ${runner} 的顽强抵抗，${champ} 及时调整接发球战术，凭借更严密的前三板控制以 ${scoreStr} ${detailStr} 锁定胜局，成功捧杯。`
  ];
  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    snippet: descs[Math.floor(Math.random() * descs.length)]
  };
}

/* ==================== 3. 真实数据提取辅助函数 ==================== */

function getActualWeekTournamentsSummary(year, week) {
  const key = `${year}_${week}`;
  let podiums = (gameState.tournamentPodiums && gameState.tournamentPodiums[key]) ? gameState.tournamentPodiums[key] : {};
  let list = [];

  for (let evId in podiums) {
    let p = podiums[evId];
    if (p && p.champion && p.champion !== '—') {
      list.push({
        id: evId,
        name: p.eventName || "WTT 巡回赛",
        champion: p.champion,
        runnerUp: p.runnerUp || "强敌",
        finalScore: p.score || "4 - 2",
        finalScoreDetails: p.scoreDetails || "(11-9, 11-8, 8-11, 11-7, 11-6)",
        thirds: Array.isArray(p.thirds) ? p.thirds.join('、') : (p.thirds || "四强选手")
      });
    }
  }
  return list;
}

function getRankMovers() {
  let risers = [];
  let fallers = [];

  (gameState.worldRanking || []).forEach((pl, curIdx) => {
    let curRank = curIdx + 1;
    let prevRank = pl.prevRank || curRank;
    let delta = prevRank - curRank;

    if (delta >= 2) {
      risers.push({ player: pl, delta, curRank, prevRank });
    } else if (delta <= -2) {
      fallers.push({ player: pl, delta: Math.abs(delta), curRank, prevRank });
    }
  });

  risers.sort((a, b) => b.delta - a.delta);
  fallers.sort((a, b) => b.delta - a.delta);

  return {
    topRiser: risers[0] || null,
    topFaller: fallers[0] || null
  };
}

/* ==================== 4. 新闻生成主调度器 ==================== */
function generateWeeklyNewsFeed() {
  if (!gameState.newsFeed) gameState.newsFeed = [];

  const p = gameState.player;
  const s = gameState.stats;

  let reportWeek = p.week - 1;
  let reportYear = p.year;
  if (reportWeek < 1) {
    reportWeek = 52;
    reportYear = p.year - 1;
  }

  const rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  const userRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  const rankDelta = (p.prevRank || userRank) - userRank;

  let weeklyBatch = [];

  const actualPodiums = getActualWeekTournamentsSummary(reportYear, reportWeek);
  const rankMovers = getRankMovers();
  const weekPlan = gameState.weeklyPlan || [];

  // 1. 赛事战报 (Match)
  if (actualPodiums.length > 0) {
    actualPodiums.forEach(tour => {
      let isUserChamp = tour.champion.includes(p.name);
      let isUserRunner = tour.runnerUp.includes(p.name);
      let isDoubles = tour.name.includes("双打");
      let shortEventName = tour.name.split('(')[0].replace(/第.*?届/g, '').trim();

      const matchBreakdown = generateRealisticMatchBreakdown(tour.finalScore);
      const newsStory = buildDynamicMatchNewsText(tour.champion, tour.runnerUp, shortEventName, matchBreakdown);

      if (isUserChamp) {
        weeklyBatch.push({
          id: `news_${reportYear}_${reportWeek}_user_champ_${Math.random()}`,
          week: reportWeek, year: reportYear, category: 'match', isUser: true, icon: '🏆',
          source: MEDIA_SOURCES[Math.floor(Math.random() * 3)],
          title: `王者加冕！${p.name} 激战斩获【${shortEventName}】冠军！`,
          snippet: `在刚落幕的 ${shortEventName} 决赛中，${p.name} 鏖战力克 ${tour.runnerUp}（${matchBreakdown.scoreStr} ${matchBreakdown.detailStr}），成功登顶！`,
          content: `【WTT 赛事特快】${reportYear} 赛季第 ${reportWeek} 周传来特大捷报！来自 ${p.country} 的 ${p.name} 在【${tour.name}】决赛中发挥亮眼，以大比分 ${matchBreakdown.scoreStr} ${matchBreakdown.detailStr} 击败强敌【${tour.runnerUp}】成功登顶！\n\n凭借本站冠军丰厚积分入账，${p.name} 的单打世界排名来到世界第 #${userRank} 位！`,
          comments: generateDynamicComments(p.name, "win")
        });
      } else if (isUserRunner) {
        weeklyBatch.push({
          id: `news_${reportYear}_${reportWeek}_user_runner_${Math.random()}`,
          week: reportWeek, year: reportYear, category: 'match', isUser: true, icon: '🥈',
          source: '《乒乓世界》战报',
          title: `憾负摘银！${p.name} 鏖战决赛夺得【${shortEventName}】亚军`,
          snippet: `${p.name} 在决赛中以 ${matchBreakdown.scoreStr} ${matchBreakdown.detailStr} 惜败于 ${tour.champion}，获得本站亚军。`,
          content: `【焦点战报】在【${tour.name}】决赛中，${p.name} 与 ${tour.champion} 联手奉献了一场扣人心弦的攻防拉锯战。虽然最终以 ${matchBreakdown.scoreStr} ${matchBreakdown.detailStr} 惜败，但亚军积分依旧助力其单打世界排名稳步居于世界前列。`,
          comments: generateDynamicComments(p.name, "loss")
        });
      } else {
        weeklyBatch.push({
          id: `news_${reportYear}_${reportWeek}_ai_champ_${Math.random()}`,
          week: reportWeek, year: reportYear, category: 'match', isUser: false, icon: isDoubles ? '👥' : '🏓',
          source: MEDIA_SOURCES[Math.floor(Math.random() * MEDIA_SOURCES.length)],
          title: newsStory.title,
          snippet: newsStory.snippet,
          content: `【巡回赛综述】${reportYear} 年第 ${reportWeek} 周【${tour.name}】圆满收官！\n\n决赛在两名顶尖选手 ${tour.champion} 与 ${tour.runnerUp} 之间展开。整场比赛多拍相持跌宕起伏，最终 ${tour.champion} 以 ${matchBreakdown.scoreStr} ${matchBreakdown.detailStr} 锁定胜局，捧起冠军奖杯。\n\n四强/季军选手：${tour.thirds}。`,
          comments: generateDynamicComments(tour.champion, "win")
        });
      }
    });
  } else {
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_rest_week`,
      week: reportWeek, year: reportYear, category: 'match', isUser: false, icon: '☕',
      source: 'ITTF 赛历简报',
      title: `${reportYear}赛季 第 ${reportWeek} 周：巡回赛休整与国家队封闭集训周`,
      snippet: `本周官方赛历未设正赛，各协会主力队员进入技术动作微调与体能恢复阶段。`,
      content: `【乒坛动态】随着巡回赛阶段性赛程推进，本周各代表队迎来休整集训窗口。选手们纷纷进行技战术复盘与身体养护，为后续的挑战赛与大满贯赛事进行体能储备。`,
      comments: generateDynamicComments("名将", "general")
    });
  }

  // 2. 球员焦点 (Player)
  let trainCounts = {};
  weekPlan.forEach(t => { trainCounts[t] = (trainCounts[t] || 0) + 1; });
  let topTrain = Object.keys(trainCounts).sort((a, b) => trainCounts[b] - trainCounts[a])[0] || 'rest';

  if (p.injury && typeof INJURY_TYPES !== 'undefined' && INJURY_TYPES[p.injury]) {
    const inj = INJURY_TYPES[p.injury];
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_user_injury`,
      week: reportWeek, year: reportYear, category: 'medical', isUser: true, icon: '🏥',
      source: '体坛医疗前线',
      title: `伤情特警：${p.name} 确诊遭遇【${inj.name}】`,
      snippet: `连续参赛导致负荷透支，${p.name} 遭遇伤病困扰，队医团队已制定针对性康复方案。`,
      content: `【随队医疗观察】在近期高强度作战后，选手 ${p.name} 经诊断患有【${inj.name}】（${inj.desc}）。\n\n体能康复专家建议：应在周训练计划中增加“深度康复水疗”排期，确保体能储备回升，避免伤情恶化。`,
      comments: generateDynamicComments(p.name, "injury")
    });
  } else if (topTrain === 'fh') {
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_train_fh`,
      week: reportWeek, year: reportYear, category: 'player', isUser: true, icon: '💥',
      source: '《乒乓技术前沿》',
      title: `重炮出膛！${p.name} 强化正手暴力弧圈特训`,
      snippet: `${p.name} 在本周周计划中密集安排正手暴冲训练，单板杀伤力与前冲弧线质量显著提升。`,
      content: `【训练专栏】目前世界排名 #${userRank} 位的 ${p.name} 正在主管教练指导下进行正手杀伤力强化。\n\n技术分析师指出，通过连续多日的高强度正手大角度拉冲打磨，其正手发力爆发力（${Math.round(p.baseStats.fhPower || 40)}）与侧身抢攻质量已大幅提高。`,
      comments: generateDynamicComments(p.name, "training")
    });
  } else if (topTrain === 'bh') {
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_train_bh`,
      week: reportWeek, year: reportYear, category: 'player', isUser: true, icon: '⚡',
      source: '《乒乓技术前沿》',
      title: `极速反撕！${p.name} 反手快撕与速度衔接取得突破`,
      snippet: `${p.name} 本周针对反手快撕与移速进行了高强度专项训练，近台压迫感进一步增强。`,
      content: `【探营快讯】${p.name} 本周在训练馆加练了台内反手拧拉与反撕相持变线技术。经过特训，其反手速度与防守反击衔接更加流畅，具备了更强烈的先手压制力。`,
      comments: generateDynamicComments(p.name, "training")
    });
  } else if (topTrain === 'rest') {
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_train_rest`,
      week: reportWeek, year: reportYear, category: 'player', isUser: true, icon: '🔋',
      source: '体能与康复周刊',
      title: `满血复活！${p.name} 实施深度水疗调养，体能储备重回高位`,
      snippet: `${p.name} 本周科学安排休养与深度水疗，当前体能恢复至 ${Math.round(p.stamina)}/100。`,
      content: `【体能监测】为应对漫长赛季的连续比赛负荷，${p.name} 团队本周重点安排了水疗理疗与肌肉放松。经过系统调理，身体处于高度健康的竞技状态。`,
      comments: generateDynamicComments(p.name, "training")
    });
  } else {
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_train_allround`,
      week: reportWeek, year: reportYear, category: 'player', isUser: true, icon: '🏃',
      source: '选手个人专栏',
      title: `全能进阶！${p.name} 步法与战术球商稳步精进`,
      snippet: `世界排名第 #${userRank} 位的 ${p.name} 按照 7 天周计划进行全台打磨，综合战斗力达到 ${Math.round(typeof computeUserCombatPower === 'function' ? computeUserCombatPower() : 60)}。`,
      content: `【球员近况】${p.name} 近期训练状态严谨扎实，在步法跑位与相持稳定性上均有明显进步，正以充足准备迎接接下来的巡回赛挑战。`,
      comments: generateDynamicComments(p.name, "training")
    });
  }

  // 3. 双打风云 (Doubles)
  const userPartner = gameState.playerDoubles?.currentPartner;
  if (userPartner) {
    let pairRank = gameState.doublesRanking?.findIndex(x => x.isUserPair);
    let pairRankText = pairRank >= 0 ? `#${pairRank + 1}` : "--";
    let chem = userPartner.chemistry || 70;
    const chemDesc = chem >= 85 ? "心灵相通，场上跑位配合天衣无缝" : (chem >= 70 ? "默契渐入佳境，战术分工明确" : "处于磨合期，正通过实战积累配合经验");

    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_user_doubles`,
      week: reportWeek, year: reportYear, category: 'doubles', isUser: true, icon: '👥',
      source: 'WTT 双打观察哨',
      title: `黄金搭档！${p.name} / ${userPartner.name} 默契度升至 ${chem} 点`,
      snippet: `组合目前双打世界排名位于 ${pairRankText} 位，${chemDesc}。`,
      content: `【双打风云】来自 ${p.country} 的 ${p.name} 与搭档 ${userPartner.name}（${userPartner.country}）展现出极佳的技战术协同。当前组合战绩为 ${userPartner.wins || 0}胜 ${userPartner.losses || 0}负，已斩获 ${userPartner.titles || 0} 座双打桂冠，成为巡回赛签表中的强力组合！`,
      comments: generateDynamicComments(userPartner.name, "general")
    });
  } else {
    const topPairs = gameState.doublesRanking || [];
    const topPair = topPairs[0] || { name: "王楚钦 / 樊振东", points: 7500, chemistry: 95 };
    const secondPair = topPairs[1] || { name: "勒布伦兄弟", points: 6200, chemistry: 90 };

    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_ai_doubles_${Math.random()}`,
      week: reportWeek, year: reportYear, category: 'doubles', isUser: false, icon: '👥',
      source: 'WTT 双打风云榜',
      title: `男双争霸！${topPair.name} 领跑世界第一，${secondPair.name} 紧随其后`,
      snippet: `男双榜首组合 ${topPair.name} 凭借 ${topPair.points} 点积分稳坐王座，各协会强档展开激烈追赶。`,
      content: `【双打深度】最新一期国际乒联双打排名显示，${topPair.name} 凭借默契度 ${topPair.chemistry}/100 的默契协同继续占据榜首。男子双打竞争愈发白热化，各协会强档纷纷重组阵容冲击大赛资格。`,
      comments: generateDynamicComments(topPair.name.split('/')[0], "general")
    });
  }

  // 4. 商业器材 (Biz)
  const gearSponsor = p.sponsors?.gear || (p.sponsor ? p.sponsor : null);
  const bladeId = p.gear?.blade || 'b1';
  const bladeObj = (typeof GEAR_DATABASE !== 'undefined' && GEAR_DATABASE.blade) ? GEAR_DATABASE.blade.find(b => b.id === bladeId) : null;
  const bladeName = bladeObj ? bladeObj.name : "特注专业底板";

  if (gearSponsor) {
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_user_sponsor`,
      week: reportWeek, year: reportYear, category: 'biz', isUser: true, icon: '💼',
      source: '体育商业周刊',
      title: `特注装备护航！${gearSponsor.name} 鼎力支持 ${p.name}`,
      snippet: `作为签约国手，${p.name} 每周享有 $${gearSponsor.weeklyPay || 0} 赞助津贴，主力手板使用【${bladeName}】。`,
      content: `【器材商业观察】知名品牌【${gearSponsor.name}】对旗下签约国手 ${p.name} 的表现给予高度肯定。品牌研发团队表示，已为其手板【${bladeName}】量身调校出击球弧线更长、底劲更充沛的专属配置。`,
      comments: generateDynamicComments(p.name, "general")
    });
  } else {
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_gear_trends_${Math.random()}`,
      week: reportWeek, year: reportYear, category: 'biz', isUser: false, icon: '🛒',
      source: '乒乓器材装备志',
      title: `器材风向标：内置芳碳底板与微孔高粘套胶成为国手主流配置`,
      snippet: `针对新材料球速度衰减快的特点，兼具高弹与持球手感的复合碳素底板受到顶级选手青睐。`,
      content: `【装备评测】最新巡回赛器材普查显示，前 50 名选手中超过 70% 选用外置/内置芳碳底板搭配正手高粘蓝海绵。各大器材商正加快推出全新旗舰产品以满足职业选手对高旋转的需求。`,
      comments: generateDynamicComments("装备专家", "general")
    });
  }

  // 5. 访谈八卦 (Gossip)
  if (rankMovers.topRiser && rankMovers.topRiser.delta >= 2) {
    const r = rankMovers.topRiser;
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_dark_horse`,
      week: reportWeek, year: reportYear, category: 'gossip', isUser: Boolean(r.player.isUser), icon: '🎙️',
      source: '乒坛名宿专栏',
      title: `最大黑马！${r.player.name} 排名狂飙 +${r.delta} 位引发热议`,
      snippet: `来自 ${r.player.country} 的 ${r.player.name} 凭借出色的单周战绩，排名大幅上升至世界第 #${r.curRank} 位。`,
      content: `【名宿锐评】“${r.player.name} 近期的相持节奏非常犀利，单周飙升 ${r.delta} 个名次展现了极强的上升潜力。如果在落点控制上更进一步，完全具备冲击更高级别赛事的实力。”`,
      comments: generateDynamicComments(r.player.name, "general")
    });
  } else {
    const gossipTopics = [
      {
        t: `战术演进：台内反手拧拉（Chiquita）已成超一流选手标配先手`,
        s: `技术统计显示，世界排名前列的名将接发球直接拧拉上手率已高达 64%。`,
        c: `【战术专栏】名宿在专栏中分析：“现代乒乓球对于前三板控制的要求极其苛刻，反手拧拉不仅是抢先发力的手段，更是直接破坏对手发球套路的核心武器。”`,
        src: '欧洲乒乓观察哨'
      },
      {
        t: `体能管理：密集赛历下顶尖名将如何科学规避疲劳与劳损`,
        s: `体能专家指出，52 周多站并行赛程下，合理的周训练水疗休整是保持长久巅峰的关键。`,
        c: `【体能观察】面对漫长巡回赛，合理安排休赛周与深度水疗能有效降低 60% 以上的肌肉拉伤与半月板劳损风险。`,
        src: '体坛健康观察'
      }
    ];
    const picked = gossipTopics[Math.floor(Math.random() * gossipTopics.length)];
    weeklyBatch.push({
      id: `news_${reportYear}_${reportWeek}_gossip_${Math.random()}`,
      week: reportWeek, year: reportYear, category: 'gossip', isUser: false, icon: '🎙️',
      source: picked.src,
      title: picked.t,
      snippet: picked.s,
      content: picked.c,
      comments: generateDynamicComments("名宿解说", "general")
    });
  }

  // 存入全局列表，最多保留最近 120 篇历史新闻
  gameState.newsFeed = [...weeklyBatch, ...gameState.newsFeed].slice(0, 120);

  selectedNewsViewYear = reportYear;
  selectedNewsViewWeek = reportWeek;
  newsCurrentPage = 1;

  renderNewsCenter();
}

/* ==================== 5. 智能热评生成器 ==================== */
function generateDynamicComments(subject, contextType = "general") {
  let cleanName = (subject || "选手").replace(/\s*\(.*?\)/g, '');
  const fans = ["巴黎看球客", "弧圈重炮手", "乒乓球友老张", "近台快攻小将", "名宿解说员", "胶皮达人", "看台加油团", "大满贯追随者"];

  const pool = FAN_COMMENTS_VARIETIES[contextType] || FAN_COMMENTS_VARIETIES.general;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const commenter1 = fans[Math.floor(Math.random() * fans.length)];
  let commenter2 = fans[Math.floor(Math.random() * fans.length)];
  if (commenter2 === commenter1) commenter2 = "资深教练老李";

  return [
    { author: commenter1, text: shuffled[0] },
    { author: commenter2, text: shuffled[1] || `${cleanName} 这几周的表现确实可圈可点，战术执行力很强！` }
  ];
}

/* ==================== 6. 周次切换与分页控制逻辑 ==================== */

function changeNewsViewWeek(delta) {
  const currentActualYear = gameState.player.year || 2026;
  const currentActualWeek = gameState.player.week || 1;

  if (selectedNewsViewYear === null) selectedNewsViewYear = currentActualYear;
  if (selectedNewsViewWeek === null) selectedNewsViewWeek = currentActualWeek;

  let targetWeek = selectedNewsViewWeek + delta;
  let targetYear = selectedNewsViewYear;

  if (targetWeek < 1) {
    if (targetYear > 2026) {
      targetYear -= 1;
      targetWeek = 52;
    } else {
      targetWeek = 1;
    }
  } else if (targetWeek > 52) {
    if (targetYear < currentActualYear) {
      targetYear += 1;
      targetWeek = 1;
    } else {
      targetWeek = 52;
    }
  }

  if (targetYear > currentActualYear || (targetYear === currentActualYear && targetWeek > currentActualWeek)) {
    return;
  }

  selectedNewsViewYear = targetYear;
  selectedNewsViewWeek = targetWeek;
  newsCurrentPage = 1;
  renderNewsCenter();
}

function changeNewsPage(delta) {
  newsCurrentPage += delta;
  renderNewsCenter();
}

/* ==================== 7. 右侧热搜 (Trending) 与 红黑榜 (Power Rank) - 外部纯文本 ==================== */
function renderNewsSidebar() {
  const trendBox = document.getElementById('news-trending-list');
  const buzzBox = document.getElementById('news-buzz-roster');
  if (!trendBox || !buzzBox) return;

  const curYear = gameState.player.year || 2026;
  const curWeek = gameState.player.week || 1;
  const p = gameState.player;
  const rankIdx = gameState.worldRanking.findIndex(x => x.isUser);
  const userRank = rankIdx >= 0 ? rankIdx + 1 : 999;
  const top1 = gameState.worldRanking?.[0]?.name || "王楚钦";

  let reportWeek = curWeek - 1;
  let reportYear = curYear;
  if (reportWeek < 1) { reportWeek = 52; reportYear = curYear - 1; }

  const actualPodiums = getActualWeekTournamentsSummary(reportYear, reportWeek);
  const rankMovers = getRankMovers();

  // 1. 生成 5 条不重复的热搜词条（外部保持纯文本）
  let hotTopics = [];
  let champName = actualPodiums.length > 0 ? actualPodiums[0].champion.split('/')[0].trim() : top1;
  let tourName = actualPodiums.length > 0 ? actualPodiums[0].name.split('(')[0].trim() : "WTT 巡回赛";

  let shuffledPatterns = [...TRENDING_PATTERNS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffledPatterns.length && hotTopics.length < 5; i++) {
    let tag = shuffledPatterns[i](p, champName, tourName);
    if (!hotTopics.some(h => h.tag === tag)) {
      let heatVal = (300 - hotTopics.length * 40 - Math.random() * 20).toFixed(1);
      hotTopics.push({ tag: tag, heat: `${heatVal}w` });
    }
  }

  trendBox.innerHTML = hotTopics.map((item, idx) => `
    <div class="trending-item" onclick="searchTrendKeyword('${item.tag}')">
      <span class="trending-rank ${idx === 0 ? 'top-1' : (idx === 1 ? 'top-2' : (idx === 2 ? 'top-3' : ''))}">${idx + 1}</span>
      <span class="trending-word">${item.tag}</span>
      <span class="trending-heat">${item.heat}</span>
    </div>
  `).join('');

  // 2. 真实计算战力风云红黑榜 (Power Rank - 外部保持纯文本)
  let redPlayerText = "";
  let blackPlayerText = "";

  const randRedReason = RED_BUZZ_REASONS[Math.floor(Math.random() * RED_BUZZ_REASONS.length)];
  const randBlackReason = BLACK_BUZZ_REASONS[Math.floor(Math.random() * BLACK_BUZZ_REASONS.length)];

  if (actualPodiums.length > 0) {
    let cName = actualPodiums[0].champion.split('/')[0].trim();
    redPlayerText = `
      <div class="buzz-card red">
        <div style="font-weight:700; color:#4ade80; margin-bottom:2px;">🔴 状态爆棚：${cName}</div>
        <div style="color:var(--text-dim); font-size:0.72rem;">${randRedReason}</div>
      </div>
    `;
  } else if (rankMovers.topRiser) {
    redPlayerText = `
      <div class="buzz-card red">
        <div style="font-weight:700; color:#4ade80; margin-bottom:2px;">🔴 状态爆棚：${rankMovers.topRiser.player.name}</div>
        <div style="color:var(--text-dim); font-size:0.72rem;">单周排位飙升 +${rankMovers.topRiser.delta} 位，${randRedReason}</div>
      </div>
    `;
  } else {
    redPlayerText = `
      <div class="buzz-card red">
        <div style="font-weight:700; color:#4ade80; margin-bottom:2px;">🔴 状态爆棚：${top1}</div>
        <div style="color:var(--text-dim); font-size:0.72rem;">${randRedReason}</div>
      </div>
    `;
  }

  if (p.injury) {
    let inj = (typeof INJURY_TYPES !== 'undefined' && INJURY_TYPES[p.injury]) ? INJURY_TYPES[p.injury].name : "身体受损";
    blackPlayerText = `
      <div class="buzz-card black">
        <div style="font-weight:700; color:#ff4d5e; margin-bottom:2px;">⚫ 状态警报：${p.name} (我方)</div>
        <div style="color:var(--text-dim); font-size:0.72rem;">遭遇【${inj}】，体能储备处于低位，急需安排水疗休养！</div>
      </div>
    `;
  } else if (rankMovers.topFaller) {
    blackPlayerText = `
      <div class="buzz-card black">
        <div style="font-weight:700; color:#ff4d5e; margin-bottom:2px;">⚫ 状态警报：${rankMovers.topFaller.player.name}</div>
        <div style="color:var(--text-dim); font-size:0.72rem;">单周排名下滑 ${rankMovers.topFaller.delta} 位，${randBlackReason}</div>
      </div>
    `;
  } else {
    let tiredPlayer = (gameState.worldRanking || []).find(x => !x.isUser && x.injury && x.injury !== '健康') || gameState.worldRanking?.[gameState.worldRanking.length - 1];
    blackPlayerText = `
      <div class="buzz-card black">
        <div style="font-weight:700; color:#ff4d5e; margin-bottom:2px;">⚫ 状态警报：${tiredPlayer?.name || "老将选手"}</div>
        <div style="color:var(--text-dim); font-size:0.72rem;">${randBlackReason}</div>
      </div>
    `;
  }

  buzzBox.innerHTML = redPlayerText + blackPlayerText;
}

/* ==================== 8. 前端渲染核心 (外部展示纯文本，点击卡片进弹窗才渲染国旗与档案) ==================== */
function renderNewsCenter() {
  if (!gameState.newsFeed || gameState.newsFeed.length === 0) {
    generateWeeklyNewsFeed();
    return;
  }

  const currentActualYear = gameState.player.year || 2026;
  const currentActualWeek = gameState.player.week || 1;

  if (selectedNewsViewYear === null) selectedNewsViewYear = currentActualYear;
  if (selectedNewsViewWeek === null) {
    selectedNewsViewWeek = currentActualWeek > 1 ? currentActualWeek - 1 : 1;
  }

  // 1. 更新顶部周次胶囊与按钮禁用状态
  const weekLabelEl = document.getElementById('news-view-week-label');
  const prevBtn = document.getElementById('btn-news-prev-week');
  const nextBtn = document.getElementById('btn-news-next-week');

  if (weekLabelEl) {
    weekLabelEl.innerText = `${selectedNewsViewYear}年 第${selectedNewsViewWeek}周`;
  }
  if (prevBtn) {
    prevBtn.disabled = (selectedNewsViewYear === 2026 && selectedNewsViewWeek <= 1);
  }
  if (nextBtn) {
    nextBtn.disabled = (selectedNewsViewYear === currentActualYear && selectedNewsViewWeek >= currentActualWeek);
  }

  // 2. 置顶焦点卡片 (外部纯文本，不挂载国旗与内部点击)
  const heroContainer = document.getElementById('news-hero-banner');
  if (heroContainer) {
    const weekFeed = gameState.newsFeed.filter(n => n.year === selectedNewsViewYear && n.week === selectedNewsViewWeek);
    const heroItem = weekFeed.find(n => n.isUser) || weekFeed[0] || gameState.newsFeed.find(n => n.isUser) || gameState.newsFeed[0];
    currentHeroNewsItem = heroItem;

    if (heroItem) {
      heroContainer.innerHTML = `
        <div class="news-hero-tag">${heroItem.isUser ? '★ 焦点主角' : '🔥 核心头条'}</div>
        <div class="news-hero-title">${heroItem.title}</div>
        <div class="news-hero-desc">${heroItem.snippet}</div>
      `;
    }
  }

  // 3. 过滤出【选定年份 + 选定周次 + 选定分类】的新闻数据
  let filtered = gameState.newsFeed.filter(n => n.year === selectedNewsViewYear && n.week === selectedNewsViewWeek);
  if (currentSelectedNewsCategory !== 'all') {
    filtered = filtered.filter(n => n.category === currentSelectedNewsCategory);
  }

  const listContainer = document.getElementById('news-feed-container');
  const paginationContainer = document.getElementById('news-pagination-container');

  if (!listContainer) return;

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align:center; padding:40px 10px; color:var(--text-dim); background:rgba(0,0,0,0.2); border-radius:12px; border:1px dashed var(--border);">
        <div style="font-size:2rem; margin-bottom:6px;">📰</div>
        <div>${selectedNewsViewYear}年 第${selectedNewsViewWeek}周 该分类下暂无报道</div>
        <div style="font-size:0.75rem; margin-top:4px;">可点击上方 ◀ ▶ 切换周次，或选择「🌐 全部热点」查看全部快讯。</div>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    renderNewsSidebar();
    return;
  }

  // 4. 分页切片 (每页展示 4 条，外部保持纯文本)
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / NEWS_PAGE_SIZE);
  newsCurrentPage = Math.max(1, Math.min(newsCurrentPage, totalPages));

  const startIndex = (newsCurrentPage - 1) * NEWS_PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + NEWS_PAGE_SIZE);

  listContainer.innerHTML = pageItems.map(item => `
    <div class="news-feed-card ${item.isUser ? 'user-related' : ''}" onclick="openNewsDetailModal('${item.id}')">
      <div class="news-feed-icon-box">${item.icon || '📰'}</div>
      <div class="news-feed-content">
        <div class="news-feed-top-row">
          <span class="news-feed-source">${item.source}</span>
          <span class="news-feed-time">${item.year}年 第${item.week}周</span>
        </div>
        <div class="news-feed-title">${item.title}</div>
        <div class="news-feed-snippet">${item.snippet}</div>
      </div>
    </div>
  `).join('');

  // 5. 渲染底部翻页器
  if (paginationContainer) {
    paginationContainer.innerHTML = `
      <button class="news-page-btn" ${newsCurrentPage <= 1 ? 'disabled' : ''} onclick="changeNewsPage(-1)">◀ 上一页</button>
      <span class="news-page-info">第 ${newsCurrentPage} / ${totalPages} 页 (本周共 ${totalItems} 篇)</span>
      <button class="news-page-btn" ${newsCurrentPage >= totalPages ? 'disabled' : ''} onclick="changeNewsPage(1)">下一页 ▶</button>
    `;
  }

  // 6. 刷新右侧热搜与红黑榜
  renderNewsSidebar();
}

function filterNewsCategory(cat) {
  currentSelectedNewsCategory = cat;
  newsCurrentPage = 1;
  document.querySelectorAll('.news-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(`'${cat}'`));
  });
  renderNewsCenter();
}

function openNewsDetailFromHero() {
  if (currentHeroNewsItem) {
    openNewsDetailModal(currentHeroNewsItem.id);
  }
}

/* ==================== 9. 新闻详情弹窗 (在此处点开后才渲染国旗与点击查看档案) ==================== */
function openNewsDetailModal(newsId) {
  const item = (gameState.newsFeed || []).find(n => n.id === newsId);
  if (!item) return;

  document.getElementById('news-modal-source').innerText = item.source || 'WTT 独家特稿';
  // 👈 点开之后标题渲染国旗与档案点击
  document.getElementById('news-modal-title').innerHTML = formatTextWithPlayerTags(item.title);
  document.getElementById('news-modal-date').innerText = `${item.year}赛季 · 第 ${item.week} 周`;
  document.getElementById('news-modal-reads').innerText = `阅读量 ${Math.floor(18 + Math.random() * 75)}.${Math.floor(Math.random() * 9)}w`;
  // 👈 点开之后正文渲染国旗与档案点击
  document.getElementById('news-modal-body').innerHTML = formatTextWithPlayerTags(item.content);

  const commentsContainer = document.getElementById('news-modal-comments');
  const comments = item.comments || generateDynamicComments(gameState.player.name, "general");
  commentsContainer.innerHTML = comments.map(c => `
    <div class="comment-bubble">
      <div class="comment-author">@${c.author}</div>
      <div style="color:#e2e8f0; margin-top:2px;">${formatTextWithPlayerTags(c.text)}</div>
    </div>
  `).join('');

  document.getElementById('news-detail-modal').style.display = 'flex';
}

function closeNewsDetailModal() {
  document.getElementById('news-detail-modal').style.display = 'none';
}

function searchTrendKeyword(kw) {
  showAlert(`🔍 正在为您检索热搜词条：【${kw}】的赛场深度评述与全网讨论！`, "乒坛热搜", "🔥");
}