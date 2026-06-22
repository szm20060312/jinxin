// ============================================================
// 资源计算引擎 —— 《晋·信》
// ============================================================

import type { GameState, BranchId, SilverState } from '../types';
import { MIN_RESERVE_RATIO, SAFE_RESERVE_RATIO } from '../data/constants';

// ---- 准备金率 ----

/**
 * 计算票号当前准备金率
 * 准备金率 = (总库银 - 在途银) / 总银两
 */
export function calcReserveRatio(silver: SilverState): number {
  const total = silver.totalSilver;
  if (total === 0) return 0;
  const reserve = total - silver.inTransit;
  return reserve / total;
}

/**
 * 准备金率健康状态
 */
export type ReserveHealth = 'safe' | 'warning' | 'danger';

export function getReserveHealth(silver: SilverState): ReserveHealth {
  const ratio = calcReserveRatio(silver);
  if (ratio >= SAFE_RESERVE_RATIO) return 'safe';
  if (ratio >= MIN_RESERVE_RATIO) return 'warning';
  return 'danger';
}

/**
 * 准备金率对应的提示消息
 */
export function getReserveWarning(silver: SilverState): string | null {
  const health = getReserveHealth(silver);
  const ratio = (calcReserveRatio(silver) * 100).toFixed(1);
  switch (health) {
    case 'danger':
      return `⚠️ 准备金率 ${ratio}%！已低于底线 ${(MIN_RESERVE_RATIO * 100).toFixed(0)}%，随时可能挤兑崩盘！`;
    case 'warning':
      return `⚡ 准备金率 ${ratio}%，偏低。建议增加库银或减少放款。`;
    case 'safe':
      return null;
  }
}

// ---- 分号可用资金 ----

/**
 * 获取分号可用于放款的资金（留足准备金后的余额）
 */
export function getLendableSilver(state: GameState, branchId: BranchId): number {
  const branch = state.branches[branchId];
  // 分号必须保留自身资产的 15% 作为准备金
  const minReserve = branch.silver * MIN_RESERVE_RATIO;
  const available = branch.silver - minReserve;

  // 受季度放款上限约束
  return Math.min(available, state.pricing.loanLimit);
}

// ---- 总号银库统计 ----

/**
 * 获取总号现金流状态
 * 总号需要预留：伙友薪资、巡检成本、突发事件准备金
 */
export function getHeadquartersFreeSilver(state: GameState): number {
  const hq = state.resources.silver.headquarters;
  const reserve = hq * MIN_RESERVE_RATIO;

  // 估算一季运营成本
  const staffCount = state.staff.length;
  const estimatedSalary = staffCount * 15; // 平均月银 × 3 月
  const operationalReserve = 5_000; // 日常周转

  return Math.max(0, hq - reserve - estimatedSalary - operationalReserve);
}

// ---- 在途银风险 ----

/**
 * 在途银比率过高时的风险警告
 */
export function getInTransitRisk(silver: SilverState): string | null {
  const ratio = silver.inTransit / (silver.totalSilver || 1);
  if (ratio > 0.4) {
    return `⚠️ 在途银占比 ${(ratio * 100).toFixed(0)}%，过高！途中风险不容忽视。`;
  }
  if (ratio > 0.25) {
    return `⚡ 在途银占比 ${(ratio * 100).toFixed(0)}%，偏高。注意分散运输。`;
  }
  return null;
}

// ---- 银两周转天数 ----

/**
 * 估算银两周转天数
 * 本季业务量 / 季天数 ≈ 日周转量
 */
export function calcTurnoverDays(state: GameState): number {
  const totalBusiness =
    state.branches.hankou.businessVolume +
    state.branches.zhangjiakou.businessVolume;

  if (totalBusiness === 0) return 90;

  const totalSilver = state.resources.silver.totalSilver;
  // 周转次数 = 业务量 / 总银两，周转天数 = 90 / 周转次数
  const turnover = totalBusiness / totalSilver;
  return Math.round(90 / Math.max(turnover, 0.1));
}

// ---- 季度收入汇总 ----

export interface SeasonIncome {
  /** 汇兑收入（汇费） */
  remittanceIncome: number;
  /** 存银利息支出（负值） */
  depositExpense: number;
  /** 放款利息收入 */
  loanInterest: number;
  /** 其他支出（薪资、杂项） */
  otherExpenses: number;
  /** 净收入 */
  netIncome: number;
}

/**
 * 计算季度净收入
 */
export function calcNetIncome(income: SeasonIncome): number {
  return (
    income.remittanceIncome +
    income.depositExpense +    // 已经是负值
    income.loanInterest +
    income.otherExpenses       // 已经是负值
  );
}

/**
 * 将季度收入分配到各分号和总号
 */
export function distributeIncome(
  _state: GameState,
  income: SeasonIncome
): Partial<SilverState> {
  const net = calcNetIncome(income);

  // 20% 入总号，40% 汉口，40% 张家口（按分号数量平摊）
  return {
    headquarters: Math.round(net * 0.2),
    hankou: Math.round(net * 0.4),
    zhangjiakou: Math.round(net * 0.4),
    inTransit: 0,
  };
}
