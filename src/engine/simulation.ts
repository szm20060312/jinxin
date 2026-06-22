// ============================================================
// 季度模拟引擎 —— 《晋·信》
//
// 每季自动运行一次，计算：
// 1. 各分号汇兑业务量 & 汇费收入
// 2. 存银利息支出
// 3. 放款利息收入
// 4. 伙友薪资支出
// 5. 信誉自然变动
// ============================================================

import type { GameState } from '../types';
import type { SeasonIncome } from './resources';
import { BASE_REMITTANCE_VOLUME, getReputationMultiplier, MONTHLY_SALARY, IN_TRANSIT_ARRIVAL_RATE, DEPOSIT_GROWTH_RATE, DEPOSIT_DECLINE_RATE } from '../data/constants';
import { randomVariance, clamp } from '../utils/random';
import { calcSeasonalReputationChange } from './reputation';

// ---- 主营：汇兑业务 ----

/**
 * 计算一个分号本季的汇兑业务量
 *
 * 公式：基础量 × 信誉倍率 × 分号掌柜能力修正 × 随机波动(±15%)
 */
function calcBranchRemittanceVolume(
  state: GameState,
  branchId: 'hankou' | 'zhangjiakou'
): number {
  const branch = state.branches[branchId];
  const baseVolume = BASE_REMITTANCE_VOLUME[branchId];

  // 信誉倍率
  const reputationMultiplier = getReputationMultiplier(
    state.resources.reputation >= 85
      ? 'golden'
      : state.resources.reputation >= 70
        ? 'excellent'
        : state.resources.reputation >= 40
          ? 'average'
          : state.resources.reputation >= 20
            ? 'shaky'
            : 'ruined'
  );

  // 掌柜能力修正（50 为基准，每点加减 1%）
  const managerModifier = 1 + (branch.managerAbility - 50) / 100;

  // 驻场伙友能力修正（取驻场 clerks 平均能力，无人时默认 50）
  const stationedClerks = state.staff.filter(
    s => s.role === 'clerk' && s.stationedAt === branchId
  );
  const clerkAvgAbility = stationedClerks.length > 0
    ? stationedClerks.reduce((sum, s) => sum + s.ability, 0) / stationedClerks.length
    : 50;
  const staffModifier = 0.7 * managerModifier + 0.3 * (clerkAvgAbility / 50);

  // 分号状态修正
  const statusModifier = branch.status === 'crisis' ? 0.3 : branch.status === 'recovering' ? 0.7 : 1.0;

  // 分号等级修正（一等 100%、二等 85%）
  const tierModifier = branch.tier === 1 ? 1.0 : 0.85;

  // 高能高忠伙友额外加成
  const hasStarClerk = stationedClerks.some(s => s.ability > 80 && s.loyalty > 70);
  const starBonus = hasStarClerk ? 1.08 : 1.0;

  const volume = baseVolume * reputationMultiplier * staffModifier * statusModifier * tierModifier * starBonus;
  return Math.round(randomVariance(volume, 0.15));
}

/**
 * 计算汇兑收入
 * 收入 = 业务量 × 汇费率
 * @param volume 已计算好的业务量（避免重复随机）
 */
function calcRemittanceIncome(
  state: GameState,
  branchId: 'hankou' | 'zhangjiakou',
  volume: number
): number {
  const feeRate = branchId === 'hankou'
    ? state.pricing.hankouFee / 100
    : state.pricing.zhangjiakouFee / 100;

  return Math.round(volume * feeRate);
}

// ---- 存银业务 ----

/**
 * 计算存银利息支出
 *
 * 仅对外部储户存款计付利息，票号自有资金不计息。
 * 外部存款通过事件/决策/信誉变动增减。
 */
function calcDepositExpense(state: GameState): number {
  const externalDeposits = state.resources.silver.externalDeposits;

  // 季度利息支出（年利率 × 1/4）
  const quarterlyRate = state.pricing.depositRate / 100 / 4;
  const expense = Math.round(externalDeposits * quarterlyRate);

  return -expense; // 负值表示支出
}

// ---- 放款业务 ----

/**
 * 计算放款利息收入
 *
 * 放款受限于：准备金率、季度放款上限、各分号可放额度
 */
function calcLoanInterest(state: GameState): number {
  // 实际放款量 = min(可放额度, 放款上限, 准备金安全量)
  const lendableFromHQ = Math.max(0, state.resources.silver.headquarters * (1 - 0.20)); // 总号留 20%
  const lendableFromBranches =
    Math.max(0, state.resources.silver.hankou * 0.3) +
    Math.max(0, state.resources.silver.zhangjiakou * 0.3);

  const totalLendable = lendableFromHQ + lendableFromBranches;
  const actualLoaned = Math.min(totalLendable, state.pricing.loanLimit);

  // 放款利率一般是存款利率的 3~5 倍
  const loanRate = Math.max(state.pricing.depositRate * 5, 10); // 最低 10% 年利率
  const quarterlyRate = loanRate / 100 / 4;

  return Math.round(actualLoaned * quarterlyRate);
}

// ---- 支出项 ----

/**
 * 计算季度运营支出
 * - 伙友薪资（月薪 × 3 个月 × 人数）
 * - 巡查成本（若有）
 * - 杂项开销
 */
function calcOperatingExpenses(state: GameState): number {
  // 伙友薪资
  let salaryTotal = 0;
  for (const staff of state.staff) {
    salaryTotal += (MONTHLY_SALARY[staff.role] || 5) * 3;
  }

  // 分号运营费（每分号每季 500 两）
  const branchOps = 2 * 500; // 汉口 + 张家口

  // 总号日常开销 800 两
  const hqOps = 800;

  return -(salaryTotal + branchOps + hqOps);
}

// ---- 主入口：模拟一季度 ----

export interface SimulationResult {
  /** 汉口汇兑业务量 */
  hankouVolume: number;
  /** 汉口汇费收入 */
  hankouRemittance: number;
  /** 张家口汇兑业务量 */
  zhangjiakouVolume: number;
  /** 张家口汇费收入 */
  zhangjiakouRemittance: number;
  /** 季度收支明细 */
  income: SeasonIncome;
  /** 信誉变动 */
  reputationChange: number;
  /** 新在途银 */
  newInTransit: number;
}

/**
 * 执行一季经济模拟
 *
 * 这是游戏核心经济循环，纯函数，不修改传入的 state
 */
export function simulateSeason(state: GameState): SimulationResult {
  // 1. 汇兑业务（volume 仅计算一次，传入 calcRemittanceIncome 避免双重随机）
  const hankouVolume = calcBranchRemittanceVolume(state, 'hankou');
  const hankouRemittance = calcRemittanceIncome(state, 'hankou', hankouVolume);
  const zhangjiakouVolume = calcBranchRemittanceVolume(state, 'zhangjiakou');
  const zhangjiakouRemittance = calcRemittanceIncome(state, 'zhangjiakou', zhangjiakouVolume);
  const remittanceIncome = hankouRemittance + zhangjiakouRemittance;

  // 2. 存银支出
  const depositExpense = calcDepositExpense(state);

  // 3. 放款收入
  const loanInterest = calcLoanInterest(state);

  // 4. 运营支出
  const otherExpenses = calcOperatingExpenses(state);

  // 5. 在途银变动（基于汇兑业务量，10% 在途中）
  const newInTransit = Math.round((hankouVolume + zhangjiakouVolume) * 0.10);

  const income: SeasonIncome = {
    remittanceIncome,
    depositExpense,
    loanInterest,
    otherExpenses,
    netIncome: 0,
  };
  income.netIncome = income.remittanceIncome + income.depositExpense + income.loanInterest + income.otherExpenses;

  // 6. 信誉变动
  const reputationChange = calcSeasonalReputationChange(state);

  return {
    hankouVolume,
    hankouRemittance,
    zhangjiakouVolume,
    zhangjiakouRemittance,
    income,
    reputationChange,
    newInTransit,
  };
}

/**
 * 将模拟结果应用到 GameState
 * 返回新的 GameState（不修改原对象）
 * @param fundTransfers 本季的定向调拨列表（从 inTransit 中向目标送达，优先于通用到账）
 */
export function applySimulation(
  state: GameState,
  result: SimulationResult,
  fundTransfers?: { target: 'headquarters' | 'hankou' | 'zhangjiakou'; amount: number }[]
): GameState {
  const next = { ...state };

  // 更新分号业务量
  next.branches = {
    hankou: {
      ...state.branches.hankou,
      businessVolume: result.hankouVolume,
    },
    zhangjiakou: {
      ...state.branches.zhangjiakou,
      businessVolume: result.zhangjiakouVolume,
    },
  };

  // 更新银两（应用年度规划方向调整）
  next.resources = { ...state.resources };
  let directiveExpenseMod = 0;
  if (state.annualDirective === 'expand') {
    directiveExpenseMod = Math.round(result.income.otherExpenses * 0.20);
  } else if (state.annualDirective === 'consolidate') {
    directiveExpenseMod = Math.round(Math.abs(result.income.otherExpenses) * 0.10);
  }
  const directiveRepBonus = state.annualDirective === 'reputation' ? 2 : 0;

  next.resources.silver = {
    ...state.resources.silver,
    headquarters: state.resources.silver.headquarters + result.income.netIncome * 0.35,
    hankou: state.resources.silver.hankou + result.income.netIncome * 0.35,
    zhangjiakou: state.resources.silver.zhangjiakou + result.income.netIncome * 0.30,
    inTransit: state.resources.silver.inTransit + result.newInTransit,
    externalDeposits: state.resources.silver.externalDeposits,
    totalSilver: 0, // 后续刷新
  };
  // 在途银到账（优先处理定向调拨，剩余通用半衰期到账）
  let remainingInTransit = next.resources.silver.inTransit;
  // 1) 定向调拨优先送达
  if (fundTransfers && fundTransfers.length > 0) {
    for (const ft of fundTransfers) {
      const deliverable = Math.min(ft.amount, remainingInTransit);
      if (deliverable > 0) {
        next.resources.silver[ft.target] += deliverable;
        remainingInTransit -= deliverable;
      }
    }
  }
  // 2) 剩余在途银通用到账（半衰期）
  const generalArrival = Math.round(remainingInTransit * IN_TRANSIT_ARRIVAL_RATE);
  if (generalArrival > 0) {
    remainingInTransit -= generalArrival;
    next.resources.silver.headquarters += Math.round(generalArrival * 0.35);
    next.resources.silver.hankou += Math.round(generalArrival * 0.35);
    next.resources.silver.zhangjiakou += Math.round(generalArrival * 0.30);
  }
  next.resources.silver.inTransit = remainingInTransit;
  // 确保非负
  for (const key of ['headquarters', 'hankou', 'zhangjiakou', 'inTransit'] as const) {
    if (next.resources.silver[key] < 0) next.resources.silver[key] = 0;
  }
  next.resources.silver.totalSilver =
    next.resources.silver.headquarters +
    next.resources.silver.hankou +
    next.resources.silver.zhangjiakou +
    next.resources.silver.inTransit;

  // 年度规划效果：调整业务量与支出
  if (state.annualDirective === 'expand') {
    next.branches.hankou.businessVolume = Math.round(next.branches.hankou.businessVolume * 1.15);
    next.branches.zhangjiakou.businessVolume = Math.round(next.branches.zhangjiakou.businessVolume * 1.15);
    next.resources.silver.headquarters = Math.max(0, next.resources.silver.headquarters + directiveExpenseMod); // 额外的扩张成本
  } else if (state.annualDirective === 'consolidate') {
    next.resources.silver.headquarters = Math.max(0, next.resources.silver.headquarters + directiveExpenseMod); // 节约的成本
  }
  next.resources.silver.totalSilver =
    next.resources.silver.headquarters + next.resources.silver.hankou +
    next.resources.silver.zhangjiakou + next.resources.silver.inTransit;

  // 更新信誉
  const reputationChange = result.reputationChange + directiveRepBonus;
  next.resources.reputation = clamp(
    state.resources.reputation + reputationChange,
    0,
    100
  );

  // 外部存款变动（基于信誉变化方向）
  if (reputationChange > 0) {
    next.resources.silver.externalDeposits = Math.round(
      state.resources.silver.externalDeposits * (1 + DEPOSIT_GROWTH_RATE)
    );
  } else if (reputationChange < 0) {
    next.resources.silver.externalDeposits = Math.round(
      state.resources.silver.externalDeposits * (1 - DEPOSIT_DECLINE_RATE)
    );
  }
  next.resources.silver.externalDeposits = Math.max(10_000, next.resources.silver.externalDeposits);

  // 密押使用月数 +3（一季）
  next.cipher = {
    ...state.cipher,
    monthsUsed: state.cipher.monthsUsed + 3,
  };

  // 学徒季度成长：每季受训 +3 月，满 36 月自动出师
  next.staff = state.staff.map(s => {
    const trained = s.monthsTrained + 3;
    if (s.role === 'apprentice' && trained >= 36) {
      const newAbility = Math.round(s.talent * 0.9 + Math.floor(Math.random() * 16) - 5);
      return {
        ...s,
        role: 'clerk' as const,
        monthsTrained: trained,
        ability: Math.max(10, Math.min(100, newAbility)),
      };
    }
    return { ...s, monthsTrained: trained };
  });

  // 伙友忠诚危机：任一 clerk loyalty < 30，每季 10% 概率携款潜逃
  const disloyalClerks = next.staff.filter(
    s => s.role === 'clerk' && s.loyalty < 30 && s.stationedAt !== null
  );
  for (const traitor of disloyalClerks) {
    if (Math.random() < 0.10) {
      const branchKey = traitor.stationedAt as 'headquarters' | 'hankou' | 'zhangjiakou' | 'inTransit';
      if (next.resources.silver[branchKey] !== undefined) {
        const stolen = Math.round(next.resources.silver[branchKey] * 0.15);
        next.resources.silver = {
          ...next.resources.silver,
          [branchKey]: Math.max(0, next.resources.silver[branchKey] - stolen),
        };
        next.resources.silver.totalSilver = Math.max(0, next.resources.silver.totalSilver - stolen);
      }
      next.staff = next.staff.filter(s => s.id !== traitor.id);
      next.logs = [
        `⛔ 「${traitor.name}」携款潜逃！${traitor.stationedAt === 'headquarters' ? '总号' : traitor.stationedAt === 'hankou' ? '汉口分号' : '张家口分号'}库银失窃！`,
        ...next.logs,
      ].slice(0, 50);
      break; // 每季最多一人潜逃
    }
  }

  // 更新时间
  next.date = { ...state.date };
  next.date.day += 90; // 跳过一季
  while (next.date.day > 90) {
    next.date.day -= 90;
    next.date.season = (next.date.season % 4 + 1) as typeof state.date.season;
    if (next.date.season === 1) {
      next.date.year += 1;
    }
  }

  // 添加日志
  const netStr = result.income.netIncome >= 0
    ? `盈 ${result.income.netIncome} 两`
    : `亏 ${Math.abs(result.income.netIncome)} 两`;
  next.logs = [
    `${next.date.year}年${['', '春', '夏', '秋', '冬'][next.date.season]}季终——汇兑 ${(result.hankouVolume + result.zhangjiakouVolume).toLocaleString()} 两，${netStr}`,
    ...state.logs,
  ].slice(0, 50);

  return next;
}
