// 修正并补充 gears-data.js
const GEAR_DATABASE = {
  blade: [
    { id: 'b1', name: '红双喜4星成品底板', tier: '1', price: '0', rankReq: '999', speed: 1,spin: 2, control: 1},
    { id: 'b2', name: '五层纯木复刻底板', tier: '1', price: '0', rankReq: '999', speed: 2,spin: 1, control: 1},
    { id: 'b10', name: '729 黑软碳', tier: '2', price: '1035', rankReq: '500', sponsorBrand: '729 (友谊)', speed: 4.55,spin: 3.55, control: 3.5},
    { id: 'b11', name: '729 L-5 郝帅', tier: '2', price: '1035', rankReq: '500', sponsorBrand: '729 (友谊)', speed: 4.3,spin: 3.9, control: 3},
    { id: 'b12', name: '729 黄芳碳', tier: '2', price: '1035', rankReq: '500', sponsorBrand: '729 (友谊)', speed: 4.1,spin: 3.95, control: 3.15},
    { id: 'b13', name: '729 蓝芳碳', tier: '2', price: '900', rankReq: '500', sponsorBrand: '729 (友谊)', speed: 4.85,spin: 3.7, control: 3.55},
    { id: 'b14', name: '729 王朝桧木', tier: '2', price: '825', rankReq: '500', sponsorBrand: '729 (友谊)', speed: 4.25,spin: 4.3, control: 2.7},
    { id: 'b17', name: '岸度 动能探索者 OFF+', tier: '2', price: '1170', rankReq: '500', sponsorBrand: '岸度 (Andro)', speed: 4.6,spin: 3.4, control: 3.45},
    { id: 'b3', name: '雷神 K1', tier: '2', price: '510', rankReq: '500', sponsorBrand: '雷神 (LOKI)', speed: 3.25,spin: 4.25, control: 2.75},
    { id: 'b4', name: '雷神 K5内置', tier: '2', price: '900', rankReq: '500', sponsorBrand: '雷神 (LOKI)', speed: 4.35,spin: 3.8, control: 3.5},
    { id: 'b44', name: '红双喜 劲极7', tier: '2', price: '1140', rankReq: '500', sponsorBrand: '红双喜 (DHS)', speed: 4.25,spin: 3.5, control: 3.5},
    { id: 'b5', name: '雷神 K5外置', tier: '2', price: '900', rankReq: '500', sponsorBrand: '雷神 (LOKI)', speed: 4.25,spin: 3.6, control: 4},
    { id: 'b8', name: '雷神 锐龙7 Pro', tier: '2', price: '1200', rankReq: '450', sponsorBrand: '雷神 (LOKI)', speed: 4.4,spin: 3.55, control: 4.05},
    { id: 'b9', name: '雷神 锐龙9 Pro', tier: '2', price: '1290', rankReq: '450', sponsorBrand: '雷神 (LOKI)', speed: 4.4,spin: 3.55, control: 4},
    { id: 'b15', name: '729 黑檀7', tier: '3', price: '2190', rankReq: '300', sponsorBrand: '729 (友谊)', speed: 5.23,spin: 4, control: 3.89},
    { id: 'b29', name: '蝴蝶 内置ZLC', tier: '3', price: '6330', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 4.84,spin: 4.17, control: 3.89},
    { id: 'b30', name: '蝴蝶 外置ZLC', tier: '3', price: '6330', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5,spin: 3.84, control: 4.84},
    { id: 'b31', name: '蝴蝶 樊振东ALC', tier: '3', price: '4770', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 4.89,spin: 4.17, control: 4.06},
    { id: 'b32', name: '蝴蝶 弗雷塔斯ALC', tier: '3', price: '4770', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.23,spin: 3.95, control: 4.45},
    { id: 'b33', name: '蝴蝶 张本ALC', tier: '3', price: '4770', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5,spin: 4.45, control: 4.28},
    { id: 'b34', name: '蝴蝶 奥恰ALC', tier: '3', price: '4770', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 4.78,spin: 4.45, control: 3.89},
    { id: 'b35', name: '蝴蝶 波尔ALC', tier: '3', price: '4770', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.23,spin: 4.17, control: 4.5},
    { id: 'b36', name: '蝴蝶 维斯', tier: '3', price: '4770', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 4.84,spin: 3.45, control: 4.34},
    { id: 'b37', name: '蝴蝶 张继科ALC', tier: '3', price: '4770', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.23,spin: 3.56, control: 4.45},
    { id: 'b38', name: '蝴蝶 科贝尔纯木 (日版)', tier: '3', price: '2550', rankReq: '500', sponsorBrand: '蝴蝶 (Butterfly)', speed: 4.73,spin: 4.23, control: 3.34},
    { id: 'b43', name: '红双喜 博芳碳', tier: '3', price: '2160', rankReq: '150', sponsorBrand: '红双喜 (DHS)', speed: 5.17,spin: 3.89, control: 4.73},
    { id: 'b6', name: '雷神 LJK ALC', tier: '3', price: '3600', rankReq: '150', sponsorBrand: '雷神 (LOKI)', speed: 4.95,spin: 3.95, control: 4.45},
    { id: 'b16', name: '岸度 TP_LIGNA  玄武岩内置', tier: '4', price: '4950', rankReq: '80', sponsorBrand: '岸度 (Andro)', speed: 5.13,spin: 5.32, control: 4.07},
    { id: 'b18', name: '蝴蝶 波尔30周年', tier: '4', price: '14220', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.82,spin: 4.5, control: 4.88},
    { id: 'b19', name: '蝴蝶 樊振东SZLC', tier: '4', price: '10320', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.82,spin: 3.88, control: 5.94},
    { id: 'b20', name: '蝴蝶 张本SZLC', tier: '4', price: '10320', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 6,spin: 4.13, control: 5.32},
    { id: 'b21', name: '蝴蝶 林昀儒SZLC', tier: '4', price: '10320', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.82,spin: 3.94, control: 5.75},
    { id: 'b22', name: '蝴蝶 水谷SZLC', tier: '4', price: '10320', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.88,spin: 3.94, control: 5.5},
    { id: 'b23', name: '蝴蝶 樊振东ZLC', tier: '4', price: '6960', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.38,spin: 4.25, control: 4.5},
    { id: 'b24', name: '蝴蝶 弗朗西斯卡ZLC', tier: '4', price: '6960', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.5,spin: 4.88, control: 5.13},
    { id: 'b25', name: '蝴蝶 张本ZLC', tier: '4', price: '6960', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.5,spin: 4.5, control: 4.75},
    { id: 'b26', name: '蝴蝶 超级维斯ALC', tier: '4', price: '6960', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.75,spin: 4.13, control: 5.13},
    { id: 'b27', name: '蝴蝶 樊振东SALC', tier: '4', price: '6450', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.5,spin: 4.38, control: 4.88},
    { id: 'b28', name: '蝴蝶 张本SALC', tier: '4', price: '6450', rankReq: '80', sponsorBrand: '蝴蝶 (Butterfly)', speed: 5.88,spin: 4.69, control: 5.13},
    { id: 'b39', name: '红双喜 龙5 W968S', tier: '4', price: '13620', rankReq: '80', sponsorBrand: '红双喜 (DHS)', speed: 5.75,spin: 4.69, control: 5.32},
    { id: 'b40', name: '红双喜 Q968', tier: '4', price: '12630', rankReq: '80', sponsorBrand: '红双喜 (DHS)', speed: 5.44,spin: 4.88, control: 3.63},
    { id: 'b41', name: '红双喜 龙5X', tier: '4', price: '12630', rankReq: '80', sponsorBrand: '红双喜 (DHS)', speed: 5.88,spin: 4.44, control: 5},
    { id: 'b42', name: '红双喜 W968 金满贯', tier: '4', price: '9990', rankReq: '80', sponsorBrand: '红双喜 (DHS)', speed: 5.82,spin: 4.07, control: 5.07},
    { id: 'b7', name: '雷神 LJK ALC 粉特注', tier: '4', price: '5400', rankReq: '80', sponsorBrand: '雷神 (LOKI)', speed: 5.5,spin: 4.5, control: 5.25},
  ],
  fh: [
    // T1 入门
    { id: 'f1', name: '入门训练正手套胶', tier: 1, price: 0, rankReq: 999, speed: 4, spin: 5, control: 6 },
    { id: 'f2', name: '俱乐部普及正手套胶', tier: 1, price: 0, rankReq: 999, speed: 5, spin: 6, control: 7 },
    
    // T2 进阶
    { id: 'f3', name: '红双喜 普狂3 (经典粘性)', tier: 2, price: 550, rankReq: 999, sponsorBrand: '红双喜 (DHS)', speed: 8, spin: 12, control: 10 },
    { id: 'f4', name: '亚萨卡 Rakza Z Extra Hard', tier: 2, price: 850, rankReq: 999, sponsorBrand: '亚萨卡 (Yasaka)', speed: 11, spin: 14, control: 10 },
    { id: 'f5', name: '多尼克 蓝火 BlueGrip C2', tier: 2, price: 800, rankReq: 999, sponsorBrand: '多尼克 (DONIC)', speed: 12, spin: 13, control: 9 },
    { id: 'f13', name: '银河 月球速度型 (Moon Speed)', tier: 2, price: 480, rankReq: 999, sponsorBrand: '银河 (YINHE)', speed: 9, spin: 9, control: 11 },

    // T3 专业
    { id: 'f14', name: '红双喜 省狂3 (橙海绵 40度)', tier: 3, price: 1800, rankReq: 999, sponsorBrand: '红双喜 (DHS)', speed: 11, spin: 14, control: 10 },
    { id: 'f6', name: '红双喜 狂飚8 (高弹粘性)', tier: 3, price: 2600, rankReq: 999, sponsorBrand: '红双喜 (DHS)', speed: 11, spin: 12, control: 11 },
    { id: 'f7', name: '骄猛 唯佳中国 Omega VII Pro', tier: 3, price: 2900, rankReq: 999, sponsorBrand: '骄猛 (XIOM)', speed: 13, spin: 12, control: 9 },
    { id: 'f8', name: '尼塔谷 Fastarc G-1 (爆冲之选)', tier: 3, price: 3200, rankReq: 999, sponsorBrand: '尼塔谷 (Nittaku)', speed: 12, spin: 13, control: 10 },
    { id: 'f9', name: '挺拔 变革 Evolution MX-P', tier: 3, price: 3400, rankReq: 999, sponsorBrand: '挺拔 (TIBHAR)', speed: 13, spin: 11, control: 9 },
    { id: 'f15', name: '岸度 黑超 Rasanter R48', tier: 3, price: 3100, rankReq: 999, sponsorBrand: '岸度 (andro)', speed: 13, spin: 12, control: 9 },

    // T4 顶尖·国手御用
    { id: 'f16', name: '红双喜 国狂3 (蓝海绵41度 国手专供)', tier: 4, price: 7500, rankReq: 999, sponsorBrand: '红双喜 (DHS)', speed: 12, spin: 16, control: 10 },
    { id: 'f17', name: '蝴蝶 Rozena (罗泽纳-全能型)', tier: 4, price: 5500, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', speed: 11, spin: 12, control: 12 },
    { id: 'f11', name: '蝴蝶 Tenergy 05 Hard (重炮涩套)', tier: 4, price: 8600, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', speed: 14, spin: 13, control: 8 },
    { id: 'f10', name: '蝴蝶 Dignics 09C (粘性微孔·马龙同款)', tier: 4, price: 9200, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', speed: 13, spin: 15, control: 11 },
    { id: 'f18', name: '蝴蝶 Dignics 05 (旗舰极速爆冲)', tier: 4, price: 9500, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', speed: 15, spin: 14, control: 9 },
    { id: 'f12', name: 'VICTAS Triple Double Extra', tier: 4, price: 8800, rankReq: 999, sponsorBrand: 'VICTAS', speed: 13, spin: 13, control: 8 },
    { id: 'f19', name: '挺拔 变革 MX-D 国手定制旗舰', tier: 4, price: 8900, rankReq: 999, sponsorBrand: '挺拔 (TIBHAR)', speed: 14, spin: 14, control: 10 }
  ],
  bh: [
    // T1 入门
    { id: 'bh1', name: '入门训练反手套胶', tier: 1, price: 0, rankReq: 999, speed: 4, spin: 4, control: 6 },
    { id: 'bh2', name: '俱乐部普及反手套胶', tier: 1, price: 0, rankReq: 999, speed: 5, spin: 5, control: 7 },
    
    // T2 进阶
    { id: 'bh3', name: '亚萨卡 Rakza 7 (柔和均衡反手)', tier: 2, price: 750, rankReq: 999, sponsorBrand: '亚萨卡 (Yasaka)', speed: 10, spin: 11, control: 14 },
    { id: 'bh4', name: '尼塔谷 Fastarc C-1 (控球稳定)', tier: 2, price: 800, rankReq: 999, sponsorBrand: '尼塔谷 (Nittaku)', speed: 10, spin: 11, control: 13 },
    { id: 'bh5', name: '骄猛 红V (Vega Europe)', tier: 2, price: 820, rankReq: 999, sponsorBrand: '骄猛 (XIOM)', speed: 10, spin: 9, control: 14 },
    { id: 'bh13', name: '多尼克 F1 (经典极速反手)', tier: 2, price: 680, rankReq: 999, sponsorBrand: '多尼克 (DONIC)', speed: 11, spin: 8, control: 12 },

    // T3 专业
    { id: 'bh6', name: '挺拔 变革 Evolution EL-P', tier: 3, price: 2600, rankReq: 999, sponsorBrand: '挺拔 (TIBHAR)', speed: 12, spin: 11, control: 11 },
    { id: 'bh7', name: '红双喜 狂飚3-50 (柔性海绵)', tier: 3, price: 2800, rankReq: 999, sponsorBrand: '红双喜 (DHS)', speed: 9, spin: 13, control: 12 },
    { id: 'bh8', name: '多尼克 蓝斑 Bluestorm Z2', tier: 3, price: 3100, rankReq: 999, sponsorBrand: '多尼克 (DONIC)', speed: 13, spin: 11, control: 10 },
    { id: 'bh9', name: 'VICTAS V>15 Extra (全面平衡)', tier: 3, price: 3400, rankReq: 999, sponsorBrand: 'VICTAS', speed: 13, spin: 12, control: 10 },
    { id: 'bh14', name: '挺拔 K1 Plus (粘性德套反手)', tier: 3, price: 2900, rankReq: 999, sponsorBrand: '挺拔 (TIBHAR)', speed: 11, spin: 12, control: 12 },

    // T4 顶尖·国手御用
    { id: 'bh15', name: '蝴蝶 Tenergy 64 (极速弹击)', tier: 4, price: 8200, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', speed: 15, spin: 10, control: 9 },
    { id: 'bh16', name: '蝴蝶 Tenergy 05 (反手弧圈王)', tier: 4, price: 8600, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', speed: 13, spin: 14, control: 10 },
    { id: 'bh17', name: '蝴蝶 Dignics 80 (全能均衡旗舰)', tier: 4, price: 9200, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', speed: 14, spin: 13, control: 11 },
    { id: 'bh10', name: '蝴蝶 Dignics 05 (顶级反手反弹·樊振东同款)', tier: 4, price: 9600, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', speed: 15, spin: 13, control: 10 },
    { id: 'bh12', name: '斯帝卡 DNA Platinum XH', tier: 4, price: 8900, rankReq: 999, sponsorBrand: '斯帝卡 (STIGA)', speed: 14, spin: 12, control: 9 }
  ],
  shoes: [
    { id: 's1', name: '基础训练鞋', tier: 1, price: 0, rankReq: 999, footwork: 4, speed: 2 },
    { id: 's2', name: '俱乐部普及鞋', tier: 1, price: 0, rankReq: 999, footwork: 5, speed: 3 },
    { id: 's3', name: '亚瑟士 Gel-Rocket (入门专业)', tier: 2, price: 650, rankReq: 999, sponsorBrand: '亚瑟士 (ASICS)', footwork: 8, speed: 5 },
    { id: 's4', name: '美津浓 Wave Drive', tier: 2, price: 750, rankReq: 999, sponsorBrand: '美津浓 (MIZUNO)', footwork: 9, speed: 6 },
    { id: 's5', name: '蝴蝶 Lezoline Rifone', tier: 3, price: 2600, rankReq: 999, sponsorBrand: '蝴蝶 (Butterfly)', footwork: 12, speed: 8 },
    { id: 's6', name: '挺拔 Energy Force', tier: 3, price: 3000, rankReq: 999, sponsorBrand: '挺拔 (TIBHAR)', footwork: 13, speed: 9 },
    { id: 's7', name: '亚瑟士 Gel-Rocket Pro 国手战靴', tier: 4, price: 7500, rankReq: 999, sponsorBrand: '亚瑟士 (ASICS)', footwork: 16, speed: 12 },
    { id: 's8', name: '美津浓 Wave Drive Neo 顶尖竞速战靴', tier: 4, price: 9200, rankReq: 999, sponsorBrand: '美津浓 (MIZUNO)', footwork: 17, speed: 13 }
  ]
};

// 顺便修正 SPONSORS_DATABASE 中挺拔的文案介绍描述
const SPONSORS_DATABASE = {
  gear: [
    { id: 'g_sp_dhs', name: '红双喜 (DHS)', type: 'gear', brandKeyword: '红双喜', rankReq: 80, minPay: 500, maxPay: 1200, desc: '国乒官方主赞助商，签约后仅限使用红双喜专属底板与狂飚套胶' },
    { id: 'g_sp_stiga', name: '斯帝卡 (STIGA)', type: 'gear', brandKeyword: '斯帝卡', rankReq: 80, minPay: 500, maxPay: 1200, desc: '欧洲经典大厂，提供碳素底板专供支持与专属补贴' },
    { id: 'g_sp_tb', name: '挺拔 (TIBHAR)', type: 'gear', brandKeyword: '挺拔', rankReq: 80, minPay: 100, maxPay: 500, desc: '欧洲老牌乒乓器材巨头，签约后仅限使用挺拔变革系列与底板装备' },
    { id: 'g_sp_btf', name: '蝴蝶 (BUTTERFLY)', type: 'gear', brandKeyword: '蝴蝶', rankReq: 30, minPay: 700, maxPay: 2000, desc: '世界顶级巨头，量身定制特注底板与高端特注套胶' }
  ],
  commercial: [
    { id: 'c_sp_drink1', name: '红牛 (RedBull)', type: 'commercial', rankReq: 200, minPay: 800, maxPay: 2000, desc: '知名功能饮料品牌代言，纯商业收益，无器材限制' },
    { id: 'c_sp_car1', name: '保时捷 (Porsche)', type: 'commercial', rankReq: 25, minPay: 2000, maxPay: 5000, desc: '豪华汽车品牌全球挚友，提供丰厚商业代言津贴' },
    { id: 'c_sp_watch1', name: '劳力士 (Rolex)', type: 'commercial', rankReq: 10, minPay: 5000, maxPay: 12000, desc: '顶级奢华名表全球代言人，顶尖体坛巨星专享' },
    { id: 'c_sp_sport1', name: '安踏 (ANTA)', type: 'commercial', rankReq: 300, minPay: 400, maxPay: 1200, desc: '赞助服饰' },
    { id: 'c_sp_car2', name: '凯迪拉克 (Cadillac)', type: 'commercial', rankReq: 200, minPay: 1000, maxPay: 3000, desc: '品牌挚友' },
    { id: 'c_sp_shopping1', name: '美团闪购', type: 'commercial', rankReq: 450, minPay: 100, maxPay: 500, desc: '品牌宣传人' },
    { id: 'c_sp_skin1', name: '适乐肤 (CeraVe)', type: 'commercial', rankReq: 500, minPay: 300, maxPay: 800, desc: '品牌形象' }
  ]
};