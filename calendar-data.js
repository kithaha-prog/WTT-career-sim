const FEEDER_CITY_POOL = ["曼谷","开罗","贝尔格莱德","蒙特雷","利马","约翰内斯堡","克拉科夫","雅加达",
  "索菲亚","科威特城","那不勒斯","釜山","天津","布拉迪斯拉发","波尔图","卡萨布兰卡","里斯本","内比都",
  "多哈第二","名古屋","新德里","布达佩斯","的里雅斯特","蒙特利尔"];


const BASE_CALENDAR_EVENTS = {
    1: { name: "WTT 支线赛 杜哈站 (Feeder Doha)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    2: { name: "WTT 球星挑战赛 杜哈站 (Star Contender Doha)", type: "Star Contender", level: "badge-star", points: 600, drawSize: 32, directCut: 32, qualiCut: 100, maxRank: 1, prize: 15000 },
    3: { name: "WTT 常规挑战赛 马斯喀特站 (Contender Muscat)", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 60, qualiCut: 150, maxRank: 20, prize: 8000 },
    4: { name: "国家队常规集训与体能储备周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    5: { name: "ITTF 洲际杯赛 (Continental Cup)", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 50, qualiCut: 90, maxRank: 1, prize: 10000 },
    6: { name: "WTT 支线赛 杜塞尔多夫站 (Feeder Düsseldorf)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    7: { name: "WTT 球星挑战赛 钦奈站 (Star Contender Chennai)", type: "Star Contender", level: "badge-star", points: 600, drawSize: 32, directCut: 32, qualiCut: 100, maxRank: 1, prize: 15000 },
    8: { name: "WTT 新加坡大满贯 (Singapore Smash) 🇸🇬", type: "Grand Smash", level: "badge-smash", points: 2000, drawSize: 64, directCut: 48, qualiCut: 120, maxRank: 1, prize: 70000 },
    9: { name: "新加坡大满贯 后半程决胜周", type: "Grand Smash", level: "badge-smash", points: 2000, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    10: { name: "WTT 支线赛 奥托切克站 (Feeder Otocec)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    11: { name: "WTT 冠军赛 重庆站 (Champions Chongqing) 🇨🇳", type: "Champions", level: "badge-champ", points: 1000, drawSize: 32, directCut: 32, qualiCut: 32, maxRank: 1, prize: 35000 },
    12: { name: "WTT 常规挑战赛 突尼斯站 (Contender Tunis)", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 60, qualiCut: 150, maxRank: 20, prize: 8000 },
    13: { name: "常规调整恢复周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    14: { name: "WTT 冠军赛 仁川站 (Champions Incheon) 🇰🇷", type: "Champions", level: "badge-champ", points: 1000, drawSize: 32, directCut: 32, qualiCut: 32, maxRank: 1, prize: 35000 },
    15: { name: "WTT 常规挑战赛 太原站 (Contender Taiyuan)", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 60, qualiCut: 150, maxRank: 20, prize: 8000 },
    17: { name: "WTT 支线赛 塞内茨站 (Feeder Senec)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    18: { name: "国家队封闭集训周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    20: { name: "WTT 常规挑战赛 里约站 (Contender Rio)", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 60, qualiCut: 150, maxRank: 20, prize: 8000 },
    21: { name: "WTT 常规挑战赛 拉各斯站 (Contender Lagos)", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 60, qualiCut: 150, maxRank: 20, prize: 8000 },
    22: { name: "WTT 支线赛 哈维若夫站 (Feeder Havirov)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    23: { name: "WTT 常规挑战赛 萨格勒布站 (Contender Zagreb)", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 60, qualiCut: 150, maxRank: 20, prize: 8000 },
    24: { name: "WTT 球星挑战赛 卢布尔雅那站 (Star Contender)", type: "Star Contender", level: "badge-star", points: 600, drawSize: 32, directCut: 32, qualiCut: 100, maxRank: 1, prize: 15000 },
    25: { name: "季中战术演练周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    26: { name: "WTT 美国大满贯 (US Smash - Las Vegas) 🇺🇸", type: "Grand Smash", level: "badge-smash", points: 2000, drawSize: 64, directCut: 48, qualiCut: 120, maxRank: 1, prize: 70000 },
    27: { name: "美国大满贯 决胜周", type: "Grand Smash", level: "badge-smash", points: 2000, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    28: { name: "WTT 支线赛 帕纳久里什泰站 (Feeder Bulgaria)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    29: { name: "WTT 球星挑战赛 圣保罗站 (Star Contender Brazil)", type: "Star Contender", level: "badge-star", points: 600, drawSize: 32, directCut: 32, qualiCut: 100, maxRank: 1, prize: 15000 },
    30: { name: "WTT 支线赛 奥洛穆茨站 (Feeder Olomouc)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    31: { name: "WTT 冠军赛 横滨站 (Champions Yokohama) 🇯🇵", type: "Champions", level: "badge-champ", points: 1000, drawSize: 32, directCut: 32, qualiCut: 32, maxRank: 1, prize: 35000 },
    32: { name: "WTT 欧洲大满贯 瑞典站 (Europe Smash) 🇸🇪", type: "Grand Smash", level: "badge-smash", points: 2000, drawSize: 64, directCut: 48, qualiCut: 120, maxRank: 1, prize: 70000 },
    33: { name: "WTT 常规挑战赛 阿拉木图站 (Contender Almaty)", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 60, qualiCut: 150, maxRank: 20, prize: 8000 },
    34: { name: "秋季调整训练周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    35: { name: "WTT 冠军赛 澳门站 (Champions Macao) 🇲🇴", type: "Champions", level: "badge-champ", points: 1000, drawSize: 32, directCut: 32, qualiCut: 32, maxRank: 1, prize: 35000 },
    36: { name: "WTT 支线赛 普里什蒂纳站 (Feeder Prishtina)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    37: { name: "WTT 中国大满贯 北京站 (China Smash) 🇨🇳", type: "Grand Smash", level: "badge-smash", points: 2000, drawSize: 64, directCut: 48, qualiCut: 120, maxRank: 1, prize: 75000 },
    38: { name: "中国大满贯 决战周", type: "Grand Smash", level: "badge-smash", points: 2000, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    39: { name: "常规对抗训练周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    40: { name: "ITTF 洲际锦标赛 (Asian/Euro Championships)", type: "Continental", level: "badge-cont", points: 500, drawSize: 32, directCut: 80, qualiCut: 150, maxRank: 1, prize: 10000 },
    41: { name: "WTT 冠军赛 蒙彼利埃站 (Champions Montpellier) 🇫🇷", type: "Champions", level: "badge-champ", points: 1000, drawSize: 32, directCut: 32, qualiCut: 32, maxRank: 1, prize: 35000 },
    42: { name: "WTT 常规挑战赛 马斯喀特第二站", type: "Contender", level: "badge-cont", points: 500, drawSize: 32, directCut: 60, qualiCut: 150, maxRank: 20, prize: 8000 },
    43: { name: "WTT 冠军赛 法兰克福站 (Champions Frankfurt) 🇩🇪", type: "Champions", level: "badge-champ", points: 1000, drawSize: 32, directCut: 32, qualiCut: 32, maxRank: 1, prize: 35000 },
    44: { name: "WTT 支线赛 帕尔马站 (Feeder Parma)", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    45: { name: "WTT 支线赛 杜塞尔多夫第二站", type: "Feeder", level: "badge-feed", points: 125, drawSize: 32, directCut: 300, qualiCut: 500, maxRank: 33, prize: 3000 },
    46: { name: "WTT 年终总决赛冲刺周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    47: { name: "WTT 年终总决赛 福冈站 (WTT Finals) 🔥", type: "Finals", level: "badge-smash", points: 1500, drawSize: 16, directCut: 16, qualiCut: 16, maxRank: 1, prize: 65000 },
    48: { 
          name: "ITTF 团体世界杯 (Men Team World Cup) 🏆", 
          type: "Men Team World Cup",             // 或者设为 "Mixed Team World Cup"
          level: "badge-smash", 
          points: 1000, 
          drawSize: 16,                  // 团体赛正赛队伍规模（推荐16支代表队）
          directCut: 16, 
          qualiCut: 32, 
          maxRank: 1, 
          prize: 40000 
        },
    49: { name: "冬训特训周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    50: { name: "乒超 / 欧洲职业俱乐部联赛周", type: "League", level: "badge", points: 100, drawSize: 16, directCut: 150, qualiCut: 200, maxRank: 1, prize: 16000 },
    51: { name: "赛季年度体能总储备周", type: "Training", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 },
    52: { name: "赛季盘点与休赛度假周", type: "Vacation", level: "badge", points: 0, drawSize: 0, directCut: 999, qualiCut: 999, maxRank: 999, prize: 0 }
  };




