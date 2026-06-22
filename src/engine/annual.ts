// ============================================================
// 年终合账引擎 —— 《晋·信》
//
// 每年腊月（Q4 模拟后）触发：
// 1. 生成年度账目（分号报表 + 差异项）
// 2. 分红方案计算
// 3. 人事表现评定
// ============================================================

import type {
  GameState,
  AnnualLedger,
  BranchAnnualReport,
  LedgerDiscrepancy,
  Staff,
  BranchId,
} from '../types';
import { DIVIDEND_RATIO_OWNER, DIVIDEND_RATIO_RESERVE, DIVIDEND_RATIO_STAFF } from '../data/constants';
import { chance, randomInt } from '../utils/random';

// ================================================================
// 1. 年度账目生成
// ================================================================

/**
 * 生成年度总账
 *
 * 因 MVP 无结构化历史数据，基于当前 state 估算全年结果。
 * 估算方法：当前 silver 与初始 silver 的差值 = 全年净损益。
 */
export function generateAnnualLedger(state: GameState): AnnualLedger {
  const year = state.date.year;
  const branchReports = generateBranchReports(state);
  const discrepancies = generateDiscrepancies(state);

  // 估算全年利润（当前总银两 - 初始总银两，扣减事件影响取近似）
  // 实际上 4 季模拟已有累计，此处用分号报表汇总
  const totalRevenue = branchReports.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = branchReports.reduce((s, r) => s + r.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return {
    year,
    branchReports,
    totalProfit,
    totalLoss: totalProfit < 0 ? Math.abs(totalProfit) : 0,
    discrepancies,
  };
}

/** 生成各分号年度报表 */
function generateBranchReports(state: GameState): BranchAnnualReport[] {
  const branches: BranchId[] = ['hankou', 'zhangjiakou'];

  return branches.map(bid => {
    const branch = state.branches[bid];
    // 估算：每季业务量 × 4，收入基于汇费率，支出基于存息+运营
    const estimatedYearlyVolume = branch.businessVolume * 4;
    const feeRate = bid === 'hankou'
      ? state.pricing.hankouFee / 100
      : state.pricing.zhangjiakouFee / 100;
    const revenue = Math.round(estimatedYearlyVolume * feeRate);
    // 支出：存银利息 + 运营分摊
    const expenses = Math.round(branch.silver * (state.pricing.depositRate / 100) + 2000);
    const profit = revenue - expenses;

    // 问题数：基于分号状态和掌柜忠诚度
    let issueCount = 0;
    if (branch.status !== 'normal') issueCount += 1;
    if (branch.managerLoyalty < 50) issueCount += randomInt(0, 2);
    if (branch.managerLoyalty < 30) issueCount += 1;

    return {
      branchId: bid,
      revenue,
      expenses,
      profit,
      businessCount: Math.max(1, Math.round(estimatedYearlyVolume / 5000)),
      issueCount,
    };
  });
}

/** 随机生成账目差异（0~2 条） */
function generateDiscrepancies(state: GameState): LedgerDiscrepancy[] {
  const discrepancies: LedgerDiscrepancy[] = [];
  const branches: BranchId[] = ['hankou', 'zhangjiakou'];

  const explanations = [
    '银两成色差异，折算平色后即可对平',
    '腊月暴雪，部分账册在途中污损',
    '与当地钱庄有笔暂借款未入账',
    '学徒记账失误，正在重新核算',
    '有几笔汇兑跨年结算，银已在途',
  ];

  const actualReasons = [
    '查账后发现：掌柜私自挪用库银 5000 两放贷牟利',
    '查账后发现：账房虚报差旅费 1200 两已有三季',
    '查账后发现：有几笔汇兑收入被记入下年以修饰账面',
    '查账后发现：实为正常跨年差异，无舞弊',
    '查账后发现：学徒学艺不精纯属失误，已训诫',
  ];

  for (const bid of branches) {
    const branch = state.branches[bid];
    // 忠诚度越低，越多差异
    const baseChance = branch.managerLoyalty < 40 ? 0.6 :
                        branch.managerLoyalty < 60 ? 0.35 : 0.15;

    if (chance(baseChance)) {
      const amount = randomInt(800, 8_000);
      const explIdx = randomInt(0, explanations.length - 1);
      discrepancies.push({
        branchId: bid,
        amount,
        explanation: explanations[explIdx],
        actualReason: actualReasons[explIdx],
      });
    }
  }

  return discrepancies;
}

// ================================================================
// 2. 分红方案
// ================================================================

export interface DividendPlan {
  id: string;
  name: string;
  description: string;
  ownerShare: number;   // 东家得
  reserveShare: number; // 票号留
  staffShare: number;   // 伙友分
  ownerAmount: number;
  reserveAmount: number;
  staffAmount: number;
  effects: {
    connections: { owner: number };
    reputation: number;
    silver: Partial<Record<BranchId | 'headquarters', number>>;
  };
  directive: 'expand' | 'consolidate' | 'reputation';
}

/**
 * 计算三个预设分红方案
 */
export function calcDividendOptions(ledger: AnnualLedger): DividendPlan[] {
  const profit = Math.max(0, ledger.totalProfit);

  // 方案一：厚东家（东家70%、留存20%、伙友10%）
  const plan1: DividendPlan = {
    id: 'div_owner',
    name: '厚待东家',
    description: '东家占七成，以表忠心；伙友略少。',
    ownerShare: 0.70,
    reserveShare: 0.20,
    staffShare: 0.10,
    ownerAmount: Math.round(profit * 0.70),
    reserveAmount: Math.round(profit * 0.20),
    staffAmount: Math.round(profit * 0.10),
    effects: {
      connections: { owner: 10 },
      reputation: -1,
      silver: { headquarters: Math.round(profit * 0.20) },
    },
    directive: 'expand',
  };

  // 方案二：重留存（东家50%、留存35%、伙友15%）
  const plan2: DividendPlan = {
    id: 'div_reserve',
    name: '厚积薄发',
    description: '多半留存票号作为来年资本，发展优先。',
    ownerShare: 0.50,
    reserveShare: 0.35,
    staffShare: 0.15,
    ownerAmount: Math.round(profit * 0.50),
    reserveAmount: Math.round(profit * 0.35),
    staffAmount: Math.round(profit * 0.15),
    effects: {
      connections: { owner: -2 },
      reputation: 2,
      silver: { headquarters: Math.round(profit * 0.35) },
    },
    directive: 'consolidate',
  };

  // 方案三：均分红（东家60%、留存25%、伙友15%——行业惯例）
  const plan3: DividendPlan = {
    id: 'div_balanced',
    name: '号规均分',
    description: `按行规六二五均分，东家${Math.round(profit*0.6).toLocaleString()}两、留存${Math.round(profit*0.25).toLocaleString()}两、伙友花红${Math.round(profit*0.15).toLocaleString()}两。`,
    ownerShare: DIVIDEND_RATIO_OWNER,
    reserveShare: DIVIDEND_RATIO_RESERVE,
    staffShare: DIVIDEND_RATIO_STAFF,
    ownerAmount: Math.round(profit * DIVIDEND_RATIO_OWNER),
    reserveAmount: Math.round(profit * DIVIDEND_RATIO_RESERVE),
    staffAmount: Math.round(profit * DIVIDEND_RATIO_STAFF),
    effects: {
      connections: { owner: 3 },
      reputation: 1,
      silver: { headquarters: Math.round(profit * DIVIDEND_RATIO_RESERVE) },
    },
    directive: 'reputation',
  };

  return [plan1, plan2, plan3];
}

// ================================================================
// 3. 人事评定
// ================================================================

export type StaffRating = 'excellent' | 'good' | 'poor';

export interface StaffReview {
  staff: Staff;
  rating: StaffRating;
  comment: string;
}

/**
 * 对所有伙友进行年度评定
 */
export function calcStaffPerformance(state: GameState): StaffReview[] {
  return state.staff.map(s => {
    const score = s.ability * 0.4 + s.loyalty * 0.4 + s.talent * 0.2;
    let rating: StaffRating;
    let comment: string;

    if (score >= 70) {
      rating = 'excellent';
      comment = s.talentBonus
        ? `表现出色，${s.talentBonus}之才名不虚传。`
        : '一年勤勉，堪当大任。';
    } else if (score >= 45) {
      rating = 'good';
      comment = '中规中矩，尚有提升空间。';
    } else {
      rating = 'poor';
      comment = '表现不佳，需多加督促。';
    }

    return { staff: s, rating, comment };
  });
}

// ================================================================
// 4. 工具函数
// ================================================================

/** 获取评定标签 */
export function getRatingLabel(rating: StaffRating): string {
  const map: Record<StaffRating, string> = { excellent: '优', good: '良', poor: '差' };
  return map[rating];
}

/** 获取评定颜色 */
export function getRatingColor(rating: StaffRating): string {
  const map: Record<StaffRating, string> = { excellent: '#1a6b3c', good: '#cc6600', poor: '#b22222' };
  return map[rating];
}

/** 获取分号名称 */
export function getBranchName(bid: BranchId): string {
  return bid === 'hankou' ? '汉口分号' : '张家口分号';
}
