// ============================================================
// 里程碑成就系统 —— 《晋·信》
//
// Phase A 游戏性改进：让玩家在经营过程中有阶段性目标感。
// 每个成就仅触发一次，触发时通过 Toast + 日志通知玩家。
// ============================================================

import type { GameState } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  check: (state: GameState) => boolean;
  logMessage: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_profit',
    title: '🏆 初露锋芒',
    description: '首季实现盈利',
    check: (s) => s.logs.some(log => log.includes('盈 ') && log.includes('季终')),
    logMessage: '🏆 成就解锁：初露锋芒——首季实现盈利！号中上下士气大振。',
  },
  {
    id: 'million_silver',
    title: '🏆 万两之槛',
    description: '总银突破 100 万两',
    check: (s) => s.resources.silver.totalSilver >= 1_000_000,
    logMessage: '🏆 成就解锁：万两之槛——库银首破百万大关，商界侧目！',
  },
  {
    id: 'golden_reputation',
    title: '🏆 金字招牌',
    description: '信誉首次达到 85',
    check: (s) => s.resources.reputation >= 85,
    logMessage: '🏆 成就解锁：金字招牌——本号信誉冠绝平遥，名动天下！',
  },
  {
    id: 'first_graduate',
    title: '🏆 桃李满门',
    description: '首位学徒出师成为伙友',
    check: (s) => s.staff.some(st => st.role === 'clerk' && st.monthsTrained >= 36 && st.monthsTrained < 40),
    logMessage: '🏆 成就解锁：桃李满门——首位学徒学成出师，后继有人！',
  },
  {
    id: 'government_friend',
    title: '🏆 官商之交',
    description: '官府好感首次达到 70',
    check: (s) => s.resources.connections.government >= 70,
    logMessage: '🏆 成就解锁：官商之交——衙门里有了说得上话的朋友。',
  },
  {
    id: 'three_years_clean',
    title: '🏆 三年无事',
    description: '连续 12 季无潜逃/危机',
    check: (s) => {
      const recentLogs = s.logs.slice(0, 12);
      return recentLogs.length >= 12 && !recentLogs.some(log =>
        log.includes('潜逃') || log.includes('挤兑') || log.includes('查封') || log.includes('假票')
      );
    },
    logMessage: '🏆 成就解锁：三年无事——经营有方，平安即是最大的福气！',
  },
];

/**
 * 检测并返回新解锁的成就
 * 应每季模拟后调用
 */
export function checkAchievements(state: GameState): Achievement[] {
  const unlocked = state.unlockedAchievements;
  return ACHIEVEMENTS.filter(a => !unlocked.includes(a.id) && a.check(state));
}

/** 获取全部成就列表（用于展示） */
export function getAllAchievements(): Achievement[] {
  return [...ACHIEVEMENTS];
}
