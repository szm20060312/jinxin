// ============================================================
// 伙友初始数据 —— 《晋·信》
// ============================================================

import type { Staff } from '../types';

// ---- 天赋词库 ----
const TALENTS = {
  math: '铁算盘',       // 精于计算，汇兑差错率低
  social: '八面玲珑',   // 善于交际，跑街业务量大
  loyal: '忠义可托',    // 忠诚度衰减慢
  learner: '敏而好学',  // 能力成长快
  steady: '稳如泰山',   // 面对危机不慌乱
  careful: '心细如发',  // 查账能力强
} as const;

// ---- 初始伙友 ----

/** 学徒 */
const APPRENTICES: Staff[] = [
  {
    id: 1,
    name: '王有财',
    role: 'apprentice',
    monthsTrained: 12,
    talent: 75,
    loyalty: 70,
    ability: 42,
    talentBonus: TALENTS.math,
    stationedAt: 'headquarters',
  },
  {
    id: 2,
    name: '李二牛',
    role: 'apprentice',
    monthsTrained: 12,
    talent: 55,
    loyalty: 85,
    ability: 28,
    talentBonus: TALENTS.loyal,
    stationedAt: 'headquarters',
  },
  {
    id: 3,
    name: '赵小满',
    role: 'apprentice',
    monthsTrained: 12,
    talent: 68,
    loyalty: 60,
    ability: 35,
    talentBonus: TALENTS.learner,
    stationedAt: 'hankou',
  },
];

/** 账房/跑街（伙友） */
const CLERKS: Staff[] = [
  {
    id: 10,
    name: '陈守义',
    role: 'clerk',
    monthsTrained: 60,
    talent: 80,
    loyalty: 75,
    ability: 78,
    talentBonus: TALENTS.steady,
    stationedAt: 'headquarters',
  },
  {
    id: 11,
    name: '刘万全',
    role: 'clerk',
    monthsTrained: 48,
    talent: 72,
    loyalty: 68,
    ability: 70,
    talentBonus: TALENTS.math,
    stationedAt: 'headquarters',
  },
  {
    id: 12,
    name: '张大川',
    role: 'clerk',
    monthsTrained: 36,
    talent: 65,
    loyalty: 60,
    ability: 62,
    talentBonus: TALENTS.social,
    stationedAt: 'hankou',
  },
  {
    id: 13,
    name: '周四海',
    role: 'clerk',
    monthsTrained: 42,
    talent: 58,
    loyalty: 82,
    ability: 55,
    talentBonus: TALENTS.careful,
    stationedAt: 'zhangjiakou',
  },
  {
    id: 14,
    name: '马千里',
    role: 'clerk',
    monthsTrained: 30,
    talent: 70,
    loyalty: 55,
    ability: 65,
    talentBonus: TALENTS.social,
    stationedAt: 'zhangjiakou',
  },
];

/** 所有初始伙友 */
export const INITIAL_STAFF: Staff[] = [...APPRENTICES, ...CLERKS];

// ---- 角色池（预埋数据，供后续招聘系统使用） ----

/** 可招聘角色池 */
export const RECRUITABLE_POOL: Staff[] = [
  // ── 前期可聘（id 100-104，条件 year >= 1810）──
  {
    id: 100,
    name: '孙仁厚',
    role: 'clerk',
    monthsTrained: 60,
    talent: 78,
    loyalty: 88,
    ability: 72,
    talentBonus: TALENTS.loyal,
    stationedAt: null, // 尚未入驻
  },
  {
    id: 101,
    name: '朱文彬',
    role: 'clerk',
    monthsTrained: 24,
    talent: 74,
    loyalty: 60,
    ability: 68,
    talentBonus: TALENTS.math,
    stationedAt: null,
  },
  {
    id: 102,
    name: '胡明达',
    role: 'apprentice',
    monthsTrained: 0,
    talent: 82,
    loyalty: 55,
    ability: 22,
    talentBonus: TALENTS.social,
    stationedAt: null,
  },
  {
    id: 103,
    name: '郑思齐',
    role: 'apprentice',
    monthsTrained: 0,
    talent: 75,
    loyalty: 65,
    ability: 18,
    talentBonus: TALENTS.careful,
    stationedAt: null,
  },
  {
    id: 104,
    name: '梁志远',
    role: 'clerk',
    monthsTrained: 48,
    talent: 65,
    loyalty: 70,
    ability: 60,
    talentBonus: TALENTS.steady,
    stationedAt: null,
  },
  // ── 中后期可聘（id 105-109，条件 year >= 1820）──
  {
    id: 105,
    name: '郭景行',
    role: 'clerk',
    monthsTrained: 72,
    talent: 88,
    loyalty: 65,
    ability: 85,
    talentBonus: TALENTS.steady,
    stationedAt: null,
  },
  {
    id: 106,
    name: '林致远',
    role: 'clerk',
    monthsTrained: 12,
    talent: 70,
    loyalty: 75,
    ability: 55,
    talentBonus: TALENTS.learner,
    stationedAt: null,
  },
  {
    id: 107,
    name: '罗英杰',
    role: 'clerk',
    monthsTrained: 96,
    talent: 82,
    loyalty: 50,
    ability: 80,
    talentBonus: TALENTS.careful,
    stationedAt: null,
  },
  {
    id: 108,
    name: '宋承志',
    role: 'clerk',
    monthsTrained: 84,
    talent: 62,
    loyalty: 95,
    ability: 60,
    talentBonus: TALENTS.loyal,
    stationedAt: null,
  },
  {
    id: 109,
    name: '何秉忠',
    role: 'apprentice',
    monthsTrained: 0,
    talent: 90,
    loyalty: 30,
    ability: 30,
    talentBonus: TALENTS.math,
    stationedAt: null,
  },
];

/** 初始学徒数量 */
export const INITIAL_APPRENTICE_COUNT = APPRENTICES.length;

/** 初始伙友数量 */
export const INITIAL_CLERK_COUNT = CLERKS.length;

// ---- 伙友生成器 ----

/** 姓氏库 */
const SURNAMES = [
  '王', '李', '张', '刘', '陈', '赵', '周', '马', '孙', '朱',
  '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '宋', '唐',
];

/** 名字字库（晋商常用） */
const GIVEN_NAMES = [
  '有财', '守信', '义德', '天成', '万全', '四海', '大川', '小满',
  '志远', '景行', '明达', '守义', '仁厚', '思齐', '英杰', '文彬',
  '耀祖', '承志', '致远', '秉忠',
];

/** 天赋列表（随机分配用） */
const TALENT_POOL = Object.values(TALENTS);

/** 生成一个随机学徒 */
export function generateApprentice(id: number, station: Staff['stationedAt']): Staff {
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const given = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];

  return {
    id,
    name: `${surname}${given}`,
    role: 'apprentice',
    monthsTrained: 0,
    talent: 30 + Math.floor(Math.random() * 50),  // 30~80
    loyalty: 40 + Math.floor(Math.random() * 40),  // 40~80
    ability: 10 + Math.floor(Math.random() * 20),  // 10~30
    talentBonus: TALENT_POOL[Math.floor(Math.random() * TALENT_POOL.length)],
    stationedAt: station,
  };
}
