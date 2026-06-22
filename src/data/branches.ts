// ============================================================
// 分号网络初始数据 —— 《晋·信》
// ============================================================

import type { Branch, BranchId } from '../types';
import { INITIAL_SILVER } from './constants';

/**
 * 平遥总号（非分号，但作为调拨源头）
 * 总号不在 branches Record 中，由 GameState.resources.silver.headquarters 管理
 */

/** 汉口分号 —— 一等分号，长江中游商业重镇 */
export const HANKOU_BRANCH: Branch = {
  id: 'hankou',
  name: '汉口分号',
  tier: 1,
  silver: INITIAL_SILVER.hankou,
  managerAbility: 72,
  managerLoyalty: 65,
  businessVolume: 0,
  status: 'normal',
};

/** 张家口分号 —— 二等分号，口外蒙古/俄罗斯贸易咽喉 */
export const ZHANGJIAKOU_BRANCH: Branch = {
  id: 'zhangjiakou',
  name: '张家口分号',
  tier: 2,
  silver: INITIAL_SILVER.zhangjiakou,
  managerAbility: 58,
  managerLoyalty: 80,
  businessVolume: 0,
  status: 'normal',
};

/** 所有分号的初始数据 */
export const INITIAL_BRANCHES: Record<BranchId, Branch> = {
  hankou: { ...HANKOU_BRANCH },
  zhangjiakou: { ...ZHANGJIAKOU_BRANCH },
};

/** 分号名称映射 */
export const BRANCH_NAMES: Record<BranchId, string> = {
  hankou: '汉口分号',
  zhangjiakou: '张家口分号',
};

/** 分号所在地描述 */
export const BRANCH_LOCATIONS: Record<BranchId, { province: string; description: string }> = {
  hankou: {
    province: '湖北',
    description: '九省通衢，长江与汉水交汇处，商贾云集的华中重镇。茶、布、盐、粮在此集散，素有"货到汉口活"之说。',
  },
  zhangjiakou: {
    province: '直隶',
    description: '长城隘口，通往蒙古与俄罗斯的茶马古道起点。皮毛、茶叶、丝绸在此交易，口外商路凶险但利厚。',
  },
};
