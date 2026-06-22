// ============================================================
// 全局状态 Hook —— 《晋·信》
//
// useReducer + React Context 管理全局 GameState
// 支持 Action 派发、自动存档、读档
// ============================================================

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { GameState } from '../types';
import { createInitialState, refreshTotalSilver } from '../engine/gameState';
import { saveGame, loadGame, setCurrentUser, clearCurrentUser } from '../engine/gameState';

// ================================================================
// Action 类型定义
// ================================================================

export type GameAction =
  | { type: 'NEW_GAME'; difficulty?: import('../types').Difficulty }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'TICK_DATE'; days: number }
  | { type: 'SET_DATE'; date: GameState['date'] }
  | { type: 'SET_PHASE'; phase: GameState['phase'] }
  | { type: 'UPDATE_SILVER'; payload: Partial<GameState['resources']['silver']> }
  | { type: 'UPDATE_REPUTATION'; delta: number }
  | { type: 'UPDATE_CONNECTIONS'; payload: Partial<GameState['resources']['connections']> }
  | { type: 'UPDATE_PRICING'; payload: Partial<GameState['pricing']> }
  | { type: 'UPDATE_CIPHER'; payload: Partial<GameState['cipher']> }
  | { type: 'UPDATE_BRANCH'; branchId: string; payload: Record<string, unknown> }
  | { type: 'ADD_EVENT'; event: GameState['eventQueue'][number] }
  | { type: 'REMOVE_EVENT'; eventId: string }
  | { type: 'CLEAR_EVENT_QUEUE' }
  | { type: 'SET_MORNING_BRIEFS'; briefs: GameState['morningBriefs'] }
  | { type: 'CLEAR_MORNING_BRIEFS' }
  | { type: 'SET_PENDING_DECISIONS'; decisions: GameState['pendingDecisions'] }
  | { type: 'CLEAR_PENDING_DECISIONS' }
  | { type: 'SET_ANNUAL_LEDGER'; ledger: GameState['annualLedger'] }
  | { type: 'SET_ENDING'; endingType: GameState['endingType'] }
  | { type: 'ADD_STAFF'; staff: import('../types').Staff }
  | { type: 'UPDATE_STAFF'; id: number; changes: Partial<import('../types').Staff> }
  | { type: 'REMOVE_STAFF'; id: number }
  | { type: 'PROMOTE_APPRENTICE'; id: number }
  | { type: 'ADD_LOG'; message: string }
  | { type: 'SAVE_GAME' }
  | { type: 'SET_CRISIS_ACTION'; action: 'banquet' | 'ownerBailout' }
  | { type: 'SET_ANNUAL_DIRECTIVE'; directive: GameState['annualDirective'] }
  | { type: 'APPLY_EFFECTS'; effects: import('../types').EventEffects };

// ================================================================
// Reducer
// ================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState(action.difficulty ?? 'normal');

    case 'LOAD_GAME':
      return { ...action.state };

    case 'TICK_DATE': {
      const newState = { ...state, date: { ...state.date } };
      newState.date.day += action.days;

      // 处理跨季
      while (newState.date.day > 90) {
        newState.date.day -= 90;
        newState.date.season = (newState.date.season % 4 + 1) as GameState['date']['season'];
        if (newState.date.season === 1) {
          newState.date.year += 1;
        }
      }
      return newState;
    }

    case 'SET_DATE':
      return { ...state, date: { ...action.date } };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_ENDING':
      return { ...state, endingType: action.endingType };

    case 'UPDATE_SILVER': {
      const silver = {
        ...state.resources.silver,
        ...action.payload,
      };
      // Ensure all fields are non-negative
      if (silver.headquarters < 0) silver.headquarters = 0;
      if (silver.hankou < 0) silver.hankou = 0;
      if (silver.zhangjiakou < 0) silver.zhangjiakou = 0;
      if (silver.inTransit < 0) silver.inTransit = 0;
      if (silver.externalDeposits < 0) silver.externalDeposits = 0;
      silver.totalSilver = silver.headquarters + silver.hankou + silver.zhangjiakou + silver.inTransit;

      const next = {
        ...state,
        resources: {
          ...state.resources,
          silver,
        },
      };

      // 游戏结束检测：库银耗尽
      if (silver.totalSilver <= 0 && next.phase !== 'game_over') {
        next.phase = 'game_over';
        next.endingType = 'bankrupt';
        next.logs = ['库银耗尽——票号无力兑付，经营难以为继。', ...next.logs].slice(0, 50);
      }

      return next;
    }

    case 'UPDATE_REPUTATION': {
      let newRep = state.resources.reputation + action.delta;
      newRep = Math.max(0, Math.min(100, newRep));
      const next = {
        ...state,
        resources: {
          ...state.resources,
          reputation: newRep,
        },
      };

      // 游戏结束检测：信誉归零
      if (newRep <= 0 && next.phase !== 'game_over') {
        next.phase = 'game_over';
        next.logs = ['字号崩塌——票号信誉扫地，无人再敢托付银两。', ...next.logs].slice(0, 50);
      }

      return next;
    }

    case 'UPDATE_CONNECTIONS': {
      const connections = {
        ...state.resources.connections,
        ...action.payload,
      };
      // Clamp to 0~100
      for (const key of Object.keys(connections) as (keyof typeof connections)[]) {
        connections[key] = Math.max(0, Math.min(100, connections[key]));
      }
      return {
        ...state,
        resources: {
          ...state.resources,
          connections,
        },
      };
    }

    case 'UPDATE_PRICING':
      return {
        ...state,
        pricing: { ...state.pricing, ...action.payload },
      };

    case 'UPDATE_CIPHER':
      return {
        ...state,
        cipher: { ...state.cipher, ...action.payload },
      };

    case 'UPDATE_BRANCH': {
      const branches = { ...state.branches };
      const branch = branches[action.branchId as keyof typeof branches];
      if (branch) {
        branches[action.branchId as keyof typeof branches] = {
          ...branch,
          ...action.payload,
        } as typeof branch;
      }
      return { ...state, branches };
    }

    case 'ADD_EVENT':
      return {
        ...state,
        eventQueue: [...state.eventQueue, action.event],
      };

    case 'REMOVE_EVENT':
      return {
        ...state,
        eventQueue: state.eventQueue.filter(e => e.id !== action.eventId),
      };

    case 'CLEAR_EVENT_QUEUE':
      return { ...state, eventQueue: [] };

    case 'SET_MORNING_BRIEFS':
      return { ...state, morningBriefs: action.briefs };

    case 'CLEAR_MORNING_BRIEFS':
      return { ...state, morningBriefs: [] };

    case 'SET_PENDING_DECISIONS':
      return { ...state, pendingDecisions: action.decisions };

    case 'CLEAR_PENDING_DECISIONS':
      return { ...state, pendingDecisions: [] };

    case 'SET_ANNUAL_LEDGER':
      return { ...state, annualLedger: action.ledger };

    case 'ADD_STAFF': {
      // 防止 id 重复（确保唯一性）
      const exists = state.staff.some(s => s.id === action.staff.id);
      if (exists) return state;
      return { ...state, staff: [...state.staff, action.staff] };
    }

    case 'UPDATE_STAFF': {
      const updatedStaff = state.staff.map(s =>
        s.id === action.id ? { ...s, ...action.changes } : s
      );
      return { ...state, staff: updatedStaff };
    }

    case 'REMOVE_STAFF':
      return { ...state, staff: state.staff.filter(s => s.id !== action.id) };

    case 'PROMOTE_APPRENTICE': {
      const apprentice = state.staff.find(s => s.id === action.id && s.role === 'apprentice');
      if (!apprentice) return state;
      const newAbility = Math.round(apprentice.talent * 0.9 + Math.floor(Math.random() * 16) - 5);
      const promotedStaff = state.staff.map(s =>
        s.id === action.id
          ? { ...s, role: 'clerk' as const, ability: Math.max(10, Math.min(100, newAbility)) }
          : s
      );
      return {
        ...state,
        staff: promotedStaff,
        logs: [`「${apprentice.name}」历经三年磨练，今日正式出师。(能力 ${Math.max(10, Math.min(100, newAbility))})`, ...state.logs].slice(0, 50),
      };
    }

    case 'ADD_LOG': {
      const logs = [action.message, ...state.logs].slice(0, 50); // 最多保留 50 条
      return { ...state, logs };
    }

    case 'SAVE_GAME': {
      saveGame(state);
      return state;
    }

    case 'SET_CRISIS_ACTION': {
      if (action.action === 'banquet') {
        return { ...state, lastBanquetSeason: state.date.year * 4 + state.date.season };
      }
      if (action.action === 'ownerBailout') {
        return { ...state, ownerBailoutUsed: true };
      }
      return state;
    }

    case 'SET_ANNUAL_DIRECTIVE':
      return { ...state, annualDirective: action.directive };

    case 'APPLY_EFFECTS': {
      const effects = action.effects;
      let next = { ...state };

      // 银两变动
      if (effects.silver) {
        const silverUpdates: Partial<GameState['resources']['silver']> = {};
        for (const [key, value] of Object.entries(effects.silver)) {
          if (value !== undefined) {
            if (key === 'headquarters' || key === 'hankou' || key === 'zhangjiakou' || key === 'inTransit') {
              const currentVal = next.resources.silver[key];
              silverUpdates[key] = Math.max(0, currentVal + value);
            }
          }
        }
        if (Object.keys(silverUpdates).length > 0) {
          next = gameReducer(next, { type: 'UPDATE_SILVER', payload: silverUpdates });
        }
      }

      // 信誉变动
      if (effects.reputation !== undefined) {
        next = gameReducer(next, { type: 'UPDATE_REPUTATION', delta: effects.reputation });
      }

      // 人脉变动
      if (effects.connections) {
        next = gameReducer(next, { type: 'UPDATE_CONNECTIONS', payload: effects.connections });
      }

      // 密押变动
      if (effects.cipherChange) {
        next = gameReducer(next, { type: 'UPDATE_CIPHER', payload: { current: effects.cipherChange, monthsUsed: 0 } });
      }

      // 伙友忠诚变动
      if (effects.staffLoyalty !== undefined && effects.staffLoyalty !== 0) {
        const loyaltyDelta = effects.staffLoyalty;
        next = {
          ...next,
          staff: next.staff.map(s => ({
            ...s,
            loyalty: Math.max(0, Math.min(100, s.loyalty + loyaltyDelta)),
          })),
        };
      }

      next = refreshTotalSilver(next);

      // 游戏结束检测
      if (next.resources.reputation <= 0 || next.resources.silver.totalSilver <= 0) {
        if (next.resources.reputation <= 0) {
          next.endingType = 'disgraced';
          next.logs = ['字号崩塌——票号信誉扫地，无人再敢托付银两。', ...next.logs].slice(0, 50);
        } else {
          next.endingType = 'bankrupt';
          next.logs = ['库银耗尽——票号无力兑付，经营难以为继。', ...next.logs].slice(0, 50);
        }
        next.phase = 'game_over';
      }

      return next;
    }

    default:
      return state;
  }
}

// ================================================================
// Context
// ================================================================

export interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ================================================================
// Provider
// ================================================================

export function GameProvider({ username, difficulty, children }: { username: string; difficulty: import('../types').Difficulty; children: React.ReactNode }) {
  // 初始化时尝试读档，有档就用档，没档就按难度新建
  // ⚠️ 关键修复：useReducer 初始器先于 useEffect 同步执行，必须在此处设 currentUser
  const [state, rawDispatch] = useReducer(gameReducer, undefined as never, () => {
    setCurrentUser(username);
    const saved = loadGame();
    if (saved) {
      // 读档成功——用存档难度覆盖入口难度，确保一致性
      saved.difficulty = saved.difficulty || difficulty;
      return saved;
    }
    return createInitialState(difficulty);
  });

  // useEffect 中再次确认（处理热更新/边角情况）
  useEffect(() => {
    setCurrentUser(username);
    return () => clearCurrentUser();
  }, [username]);

  // 包装 dispatch：NEW_GAME 时自动注入当前难度
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const dispatch = useCallback(
    (action: GameAction) => {
      if (action.type === 'NEW_GAME' && !action.difficulty) {
        rawDispatch({ type: 'NEW_GAME', difficulty: difficultyRef.current });
      } else {
        rawDispatch(action);
      }
    },
    [rawDispatch],
  );

  // 自动存档（phase 变化时触发）
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (prevPhaseRef.current !== state.phase) {
      prevPhaseRef.current = state.phase;
      saveGame(state);
    }
  }, [state.phase, state]);

  // 定时自动存档（每 3 分钟）—— 用 ref 避免 state 变化导致定时器反复重建
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const timer = setInterval(() => {
      saveGame(stateRef.current);
    }, 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return React.createElement(
    GameContext.Provider,
    { value: { state, dispatch } },
    children
  );
}

// ================================================================
// Consumer Hook
// ================================================================

/** 获取全局游戏状态和 dispatch */
export function useGameState(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameState 必须在 GameProvider 内部使用');
  }
  return ctx;
}
