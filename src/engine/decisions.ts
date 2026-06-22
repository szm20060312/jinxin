// ============================================================
// 季度决策生成引擎 v3 —— 《晋·信》
//
// v3 改进（Phase A 游戏性）：
// - 决策精简：5 必出 → 3 必出 + 1 动态，降低决策疲劳
// - 银两运营：合并调拨 + 放款 + 巡查
// - 费率定价：合并汇费 + 存贷利率
// - 伙友调度从动态提升为必出（每季均有人事考量）
// ============================================================

import type { GameState, QuarterlyDecision, Staff } from '../types';
import { INSPECTION_COST } from '../data/constants';
import { calcReserveRatio, getReserveHealth } from './resources';
import { pickRandom, chance } from '../utils/random';

let nextDecisionId = 0;

/**
 * 生成当前状态下的季度决策（精简版：3 必出 + 1 动态）
 */
export function generateQuarterlyDecisions(state: GameState): QuarterlyDecision[] {
  // 核心决策（每次必出，精简为 3 项）
  const coreDecisions: QuarterlyDecision[] = [
    generateSilverOps(state),
    generatePricingOps(state),
    generateStaffDispatch(state),
  ].filter(Boolean) as QuarterlyDecision[];

  // 动态决策池（随机抽取 1 项）
  const dynamicPool: (() => QuarterlyDecision | null)[] = [
    () => generateOpportunity(state),
    () => generateThreat(state),
    () => generateSeasonEvent(state),
    () => generateCompetitorMove(state),
    () => generateRumorResponse(state),
  ];

  // 打乱并选取 1 项
  const shuffled = [...dynamicPool].sort(() => Math.random() - 0.5);
  let dynamic: QuarterlyDecision | null = null;
  for (const fn of shuffled) {
    const result = fn();
    if (result) { dynamic = result; break; }
  }

  return dynamic ? [...coreDecisions, dynamic] : coreDecisions;
}

// ================================================================
// 核心 1：银两运营（合并 调拨 + 放款额度 + 巡查）
// ================================================================

function generateSilverOps(state: GameState): QuarterlyDecision {
  const hq = state.resources.silver.headquarters;
  const hk = state.resources.silver.hankou;
  const zjk = state.resources.silver.zhangjiakou;
  const reserveRatio = (calcReserveRatio(state.resources.silver) * 100).toFixed(1);
  const health = getReserveHealth(state.resources.silver);
  const currentLimit = state.pricing.loanLimit;
  const hqCritical = hq < 10_000;
  const recallThreshold = hqCritical ? 20_000 : 50_000;

  const warnings: string[] = [];
  if (hqCritical) warnings.push('🚨 总号库银告急！');
  if (health === 'danger') warnings.push('⚠️ 准备金严重不足！');

  const hkCrisis = state.branches.hankou.status === 'crisis' ? '（经营困难，不宜抽银）' : '';
  const zjkCrisis = state.branches.zhangjiakou.status === 'crisis' ? '（经营困难，不宜抽银）' : '';

  const options: QuarterlyDecision['options'] = [
    {
      id: 'send_hankou',
      label: `向汉口分号拨银 30,000 两${hkCrisis}${hq < 30_000 ? ' — 库银不足' : ''}`,
      effects: { silver: { headquarters: -30_000, inTransit: 30_000 } },
      _fundTransfer: { target: 'hankou', amount: 30_000 },
      predictedImpact: '3 万两在途，每季半数抵达汉口',
      disabled: hq < 30_000,
      disabledReason: '总号库银不足 30,000 两',
    },
    {
      id: 'send_zhangjiakou',
      label: `向张家口分号拨银 25,000 两${zjkCrisis}${hq < 25_000 ? ' — 库银不足' : ''}`,
      effects: { silver: { headquarters: -25_000, inTransit: 25_000 } },
      _fundTransfer: { target: 'zhangjiakou', amount: 25_000 },
      predictedImpact: '2.5 万两在途，每季半数抵达张家口',
      disabled: hq < 25_000,
      disabledReason: '总号库银不足 25,000 两',
    },
  ];

  if (hk > recallThreshold) {
    options.push({
      id: 'recall_hankou',
      label: `从汉口分号调回 ${(hqCritical ? hk - recallThreshold : 15_000).toLocaleString()} 两`,
      effects: { silver: { hankou: hqCritical ? -(hk - recallThreshold) : -15_000, inTransit: hqCritical ? hk - recallThreshold : 15_000 } },
      _fundTransfer: { target: 'headquarters' as const, amount: hqCritical ? hk - recallThreshold : 15_000 },
      predictedImpact: hqCritical ? '紧急回补总号！' : '汉口闲银运回总号途中',
    });
  }
  if (zjk > recallThreshold) {
    options.push({
      id: 'recall_zhangjiakou',
      label: `从张家口分号调回 ${(hqCritical ? zjk - recallThreshold : 15_000).toLocaleString()} 两`,
      effects: { silver: { zhangjiakou: hqCritical ? -(zjk - recallThreshold) : -15_000, inTransit: hqCritical ? zjk - recallThreshold : 15_000 } },
      _fundTransfer: { target: 'headquarters' as const, amount: hqCritical ? zjk - recallThreshold : 15_000 },
      predictedImpact: hqCritical ? '紧急回补总号！' : '口外闲银运回总号途中',
    });
  }

  options.push(
    {
      id: 'raise_limit',
      label: `放款上限提至 ${Math.round(currentLimit * 1.5).toLocaleString()} 两（进取）`,
      effects: { reputation: -3 },
      predictedImpact: '利厚但风险增，需准备金充裕',
    },
    {
      id: 'lower_limit',
      label: `放款上限降至 ${Math.max(10_000, Math.round(currentLimit * 0.6)).toLocaleString()} 两（保守）`,
      effects: { reputation: 3 },
      predictedImpact: '收入减但商界赞本号谨慎',
    },
    {
      id: 'inspect',
      label: `巡查分号一处（${INSPECTION_COST.toLocaleString()} 两）${hq < INSPECTION_COST ? ' — 库银不足' : ''}`,
      effects: { silver: { headquarters: -INSPECTION_COST } },
      predictedImpact: '将自动巡查状态最差的分号',
      disabled: hq < INSPECTION_COST,
      disabledReason: `总号库银不足 ${INSPECTION_COST.toLocaleString()} 两`,
    },
    {
      id: 'silver_none',
      label: '维持不变，稳字当头',
      effects: {},
      predictedImpact: '不增不减，按现有编制运转',
    }
  );

  return {
    id: 'silver_ops',
    category: 'fund',
    title: '银两运营',
    description: `总号 ${hq.toLocaleString()} 两 · 汉口 ${hk.toLocaleString()} 两 · 张家口 ${zjk.toLocaleString()} 两 · 准备金率 ${reserveRatio}%。${warnings.join(' ')}`,
    options,
    currentValue: `放款上限 ${currentLimit.toLocaleString()} 两/季`,
    multiSelect: true,
  };
}

// ================================================================
// 核心 2：费率定价（合并 汇费 + 存贷利率）
// ================================================================

function generatePricingOps(state: GameState): QuarterlyDecision {
  const hkFee = state.pricing.hankouFee;
  const zjkFee = state.pricing.zhangjiakouFee;
  const depositRate = state.pricing.depositRate;

  return {
    id: 'pricing_ops',
    category: 'pricing',
    title: '费率定价',
    description: `汇费 汉口${hkFee}% / 张家口${zjkFee}% · 存息 ${depositRate}%。费率决定客户量与利润的平衡。`,
    options: [
      {
        id: 'aggressive',
        label: `提汇费 +1.0%、降存息 -0.5%（重利润）`,
        effects: { reputation: -6 },
        predictedImpact: '单笔利润大增，但客户与储户可能流失',
      },
      {
        id: 'attract',
        label: `降汇费 -1.0%、提存息 +0.5%（重客户）`,
        effects: { reputation: 6 },
        predictedImpact: '吸储揽客，商誉上升，但利润率下降',
      },
      {
        id: 'volume',
        label: `双降：降汇费 -1.0%、降存息 -0.5%（让利换量）`,
        effects: { reputation: 3 },
        predictedImpact: '薄利但客户量将明显增长',
      },
      {
        id: 'keep_pricing',
        label: '维持现有费率不变',
        effects: {},
        predictedImpact: '稳定经营，客户预期平稳',
      },
    ],
    currentValue: `汇费 ${hkFee}%/${zjkFee}% · 存息 ${depositRate}%`,
  };
}

// ================================================================
// 动态 1：机遇决策（~35% 概率出现）
// ================================================================

function generateOpportunity(_state: GameState): QuarterlyDecision | null {
  if (!chance(0.35)) return null;

  const opportunities = [
    {
      title: '大茶商汇兑大单',
      description: '一位福建茶商登门，欲将今秋茶银二十万两全部交由本号汇兑。但要求汇费比市价低半厘。',
      options: [
        {
          id: 'give_discount',
          label: '同意优惠汇费（本季汇费减半厘，信誉+3）',
          effects: { reputation: 9 },
          predictedImpact: '虽利润略减，但二十万两大单足可扬名，茶商圈从此打开',
        },
        {
          id: 'insist_price',
          label: '坚持原价，不坏行规',
          effects: {},
          predictedImpact: '守住行规，但茶商可能另寻别号',
        },
      ],
    },
    {
      title: '盐商存银',
      description: '扬州盐商欲在本号存银十五万两，但要求高于市价半厘的存款利率。盐商财大气粗，是难得的储户。',
      options: [
        {
          id: 'accept_deposit',
          label: '接受条件（存款利率+0.5%、存银+15万两）',
          effects: { silver: { headquarters: 150_000 }, reputation: 6 },
          predictedImpact: '存银大增，可放款空间扩大，但利息支出也增加',
        },
        {
          id: 'decline_deposit',
          label: '婉拒——号规不可为一人而破',
          effects: { connections: { merchantGuild: -3 } },
          predictedImpact: '盐商不快，可能在商会中说本号坏话',
        },
      ],
    },
    {
      title: '新的商路',
      description: '一位跑口外的老客商带来消息：恰克图新开互市，俄国毛皮涌入，白银结算需求巨大。若在张家口设专项汇兑，利厚。',
      options: [
        {
          id: 'open_route',
          label: '开辟恰克图专项汇兑（花费 8,000 两，张家口汇费率+0.3%）',
          effects: {
            silver: { headquarters: -8_000, zhangjiakou: 8_000 },
            reputation: 3,
          },
          predictedImpact: '口外商路扩展，张家口业务量将提升 20%',
        },
        {
          id: 'wait_and_see',
          label: '观望一季，看看行情再说',
          effects: {},
          predictedImpact: '谨慎不冒进，但可能错失先机',
        },
      ],
    },
  ];

  const chosen = pickRandom(opportunities);
  return {
    id: `opportunity_${++nextDecisionId}`,
    category: 'fund',
    title: `机遇：${chosen.title}`,
    description: chosen.description,
    options: chosen.options.map((opt, i) => ({
      id: `opp_${i}`,
      label: opt.label,
      effects: opt.effects,
      predictedImpact: opt.predictedImpact,
    })),
  };
}

// ================================================================
// 动态 2：威胁决策（条件触发）
// ================================================================

function generateThreat(state: GameState): QuarterlyDecision | null {
  const health = getReserveHealth(state.resources.silver);
  const baseChance = health === 'danger' ? 0.7 : health === 'warning' ? 0.4 : 0.15;
  if (!chance(baseChance)) return null;

  const threats = [
    {
      title: '同行恶意压价',
      description: '太谷曹家票号突然将汉口汇费降至 1.8%，摆明了要抢本号客户。商界都在等着看本号如何应对。',
      condition: () => state.pricing.hankouFee > 2.0,
      options: [
        {
          id: 'match_price',
          label: '跟随降价（汉口汇费降至 1.8%）',
          effects: { reputation: -3 },
          predictedImpact: '保住了客户但利润大减，同行争斗两败俱伤',
        },
        {
          id: 'quality_defense',
          label: '不跟价——以服务取胜，加强客户关系',
          effects: { connections: { merchantGuild: 9 }, reputation: 3 },
          predictedImpact: '短期流失部分客户，但口碑反而更好',
        },
      ],
    },
    {
      title: '商会催捐',
      description: '平遥商会来函，要求各票号按存银比例分摊修桥银五千两。若拒捐，恐在商会中孤立。',
      options: [
        {
          id: 'donate',
          label: '如数捐出（花费 5,000 两）',
          effects: {
            silver: { headquarters: -5_000 },
            connections: { merchantGuild: 15 },
          },
          predictedImpact: '在商会中赢得好名声，日后商业纠纷有人撑腰',
        },
        {
          id: 'partial',
          label: '捐半（2,500 两）表明态度',
          effects: {
            silver: { headquarters: -2_500 },
            connections: { merchantGuild: 3 },
          },
          predictedImpact: '比不捐强，但也不算大方',
        },
        {
          id: 'refuse',
          label: '拒绝——修桥是官府的事',
          effects: { connections: { merchantGuild: -24 } },
          predictedImpact: '得罪商会，以后办事怕是不顺',
        },
      ],
    },
    {
      title: '官府查封警告',
      description: '太原府突然派员来查票号账目，说是例行巡查，但传言某票号因账目不清已被查封。来者不善。',
      condition: () => state.resources.connections.government < 50,
      options: [
        {
          id: 'cooperate',
          label: '主动配合，奉上茶钱（花费 3,000 两打点）',
          effects: {
            silver: { headquarters: -3_000 },
            connections: { government: 15 },
          },
          predictedImpact: '官差满意而去，还夸本号"账目最清"',
        },
        {
          id: 'stand_ground',
          label: '据理力争——号规严密，不怕查',
          effects: { reputation: 6 },
          predictedImpact: '官差碰了软钉子，但日后恐有小鞋穿',
        },
      ],
    },
  ];

  const available = threats.filter(t => !t.condition || t.condition());
  if (available.length === 0) return null;

  const chosen = pickRandom(available);
  return {
    id: `threat_${++nextDecisionId}`,
    category: 'fund',
    title: `⚠️ 威胁：${chosen.title}`,
    description: chosen.description,
    options: chosen.options.map((opt, i) => ({
      id: `threat_${i}`,
      label: opt.label,
      effects: opt.effects,
      predictedImpact: opt.predictedImpact,
    })),
  };
}

// ================================================================
// 动态 3：季节事件
// ================================================================

function generateSeasonEvent(state: GameState): QuarterlyDecision | null {
  if (!chance(0.3)) return null;

  const season = state.date.season;
  const events: Record<number, { title: string; description: string; options: { label: string; effects: Record<string, unknown>; predictedImpact: string; }[] }> = {
    1: {
      title: '春耕放贷',
      description: '春耕时节，四乡农户需要种子银、农具银。县太爷倡导票号为农户提供小额春耕贷，利虽薄但可得官府表彰。',
      options: [
        { label: '开办春耕贷（发放 15,000 两小额农贷）', effects: { silver: { headquarters: -15_000 }, connections: { government: 24 }, reputation: 9 }, predictedImpact: '官府大喜，百姓称颂。秋后收回本利' },
        { label: '不凑这个热闹——农贷风险大', effects: {}, predictedImpact: '保守经营，但县太爷觉得本号"不够体恤"' },
      ],
    },
    2: {
      title: '汛期防范',
      description: '长江流域即将进入汛期。汉口分号位于江边，往年常有水患。是否需要加固库房、提前转移部分存银？',
      options: [
        { label: '加固库房、转移存银（花费 5,000 两）', effects: { silver: { headquarters: -5_000 } }, predictedImpact: '防范于未然，洪灾来时不至于措手不及' },
        { label: '未必今年就有大水，省下这笔钱', effects: {}, predictedImpact: '赌一把运气。但若真的大水…后果不堪设想' },
      ],
    },
    3: {
      title: '秋粮汇兑潮',
      description: '秋收后各地粮商集中结算，汇兑需求激增。但各分号人手有限，可能应接不暇。是否临时增调人手？',
      options: [
        { label: '增调人手应对汇兑高峰（花费 3,000 两临时雇工）', effects: { silver: { headquarters: -3_000 }, reputation: 6 }, predictedImpact: '接住了旺季，客户满意。多赚了一季好口碑' },
        { label: '按现有编制运转，来多少做多少', effects: {}, predictedImpact: '部分客户可能需要排队，体验不佳' },
      ],
    },
    4: {
      title: '年关结算',
      description: '腊月将至，各家商号开始年终结账。本号也需要准备充足库银应对集中兑付。',
      options: [
        { label: '收缩放款，集结库银（召回 30,000 两放款）', effects: { silver: { headquarters: 30_000 }, reputation: 3 }, predictedImpact: '年关从容应对，客户安心过年' },
        { label: '照常经营，不必过度紧张', effects: {}, predictedImpact: '若兑付量超预期，可能库银紧张' },
      ],
    },
  };

  const evt = events[season];
  if (!evt) return null;

  return {
    id: `season_event_${++nextDecisionId}`,
    category: 'pricing',
    title: `🌤 ${evt.title}`,
    description: evt.description,
    options: evt.options.map((opt, i) => ({
      id: `season_${i}`,
      label: opt.label,
      effects: opt.effects,
      predictedImpact: opt.predictedImpact,
    })),
  };
}

// ================================================================
// 核心 3 / 动态 4：伙友调度（提升为必出决策）
// ================================================================

function generateStaffDispatch(state: GameState): QuarterlyDecision | null {
  const clerks = state.staff.filter(s => s.role === 'clerk');
  if (clerks.length === 0) return null;

  const clerkNames = clerks.map(c => `${c.name}(${stationLabel(c.stationedAt)})`).join('、');
  const hkNeeds = state.branches.hankou.status !== 'normal';
  const zjkNeeds = state.branches.zhangjiakou.status !== 'normal';

  const description = `现有伙友：${clerkNames}。` +
    (hkNeeds || zjkNeeds
      ? `${hkNeeds ? '汉口分号急需人手' : ''}${hkNeeds && zjkNeeds ? '，' : ''}${zjkNeeds ? '张家口分号缺人' : ''}。请从总号调派人手。`
      : '各分号按现有编制运转中。可主动调整驻场布局。');

  const options: QuarterlyDecision['options'] = [];

  const hqClerks = clerks.filter(c => c.stationedAt === 'headquarters');
  for (const clerk of hqClerks) {
    if (hkNeeds) {
      options.push({
        id: `send_${clerk.id}_hankou`,
        label: `派「${clerk.name}」（能力${clerk.ability}）支援汉口`,
        effects: { connections: { merchantGuild: 6 } },
        _staffDispatch: { staffId: clerk.id, targetStation: 'hankou' },
        predictedImpact: '汉口分号获得人力支援，商帮好感微增',
      });
    }
    if (zjkNeeds) {
      options.push({
        id: `send_${clerk.id}_zhangjiakou`,
        label: `派「${clerk.name}」（能力${clerk.ability}）支援张家口`,
        effects: { connections: { merchantGuild: 6 } },
        _staffDispatch: { staffId: clerk.id, targetStation: 'zhangjiakou' },
        predictedImpact: '口外分号获得人力支援，商帮好感微增',
      });
    }
  }

  if (!hkNeeds && !zjkNeeds) {
    const hkClerks = clerks.filter(c => c.stationedAt === 'hankou');
    const zjkClerks = clerks.filter(c => c.stationedAt === 'zhangjiakou');
    for (const clerk of [...hkClerks, ...zjkClerks]) {
      const target = clerk.stationedAt === 'hankou' ? 'zhangjiakou' : 'hankou';
      const targetName = target === 'hankou' ? '汉口' : '张家口';
      options.push({
        id: `rotate_${clerk.id}_${target}`,
        label: `将「${clerk.name}」从${stationLabel(clerk.stationedAt)}轮调至${targetName}`,
        effects: {},
        _staffDispatch: { staffId: clerk.id, targetStation: target as Staff['stationedAt'] },
        predictedImpact: '轮换驻场，开拓视野',
      });
    }
  }

  options.push({
    id: 'keep',
    label: '维持当前人员配置',
    effects: {},
    predictedImpact: options.length > 1 ? '各分号按现有编制运转' : '暂无合适调度人选',
  });

  return {
    id: 'staff_dispatch',
    category: 'staff',
    title: '伙友调度',
    description,
    options,
    currentValue: `${state.staff.length} 人在号`,
  };
}

/** 驻场地简写 */
function stationLabel(dest: Staff['stationedAt']): string {
  if (dest === 'headquarters') return '总号';
  if (dest === 'hankou') return '汉口';
  if (dest === 'zhangjiakou') return '张家口';
  return String(dest || '—');
}

// ================================================================
// 动态 5：同行竞争
// ================================================================

function generateCompetitorMove(_state: GameState): QuarterlyDecision | null {
  if (!chance(0.25)) return null;

  const moves = [
    {
      description: '介休侯家票号在汉口新开了分号，装修气派。有传言说他们正在挖角汉口掌柜。',
      options: [
        {
          id: 'raise_loyalty',
          label: '给汉口掌柜加薪留人（季薪+10 两）',
          effects: { silver: { headquarters: -30 } },
          predictedImpact: '掌柜感恩，忠诚度提升',
        },
        {
          id: 'trust',
          label: '相信掌柜不会走',
          effects: {},
          predictedImpact: '疑人不用，用人不疑。但人心难测…',
        },
      ],
    },
    {
      description: '祁县渠家票号推出"存银送红"活动——存一万两以上送纹银十两。在市面上引起不小反响。',
      options: [
        {
          id: 'follow',
          label: '跟风推出类似活动',
          effects: { silver: { headquarters: -2_000 } },
          predictedImpact: '留住储户但增加成本',
        },
        {
          id: 'ignore',
          label: '不跟风——本号以信义取胜，不靠噱头',
          effects: { reputation: 3 },
          predictedImpact: '定位清晰，反而赢得老客户尊重',
        },
      ],
    },
  ];

  const chosen = pickRandom(moves);
  return {
    id: `competitor_move_${++nextDecisionId}`,
    category: 'pricing',
    title: '同行动向',
    description: chosen.description,
    options: chosen.options.map((opt, i) => ({
      id: `comp_${i}`,
      label: opt.label,
      effects: opt.effects,
      predictedImpact: opt.predictedImpact,
    })),
  };
}

// ================================================================
// 动态 6：市井传言
// ================================================================

function generateRumorResponse(_state: GameState): QuarterlyDecision | null {
  if (!chance(0.2)) return null;

  const rumors = [
    {
      description: '平遥街上有传言：朝廷即将统一银两平色标准，现有库银可能要重铸。消息一出，存户纷纷来兑。',
      options: [
        {
          id: 'reassure',
          label: '张贴告示安抚存户，承诺无论改铸与否都保本保息',
          effects: { connections: { merchantGuild: 9 } },
          predictedImpact: '存户情绪稳定，挤兑风险消除',
        },
        {
          id: 'prepare',
          label: '暗中备银应对兑付潮',
          effects: {},
          predictedImpact: '不动声色，但库银可能短期紧张',
        },
      ],
    },
    {
      description: '传言张家口外的蒙古部落有异动，商路可能暂时中断。张家口客户纷纷来询。',
      options: [
        {
          id: 'investigate',
          label: '派快马前往张家口核实（花费 500 两）',
          effects: { silver: { headquarters: -500 } },
          predictedImpact: '获知真相，便于决策',
        },
        {
          id: 'dismiss',
          label: '口外传言不可尽信，照常经营',
          effects: {},
          predictedImpact: '省下跑腿钱，但心里不踏实',
        },
      ],
    },
  ];

  const chosen = pickRandom(rumors);
  return {
    id: `rumor_response_${++nextDecisionId}`,
    category: 'pricing',
    title: '市井传言',
    description: chosen.description,
    options: chosen.options.map((opt, i) => ({
      id: `rumor_${i}`,
      label: opt.label,
      effects: opt.effects,
      predictedImpact: opt.predictedImpact,
    })),
  };
}
