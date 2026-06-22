// ============================================================
// 信誉变动引擎 —— 《晋·信》
// ============================================================

import type { GameState, ReputationTier } from '../types';
import { getReputationTier, MIN_RESERVE_RATIO } from '../data/constants';
import { calcReserveRatio, calcTurnoverDays } from './resources';

// ---- 季度信誉自然变动 ----

/**
 * 每季信誉自然变动
 *
 * 影响因素：
 * 1. 准备金率健康度（最重要）
 * 2. 银两周转效率
 * 3. 密押安全等级
 * 4. 当前信誉等级（越高越难涨，越低反弹越快）
 */
export function calcSeasonalReputationChange(state: GameState): number {
  let delta = 0;

  // 1. 准备金率影响（权重最大）
  const reserveRatio = calcReserveRatio(state.resources.silver);
  if (reserveRatio >= 0.30) {
    delta += 3;  // 资金充裕，信誉上升
  } else if (reserveRatio >= 0.20) {
    delta += 1;  // 正常
  } else if (reserveRatio >= MIN_RESERVE_RATIO) {
    delta -= 1;  // 偏低
  } else {
    delta -= 3;  // 危险
  }

  // 2. 周转效率
  const turnoverDays = calcTurnoverDays(state);
  if (turnoverDays <= 30) {
    delta += 1;  // 银两流通快
  } else if (turnoverDays >= 60) {
    delta -= 1;  // 银两积压
  }

  // 3. 密押安全（基础方案用太久会掉信誉）
  // 惩罚在阻尼之后单独扣减，确保过期密押有实感影响
  const cipherSafety = state.cipher.monthsUsed / 12; // 使用年数
  let cipherPenalty = 0;
  if (cipherSafety > 1.2) {
    cipherPenalty = -3;
  }

  // 4. 信誉等级调节（等级越高变动越缓）
  const tierDamping: Record<ReputationTier, number> = {
    golden: 0.5,     // 金字招牌难升难降
    excellent: 0.7,
    average: 1.0,
    shaky: 1.3,      // 风雨飘摇时回升快
    ruined: 1.5,
  };

  // 信誉小于 10 时，每月自动回弹 1 点（社会恢复机制）
  if (state.resources.reputation < 10 && delta < 0) {
    delta = Math.max(delta, -1);
  }

  return Math.round(delta * tierDamping[getReputationTier(state.resources.reputation)]) + cipherPenalty;
}

// ---- 重大事件信誉冲击 ----

/**
 * 密押泄露对信誉的打击
 */
export function calcCipherLeakReputationLoss(cipherTier: number): number {
  switch (cipherTier) {
    case 1: return -15;  // 基础方案泄露——信任崩塌
    case 2: return -10;  // 标准方案泄露
    case 3: return -5;   // 高级方案泄露——影响最小
    default: return -10;
  }
}

/**
 * 挤兑风潮信誉损失（准备金率低于 10% 时概率触发）
 */
export function calcRunRiskReputationLoss(): number {
  return -20;
}

/**
 * 获得信誉等级对应的颜色标识
 */
export function getReputationColor(tier: ReputationTier): string {
  const colors: Record<ReputationTier, string> = {
    golden: '#D4A017',     // 金色
    excellent: '#2E8B57',  // 海绿
    average: '#5B7A9E',    // 钢蓝
    shaky: '#CD853F',      // 秘鲁棕
    ruined: '#8B0000',     // 暗红
  };
  return colors[tier];
}

/**
 * 获得信誉等级对应的星星标识
 */
export function getReputationStars(tier: ReputationTier): string {
  const stars: Record<ReputationTier, string> = {
    golden: '★★★★★',
    excellent: '★★★★',
    average: '★★★',
    shaky: '★★',
    ruined: '★',
  };
  return stars[tier];
}
