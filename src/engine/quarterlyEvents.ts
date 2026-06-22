// ============================================================
// 季度突发事件引擎 —— 《晋·信》
//
// 进入季度决策前，有一定概率触发紧急事件
// 事件需即时处理，不可跳过
// ============================================================

import type { GameState, GameEvent } from '../types';
import { pickRandom, chance } from '../utils/random';
import { RECRUITABLE_POOL, generateApprentice } from '../data/staff';

/**
 * 检测是否触发季度突发事件
 * 基础概率 30%，信誉越低概率越高
 */
export function shouldTriggerQuarterlyEvent(state: GameState): boolean {
  const rep = state.resources.reputation;
  let probability = 0.30;

  // 信誉低更容易出事
  if (rep < 30) probability = 0.55;
  else if (rep < 50) probability = 0.40;
  // 信誉高不容易出事
  else if (rep > 80) probability = 0.18;

  return chance(probability);
}

/**
 * 生成季度突发事件
 */
export function generateQuarterlyEvent(state: GameState): GameEvent {
  const pool: GameEvent[] = [
    ...generateMarketEvents(state),
    ...generateRouteEvents(state),
    ...generatePersonnelEvents(state),
    ...generateOpportunityEvents(state),
    ...generateRecruitmentEvents(state),
    ...generateCrisisRecoveryEvents(state),
  ];

  return pickRandom(pool);
}

// ================================================================
// 行情波动事件
// ================================================================

function generateMarketEvents(_state: GameState): GameEvent[] {
  return [
    {
      id: 'q_market_surge',
      type: 'random',
      title: '⚡ 汇兑潮涌',
      description:
        '今晨太原、汉口、西安三地商人突然集中汇兑，数额之大超出平时三倍。' +
        '据说是西北军饷发放引发连锁反应。各分号库银压力骤增，需立刻应对。',
      options: [
        {
          id: 'full_service',
          text: '全力接单——来者不拒，调拨总号库银支援',
          effects: {
            silver: { headquarters: -40_000 },
            reputation: 15,
          },
          outcomeDescription:
            '你果断调拨总库银支援各分号，虽库银骤降但全部汇兑如约完成。商界震动："此号实力，不可小觑！"',
        },
        {
          id: 'limit_service',
          text: '限额接单——每日限量，先到先得',
          effects: {
            reputation: -6,
          },
          outcomeDescription:
            '你下令限额接单，虽保住了库银安全，但不少商人排队半日被拒，怨声载道。',
        },
      ],
    },
    {
      id: 'q_market_crash',
      type: 'random',
      title: '📉 银价暴跌',
      description:
        '西北传来噩耗：某大票号因经营不善突然倒闭，引发恐慌。平遥银价一日之内跌了一成五。' +
        '储户蜂拥而至要求兑付，若不及时应对恐引发挤兑。',
      options: [
        {
          id: 'calm_public',
          text: '大开正门，请储户依次兑付——展示本号库银充裕',
          effects: {
            silver: { headquarters: -50_000 },
            reputation: 24,
          },
          outcomeDescription:
            '你下令将库银搬至厅堂公开展示，储户亲眼见到白花花银两，恐慌自消。风波过后，你的镇定传为美谈。',
        },
        {
          id: 'close_doors',
          text: '暂关大门半日，等风头过去',
          effects: {
            reputation: -18,
          },
          outcomeDescription:
            '关门之举虽然保住了库银，但"某某票号也关门了"的传言不胫而走，信誉大损。',
        },
      ],
      condition: { minReputation: 35 },
    },
    {
      id: 'q_bank_run',
      type: 'crisis',
      title: '🏦 挤兑风潮',
      description:
        '不知何处起了谣言：说本号在西北商路上吃了大亏，库银已空。今日一早总号门口排起了长队——' +
        '足有上百名储户要兑付存银，人声鼎沸。若真的一一兑现，库银将损大半。',
      options: [
        {
          id: 'restore_confidence',
          text: '搬出库银当街展示，设茶座安抚人心',
          effects: {
            silver: { headquarters: -25_000 },
            reputation: 15,
            connections: { merchantGuild: 9 },
          },
          outcomeDescription:
            '你在号前支起茶棚，搬出五箱银锭当众开箱验银。围观者亲眼所见库银充裕，谣言不攻自破。傍晚队伍自行散去，反为本号赢得了"处变不惊"的美名。',
        },
        {
          id: 'limit_withdraw',
          text: '下令每人每日限兑百两，拖延时间',
          effects: {
            reputation: -12,
          },
          outcomeDescription:
            '限兑令一出，储户更加恐慌——"果然没银子了！"队伍越排越长，惊动了县衙派人来维持秩序。最终虽未挤兑成功，但商界对你的信心动摇了。',
        },
      ],
      condition: { minReputation: 30, maxReputation: 70 },
    },
  ];
}

// ================================================================
// 商路事件
// ================================================================

function generateRouteEvents(_state: GameState): GameEvent[] {
  return [
    {
      id: 'q_bandit_attack',
      type: 'crisis',
      title: '🗡️ 商路截击',
      description:
        '急报！汉口至太原官道近日出现大股山贼，已劫了数家商队的货。' +
        '本号在途白银一万二千两，若走此路凶多吉少。是绕道保银还是赶时间直行？',
      options: [
        {
          id: 'detour',
          text: '命令在途银绕道南阳，多走十日程',
          effects: {
            silver: { headquarters: -1_500 },
          },
          outcomeDescription:
            '多走了十日，多花了千五百两盘缠，但白银安全抵达。小心驶得万年船。',
        },
        {
          id: 'risk_it',
          text: '加雇镖师，原路疾行',
          effects: {
            silver: { headquarters: -3_000 },
          },
          outcomeDescription:
            '花重金请来十名镖师护卫，一路有惊无险。虽花费不菲但准时到达。',
        },
      ],
    },
    {
      id: 'q_weather_block',
      type: 'random',
      title: '🌨️ 大雪封山',
      description:
        '张家口来报：口外突降暴雪，通往蒙古的商路已封三日。' +
        '张家口分号大量口外汇票无法兑付，存银日渐紧张。需总号支援。',
      options: [
        {
          id: 'send_silver',
          text: '紧急调拨白银三万两支援张家口',
          effects: {
            silver: { headquarters: -30_000, inTransit: 3_000 },
            connections: { merchantGuild: 9 },
          },
          outcomeDescription:
            '银两在大雪中艰难运送，十日后抵达。口外商人对本号雪中送炭之举赞不绝口。',
        },
        {
          id: 'wait_out',
          text: '让张家口自行周转，等雪停再说',
          effects: {
            reputation: -3,
          },
          outcomeDescription:
            '你判断雪不会太久。果然五日后放晴，但张家口分号这几日着实难熬。',
        },
      ],
      condition: { yearsElapsed: [0, 15] },
    },
    {
      id: 'q_unexpected_order',
      type: 'random',
      title: '📦 意外大单',
      description:
        '一位操着南方口音的陌生客商登门，自称受广州十三行委托，欲汇兑白银八万两至张家口采购皮货。' +
        '数额巨大，但此客面生，底细不明——是送上门的肥肉，还是陷阱？',
      options: [
        {
          id: 'accept_verified',
          text: '接下！但要求先验银、后出票',
          effects: {
            silver: { headquarters: 8_000, inTransit: 80_000 },
            reputation: 9,
            connections: { merchantGuild: 6 },
          },
          outcomeDescription:
            '你谨慎地先验银后出票。竟是真金白银！这笔大单顺利完成后，广州商界也开始打听本号的名头。一条通往岭南的财路隐约浮现。',
        },
        {
          id: 'decline_cautious',
          text: '婉拒——来历不明的银子不敢碰',
          effects: {},
          outcomeDescription:
            '你以"号规所限"婉拒了这笔大单。事后听说那客商找了另一家票号，交易顺利完成。或许是你多虑了。',
        },
      ],
    },
  ];
}

// ================================================================
// 人事事件
// ================================================================

function generatePersonnelEvents(state: GameState): GameEvent[] {
  if (state.staff.length < 4) return [];

  return [
    {
      id: 'q_keyman_sick',
      type: 'random',
      title: '🤒 关键人物病倒',
      description:
        '总号首席账房陈守义今晨突然病倒，高热不退。正是季度结算关键时期，大量账目待核。' +
        '若他缺席，本季合账可能延误，甚或出错。',
      options: [
        {
          id: 'send_doctor',
          text: '请平遥最好的郎中、用最好的药',
          effects: {
            silver: { headquarters: -500 },
          },
          outcomeDescription:
            '重金请来名医，三日后账房先生烧退，虽耽误了些许进度但总算没出大错。',
        },
        {
          id: 'work_through',
          text: '让其他账房分担，加班赶工',
          effects: {
            staffLoyalty: -6,
            reputation: -3,
          },
          outcomeDescription:
            '其他伙友连日赶工虽勉强完成，但筋疲力尽，私下颇有怨言。',
        },
      ],
    },
    {
      id: 'q_apprentice_breakthrough',
      type: 'random',
      title: '✨ 学徒展露才华',
      description:
        (() => {
          const apprentices = state.staff.filter(s => s.role === 'apprentice');
          const name = apprentices.length > 0 ? pickRandom(apprentices).name : '某学徒';
          return `学徒${name}近日独立完成了一笔复杂汇兑的账目核对，` +
            '账房先生赞其"心思缜密，将来必成大器"。是否提前给予更多历练机会？';
        })(),
      options: [
        {
          id: 'promote',
          text: '破格提拔——让他参与更多核心账目',
          effects: {
            reputation: 3,
          },
          outcomeDescription:
            '你当众表扬了这位学徒，并让他旁听掌柜议事。全号士气大振，年轻人干劲十足。',
        },
        {
          id: 'moderate',
          text: '按部就班——火候到了自然成材',
          effects: {},
          outcomeDescription:
            '你点点头但未特别表示。学徒略有失落，但依旧勤勉。',
        },
      ],
    },
    {
      id: 'q_clerk_defection',
      type: 'crisis',
      title: '💔 伙友跳槽',
      description:
        (() => {
          const clerks = state.staff.filter(s => s.role === 'clerk' && s.ability > 50);
          const name = clerks.length > 0 ? pickRandom(clerks).name : '某伙友';
          return `${name}私下递了辞呈：介休侯家新票号出高价挖人，月银翻倍。` +
            `此人熟悉本号核心账目，若他投靠对手，本号经营机密可能泄露。`;
        })(),
      options: [
        {
          id: 'counter_offer',
          text: '加薪留人——好伙友千金不换',
          effects: {
            silver: { headquarters: -600 },
            staffLoyalty: 15,
          },
          outcomeDescription:
            '你不仅加了月银还许以年底分红。伙友深受感动，当夜撕了侯家的聘书。其他伙友也看到：本号不会亏待自己人。',
        },
        {
          id: 'let_go',
          text: '来去自由——好聚好散',
          effects: {
            staffLoyalty: -6,
          },
          outcomeDescription:
            '你大度地批准了辞呈，备了送别宴。虽然人手临时吃紧，但你的格局让留下的伙友暗暗佩服。不过，核心账目确实存在外泄风险。',
        },
      ],
    },
  ];
}

// ================================================================
// 机遇事件
// ================================================================

function generateOpportunityEvents(_state: GameState): GameEvent[] {
  return [
    {
      id: 'q_rare_goods',
      type: 'random',
      title: '💎 稀世古玩',
      description:
        '一位落魄旗人携家传古画《富春山居》（残卷）登门求当，索价五万两。' +
        '经鉴定确为真迹，但当下手头并不宽裕。若吃下此画，日后转手利润可观。',
      options: [
        {
          id: 'buy_art',
          text: '咬牙吃下——五万两买一幅传世名画',
          effects: {
            silver: { headquarters: -50_000 },
            connections: { government: 30 },
          },
          outcomeDescription:
            '你买下古画，消息传到大内，有皇亲遣人来询。虽未立即转手，但此画已成本号镇号之宝。',
        },
        {
          id: 'pass_art',
          text: '婉拒——票号不是当铺',
          effects: {},
          outcomeDescription:
            '你礼貌地送走了旗人。不知道这幅画最终落到了谁手里。',
        },
      ],
      condition: { minReputation: 50 },
    },
    {
      id: 'q_govt_partner',
      type: 'random',
      title: '🏛️ 官银机会',
      description:
        '太原府典吏私下递话：今年全省税银汇兑，原本定给别号，但那家最近出了纰漏。' +
        '若本号能拿出一笔"保证金"十万两，这笔大单就是我们的。',
      options: [
        {
          id: 'pledge',
          text: '凑齐保证金——拼一把！',
          effects: {
            silver: { headquarters: -100_000 },
            connections: { government: 45, merchantGuild: 15 },
            reputation: 15,
          },
          outcomeDescription:
            '你赌上身家前途，凑齐十万两保证金。税银汇兑大单终于到手，全号欢腾！从此官府汇兑源源不断。',
        },
        {
          id: 'decline_govt',
          text: '风险太大，婉言谢绝',
          effects: {
            connections: { government: -9 },
          },
          outcomeDescription:
            '你权衡再三还是放弃了。典吏失望而去，但你的谨慎也避免了潜在风险。',
        },
      ],
      condition: { minReputation: 60, minConnections: { government: 45 } },
    },
    {
      id: 'q_secret_envoy',
      type: 'random',
      title: '🕵️ 密使来访',
      description:
        '深夜，一位自称"蒋先生"的陌生人扣响了号门。他出示了一枚不知何处的官印，称有一笔"不便走公账"的银两需要汇兑——' +
        '十五万两，从太原到广州，酬金三倍于市价。但此人从头到尾未透露真实身份。',
      options: [
        {
          id: 'accept_secret',
          text: '接！不问来路，只认银票',
          effects: {
            silver: { headquarters: 12_000, inTransit: 150_000 },
            reputation: -3,
            connections: { government: 15 },
          },
          outcomeDescription:
            '交易神不知鬼不觉地完成了。你赚了一大笔，但也隐约觉得被卷入了某种不可言说的漩涡。几日后，太原官场有人对你格外客气……这未必是好事。',
        },
        {
          id: 'refuse_secret',
          text: '婉拒——本号做的是正经生意',
          effects: {
            reputation: 6,
          },
          outcomeDescription:
            '你以"号规所限不便承接不明来路的汇兑"为由婉拒。蒋先生一言不发地消失在夜色中。你保住了清白，但错失了一笔大生意。',
        },
      ],
      condition: { minReputation: 40 },
    },
  ];
}

// ================================================================
// 招聘事件（人手不足时触发）
// ================================================================

function generateRecruitmentEvents(state: GameState): GameEvent[] {
  const totalStaff = state.staff.length;
  const clerkCount = state.staff.filter(s => s.role === 'clerk').length;

  // 人手充裕时不触发
  if (totalStaff >= 7 && clerkCount >= 4) return [];

  const currentYear = state.date.year;
  const events: GameEvent[] = [];

  // 从角色池中筛选符合年份条件且未入职的
  const availableFromPool = RECRUITABLE_POOL.filter(p => {
    const alreadyHired = state.staff.some(s => s.id === p.id);
    if (alreadyHired) return false;
    // 前期角色：id 100-104，年份 >= 1810
    if (p.id <= 104) return currentYear >= 1810;
    // 中后期角色：id 105-109，年份 >= 1820
    return currentYear >= 1820;
  });

  // 从角色池中选一个人加入
  if (availableFromPool.length > 0) {
    const candidate = pickRandom(availableFromPool);
    const roleLabel = candidate.role === 'clerk' ? '伙友' : '学徒';
    events.push({
      id: `q_recruit_pool_${candidate.id}`,
      type: 'random',
      title: '👤 贤才来投',
      description:
        `一名在外闯荡多年的${roleLabel}「${candidate.name}」托商帮中人引荐，愿入本号效力。` +
        `此人以${candidate.talentBonus || '踏实肯干'}著称，` +
        (candidate.role === 'clerk'
          ? `能力 ${candidate.ability}，忠诚 ${candidate.loyalty}`
          : `资质 ${candidate.talent}，忠诚 ${candidate.loyalty}`) +
        '。正值用人之际，是否延揽？',
      options: [
        {
          id: 'hire_pool',
          text: `延揽入号——${roleLabel}难求`,
          effects: {},
          _hireStaff: { ...candidate, stationedAt: 'headquarters' },
          outcomeDescription:
            candidate.role === 'clerk'
              ? `「${candidate.name}」正式入号。总号账房多了一员干将。`
              : `「${candidate.name}」正式拜师入号。新一代的力量让人欣慰。`,
        },
        {
          id: 'decline_pool',
          text: '容后再议——号中尚不急需',
          effects: {},
          outcomeDescription: '你暂且婉拒了。不过此人既已露面，日后或许还会再来。',
        },
      ],
    });
  }

  // 人手确实紧缺时额外生成随机学徒
  if (totalStaff < 5) {
    const nextId = Math.max(0, ...state.staff.map(s => s.id)) + events.length + 200;
    const randomApprentice = generateApprentice(nextId, 'headquarters');
    events.push({
      id: `q_recruit_random_${nextId}`,
      type: 'random',
      title: '👤 毛遂自荐',
      description:
        `一位自称曾在别号做过一年学徒的年轻人「${randomApprentice.name}」登门求职，` +
        `愿意从学徒重新做起。谈吐得体，资质 ${randomApprentice.talent}，` +
        `${randomApprentice.talentBonus || '暂无特殊天赋'}。`,
      options: [
        {
          id: 'hire_random',
          text: '收下——目前人手不足，多多益善',
          effects: {},
          _hireStaff: randomApprentice,
          outcomeDescription: `学徒「${randomApprentice.name}」入职。虽需时日培养，但也算添了一双手。`,
        },
        {
          id: 'decline_random',
          text: '婉拒，学徒多了也难带',
          effects: {},
          outcomeDescription: '你送走了年轻人。但愿号中现有人手能撑得住。',
        },
      ],
    });
  }

  return events;
}

// ================================================================
// 危机自救事件（信誉低下时提供主动逃生手段）
// ================================================================

function generateCrisisRecoveryEvents(state: GameState): GameEvent[] {
  const rep = state.resources.reputation;
  const currentSeason = state.date.year * 4 + state.date.season;
  const events: GameEvent[] = [];

  // 1) 商会宴请（信誉<50 时可用，冷却 4 季）
  if (rep < 50 && state.resources.silver.headquarters >= 5_000
      && currentSeason - state.lastBanquetSeason >= 4) {
    events.push({
      id: 'crisis_banquet',
      type: 'random',
      title: '🍶 商会宴请',
      description: `信誉低迷，商界对本号议论纷纷。何不在醉仙楼设宴，邀商会头面人物一聚？花费 5,000 两置办上等酒席，借机展示本号实力。`,
      options: [
        {
          id: 'host_banquet',
          text: '大摆宴席——5,000 两只为挽回名声',
          effects: {
            silver: { headquarters: -5_000 },
            reputation: 5,
            connections: { merchantGuild: 3 },
          },
          outcomeDescription: '觥筹交错间，你从容谈及号中经营，不卑不亢。席散后，商会中人对你刮目相看。',
        },
        {
          id: 'skip_banquet',
          text: '省下这笔钱——清者自清',
          effects: {},
          outcomeDescription: '你决定用经营实绩说话。但愿商界也这么想。',
        },
      ],
    });
  }

  // 2) 东家注资（信誉<30 时可用，仅 1 次）
  if (rep < 30 && !state.ownerBailoutUsed) {
    events.push({
      id: 'crisis_owner_bailout',
      type: 'crisis',
      title: '🏠 东家援手',
      description: `东家闻知号中困境，遣人递话：「若有急需，府中尚有些积蓄。」若开口求援，可解燃眉之急——但东家从此对你信任大减。此恩此情，终生难还。`,
      options: [
        {
          id: 'accept_bailout',
          text: '恳请东家注资——八十万两雪中送炭',
          effects: {
            silver: { headquarters: 80_000 },
            connections: { owner: -20 },
          },
          outcomeDescription: '东家沉默良久，终于点头。八十万两入库，号中上下松了一口气。但你知道——这份人情，不是银子能还得清的。',
        },
        {
          id: 'decline_bailout',
          text: '婉拒——大掌柜的担子自己扛',
          effects: { reputation: 1 },
          outcomeDescription: '你向东家拱手道谢，转身离去。号中伙友见你硬气，士气反而提振。',
        },
      ],
    });
  }

  // 3) 民间高利贷（信誉<60 且总银<100k 时可用）
  if (rep < 60 && state.resources.silver.totalSilver < 100_000) {
    events.push({
      id: 'crisis_loan_shark',
      type: 'crisis',
      title: '💰 地下钱庄',
      description: `夜深人静，有人扣门。来者是平遥城里有名的"暗账房"——专做官面上不了台面的银钱生意。他愿借五万两应急，但利息……是市面三倍。而且此人的银子，沾着说不清的来历。`,
      options: [
        {
          id: 'take_loan',
          text: '借！五万两到手，管不了那么多',
          effects: {
            silver: { headquarters: 50_000 },
            reputation: -2,
          },
          outcomeDescription: '银子到手，号中周转顿时宽松。但每季 3,000 两的利息像一条毒蛇缠上了你的脖子。而且那位"暗账房"隔三差五派人来"坐坐"……',
        },
        {
          id: 'refuse_loan',
          text: '这种银子不敢碰——送客！',
          effects: { reputation: 1 },
          outcomeDescription: '你断然拒绝了。宁可在明处亏，不在暗处死。这句话，你从小就听老掌柜说过。',
        },
      ],
    });
  }

  // 4) 商帮联合担保（信誉<40 且商帮好感≥50 时可用，冷却 8 季）
  if (rep < 40 && state.resources.connections.merchantGuild >= 50
      && currentSeason - state.lastBanquetSeason >= 8) {
    events.push({
      id: 'crisis_guild_guarantee',
      type: 'crisis',
      title: '🤝 商帮联保',
      description: `你想起商会中几位老交情。若能请动三家大商号联合为本号担保，信誉当可重振。但——要人家为你担风险，这份人情比天大。你欠下的不仅是银子，更是晋商圈子里的人情债。`,
      options: [
        {
          id: 'request_guarantee',
          text: '动用所有人情——请三家商号联保',
          effects: {
            connections: { merchantGuild: -30 },
            reputation: 15,
          },
          outcomeDescription: '三位商号东家最终点了头。联保告示贴出后，存户情绪渐稳。但你欠下的这份大人情，日后少不得要还。',
        },
        {
          id: 'decline_guarantee',
          text: '不想连累朋友——自己的烂摊子自己收',
          effects: { reputation: 1 },
          outcomeDescription: '你没有开口。老交情是用来共富贵、更是用来共患难的——但有些难，得自己挺过去。',
        },
      ],
    });
  }

  return events;
}
