// ============================================================
// 统一事件引擎 —— 《晋·信》
//
// 整合事件判定、去重、效果执行。
// 为 engine 层提供单一入口点。
// ============================================================

import type { GameState, GameEvent, EventCondition } from '../types';
import {
  STORY_EVENTS,
  CRISIS_EVENTS,
  RANDOM_EVENTS,
} from '../data/events';
import { START_DATE } from '../data/constants';

// ---- 重新导出数据层事件 ----
export {
  STORY_EVENTS,
  CRISIS_EVENTS,
  RANDOM_EVENTS,
  ALL_EVENTS,
  getEventsByType,
} from '../data/events';

// ================================================================
// 条件检测（统一入口）
// ================================================================

/**
 * 检测事件条件是否满足
 */
export function checkEventCondition(state: GameState, condition?: EventCondition): boolean {
  if (!condition) return true;

  const rep = state.resources.reputation;
  const conn = state.resources.connections;
  const yearsElapsed = state.date.year - START_DATE.year;

  if (condition.minReputation !== undefined && rep < condition.minReputation) return false;
  if (condition.maxReputation !== undefined && rep > condition.maxReputation) return false;

  if (condition.minConnections) {
    const mc = condition.minConnections;
    if (mc.government !== undefined && conn.government < mc.government) return false;
    if (mc.merchantGuild !== undefined && conn.merchantGuild < mc.merchantGuild) return false;
    if (mc.owner !== undefined && conn.owner < mc.owner) return false;
  }

  if (condition.yearsElapsed) {
    const [min, max] = condition.yearsElapsed;
    if (yearsElapsed < min || yearsElapsed > max) return false;
  }

  if (condition.minReserveRatio !== undefined) {
    const total = state.resources.silver.totalSilver;
    const reserve = total - state.resources.silver.inTransit;
    if (total > 0 && reserve / total < condition.minReserveRatio) return false;
  }

  return true;
}

// ================================================================
// 事件去重（已触发事件追踪）
// ================================================================

/** 检查事件是否已触发（O(1) 去重查询） */
export function hasEventTriggered(state: GameState, eventId: string): boolean {
  return state.triggeredEventIds.includes(eventId);
}

/** 标记事件为已触发（写入 triggeredEventIds，不污染 eventQueue） */
export function markEventTriggered(state: GameState, event: GameEvent): GameState {
  if (hasEventTriggered(state, event.id)) return state;
  return {
    ...state,
    triggeredEventIds: [...state.triggeredEventIds, event.id],
  };
}

// ================================================================
// 事件筛选
// ================================================================

/**
 * 获取当前应触发的主线事件（未触发 + 条件满足）
 */
export function getPendingStoryEvents(state: GameState): GameEvent[] {
  return STORY_EVENTS.filter(event => {
    if (hasEventTriggered(state, event.id)) return false;
    return checkEventCondition(state, event.condition);
  });
}

/** 获取首个待触发的主线事件）
 */
export function getFirstPendingStoryEvent(state: GameState): GameEvent | null {
  const pending = getPendingStoryEvents(state);
  return pending.length > 0 ? pending[0] : null;
}

/**
 * 获取当前可触发的危机事件
 */
export function getPendingCrisisEvents(state: GameState): GameEvent[] {
  return CRISIS_EVENTS.filter(event =>
    checkEventCondition(state, event.condition)
  );
}

/**
 * 从随机事件池中抽取
 */
export function pickRandomEvents(state: GameState, count: number): GameEvent[] {
  const available = RANDOM_EVENTS.filter(event =>
    checkEventCondition(state, event.condition)
  );
  if (available.length === 0) return [];

  // 洗牌取前 count 个
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ================================================================
// 效果描述
// ================================================================

/**
 * 获取事件效果的文本描述
 */
export function describeEventEffects(event: GameEvent, optionId: string): string {
  const option = event.options.find(o => o.id === optionId);
  if (!option) return '';
  return option.outcomeDescription;
}
