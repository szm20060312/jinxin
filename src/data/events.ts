// ============================================================
// 事件剧情库 —— 《晋·信》
//
// 三类事件：
//   story  — 5 个核心剧本事件（推动主线）
//   crisis — 分号危机事件
//   random — 日常随机小事件
// ============================================================

import type { GameEvent } from '../types';

// ============================================================
// 一、核心剧本事件（story）
// ============================================================

/** 核心剧本 1：官银汇兑之邀 */
export const STORY_OFFICIAL_SILVER: GameEvent = {
  id: 'story_official_silver',
  type: 'story',
  title: '官银汇兑之邀',
  description:
    '山西巡抚衙门遣人送来密函：朝廷军饷需从太原解往西安大营，共二十万两。' +
    '巡抚大人素知本号信誉卓著，欲托付汇兑。然此乃官银，一旦接下——\n\n' +
    '• 利：官府好感大涨，日后官银汇兑源源不断\n' +
    '• 弊：若途中被劫或延误，票号将信誉扫地，甚至遭查抄',
  options: [
    {
      id: 'accept',
      text: '接！官银汇兑是通往晋商顶层的铁券',
      effects: {
        silver: { inTransit: 200_000 },
        connections: { government: 20 },
        reputation: 5,
      },
      outcomeDescription: '你接下官银差事，巡抚大人甚为满意。二十万两军饷已在途，务保万无一失。',
    },
    {
      id: 'decline',
      text: '婉拒——根基未稳，不敢涉险',
      effects: {
        connections: { government: -10 },
        reputation: -3,
      },
      outcomeDescription:
        '你以"号规尚在整饬"为由婉拒。巡抚虽未动怒，但太原官场开始议论：此号胆小，不堪大用。',
    },
  ],
  condition: {
    minReputation: 55,
    yearsElapsed: [0, 3],
  },
};

/** 核心剧本 2：汉口洪灾 */
export const STORY_HANKOU_FLOOD: GameEvent = {
  id: 'story_hankou_flood',
  type: 'story',
  title: '汉口洪灾',
  description:
    '八百里加急：长江大水，汉口半城被淹。分号库房进水，账册受损，存银尚可抢救。' +
    '然城中百姓流离，商号纷纷施粥赈灾。汉口分号掌柜来函请示——\n\n' +
    '• 若赈灾：开销不小，但汉口商民将铭记此恩\n' +
    '• 若自救：保住库银要紧，然名声难免受损',
  options: [
    {
      id: 'relief',
      text: '开仓赈灾！义利并举方为晋商本色',
      effects: {
        silver: { hankou: -15_000 },
        reputation: 10,
        connections: { merchantGuild: 15 },
      },
      outcomeDescription:
        '汉口分号搭起粥棚，日施粥三百碗。商帮同仁纷纷竖起大拇指，连湖广总督都遣人送来"义商"匾额。',
    },
    {
      id: 'self_rescue',
      text: '自救为先，各人自扫门前雪',
      effects: {
        silver: { hankou: -5_000 },
        reputation: -8,
        connections: { merchantGuild: -10 },
      },
      outcomeDescription:
        '分号全力转移库银，损失不大。但汉口街头开始流传：紧要关头，某票号只认银子不认人。',
    },
  ],
  condition: {
    yearsElapsed: [1, 5],
  },
};

/** 核心剧本 3：内鬼盗银 */
export const STORY_TRAITOR: GameEvent = {
  id: 'story_traitor',
  type: 'story',
  title: '账房疑云',
  description:
    '年终盘点，发现总号库银短少八千两。查来查去，疑点指向一名在号十年的老账房。' +
    '此人平日勤勉寡言，账目从未出过差错，但近来常深夜独自一人在账房逗留。\n\n' +
    '• 若报官：证据不足，可能冤枉好人，且家丑外扬\n' +
    '• 若私了：内部清查，但要承担损失',
  options: [
    {
      id: 'report',
      text: '报官彻查，绝不姑息',
      effects: {
        silver: { headquarters: -8_000 },
        reputation: -5,
        connections: { government: 5 },
        staffLoyalty: -5,
      },
      outcomeDescription:
        '官府介入后，果然查出老账房为还赌债铤而走险。人已收监，但消息走漏，商界议论纷纷。伙友们人人自危。',
    },
    {
      id: 'private',
      text: '私下彻查，给他一个坦白机会',
      effects: {
        silver: { headquarters: -5_000 },
        reputation: -2,
        staffLoyalty: 8,
      },
      outcomeDescription:
        '你在夜深人静时找他长谈。老账房痛哭流涕，承认家中老母病重，不得已挪银买药。你替他补了亏空，转为三年无薪留用。此事知情者不过三人。',
    },
  ],
  condition: {
    minReputation: 45,
    yearsElapsed: [2, 6],
  },
};

/** 核心剧本 4：东家索银 */
export const STORY_OWNER_WITHDRAWAL: GameEvent = {
  id: 'story_owner_withdrawal',
  type: 'story',
  title: '东家索银',
  description:
    '东家某大商号年底急需资金周转，派人前来提取存银十万两——但这笔钱远超常规存银规模。' +
    '若立即兑付，总号库银将跌破安全线；若拖延，东家震怒。\n\n' +
    '• 晋商最重"信"，存银见票即付是天条\n' +
    '• 但东家此举近乎"抽血"，票号可能因此周转不灵',
  options: [
    {
      id: 'pay',
      text: '见票即付，信义为先！',
      effects: {
        silver: { headquarters: -100_000 },
        connections: { owner: 15 },
        reputation: 8,
      },
      outcomeDescription:
        '你咬牙凑齐十万两，当日下午如数交付。东家大悦，逢人便夸"此号信誉，金字招牌"。但库银确实吃紧，接下来几季要勒紧裤腰带了。',
    },
    {
      id: 'negotiate',
      text: '面见东家陈情，请求分批兑付',
      effects: {
        silver: { headquarters: -40_000 },
        connections: { owner: -15 },
        reputation: -3,
      },
      outcomeDescription:
        '你亲自登门陈情，晓以利害。东家勉强同意先兑四万两，余下分期。但东家脸色不好看，暗叹你"不够爽利"。商界也略有风闻。',
    },
  ],
  condition: {
    minReputation: 60,
    yearsElapsed: [3, 8],
  },
};

/** 核心剧本 5：密押泄露危机 */
export const STORY_CIPHER_LEAK: GameEvent = {
  id: 'story_cipher_leak',
  type: 'story',
  title: '密押泄露！',
  description:
    '深夜，一名从前离号的账房悄悄来见：有人出高价买本号密押字码，他虽未卖，但听说已有旁人动了心。' +
    '密押乃票号命脉——一旦泄露，假汇票将如蝗虫般涌来，数十年信誉毁于一旦。\n\n' +
    '• 立即更换密押方案：需花费重金重新培训各分号账房\n' +
    '• 按兵不动：暗中调查，但要冒泄露风险',
  options: [
    {
      id: 'replace',
      text: '连夜更换密押，宁可错杀不可放过',
      effects: {
        silver: { headquarters: -12_000 },
        reputation: 2,
        cipherChange: 'advanced',
      },
      outcomeDescription:
        '你连夜召集各分号账房，更换为最高级别的三码联动密押。花费不菲，但后患已除。从此本号密押之严密，在晋商中传为佳话。',
    },
    {
      id: 'investigate',
      text: '暗中调查，暂不声张',
      effects: {
        silver: { headquarters: -2_000 },
        connections: { merchantGuild: -5 },
      },
      outcomeDescription:
        '你派亲信暗中查访一月，确实抓到了内鬼。但在此期间有数张假汇票流通，虽及时发现追回，但商界已有所耳闻，对本号安全有了疑虑。',
    },
  ],
  condition: {
    yearsElapsed: [4, 10],
  },
};

// ============================================================
// 二、分号危机事件（crisis）
// ============================================================

/** 汉口分号：掌柜生病 */
export const CRISIS_MANAGER_SICK_HANKOU: GameEvent = {
  id: 'crisis_hankou_manager_sick',
  type: 'crisis',
  title: '汉口掌柜病重',
  description: '汉口分号急报：掌柜突发重病，卧床不起。分号群龙无首，日常事务勉强维持，但大额汇兑无人拍板。',
  options: [
    {
      id: 'send_staff',
      text: '派遣得力伙友前往代理',
      effects: { silver: { hankou: -3_000 }, reputation: 2 },
      outcomeDescription: '你派陈守义星夜赶往汉口代理号务，分号运营勉强稳住。但异地代理终非长久之计。',
    },
    {
      id: 'remote_guide',
      text: '飞鸽传书远程指导，让分号账房暂代',
      effects: { silver: { hankou: -5_000 } },
      outcomeDescription: '远程指挥难免疏漏，有几笔大额汇兑因决策延误而流失。分号士气低落。',
    },
  ],
};

/** 张家口分号：胡商劫掠 */
export const CRISIS_ZHANGJIAKOU_BANDITS: GameEvent = {
  id: 'crisis_zhangjiakou_bandits',
  type: 'crisis',
  title: '口外胡商劫掠',
  description: '张家口急报：一队蒙古马匪洗劫了从恰克图南下的商队，本号在途白银一万五千两下落不明。',
  options: [
    {
      id: 'send_escort',
      text: '雇请镖局，加强押运',
      effects: { silver: { zhangjiakou: -8_000 }, reputation: 3 },
      outcomeDescription: '你花重金请来京城最有名的威远镖局，此后口外商路太平了许多。虽花销大，但客户信心回升。',
    },
    {
      id: 'write_off',
      text: '认亏，记入坏账，继续原有路线',
      effects: { silver: { zhangjiakou: -15_000 }, reputation: -5 },
      outcomeDescription: '损失只好自咽。但张家口客户纷纷转投别号——谁知道下次被抢的是不是自己的银子？',
    },
  ],
};

/** 伪票风波 */
export const CRISIS_COUNTERFEIT: GameEvent = {
  id: 'crisis_counterfeit',
  type: 'crisis',
  title: '伪票风波',
  description: '汉口分号急报：有人持伪造汇票要求兑付五千两，幸被账房识破。但此人逃脱，伪票源头不明。若不彻查，假票恐大量流入市场，届时百口莫辩。',
  options: [
    {
      id: 'investigate_deep',
      text: '联合商帮、报官彻查，悬赏缉拿',
      effects: { silver: { hankou: -5_000 }, reputation: 3, connections: { government: 3 } },
      outcomeDescription: '你与商帮联手在汉口布下眼线，半月后抓获伪造团伙三人。此后各路票号纷纷效仿本号的水印防伪之策。',
    },
    {
      id: 'replace_cipher_quiet',
      text: '暗中更换密押格式，不声张以免恐慌',
      effects: { silver: { hankou: -2_000 }, reputation: -2 },
      outcomeDescription: '密押更换后暂时安全，但未揪出真凶，隐患仍在。有客户私下议论"某某号的票据信不过"。',
    },
  ],
};

/** 掌柜贪墨 */
export const CRISIS_MANAGER_EMBEZZLE: GameEvent = {
  id: 'crisis_manager_embezzle',
  type: 'crisis',
  title: '掌柜贪墨',
  description: '年终查账发现张家口分号账目不对——近两年间有近两万两白银去向不明。掌柜辩称是"人情往来"，但你心知肚明这绝非小数目。',
  options: [
    {
      id: 'fire_manager',
      text: '当众撤职，追缴赃款，送官究办',
      effects: { silver: { zhangjiakou: -8_000 }, reputation: 3, staffLoyalty: -3 },
      outcomeDescription: '掌柜被官差押走时面如死灰。追回了部分银两，但全号震动，伙友们私下说"大掌柜手真狠"。不过商界对你铁腕治号刮目相看。',
    },
    {
      id: 'cover_up',
      text: '私下追回赃款，令其"因病请辞"',
      effects: { silver: { zhangjiakou: -5_000 }, reputation: -1, staffLoyalty: 2 },
      outcomeDescription: '你给了掌柜一条体面退路。追回了大半银两，家丑未外扬。伙友们见你行事有度，反而更加忠心。',
    },
  ],
};

// ============================================================
// 三、日常随机事件（random）
// ============================================================

export const RANDOM_EVENTS: GameEvent[] = [
  // ---- 好事 ----
  {
    id: 'random_merchant_praise',
    type: 'random',
    title: '客商赞誉',
    description: '一位徽州茶商在商会中当众称赞本号"汇兑最快、息钱最公"，许多商人纷纷来询。',
    options: [
      {
        id: 'thank',
        text: '谦虚致谢，趁机推广',
        effects: { reputation: 3, connections: { merchantGuild: 3 } },
        outcomeDescription: '本号名声在茶商圈中传开，新客户络绎不绝。',
      },
    ],
  },
  {
    id: 'random_good_harvest',
    type: 'random',
    title: '丰年行情',
    description: '今年风调雨顺，商路畅通。各地商人资金周转需求大增，正是扩大业务的好时机。',
    options: [
      {
        id: 'expand',
        text: '适度扩大放款额度',
        effects: { reputation: 2 },
        outcomeDescription: '你审时度势，本季放款增加三成，利息收入可观。',
      },
    ],
  },
  {
    id: 'random_talented_apprentice',
    type: 'random',
    title: '新徒投奔',
    description: '一位平遥本地子弟登门求学，自称算术过人，愿从学徒做起。试问之下确实聪颖。',
    options: [
      {
        id: 'accept',
        text: '收下！好苗子不可错过',
        effects: { silver: { headquarters: -50 } },
        _addApprentice: true,
        outcomeDescription: '新学徒入职，资质出众，账房先生甚为满意。',
      },
      {
        id: 'decline_apprentice',
        text: '婉拒，目前人手已够',
        effects: {},
        outcomeDescription: '你礼貌地送走了年轻人。但愿没有错失一个未来的大账房。',
      },
    ],
  },
  {
    id: 'random_loyal_customer',
    type: 'random',
    title: '老主顾引荐',
    description: '一位在号存银十余年的山西盐商今日来访，称其苏州同乡会欲寻一家可靠的票号长期合作，愿为本号作保引荐。',
    options: [
      {
        id: 'welcome',
        text: '热情接待，备下薄礼回赠',
        effects: { silver: { headquarters: -300 }, reputation: 4, connections: { merchantGuild: 5 } },
        outcomeDescription: '一顿家宴、两份薄礼，换来的是江南商路的敲门砖。盐商满意而归，苏州同乡会随后送来首批存银八万两。',
      },
      {
        id: 'modest_thanks',
        text: '口头致谢，按规办事',
        effects: { connections: { merchantGuild: 1 } },
        outcomeDescription: '你虽未特别表示，但盐商还是说了几句好话。不过若更热情些，机会或许更大。',
      },
    ],
  },
  {
    id: 'random_guild_feast',
    type: 'random',
    title: '商帮联谊',
    description: '晋商会馆发来请帖：下月初八设宴招待各路票号掌柜。据说介休范家、祁县乔家的大掌柜都会到场，是结交同行的好机会。',
    options: [
      {
        id: 'attend_lavish',
        text: '备厚礼赴宴，借机扬名',
        effects: { silver: { headquarters: -2_000 }, connections: { merchantGuild: 8 }, reputation: 1 },
        outcomeDescription: '你备了一份不轻不重的贺礼，席间与各路掌柜相谈甚欢。范家大掌柜酒后拉着你称兄道弟，答应互通有无。',
      },
      {
        id: 'skip_feast',
        text: '号务繁忙，托人送帖致意即可',
        effects: {},
        outcomeDescription: '你未出席，虽不算失礼，但事后听说席间有关于西北商路的重要消息，错过了有些可惜。',
      },
    ],
  },
  {
    id: 'random_efficiency_tip',
    type: 'random',
    title: '掌柜献计',
    description: '老账房赵和顺悄悄来找你：他发现将汇兑与放款的账目并行入账可节省近三成人工。若推行此法，可裁减一名账房节省开销。',
    options: [
      {
        id: 'adopt',
        text: '采纳此策——能者上，庸者下',
        effects: { silver: { headquarters: 800 }, staffLoyalty: -2 },
        outcomeDescription: '新法推行后果然效率大增。但被裁的账房含泪离去，其他伙友不免生出唇亡齿寒之感。',
      },
      {
        id: 'keep_all',
        text: '保留人手，将省下的人力用于开发新业务',
        effects: { silver: { headquarters: -200 }, staffLoyalty: 3 },
        outcomeDescription: '你采纳了并账之策但未裁人，而是让多余的人手去跑街拉客户。赵和顺对你的人情味暗暗敬佩。',
      },
    ],
  },

  // ---- 中性 ----
  {
    id: 'random_competitor_opens',
    type: 'random',
    title: '同行新号',
    description: '听说介休侯家也开了家票号，在平遥挂出招牌。虽说晋商讲究和气生财，但竞争难免。',
    options: [
      {
        id: 'observe',
        text: '静观其变，做好自己',
        effects: {},
        outcomeDescription: '新号刚开，尚不足惧。但卧榻之侧，不可不察。',
      },
    ],
  },
  {
    id: 'random_rumor',
    type: 'random',
    title: '市井传言',
    description: '平遥街头有人传言：朝廷要改银两平色标准，现存银可能要重新熔铸。消息真假难辨。',
    options: [
      {
        id: 'ignore',
        text: '置之不理，传言不可尽信',
        effects: {},
        outcomeDescription: '几日后证实纯属谣言。不过这类消息以后会越来越多，需留意甄别。',
      },
      {
        id: 'verify',
        text: '派人到太原打听',
        effects: { silver: { headquarters: -200 } },
        outcomeDescription: '你派伙计到太原衙门打探，确认是谣言。虽然花了几百两跑腿费，但心里踏实了。',
      },
    ],
  },

  // ---- 坏事 ----
  {
    id: 'random_fire_small',
    type: 'random',
    title: '灶房走水',
    description: '总号后院灶房不慎起火，虽及时扑灭，但烧毁半间库房和部分账册副本。',
    options: [
      {
        id: 'repair',
        text: '修缮库房，重新誊抄账册',
        effects: { silver: { headquarters: -1_500 } },
        outcomeDescription: '修缮花费了一千五百两。万幸正本账册另有保存，损失可控。',
      },
    ],
  },
  {
    id: 'random_clerk_mistake',
    type: 'random',
    title: '账房失误',
    description: '一位新来的账房误将三千两记错了账，虽发现及时，但客户已不满。',
    options: [
      {
        id: 'apologize',
        text: '亲自登门道歉，补送谢礼',
        effects: { silver: { headquarters: -200 }, reputation: -1 },
        outcomeDescription: '登门道歉总算平息了客户怒气。当家的脸面也值二百两。',
      },
      {
        id: 'deduct',
        text: '扣发该账房月银，书信致歉',
        effects: { staffLoyalty: -3, reputation: -2 },
        outcomeDescription: '书信致歉显得诚意不足，客户逢人便说本号"架子大"。犯错账房也心生不满。',
      },
    ],
  },
  {
    id: 'random_new_tax',
    type: 'random',
    title: '朝廷加征厘金',
    description: '山西巡抚衙门贴出告示：为筹军饷，各票号每笔汇兑加征千分之三的厘金，即日生效。这对利润是不小的侵蚀。',
    options: [
      {
        id: 'absorb_cost',
        text: '自行消化——不转嫁客户',
        effects: { silver: { headquarters: -3_000 }, reputation: 2 },
        outcomeDescription: '你咬咬牙自己扛下了加税。客户不知情，但本号利润薄了一些。几个大客户觉得你"会做人"。',
      },
      {
        id: 'raise_fee',
        text: '相应上调汇费，明码告知客户',
        effects: { reputation: -2 },
        outcomeDescription: '你贴出告示说明原因上调汇费。部分小客户抱怨，但多数人理解——毕竟朝廷加税，非号之过。',
      },
    ],
  },
  {
    id: 'random_staff_conflict',
    type: 'random',
    title: '伙友内讧',
    description: '汉口分号两名伙友因争抢一个跑街地盘大打出手，惊动了街坊。分号掌柜来函请示如何处置。',
    options: [
      {
        id: 'transfer_one',
        text: '将挑事者调回总号，严加管束',
        effects: { staffLoyalty: -1, reputation: -1 },
        outcomeDescription: '你将闹事伙友调回了总号。虽暂时平息，但汉口分号人手吃紧，总号这边又多了一个心有不甘的刺头。',
      },
      {
        id: 'mediate',
        text: '亲自致信调解，划定各自地盘',
        effects: { silver: { hankou: -200 }, staffLoyalty: 2 },
        outcomeDescription: '你的亲笔信到了汉口，两名伙友看了信都红了脸，当夜摆酒言和。掌柜来信感叹："大掌柜一封信，胜过十条号规。"',
      },
    ],
  },
  {
    id: 'random_pest_plague',
    type: 'random',
    title: '虫灾歉收',
    description: '汉口周边今夏蝗虫成灾，粮食歉收。粮价飞涨，汉口分号周边百姓生计困难，已有饥民在分号门口乞讨。',
    options: [
      {
        id: 'donate_grain',
        text: '开仓施粥半月——积德亦是积名',
        effects: { silver: { hankou: -8_000 }, reputation: 5, connections: { merchantGuild: 3 } },
        outcomeDescription: '汉口分号门口架起粥棚，一时间领粥者排起长龙。百姓感念，商帮也对此举大加赞赏。',
      },
      {
        id: 'ignore_pest',
        text: '锁好库房，不惹是非',
        effects: { reputation: -3 },
        outcomeDescription: '你选择了置身事外，但饥民在分号门口哭了几天，街坊私下议论此号心硬如铁。',
      },
    ],
  },
];

// ============================================================
// 汇总导出
// ============================================================

/** 全部核心剧情事件（按时间顺序） */
export const STORY_EVENTS: GameEvent[] = [
  STORY_OFFICIAL_SILVER,
  STORY_HANKOU_FLOOD,
  STORY_TRAITOR,
  STORY_OWNER_WITHDRAWAL,
  STORY_CIPHER_LEAK,
];

/** 全部危机事件 */
export const CRISIS_EVENTS: GameEvent[] = [
  CRISIS_MANAGER_SICK_HANKOU,
  CRISIS_ZHANGJIAKOU_BANDITS,
  CRISIS_COUNTERFEIT,
  CRISIS_MANAGER_EMBEZZLE,
];

/** 全部事件（供引擎使用） */
export const ALL_EVENTS: GameEvent[] = [
  ...STORY_EVENTS,
  ...CRISIS_EVENTS,
  ...RANDOM_EVENTS,
];

/** 按类型筛选事件 */
export function getEventsByType(type: GameEvent['type']): GameEvent[] {
  return ALL_EVENTS.filter(e => e.type === type);
}
