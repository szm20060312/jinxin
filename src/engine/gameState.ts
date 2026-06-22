// ============================================================
// 游戏状态引擎 —— 《晋·信》
//
// 负责 GameState 的创建、保存与加载
// 纯函数，不依赖 React
// ============================================================

import type { GameState, SaveData, CipherState, GameOverType, Difficulty } from '../types';
import {
  START_DATE,
  INITIAL_SILVER,
  INITIAL_REPUTATION,
  INITIAL_CONNECTIONS,
  HARD_INITIAL_SILVER,
  HARD_INITIAL_REPUTATION,
  HARD_INITIAL_CONNECTIONS,
  INITIAL_PRICING,
  SAVE_VERSION,
  INITIAL_EXTERNAL_DEPOSIT_RATIO,
} from '../data/constants';
import { INITIAL_BRANCHES } from '../data/branches';
import { INITIAL_STAFF } from '../data/staff';
import { createSecureSave, loadSecureSave } from '../utils/saveSecurity';

// ---- 创建初始状态 ----

/** 创建全新的游戏初始状态 */
export function createInitialState(difficulty: Difficulty = 'normal'): GameState {
  const isHard = difficulty === 'hard';
  const silver = isHard ? { ...HARD_INITIAL_SILVER } : { ...INITIAL_SILVER };

  // 困难模式：汉口/张家口分号初始库银同步缩减
  // 困难模式：分号初始库银由 resources.silver 统一管理
  const branches = JSON.parse(JSON.stringify(INITIAL_BRANCHES));

  const startYear = START_DATE.year;
  const openingLog = isHard
    ? `道光${startYear - 1800 + 8}年春，本号草创开张。银根吃紧，东家将信将疑——大掌柜，好自为之。`
    : `道光${startYear - 1800 + 8}年春，本号正式挂牌营业。愿以信义为本，汇通天下。`;

  const initialState: GameState = {
    date: { ...START_DATE },
    resources: {
      silver: { ...silver, totalSilver: computeTotalSilver(silver), externalDeposits: Math.round(computeTotalSilver(silver) * INITIAL_EXTERNAL_DEPOSIT_RATIO) },
      reputation: isHard ? HARD_INITIAL_REPUTATION : INITIAL_REPUTATION,
      connections: isHard ? { ...HARD_INITIAL_CONNECTIONS } : { ...INITIAL_CONNECTIONS },
    },
    branches,
    staff: JSON.parse(JSON.stringify(INITIAL_STAFF)),
    pricing: { ...INITIAL_PRICING },
    cipher: createInitialCipher(),
    eventQueue: [],
    triggeredEventIds: [],
    lastBanquetSeason: 0,
    ownerBailoutUsed: false,
    unlockedAchievements: [],
    annualDirective: null,
    morningBriefs: [],
    pendingDecisions: [],
    annualLedger: null,
    logs: [openingLog],
    phase: 'morning',
    endingType: null,
    difficulty,
  };

  return initialState;
}

/** 计算总银两（各库 + 在途） */
function computeTotalSilver(silver: { headquarters: number; hankou: number; zhangjiakou: number; inTransit: number }): number {
  return silver.headquarters + silver.hankou + silver.zhangjiakou + silver.inTransit;
}

/** 刷新 totalSilver 计算值（纯函数，返回新对象） */
export function refreshTotalSilver(state: GameState): GameState {
  return {
    ...state,
    resources: {
      ...state.resources,
      silver: {
        ...state.resources.silver,
        totalSilver: computeTotalSilver(state.resources.silver),
      },
    },
  };
}

/** 创建初始密押状态 */
function createInitialCipher(): CipherState {
  return {
    current: 'basic',
    monthsUsed: 0,
  };
}

// ---- 存档 / 读档 ----

const SAVE_KEY_PREFIX = 'jinxin_save_';

function getKey(username: string): string {
  return `${SAVE_KEY_PREFIX}${username}`;
}

/** 当前存档目标用户（由 GameProvider 设置） */
let currentUser: string | null = null;

/** 设置当前用户（GameProvider 调用） */
export function setCurrentUser(username: string): void {
  currentUser = username;
}

/** 清除当前用户 */
export function clearCurrentUser(): void {
  currentUser = null;
}

function requireKey(): string {
  if (!currentUser) throw new Error('存档操作需要先设置当前用户');
  return getKey(currentUser);
}

/**
 * 保存游戏到 localStorage
 * @returns 是否保存成功
 */
export function saveGame(state: GameState): boolean {
  try {
    const key = requireKey();
    // IOA安全体系：使用签名存档（防篡改）
    const secureSave = createSecureSave(state);
    const saveData: SaveData & { secureVersion: boolean } = {
      state,
      savedAt: new Date().toISOString(),
      version: SAVE_VERSION,
      secureVersion: true,
    };
    // 保存签名到 localStorage（独立key，检测篡改）
    localStorage.setItem(key + '_sig', secureSave.signature);
    const json = JSON.stringify(saveData);
    localStorage.setItem(key, json);
    return true;
  } catch (e) {
    console.error('❌ 存档失败：', e, '(currentUser=', currentUser, ')');
    return false;
  }
}

/**
 * 从 localStorage 加载游戏
 * @returns GameState | null（没有存档或存档无效返回 null）
 */
export function loadGame(): GameState | null {
  try {
    const key = requireKey();
    const json = localStorage.getItem(key);
    if (!json) {

      return null;
    }

    const saveData = JSON.parse(json) as SaveData & { secureVersion?: boolean };

    // 版本校验
    if (saveData.version !== SAVE_VERSION) {
      console.warn(`存档版本不匹配：${saveData.version} ≠ ${SAVE_VERSION}`);
      return null;
    }

    const state = saveData.state;
    if (!state || !state.date || !state.resources || !state.branches) {
      console.warn('存档数据格式异常');
      return null;
    }

    // IOA安全体系：验证存档签名（防篡改）
    if (saveData.secureVersion) {
      const savedSignature = localStorage.getItem(key + '_sig');
      if (savedSignature) {
        const verification = loadSecureSave({
          state, signature: savedSignature, timestamp: 0,
          version: SAVE_VERSION, checksum: '',
        });
        if (!verification.success) {
          console.warn('[IOA Security] 存档校验失败:', verification.error);
        }
      }
    }

    // 向后兼容：旧存档可能没有 triggeredEventIds 字段
    if (!state.triggeredEventIds) {
      (state as GameState).triggeredEventIds = [];
    }
    return state;
  } catch (e) {
    console.error('❌ 读档失败：', e);
    return null;
  }
}

/**
 * 删除存档
 */
export function deleteSave(): void {
  try {
    const key = requireKey();
    localStorage.removeItem(key);
  } catch (e) {
    console.error('删除存档失败：', e);
  }
}

/**
 * 检查是否有存档
 */
export function hasSave(): boolean {
  try {
    if (!currentUser) return false;
    return localStorage.getItem(getKey(currentUser)) !== null;
  } catch {
    return false;
  }
}

/**
 * 获取存档时间（用于显示）
 */
export function getSaveTime(): string | null {
  try {
    if (!currentUser) return null;
    const json = localStorage.getItem(getKey(currentUser));
    if (!json) return null;
    const saveData: SaveData = JSON.parse(json);
    return saveData.savedAt;
  } catch {
    return null;
  }
}

/**
 * 根据当前游戏状态判定结局类型
 * 用于手动结束游戏时的即时结算
 */
export function determineEnding(state: GameState): GameOverType {
  const { reputation, silver } = state.resources;
  const { year } = state.date;

  // 失败先判
  if (reputation <= 0) return 'disgraced';
  if (silver.totalSilver <= 0) return 'bankrupt';

  // 胜利
  if (silver.totalSilver >= 1_200_000 && year >= 1815) return 'golden_age';
  if (year >= 1813) return 'steady_hand';

  // 手动结束：功成身退
  return 'early_exit';
}
