// ============================================================
// 游戏常量配置 —— 《晋·信》
// ============================================================

import type { GameDate, ReputationTier, Pricing, GamePhase } from '../types';

// ---- 游戏起始状态 ----
export const START_DATE: GameDate = {
  year: 1808,
  season: 1,  // 春
  day: 1,
};

export const INITIAL_SILVER = {
  headquarters: 500_000,    // 平遥总号：50 万两
  hankou: 150_000,          // 汉口分号：15 万两
  zhangjiakou: 120_000,     // 张家口分号：12 万两
  inTransit: 0,
};

export const INITIAL_REPUTATION = 60;

export const INITIAL_CONNECTIONS = {
  government: 40,     // 与县衙有旧
  merchantGuild: 55,   // 晋商同乡会根基
  owner: 70,           // 东家初期颇为信任
};

// ---- 困难模式 ----
export const HARD_INITIAL_SILVER = {
  headquarters: 200_000,    // 总号：20 万两（-60%）
  hankou: 60_000,           // 汉口：6 万两（-60%）
  zhangjiakou: 50_000,      // 张家口：5 万两（-58%）
  inTransit: 0,
};

export const HARD_INITIAL_REPUTATION = 40;  // 中规中矩门槛（信誉倍率 1.0）

export const HARD_INITIAL_CONNECTIONS = {
  government: 20,
  merchantGuild: 30,
  owner: 45,
  // 难度描述：东家半信半疑，商帮冷眼旁观，官府尚无交情
};

export const INITIAL_PRICING: Pricing = {
  hankouFee: 2.5,         // 汉口汇费率 2.5%
  zhangjiakouFee: 3.0,    // 张家口汇费率 3.0%（口外风险高）
  depositRate: 1.5,       // 存款年利率 1.5%
  loanLimit: 50_000,      // 本季放款上限 5 万两
};

// ---- 信誉等级阈值 ----
export const REPUTATION_TIERS: { tier: ReputationTier; min: number; label: string }[] = [
  { tier: 'golden',    min: 85, label: '金字招牌' },
  { tier: 'excellent', min: 70, label: '信誉卓著' },
  { tier: 'average',   min: 40, label: '中规中矩' },
  { tier: 'shaky',     min: 20, label: '风雨飘摇' },
  { tier: 'ruined',    min: 0,  label: '信用破产' },
];

/** 根据信誉值获取等级 */
export function getReputationTier(value: number): ReputationTier {
  for (const t of REPUTATION_TIERS) {
    if (value >= t.min) return t.tier;
  }
  return 'ruined';
}

/** 根据信誉等级获取汇兑业务倍率 */
export function getReputationMultiplier(tier: ReputationTier): number {
  const map: Record<ReputationTier, number> = {
    golden: 2.0,
    excellent: 1.5,
    average: 1.0,
    shaky: 0.5,
    ruined: 0.1,
  };
  return map[tier];
}

// ---- 准备金率 ----
/** 总分号必须保留的最低准备金率 */
export const MIN_RESERVE_RATIO = 0.15;  // 库银不得低于总资产的 15%
export const SAFE_RESERVE_RATIO = 0.25; // 安全线

// ---- 在途银 ----
/** 每季在途银到账比例（半衰期模型） */
export const IN_TRANSIT_ARRIVAL_RATE = 0.5;

// ---- 外部存款 ----
/** 初始外部存款占总银比例 */
export const INITIAL_EXTERNAL_DEPOSIT_RATIO = 0.3;
/** 信誉上升时外部存款季度增长率 */
export const DEPOSIT_GROWTH_RATE = 0.05;
/** 信誉下降时外部存款季度流失率 */
export const DEPOSIT_DECLINE_RATE = 0.10;

// ---- 时间常量 ----
export const DAYS_PER_SEASON = 90;
export const SEASONS_PER_YEAR = 4;
export const SEASON_NAMES = ['春', '夏', '秋', '冬'] as const;

// ---- 伙友培养 ----
export const APPRENTICE_TRAINING_MONTHS = 36;  // 学徒需受训 36 个月方可出师
export const MONTHLY_SALARY: Record<string, number> = {
  apprentice: 5,   // 学徒月银 5 两
  clerk: 20,       // 账房/跑街月银 20 两
};

// ---- 汇兑业务基准 ----
/** 每季每分号基准汇兑业务量（两）——无信誉加成时的基础值 */
export const BASE_REMITTANCE_VOLUME: Record<string, number> = {
  hankou: 80_000,
  zhangjiakou: 60_000,
};

// ---- 密押更换 ----
/** 每种密押方案的安全使用月数上限 */
export const CIPHER_SAFE_MONTHS: Record<string, number> = {
  basic: 12,
  standard: 9,
  advanced: 6,
};

// ---- 红利分配 ----
export const DIVIDEND_RATIO_OWNER = 0.6;   // 东家分 60%
export const DIVIDEND_RATIO_RESERVE = 0.25; // 留存 25%
export const DIVIDEND_RATIO_STAFF = 0.15;   // 伙友分红 15%

// ---- 巡检消耗 ----
export const INSPECTION_COST = 2_000;  // 每次巡检花费 2000 两

// ---- 游戏阶段名称 ----
export const PHASE_LABELS: Record<GamePhase, string> = {
  morning: '晨间简报',
  quarterly: '季度决策',
  simulating: '模拟中',
  annual: '年终合账',
  event: '事件',
  game_over: '票号倒闭',
};

// ---- 存档版本 ----
export const SAVE_VERSION = '0.1.0';
